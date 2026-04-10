-- ============================================
-- Migration: Add footer/social media fields to site_settings
-- Purpose: Allow admin to customize footer content
-- ============================================

DO $$ 
BEGIN
  -- Add instagram_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN instagram_url TEXT DEFAULT 'https://instagram.com';
  END IF;

  -- Add facebook_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN facebook_url TEXT DEFAULT 'https://facebook.com';
  END IF;

  -- Add whatsapp_number if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN whatsapp_number TEXT DEFAULT '+62 812-3456-7890';
  END IF;

  -- Add footer_description if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'footer_description'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN footer_description TEXT DEFAULT 'Marketplace khusus makanan rumahan. Dukung UMKM lokal dengan menikmati cita rasa autentik dari dapur para mitra kami.';
  END IF;

  -- Add copyright_text if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'copyright_text'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN copyright_text TEXT DEFAULT '© 2026 Homebite. Dibuat dengan ❤ untuk UMKM Indonesia';
  END IF;
END $$;

-- Update default values for existing row
UPDATE public.site_settings SET
  instagram_url = COALESCE(instagram_url, 'https://instagram.com/homebite.id'),
  facebook_url = COALESCE(facebook_url, 'https://facebook.com'),
  whatsapp_number = COALESCE(whatsapp_number, '+62 812-3456-7890'),
  footer_description = COALESCE(footer_description, 'Marketplace khusus makanan rumahan. Dukung UMKM lokal dengan menikmati cita rasa autentik dari dapur para mitra kami.'),
  copyright_text = COALESCE(copyright_text, '© 2026 Homebite. Dibuat dengan ❤ untuk UMKM Indonesia'),
  updated_at = NOW()
WHERE id = 1;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'site_settings'
ORDER BY ordinal_position;
