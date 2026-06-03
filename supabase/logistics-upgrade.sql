-- ============================================
-- HOMEBITE LOGISTICS & OPERATIONS UPGRADE
-- Jalankan di Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: Update orders table
-- ============================================

-- 1a. Remove old CHECK constraint and add expanded statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'menunggu_ongkir', 'menunggu_pembayaran', 'lunas',
    'siap_dikirim', 'dijemput', 'dikirim', 'selesai', 'dibatalkan'
  ));

-- 1b. Add logistics columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_vehicle VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_plate VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_allocated_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eta_minutes INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qr_scanned BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qr_scanned_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.driver_name IS 'Nama driver ojol yang dialokasikan';
COMMENT ON COLUMN orders.driver_phone IS 'Nomor telepon driver';
COMMENT ON COLUMN orders.driver_vehicle IS 'Jenis kendaraan driver';
COMMENT ON COLUMN orders.driver_plate IS 'Plat nomor kendaraan driver';
COMMENT ON COLUMN orders.driver_allocated_at IS 'Waktu driver dialokasikan';
COMMENT ON COLUMN orders.pickup_at IS 'Waktu driver menjemput paket di mitra';
COMMENT ON COLUMN orders.eta_minutes IS 'Estimasi waktu tiba dalam menit';
COMMENT ON COLUMN orders.qr_scanned IS 'Apakah QR code sudah dipindai driver';
COMMENT ON COLUMN orders.qr_scanned_at IS 'Waktu QR code dipindai';
COMMENT ON COLUMN orders.ready_at IS 'Waktu mitra menandai pesanan siap kirim';

-- ============================================
-- PART 2: Update reviews table (moderasi)
-- ============================================

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_status_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES users(id);

COMMENT ON COLUMN reviews.status IS 'Status moderasi: pending/approved/rejected';
COMMENT ON COLUMN reviews.moderated_at IS 'Waktu review dimoderasi';
COMMENT ON COLUMN reviews.moderated_by IS 'Admin yang memoderasi';

-- ============================================
-- PART 3: Create conflicts table
-- ============================================

CREATE TABLE IF NOT EXISTS conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  nomor_pesanan VARCHAR(100),
  customer_id UUID REFERENCES users(id),
  mitra_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  resolution TEXT,
  refund_amount NUMERIC DEFAULT 0,
  total_bayar NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

-- Add CHECK constraints separately to avoid errors if table already exists
ALTER TABLE conflicts DROP CONSTRAINT IF EXISTS conflicts_type_check;
ALTER TABLE conflicts ADD CONSTRAINT conflicts_type_check
  CHECK (type IN ('produk_rusak', 'driver_cancel', 'pesanan_salah', 'terlambat', 'lainnya'));

