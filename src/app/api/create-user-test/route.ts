import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    const role = searchParams.get('role') || 'customer'; // customer, mitra, admin
    const nama = searchParams.get('nama') || 'User Test';

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parameter email dan password wajib diisi!',
          format: '/api/create-user-test?email=user@test.com&password=password123&role=customer&nama=Budi'
        },
        { status: 400 }
      );
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Creating user: ${email} with role: ${role}`);

    // 1. Buat user di Auth (otomatis email_confirm: true agar langsung aktif)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nama, role }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;

    // 2. Tambah profil ke tabel public.users
    const status = role === 'mitra' ? 'pending' : 'active';
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        nama,
        role,
        status,
        tier: 'silver'
      });

    if (dbError) {
      console.error('DB insertion error:', dbError);
      // Hapus auth user jika database gagal disinkronkan
      if (userId) {
        await supabase.auth.admin.deleteUser(userId);
      }
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `User berhasil dibuat dan dikonfirmasi!`,
      data: {
        id: userId,
        email,
        nama,
        role,
        status
      }
    });

  } catch (error: any) {
    console.error('Unexpected exception:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
