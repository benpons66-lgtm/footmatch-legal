-- ============================================================
-- FootMatch - Systeme de reputation v2
-- 150 evenements mix = ~50 000 pts = GOAT
--
-- Bareme des points :
--   Match joue (confirmed)   : +200 pts
--   Match cree (organise)    : +700 pts
--   Note donnee              : +80  pts
--   Competition cree         : +3000 pts
--   Bonne note recue (>=4)   : +150 pts bonus
--   No-show signale          : -1000 pts
--
-- Colle chaque bloc dans Supabase SQL Editor
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- BLOC 1 : Fonction de calcul du score de reputation
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION compute_reputation_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_matches_played     INTEGER := 0;
  v_matches_organized  INTEGER := 0;
  v_ratings_given      INTEGER := 0;
  v_championships      INTEGER := 0;
  v_good_ratings       INTEGER := 0;
  v_noshows            INTEGER := 0;
  v_total              INTEGER := 0;
BEGIN
  -- Matchs joues (+200 par match confirme)
  SELECT COUNT(*) INTO v_matches_played
  FROM match_players
  WHERE user_id = p_user_id AND status = 'confirmed';

  -- Matchs organises (+700 par match cree hors annule)
  SELECT COUNT(*) INTO v_matches_organized
  FROM matches
  WHERE organizer_id = p_user_id AND status <> 'cancelled';

  -- Notes donnees (+80 par note postee)
  -- user_id = la personne qui donne la note dans le schema FootMatch
  SELECT COUNT(*) INTO v_ratings_given
  FROM match_ratings
  WHERE user_id = p_user_id;

  -- Competitions creees (+3000 par championnat lance)
  SELECT COUNT(*) INTO v_championships
  FROM championships
  WHERE organizer_id = p_user_id;

  -- Bonnes notes recues (>=4 etoiles, +150 chacune)
  -- NOTE : necessite une colonne rated_user_id dans match_ratings
  -- Si la colonne n'existe pas encore, cette valeur reste 0
  -- Pour l'activer : ALTER TABLE match_ratings ADD COLUMN IF NOT EXISTS rated_user_id UUID REFERENCES profiles(id);
  BEGIN
    SELECT COUNT(*) INTO v_good_ratings
    FROM match_ratings
    WHERE rated_user_id = p_user_id AND rating >= 4;
  EXCEPTION WHEN undefined_column THEN
    v_good_ratings := 0;
  END;

  -- No-shows signales (-1000 chacun)
  SELECT COUNT(*) INTO v_noshows
  FROM no_show_reports
  WHERE reported_user = p_user_id;

  v_total :=
    (v_matches_played    * 200)  +
    (v_matches_organized * 700)  +
    (v_ratings_given     * 80)   +
    (v_championships     * 3000) +
    (v_good_ratings      * 150)  -
    (v_noshows           * 1000);

  -- Le score ne peut pas etre negatif
  RETURN GREATEST(v_total, 0);
END;
$$;


