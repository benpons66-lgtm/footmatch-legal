BEGIN;

-- Migration : Correction SECURITY DEFINER → SECURITY INVOKER
-- Date : 2026-05-23
-- Vues concernées : public.player_stats, public.reputation_leaderboard
-- Raison : les vues SECURITY DEFINER contournent le RLS des tables sous-jacentes.
-- Risque : nul (toutes les tables lues ont des policies SELECT USING(true)).

-- ============================================================
-- 1. player_stats
-- ============================================================
DROP VIEW IF EXISTS public.player_stats;
CREATE VIEW public.player_stats
  WITH (security_invoker = true)
AS
 SELECT p.id,
    p.pseudo,
    p.level,
    p.created_at,
    count(DISTINCT mp.match_id) AS matches_played,
    count(DISTINCT m_created.id) AS matches_created,
    round(avg(mr.rating), 2) AS avg_rating_given,
    count(DISTINCT mr.id) AS ratings_given,
    mode() WITHIN GROUP (ORDER BY m_played.type) AS favorite_type,
    count(DISTINCT
        CASE
            WHEN (m_played.scheduled_at > now()) THEN mp.match_id
            ELSE NULL::uuid
        END) AS upcoming_matches
   FROM ((((profiles p
     LEFT JOIN match_players mp ON (((mp.user_id = p.id) AND (mp.status = 'confirmed'::text))))
     LEFT JOIN matches m_played ON ((m_played.id = mp.match_id)))
     LEFT JOIN matches m_created ON ((m_created.organizer_id = p.id)))
     LEFT JOIN match_ratings mr ON ((mr.user_id = p.id)))
  GROUP BY p.id, p.pseudo, p.level, p.created_at;

-- ============================================================
-- 2. reputation_leaderboard
-- ============================================================
DROP VIEW IF EXISTS public.reputation_leaderboard;
CREATE VIEW public.reputation_leaderboard
  WITH (security_invoker = true)
AS
 SELECT p.id,
    p.pseudo,
    p.reputation_score,
    p.reputation_rank,
    p.level,
    rank() OVER (ORDER BY p.reputation_score DESC) AS "position",
    count(DISTINCT mp.match_id) AS matches_played,
    round(avg(mr.rating), 1) AS avg_rating
   FROM ((profiles p
     LEFT JOIN match_players mp ON (((mp.user_id = p.id) AND (mp.status = 'confirmed'::text))))
     LEFT JOIN match_ratings mr ON ((mr.user_id = p.id)))
  GROUP BY p.id, p.pseudo, p.reputation_score, p.reputation_rank, p.level
  ORDER BY p.reputation_score DESC
 LIMIT 50;

COMMIT;
