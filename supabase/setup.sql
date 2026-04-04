-- ============================================
-- HOMEBITE DATABASE SCHEMA FOR SUPABASE
-- ============================================
-- Copy paste semua SQL ini ke SQL Editor di Supabase Dashboard
-- URL: https://app.supabase.com/project/YOUR-PROJECT/sql

-- ============================================
-- 1. TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'konsumen' CHECK (role IN ('konsumen', 'mitra', 'admin')),
  tier VARCHAR(50) DEFAULT 'silver' CHECK (tier IN ('silver', 'gold', 'platinum')),
  avatar TEXT,
  telepon VARCHAR(50),
  alamat TEXT,
  kota VARCHAR(100),
  provinsi VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Produk table
CREATE TABLE IF NOT EXISTS produk (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  deskripsi TEXT NOT NULL,
  harga INTEGER NOT NULL,
  gambar TEXT,
  kategori VARCHAR(100) NOT NULL,
  berat INTEGER,
  porsi VARCHAR(100),
  tersedia BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 0,
  total_terjual INTEGER DEFAULT 0,
  mitra_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mitra_nama VARCHAR(255),
  mitra_tier VARCHAR(50) DEFAULT 'silver',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nomor_pesanan VARCHAR(100) UNIQUE NOT NULL,
  total_harga INTEGER NOT NULL,
  ongkir INTEGER DEFAULT 0,
  total_komisi INTEGER DEFAULT 0,
  total_bayar INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'diproses', 'dikirim', 'selesai', 'dibatalkan')),
  alamat_lengkap TEXT NOT NULL,
  kota VARCHAR(100) NOT NULL,
  provinsi VARCHAR(100) NOT NULL,
  kode_pos VARCHAR(10) NOT NULL,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  produk_id UUID REFERENCES produk(id) ON DELETE CASCADE,
  jumlah INTEGER NOT NULL,
  harga INTEGER NOT NULL,
  komisi INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  mitra_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  produk_id UUID REFERENCES produk(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  komentar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, produk_id)
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  produk_id UUID REFERENCES produk(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, produk_id)
);

-- Laporan Keuangan table
CREATE TABLE IF NOT EXISTS laporan_keuangan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  tipe VARCHAR(50) NOT NULL CHECK (tipe IN ('pemasukan', 'pengeluaran')),
  jumlah INTEGER NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES (untuk performa)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_produk_kategori ON produk(kategori);
CREATE INDEX IF NOT EXISTS idx_produk_mitra ON produk(mitra_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_produk ON order_items(produk_id);
CREATE INDEX IF NOT EXISTS idx_reviews_produk ON reviews(produk_id);
CREATE INDEX IF NOT EXISTS idx_laporan_mitra ON laporan_keuangan(mitra_id);

-- ============================================
-- 3. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produk_updated_at BEFORE UPDATE ON produk
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_keuangan ENABLE ROW LEVEL SECURITY;

-- Public access untuk produk (read only)
CREATE POLICY "Produk dapat dilihat semua orang" ON produk
  FOR SELECT USING (true);

-- Users bisa lihat data sendiri
CREATE POLICY "Users bisa lihat data sendiri" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users bisa buat order sendiri
CREATE POLICY "Users bisa buat order" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users bisa lihat order sendiri" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users bisa manage wishlist sendiri
CREATE POLICY "Users manage wishlist sendiri" ON wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Users bisa manage reviews sendiri
CREATE POLICY "Users manage reviews sendiri" ON reviews
  FOR ALL USING (auth.uid() = user_id);

-- Mitra bisa lihat laporan sendiri
CREATE POLICY "Mitra bisa lihat laporan sendiri" ON laporan_keuangan
  FOR SELECT USING (auth.uid() = mitra_id);

CREATE POLICY "Mitra bisa buat laporan sendiri" ON laporan_keuangan
  FOR INSERT WITH CHECK (auth.uid() = mitra_id);

-- ============================================
-- 5. SEED DATA (Opsional - Hapus jika tidak perlu)
-- ============================================

-- Insert sample products (UNCOMMENT jika ingin seed data)
/*
INSERT INTO users (email, nama, password_hash, role, tier) VALUES
('mitra1@homebite.id', 'Dapur Bu Sari', '$2b$10$dummyhashforsampleonly123456789', 'mitra', 'platinum'),
('mitra2@homebite.id', 'Nasi Goreng Pakde', '$2b$10$dummyhashforsampleonly123456789', 'mitra', 'gold');

INSERT INTO produk (nama, deskripsi, harga, gambar, kategori, mitra_id, mitra_nama, mitra_tier) VALUES
('Rendang Daging Sapi', 'Rendang asli Padang dengan daging sapi pilihan', 85000, 'https://picsum.photos/seed/rendang/400/400', 'Makanan Berat', (SELECT id FROM users WHERE email = 'mitra1@homebite.id'), 'Dapur Bu Sari', 'platinum'),
('Nasi Goreng Spesial', 'Nasi goreng dengan telur, ayam, dan sayuran segar', 35000, 'https://picsum.photos/seed/nasigoreng/400/400', 'Makanan Berat', (SELECT id FROM users WHERE email = 'mitra2@homebite.id'), 'Nasi Goreng Pakde', 'gold');
*/

-- ============================================
-- DONE! ✅
-- ============================================
-- Setelah execute semua SQL, database siap digunakan!
