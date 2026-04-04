-- ============================================
-- COMPLETE ESCROW SYSTEM - FINAL VERSION
-- ============================================
-- Flow: Order → Ongkir → Bayar ke Platform → Verifikasi → Kirim → Selesai → Payout
-- Komisi otomatis dipotong Rp500/item saat payout
-- ============================================

-- ============================================
-- PART 1: Drop old commission billing system
-- ============================================
-- Hapus tabel invoice/tagihan komisi lama
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;

-- ============================================
-- PART 2: Create platform_rekening table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS platform_rekening (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank VARCHAR(100) NOT NULL,
  nomor VARCHAR(100) NOT NULL,
  atas_nama VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for platform_rekening
ALTER TABLE platform_rekening ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active rekening" ON platform_rekening;
CREATE POLICY "Anyone can view active rekening"
  ON platform_rekening FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin can manage rekening" ON platform_rekening;
CREATE POLICY "Admin can manage rekening"
  ON platform_rekening FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================
-- PART 3: Create customer_rekening table (untuk refund)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_rekening (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank VARCHAR(100) NOT NULL,
  nomor VARCHAR(100) NOT NULL,
  atas_nama VARCHAR(200) NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bank, nomor)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_customer_rekening_user ON customer_rekening(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_rekening_primary ON customer_rekening(user_id, is_primary) WHERE is_primary = true;

-- RLS
ALTER TABLE customer_rekening ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rekening" ON customer_rekening;
CREATE POLICY "Users can view own rekening"
  ON customer_rekening FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own rekening" ON customer_rekening;
CREATE POLICY "Users can manage own rekening"
  ON customer_rekening FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 4: Update orders table
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS auto_complete_at TIMESTAMP WITH TIME ZONE;
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

COMMENT ON COLUMN orders.paid_at IS 'Waktu customer bayar ke platform';
COMMENT ON COLUMN orders.received_at IS 'Waktu customer konfirmasi terima';
COMMENT ON COLUMN orders.auto_complete_at IS 'Deadline auto-complete (shipped_at + 3 hari)';
COMMENT ON COLUMN orders.status_pencairan IS 'pending / processing / paid';
COMMENT ON COLUMN orders.commission_amount IS 'Total komisi platform (Rp500 * jumlah item)';
COMMENT ON COLUMN orders.payout_amount IS 'Total dana yang masuk ke mitra (total - komisi)';
COMMENT ON COLUMN orders.bukti_pengiriman_url IS 'URL foto bukti pengiriman (diupload mitra saat kirim)';
COMMENT ON COLUMN orders.canceled_at IS 'Waktu pesanan dibatalkan';
COMMENT ON COLUMN orders.cancel_reason IS 'Alasan pembatalan';
COMMENT ON COLUMN orders.refund_status IS 'none / pending / processed';
COMMENT ON COLUMN orders.refund_rekening_id IS 'Rekening tujuan refund';

-- ============================================
-- PART 5: Create mitra_saldo table (if not exists)
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

CREATE INDEX IF NOT EXISTS idx_mitra_saldo_mitra ON mitra_saldo(mitra_id);

-- RLS for mitra_saldo
ALTER TABLE mitra_saldo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saldo" ON mitra_saldo;
CREATE POLICY "Users can view own saldo"
  ON mitra_saldo FOR SELECT
  TO authenticated
  USING (auth.uid() = mitra_id);

DROP POLICY IF EXISTS "Admin can view all saldo" ON mitra_saldo;
CREATE POLICY "Admin can view all saldo"
  ON mitra_saldo FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================
-- PART 6: Fix notifications RLS
-- ============================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON notifications;
CREATE POLICY "Enable insert for authenticated users"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for users based on user_id" ON notifications;
CREATE POLICY "Enable select for users based on user_id"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON notifications;
CREATE POLICY "Enable update for users based on user_id"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON notifications;
CREATE POLICY "Enable delete for users based on user_id"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- PART 7: Create trigger function for order status
-- ============================================
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

    -- Create notification for customer
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
    EXCEPTION WHEN OTHERS THEN NULL; END;

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
    EXCEPTION WHEN OTHERS THEN NULL; END;
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
    EXCEPTION WHEN OTHERS THEN NULL; END;
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
-- PART 8: Create function for manual payout
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
-- PART 9: Create function to auto-complete orders
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
-- PART 10: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_status_pencairan ON orders(status_pencairan);
CREATE INDEX IF NOT EXISTS idx_orders_auto_complete ON orders(auto_complete_at) WHERE status = 'dikirim';
CREATE INDEX IF NOT EXISTS idx_orders_received_at ON orders(received_at);
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON orders(refund_status);

-- ============================================
-- PART 11: Insert default platform rekening
-- ============================================
INSERT INTO platform_rekening (bank, nomor, atas_nama, is_active) VALUES
  ('BCA', '1234567890', 'PT Homebite Indonesia', true),
  ('Mandiri', '0987654321', 'PT Homebite Indonesia', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- PART 12: Verify setup
-- ============================================
SELECT 'Table platform_rekening' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables WHERE table_name = 'platform_rekening'

UNION ALL

SELECT 'Table customer_rekening',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.tables WHERE table_name = 'customer_rekening'

UNION ALL

SELECT 'Table mitra_saldo',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.tables WHERE table_name = 'mitra_saldo'

UNION ALL

SELECT 'Trigger tr_order_status_change',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM pg_trigger WHERE tgname = 'tr_order_status_change'

UNION ALL

SELECT 'Function process_payout',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM pg_proc WHERE proname = 'process_payout';

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan:
--    ✅ Hapus sistem tagihan komisi lama
--    ✅ Buat tabel platform_rekening & customer_rekening
--    ✅ Setup trigger otomatis untuk escrow
--    ✅ Fix RLS policies
-- 3. Refresh aplikasi
-- 4. Test flow lengkap!
-- ============================================