ALTER TABLE conflicts DROP CONSTRAINT IF EXISTS conflicts_priority_check;
ALTER TABLE conflicts ADD CONSTRAINT conflicts_priority_check
  CHECK (priority IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE conflicts DROP CONSTRAINT IF EXISTS conflicts_status_check;
ALTER TABLE conflicts ADD CONSTRAINT conflicts_status_check
  CHECK (status IN ('open', 'investigating', 'resolved'));

-- ============================================
-- PART 4: RLS Policies
-- ============================================

-- Conflicts RLS
ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer create conflict" ON conflicts;
CREATE POLICY "Customer create conflict" ON conflicts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customer view own conflicts" ON conflicts;
CREATE POLICY "Customer view own conflicts" ON conflicts
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Mitra view own conflicts" ON conflicts;
CREATE POLICY "Mitra view own conflicts" ON conflicts
  FOR SELECT TO authenticated
  USING (auth.uid() = mitra_id);

DROP POLICY IF EXISTS "Admin manage conflicts" ON conflicts;
CREATE POLICY "Admin manage conflicts" ON conflicts
  FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Reviews: admin moderation policy
DROP POLICY IF EXISTS "Admin moderate reviews" ON reviews;
CREATE POLICY "Admin moderate reviews" ON reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Admin: read all reviews (for moderation page)
DROP POLICY IF EXISTS "Admin read all reviews" ON reviews;
CREATE POLICY "Admin read all reviews" ON reviews
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Admin: read all orders (for logistics page)
DROP POLICY IF EXISTS "Admin view all orders" ON orders;
CREATE POLICY "Admin view all orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Admin: update all orders (for logistics management)
DROP POLICY IF EXISTS "Admin update all orders" ON orders;
CREATE POLICY "Admin update all orders" ON orders
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================
-- PART 5: Update order status trigger
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

  -- When order marked as ready (siap_dikirim)
  IF OLD.status IS DISTINCT FROM 'siap_dikirim' AND NEW.status = 'siap_dikirim' THEN
    NEW.ready_at = NOW();
    
    -- Notify customer
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      VALUES (
        NEW.customer_id,
        '📦 Pesanan Siap Dikirim',
        mitra_name || ' telah menyiapkan pesanan ' || NEW.nomor_pesanan || '. Menunggu driver penjemputan.',
        'info', '/pesanan', false
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  -- When driver allocated (dijemput)
  IF OLD.status IS DISTINCT FROM 'dijemput' AND NEW.status = 'dijemput' THEN
    NEW.pickup_at = NOW();
    
    -- Notify customer
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      VALUES (
        NEW.customer_id,
        '🏍️ Driver Sedang Menjemput',
        'Driver ' || COALESCE(NEW.driver_name, '') || ' sedang menuju ' || mitra_name || ' untuk menjemput pesanan ' || NEW.nomor_pesanan || '.',
        'info', '/pesanan', false
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Notify mitra
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      VALUES (
        NEW.mitra_id,
        '🏍️ Driver Dalam Perjalanan',
        'Driver ' || COALESCE(NEW.driver_name, '') || ' (' || COALESCE(NEW.driver_vehicle, '') || ' - ' || COALESCE(NEW.driver_plate, '') || ') sedang menuju lokasi Anda. ETA: ' || COALESCE(NEW.eta_minutes::TEXT, '?') || ' menit.',
        'info', '/mitra-dashboard/pesanan', false
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  -- Set auto_complete_at when order status becomes 'dikirim'
  IF OLD.status IS DISTINCT FROM 'dikirim' AND NEW.status = 'dikirim' THEN
    NEW.auto_complete_at = NOW() + INTERVAL '3 days';
    NEW.shipped_at = NOW();

    -- Notify customer
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      VALUES (
        NEW.customer_id,
        '🚚 Pesanan Sedang Dikirim',
        'Driver ' || COALESCE(NEW.driver_name, '') || ' sedang mengantar pesanan ' || NEW.nomor_pesanan || ' ke alamat Anda.',
        'info', '/pesanan', false
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  -- When order status changes to 'selesai' (auto or manual)
  IF (OLD.status != 'selesai' AND NEW.status = 'selesai') THEN
    -- Calculate commission and payout
    SELECT COALESCE(SUM(jumlah), 0) INTO total_item
    FROM order_items
    WHERE order_id = NEW.id;

    komisi = total_item * 500; -- Rp500 per item
    dana_mitra = COALESCE(NEW.total_bayar, 0) - komisi;

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

    -- Notify customer
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      VALUES (
        NEW.customer_id,
        '✅ Pesanan Selesai',
        'Pesanan ' || NEW.nomor_pesanan || ' telah selesai. Terima kasih telah berbelanja!',
        'success', '/pesanan', false
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Notify mitra
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      VALUES (
        NEW.mitra_id,
        '💰 Dana Masuk ke Saldo',
        'Dana Rp ' || dana_mitra || ' dari pesanan ' || NEW.nomor_pesanan || ' telah masuk ke saldo Anda.',
        'success', '/mitra-dashboard/pencairan', false
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
DROP TRIGGER IF EXISTS tr_order_status_change ON orders;
CREATE TRIGGER tr_order_status_change
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_status_change();

-- ============================================
-- PART 6: Performance Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(status);
CREATE INDEX IF NOT EXISTS idx_conflicts_order ON conflicts(order_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_customer ON conflicts(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_allocated ON orders(driver_allocated_at) WHERE driver_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_ready_at ON orders(ready_at) WHERE status = 'siap_dikirim';
CREATE INDEX IF NOT EXISTS idx_orders_qr_scanned ON orders(qr_scanned) WHERE qr_scanned = true;

-- ============================================
-- PART 7: Verify setup
-- ============================================

SELECT 'Column orders.driver_name' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'driver_name'

UNION ALL

SELECT 'Column reviews.status',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'status'

UNION ALL

SELECT 'Table conflicts',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.tables WHERE table_name = 'conflicts'

UNION ALL

SELECT 'Trigger tr_order_status_change',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM pg_trigger WHERE tgname = 'tr_order_status_change';

-- ============================================
-- ✅ SELESAI! Jalankan SQL ini di Supabase SQL Editor
-- ============================================
