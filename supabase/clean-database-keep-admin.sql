-- ============================================
-- CLEAN DATABASE - KEEP ONLY ADMIN
-- ============================================
-- This script removes all test data but keeps admin accounts
-- Run this to get a clean database for production
-- ============================================

-- STEP 1: Delete in correct order (respect foreign keys)

-- 1.1 Delete notifications
DELETE FROM notifications;

-- 1.2 Delete reviews
DELETE FROM reviews;

-- 1.3 Delete order items
DELETE FROM order_items;

-- 1.4 Delete orders
DELETE FROM orders;

-- 1.5 Delete products
DELETE FROM produk;

-- 1.6 Delete applications
DELETE FROM calon_mitra_applications;

-- 1.7 Delete mitra_saldo
DELETE FROM mitra_saldo;

-- 1.8 Delete customer_rekening
DELETE FROM customer_rekening;

-- 1.9 Delete platform_rekening
DELETE FROM platform_rekening;

-- 1.10 Delete invoices (if exists)
DELETE FROM invoices;

-- 1.11 Delete user_addresses
DELETE FROM user_addresses;

-- 1.12 Delete chat messages
DELETE FROM chat_messages;

-- 1.13 Delete chat rooms
DELETE FROM chat_rooms;

-- 1.14 Delete wishlist
DELETE FROM wishlist;

-- STEP 2: Delete non-admin users
DELETE FROM users
WHERE role != 'admin';

-- STEP 3: Reset sequences (optional)
-- This ensures IDs start from 1 again

-- STEP 4: Verify cleanup
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

-- STEP 5: Show remaining admin accounts
SELECT id, nama, email, role
FROM users
WHERE role = 'admin';

-- ============================================
-- VERIFICATION:
-- - Users: Should only show admin account(s)
-- - All other tables: Should show 0 records
-- ============================================
