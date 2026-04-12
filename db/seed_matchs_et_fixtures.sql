-- ============================================================
-- FootMatch — Matchs réguliers + Fixtures championnats
-- Colle ce script dans Supabase SQL Editor après seed_1000_players.sql
-- ============================================================

-- ── ÉTAPE 1 : MATCHS RÉGULIERS (80 matchs réalistes) ──
DO $$
DECLARE
  titles_five TEXT[] := ARRAY[
    'Five du soir entre potes','Five ouvert a tous','Five du jeudi soir',
    'Five apres boulot','Five serieux niveau D3','Five relax bonne ambiance',
    'Five 19h en semaine','Five urgent besoin de monde',
    'Five propre et collectif','Five du vendredi',
    'Five du quartier','Five format 1h','On joue ce soir',
    'Five tranquille pas de prise de tête','Five pour tous les niveaux','Le Five hebdo'
  ];
  titles_city TEXT[] := ARRAY[
    'City Stade entre amis','7v7 ouvert à tous','City intense bonne équipe',
    'City pour débutants bienvenue','City stade fun pas de pression',
    'City sérieux mais cool','7v7 weekend','City du samedi matin',
    'City cool ambiance relax','City cherche joueurs sérieux'
  ];
  titles_eleven TEXT[] := ARRAY[
    '11 vs 11 classique dimanche','Foot complet ce weekend','Match officiel 11v11',
    'Foot du dimanche matin','Grand match 11v11','Le match de la semaine',
    'Foot complet cherche complément','11v11 terrain naturel'
  ];
  types TEXT[] := ARRAY['five','five','five','five','city','city','eleven'];
  niveaux TEXT[] := ARRAY['D4','D4','D4','D3','D3','D2','D2'];
  i INTEGER;
  mtype TEXT;
  vid UUID;
  oid UUID;
  mdate TIMESTAMP;
  maxp INTEGER;
  curp INTEGER;
  title TEXT;
  tarr TEXT[];
  idx INTEGER;
  mstatus TEXT;
