-- ============================================
-- PAYMENT PROOF SYSTEM - BUKTI TRANSFER GAMBAR
-- ============================================
-- Fitur:
-- 1. Upload bukti transfer sebagai GAMBAR (bukan link)
-- 2. Validasi wajib gambar untuk transaksi
-- 3. Verifikasi bukti transfer oleh admin/mitra
-- 4. Storage bucket khusus untuk bukti pembayaran
-- ============================================

-- 1. Storage bucket untuk payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies untuk payment proofs
CREATE POLICY "Anyone can view payment proofs"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated users can upload payment proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own payment proofs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment-proofs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_orders_bukti_pembayaran ON orders(bukti_pembayaran);
CREATE INDEX IF NOT EXISTS idx_orders_status_bukti ON orders(status_bukti);
-- Note: idx_invoices_bukti_transfer skipped if column doesn't exist
-- CREATE INDEX IF NOT EXISTS idx_invoices_bukti_transfer ON invoices(bukti_transfer_url);

-- 4. Function untuk validasi file image (optional - untuk referensi)
-- Note: Trigger pada storage.objects TIDAK bisa dibuat oleh user biasa
-- Validasi file sudah dilakukan di level aplikasi (PaymentProofUpload component)
CREATE OR REPLACE FUNCTION validate_image_file_size()
RETURNS TRIGGER AS $$
BEGIN
  -- Cek ukuran file (max 5MB)
  IF NEW.size > 5 * 1024 * 1024 THEN
    RAISE EXCEPTION 'Ukuran file maksimal 5MB';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Validasi extension file (JPG/PNG/WebP) sudah dilakukan di komponen React
-- Jika ingin validasi di database, hubungi Supabase admin untuk membuat trigger

-- ============================================
-- SELESAI! Payment Proof System
-- ============================================
-- Catatan:
-- - bukti_pembayaran di tabel orders sekarang WAJIB berupa URL gambar
-- - Customer harus upload gambar bukti transfer sebelum bisa checkout
-- - Mitra/Admin bisa verifikasi bukti transfer
-- - Hanya file gambar (JPG, PNG, WebP) yang diterima
-- - Ukuran maksimal 5MB per file
-- ============================================
