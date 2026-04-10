# SQL Setup Guide - Complete Migration Checklist

## Required SQL Files (Run in Order)

### Step 1: Core Database Setup
Run the main setup file that creates all tables and basic RLS policies:
- [ ] `supabase/setup.sql` OR `supabase/FINAL-SETUP.sql`

This creates:
- All core tables (users, produk, orders, order_items, etc.)
- Basic RLS policies
- Foreign key constraints
- Triggers for auto-update timestamps

### Step 2: RPC Functions
- [x] `supabase/migrations/001_create_process_payout_rpc.sql` → **RENAMED to `process_payout_v2`**
  - Function for atomic payout processing
  - Run this FIRST before running payout migrations

### Step 3: Seed Data
- [x] `supabase/migrations/002_seed_site_settings.sql`
  - Creates/updates site_settings table
  - Adds default platform configuration

### Step 4: Footer Configuration
- [x] `supabase/migrations/003_add_footer_fields.sql`
  - Adds social media URLs, footer description, copyright text
  - Required for dynamic footer feature

### Step 5: RLS Policies for Site Settings
- [x] `supabase/fix-site_settings-rls.sql`
  - **IMPORTANT:** Must run this to allow public read access to site_settings
  - Without this, footer won't load!

### Step 6: Additional Features (Optional but Recommended)
Run these if you want specific features:
- [ ] Any chat-related migrations (typing indicators, message reactions)
- [ ] Any notification-related migrations
- [ ] Any additional RLS policy fixes

---

## Verification Queries

After running all migrations, verify setup with these queries:

### 1. Check all tables exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected tables: users, produk, orders, order_items, wishlist, reviews, chat_messages, message_reactions, typing_status, notifications, invoices, calon_mitra_applications, site_settings, mitra_saldo, riwayat_pencairan, user_addresses, platform_rekening, rekening_mitra, pemasukan_mitra, pengeluaran_mitra, etc.

### 2. Check RPC functions exist
```sql
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname IN ('process_payout_v2', 'increment_product_sales')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

Expected: `process_payout_v2(uuid, numeric)` should exist

### 3. Check site_settings data
```sql
SELECT id, nama_platform, email_kontak, whatsapp_number, instagram_url 
FROM site_settings 
WHERE id = 1;
```

Expected: 1 row with default data

### 4. Check RLS policies for site_settings
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'site_settings';
```

Expected: At least 3 policies (SELECT for public, UPDATE/INSERT for authenticated)

### 5. Check if admin user exists
```sql
SELECT id, nama, email, role, status 
FROM users 
WHERE role = 'admin' 
LIMIT 1;
```

Expected: At least 1 admin user (if you already registered one)

---

## Troubleshooting

### Footer not loading?
- Make sure `fix-site_settings-rls.sql` was run
- Check browser console for RLS policy errors
- Verify site_settings table has data with `SELECT * FROM site_settings WHERE id = 1;`

### Payout failing?
- Make sure `001_create_process_payout_rpc.sql` was run successfully
- Function name should be `process_payout_v2` (not `process_payout`)
- Check if `mitra_saldo` and `riwayat_pencairan` tables exist

### Chat features not working?
- Check if all chat-related migrations were run
- Verify real-time is enabled for chat_messages table in Supabase Dashboard
- Check if `typing_status` and `message_reactions` tables exist

### Admin dashboard showing errors?
- Check if `v_admin_unread_payment_count` view exists
- This view is required for payment approval unread count

---

## Quick Setup Command (Supabase CLI)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref wibsjoskduaqqvkywgsa

# Run all migrations
supabase db push
```

This will automatically run all files in `supabase/migrations/` folder in order.

---

## Manual Setup (SQL Editor)

If using Supabase Dashboard SQL Editor:

1. Open each SQL file in order (001, 002, 003, fix-rls)
2. Copy content
3. Paste to SQL Editor
4. Click "Run"
5. Verify with queries above
6. Repeat for next file

**Order matters!** Run in this exact sequence:
1. Core setup (setup.sql or FINAL-SETUP.sql)
2. 001_create_process_payout_rpc.sql
3. 002_seed_site_settings.sql
4. 003_add_footer_fields.sql
5. fix-site_settings-rls.sql
