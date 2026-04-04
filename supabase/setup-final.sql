-- ============================================
-- HOMEBITE DATABASE SETUP - AMAN TANPA DROP
-- ============================================
-- Jalankan ini untuk membuat database dari awal
-- Aman: hanya buat table jika belum ada

-- ============================================
-- 1. CREATE TABLES (IF NOT EXISTS)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'mitra', 'admin')),
  tier VARCHAR(50) DEFAULT 'silver' CHECK (tier IN ('silver', 'gold', 'platinum')),
  avatar TEXT,
  telepon VARCHAR(50),
  alamat TEXT,
  kota VARCHAR(100),
  provinsi VARCHAR(100),
  kode_pos VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Produk table
CREATE TABLE IF NOT EXISTS produk (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nama VARCHAR(255) NOT NULL,
  deskripsi TEXT NOT NULL,
  harga INTEGER NOT NULL,
  gambar TEXT,
  kategori VARCHAR(100) NOT NULL,
  berat INTEGER,
  porsi VARCHAR(100),
  stok INTEGER DEFAULT 0,
  tersedia BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 0,
  total_terjual INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mitra_id UUID REFERENCES users(id),
  nomor_pesanan VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'menunggu_ongkir' CHECK (status IN (
    'menunggu_ongkir',
    'menunggu_pembayaran',
    'lunas',
    'diproses',
    'dikirim',
    'selesai',
    'dibatalkan'
  )),
  subtotal_produk INTEGER NOT NULL,
  ongkir INTEGER DEFAULT 0,
  total_bayar INTEGER NOT NULL,
  alamat_lengkap TEXT NOT NULL,
  kota VARCHAR(100) NOT NULL,
  provinsi VARCHAR(100) NOT NULL,
  kode_pos VARCHAR(10) NOT NULL,
  catatan_customer TEXT,
  catatan_mitra TEXT,
  metode_pembayaran VARCHAR(50),
  tanggal_bayar TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  produk_id UUID REFERENCES produk(id) ON DELETE CASCADE,
  jumlah INTEGER NOT NULL,
  harga_satuan INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pesan TEXT NOT NULL,
  dibaca BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  produk_id UUID REFERENCES produk(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  komentar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, produk_id)
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  produk_id UUID REFERENCES produk(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, produk_id)
);

-- Laporan Keuangan
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
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_produk_mitra ON produk(mitra_id);
CREATE INDEX IF NOT EXISTS idx_produk_kategori ON produk(kategori);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_mitra ON orders(mitra_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_produk ON order_items(produk_id);
CREATE INDEX IF NOT EXISTS idx_chat_order ON chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_reviews_produk ON reviews(produk_id);
CREATE INDEX IF NOT EXISTS idx_laporan_mitra ON laporan_keuangan(mitra_id);

-- ============================================
-- 3. FUNCTIONS & TRIGGERS
-- ============================================

-- Function update rating produk
CREATE OR REPLACE FUNCTION update_produk_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE produk
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE produk_id = NEW.produk_id
  )
  WHERE id = NEW.produk_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger dulu kalau ada (safe)
DROP TRIGGER IF EXISTS after_review_insert ON reviews;
CREATE TRIGGER after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_produk_rating();

-- Function auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_produk_updated_at ON produk;
CREATE TRIGGER update_produk_updated_at BEFORE UPDATE ON produk
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_keuangan ENABLE ROW LEVEL SECURITY;

-- Drop policies lama (safe dengan IF EXISTS)
DROP POLICY IF EXISTS "Produk dapat dilihat semua orang" ON produk;
DROP POLICY IF EXISTS "Mitra bisa CRUD produk sendiri" ON produk;
DROP POLICY IF EXISTS "Customer bisa lihat pesanan sendiri" ON orders;
DROP POLICY IF EXISTS "Mitra bisa lihat pesanan masuk" ON orders;
DROP POLICY IF EXISTS "Customer bisa buat pesanan" ON orders;
DROP POLICY IF EXISTS "Mitra bisa update pesanan" ON orders;
DROP POLICY IF EXISTS "Chat participant bisa lihat chat" ON chat_messages;
DROP POLICY IF EXISTS "User bisa kirim chat" ON chat_messages;
DROP POLICY IF EXISTS "Users bisa lihat data sendiri" ON users;
DROP POLICY IF EXISTS "Users bisa edit data sendiri" ON users;
DROP POLICY IF EXISTS "Reviews dapat dilihat semua orang" ON reviews;
DROP POLICY IF EXISTS "Customer bisa buat reviews sendiri" ON reviews;
DROP POLICY IF EXISTS "Customer bisa manage wishlist sendiri" ON wishlist;
DROP POLICY IF EXISTS "Mitra bisa lihat laporan sendiri" ON laporan_keuangan;
DROP POLICY IF EXISTS "Mitra bisa buat laporan sendiri" ON laporan_keuangan;

-- Create policies baru
CREATE POLICY "Produk dapat dilihat semua orang" ON produk
  FOR SELECT USING (true);

CREATE POLICY "Mitra bisa CRUD produk sendiri" ON produk
  FOR ALL USING (auth.uid() = mitra_id);

CREATE POLICY "Customer bisa lihat pesanan sendiri" ON orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Mitra bisa lihat pesanan masuk" ON orders
  FOR SELECT USING (auth.uid() = mitra_id);

CREATE POLICY "Customer bisa buat pesanan" ON orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Mitra bisa update pesanan" ON orders
  FOR UPDATE USING (auth.uid() = mitra_id);

CREATE POLICY "Chat participant bisa lihat chat" ON chat_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "User bisa kirim chat" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users bisa lihat data sendiri" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users bisa edit data sendiri" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Reviews dapat dilihat semua orang" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Customer bisa buat reviews sendiri" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customer bisa manage wishlist sendiri" ON wishlist
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "Mitra bisa lihat laporan sendiri" ON laporan_keuangan
  FOR SELECT USING (auth.uid() = mitra_id);

CREATE POLICY "Mitra bisa buat laporan sendiri" ON laporan_keuangan
  FOR INSERT WITH CHECK (auth.uid() = mitra_id);

-- ============================================
-- ✅ SELESAI! Database siap digunakan
-- ============================================
