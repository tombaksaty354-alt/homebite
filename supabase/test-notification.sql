-- ============================================
-- TEST NOTIFICATION SYSTEM
-- ============================================
-- Script untuk test apakah notifikasi dibuat dengan benar
-- ============================================

-- 1. Cek apakah tabel notifications ada
SELECT COUNT(*) as total_notifications FROM notifications;

-- 2. Cek struktur tabel notifications
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 3. Cek RLS policies untuk notifications
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'notifications';

-- 4. Test insert notification manual
-- Ganti 'YOUR_USER_ID' dengan user_id Anda yang sebenarnya
INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
VALUES (
  auth.uid(), -- Atau ganti dengan UUID user Anda
  '💬 Test Chat',
  'Test: Ini adalah notifikasi chat test',
  'info',
  '/chat',
  false
);

-- 5. Verify insert berhasil
SELECT * FROM notifications 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Test untuk different notification types
INSERT INTO notifications (user_id, title, message, tipe, link, dibaca) VALUES
  (auth.uid(), '📦 Test Pesanan', 'Pesanan #123 telah dikirim', 'info', '/pesanan', false),
  (auth.uid(), '📢 Test Promo', 'Diskon 50% untuk Anda!', 'success', '/promo', false);

-- 7. Verify semua notifikasi ada
SELECT tipe, COUNT(*) as count
FROM notifications
WHERE user_id = auth.uid()
GROUP BY tipe;

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan query ini di Supabase SQL Editor
-- 2. Cek apakah notifikasi berhasil dibuat
-- 3. Refresh halaman aplikasi
-- 4. Buka notification bell
-- 5. Cek browser console untuk debug logs
-- ============================================
