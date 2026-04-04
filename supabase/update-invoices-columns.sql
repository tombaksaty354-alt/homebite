-- ============================================
-- UPDATE TABEL INVOICES - TAMBAH KOLOM BARU
-- ============================================

-- Tambah kolom yang belum ada
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS catatan_admin TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dibayar_pada TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS diverifikasi_oleh UUID REFERENCES users(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop policies lama (jika ada)
DROP POLICY IF EXISTS "Mitra manage own invoices" ON invoices;
DROP POLICY IF EXISTS "Mitra view own invoices" ON invoices;
DROP POLICY IF EXISTS "Mitra update own invoices" ON invoices;
DROP POLICY IF EXISTS "Admin view all invoices" ON invoices;
DROP POLICY IF EXISTS "Admin update invoices" ON invoices;

-- Buat policies baru
-- Mitra bisa lihat invoice mereka sendiri
CREATE POLICY "Mitra view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = mitra_id);

-- Mitra bisa upload bukti bayar
CREATE POLICY "Mitra update own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = mitra_id)
  WITH CHECK (auth.uid() = mitra_id);

-- Admin bisa lihat semua invoice
CREATE POLICY "Admin view all invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admin bisa update status verifikasi
CREATE POLICY "Admin update invoices"
  ON invoices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;
