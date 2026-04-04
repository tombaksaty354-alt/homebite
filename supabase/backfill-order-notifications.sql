-- ============================================
-- FIX: Backfill Notifications for Existing Orders
-- ============================================
-- Create notifications for orders that already exist
-- ============================================

-- 1. First, make sure the trigger exists (run this if not done yet)
CREATE OR REPLACE FUNCTION create_notification_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'menunggu_ongkir' THEN
    INSERT INTO notifications (
      user_id, title, message, tipe, link, dibaca
    )
    VALUES (
      NEW.mitra_id,
      '📦 Pesanan Baru',
      'Pesanan ' || NEW.nomor_pesanan || ' dari ' || (SELECT nama FROM users WHERE id = NEW.customer_id),
      'info',
      '/mitra-dashboard/pesanan',
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notification_on_new_order ON orders;
CREATE TRIGGER tr_notification_on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_new_order();

-- 2. BACKFILL: Create notifications for existing orders that don't have notifications yet
INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
SELECT DISTINCT ON (o.id)
  o.mitra_id as user_id,
  '📦 Pesanan Baru' as title,
  'Pesanan ' || o.nomor_pesanan || ' dari ' || u.nama as message,
  'info' as tipe,
  '/mitra-dashboard/pesanan' as link,
  CASE WHEN o.status = 'lunas' OR o.status = 'selesai' THEN true ELSE false END as dibaca
FROM orders o
JOIN users u ON o.customer_id = u.id
WHERE o.status IN ('menunggu_ongkir', 'menunggu_pembayaran', 'lunas', 'dikirim')
  AND o.created_at > NOW() - INTERVAL '30 days' -- Only last 30 days
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = o.mitra_id
    AND n.message LIKE '%' || o.nomor_pesanan || '%'
    AND n.title = '📦 Pesanan Baru'
  );

-- 3. Verify notifications were created
SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.dibaca,
  n.created_at
FROM notifications n
WHERE n.title = '📦 Pesanan Baru'
ORDER BY n.created_at DESC
LIMIT 10;

-- 4. Check how many orders exist vs notifications created
SELECT 
  'Total Orders (last 30 days)' as metric,
  COUNT(*) as count
FROM orders
WHERE created_at > NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'Total Order Notifications' as metric,
  COUNT(*) as count
FROM notifications
WHERE title = '📦 Pesanan Baru'
AND created_at > NOW() - INTERVAL '30 days';

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan:
--    - Setup trigger untuk order baru
--    - Backfill notifikasi untuk order yang sudah ada
-- 3. Refresh aplikasi mitra
-- 4. Buka notification bell
-- 5. Harus muncul notifikasi pesanan!
-- ============================================
