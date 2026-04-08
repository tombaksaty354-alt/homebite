-- ============================================
-- FIX: VOICE MESSAGES STORAGE PERMISSIONS
-- ============================================
-- Run this in Supabase SQL Editor to fix voice message access issues
-- ============================================

-- 1. Check if voice-messages bucket exists
SELECT name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'voice-messages';

-- 2. If bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-messages',
  'voice-messages',
  true, -- Make bucket public so everyone can access
  5242880, -- 5MB limit
  ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg']::text[];

-- 3. Drop old policies if they exist
DROP POLICY IF EXISTS "Allow anyone to view voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own voice messages" ON storage.objects;

-- 4. Create policies for voice-messages bucket

-- Public read access - anyone can view voice messages
CREATE POLICY "Allow anyone to view voice messages"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-messages');

-- Authenticated users can upload
CREATE POLICY "Allow authenticated users to upload voice messages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice-messages');

-- Users can only delete their own voice messages
CREATE POLICY "Allow users to delete their own voice messages"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'voice-messages' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check bucket configuration
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'voice-messages';

-- Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects' 
AND policyname LIKE '%voice%';

-- ============================================
-- TEST: Check existing voice messages
-- ============================================
SELECT 
  id,
  sender_id,
  receiver_id,
  pesan,
  voice_url,
  voice_duration,
  created_at
FROM chat_messages
WHERE voice_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- DONE!
-- ============================================
