-- ============================================
-- ENABLE REALTIME FOR CHAT_MESSAGES
-- ============================================
-- Required for instant message delivery
-- ============================================

-- Enable realtime replication for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Verify replication is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Ensure RLS is enabled (should already be)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Verify existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'chat_messages';

COMMENT ON TABLE chat_messages IS 'Chat messages with realtime enabled for instant delivery';
