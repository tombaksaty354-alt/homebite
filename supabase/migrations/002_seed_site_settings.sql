-- ============================================
-- Seed Data: site_settings
-- Purpose: Initialize platform settings
-- Run once during initial database setup
-- ============================================

-- STEP 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  nama_platform TEXT DEFAULT 'Homebite',
  url_logo TEXT,
  email_kontak TEXT,
  telepon_kontak TEXT,
  alamat_kontak TEXT,
  komisi_per_item NUMERIC DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Insert or update default settings
INSERT INTO public.site_settings (
  id, 
  nama_platform, 
  email_kontak, 
  telepon_kontak, 
  alamat_kontak,
  komisi_per_item
)
VALUES (
  1,
  'Homebite',
  'support@homebite.id',
  '+62 812-3456-7890',
  'Jl. Contoh No. 123, Jakarta Selatan, DKI Jakarta',
  500
)
ON CONFLICT (id) DO UPDATE SET
  nama_platform = EXCLUDED.nama_platform,
  email_kontak = EXCLUDED.email_kontak,
  telepon_kontak = EXCLUDED.telepon_kontak,
  alamat_kontak = EXCLUDED.alamat_kontak,
  komisi_per_item = EXCLUDED.komisi_per_item,
  updated_at = NOW();

-- STEP 3: Verify insertion
SELECT * FROM public.site_settings;
