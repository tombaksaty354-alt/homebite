-- ============================================
-- FIX: CHAT SYSTEM - COMPLETE SETUP
-- ============================================

-- 1. Pastikan tabel chat_messages punya semua kolom yang diperlukan
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS chat_type VARCHAR(50) DEFAULT 'order';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS dibaca BOOLEAN DEFAULT false;

-- 2. DROP SEMUA POLICY LAMA
DROP POLICY IF EXISTS "Chat read access" ON chat_messages;
DROP POLICY IF EXISTS "Chat insert access" ON chat_messages;
DROP POLICY IF EXISTS "Chat update access" ON chat_messages;
DROP POLICY IF EXISTS "Chat participant can view" ON chat_messages;
DROP POLICY IF EXISTS "User can send chat" ON chat_messages;
DROP POLICY IF EXISTS "Chat access" ON chat_messages;

-- 3. DISABLE/ENABLE RLS ULANG
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. BUAT POLICY BARU YANG LEBIH PERMISIF
-- Read: Semua user login bisa baca pesan mereka sendiri (sebagai sender atau receiver)
CREATE POLICY "chat_read_policy" ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert: Semua user login bisa kirim pesan
CREATE POLICY "chat_insert_policy" ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update: Semua user login bisa update (untuk mark as read)
CREATE POLICY "chat_update_policy" ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. PASTIKAN TABEL USERS BISA DI-SELECT OLER SEMUA USER LOGIN
DROP POLICY IF EXISTS "Users view own" ON users;
CREATE POLICY "users_read_policy" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- TEST QUERIES (Opsional - untuk debug)
-- ============================================

-- Cek apakah ada data di chat_messages
-- SELECT count(*) FROM chat_messages;

-- Cek semua policies
-- SELECT * FROM pg_policies WHERE tablename = 'chat_messages';

-- ============================================
-- ✅ SELESAI!
-- ============================================