BEGIN
  FOR i IN 1..80 LOOP
    mtype := types[1 + floor(random() * array_length(types,1))::int];
    SELECT id INTO vid FROM venues ORDER BY random() LIMIT 1;
    SELECT id INTO oid FROM profiles ORDER BY random() LIMIT 1;

    -- 30 matchs passés, 50 à venir dans les 14 prochains jours
    IF i <= 30 THEN
      mdate := NOW() - (floor(random()*20+1)||' days')::interval
                      + (floor(random()*14+8)||' hours')::interval;
      mstatus := 'finished';
    ELSIF i <= 45 THEN
      -- Matchs dans les 48h (urgents, presqu'au complet)
      mdate := NOW() + (floor(random()*2)||' days')::interval
                      + (floor(random()*14+8)||' hours')::interval;
      mstatus := 'open';
    ELSE
      mdate := NOW() + (floor(random()*12+2)||' days')::interval
                      + (floor(random()*14+8)||' hours')::interval;
      mstatus := 'open';
    END IF;

    maxp := CASE mtype WHEN 'five' THEN 10 WHEN 'city' THEN 8 ELSE 22 END;

    -- Niveaux de remplissage variés et réalistes
    curp := CASE
      WHEN mstatus = 'finished' THEN maxp
      WHEN i <= 45 THEN maxp - 1 - floor(random()*2)::int  -- presque pleins = urgents
      WHEN random() < 0.3 THEN 1 + floor(random()*3)::int  -- peu remplis
      WHEN random() < 0.6 THEN floor(maxp*0.5)::int        -- à moitié
      ELSE maxp - 2 - floor(random()*3)::int                -- presque pleins
    END;
    curp := GREATEST(1, LEAST(curp, maxp));

    tarr := CASE mtype WHEN 'five' THEN titles_five
                       WHEN 'city' THEN titles_city
                       ELSE titles_eleven END;
    idx := 1 + floor(random() * array_length(tarr,1))::int;
    title := tarr[idx];

    IF vid IS NOT NULL AND oid IS NOT NULL THEN
      INSERT INTO matches (id, title, type, venue_id, organizer_id, scheduled_at,
                           max_players, current_players, price_per_player, level,
                           status, is_private, created_at)
      VALUES (
        gen_random_uuid(), title, mtype, vid, oid, mdate,
        maxp, curp, 0,
        niveaux[1 + floor(random() * array_length(niveaux,1))::int],
        mstatus, false,
        mdate - interval '2 days'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ── ÉTAPE 2 : AJOUTER DES JOUEURS AUX MATCHS OUVERTS ──
DO $$
DECLARE
  m RECORD;
  pid UUID;
  j INTEGER;
BEGIN
  FOR m IN SELECT id, current_players, max_players FROM matches WHERE status = 'open' LOOP
    FOR j IN 2..m.current_players LOOP
      SELECT id INTO pid FROM profiles ORDER BY random() LIMIT 1;
      INSERT INTO match_players (match_id, user_id, status)
      VALUES (m.id, pid, 'confirmed')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ── ÉTAPE 3 : FIXTURES CHAMPIONNATS avec scores réalistes ──
DO $$
DECLARE
  champ RECORD;
  teams UUID[];
  tnames TEXT[];
  n INTEGER;
  i INTEGER;
  j INTEGER;
  rnd INTEGER;
  mdate TIMESTAMP;
  hs INTEGER;
  as_ INTEGER;
  mstatus TEXT;
  champ_start TIMESTAMP;
  days_offset INTEGER;
BEGIN
  FOR champ IN SELECT id, status, created_at FROM championships LOOP
    SELECT ARRAY(SELECT id   FROM championship_teams WHERE championship_id = champ.id ORDER BY id)
    INTO teams;
    SELECT ARRAY(SELECT name FROM championship_teams WHERE championship_id = champ.id ORDER BY id)
    INTO tnames;

    n := array_length(teams, 1);
    IF n IS NULL OR n < 2 THEN CONTINUE; END IF;

    champ_start := champ.created_at;
    rnd := 0;

    -- Aller simple : toutes les combinaisons
    FOR i IN 1..n LOOP
      FOR j IN (i+1)..n LOOP
        rnd := rnd + 1;
        days_offset := rnd * 7;
        mdate := champ_start + (days_offset||' days')::interval + '19:00:00'::interval;

        -- Statut selon la date et le championnat
        IF mdate < NOW() AND champ.status IN ('active','finished') THEN
          mstatus := 'played';
          -- Scores réalistes Five : 0-7 buts par équipe, moyenne ~3
          hs := floor(random()*7)::int;
          as_ := floor(random()*7)::int;
        ELSIF mdate < NOW() + interval '30 days' AND champ.status != 'finished' THEN
          mstatus := 'scheduled';
          hs := NULL; as_ := NULL;
        ELSE
          mstatus := 'pending_date';
          hs := NULL; as_ := NULL;
        END IF;

        INSERT INTO championship_matches
          (id, championship_id, home_team_id, away_team_id, round,
           scheduled_at, home_score, away_score, status)
        VALUES
          (gen_random_uuid(), champ.id, teams[i], teams[j], rnd,
           mdate, hs, as_, mstatus)
        ON CONFLICT DO NOTHING;

        -- Match retour
        rnd := rnd + 1;
        days_offset := days_offset + (n * 7);
        mdate := champ_start + (days_offset||' days')::interval + '19:00:00'::interval;

        IF mdate < NOW() AND champ.status = 'finished' THEN
          mstatus := 'played';
          hs := floor(random()*7)::int;
          as_ := floor(random()*7)::int;
        ELSIF mdate < NOW() AND champ.status = 'active' THEN
          mstatus := 'played';
          hs := floor(random()*6)::int;
          as_ := floor(random()*6)::int;
        ELSIF mdate < NOW() + interval '60 days' THEN
          mstatus := 'scheduled';
          hs := NULL; as_ := NULL;
        ELSE
          mstatus := 'pending_date';
          hs := NULL; as_ := NULL;
        END IF;

        INSERT INTO championship_matches
          (id, championship_id, home_team_id, away_team_id, round,
           scheduled_at, home_score, away_score, status)
        VALUES
          (gen_random_uuid(), champ.id, teams[j], teams[i], rnd,
           mdate, hs, as_, mstatus)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ── ÉTAPE 4 : VÉRIFICATION FINALE ──
SELECT 'Profils'              AS type, COUNT(*) AS total FROM profiles
UNION ALL
SELECT 'Matchs ouverts',               COUNT(*) FROM matches WHERE status = 'open'
UNION ALL
SELECT 'Matchs terminés',              COUNT(*) FROM matches WHERE status = 'finished'
UNION ALL
SELECT 'Match players',                COUNT(*) FROM match_players
UNION ALL
SELECT 'Championnats',                 COUNT(*) FROM championships
UNION ALL
SELECT 'Équipes',                      COUNT(*) FROM championship_teams
UNION ALL
SELECT 'Fixtures championnat',         COUNT(*) FROM championship_matches
UNION ALL
SELECT 'Fixtures joués (avec score)',  COUNT(*) FROM championship_matches WHERE status = 'played';
