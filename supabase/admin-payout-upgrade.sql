-- ============================================
-- ADMIN PAYOUT UPGRADE - PROOF OF TRANSFER
-- ============================================
-- Admin menyimpan bukti transfer ke rekening mitra
-- ============================================

-- STEP 1: Add column for Admin Transfer Proof
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_transfer_proof TEXT;

COMMENT ON COLUMN orders.admin_transfer_proof IS 'Bukti transfer dari Admin Platform ke Rekening Mitra';

-- STEP 2: Verify
SELECT '✅ Column admin_transfer_proof added' as status;

-- STEP 3: Create Index
CREATE INDEX IF NOT EXISTS idx_orders_admin_transfer_proof ON orders(admin_transfer_proof);

-- ============================================
-- SELESAI! Admin sekarang bisa upload bukti transfer.
-- ============================================
