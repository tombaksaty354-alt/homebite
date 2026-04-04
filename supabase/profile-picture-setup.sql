-- ============================================
-- FITUR PROFILE PICTURE
-- ============================================

-- 1. Tambah kolom profile_picture di tabel users
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- 2. Buat storage bucket untuk profile pictures
-- (This needs to be done in Supabase Dashboard UI, but we can set up policies)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- User bisa upload profile picture mereka sendiri
CREATE POLICY "Users can upload own profile picture"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- User bisa update profile picture mereka sendiri
CREATE POLICY "Users can update own profile picture"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- User bisa delete profile picture mereka sendiri
CREATE POLICY "Users can delete own profile picture"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- User bisa melihat semua profile picture (public)
CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-pictures');

-- 4. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture);

COMMENT ON COLUMN users.profile_picture IS 'URL profile picture user di storage';
