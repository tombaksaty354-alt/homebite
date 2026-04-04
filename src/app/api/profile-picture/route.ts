import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF' 
      }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Ukuran file terlalu besar. Maksimal 2MB' 
      }, { status: 400 });
    }

    // Create supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate filename
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${userId}/${fileName}`;

    // Delete old profile pictures
    const { data: existingFiles } = await supabase
      .storage
      .from('profile-pictures')
      .list(userId);

    if (existingFiles) {
      for (const oldFile of existingFiles) {
        await supabase.storage
          .from('profile-pictures')
          .remove([`${userId}/${oldFile.name}`]);
      }
    }

    // Upload new file
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

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

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      message: 'Profile picture berhasil diupdate!'
    });

  } catch (error: any) {
    console.error('Profile picture upload error:', error);
    return NextResponse.json({ 
      error: error.message || 'Gagal upload profile picture' 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete files from storage
    const { data: existingFiles } = await supabase
      .storage
      .from('profile-pictures')
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage
        .from('profile-pictures')
        .remove(filesToDelete);
    }

    // Clear profile picture from database
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture: null })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true,
      message: 'Profile picture berhasil dihapus!'
    });

  } catch (error: any) {
    console.error('Profile picture delete error:', error);
    return NextResponse.json({ 
      error: error.message || 'Gagal hapus profile picture' 
    }, { status: 500 });
  }
}
