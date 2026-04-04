-- ============================================
-- SISTEM TAGIHAN BULANAN (INVOICE)
-- ============================================

-- 1. Tabel Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID REFERENCES users(id) NOT NULL,
  periode VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g., 2024-05)
  total_items INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0, -- Rp500 * total_items
  status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, waiting_confirmation, paid
  bukti_bayar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Unique Constraint (1 Invoice per Mitra per Bulan)
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_unique_periode ON invoices(mitra_id, periode);

-- 3. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_invoices_mitra ON invoices(mitra_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- 4. RLS Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Mitra hanya bisa lihat & update tagihan mereka sendiri
CREATE POLICY "Mitra manage own invoices" ON invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = mitra_id);

-- ============================================
-- ✅ SELESAI!
-- ============================================
