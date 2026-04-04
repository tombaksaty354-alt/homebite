-- ============================================
-- UPDATE TABEL CALON MITRA
-- ============================================

-- Tambah kolom password
ALTER TABLE calon_mitra_applications ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- ============================================
-- SELESAI!
-- ============================================
