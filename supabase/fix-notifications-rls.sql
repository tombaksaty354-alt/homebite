-- ============================================
-- FIX: Notifications RLS Policy Error
-- ============================================
-- Error: "new row violates row-level security policy for table notifications"
-- ============================================

-- 1. Drop conflicting policies
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- 2. Create proper RLS policy for notifications
-- Allow authenticated users to insert notifications (for triggers & app logic)
CREATE POLICY "Enable insert for authenticated users"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to view their own notifications
CREATE POLICY "Enable select for users based on user_id"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own notifications (mark as read/delete)
CREATE POLICY "Enable update for users based on user_id"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Verify policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan fix RLS policy agar checkout tidak error
-- 3. Test checkout lagi - harusnya berhasil sekarang!
-- ============================================
