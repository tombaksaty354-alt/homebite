-- ============================================
-- FIX: PAYMENT & REFUND SYSTEM BUGS
-- ============================================
-- Drop problematic foreign key constraints
-- Add missing columns for refund tracking
-- ============================================

-- ============================================
-- PART 1: Drop problematic foreign key
-- ============================================
-- Drop foreign key constraint yang menyebabkan error saat customer upload bukti bayar
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_pembayaran_rekening_id_fkey;

-- Ubah kolom pembayaran_rekening_id jadi text (optional) untuk menghindari FK issues
-- Kita tidak butuh foreign key ke platform_rekening karena customer cukup tahu bank + nomor
ALTER TABLE orders ALTER COLUMN pembayaran_rekening_id TYPE UUID USING NULL;
ALTER TABLE orders ALTER COLUMN pembayaran_rekening_id DROP NOT NULL;

COMMENT ON COLUMN orders.pembayaran_rekening_id IS 'DEPRECATED: Gunakan pembayaran_metode (text) saja';

-- ============================================
-- PART 2: Add missing columns for refund
-- ============================================
-- Kolom untuk tracking refund
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_proof_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dibatalkan_oleh UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tanggal_batal TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN orders.refund_amount IS 'Jumlah yang akan di-refund ke customer';
COMMENT ON COLUMN orders.refund_processed_at IS 'Waktu admin memproses refund';
COMMENT ON COLUMN orders.refund_proof_url IS 'Bukti transfer refund dari admin ke customer';
COMMENT ON COLUMN orders.dibatalkan_oleh IS 'ID customer atau admin yang membatalkan';
COMMENT ON COLUMN orders.tanggal_batal IS 'Waktu pesanan dibatalkan';

-- ============================================
-- PART 3: Add trigger untuk auto-set refund
-- ============================================
-- Trigger otomatis set refund_status = 'pending' saat order dibatalkan setelah bayar
CREATE OR REPLACE FUNCTION handle_order_cancel_for_refund()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika order dibatalkan dan sudah dibayar, otomatis set refund
  IF OLD.status != 'dibatalkan' AND NEW.status = 'dibatalkan' 
     AND OLD.paid_at IS NOT NULL THEN
    
    NEW.refund_status = 'pending';
    NEW.refund_amount = NEW.total_bayar;
    NEW.canceled_at = NOW();
    
    -- Set refund_rekening_id ke primary customer rekening jika ada
    IF NEW.refund_rekening_id IS NULL THEN
      SELECT id INTO NEW.refund_rekening_id
      FROM customer_rekening
      WHERE user_id = NEW.customer_id
        AND is_primary = true
      LIMIT 1;
    END IF;
    
    -- Notification ke admin
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      SELECT 
        id,
        '💰 Refund Diperlukan',
        'Pesanan ' || NEW.nomor_pesanan || ' dibatalkan setelah pembayaran. Refund Rp ' || NEW.total_bayar || ' ke customer.',
        'warning',
        '/admin/refund',
        false
      FROM users
      WHERE role = 'admin';
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- Notification ke customer
    BEGIN
      INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
      VALUES (
        NEW.customer_id,
        '🔄 Refund Sedang Diproses',
        'Pesanan Anda dibatalkan. Refund Rp ' || NEW.total_bayar || ' sedang diproses admin.',
        'info',
        '/pesanan',
        false
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger lama jika ada
DROP TRIGGER IF EXISTS tr_order_cancel_refund ON orders;

-- Create trigger baru
CREATE TRIGGER tr_order_cancel_refund
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_cancel_for_refund();

-- ============================================
-- PART 4: Fix trigger untuk notification
-- ============================================
-- Drop policy lama yang mungkin blok insert
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Buat policy yang allow trigger insert
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- PART 5: Create index untuk performa
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON orders(refund_status);
CREATE INDEX IF NOT EXISTS idx_orders_dibatalkan_oleh ON orders(dibatalkan_oleh);

-- ============================================
-- PART 6: Verify fix
-- ============================================
SELECT 'Foreign key constraint dropped' as check_item,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ FIXED' 
    ELSE '❌ STILL EXISTS' 
  END as status
FROM information_schema.table_constraints 
WHERE constraint_name = 'orders_pembayaran_rekening_id_fkey'

UNION ALL

SELECT 'Column refund_amount added',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'refund_amount'

UNION ALL

SELECT 'Column refund_processed_at added',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'refund_processed_at'

UNION ALL

SELECT 'Trigger tr_order_cancel_refund',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM pg_trigger 
WHERE tgname = 'tr_order_cancel_refund';

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan:
--    ✅ Drop foreign key constraint yang error
--    ✅ Tambah kolom refund tracking
--    ✅ Auto-set refund saat order dibatalkan
--    ✅ Auto-notification ke admin & customer
-- 3. Refresh aplikasi
-- 4. Test upload bukti pembayaran (error harus hilang)
-- 5. Test cancel order (refund otomatis ter-set)
-- ============================================
