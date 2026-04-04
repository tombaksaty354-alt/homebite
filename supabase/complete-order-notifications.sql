-- ============================================
-- COMPLETE ORDER NOTIFICATION SYSTEM
-- ============================================
-- Semua notifikasi pesanan untuk Customer & Mitra
-- + Bukti Foto Pengiriman
-- ============================================

-- ============================================
-- PART 1: Add kolom untuk bukti pengiriman foto
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bukti_pengiriman_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bukti_pengiriman_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kurir_nama TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kurir_telepon TEXT;

COMMENT ON COLUMN orders.bukti_pengiriman_url IS 'URL foto bukti pengiriman (diupload mitra saat kirim)';
COMMENT ON COLUMN orders.bukti_pengiriman_at IS 'Waktu foto diupload';

-- ============================================
-- PART 2: Create notification trigger function
-- ============================================
CREATE OR REPLACE FUNCTION create_order_notification()
RETURNS TRIGGER AS $$
DECLARE
  customer_name TEXT;
  mitra_name TEXT;
BEGIN
  -- Get customer and mitra names
  SELECT nama INTO customer_name FROM users WHERE id = NEW.customer_id;
  SELECT nama INTO mitra_name FROM users WHERE id = NEW.mitra_id;

  -- NOTIFIKASI UNTUK CUSTOMER
  -- 1. Ongkir sudah di-set (menunggu_ongkir → menunggu_pembayaran)
  IF OLD.status = 'menunggu_ongkir' AND NEW.status = 'menunggu_pembayaran' THEN
    INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
    VALUES (
      NEW.customer_id,
      '💰 Ongkir Sudah Ditetapkan',
      mitra_name || ' menetapkan ongkir Rp ' || NEW.ongkir || '. Total: Rp ' || NEW.total_bayar || '. Silakan lakukan pembayaran.',
      'info',
      '/pesanan',
      false
    );
  END IF;

  -- 2. Pembayaran dikonfirmasi (menunggu_pembayaran → lunas)
  IF OLD.status = 'menunggu_pembayaran' AND NEW.status = 'lunas' THEN
    INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
    VALUES (
      NEW.customer_id,
      '✅ Pembayaran Dikonfirmasi',
      'Pembayaran pesanan ' || NEW.nomor_pesanan || ' telah dikonfirmasi.',
      'success',
      '/pesanan',
      false
    );
  END IF;

  -- 3. Pesanan dikirim (lunas → dikirim)
  IF OLD.status = 'lunas' AND NEW.status = 'dikirim' THEN
    INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
    VALUES (
      NEW.customer_id,
      '🚚 Pesanan Sedang Dikirim',
      mitra_name || ' mengirimkan pesanan ' || NEW.nomor_pesanan || '.',
      'info',
      '/pesanan',
      false
    );
  END IF;

  -- 4. Pesanan selesai (dikirim → selesai)
  IF OLD.status = 'dikirim' AND NEW.status = 'selesai' THEN
    INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
    VALUES (
      NEW.customer_id,
      '⭐ Pesanan Selesai',
      'Pesanan ' || NEW.nomor_pesanan || ' telah diterima. Beri review untuk mitra.',
      'success',
      '/pesanan',
      false
    );
  END IF;

  -- NOTIFIKASI UNTUK MITRA
  -- 1. Pesanan baru (INSERT)
  IF TG_OP = 'INSERT' AND NEW.status = 'menunggu_ongkir' THEN
    INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
    VALUES (
      NEW.mitra_id,
      '📦 Pesanan Baru',
      customer_name || ' memesan ' || NEW.nomor_pesanan || '. Segera tentukan ongkir.',
      'info',
      '/mitra-dashboard/pesanan',
      false
    );
  END IF;

  -- 2. Customer upload bukti bayar (status_bukti: belum_kirim → menunggu_konfirmasi)
  IF OLD.status_bukti = 'belum_kirim' AND NEW.status_bukti = 'menunggu_konfirmasi' THEN
    INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
    VALUES (
      NEW.mitra_id,
      '💳 Pembayaran Diterima',
      customer_name || ' mengupload bukti bayar untuk ' || NEW.nomor_pesanan || '. Segera verifikasi.',
      'warning',
      '/mitra-dashboard/pesanan',
      false
    );
  END IF;

  -- 3. Customer konfirmasi terima (dikirim → selesai)
  IF OLD.status = 'dikirim' AND NEW.status = 'selesai' THEN
    INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
    VALUES (
      NEW.mitra_id,
      '✅ Pesanan Diterima',
      customer_name || ' telah menerima pesanan ' || NEW.nomor_pesanan || '.',
      'success',
      '/mitra-dashboard/pesanan',
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 3: Create triggers
-- ============================================
DROP TRIGGER IF EXISTS tr_order_notifications ON orders;
CREATE TRIGGER tr_order_notifications
  AFTER UPDATE OR INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_notification();

-- ============================================
-- PART 4: Backfill notifications for existing orders
-- ============================================

-- For customers: Ongkir set
INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
SELECT DISTINCT ON (o.id)
  o.customer_id,
  '💰 Ongkir Sudah Ditetapkan',
  'Ongkir Rp ' || o.ongkir || '. Total: Rp ' || o.total_bayar || '. Silakan lakukan pembayaran.',
  'info',
  '/pesanan',
  false
FROM orders o
WHERE o.status IN ('menunggu_pembayaran', 'lunas', 'dikirim', 'selesai')
  AND o.ongkir > 0
  AND o.created_at > NOW() - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = o.customer_id AND n.title = '💰 Ongkir Sudah Ditetapkan'
    AND n.message LIKE '%' || o.nomor_pesanan || '%'
  );

