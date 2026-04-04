-- ============================================
-- FIX: Notification for New Orders to Mitra
-- ============================================
-- Create notification when customer creates new order
-- ============================================

-- 1. Create trigger function for new orders
CREATE OR REPLACE FUNCTION create_notification_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification when order is first created (menunggu_ongkir status)
  IF NEW.status = 'menunggu_ongkir' THEN
    -- Create notification for the mitra
    INSERT INTO notifications (
      user_id, 
      title, 
      message, 
      tipe, 
      link, 
      dibaca
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

-- 2. Create trigger on orders table
DROP TRIGGER IF EXISTS tr_notification_on_new_order ON orders;
CREATE TRIGGER tr_notification_on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_new_order();

-- 3. Verify trigger exists
SELECT tgname, tgrelid::regclass as table_name, tgfoid::regproc as function_name
FROM pg_trigger
WHERE tgname = 'tr_notification_on_new_order';

-- 4. Test: Create a test order and check if notification is created
-- (Manual test - create an order from the app)

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan setup trigger untuk notifikasi pesanan baru
-- 3. Sekarang setiap pesanan baru → Mitra dapat notifikasi
-- 4. Test dengan membuat pesanan baru dari customer
-- 5. Mitra harus dapat notifikasi di bell 🔔
-- ============================================
