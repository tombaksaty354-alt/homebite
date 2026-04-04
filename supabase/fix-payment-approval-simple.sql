-- ============================================
-- FIX PAYMENT APPROVAL - SIMPLE & ESSENTIAL
-- ============================================
-- Run this script to fix payment approval system
-- ============================================

-- STEP 1: Ensure all required columns exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_bukti VARCHAR(50) DEFAULT 'menunggu_konfirmasi';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bukti_pembayaran TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pembayaran_metode VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS catatan_penolakan TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- STEP 2: Update existing orders that have bukti but no status
UPDATE orders 
SET status_bukti = 'menunggu_konfirmasi'
WHERE bukti_pembayaran IS NOT NULL 
  AND (status_bukti IS NULL OR status_bukti = '');

-- STEP 3: Verify columns exist
SELECT 'Column status_bukti' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'status_bukti'

UNION ALL

SELECT 'Column bukti_pembayaran',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'bukti_pembayaran';

-- STEP 4: Check current payment status
SELECT 
  status_bukti,
  COUNT(*) as count,
  SUM(total_bayar) as total_amount
FROM orders
WHERE bukti_pembayaran IS NOT NULL
GROUP BY status_bukti;
