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
    const cleanEmail = email.trim().toLowerCase();
    const status = role === 'mitra' ? 'pending' : 'active';

    console.log(`[DEBUG_AUTH] Memproses email: ${cleanEmail}, role: ${role}`);

    // 1. Cek apakah user sudah ada di auth.users (lewat listUsers)
    const { data: authUsersList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('[DEBUG_AUTH] Gagal list users:', listError);
      return NextResponse.json({ success: false, error: 'Gagal mengecek list user auth: ' + listError.message }, { status: 500 });
    }

    const existingAuthUser = authUsersList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    let userId: string;

    if (existingAuthUser) {
      console.log(`[DEBUG_AUTH] User ditemukan di auth.users. ID: ${existingAuthUser.id}. Mengupdate password...`);
      userId = existingAuthUser.id;

      // Update password & confirm email jika sudah ada di auth
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
        password: password,
        email_confirm: true,
        user_metadata: { nama, role }
      });

      if (updateAuthError) {
        console.error('[DEBUG_AUTH] Gagal update auth user:', updateAuthError);
        return NextResponse.json({ success: false, error: 'Gagal update password: ' + updateAuthError.message }, { status: 400 });
      }
    } else {
      console.log(`[DEBUG_AUTH] User tidak ditemukan di auth.users. Membuat baru...`);
      // Buat baru di auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: { nama, role }
      });

      if (authError) {
        console.error('[DEBUG_AUTH] Gagal membuat auth user:', authError);
        return NextResponse.json({ success: false, error: 'Gagal membuat user auth: ' + authError.message }, { status: 400 });
      }

      userId = authData.user!.id;
    }

    // 2. Cek apakah email sudah ada di tabel public.users
    const { data: existingDbUser, error: dbCheckError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingDbUser) {
      console.log(`[DEBUG_AUTH] Email ${cleanEmail} sudah ada di public.users dengan ID: ${existingDbUser.id}. Mensinkronkan ID...`);
      
      // Update ID & data profil yang ada agar cocok dengan auth
      const { error: updateDbError } = await supabase
        .from('users')
        .update({
          id: userId, // Set ke ID auth baru
          nama: nama,
          role: role,
          status: status
        })
        .eq('email', cleanEmail);

      if (updateDbError) {
        console.warn('[DEBUG_AUTH] Gagal update ID via UPDATE, mencoba hapus-insert...', updateDbError.message);
        
        // Jika gagal update ID (misal terikat FK), kita hapus lalu insert baru
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('email', cleanEmail);

        if (deleteError) {
          console.error('[DEBUG_AUTH] Gagal menghapus user lama:', deleteError);
          return NextResponse.json({ success: false, error: 'Gagal sinkronisasi data tabel users: ' + deleteError.message }, { status: 500 });
        }

        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: cleanEmail,
            nama: nama,
            role: role,
            status: status,
            tier: 'silver'
          });

        if (insertError) {
          console.error('[DEBUG_AUTH] Gagal insert setelah delete:', insertError);
          return NextResponse.json({ success: false, error: 'Gagal memasukkan data profile baru: ' + insertError.message }, { status: 500 });
        }
      }
    } else {
      console.log(`[DEBUG_AUTH] Email ${cleanEmail} belum ada di public.users. Membuat baru...`);
      // Masukkan profil baru
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: cleanEmail,
          nama: nama,
          role: role,
          status: status,
          tier: 'silver'
        });

      if (insertError) {
        console.error('[DEBUG_AUTH] Gagal insert profile baru:', insertError);
        return NextResponse.json({ success: false, error: 'Gagal membuat profil database: ' + insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${cleanEmail} berhasil dibuat/diperbarui dan dikonfirmasi!`,
      data: {
        id: userId,
        email: cleanEmail,
        nama,
        role,
        status
      }
    });

  } catch (error: any) {
    console.error('[DEBUG_AUTH] Unexpected exception:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
