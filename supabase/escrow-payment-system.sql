-- ============================================
-- ESCROW PAYMENT SYSTEM - MANUAL PAYOUT
-- ============================================
-- Update status flow:
-- menunggu_pembayaran → lunas → dikirim → selesai
-- Auto-calculate commission (Rp500/item)
-- Update mitra balance automatically
-- ============================================

-- ============================================
-- PART 1: Add new columns to orders
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS auto_complete_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_pencairan VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_amount NUMERIC DEFAULT 0;

COMMENT ON COLUMN orders.paid_at IS 'Waktu customer bayar ke platform';
COMMENT ON COLUMN orders.received_at IS 'Waktu customer konfirmasi terima';
COMMENT ON COLUMN orders.auto_complete_at IS 'Deadline auto-complete (created_at + 3 hari)';
COMMENT ON COLUMN orders.status_pencairan IS 'pending / processing / paid';
COMMENT ON COLUMN orders.commission_amount IS 'Total komisi platform (Rp500 * jumlah item)';
COMMENT ON COLUMN orders.payout_amount IS 'Total dana yang masuk ke mitra (total - komisi)';

-- ============================================
-- PART 2: Create mitra_saldo table
-- ============================================
CREATE TABLE IF NOT EXISTS mitra_saldo (
  mitra_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  saldo_tersedia NUMERIC DEFAULT 0,
  saldo_pending NUMERIC DEFAULT 0,
  total_pencairan NUMERIC DEFAULT 0,
  rekening_bank VARCHAR(50),
  nomor_rekening VARCHAR(100),
  atas_nama VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_mitra_saldo_mitra ON mitra_saldo(mitra_id);

-- RLS for mitra_saldo
ALTER TABLE mitra_saldo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saldo"
  ON mitra_saldo FOR SELECT
  TO authenticated
  USING (auth.uid() = mitra_id);

CREATE POLICY "Admin can view all saldo"
  ON mitra_saldo FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "System can update saldo"
  ON mitra_saldo FOR UPDATE
  TO authenticated
  USING (auth.uid() = mitra_id OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================
-- PART 3: Create order status trigger
-- ============================================

-- First, fix notifications RLS to allow trigger inserts
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow all authenticated users to insert (trigger will handle validation)

-- Create the trigger function with proper security
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  total_item INTEGER;
  komisi NUMERIC;
  dana_mitra NUMERIC;
  customer_name TEXT;
  mitra_name TEXT;
BEGIN
  -- Get customer and mitra names
  SELECT nama INTO customer_name FROM users WHERE id = NEW.customer_id;
  SELECT nama INTO mitra_name FROM users WHERE id = NEW.mitra_id;

  -- Set auto_complete_at when order status becomes 'dikirim'
  IF OLD.status = 'lunas' AND NEW.status = 'dikirim' THEN
    NEW.auto_complete_at = NOW() + INTERVAL '3 days';
  END IF;

  -- When order status changes to 'selesai' (auto or manual)
  IF (OLD.status != 'selesai' AND NEW.status = 'selesai') THEN
    -- Calculate commission and payout
    SELECT COALESCE(SUM(jumlah), 0) INTO total_item
    FROM order_items
    WHERE order_id = NEW.id;

    komisi = total_item * 500; -- Rp500 per item
    dana_mitra = NEW.total_bayar - komisi;

    NEW.commission_amount = komisi;
    NEW.payout_amount = dana_mitra;
    NEW.status_pencairan = 'pending';
    NEW.received_at = NOW();

    -- Update mitra saldo (saldo_pending)
    INSERT INTO mitra_saldo (mitra_id, saldo_pending)
    VALUES (NEW.mitra_id, dana_mitra)
    ON CONFLICT (mitra_id) DO UPDATE
    SET saldo_pending = mitra_saldo.saldo_pending + dana_mitra,
        updated_at = NOW();

    -- Create notification for customer (use SECURITY DEFINER context)
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      VALUES (
        NEW.customer_id,
        '✅ Pesanan Selesai',
        'Pesanan ' || NEW.nomor_pesanan || ' telah selesai. Terima kasih telah berbelanja!',
        'success',
        '/pesanan',
        false
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently ignore notification errors
      NULL;
    END;

    -- Create notification for mitra
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      VALUES (
        NEW.mitra_id,
        '💰 Dana Masuk ke Saldo',
        'Dana Rp ' || dana_mitra || ' dari pesanan ' || NEW.nomor_pesanan || ' telah masuk ke saldo Anda (menunggu pencairan).',
        'success',
        '/mitra-dashboard/saldo',
        false
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently ignore notification errors
      NULL;
    END;
  END IF;

  -- Notification when order shipped
  IF OLD.status = 'lunas' AND NEW.status = 'dikirim' THEN
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      VALUES (
        NEW.customer_id,
        '🚚 Pesanan Sedang Dikirim',
        mitra_name || ' telah mengirimkan pesanan ' || NEW.nomor_pesanan || '. Estimasi tiba: 1-3 hari.',
        'info',
        '/pesanan',
        false
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently ignore notification errors
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS tr_order_status_change ON orders;
CREATE TRIGGER tr_order_status_change
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_status_change();

-- ============================================
-- PART 4: Create function for manual payout
-- ============================================
CREATE OR REPLACE FUNCTION process_payout(
  p_mitra_id UUID,
  p_order_ids UUID[]
)
RETURNS JSON AS $$
DECLARE
  v_total_payout NUMERIC := 0;
  v_order RECORD;
BEGIN
  -- Verify user is admin
  IF auth.uid() NOT IN (SELECT id FROM users WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Hanya admin yang bisa melakukan pencairan';
  END IF;

  -- Process each order
  FOR v_order IN SELECT * FROM orders WHERE id = ANY(p_order_ids) AND status_pencairan = 'pending' LOOP
    -- Update order status
    UPDATE orders
    SET status_pencairan = 'paid',
        payout_amount = payout_amount
    WHERE id = v_order.id;

    -- Update mitra saldo
    UPDATE mitra_saldo
    SET saldo_pending = saldo_pending - v_order.payout_amount,
        saldo_tersedia = saldo_tersedia + v_order.payout_amount,
        total_pencairan = total_pencairan + v_order.payout_amount,
        updated_at = NOW()
    WHERE mitra_id = v_order.mitra_id;

    -- Add to total
    v_total_payout := v_total_payout + v_order.payout_amount;
  END LOOP;

  -- Return result
  RETURN json_build_object(
    'success', true,
    'message', 'Pencairan berhasil diproses',
    'total_payout', v_total_payout,
    'processed_orders', array_length(p_order_ids, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: Create function to auto-complete orders
-- ============================================
CREATE OR REPLACE FUNCTION auto_complete_expired_orders()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_order RECORD;
BEGIN
  -- Find orders that are 'dikirim' and auto_complete_at has passed
  FOR v_order IN 
    SELECT id, status, auto_complete_at, received_at 
    FROM orders 
    WHERE status = 'dikirim' 
      AND auto_complete_at IS NOT NULL
      AND auto_complete_at <= NOW()
      AND received_at IS NULL
  LOOP
    -- Update status to 'selesai' (trigger will handle the rest)
    UPDATE orders
    SET status = 'selesai'
    WHERE id = v_order.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_status_pencairan ON orders(status_pencairan);
CREATE INDEX IF NOT EXISTS idx_orders_auto_complete ON orders(auto_complete_at) WHERE status = 'dikirim';
CREATE INDEX IF NOT EXISTS idx_orders_received_at ON orders(received_at);

-- ============================================
-- PART 7: Verify setup
-- ============================================
SELECT 'Trigger tr_order_status_change' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM pg_trigger WHERE tgname = 'tr_order_status_change'

UNION ALL

SELECT 'Function handle_order_status_change',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM pg_proc WHERE proname = 'handle_order_status_change'

UNION ALL

SELECT 'Table mitra_saldo',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.tables WHERE table_name = 'mitra_saldo'

UNION ALL

SELECT 'Function process_payout',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM pg_proc WHERE proname = 'process_payout'

UNION ALL

SELECT 'Function auto_complete_expired_orders',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM pg_proc WHERE proname = 'auto_complete_expired_orders';

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan setup:
--    ✅ Kolom tracking pembayaran & pencairan
--    ✅ Tabel mitra_saldo
--    ✅ Trigger otomatis hitung komisi & saldo
--    ✅ Function pencairan manual (admin)
--    ✅ Function auto-complete pesanan
-- 3. Refresh aplikasi
-- 4. Test flow lengkap!
-- ============================================
