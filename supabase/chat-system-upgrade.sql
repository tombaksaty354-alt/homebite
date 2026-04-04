-- ============================================
-- UPGRADE CHAT SYSTEM - FITUR PREMIUM
-- ============================================

-- 1. Tambah kolom attachment di chat_messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50); -- 'image', 'file', etc

-- 2. Tambah kolom typing_status (temporary)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 3. Buat storage bucket untuk chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policies untuk chat attachments
CREATE POLICY "Users can upload chat attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
  );

CREATE POLICY "Users can view chat attachments"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete own chat attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_chat_messages_attachment ON chat_messages(attachment_url);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read_at ON chat_messages(read_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_deleted ON chat_messages(is_deleted);

-- 6. Enable realtime untuk chat_messages (jika belum)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 7. Tambah kolom online_status tracking (gunakan user_metadata atau tabel terpisah)
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS untuk presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user presence"
  ON user_presence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own presence"
  ON user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_user_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_presence_timestamp
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_timestamp();

COMMENT ON COLUMN chat_messages.attachment_url IS 'URL file/foto yang diupload';
COMMENT ON COLUMN chat_messages.attachment_type IS 'Tipe attachment: image, pdf, doc, etc';
COMMENT ON COLUMN chat_messages.read_at IS 'Waktu pesan dibaca oleh receiver';
COMMENT ON TABLE user_presence IS 'Tracking online/offline status user';
