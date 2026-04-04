-- ============================================
-- TABEL MONITORING KINERJA MITRA
-- ============================================

-- Tabel untuk tracking transaksi detail
CREATE TABLE IF NOT EXISTS monitoring_transaksi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  mitra_id UUID REFERENCES users(id),
  customer_id UUID REFERENCES users(id),
  tanggal_transaksi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_harga INTEGER NOT NULL,
  ongkir INTEGER DEFAULT 0,
  total_bayar INTEGER NOT NULL,
  komisi_platform INTEGER NOT NULL,
  pendapatan_mitra INTEGER NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_monitoring_mitra ON monitoring_transaksi(mitra_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_tanggal ON monitoring_transaksi(tanggal_transaksi);
CREATE INDEX IF NOT EXISTS idx_monitoring_status ON monitoring_transaksi(status);

-- ============================================
-- FUNCTION: Hitung statistik otomatis
-- ============================================

-- Trigger otomatis catat transaksi saat order selesai
CREATE OR REPLACE FUNCTION catat_transaksi_selesai()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'selesai' THEN
    -- Hitung komisi dan pendapatan per item
    INSERT INTO monitoring_transaksi (
      order_id,
      mitra_id,
      customer_id,
      tanggal_transaksi,
      total_harga,
      ongkir,
      total_bayar,
      komisi_platform,
      pendapatan_mitra,
      status
    )
    SELECT 
      NEW.id,
      oi.mitra_id,
      NEW.customer_id,
      NEW.updated_at,
      SUM(oi.subtotal),
      NEW.ongkir,
      NEW.total_bayar,
      SUM(oi.jumlah * 500), -- Komisi Rp500 per item
      SUM(oi.subtotal) - SUM(oi.jumlah * 500)
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    GROUP BY oi.mitra_id, NEW.ongkir, NEW.total_bayar, NEW.id, NEW.updated_at, NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_catat_transaksi ON orders;
CREATE TRIGGER tr_catat_transaksi
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION catat_transaksi_selesai();

-- ============================================
-- SELESAI!
-- ============================================
