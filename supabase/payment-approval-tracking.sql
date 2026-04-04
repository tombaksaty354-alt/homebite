-- ============================================
-- PAYMENT APPROVAL TRACKING & NOTIFICATIONS
-- ============================================
-- Add columns for payment approval tracking
-- Create trigger for auto-notification to admin
-- Add indexes for performance
-- ============================================

-- ============================================
-- PART 1: Add tracking columns to orders
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_approved_by UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejected_by UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_review_count INTEGER DEFAULT 0;

COMMENT ON COLUMN orders.payment_approved_by IS 'ID admin yang approve pembayaran';
COMMENT ON COLUMN orders.payment_approved_at IS 'Waktu pembayaran di-approve';
COMMENT ON COLUMN orders.payment_rejected_by IS 'ID admin yang reject pembayaran';
COMMENT ON COLUMN orders.payment_rejected_at IS 'Waktu pembayaran di-reject';
COMMENT ON COLUMN orders.payment_review_count IS 'Jumlah kali pembayaran di-review';

-- ============================================
-- PART 2: Create index untuk payment approval
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_status_bukti ON orders(status_bukti);
CREATE INDEX IF NOT EXISTS idx_orders_payment_approved ON orders(payment_approved_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_rejected ON orders(payment_rejected_at);

-- ============================================
-- PART 3: Create trigger untuk notification admin
-- ============================================
CREATE OR REPLACE FUNCTION notify_admin_new_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Saat customer upload bukti pembayaran baru
  IF OLD.bukti_pembayaran IS NULL AND NEW.bukti_pembayaran IS NOT NULL THEN
    -- Notification ke semua admin
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      SELECT 
        id,
        '💰 Pembayaran Baru Perlu Konfirmasi',
        'Pesanan ' || NEW.nomor_pesanan || ' menunggu konfirmasi pembayaran. Total: Rp ' || NEW.total_bayar || '. Segera review di Payment Approval.',
        'warning',
        '/admin/payment-approval',
        false
      FROM users
      WHERE role = 'admin';
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- Increment review count
    NEW.payment_review_count = 1;
    
  END IF;
  
  -- Saat payment di-approve
  IF OLD.status_bukti != 'disetujui' AND NEW.status_bukti = 'disetujui' THEN
    NEW.payment_approved_by = auth.uid();
    NEW.payment_approved_at = NOW();
    NEW.payment_review_count = COALESCE(OLD.payment_review_count, 0) + 1;
  END IF;
  
  -- Saat payment di-reject
  IF OLD.status_bukti != 'ditolak' AND NEW.status_bukti = 'ditolak' THEN
    NEW.payment_rejected_by = auth.uid();
    NEW.payment_rejected_at = NOW();
    NEW.payment_review_count = COALESCE(OLD.payment_review_count, 0) + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger lama jika ada
DROP TRIGGER IF EXISTS tr_payment_approval_notify ON orders;

-- Create trigger baru
CREATE TRIGGER tr_payment_approval_notify
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_payment();

-- ============================================
-- PART 4: Create view untuk dashboard stats
-- ============================================
CREATE OR REPLACE VIEW v_payment_approval_stats AS
SELECT
  COUNT(*) FILTER (WHERE status_bukti = 'menunggu_konfirmasi') as pending_count,
  COUNT(*) FILTER (WHERE status_bukti = 'disetujui') as approved_count,
  COUNT(*) FILTER (WHERE status_bukti = 'ditolak') as rejected_count,
  COALESCE(SUM(total_bayar) FILTER (WHERE status_bukti = 'menunggu_konfirmasi'), 0) as pending_amount,
  COALESCE(SUM(total_bayar) FILTER (WHERE status_bukti = 'disetujui'), 0) as approved_amount,
  COUNT(*) as total_payments
FROM orders
WHERE bukti_pembayaran IS NOT NULL;

-- ============================================
-- PART 5: Create view untuk unread notifications
-- ============================================
CREATE OR REPLACE VIEW v_admin_unread_payment_count AS
SELECT
  COUNT(*) as unread_count
FROM notifications
WHERE tipe IN ('warning', 'info')
  AND dibaca = false
  AND title LIKE '%Pembayaran%'
  AND user_id IN (SELECT id FROM users WHERE role = 'admin');

-- ============================================
-- PART 6: Add RLS policy untuk payment approval
-- ============================================
-- Admin bisa view semua orders dengan bukti pembayaran
DROP POLICY IF EXISTS "Admin can view payment proofs" ON orders;
CREATE POLICY "Admin can view payment proofs"
  ON orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
    AND bukti_pembayaran IS NOT NULL
  );

-- ============================================
-- PART 7: Verify setup
-- ============================================
SELECT 'Column payment_approved_by added' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'payment_approved_by'

UNION ALL

SELECT 'Column payment_approved_at added',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'payment_approved_at'

UNION ALL

SELECT 'Column payment_rejected_by added',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'payment_rejected_by'

UNION ALL

SELECT 'Column payment_review_count added',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'payment_review_count'

UNION ALL

SELECT 'Trigger tr_payment_approval_notify',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM pg_trigger 
WHERE tgname = 'tr_payment_approval_notify'

UNION ALL

SELECT 'View v_payment_approval_stats',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.views 
WHERE table_name = 'v_payment_approval_stats'

UNION ALL

SELECT 'View v_admin_unread_payment_count',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.views 
WHERE table_name = 'v_admin_unread_payment_count';

-- ============================================
-- PART 8: Test query - Check pending payments
-- ============================================
-- Uncomment untuk test:
/*
SELECT 
  nomor_pesanan,
  customer_id,
  mitra_id,
  total_bayar,
  bukti_pembayaran,
  pembayaran_metode,
  created_at,
  status_bukti
FROM orders
WHERE status_bukti = 'menunggu_konfirmasi'
ORDER BY created_at DESC;
*/

-- ============================================
-- PART 9: Query untuk dashboard admin
-- ============================================
-- Uncomment untuk test:
/*
SELECT * FROM v_payment_approval_stats;
SELECT * FROM v_admin_unread_payment_count;
*/

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan:
--    ✅ Tambah kolom tracking payment approval
--    ✅ Buat trigger auto-notification ke admin
--    ✅ Buat view untuk stats dashboard
--    ✅ Tambah index untuk performa
-- 3. Refresh aplikasi
-- 4. Test:
--    - Customer upload bukti → Admin dapat notification ✅
--    - Admin approve → payment_approved_by & payment_approved_at terisi ✅
--    - Admin reject → payment_rejected_by & payment_rejected_at terisi ✅
--    - View stats bekerja ✅
-- ============================================
