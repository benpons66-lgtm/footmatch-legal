-- ─────────────────────────────────────────────────────────────────────────────
-- invitations_setup.sql — À coller dans Supabase SQL Editor et exécuter
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Push token Expo sur les profils
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- 2. Table des notifications in-app
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL DEFAULT 'match_invite',
  title        TEXT        NOT NULL,
  body         TEXT        NOT NULL,
  match_id     UUID        REFERENCES matches(id) ON DELETE SET NULL,
  from_user_id UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  read         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Supprime les politiques si elles existent déjà (pour pouvoir relancer sans erreur)
DROP POLICY IF EXISTS "notifications_select_own"  ON notifications;
DROP POLICY IF EXISTS "notifications_insert_auth" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own"  ON notifications;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_auth"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Index
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications(user_id, read, created_at DESC);
