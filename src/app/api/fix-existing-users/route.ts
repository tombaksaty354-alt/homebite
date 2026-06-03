import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    // User bisa set custom password lewat query param, default 'password123'
    const newPassword = searchParams.get('password') || 'password123';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[DEBUG_AUTH] Memulai perbaikan massal user...');

    // 1. Ambil semua user dari auth.users
    const { data: authUsersList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('[DEBUG_AUTH] Gagal mengambil list user auth:', listError);
      return NextResponse.json({ success: false, error: 'Gagal mengambil list user: ' + listError.message }, { status: 500 });
    }

    const users = authUsersList?.users || [];
    const results = [];

    // 2. Loop & perbaiki setiap user
    for (const user of users) {
      const email = user.email || '';
      
      // Abaikan email example@gmail.com jika diminta
      if (email.toLowerCase() === 'example@gmail.com') {
        results.push({ email, status: 'diabaikan (sesuai request)' });
        continue;
      }

      try {
        // Tentukan role & nama default berdasarkan email
        let role = 'customer';
        let nama = email.split('@')[0]; // Ambil bagian depan email sebagai nama
        
        if (email.includes('mitra') || email.includes('rujak')) {
          role = 'mitra';
        } else if (email.includes('admin')) {
          role = 'admin';
        }

        const isMitra = role === 'mitra';
        const userStatus = isMitra ? 'active' : 'active'; // Buat active agar bisa langsung dipakai login

        // A. Update user auth (set password & konfirmasi email)
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user.id, {
          password: newPassword,
          email_confirm: true,
          user_metadata: { nama, role }
        });

        if (authUpdateError) {
          results.push({ email, status: 'gagal update auth: ' + authUpdateError.message });
          continue;
        }

        // B. Cek & sinkronkan di tabel public.users
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (dbUser) {
          // Update data profil & sinkronkan ID jika berbeda
          const { error: dbUpdateError } = await supabase
            .from('users')
            .update({
              id: user.id,
              nama: dbUser.id !== user.id ? nama : undefined, // Update nama jika ID berbeda
              role: role,
              status: userStatus
            })
            .eq('email', email);

          if (dbUpdateError) {
            // Jika gagal update ID (misal karena constraint FK), coba hapus lalu insert
            await supabase.from('users').delete().eq('email', email);
            await supabase.from('users').insert({
              id: user.id,
              email: email,
              nama: nama,
              role: role,
              status: userStatus,
              tier: 'silver'
            });
          }
          results.push({ email, status: 'berhasil diperbaiki & disinkronkan' });
        } else {
          // Buat data profil baru di public.users
          const { error: dbInsertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: email,
              nama: nama,
              role: role,
              status: userStatus,
              tier: 'silver'
            });

          if (dbInsertError) {
            results.push({ email, status: 'gagal membuat profil database: ' + dbInsertError.message });
          } else {
            results.push({ email, status: 'berhasil diperbaiki & profil baru dibuat' });
          }
        }

      } catch (userErr: any) {
        results.push({ email, status: 'error: ' + userErr.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Proses perbaikan user selesai. Password semua akun aktif diset ke: "${newPassword}"`,
      results
    });

  } catch (error: any) {
    console.error('[DEBUG_AUTH] Unexpected exception:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
