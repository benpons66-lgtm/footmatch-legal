-- ============================================================
-- FootMatch — Table Community Chat
-- Colle ce script dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS community_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour ordre chronologique
CREATE INDEX IF NOT EXISTS idx_community_messages_created ON community_messages(created_at DESC);

-- RLS
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "community_read" ON community_messages;
DROP POLICY IF EXISTS "community_insert" ON community_messages;
CREATE POLICY "community_read"   ON community_messages FOR SELECT USING (true);
CREATE POLICY "community_insert" ON community_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verification
SELECT COUNT(*) FROM community_messages;
