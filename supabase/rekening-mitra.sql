-- ============================================
-- TABEL REKENING MITRA
-- ============================================
-- Memungkinkan mitra memiliki multiple rekening
-- ============================================

-- Create table
CREATE TABLE IF NOT EXISTS rekening_mitra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  bank VARCHAR(100) NOT NULL,
  nomor VARCHAR(100) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_rekening_mitra_user_id ON rekening_mitra(user_id);
CREATE INDEX IF NOT EXISTS idx_rekening_mitra_is_primary ON rekening_mitra(is_primary);

-- RLS Policies
ALTER TABLE rekening_mitra ENABLE ROW LEVEL SECURITY;

-- Policy: Mitra bisa melihat rekening mereka sendiri
CREATE POLICY "Mitra dapat melihat rekening sendiri"
  ON rekening_mitra
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Mitra bisa insert rekening mereka sendiri
CREATE POLICY "Mitra dapat menambah rekening sendiri"
  ON rekening_mitra
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Mitra bisa update rekening mereka sendiri
CREATE POLICY "Mitra dapat mengupdate rekening sendiri"
  ON rekening_mitra
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Mitra bisa delete rekening mereka sendiri
CREATE POLICY "Mitra dapat menghapus rekening sendiri"
  ON rekening_mitra
  FOR DELETE
  USING (user_id = auth.uid());

-- Policy: Admin bisa melihat semua rekening
CREATE POLICY "Admin dapat melihat semua rekening"
  ON rekening_mitra
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Customer bisa melihat rekening mitra (untuk pembayaran)
CREATE POLICY "Customer dapat melihat rekening mitra"
  ON rekening_mitra
  FOR SELECT
  USING (true);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_rekening_mitra_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rekening_mitra_updated_at
  BEFORE UPDATE ON rekening_mitra
  FOR EACH ROW
  EXECUTE FUNCTION update_rekening_mitra_updated_at();

-- Function untuk memastikan hanya ada 1 primary per user
CREATE OR REPLACE FUNCTION enforce_single_primary()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika setting primary, unset yang lain
  IF NEW.is_primary = true THEN
    UPDATE rekening_mitra
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  
  -- Pastikan minimal ada 1 primary
  IF NOT EXISTS (
    SELECT 1 FROM rekening_mitra 
    WHERE user_id = NEW.user_id 
    AND is_primary = true
  ) THEN
    NEW.is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_primary
  BEFORE INSERT OR UPDATE ON rekening_mitra
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_primary();

-- Migrate existing data dari users table
-- (Jika ada mitra yang sudah punya rekening di tabel users)
INSERT INTO rekening_mitra (user_id, bank, nomor, nama, is_primary)
SELECT 
  id as user_id,
  rekening_bank as bank,
  rekening_nomor as nomor,
  rekening_nama as nama,
  true as is_primary
FROM users
WHERE role = 'mitra'
  AND rekening_bank IS NOT NULL
  AND rekening_bank != ''
ON CONFLICT DO NOTHING;

COMMENT ON TABLE rekening_mitra IS 'Tabel untuk menyimpan multiple rekening bank/e-wallet mitra';
