-- ============================================
-- FIX: CHAT RLS POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Chat participant can view" ON chat_messages;
DROP POLICY IF EXISTS "User can send chat" ON chat_messages;
DROP POLICY IF EXISTS "Chat access" ON chat_messages;

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa lihat pesan dimana mereka adalah sender ATAU receiver
CREATE POLICY "Chat read access" ON chat_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy: User bisa insert pesan
CREATE POLICY "Chat insert access" ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Policy: User bisa update pesan mereka sendiri (untuk mark as read)
CREATE POLICY "Chat update access" ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- ============================================
-- ✅ SELESAI!
-- ============================================
