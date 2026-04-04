-- ============================================
-- CLEAN DATABASE - KEEP ONLY ADMIN (FIXED)
-- ============================================
-- Script ini aman dijalankan meskipun beberapa tabel tidak ada
-- ============================================

-- STEP 1: Delete data safely (ignore missing tables)

-- Notifications
DELETE FROM notifications;

-- Reviews
DELETE FROM reviews;

-- Order Items
DELETE FROM order_items;

-- Orders
DELETE FROM orders;

-- Products
DELETE FROM produk;

-- Applications
DELETE FROM calon_mitra_applications;

-- Mitra Saldo
DELETE FROM mitra_saldo;

-- Customer Rekening
DELETE FROM customer_rekening;

-- Platform Rekening
DELETE FROM platform_rekening;

-- Invoices (Check if exists first)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
    DELETE FROM invoices;
  END IF;
END $$;

-- User Addresses
DELETE FROM user_addresses;

-- Chat Messages
DELETE FROM chat_messages;

-- Chat Rooms
DELETE FROM chat_rooms;

-- Wishlist
DELETE FROM wishlist;

-- STEP 2: Delete non-admin users
DELETE FROM users
WHERE role != 'admin';

-- STEP 3: Verify cleanup
SELECT 'Users' as table_name, COUNT(*)::text as records FROM users

UNION ALL

SELECT 'Products', COUNT(*)::text FROM produk

UNION ALL

SELECT 'Orders', COUNT(*)::text FROM orders

UNION ALL

SELECT 'Order Items', COUNT(*)::text FROM order_items

UNION ALL

SELECT 'Reviews', COUNT(*)::text FROM reviews

UNION ALL

SELECT 'Notifications', COUNT(*)::text FROM notifications

UNION ALL

SELECT 'Mitra Saldo', COUNT(*)::text FROM mitra_saldo

UNION ALL

SELECT 'Applications', COUNT(*)::text FROM calon_mitra_applications

UNION ALL

SELECT 'Addresses', COUNT(*)::text FROM user_addresses

UNION ALL

SELECT 'Chat Rooms', COUNT(*)::text FROM chat_rooms

UNION ALL

SELECT 'Chat Messages', COUNT(*)::text FROM chat_messages;

-- STEP 4: Show remaining admin accounts
SELECT id, nama, email, role
FROM users
WHERE role = 'admin';

-- ============================================
-- SELESAI! Database sudah bersih.
-- ============================================
