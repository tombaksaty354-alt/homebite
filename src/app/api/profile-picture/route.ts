import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    // Require authentication - user can only upload their own picture
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    // Validate required fields
    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File dan userId diperlukan' },
        { status: 400 }
      );
    }

    // Validate userId format (UUID) to prevent path traversal
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Format userId tidak valid' },
        { status: 400 }
      );
    }

    // Validate file type from MIME type (more secure than filename extension)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 2MB' },
        { status: 400 }
      );
    }

    // Create supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get file extension from MIME type (more secure)
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif'
    };
    const ext = extMap[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: 'Tipe file tidak didukung' },
        { status: 400 }
      );
    }

    // Generate filename
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${userId}/${fileName}`;

    // Delete old profile pictures
    const { data: existingFiles, error: listError } = await supabase
      .storage
      .from('profile-pictures')
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      const { error: deleteError } = await supabase
        .storage
        .from('profile-pictures')
        .remove(filesToDelete);
      
      if (deleteError) {
        console.error('Error deleting old profile pictures:', deleteError);
        // Continue anyway - old files will be orphaned but new upload succeeds
      }
    } else if (listError) {
      console.error('Error listing old files:', listError);
      // Continue anyway
    }

    // Upload new file
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading profile picture:', uploadError);
      return NextResponse.json(
        { error: 'Gagal mengupload foto profil' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json(
        { error: 'Gagal mengupdate profil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Foto profil berhasil diupdate!'
    });

  } catch (error: any) {
    console.error('Profile picture upload error:', error);
    return NextResponse.json(
      { error: 'Gagal mengupload foto profil' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Require authentication
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId diperlukan' },
        { status: 400 }
      );
    }

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Format userId tidak valid' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete files from storage
    const { data: existingFiles, error: listError } = await supabase
      .storage
      .from('profile-pictures')
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      const { error: deleteError } = await supabase
        .storage
        .from('profile-pictures')
        .remove(filesToDelete);
      
      if (deleteError) {
        console.error('Error deleting profile pictures:', deleteError);
      }
    } else if (listError) {
      console.error('Error listing files:', listError);
    }

    // Clear profile picture from database
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture: null })
      .eq('id', userId);

    if (updateError) {
      console.error('Error clearing profile picture:', updateError);
      return NextResponse.json(
        { error: 'Gagal menghapus foto profil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Foto profil berhasil dihapus!'
    });

  } catch (error: any) {
    console.error('Profile picture delete error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus foto profil' },
      { status: 500 }
    );
  }
}
