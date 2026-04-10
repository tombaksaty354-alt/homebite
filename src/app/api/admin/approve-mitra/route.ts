import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - Create mitra user (admin only)
export async function POST(request: Request) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { email, password, nama, telepon, kota } = body;

    // Validate required fields
    if (!email || !password || !nama) {
      return NextResponse.json(
        { success: false, error: 'Email, password, dan nama wajib diisi' },
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

    // 1. Create User in Auth
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

    // 2. Insert into users table
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
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan data user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Approve mitra error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menyetujui mitra' },
      { status: 500 }
    );
  }
}

// PUT - Update application status (admin only)
export async function PUT(request: Request) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { applicationId, status, catatan_admin } = body;

    // Validate required fields
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: 'ID aplikasi diperlukan' },
        { status: 400 }
      );
    }

    // Validate status
    const allowedStatuses = ['diterima', 'ditolak', 'pending'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status tidak valid' },
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

    const { error } = await supabase
      .from('calon_mitra_applications')
      .update({ status, catatan_admin, updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengupdate status aplikasi' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update application error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengupdate status' },
      { status: 500 }
    );
  }
}
