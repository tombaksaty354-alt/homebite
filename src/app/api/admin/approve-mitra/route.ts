import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - Approve mitra application (transactional: create user + update status)
export async function POST(request: Request) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { 
      applicationId,
      email, 
      password, 
      nama, 
      telepon, 
      kota,
      catatan_admin 
    } = body;

    // Validate required fields
    if (!applicationId || !email || !password || !nama) {
      return NextResponse.json(
        { success: false, error: 'ID aplikasi, email, password, dan nama wajib diisi' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Validate password length (minimum 8 characters)
    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password minimal 8 karakter' },
        { status: 400 }
      );
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Service key tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Create User in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { success: false, error: 'Gagal membuat akun' },
        { status: 500 }
      );
    }

    if (!authData?.user) {
      return NextResponse.json(
        { success: false, error: 'Gagal membuat user' },
        { status: 500 }
      );
    }

    // STEP 2: Insert into users table (with rollback on failure)
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        nama,
        role: 'mitra',
        tier: 'silver',
        status: 'active',
        telepon,
        kota,
      });

    if (dbError) {
      console.error('Error inserting user to database:', dbError);
      // TRANSACTIONAL ROLLBACK: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan data user' },
        { status: 500 }
      );
    }

    // STEP 3: Update application status (with rollback on failure)
    let appError;
    
    // Try full update first
    const { error: fullUpdateError } = await supabase
      .from('calon_mitra_applications')
      .update({ 
        status: 'diterima', 
        catatan_admin: catatan_admin || 'Disetujui Admin',
        updated_at: new Date().toISOString() 
      })
      .eq('id', applicationId);

    if (fullUpdateError) {
      console.warn('Full update failed, trying status-only:', fullUpdateError.message);
      // Fallback: update only status column
      const { error: statusOnlyError } = await supabase
        .from('calon_mitra_applications')
        .update({ status: 'diterima' })
        .eq('id', applicationId);
      
      appError = statusOnlyError;
    }

    if (appError) {
      console.error('Error updating application status:', appError);
      // TRANSACTIONAL ROLLBACK: delete user and auth
      await supabase.from('users').delete().eq('id', authData.user.id);
      await supabase.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { success: false, error: 'Gagal mengupdate status aplikasi: ' + appError.message },
        { status: 500 }
      );
    }

    // SUCCESS: All steps completed atomically
    return NextResponse.json({ 
      success: true,
      message: 'Mitra berhasil disetujui dan dibuatkan akun',
      userId: authData.user.id
    });

  } catch (error: any) {
    console.error('Approve mitra error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menyetujui mitra' },
      { status: 500 }
    );
  }
}

// DELETE - Reject mitra application (simpler, no user creation)
export async function DELETE(request: Request) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { applicationId, catatan_admin } = body;

    // Validate required fields
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: 'ID aplikasi diperlukan' },
        { status: 400 }
      );
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Service key tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update application status to rejected
    const { error } = await supabase
      .from('calon_mitra_applications')
      .update({ 
        status: 'ditolak', 
        catatan_admin: catatan_admin || 'Ditolak Admin',
        updated_at: new Date().toISOString() 
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Error rejecting application:', error);
      return NextResponse.json(
        { success: false, error: 'Gagal menolak aplikasi' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Aplikasi mitra berhasil ditolak'
    });

  } catch (error: any) {
    console.error('Reject application error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menolak aplikasi' },
      { status: 500 }
    );
  }
}
