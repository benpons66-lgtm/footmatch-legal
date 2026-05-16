-- FootMatch — Scoring v3 (source unique de vérité : DB)
-- À exécuter dans l'éditeur SQL Supabase.
-- Remplace complètement reputation_v2.sql.
--
-- BARÈME :
--   +3 pts  : match créé ET terminé (remplace la participation sur ce match)
--   +2 pts  : participation à un match non créé par l'utilisateur
--   +1 pt   : note de match soumise
--
-- NIVEAUX (lancement) :
--   D4 :  0 pts  (départ)
--   D3 : 10 pts  (~3 matchs)
--   D2 : 28 pts  (~9 matchs)
--   D1 : 60 pts  (~20 matchs)

-- ═══════════════════════════════════════════════════════════════
-- BLOC 1 : Nouvelle fonction de calcul du score
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION compute_reputation_score(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_matches_organized  integer := 0;
  v_matches_played     integer := 0;
  v_ratings_given      integer := 0;
  v_score              integer := 0;
BEGIN
  -- Matchs créés et terminés (+3 pts chacun)
  SELECT COUNT(*) INTO v_matches_organized
  FROM matches
  WHERE organizer_id = p_user_id AND status = 'played';

  -- Participations à des matchs terminés (+2 pts chacun)
  -- Note : le créateur est aussi participant → il cumule 3+2=5 pts
  SELECT COUNT(*) INTO v_matches_played
  FROM match_players mp
  JOIN matches m ON m.id = mp.match_id
  WHERE mp.user_id = p_user_id
    AND mp.status = 'confirmed'
    AND m.status = 'played';

  -- Notes de match soumises, organisateur ou participant (+1 pt chacune)
  SELECT COUNT(*) INTO v_ratings_given
  FROM match_ratings
  WHERE user_id = p_user_id;

  -- Le créateur est automatiquement participant → on soustrait pour ne pas
  -- cumuler 3 pts créateur + 2 pts participation sur le même match.
  v_score := (v_matches_organized                                    * 3)
           + (GREATEST(0, v_matches_played - v_matches_organized)    * 2)
           + (v_ratings_given                                        * 1);

  RETURN GREATEST(0, v_score);
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- BLOC 2 : Correspondance score → niveau (seuils v3)
-- Calibrés pour GOAT = 600 pts ≈ 2 ans de jeu régulier
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_level_from_score(p_score integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Lancement : 4 niveaux District uniquement
  -- Progression "jeu vidéo" : gaps croissants (10 / 18 / 32)
  RETURN CASE
    WHEN p_score >= 60 THEN 'D1'
    WHEN p_score >= 28 THEN 'D2'
    WHEN p_score >= 10 THEN 'D3'
    ELSE 'D4'
  END;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- BLOC 3 : Trigger de mise à jour en temps réel
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION refresh_player_reputation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_score   integer;
BEGIN
  v_user_id := CASE TG_TABLE_NAME
    WHEN 'match_players' THEN COALESCE(NEW.user_id,      OLD.user_id)
    WHEN 'matches'       THEN COALESCE(NEW.organizer_id, OLD.organizer_id)
    WHEN 'match_ratings' THEN COALESCE(NEW.user_id,      OLD.user_id)
    ELSE NULL
  END;

  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  v_score := compute_reputation_score(v_user_id);

  UPDATE profiles
  SET
    reputation_score = v_score,
    reputation_rank  = get_level_from_score(v_score),
    level            = get_level_from_score(v_score)
  WHERE id = v_user_id;

  RETURN NEW;
END;
$$;

-- Recréer les triggers
DROP TRIGGER IF EXISTS trg_rep_match_players   ON match_players;
DROP TRIGGER IF EXISTS trg_rep_matches         ON matches;
DROP TRIGGER IF EXISTS trg_rep_match_ratings   ON match_ratings;
DROP TRIGGER IF EXISTS trg_rep_championships   ON championships;
DROP TRIGGER IF EXISTS trg_rep_no_show_reports ON no_show_reports;

CREATE TRIGGER trg_rep_match_players
  AFTER INSERT OR DELETE ON match_players
  FOR EACH ROW EXECUTE FUNCTION refresh_player_reputation();

CREATE TRIGGER trg_rep_matches
  AFTER INSERT OR DELETE OR UPDATE OF status ON matches
  FOR EACH ROW EXECUTE FUNCTION refresh_player_reputation();

CREATE TRIGGER trg_rep_match_ratings
  AFTER INSERT OR DELETE ON match_ratings
  FOR EACH ROW EXECUTE FUNCTION refresh_player_reputation();

-- ═══════════════════════════════════════════════════════════════
-- BLOC 4 : Recalcul immédiat de tous les scores existants
-- ═══════════════════════════════════════════════════════════════

UPDATE profiles
SET
  reputation_score = compute_reputation_score(id),
  reputation_rank  = get_level_from_score(compute_reputation_score(id)),
  level            = get_level_from_score(compute_reputation_score(id));

-- Vérification
SELECT
  pseudo,
  reputation_score,
  reputation_rank
FROM profiles
ORDER BY reputation_score DESC
LIMIT 20;
