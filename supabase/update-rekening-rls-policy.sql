-- ============================================
-- UPDATE RLS POLICY - REKENING MITRA
-- ============================================
-- Menambahkan policy agar customer bisa melihat rekening mitra
-- ============================================

-- Drop policy lama jika ada (untuk menghindari duplikasi)
DROP POLICY IF EXISTS "Customer dapat melihat rekening mitra" ON rekening_mitra;

-- Policy: Customer bisa melihat rekening mitra (untuk pembayaran)
CREATE POLICY "Customer dapat melihat rekening mitra"
  ON rekening_mitra
  FOR SELECT
  USING (true);

-- Verification query
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'rekening_mitra';
