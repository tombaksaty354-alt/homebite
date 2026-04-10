-- ============================================
-- Migration: site_settings table setup
-- Purpose: Ensure site_settings table has correct schema
-- Run once to add missing columns to existing table
-- ============================================

-- STEP 1: Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add nama_platform if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'nama_platform'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN nama_platform TEXT;
  END IF;

  -- Add url_logo if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'url_logo'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN url_logo TEXT;
  END IF;

  -- Add email_kontak if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'email_kontak'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN email_kontak TEXT;
  END IF;

  -- Add telepon_kontak if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'telepon_kontak'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN telepon_kontak TEXT;
  END IF;

  -- Add alamat_kontak if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'alamat_kontak'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN alamat_kontak TEXT;
  END IF;

  -- Add komisi_per_item if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'komisi_per_item'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN komisi_per_item NUMERIC DEFAULT 500;
  END IF;

  -- Add created_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add updated_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- STEP 2: Insert default row with id=1 if it doesn't exist
INSERT INTO public.site_settings (id)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE id = 1);

-- STEP 3: Update with default values
UPDATE public.site_settings SET
  nama_platform = COALESCE(nama_platform, 'Homebite'),
  email_kontak = COALESCE(email_kontak, 'support@homebite.id'),
  telepon_kontak = COALESCE(telepon_kontak, '+62 812-3456-7890'),
  alamat_kontak = COALESCE(alamat_kontak, 'Jl. Contoh No. 123, Jakarta Selatan, DKI Jakarta'),
  komisi_per_item = COALESCE(komisi_per_item, 500),
  updated_at = NOW()
WHERE id = 1;

-- STEP 4: Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'site_settings'
ORDER BY ordinal_position;

SELECT * FROM public.site_settings;