-- ════════════════════════════════════════════════════════════
-- BLOC 2 : Fonction de calcul du niveau depuis le score
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_level_from_score(p_score INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE
    WHEN p_score >= 50000 THEN 'GOAT'
    WHEN p_score >= 49000 THEN 'Coupe du Monde'
    WHEN p_score >= 48000 THEN 'Euro'
    WHEN p_score >= 46500 THEN 'Ligue des Champions'
    WHEN p_score >= 44000 THEN 'Premier League'
    WHEN p_score >= 41000 THEN 'Liga'
    WHEN p_score >= 37500 THEN 'Bundesliga'
    WHEN p_score >= 33500 THEN 'Serie A'
    WHEN p_score >= 29000 THEN 'Ligue 1'
    WHEN p_score >= 24000 THEN 'Ligue 2'
    WHEN p_score >= 18000 THEN 'N1'
    WHEN p_score >= 13000 THEN 'N2'
    WHEN p_score >= 9000  THEN 'N3'
    WHEN p_score >= 6000  THEN 'R1'
    WHEN p_score >= 4000  THEN 'R2'
    WHEN p_score >= 2500  THEN 'R3'
    WHEN p_score >= 1500  THEN 'D1'
    WHEN p_score >= 750   THEN 'D2'
    WHEN p_score >= 300   THEN 'D3'
    ELSE 'D4'
  END;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- BLOC 3 : Trigger pour mettre a jour le score en temps reel
--          Se declenche apres chaque INSERT/DELETE sur :
--          match_players, matches, match_ratings,
--          championships, no_show_reports
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION refresh_player_reputation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id  UUID;
  v_score    INTEGER;
BEGIN
  -- Recupere le user_id selon la table source
  v_user_id := CASE TG_TABLE_NAME
    WHEN 'match_players'    THEN COALESCE(NEW.user_id,    OLD.user_id)
    WHEN 'matches'          THEN COALESCE(NEW.organizer_id, OLD.organizer_id)
    -- user_id = celui qui note (notes donnees)
    WHEN 'match_ratings'    THEN COALESCE(NEW.user_id, OLD.user_id)
    WHEN 'championships'    THEN COALESCE(NEW.organizer_id, OLD.organizer_id)
    WHEN 'no_show_reports'  THEN COALESCE(NEW.reported_user, OLD.reported_user)
    ELSE NULL
  END;

  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  -- Recalcule le score
  v_score := compute_reputation_score(v_user_id);

  -- Met a jour le profil
  UPDATE profiles
  SET
    reputation_score = v_score,
    level            = get_level_from_score(v_score),
    reputation_rank  = get_level_from_score(v_score)
  WHERE id = v_user_id;

  RETURN NEW;
END;
$$;

-- Attache le trigger sur chaque table concernee
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

CREATE TRIGGER trg_rep_championships
  AFTER INSERT OR DELETE ON championships
  FOR EACH ROW EXECUTE FUNCTION refresh_player_reputation();

CREATE TRIGGER trg_rep_no_show_reports
  AFTER INSERT OR DELETE ON no_show_reports
  FOR EACH ROW EXECUTE FUNCTION refresh_player_reputation();


-- ════════════════════════════════════════════════════════════
-- BLOC 4 : Recalcul de tous les profils existants
--          (a lancer UNE SEULE FOIS apres le deploy)
-- ════════════════════════════════════════════════════════════
DO $$
DECLARE
  r RECORD;
  v_score INTEGER;
BEGIN
  FOR r IN SELECT id FROM profiles LOOP
    v_score := compute_reputation_score(r.id);
    UPDATE profiles
    SET
      reputation_score = v_score,
      level            = get_level_from_score(v_score),
      reputation_rank  = get_level_from_score(v_score)
    WHERE id = r.id;
  END LOOP;
  RAISE NOTICE 'Recalcul reputation termine pour tous les profils.';
END;
$$;


-- ════════════════════════════════════════════════════════════
-- BLOC 5 : Verification de la distribution
-- ════════════════════════════════════════════════════════════
SELECT
  level,
  COUNT(*) AS total,
  AVG(reputation_score)::INTEGER AS score_moyen
FROM profiles
GROUP BY level
ORDER BY
  CASE level
    WHEN 'D4'                  THEN 1
    WHEN 'D3'                  THEN 2
    WHEN 'D2'                  THEN 3
    WHEN 'D1'                  THEN 4
    WHEN 'R3'                  THEN 5
    WHEN 'R2'                  THEN 6
    WHEN 'R1'                  THEN 7
    WHEN 'N3'                  THEN 8
    WHEN 'N2'                  THEN 9
    WHEN 'N1'                  THEN 10
    WHEN 'Ligue 2'             THEN 11
    WHEN 'Ligue 1'             THEN 12
    WHEN 'Serie A'             THEN 13
    WHEN 'Bundesliga'          THEN 14
    WHEN 'Liga'                THEN 15
    WHEN 'Premier League'      THEN 16
    WHEN 'Ligue des Champions' THEN 17
    WHEN 'Euro'                THEN 18
    WHEN 'Coupe du Monde'      THEN 19
    WHEN 'GOAT'                THEN 20
    ELSE 99
  END;
