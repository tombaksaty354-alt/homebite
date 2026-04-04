-- ============================================
-- SISTEM TAGIHAN KOMISI MITRA - LENGKAP
-- ============================================

-- 1. Tabel Invoices (jika belum ada)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID REFERENCES users(id) NOT NULL,
  periode VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  total_items INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, waiting_confirmation, paid
  bukti_bayar TEXT,
  catatan_admin TEXT,
  dibayar_pada TIMESTAMP WITH TIME ZONE,
  diverifikasi_oleh UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Unique Constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_unique_periode ON invoices(mitra_id, periode);

-- 3. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_invoices_mitra ON invoices(mitra_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_periode ON invoices(periode);

-- 4. RLS Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop policies lama jika ada
DROP POLICY IF EXISTS "Mitra manage own invoices" ON invoices;
DROP POLICY IF EXISTS "Admin view all invoices" ON invoices;

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

-- 5. Trigger updated_at
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

COMMENT ON TABLE invoices IS 'Sistem tagihan komisi bulanan untuk mitra';
COMMENT ON COLUMN invoices.periode IS 'Periode tagihan format YYYY-MM';
COMMENT ON COLUMN invoices.total_items IS 'Jumlah item terjual pada periode tersebut';
COMMENT ON COLUMN invoices.total_amount IS 'Total komisi yang harus dibayar (total_items * 500)';
COMMENT ON COLUMN invoices.bukti_bayar IS 'Link bukti pembayaran dari mitra';
COMMENT ON COLUMN invoices.catatan_admin IS 'Catatan dari admin untuk invoice ini';
COMMENT ON COLUMN invoices.dibayar_pada IS 'Timestamp saat mitra upload bukti bayar';
COMMENT ON COLUMN invoices.diverifikasi_oleh IS 'User ID admin yang memverifikasi';
