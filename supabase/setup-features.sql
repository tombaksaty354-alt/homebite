-- ============================================
-- TABEL PENDUKUNG FITUR LENGKAP
-- ============================================

-- 1. Chat Messages (Customer ↔ Mitra)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  pesan TEXT NOT NULL,
  dibaca BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_order ON chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);

-- 2. Reviews (After order complete)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id),
  produk_id UUID REFERENCES produk(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  komentar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, produk_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_produk ON reviews(produk_id);

-- 3. Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id),
  produk_id UUID REFERENCES produk(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, produk_id)
);

-- 4. Laporan Keuangan Mitra
CREATE TABLE IF NOT EXISTS laporan_keuangan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID REFERENCES users(id),
  tanggal DATE NOT NULL,
  tipe VARCHAR(50) CHECK (tipe IN ('pemasukan', 'pengeluaran')),
  jumlah INTEGER NOT NULL,
  kategori VARCHAR(100),
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laporan_mitra ON laporan_keuangan(mitra_id);

-- ============================================
-- TRIGGER: Auto-update product rating
-- ============================================
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
-- RLS POLICIES
-- ============================================

-- Chat: participant only
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat participant can view" ON chat_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "User can send chat" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Reviews: public view, customer can create
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);
CREATE POLICY "Customer can create review" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Wishlist: customer only
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer manage own wishlist" ON wishlist
  FOR ALL USING (auth.uid() = customer_id);

-- Laporan Keuangan: mitra only
ALTER TABLE laporan_keuangan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mitra view own reports" ON laporan_keuangan
  FOR SELECT USING (auth.uid() = mitra_id);
CREATE POLICY "Mitra create own reports" ON laporan_keuangan
  FOR INSERT WITH CHECK (auth.uid() = mitra_id);

-- ============================================
-- SELESAI!
-- ============================================
