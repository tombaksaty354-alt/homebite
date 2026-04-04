-- ============================================
-- FIX: Notification Delete Issue
-- ============================================
-- The notification is not being deleted due to RLS policies
-- ============================================

-- 1. Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'notifications';

-- 2. Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- 3. Create proper RLS policies with DELETE permission
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Verify policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'notifications';

-- 5. Test delete
-- First, insert a test notification
INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
VALUES (
  auth.uid(),
  '💬 Test Delete',
  'Test: This should be deleted',
  'info',
  '/chat',
  false
);

-- Check it was inserted
SELECT id, title FROM notifications WHERE user_id = auth.uid() AND title = '💬 Test Delete';

-- Now delete it
DELETE FROM notifications 
WHERE user_id = auth.uid() AND title = '💬 Test Delete';

-- Verify it was deleted
SELECT COUNT(*) as remaining FROM notifications 
WHERE user_id = auth.uid() AND title = '💬 Test Delete';
-- Should return: 0

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan fix RLS policies agar DELETE bekerja
-- 3. Test dengan klik notifikasi
-- 4. Notifikasi harus benar-benar terhapus
-- ============================================
