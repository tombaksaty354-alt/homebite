-- ============================================
-- HOMEBITE - FINAL DATABASE SETUP
-- Jalankan SEMUA SQL ini di Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. SETUP STORAGE (UPLOAD GAMBAR PRODUK)
-- ============================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('produk-images', 'produk-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Gambar produk public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'produk-images');

CREATE POLICY "User upload gambar" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'produk-images');

CREATE POLICY "User delete gambar sendiri" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'produk-images');

-- ============================================
-- 2. TAMBAH KOLOM YANG DIPERLUKAN
-- ============================================

-- Orders: Bukti Pembayaran & Tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bukti_pembayaran TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_bukti VARCHAR(50) DEFAULT 'belum_kirim';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS catatan_penolakan TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS komisi_dipotong INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dana_dicairkan BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tanggal_cair TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS metode_pembayaran VARCHAR(50);

-- Users: Rekening Mitra
ALTER TABLE users ADD COLUMN IF NOT EXISTS rekening_bank VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rekening_nomor VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rekening_nama VARCHAR(255);

-- Produk
ALTER TABLE produk ADD COLUMN IF NOT EXISTS mitra_nama VARCHAR(255);
ALTER TABLE produk ADD COLUMN IF NOT EXISTS mitra_tier VARCHAR(50) DEFAULT 'silver';
ALTER TABLE produk ADD COLUMN IF NOT EXISTS tersedia BOOLEAN DEFAULT true;
ALTER TABLE produk ADD COLUMN IF NOT EXISTS stok INTEGER DEFAULT 100;

-- ============================================
-- 3. TABEL BARU (WISHLIST & REVIEWS)
-- ============================================

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  produk_id UUID REFERENCES produk(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, produk_id)
);

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

-- ============================================
-- 4. RLS POLICIES LENGKAP
-- ============================================

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own" ON users;
CREATE POLICY "Users view own" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own" ON users;
CREATE POLICY "Users update own" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Produk (Public Read, Mitra CRUD)
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Produk public read" ON produk;
CREATE POLICY "Produk public read" ON produk FOR SELECT USING (true);
DROP POLICY IF EXISTS "Mitra manage produk" ON produk;
CREATE POLICY "Mitra manage produk" ON produk FOR ALL TO authenticated USING (auth.uid() = mitra_id);

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer view orders" ON orders;
CREATE POLICY "Customer view orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Mitra view orders" ON orders;
CREATE POLICY "Mitra view orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = mitra_id);
DROP POLICY IF EXISTS "Customer create orders" ON orders;
CREATE POLICY "Customer create orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Customer update payment" ON orders;
CREATE POLICY "Customer update payment" ON orders FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
DROP POLICY IF EXISTS "Mitra update orders" ON orders;
CREATE POLICY "Mitra update orders" ON orders FOR UPDATE TO authenticated USING (auth.uid() = mitra_id) WITH CHECK (auth.uid() = mitra_id);

-- Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order items access" ON order_items;
CREATE POLICY "Order items access" ON order_items FOR ALL TO authenticated USING (true);

-- Wishlist
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Wishlist access" ON wishlist;
CREATE POLICY "Wishlist access" ON wishlist FOR ALL TO authenticated USING (auth.uid() = customer_id);

-- Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews public read" ON reviews;
CREATE POLICY "Reviews public read" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Customer create review" ON reviews;
CREATE POLICY "Customer create review" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

-- Chat
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat access" ON chat_messages;
CREATE POLICY "Chat access" ON chat_messages FOR ALL TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Laporan Keuangan
ALTER TABLE laporan_keuangan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Laporan access" ON laporan_keuangan;
CREATE POLICY "Laporan access" ON laporan_keuangan FOR ALL TO authenticated USING (auth.uid() = mitra_id);

-- Calon Mitra Applications
ALTER TABLE calon_mitra_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Calon mitra insert" ON calon_mitra_applications;
CREATE POLICY "Calon mitra insert" ON calon_mitra_applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Calon mitra admin" ON calon_mitra_applications;
CREATE POLICY "Calon mitra admin" ON calon_mitra_applications FOR ALL TO authenticated USING (true);

-- ============================================
-- 5. TRIGGERS OTOMATIS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_produk_updated_at ON produk;
CREATE TRIGGER update_produk_updated_at BEFORE UPDATE ON produk FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Kurangi Stok Saat Pesanan Lunas
CREATE OR REPLACE FUNCTION reduce_stock_on_lunas()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'lunas' AND (OLD.status IS NULL OR OLD.status != 'lunas') THEN
    UPDATE produk p
    SET stok = p.stok - oi.jumlah
    FROM order_items oi
    WHERE p.id = oi.produk_id AND oi.order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_reduce_stock ON orders;
CREATE TRIGGER tr_reduce_stock AFTER UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION reduce_stock_on_lunas();

-- Auto-Update Rating Produk dari Reviews
CREATE OR REPLACE FUNCTION update_produk_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE produk
  SET rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE produk_id = NEW.produk_id)
  WHERE id = NEW.produk_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_review_insert ON reviews;
CREATE TRIGGER after_review_insert AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_produk_rating();

-- ============================================
-- ✅ SELESAI! Database siap production
-- ============================================
