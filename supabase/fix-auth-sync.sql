-- =========================================================================
-- SOLUSI ERROR 400 SAAT LOGIN / SYNC USER AUTH KE PUBLIC.USERS
-- =========================================================================
-- Jalankan file SQL ini di SQL Editor Supabase Dashboard Anda.
-- =========================================================================

-- 1. Buat function untuk otomatis sync data dari auth.users ke public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nama, role, status, tier)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nama', 'User Baru'),
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    CASE 
      WHEN COALESCE(new.raw_user_meta_data->>'role', 'customer') = 'mitra' THEN 'pending' 
      ELSE 'active' 
    END,
    'silver'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nama = COALESCE(public.users.nama, EXCLUDED.nama);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Buat trigger yang aktif setiap ada user baru di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- CATATAN TAMBAHAN:
-- =========================================================================
-- Jika Anda memasukkan user manual di tabel `public.users`, Anda tetap TIDAK
-- akan bisa login sebelum user tersebut didaftarkan di Supabase Auth.
--
-- Untuk membuat akun testing secara aman:
-- 1. Buka Supabase Dashboard -> Authentication -> Users -> Add User.
-- 2. Buat email & password untuk akun baru.
-- 3. Trigger di atas akan otomatis membuat profile-nya di tabel `public.users`.
-- =========================================================================
