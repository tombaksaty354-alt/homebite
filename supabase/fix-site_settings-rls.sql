-- ============================================
-- RLS Policies for site_settings table
-- Purpose: Allow public read access, admin-only writes
-- ============================================

-- 1. Enable RLS on site_settings table
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies (use DO block to catch any errors)
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'site_settings' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.site_settings', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- 3. Create policy for PUBLIC READ (anyone can read - needed for footer)
CREATE POLICY "Allow public read access"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- 4. Create policy for authenticated users to UPDATE (admin only via app logic)
CREATE POLICY "Allow authenticated users to update"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- 5. Create policy for authenticated users to INSERT
CREATE POLICY "Allow authenticated users to insert"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'site_settings'
  AND schemaname = 'public';
