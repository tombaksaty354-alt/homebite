-- ============================================
-- CLEANUP: Remove old notifications
-- ============================================
-- This will remove all old notifications
-- New notifications will only appear for NEW chat messages
-- ============================================

-- 1. Delete ALL existing notifications (clean slate)
DELETE FROM notifications;

-- 2. Verify table is empty
SELECT COUNT(*) as notification_count FROM notifications;

-- ============================================
-- SETUP: Real-time notifications for new messages only
-- ============================================

-- 3. Create trigger function to auto-create notification on new chat message
CREATE OR REPLACE FUNCTION create_notification_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if receiver is different from sender
  IF NEW.receiver_id != NEW.sender_id THEN
    -- Create notification for the receiver
    INSERT INTO notifications (
      user_id, 
      title, 
      message, 
      tipe, 
      link, 
      dibaca
    )
    VALUES (
      NEW.receiver_id,
      '💬 Pesan Baru',
      (SELECT nama FROM users WHERE id = NEW.sender_id) || ': ' || SUBSTRING(NEW.pesan FROM 1 FOR 80),
      'info',
      '/chat',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger on chat_messages table
DROP TRIGGER IF EXISTS tr_auto_notification ON chat_messages;
CREATE TRIGGER tr_auto_notification
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_new_message();

-- ============================================
-- VERIFY SETUP
-- ============================================

-- 5. Check trigger exists
SELECT tgname, tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'tr_auto_notification';

-- 6. Test: Send a test message and check if notification is created
-- (This is manual test - send a chat message from the app)

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan menghapus SEMUA notifikasi lama
-- 3. Setup trigger otomatis untuk notifikasi baru
-- 4. Sekarang hanya chat BARU yang akan membuat notifikasi
-- 5. Refresh aplikasi dan test kirim pesan baru
-- ============================================
