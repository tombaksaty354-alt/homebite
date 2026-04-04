-- ============================================
-- KOLOM PEMBAYARAN DI TABEL ORDERS
-- ============================================
-- Menambahkan informasi pembayaran ke orders
-- ============================================

-- Add columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pembayaran_rekening_id UUID REFERENCES rekening_mitra(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pembayaran_metode VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bukti_transfer TEXT;

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_orders_pembayaran_rekening ON orders(pembayaran_rekening_id);

COMMENT ON COLUMN orders.pembayaran_rekening_id IS 'ID rekening mitra yang dipilih customer untuk pembayaran';
COMMENT ON COLUMN orders.pembayaran_metode IS 'Deskripsi metode pembayaran (contoh: BCA - 1234567890)';
COMMENT ON COLUMN orders.bukti_transfer IS 'Link gambar bukti transfer atau ID transaksi dari customer';
