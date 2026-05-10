-- ============================================================================
-- FootMatch — Cleanup avant re-seed Perpignan V1
-- ============================================================================
-- Supprime toutes les lignes qui pointent vers des utilisateurs auth.users
-- qui n'existent plus (orphelins). C'est le ménage à faire AVANT de
-- re-jouer db/seed_perpignan_v1.sql.
--
-- Le seed lui-même nettoie déjà ses propres lignes (préfixes fa%/fb%) ;
-- ce script est plus large : il cible TOUTE donnée orpheline, peu importe
-- son origine (anciens seeds, tests, ex-comptes supprimés…).
--
-- À LANCER DANS : Supabase Dashboard → SQL Editor → New query
-- ÉTAPES        : exécuter le bloc DIAGNOSTIC d'abord, puis le bloc
--                 SUPPRESSION, puis le bloc VÉRIFICATION.
--
-- ⚠️  DESTRUCTIF — relit le bloc DIAGNOSTIC avant de lancer la SUPPRESSION.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1) DIAGNOSTIC — combien d'orphelins vais-je supprimer ?
--     Lance ce bloc seul d'abord. Tu dois voir des nombres.
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  (SELECT count(*) FROM match_players      WHERE user_id      NOT IN (SELECT id FROM auth.users)) AS orphelins_match_players,
  (SELECT count(*) FROM chat_messages      WHERE user_id      NOT IN (SELECT id FROM auth.users)) AS orphelins_chat_messages,
  (SELECT count(*) FROM match_ratings      WHERE user_id      NOT IN (SELECT id FROM auth.users)) AS orphelins_match_ratings,
  (SELECT count(*) FROM community_messages WHERE user_id      NOT IN (SELECT id FROM auth.users)) AS orphelins_community_messages,
  (SELECT count(*) FROM matches            WHERE organizer_id NOT IN (SELECT id FROM auth.users)) AS orphelins_matches,
  (SELECT count(*) FROM profiles           WHERE id           NOT IN (SELECT id FROM auth.users)) AS orphelins_profiles;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2) SUPPRESSION — exécuter UNE FOIS après avoir lu le diagnostic.
--     Ordre = FK-safe (tables filles d'abord, parents ensuite).
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM match_players
  WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM chat_messages
  WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM match_ratings
  WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM community_messages
  WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM matches
  WHERE organizer_id NOT IN (SELECT id FROM auth.users);

DELETE FROM profiles
  WHERE id NOT IN (SELECT id FROM auth.users);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3) VÉRIFICATION — toutes les valeurs doivent être à 0.
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  (SELECT count(*) FROM match_players      WHERE user_id      NOT IN (SELECT id FROM auth.users)) AS reste_match_players,
  (SELECT count(*) FROM chat_messages      WHERE user_id      NOT IN (SELECT id FROM auth.users)) AS reste_chat_messages,
  (SELECT count(*) FROM match_ratings      WHERE user_id      NOT IN (SELECT id FROM auth.users)) AS reste_match_ratings,
  (SELECT count(*) FROM community_messages WHERE user_id      NOT IN (SELECT id FROM auth.users)) AS reste_community_messages,
  (SELECT count(*) FROM matches            WHERE organizer_id NOT IN (SELECT id FROM auth.users)) AS reste_matches,
  (SELECT count(*) FROM profiles           WHERE id           NOT IN (SELECT id FROM auth.users)) AS reste_profiles;

-- Et un coup d'œil aux profils restants — tu dois ne voir que TES vrais comptes :
SELECT id, pseudo, level FROM profiles ORDER BY pseudo;
