-- ============================================================
-- FootMatch — Seed 1000 joueurs + Championnats
-- Colle ce script dans Supabase SQL Editor et exécute-le
-- ============================================================

-- ── ÉTAPE 0 : FIX RLS — permettre la lecture publique des profils ──
-- Sans ça, l'écran Joueurs reste vide !
DROP POLICY IF EXISTS "Lecture profiles publique" ON profiles;
CREATE POLICY "Lecture profiles publique" ON profiles
  FOR SELECT USING (true);

-- ── ÉTAPE 1 : SUPPRIMER les anciens faux profils (dans le bon ordre) ──
-- D'abord les tables enfants, ensuite les profils
DELETE FROM match_players   WHERE user_id::text LIKE 'fa%' OR user_id::text LIKE 'fb%';
DELETE FROM chat_messages   WHERE user_id::text LIKE 'fa%' OR user_id::text LIKE 'fb%';
DELETE FROM match_ratings   WHERE user_id::text LIKE 'fa%' OR user_id::text LIKE 'fb%';
DELETE FROM matches         WHERE organizer_id::text LIKE 'fa%' OR organizer_id::text LIKE 'fb%';
DELETE FROM championship_teams WHERE captain_id::text LIKE 'fa%' OR captain_id::text LIKE 'fb%';
DELETE FROM championships   WHERE organizer_id::text LIKE 'fa%' OR organizer_id::text LIKE 'fb%';
DELETE FROM profiles        WHERE id::text LIKE 'fa%' OR id::text LIKE 'fb%';

-- ── ÉTAPE 2 : GÉNÉRER 1000 JOUEURS via PL/pgSQL ──
DO $$
DECLARE
  prenoms TEXT[] := ARRAY[
    'lucas','thomas','hugo','theo','nathan','maxime','alexis','romain',
    'antoine','baptiste','nico','julien','pierre','paul','simon',
    'louis','arthur','matt','clement','quentin','kev','mehdi',
    'karim','sofi','youss','med','amine','nabil','rachid','omar',
    'dylan','jordan','bryan','flo','damien','greg','seb','mike',
    'vinc','chris','adrien','axel','leo','gab','raph','val',
    'alex','charles','tristan','aurel','cyril','jeremy','tibo',
    'remi','loic','dorian','edou','guill','hassan','bilal','samir',
    'hamid','younes','mourad','idriss','mamadou','cheikh','ibra',
    'seydou','lamine','ruben','carlos','diego','rafa','sergio',
    'pablo','mateo','ilias','nassim','ayoub','hicham','tarek','walid'
  ];
  suffixes TEXT[] := ARRAY[
    'Foot','Five','FC','City','Ball','Jeu','Paris','Lyon',
    'Lille','Marseille','Nantes','Toulouse','Bdx','Nord','Sud',
    'Est','Ouest','93','75','69','13','44','31','33','92',
    '95','94','77','78','91','59','34','06','57','67',
    '11','22','07','10','17','21','24','26','28','30',
    '81','84','90','97','98'
  ];
  niveaux TEXT[] := ARRAY['D4','D4','D4','D3','D3','D3','D2'];
  rangs TEXT[] := ARRAY['D4','D4','D4','D3','D3','D3','D2'];
  i INTEGER;
  prenom TEXT;
  suffixe TEXT;
  num INTEGER;
  niv TEXT;
  rang TEXT;
  score INTEGER;
  created TIMESTAMP;
  style INTEGER;
  pseudo_val TEXT;
