-- ============================================
-- PERFORMANCE INDEXES
-- ============================================
-- Create missing indexes for faster queries
-- ============================================

-- STEP 1: Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_mitra_id ON orders(mitra_id);
CREATE INDEX IF NOT EXISTS idx_orders_mitra_status ON orders(mitra_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);

-- STEP 2: Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id, created_at DESC);

-- STEP 3: Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, dibaca, created_at DESC);

-- STEP 4: Products indexes
CREATE INDEX IF NOT EXISTS idx_produk_mitra_tersedia ON produk(mitra_id, tersedia);
CREATE INDEX IF NOT EXISTS idx_produk_kategori ON produk(kategori);
CREATE INDEX IF NOT EXISTS idx_produk_nama ON produk(nama text_pattern_ops);

-- STEP 5: Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_produk ON reviews(produk_id, created_at DESC);

-- STEP 6: Verify
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename IN ('orders', 'chat_messages', 'notifications', 'produk', 'reviews')
ORDER BY tablename;

-- ============================================
-- SELESAI! Query performance akan meningkat drastis.
-- ============================================
