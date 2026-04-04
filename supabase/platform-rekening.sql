-- ============================================
-- PLATFORM REKENING TABLE
-- ============================================
-- Rekening tujuan customer saat transfer ke Escrow
-- ============================================

-- Create platform_rekening table
CREATE TABLE IF NOT EXISTS platform_rekening (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank VARCHAR(100) NOT NULL,
  nomor VARCHAR(100) NOT NULL,
  atas_nama VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_platform_rekening_active ON platform_rekening(is_active) WHERE is_active = true;

-- RLS for platform_rekening
ALTER TABLE platform_rekening ENABLE ROW LEVEL SECURITY;

-- Anyone can view active rekening (for checkout page)
CREATE POLICY "Anyone can view active rekening"
  ON platform_rekening FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admin can manage rekening
CREATE POLICY "Admin can manage rekening"
  ON platform_rekening FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_platform_rekening_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_platform_rekening_timestamp ON platform_rekening;
CREATE TRIGGER update_platform_rekening_timestamp
  BEFORE UPDATE ON platform_rekening
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_rekening_timestamp();

-- Insert default rekening (contoh - ganti dengan rekening asli platform)
INSERT INTO platform_rekening (bank, nomor, atas_nama, is_active) VALUES
  ('BCA', '1234567890', 'PT Homebite Indonesia', true),
  ('Mandiri', '0987654321', 'PT Homebite Indonesia', true)
ON CONFLICT DO NOTHING;

-- Verify table
SELECT 'Table platform_rekening' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_name = 'platform_rekening';

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan buat tabel platform_rekening
-- 3. Tambah 2 rekening contoh (ganti dengan rekening asli)
-- 4. Admin bisa kelola via /admin/platform-rekening
-- 5. Customer akan lihat rekening ini saat checkout
-- ============================================
