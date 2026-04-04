-- ============================================
-- CHAT SYSTEM ULTIMATE UPGRADE - PERFECT CHAT
-- ============================================
-- Fitur baru:
-- 1. Message Reactions (emoji reactions)
-- 2. Reply to Specific Message (thread replies)
-- 3. Forward Messages
-- 4. Delete Message (soft delete)
-- 5. Edit Message
-- 6. Typing Indicator (realtime)
-- 7. Voice Messages
-- 8. Star/Bookmark Messages
-- ============================================

-- 1. Tambah kolom untuk Reply Message
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply ON chat_messages(reply_to_id);

-- 2. Tambah kolom untuk Edit & Delete (sudah ada, pastikan)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- 3. Tambah kolom untuk Voice Messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS voice_url TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER; -- dalam detik

-- 4. Tambah kolom untuk Forward Messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS forwarded_from_id UUID REFERENCES chat_messages(id);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_chat_messages_forwarded ON chat_messages(is_forwarded);

-- 5. Tambah kolom untuk Star/Bookmark
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS starred_by UUID[]; -- Array user yang star
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS starred_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_chat_messages_starred ON chat_messages(is_starred);

-- 6. Buat tabel untuk Message Reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction VARCHAR(50) NOT NULL, -- emoji: 👍❤️😂😮😢🔥
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction) -- Satu user hanya bisa 1 reaction sama per pesan
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);

-- RLS untuk message_reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reactions"
  ON message_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add own reactions"
  ON message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
  ON message_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. Buat tabel untuk Typing Status (realtime)
CREATE TABLE IF NOT EXISTS typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conversation_partner_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_status_user ON typing_status(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_partner ON typing_status(conversation_partner_id);

-- RLS untuk typing_status
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view typing status"
  ON typing_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own typing status"
  ON typing_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own typing status (update)"
  ON typing_status FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own typing status"
  ON typing_status FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. Buat storage bucket untuk voice messages (jika belum ada)
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies untuk voice messages
CREATE POLICY "Users can upload voice messages"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'voice-messages');

CREATE POLICY "Users can view voice messages"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'voice-messages');

CREATE POLICY "Users can delete own voice messages"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'voice-messages' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 9. Index untuk performa tambahan
CREATE INDEX IF NOT EXISTS idx_chat_messages_voice ON chat_messages(voice_url);
CREATE INDEX IF NOT EXISTS idx_chat_messages_edited ON chat_messages(edited_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_starred_by ON chat_messages USING GIN(starred_by);

-- 10. Enable realtime untuk tabel baru
-- Note: IF EXISTS tidak didukung di ALTER PUBLICATION, jadi pastikan tabel sudah dibuat dulu
DO $$ 
BEGIN
  -- Cek apakah tabel message_reactions ada
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
  END IF;
  
  -- Cek apakah tabel typing_status ada
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'typing_status') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE typing_status;
  END IF;
END $$;

-- 11. Function untuk auto cleanup typing status (setelah 5 detik tidak update)
CREATE OR REPLACE FUNCTION cleanup_expired_typing_status()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_status
  WHERE created_at < NOW() - INTERVAL '5 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Comments
COMMENT ON COLUMN chat_messages.reply_to_id IS 'ID pesan yang dibalas';
COMMENT ON COLUMN chat_messages.voice_url IS 'URL file audio voice message';
COMMENT ON COLUMN chat_messages.voice_duration IS 'Durasi voice message dalam detik';
COMMENT ON COLUMN chat_messages.forwarded_from_id IS 'ID pesan asal jika forwarded';
COMMENT ON COLUMN chat_messages.is_forwarded IS 'Flag jika pesan di-forward';
COMMENT ON COLUMN chat_messages.is_starred IS 'Flag jika pesan di-star';
COMMENT ON COLUMN chat_messages.starred_by IS 'Array user_id yang men-star pesan ini';
COMMENT ON TABLE message_reactions IS 'Emoji reactions untuk pesan';
COMMENT ON TABLE typing_status IS 'Tracking real-time typing status';

-- ============================================
-- SELESAI! Chat System Ultimate Upgrade
-- ============================================
-- Jalankan script ini di Supabase Dashboard > SQL Editor
-- Pastikan sudah menjalankan chat-system-upgrade.sql sebelumnya
-- ============================================
