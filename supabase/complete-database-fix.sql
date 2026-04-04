-- ============================================
-- COMPREHENSIVE DATABASE FIX - ALL MISSING COLUMNS
-- ============================================
-- Run this to ensure all features work correctly
-- ============================================

-- STEP 1: Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_pencairan VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bukti_pengiriman_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bukti_pengiriman_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) DEFAULT 'none';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_rekening_id UUID REFERENCES customer_rekening(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_proof_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dibatalkan_oleh UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tanggal_batal TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_approved_by UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejected_by UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_review_count INTEGER DEFAULT 0;

-- STEP 2: Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'silver';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- STEP 3: Add missing columns to produk table
ALTER TABLE produk ADD COLUMN IF NOT EXISTS stok INTEGER DEFAULT 0;

-- STEP 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status_pencairan ON orders(status_pencairan);
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON orders(refund_status);
CREATE INDEX IF NOT EXISTS idx_orders_dibatalkan_oleh ON orders(dibatalkan_oleh);
CREATE INDEX IF NOT EXISTS idx_orders_payment_approved ON orders(payment_approved_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_rejected ON orders(payment_rejected_at);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- STEP 5: Verify all columns
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN (
    'status_pencairan', 'commission_amount', 'payout_amount',
    'bukti_pengiriman_url', 'shipped_at', 'canceled_at',
    'cancel_reason', 'refund_status', 'refund_amount',
    'dibatalkan_oleh', 'payment_approved_by', 'payment_approved_at',
    'payment_review_count'
  )
ORDER BY column_name;

-- STEP 6: Show summary
SELECT '✅ Database fix complete!' as status;
SELECT COUNT(*)::text as total_columns_added
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN (
    'status_pencairan', 'commission_amount', 'payout_amount',
    'bukti_pengiriman_url', 'shipped_at', 'canceled_at',
    'cancel_reason', 'refund_status', 'refund_amount',
    'dibatalkan_oleh', 'payment_approved_by', 'payment_approved_at',
    'payment_review_count', 'status_bukti', 'bukti_pembayaran'
  );
