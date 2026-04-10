-- ============================================
-- Seed Data: site_settings
-- Purpose: Initialize platform settings
-- Run once during initial database setup
-- ============================================

-- Insert default site settings
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
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
SELECT * FROM public.site_settings;
