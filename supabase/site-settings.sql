-- ============================================
-- SITE SETTINGS - FOOTER DYNAMIC
-- ============================================
-- Agar footer bisa diedit lewat Admin tanpa coding
-- ============================================

CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  email VARCHAR(255),
  phone VARCHAR(50),
  instagram VARCHAR(100),
  facebook VARCHAR(100),
  copyright_text TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default data (sesuaikan dengan screenshot Anda)
INSERT INTO site_settings (id, email, phone, instagram, facebook, copyright_text)
VALUES (
  1, 
  'halo@homebite.id', 
  '+62 812-3456-7890', 
  '@homebite.id', 
  'Homebite Indonesia',
  '© 2026 Homebite. All rights reserved.'
) ON CONFLICT (id) DO NOTHING;

-- RLS Policy (Public read, Admin write)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view site settings" ON site_settings;
CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT
  TO authenticated
  USING (true); -- Siapapun yang login bisa baca

-- (Optional) Admin update policy handled via Service Role Key in API
-- ============================================
-- SELESAI!
-- ============================================