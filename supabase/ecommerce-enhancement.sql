-- ============================================
-- E-COMMERCE ENHANCEMENT SETUP
-- ============================================

-- 1. PRODUCT GALLERY (Multi-foto)
ALTER TABLE produk ADD COLUMN IF NOT EXISTS gambar_ke TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. VOUCHER SYSTEM
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kode VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  tipe VARCHAR(50) CHECK (tipe IN ('persen', 'nominal')),
  nilai INTEGER NOT NULL,
  minimal_transaksi INTEGER DEFAULT 0,
  maksimal_diskon INTEGER,
  kuota INTEGER,
  kuota_terpakai INTEGER DEFAULT 0,
  berlaku_dari TIMESTAMP WITH TIME ZONE,
  berlaku_sampai TIMESTAMP WITH TIME ZONE,
  mitra_id UUID REFERENCES users(id), -- NULL = bisa dipakai semua mitra
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  tipe VARCHAR(50) DEFAULT 'info',
  dibaca BOOLEAN DEFAULT false,
  link VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, dibaca);

-- 4. USER ADDRESSES
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  alamat TEXT NOT NULL,
  kota VARCHAR(100) NOT NULL,
  provinsi VARCHAR(100) NOT NULL,
  kode_pos VARCHAR(10) NOT NULL,
  telepon VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ORDER CANCELLATION
ALTER TABLE orders ADD COLUMN IF NOT EXISTS alasan_batal TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dibatalkan_oleh UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tanggal_batal TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) DEFAULT 'none';

-- ============================================
-- RLS POLICIES
-- ============================================

-- Vouchers: Public read
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vouchers_read" ON vouchers FOR SELECT USING (true);

-- Notifications: User read own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_read" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Addresses: User manage own
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_all" ON user_addresses FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- ✅ SELESAI!
-- ============================================
