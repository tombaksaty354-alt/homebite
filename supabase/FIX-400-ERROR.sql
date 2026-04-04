-- ============================================
-- IMMEDIATE FIX: Chat Messages 400 Error
-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- 1. Add 'dibaca' column if missing
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS dibaca BOOLEAN DEFAULT false;

-- 2. REMOVE all conflicting UPDATE policies
DROP POLICY IF EXISTS "Users can update chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Customer update payment" ON chat_messages;
DROP POLICY IF EXISTS "Mitra update orders" ON chat_messages;
DROP POLICY IF EXISTS "Mitra bisa update pesanan" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;

-- 3. CREATE new UPDATE policy that allows marking messages as read
CREATE POLICY "Enable update for chat participants"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  )
  WITH CHECK (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- 4. VERIFY policy exists
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'chat_messages'
  AND policyname = 'Enable update for chat participants';

-- ============================================
-- DONE! Refresh your app and test.
-- ============================================
