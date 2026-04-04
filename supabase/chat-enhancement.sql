-- ============================================
-- CHAT SYSTEM ENHANCEMENT
-- ============================================

-- Tambah kolom untuk tipe chat (order, support, admin)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS chat_type VARCHAR(50) DEFAULT 'order' CHECK (chat_type IN ('order', 'support', 'admin'));
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS dibaca BOOLEAN DEFAULT false;

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_chat_sender_receiver ON chat_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_dibaca ON chat_messages(receiver_id, dibaca);

-- ============================================
-- ✅ SELESAI!
-- ============================================
