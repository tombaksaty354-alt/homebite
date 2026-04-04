-- ============================================
-- FIX: Chat Messages Update (Mark as Read) Error
-- ============================================
-- The 400 Bad Request error occurs when updating chat_messages
-- ============================================

-- 1. Check if 'dibaca' column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_messages'
  AND column_name IN ('dibaca', 'read_at');

-- 2. If 'dibaca' column doesn't exist, create it
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS dibaca BOOLEAN DEFAULT false;

ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 3. Check current RLS policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'chat_messages';

-- 4. Drop existing UPDATE policy (if any)
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Customer update payment" ON chat_messages;
DROP POLICY IF EXISTS "Mitra update orders" ON chat_messages;
DROP POLICY IF EXISTS "Mitra bisa update pesanan" ON chat_messages;
DROP POLICY IF EXISTS "Customer bisa update own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Mitra bisa update own chat messages" ON chat_messages;

-- 5. Create proper UPDATE policy for chat_messages
-- Allow users to update messages they sent OR received
CREATE POLICY "Users can update chat messages"
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

-- 6. Verify policy was created
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'chat_messages' 
  AND policyname = 'Users can update chat messages';

-- 7. Test update
-- First, find an unread message
SELECT id, sender_id, receiver_id, dibaca 
FROM chat_messages 
WHERE dibaca = false 
LIMIT 1;

-- Try to update it (replace 'YOUR_MESSAGE_ID' with actual ID from above)
-- UPDATE chat_messages 
-- SET dibaca = true, read_at = NOW()
-- WHERE id = 'YOUR_MESSAGE_ID';

-- ============================================
-- DEBUG: If still getting 400 error
-- ============================================
-- The error might be caused by:
-- 1. Empty array passed to .in()
-- 2. Wrong column name (should be 'dibaca')
-- 3. RLS blocking the update
-- 4. Supabase client not initialized properly

-- Check if array is empty before updating:
-- In code: if (unreadIds.length > 0) { await update... }

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan fix RLS policies untuk UPDATE
-- 3. Pastikan kolom 'dibaca' ada
-- 4. Test kirim pesan dan buka chat
-- 5. Error 400 harus hilang
-- ============================================
