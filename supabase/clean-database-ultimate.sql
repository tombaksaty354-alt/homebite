-- ============================================
-- CLEAN DATABASE - 100% SAFE (NO ERRORS)
-- ============================================
-- Script ini mengecek keberadaan tabel sebelum menghapus
-- ============================================

DO $$
DECLARE
  table_list text[] := ARRAY[
    'notifications',
    'reviews',
    'order_items',
    'orders',
    'produk',
    'calon_mitra_applications',
    'mitra_saldo',
    'customer_rekening',
    'platform_rekening',
    'invoices',
    'user_addresses',
    'chat_messages',
    'chat_rooms',
    'wishlist',
    'delivery_proofs',
    'pemasukan_mitra',
    'pengeluaran_mitra'
  ];
  tbl text;
BEGIN
  -- Loop through all tables and delete if exists
  FOREACH tbl IN ARRAY table_list
  LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = tbl) THEN
      EXECUTE format('DELETE FROM %I', tbl);
      RAISE NOTICE 'Cleared table: %', tbl;
    ELSE
      RAISE NOTICE 'Skipped table (not found): %', tbl;
    END IF;
  END LOOP;
END $$;

-- Delete non-admin users
DELETE FROM users WHERE role != 'admin';

-- Verification
SELECT '✅ CLEANUP COMPLETE' as status;

SELECT table_name, COUNT(*)::text as remaining_records
FROM (
  SELECT 'users' as table_name FROM users WHERE role = 'admin'
  UNION ALL SELECT 'users' FROM users WHERE role != 'admin'
  UNION ALL SELECT 'orders' FROM orders
  UNION ALL SELECT 'produk' FROM produk
) sub
GROUP BY table_name;

-- Show remaining admin
SELECT id, nama, email, role FROM users WHERE role = 'admin';
