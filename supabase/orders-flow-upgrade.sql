-- ============================================
-- REDESAIN ALUR PEMESANAN: DATABASE UPGRADE
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tambah kolom baru ke tabel orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS jasa_website INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ongkir_set_by UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ongkir_set_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS screenshot_ojol TEXT;

-- 2. Buat storage bucket untuk screenshot ojol
INSERT INTO storage.buckets (id, name, public)
VALUES ('ojol-screenshots', 'ojol-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Kebijakan RLS untuk ojol-screenshots
DROP POLICY IF EXISTS "Anyone can view ojol screenshots" ON storage.objects;
CREATE POLICY "Anyone can view ojol screenshots"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'ojol-screenshots');

DROP POLICY IF EXISTS "Mitra can upload ojol screenshots" ON storage.objects;
CREATE POLICY "Mitra can upload ojol screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ojol-screenshots'
  );

DROP POLICY IF EXISTS "Mitra can delete own ojol screenshots" ON storage.objects;
CREATE POLICY "Mitra can delete own ojol screenshots"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ojol-screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