BEGIN
  FOR i IN 1..1000 LOOP
    prenom   := prenoms[1 + floor(random() * array_length(prenoms, 1))::int];
    suffixe  := suffixes[1 + floor(random() * array_length(suffixes, 1))::int];
    num      := floor(random() * 99)::int;
    niv      := niveaux[1 + floor(random() * array_length(niveaux, 1))::int];
    rang     := rangs[1 + floor(random() * array_length(rangs, 1))::int];
    style    := floor(random() * 6)::int;

    -- Styles de pseudos variés et crédibles
    pseudo_val := CASE style
      WHEN 0 THEN prenom || suffixe                          -- lucasGoal
      WHEN 1 THEN upper(substring(prenom,1,1)) || substring(prenom,2) || suffixe  -- LucasGoal
      WHEN 2 THEN prenom || num::text                        -- lucas93
      WHEN 3 THEN suffixe || prenom                          -- Goallucas
      WHEN 4 THEN prenom || '_' || suffixe                   -- lucas_Goal
      ELSE        upper(substring(prenom,1,1)) || substring(prenom,2) || num::text -- Lucas93
    END;

    score    := CASE
      WHEN random() < 0.48 THEN floor(random() * 220)::int
      WHEN random() < 0.82 THEN 300 + floor(random() * 320)::int
      ELSE                      760 + floor(random() * 520)::int
    END;
    created  := NOW() - (floor(random() * 365) || ' days')::interval;

    INSERT INTO profiles (id, pseudo, level, reputation_score, reputation_rank, created_at)
    VALUES (
      ('fa100000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
      pseudo_val,
      niv,
      score,
      rang,
      created
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ── ETAPE 2B : NORMALISER LE NIVEAU DE LA COMMUNAUTE DE LANCEMENT ──
-- Aucun faux joueur ne doit depasser D2
UPDATE profiles
SET
  reputation_score = LEAST(reputation_score, 1499),
  level = CASE
    WHEN reputation_score >= 750 THEN 'D2'
    WHEN reputation_score >= 300 THEN 'D3'
    ELSE 'D4'
  END,
  reputation_rank = CASE
    WHEN reputation_score >= 750 THEN 'D2'
    WHEN reputation_score >= 300 THEN 'D3'
    ELSE 'D4'
  END
WHERE id::text LIKE 'fa%';

-- ── ÉTAPE 3 : VÉRIFICATION ──
SELECT COUNT(*) AS total_joueurs FROM profiles;
SELECT reputation_rank, COUNT(*) as nb
FROM profiles
GROUP BY reputation_rank
ORDER BY nb DESC;

-- ── ÉTAPE 4 : CRÉER 15 CHAMPIONNATS DANS TOUTE LA FRANCE ──
DO $$
DECLARE
  champ_data TEXT[][] := ARRAY[
    ARRAY['Ligue locale du lundi',            'Matchs hebdomadaires entre equipes locales avec un rythme amateur.'],
    ARRAY['Championnat quartier centre',      'Saison reguliere pour joueurs qui veulent jouer chaque semaine.'],
    ARRAY['Tournoi du mercredi soir',         'Format simple en semaine avec des equipes stables.'],
    ARRAY['Coupe five du secteur',            'Petite competition five avec bon esprit demande.'],
    ARRAY['Challenge city entre amis',        'Championnat accessible pour groupes melanges et joueurs reguliers.'],
    ARRAY['Ligue du midi',                    'Matchs en semaine sur des formats courts et efficaces.'],
    ARRAY['Saison five hiver',                'Edition de saison pour continuer a jouer meme pendant les mois froids.'],
    ARRAY['Championnat apres boulot',         'Rencontres organisees en soiree pour les joueurs disponibles apres 18h.'],
    ARRAY['Ligue des habituels',              'Competition locale pour joueurs qui se croisent souvent sur les terrains.'],
    ARRAY['Tournoi du vendredi soir',         'Format simple avec calendrier leger et matchs en fin de semaine.'],
    ARRAY['Derby local',                      'Petite rivalite de quartier dans un cadre amateur.'],
    ARRAY['Coupe nouveaux joueurs',           'Competition ouverte pour integrer facilement de nouvelles equipes.'],
    ARRAY['Ligue du dimanche matin',          'Matchs le week-end pour groupes amateurs reguliers.'],
    ARRAY['Challenge terrain nord',           'Championnat local au format detendu mais serieux.'],
    ARRAY['Saison five indoor',               'Competition indoor avec effectifs stables et niveau amateur.']
  ];
  max_t INTEGER[] := ARRAY[8,8,6,8,10,8,8,6,8,10,8,6,6,8,8];
  statuts TEXT[] := ARRAY['active','active','active','registration','registration','active','finished','registration','active','active','registration','active','finished','registration','active'];
  orga_id UUID;
  champ_id UUID;
  i INTEGER;
  nb_equipes INTEGER;
  j INTEGER;
  team_id UUID;
  cap_id UUID;
  ville_nom TEXT;
  equipe_nom TEXT;
  noms_equipes TEXT[][] := ARRAY[
    ARRAY['FC Montchat','AS Villette','Sporting Nord','Union Centre','FC Prado','Olympique Gerland','SC Bercy','FC Canal'],
    ARRAY['AC Gambetta','US Euralille','FC Capitole','AS Minimes','US Reze','FC Bastide','SC Villeurbanne','US Joliette'],
    ARRAY['Racing Belleville','FC Vaise','AS Jaures','Union 93','Sporting Croix','FC Lingostiere','AS Blagnac','FC Gambetta'],
    ARRAY['SC Bellevue','FC Bastille','US Saint-Michel','AC Chartrons','FC Doulon','AS Belle de Mai','US Croix-Rousse','FC Rangueil']
  ];
BEGIN
  FOR i IN 1..15 LOOP
    -- Prendre un organisateur au hasard parmi les vrais profils
    SELECT id INTO orga_id FROM profiles WHERE id::text LIKE 'fa%' ORDER BY random() LIMIT 1;

    champ_id := gen_random_uuid();
    ville_nom := split_part(champ_data[i][1], ' ', 2); -- extraire ville approximativement

    INSERT INTO championships (id, name, organizer_id, max_teams, status, join_code, description, created_at)
    VALUES (
      champ_id,
      champ_data[i][1],
      orga_id,
      max_t[i],
      statuts[i],
      upper(substring(md5(random()::text) from 1 for 6)),
      champ_data[i][2],
      NOW() - (floor(random() * 60) || ' days')::interval
    );

    -- Ajouter des équipes (4 à max_teams équipes)
    nb_equipes := 4 + floor(random() * (max_t[i] - 3))::int;
    nb_equipes := LEAST(nb_equipes, max_t[i]);

    FOR j IN 1..nb_equipes LOOP
      SELECT id INTO cap_id FROM profiles WHERE id::text LIKE 'fa%' ORDER BY random() LIMIT 1;
      team_id := gen_random_uuid();
      equipe_nom := noms_equipes[1 + floor(random() * 4)::int][((j - 1) % 8) + 1];

      INSERT INTO championship_teams (id, championship_id, name, captain_id)
      VALUES (team_id, champ_id, equipe_nom || ' ' || j, cap_id)
      ON CONFLICT DO NOTHING;
    END LOOP;

  END LOOP;
END $$;

-- ── ÉTAPE 5 : VÉRIFICATION FINALE ──
SELECT 'Joueurs' as type, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'Championnats', COUNT(*) FROM championships
UNION ALL
SELECT 'Équipes', COUNT(*) FROM championship_teams;
