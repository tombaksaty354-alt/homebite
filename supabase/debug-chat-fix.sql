-- ============================================
-- DEBUG & FIX: CHAT MESSAGES NOT SHOWING
-- ============================================
-- Run this in your Supabase SQL Editor to:
-- 1. Verify RLS policies are correct
-- 2. Check if realtime is enabled
-- 3. Test message queries
-- ============================================

-- 1. Check if chat_messages table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position;

-- 2. Check current RLS policies on chat_messages
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'chat_messages';

-- 3. Check if RLS is enabled
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'chat_messages';

-- 4. Check if realtime is enabled for chat_messages
SELECT schemaname, tablename, pubname
FROM pg_publication_tables
WHERE tablename = 'chat_messages';

-- 5. Check if there are any messages in the database
SELECT count(*) as total_messages FROM chat_messages;

-- 6. Check recent messages (last 10)
SELECT 
  id,
  sender_id,
  receiver_id,
  order_id,
  chat_type,
  LEFT(pesan, 50) as pesan_preview,
  dibaca,
  created_at
FROM chat_messages
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check if users table is accessible
SELECT count(*) as total_users FROM users;

-- ============================================
-- FIX: RECREATE PROPER RLS POLICIES
-- ============================================
-- If policies are missing or incorrect, run this:

-- Drop old policies if they exist
DROP POLICY IF EXISTS "chat_read_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_insert_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_update_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_delete_policy" ON chat_messages;

-- Make sure RLS is enabled
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "chat_read_policy" ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "chat_insert_policy" ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "chat_update_policy" ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FIX: ENABLE REALTIME IF NOT ENABLED
-- ============================================
-- Check if publication exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;

-- ============================================
-- TEST QUERY: Simulate what the app does
-- ============================================
-- Replace these IDs with actual user IDs from your database
-- SELECT * FROM chat_messages
-- WHERE (
--   (sender_id = 'USER_ID_1' AND receiver_id = 'USER_ID_2')
--   OR 
--   (sender_id = 'USER_ID_2' AND receiver_id = 'USER_ID_1')
-- )
-- ORDER BY created_at ASC
-- LIMIT 200;

-- ============================================
-- VERIFY USERS EXIST
-- ============================================
SELECT id, nama, role, email
FROM users
ORDER BY created_at DESC
LIMIT 10;
