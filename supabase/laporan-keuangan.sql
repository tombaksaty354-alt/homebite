-- ============================================
-- SISTEM LAPORAN KEUANGAN MITRA
-- ============================================

-- 1. Tabel Pemasukan Manual (Diisi Mitra)
CREATE TABLE IF NOT EXISTS pemasukan_mitra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID REFERENCES users(id) NOT NULL,
  tanggal DATE NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  jumlah INTEGER NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Pengeluaran Manual (Diisi Mitra)
CREATE TABLE IF NOT EXISTS pengeluaran_mitra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID REFERENCES users(id) NOT NULL,
  tanggal DATE NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  jumlah INTEGER NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_pemasukan_mitra ON pemasukan_mitra(mitra_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_mitra ON pengeluaran_mitra(mitra_id, tanggal);

-- 4. RLS Policies
ALTER TABLE pemasukan_mitra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mitra manage pemasukan" ON pemasukan_mitra 
  FOR ALL TO authenticated USING (auth.uid() = mitra_id);

ALTER TABLE pengeluaran_mitra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mitra manage pengeluaran" ON pengeluaran_mitra 
  FOR ALL TO authenticated USING (auth.uid() = mitra_id);

-- ============================================
-- ✅ SELESAI!
-- ============================================
