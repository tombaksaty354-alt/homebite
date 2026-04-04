-- ============================================
-- FIX: Create notifications for existing chat messages
-- ============================================
-- This script will create notifications for existing chat messages
-- ============================================

-- 1. First, let's see what chat messages exist
SELECT 
  cm.id,
  cm.sender_id,
  cm.receiver_id,
  cm.pesan,
  cm.created_at,
  u_sender.nama as sender_name,
  u_receiver.nama as receiver_name
FROM chat_messages cm
JOIN users u_sender ON cm.sender_id = u_sender.id
JOIN users u_receiver ON cm.receiver_id = u_receiver.id
ORDER BY cm.created_at DESC
LIMIT 10;

-- 2. Check if notifications table exists and has data
SELECT COUNT(*) as notification_count FROM notifications;

-- 3. Create notifications for recent chat messages (last 20 messages)
-- This will create notifications for the receiver of each message
INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
SELECT DISTINCT ON (cm.id)
  cm.receiver_id as user_id,
  '💬 Pesan Baru dari ' || u_sender.nama as title,
  u_sender.nama || ': ' || SUBSTRING(cm.pesan FROM 1 FOR 100) || CASE WHEN LENGTH(cm.pesan) > 100 THEN '...' ELSE '' END as message,
  'info' as tipe,
  '/chat' as link,
  cm.dibaca as dibaca
FROM chat_messages cm
JOIN users u_sender ON cm.sender_id = u_sender.id
WHERE cm.created_at > NOW() - INTERVAL '7 days' -- Only last 7 days
  AND cm.receiver_id != cm.sender_id -- Exclude self-messages
  AND NOT EXISTS (
    SELECT 1 FROM notifications n 
    WHERE n.user_id = cm.receiver_id 
    AND n.message LIKE '%' || SUBSTRING(cm.pesan FROM 1 FOR 50) || '%'
    AND n.created_at > NOW() - INTERVAL '7 days'
  )
ORDER BY cm.id, cm.created_at DESC
LIMIT 20;

-- 4. Verify notifications were created
SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.dibaca,
  n.created_at
FROM notifications n
ORDER BY n.created_at DESC
LIMIT 10;

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan query ini di Supabase SQL Editor
-- 2. Ini akan membuat notifikasi dari chat messages yang sudah ada
-- 3. Refresh halaman aplikasi
-- 4. Buka notification bell - sekarang harus muncul!
-- ============================================
