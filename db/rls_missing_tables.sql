-- ═══════════════════════════════════════════════════════════════════════════
-- FootMatch — RLS manquants sur les tables sensibles
-- À exécuter dans Supabase SQL Editor APRÈS security_hardening.sql
-- Date : 2026-03
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. match_players ────────────────────────────────────────────────────────
-- Règle : tout le monde peut lire (nécessaire pour les compteurs de joueurs),
-- mais seul l'utilisateur connecté peut s'inscrire/quitter.

ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_players_public_read"  ON match_players;
DROP POLICY IF EXISTS "match_players_self_insert"  ON match_players;
DROP POLICY IF EXISTS "match_players_self_delete"  ON match_players;

CREATE POLICY "match_players_public_read" ON match_players
  FOR SELECT USING (true);

CREATE POLICY "match_players_self_insert" ON match_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "match_players_self_delete" ON match_players
  FOR DELETE USING (auth.uid() = user_id);

-- ─── 2. match_ratings ────────────────────────────────────────────────────────
-- Règle : lecture publique (pour les statistiques), écriture uniquement par soi.

ALTER TABLE match_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_ratings_public_read"    ON match_ratings;
DROP POLICY IF EXISTS "match_ratings_self_insert"    ON match_ratings;
DROP POLICY IF EXISTS "match_ratings_self_update"    ON match_ratings;

CREATE POLICY "match_ratings_public_read" ON match_ratings
  FOR SELECT USING (true);

CREATE POLICY "match_ratings_self_insert" ON match_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permet de modifier sa propre note (upsert)
CREATE POLICY "match_ratings_self_update" ON match_ratings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 3. chat_messages ────────────────────────────────────────────────────────
-- Règle : lecture réservée aux participants du match OU à l'organisateur.
-- Écriture : utilisateur connecté uniquement.

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_participants_read" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_self_insert"       ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_self_delete"       ON chat_messages;

-- Lecture : être inscrit au match OU être connecté (simplifié pour le MVP)
-- Note : une règle plus stricte vérifierait match_players mais nécessite une fonction
CREATE POLICY "chat_messages_authenticated_read" ON chat_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "chat_messages_self_insert" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_messages_self_delete" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- ─── 4. community_messages ───────────────────────────────────────────────────
-- Chat global : lecture pour tous les connectés, écriture par soi.

ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_messages_authenticated_read" ON community_messages;
DROP POLICY IF EXISTS "community_messages_self_insert"        ON community_messages;
DROP POLICY IF EXISTS "community_messages_self_delete"        ON community_messages;

CREATE POLICY "community_messages_authenticated_read" ON community_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "community_messages_self_insert" ON community_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_messages_self_delete" ON community_messages
  FOR DELETE USING (auth.uid() = user_id);

-- ─── 5. no_show_reports ──────────────────────────────────────────────────────
-- Lecture : uniquement ses propres signalements.
-- Écriture : tout utilisateur connecté peut signaler.

ALTER TABLE no_show_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "no_show_reports_self_read"   ON no_show_reports;
DROP POLICY IF EXISTS "no_show_reports_auth_insert" ON no_show_reports;

CREATE POLICY "no_show_reports_self_read" ON no_show_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "no_show_reports_auth_insert" ON no_show_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = reporter_id);

-- ─── 6. message_reports ──────────────────────────────────────────────────────
-- Même logique que no_show_reports.

ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_reports_self_read"   ON message_reports;
DROP POLICY IF EXISTS "message_reports_auth_insert" ON message_reports;

CREATE POLICY "message_reports_self_read" ON message_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "message_reports_auth_insert" ON message_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = reporter_id);

-- ─── 7. venue_votes ──────────────────────────────────────────────────────────
-- Lecture publique (pour les compteurs), vote uniquement par soi.

ALTER TABLE venue_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venue_votes_public_read" ON venue_votes;
DROP POLICY IF EXISTS "venue_votes_self_insert" ON venue_votes;
DROP POLICY IF EXISTS "venue_votes_self_delete" ON venue_votes;

CREATE POLICY "venue_votes_public_read" ON venue_votes
  FOR SELECT USING (true);

CREATE POLICY "venue_votes_self_insert" ON venue_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "venue_votes_self_delete" ON venue_votes
  FOR DELETE USING (auth.uid() = user_id);

-- ─── 8. Restreindre les profils publics ──────────────────────────────────────
-- OPTIONNEL — Remplace la politique "profiles_public_read" qui expose tout le monde.
-- Décommente UNIQUEMENT si tu veux limiter la visibilité des profils.

/*
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;

CREATE POLICY "profiles_selective_read" ON profiles
  FOR SELECT USING (
    is_public = true OR
    auth.uid() = id
  );
*/

-- ─── Vérification ─────────────────────────────────────────────────────────────
-- Lance ces requêtes pour vérifier que les politiques sont appliquées :
--
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
