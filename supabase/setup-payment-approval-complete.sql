-- ============================================
-- SETUP PAYMENT APPROVAL SYSTEM - COMPLETE
-- ============================================
-- This script ensures all required columns exist
-- before running the tracking script
-- ============================================

-- ============================================
-- PART 0: Ensure status_bukti column exists
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_bukti VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bukti_pembayaran TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pembayaran_metode VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS catatan_penolakan TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN orders.status_bukti IS 'Status bukti pembayaran: menunggu_konfirmasi / disetujui / ditolak';
COMMENT ON COLUMN orders.bukti_pembayaran IS 'URL gambar bukti pembayaran dari customer';
COMMENT ON COLUMN orders.pembayaran_metode IS 'Metode pembayaran yang dipilih customer';
COMMENT ON COLUMN orders.catatan_penolakan IS 'Alasan penolakan bukti pembayaran';

-- ============================================
-- PART 1: Run tracking setup
-- ============================================
-- Now run the main tracking script
-- (Copy-paste from payment-approval-tracking.sql PART 1 onwards)

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
-- PART 2: Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_status_bukti ON orders(status_bukti);
CREATE INDEX IF NOT EXISTS idx_orders_payment_approved ON orders(payment_approved_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_rejected ON orders(payment_rejected_at);
CREATE INDEX IF NOT EXISTS idx_orders_bukti_pembayaran ON orders(bukti_pembayaran);

-- ============================================
-- PART 3: Create trigger function
-- ============================================
CREATE OR REPLACE FUNCTION notify_admin_new_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- ============================================
  -- ONE-TIME CONFIRMATION RULE
  -- ============================================
  -- PREVENT: Cannot change status_bukti after it's been set to disapproved/rejected
  -- Customer can only re-upload if rejected (status_bukti goes back to NULL first)
  
  -- Saat payment sudah disetujui, TIDAK BOLEH diubah lagi
  IF OLD.status_bukti = 'disetujui' AND NEW.status_bukti != 'disetujui' THEN
    RAISE EXCEPTION '❌ Pembayaran sudah dikonfirmasi oleh Platform dan tidak bisa diubah!';
  END IF;
  
  -- Saat customer upload bukti pembayaran baru (atau re-upload setelah reject)
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
  
  -- Saat payment di-approve (ONE-TIME ONLY)
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
-- PART 4: Create views
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

CREATE OR REPLACE VIEW v_admin_unread_payment_count AS
SELECT
  COUNT(*) as unread_count
FROM notifications
WHERE tipe IN ('warning', 'info')
  AND dibaca = false
  AND title LIKE '%Pembayaran%'
  AND user_id IN (SELECT id FROM users WHERE role = 'admin');

-- ============================================
-- PART 5: RLS Policies
-- ============================================
DROP POLICY IF EXISTS "Admin can view payment proofs" ON orders;
CREATE POLICY "Admin can view payment proofs"
  ON orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
    AND bukti_pembayaran IS NOT NULL
  );

-- ============================================
-- PART 6: Verify Setup
-- ============================================
SELECT 'Column status_bukti' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'status_bukti'

UNION ALL

SELECT 'Column bukti_pembayaran',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'bukti_pembayaran'

UNION ALL

SELECT 'Column payment_approved_by',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'payment_approved_by'

UNION ALL

SELECT 'Column payment_approved_at',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'payment_approved_at'

UNION ALL

SELECT 'Column payment_rejected_by',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'payment_rejected_by'

UNION ALL

SELECT 'Column payment_rejected_at',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'payment_rejected_at'

UNION ALL

SELECT 'Column payment_review_count',
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
-- PART 7: Update existing orders (optional)
-- ============================================
-- If you have existing orders with bukti_pembayaran but no status_bukti
-- Uncomment this to set default status:
/*
UPDATE orders 
SET status_bukti = 'menunggu_konfirmasi'
WHERE bukti_pembayaran IS NOT NULL 
  AND status_bukti IS NULL;
*/

-- ============================================
-- PART 8: Test Queries
-- ============================================
-- Check if setup is complete:
-- SELECT * FROM v_payment_approval_stats;
-- SELECT * FROM v_admin_unread_payment_count;

-- Check pending payments:
-- SELECT nomor_pesanan, status_bukti, bukti_pembayaran, total_bayar
-- FROM orders
-- WHERE status_bukti = 'menunggu_konfirmasi'
-- ORDER BY created_at DESC;

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Script ini akan:
--    ✅ Pastikan kolom status_bukti & bukti_pembayaran ada
--    ✅ Tambah kolom tracking (payment_approved_by, dll)
--    ✅ Buat trigger auto-notification
--    ✅ Buat views untuk stats
--    ✅ Setup RLS policies
--    ✅ Verify semua kolom & trigger sudah ada
-- 3. Cek hasil query di PART 6 - semua harus ✅ EXISTS
-- 4. Refresh aplikasi
-- 5. Test approve/reject payment
-- ============================================
