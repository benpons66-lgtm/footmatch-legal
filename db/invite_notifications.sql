-- ─────────────────────────────────────────────────────────────────────────────
-- invite_notifications.sql
-- Système d'invitations : push token + table notifications in-app
-- À appliquer dans Supabase SQL Editor
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

-- Chaque utilisateur voit uniquement ses propres notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Tout utilisateur authentifié peut créer une notification (invitations)
CREATE POLICY "notifications_insert_auth"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Marquer ses propres notifications comme lues
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Index
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications(user_id, read, created_at DESC);