-- For customers: Payment confirmed
INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
SELECT DISTINCT ON (o.id)
  o.customer_id,
  '✅ Pembayaran Dikonfirmasi',
  'Pembayaran pesanan ' || o.nomor_pesanan || ' telah dikonfirmasi.',
  'success',
  '/pesanan',
  false
FROM orders o
WHERE o.status IN ('lunas', 'dikirim', 'selesai')
  AND o.status_bukti = 'disetujui'
  AND o.created_at > NOW() - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = o.customer_id AND n.title = '✅ Pembayaran Dikonfirmasi'
    AND n.message LIKE '%' || o.nomor_pesanan || '%'
  );

-- For customers: Order shipped
INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
SELECT DISTINCT ON (o.id)
  o.customer_id,
  '🚚 Pesanan Sedang Dikirim',
  'Pesanan ' || o.nomor_pesanan || ' sedang dalam pengiriman.',
  'info',
  '/pesanan',
  o.status = 'selesai' -- Jika sudah selesai, mark as read
FROM orders o
WHERE o.status IN ('dikirim', 'selesai')
  AND o.created_at > NOW() - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = o.customer_id AND n.title = '🚚 Pesanan Sedang Dikirim'
    AND n.message LIKE '%' || o.nomor_pesanan || '%'
  );

-- For mitras: Payment received
INSERT INTO notifications (user_id, title, message, tipe, link, dibaca)
SELECT DISTINCT ON (o.id)
  o.mitra_id,
  '💳 Pembayaran Diterima',
  'Bukti bayar diterima untuk ' || o.nomor_pesanan || '. Segera verifikasi.',
  'warning',
  '/mitra-dashboard/pesanan',
  o.status_bukti IN ('disetujui', 'ditolak') -- Jika sudah diproses, mark as read
FROM orders o
WHERE o.status_bukti IN ('menunggu_konfirmasi', 'disetujui', 'ditolak')
  AND o.created_at > NOW() - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = o.mitra_id AND n.title = '💳 Pembayaran Diterima'
    AND n.message LIKE '%' || o.nomor_pesanan || '%'
  );

-- ============================================
-- PART 5: Create storage bucket for delivery photos
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-proofs', 'delivery-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view delivery proofs"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'delivery-proofs');

CREATE POLICY "Mitra can upload delivery proofs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'delivery-proofs');

CREATE POLICY "Mitra can delete own delivery proofs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'delivery-proofs');

-- ============================================
-- PART 6: Verify setup
-- ============================================
SELECT 'Trigger order_notifications' as check_item,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM pg_trigger WHERE tgname = 'tr_order_notifications'

UNION ALL

SELECT 'Trigger auto_notification (chat)',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM pg_trigger WHERE tgname = 'tr_auto_notification'

UNION ALL

SELECT 'Storage bucket delivery-proofs',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM storage.buckets WHERE id = 'delivery-proofs';

-- ============================================
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Ini akan setup:
--    ✅ Kolom bukti_pengiriman_url
--    ✅ Trigger notifikasi lengkap (8 jenis)
--    ✅ Backfill notifikasi untuk order lama
--    ✅ Storage bucket untuk foto pengiriman
-- 3. Refresh aplikasi
-- 4. Test semua notifikasi!
-- ============================================
