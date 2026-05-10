-- ============================================================================
-- FootMatch — Seed unifié Perpignan V1 (Chantier 1)
-- ============================================================================
-- Source UNIQUE de fake data pour le launch. Remplace :
--   - db/seed_fake_data.sql            (100 joueurs France entière)
--   - db/seed_1000_players.sql          (1000 joueurs France entière)
--   - db/seed_matchs_et_fixtures.sql    (matchs aléatoires France)
--   - db/fake_data_consistency.sql      (post-process incohérent)
--   - db/launch_realism_pass.sql        (cap D2)
--   - data/fakeData.ts                  (50 joueurs locaux non liés à Supabase)
--
-- Périmètre : 50 joueurs ancrés Perpignan + agglo (66), niveaux D4/D3/D2
-- uniquement, 10 matchs avec distribution réaliste de remplissage,
-- 18 messages communauté avec pseudos cohérents.
--
-- IDs préfixés "fa66…" pour profils, "fb66…" pour matchs (lisibles dans
-- les tables, repérables comme seed launch Perpignan).
--
-- Idempotent : peut être ré-exécuté ; supprime d'abord les anciens seeds.
-- ============================================================================

-- ── 0a. Colonnes profiles requises par l'app (idempotent) ──────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS city        TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- ── 0b. RLS — lecture publique des profils (sinon l'app ne voit personne) ──
DROP POLICY IF EXISTS "Lecture profiles publique" ON profiles;
CREATE POLICY "Lecture profiles publique" ON profiles
  FOR SELECT USING (true);

-- ── 1. Nettoyage des anciens seeds (ordre des FK) ───────────────────────────
DELETE FROM match_players       WHERE user_id::text     LIKE 'fa%' OR user_id::text     LIKE 'fb%';
DELETE FROM chat_messages       WHERE user_id::text     LIKE 'fa%' OR user_id::text     LIKE 'fb%';
DELETE FROM match_ratings       WHERE user_id::text     LIKE 'fa%' OR user_id::text     LIKE 'fb%';
DELETE FROM community_messages  WHERE user_id::text     LIKE 'fa%' OR user_id::text     LIKE 'fb%';
DELETE FROM matches             WHERE id::text          LIKE 'fb%' OR organizer_id::text LIKE 'fa%';
DELETE FROM profiles            WHERE id::text          LIKE 'fa%' OR id::text          LIKE 'fb%';

-- ── 2. Venues Perpignan + agglo (idempotent) ────────────────────────────────
INSERT INTO venues (name, address, city, latitude, longitude, types) VALUES
  ('Stade Aimé Giral',           'Allée Aimé Giral',           'Perpignan',           42.6961, 2.8918, ARRAY['eleven']::text[]),
  ('Five Cabestany',             'Rue des Sports',             'Cabestany',           42.6741, 2.9333, ARRAY['five','city']::text[]),
  ('Complexe Sportif Canet',     'Av. de la Méditerranée',     'Canet-en-Roussillon', 42.7038, 3.0213, ARRAY['five','city','eleven']::text[]),
  ('Stade Municipal Rivesaltes', 'Rue du Stade',               'Rivesaltes',          42.7707, 2.8722, ARRAY['eleven']::text[]),
  ('Terrain de Thuir',           'Chemin du Stade',            'Thuir',               42.6336, 2.7553, ARRAY['five','eleven']::text[]),
  ('Five Argelès',               'Av. du Tech',                'Argelès-sur-Mer',     42.5547, 3.0263, ARRAY['five','city']::text[])
ON CONFLICT DO NOTHING;

-- ── 3. 50 profils Perpignan + agglo ─────────────────────────────────────────
-- Niveaux : D4 [0-299] · D3 [300-749] · D2 [750-1499]
-- Villes couvertes : Perpignan (66000), Canet-en-Roussillon (66140),
--   Cabestany (66330), Thuir (66300), Rivesaltes (66600),
--   Argelès-sur-Mer (66700), Saint-Estève (66240), Bompas (66430),
--   Le Soler (66270), Elne (66200)

INSERT INTO profiles (id, pseudo, level, reputation_score, reputation_rank, city, postal_code, created_at) VALUES
  -- D2 — 10 joueurs confirmés (score 790-1380)
  ('fa660000-0000-0000-0000-000000000001'::uuid, 'ZizouPerp',       'D2', 1380, 'D2', 'Perpignan',           '66000', NOW() - INTERVAL '210 days'),
  ('fa660000-0000-0000-0000-000000000002'::uuid, 'ElToro',          'D2', 1290, 'D2', 'Perpignan',           '66000', NOW() - INTERVAL '195 days'),
  ('fa660000-0000-0000-0000-000000000003'::uuid, 'TikiMaestro',     'D2', 1210, 'D2', 'Canet-en-Roussillon', '66140', NOW() - INTERVAL '180 days'),
  ('fa660000-0000-0000-0000-000000000004'::uuid, 'RabonaKing',      'D2', 1180, 'D2', 'Perpignan',           '66000', NOW() - INTERVAL '170 days'),
  ('fa660000-0000-0000-0000-000000000005'::uuid, 'ButeurNetto',     'D2', 1150, 'D2', 'Saint-Estève',        '66240', NOW() - INTERVAL '165 days'),
  ('fa660000-0000-0000-0000-000000000006'::uuid, 'LaFleche',        'D2', 1080, 'D2', 'Perpignan',           '66000', NOW() - INTERVAL '150 days'),
  ('fa660000-0000-0000-0000-000000000007'::uuid, 'MistraDribble',   'D2',  990, 'D2', 'Le Soler',            '66270', NOW() - INTERVAL '140 days'),
  ('fa660000-0000-0000-0000-000000000008'::uuid, 'NightFive',       'D2',  920, 'D2', 'Perpignan',           '66000', NOW() - INTERVAL '135 days'),
  ('fa660000-0000-0000-0000-000000000009'::uuid, 'CatalanKing',     'D2',  860, 'D2', 'Perpignan',           '66000', NOW() - INTERVAL '130 days'),
  ('fa660000-0000-0000-0000-000000000010'::uuid, 'PanenkaPro',      'D2',  790, 'D2', 'Canet-en-Roussillon', '66140', NOW() - INTERVAL '125 days'),

  -- D3 — 20 joueurs réguliers (score 310-720)
  ('fa660000-0000-0000-0000-000000000011'::uuid, 'StreetFoot',      'D3',  720, 'D3', 'Perpignan',           '66000', NOW() - INTERVAL '120 days'),
  ('fa660000-0000-0000-0000-000000000012'::uuid, 'BabyMbappe',      'D3',  690, 'D3', 'Cabestany',           '66330', NOW() - INTERVAL '115 days'),
  ('fa660000-0000-0000-0000-000000000013'::uuid, 'DeuxPieds',       'D3',  660, 'D3', 'Perpignan',           '66000', NOW() - INTERVAL '110 days'),
  ('fa660000-0000-0000-0000-000000000014'::uuid, 'NoLook',          'D3',  640, 'D3', 'Perpignan',           '66000', NOW() - INTERVAL '108 days'),
  ('fa660000-0000-0000-0000-000000000015'::uuid, 'Sombrero66',      'D3',  620, 'D3', 'Thuir',               '66300', NOW() - INTERVAL '105 days'),
  ('fa660000-0000-0000-0000-000000000016'::uuid, 'ElCrack',         'D3',  590, 'D3', 'Perpignan',           '66000', NOW() - INTERVAL '100 days'),
  ('fa660000-0000-0000-0000-000000000017'::uuid, 'VitesseMax',      'D3',  570, 'D3', 'Saint-Estève',        '66240', NOW() - INTERVAL '95 days'),
  ('fa660000-0000-0000-0000-000000000018'::uuid, 'TurboGoal',       'D3',  550, 'D3', 'Perpignan',           '66000', NOW() - INTERVAL '92 days'),
  ('fa660000-0000-0000-0000-000000000019'::uuid, 'JogaBonito',      'D3',  530, 'D3', 'Argelès-sur-Mer',     '66700', NOW() - INTERVAL '88 days'),
  ('fa660000-0000-0000-0000-000000000020'::uuid, 'LaFuria',         'D3',  510, 'D3', 'Argelès-sur-Mer',     '66700', NOW() - INTERVAL '85 days'),
  ('fa660000-0000-0000-0000-000000000021'::uuid, 'MidfieldRouss',   'D3',  490, 'D3', 'Cabestany',           '66330', NOW() - INTERVAL '80 days'),
  ('fa660000-0000-0000-0000-000000000022'::uuid, 'FreekickKing',    'D3',  470, 'D3', 'Perpignan',           '66000', NOW() - INTERVAL '78 days'),
  ('fa660000-0000-0000-0000-000000000023'::uuid, 'SauceGauche',     'D3',  450, 'D3', 'Perpignan',           '66000', NOW() - INTERVAL '75 days'),
  ('fa660000-0000-0000-0000-000000000024'::uuid, 'VilaReal',        'D3',  430, 'D3', 'Canet-en-Roussillon', '66140', NOW() - INTERVAL '72 days'),
  ('fa660000-0000-0000-0000-000000000025'::uuid, 'SprintFou66',     'D3',  410, 'D3', 'Bompas',              '66430', NOW() - INTERVAL '68 days'),
  ('fa660000-0000-0000-0000-000000000026'::uuid, 'PiedGauche',      'D3',  390, 'D3', 'Perpignan',           '66000', NOW() - INTERVAL '65 days'),
  ('fa660000-0000-0000-0000-000000000027'::uuid, 'RivesalteBoy',    'D3',  370, 'D3', 'Rivesaltes',          '66600', NOW() - INTERVAL '62 days'),
  ('fa660000-0000-0000-0000-000000000028'::uuid, 'PerpiStreet',     'D3',  350, 'D3', 'Perpignan',           '66000', NOW() - INTERVAL '58 days'),
  ('fa660000-0000-0000-0000-000000000029'::uuid, 'RegatePro',       'D3',  330, 'D3', 'Canet-en-Roussillon', '66140', NOW() - INTERVAL '55 days'),
  ('fa660000-0000-0000-0000-000000000030'::uuid, 'BlocRoussillon',  'D3',  310, 'D3', 'Perpignan',           '66000', NOW() - INTERVAL '52 days'),

  -- D4 — 20 joueurs occasionnels (score 0-280)
  ('fa660000-0000-0000-0000-000000000031'::uuid, 'WeekendFive',     'D4',  280, 'D4', 'Perpignan',           '66000', NOW() - INTERVAL '48 days'),
  ('fa660000-0000-0000-0000-000000000032'::uuid, 'DimanFoot',       'D4',  260, 'D4', 'Cabestany',           '66330', NOW() - INTERVAL '45 days'),
  ('fa660000-0000-0000-0000-000000000033'::uuid, 'CanetStyle',      'D4',  240, 'D4', 'Canet-en-Roussillon', '66140', NOW() - INTERVAL '42 days'),
  ('fa660000-0000-0000-0000-000000000034'::uuid, 'BluetFoot',       'D4',  220, 'D4', 'Perpignan',           '66000', NOW() - INTERVAL '40 days'),
  ('fa660000-0000-0000-0000-000000000035'::uuid, 'ThuirPlayer',     'D4',  200, 'D4', 'Thuir',               '66300', NOW() - INTERVAL '38 days'),
  ('fa660000-0000-0000-0000-000000000036'::uuid, 'RigolFoot',       'D4',  180, 'D4', 'Perpignan',           '66000', NOW() - INTERVAL '35 days'),
  ('fa660000-0000-0000-0000-000000000037'::uuid, 'SolerFoot',       'D4',  160, 'D4', 'Le Soler',            '66270', NOW() - INTERVAL '32 days'),
  ('fa660000-0000-0000-0000-000000000038'::uuid, 'RivesalteKid',    'D4',  140, 'D4', 'Rivesaltes',          '66600', NOW() - INTERVAL '30 days'),
  ('fa660000-0000-0000-0000-000000000039'::uuid, 'PassionFoot66',   'D4',  130, 'D4', 'Perpignan',           '66000', NOW() - INTERVAL '28 days'),
  ('fa660000-0000-0000-0000-000000000040'::uuid, 'BonVibes66',      'D4',  115, 'D4', 'Bompas',              '66430', NOW() - INTERVAL '25 days'),
  ('fa660000-0000-0000-0000-000000000041'::uuid, 'ChillFoot',       'D4',  100, 'D4', 'Perpignan',           '66000', NOW() - INTERVAL '22 days'),
  ('fa660000-0000-0000-0000-000000000042'::uuid, 'RelaxFoot',       'D4',   85, 'D4', 'Cabestany',           '66330', NOW() - INTERVAL '20 days'),
  ('fa660000-0000-0000-0000-000000000043'::uuid, 'EnTrainement',    'D4',   70, 'D4', 'Perpignan',           '66000', NOW() - INTERVAL '18 days'),
  ('fa660000-0000-0000-0000-000000000044'::uuid, 'PremierPas',      'D4',   55, 'D4', 'Perpignan',           '66000', NOW() - INTERVAL '15 days'),
  ('fa660000-0000-0000-0000-000000000045'::uuid, 'ArgelesBoy',      'D4',   45, 'D4', 'Argelès-sur-Mer',     '66700', NOW() - INTERVAL '12 days'),
  ('fa660000-0000-0000-0000-000000000046'::uuid, 'NoviceFoot',      'D4',   35, 'D4', 'Elne',                '66200', NOW() - INTERVAL '10 days'),
  ('fa660000-0000-0000-0000-000000000047'::uuid, 'YoloFoot',        'D4',   25, 'D4', 'Canet-en-Roussillon', '66140', NOW() - INTERVAL '8 days'),
  ('fa660000-0000-0000-0000-000000000048'::uuid, 'FreshKick',       'D4',   15, 'D4', 'Perpignan',           '66000', NOW() - INTERVAL '6 days'),
  ('fa660000-0000-0000-0000-000000000049'::uuid, 'FutureStar66',    'D4',   10, 'D4', 'Rivesaltes',          '66600', NOW() - INTERVAL '4 days'),
  ('fa660000-0000-0000-0000-000000000050'::uuid, 'ToutDebut',       'D4',    0, 'D4', 'Perpignan',           '66000', NOW() - INTERVAL '2 days');

-- ── 4. 10 matchs avec distribution réaliste de remplissage ──────────────────
-- Distribution V1 :
--   4 bien remplis  (≥75%) — fb66…001 à fb66…004
--   3 moyennement   (40-70%) — fb66…005 à fb66…007
--   2 peu remplis   (<40%) — fb66…008, fb66…009
--   1 quasi vide   — fb66…010 (organisateur seul)

INSERT INTO matches (
  id, title, type, venue_id, organizer_id, scheduled_at,
  max_players, current_players, price_per_player, level,
  description, is_private, status
) VALUES
  -- ── 1. Five soirée Moulin à Vent — bien rempli (9/10) ─────────────────────
  ('fb660000-0000-0000-0000-000000000001'::uuid,
   'Five du soir — Moulin à Vent', 'five',
   (SELECT id FROM venues WHERE name = 'Foot5 Perpignan' LIMIT 1),
   'fa660000-0000-0000-0000-000000000001'::uuid,
   NOW() + INTERVAL '3 hours',
   10, 9, 7, 'D2',
   'Five intense en soirée. Bonne ambiance, niveau D2 attendu.', false, 'open'),

  -- ── 2. City Cabestany — bien rempli (7/8) ─────────────────────────────────
  ('fb660000-0000-0000-0000-000000000002'::uuid,
   'City Cabestany — Pluie ou pas', 'city',
   (SELECT id FROM venues WHERE name = 'Five Cabestany' LIMIT 1),
   'fa660000-0000-0000-0000-000000000018'::uuid,
   NOW() + INTERVAL '5 hours',
   8, 7, 6, 'D3',
   'City Cabestany, ouvert D3-D2. Il reste une place !', false, 'open'),

  -- ── 3. Five Foot à 5 Perpignan — bien rempli (8/10) ───────────────────────
  ('fb660000-0000-0000-0000-000000000003'::uuid,
   'Five compétitif — Grande Bretagne', 'five',
   (SELECT id FROM venues WHERE name = 'Foot à 5 Perpignan' LIMIT 1),
   'fa660000-0000-0000-0000-000000000005'::uuid,
   NOW() + INTERVAL '1 day',
   10, 8, 8, 'D2',
   'Match propre, jeu technique. Niveau D2 demandé.', false, 'open'),

  -- ── 4. Foot à 11 Canet — bien rempli (18/22) ──────────────────────────────
  ('fb660000-0000-0000-0000-000000000004'::uuid,
   'Foot 11 — Canet dimanche', 'eleven',
   (SELECT id FROM venues WHERE name = 'Complexe Sportif Canet' LIMIT 1),
   'fa660000-0000-0000-0000-000000000003'::uuid,
   NOW() + INTERVAL '2 days',
   22, 18, 5, 'D3',
   'Match à 11 Canet, terrain synthé. Manque 4 joueurs.', false, 'open'),

  -- ── 5. Five Cabestany après-midi — moyen (6/10) ───────────────────────────
  ('fb660000-0000-0000-0000-000000000005'::uuid,
   'Five Cabestany — Aprem', 'five',
   (SELECT id FROM venues WHERE name = 'Five Cabestany' LIMIT 1),
   'fa660000-0000-0000-0000-000000000016'::uuid,
   NOW() + INTERVAL '1 day 6 hours',
   10, 6, 7, 'D3',
   'Five tranquille, ouvert tous niveaux à partir D4.', false, 'open'),

  -- ── 6. City Argelès soirée — moyen (5/8) ──────────────────────────────────
  ('fb660000-0000-0000-0000-000000000006'::uuid,
   'City Argelès — Plage', 'city',
   (SELECT id FROM venues WHERE name = 'Five Argelès' LIMIT 1),
   'fa660000-0000-0000-0000-000000000020'::uuid,
   NOW() + INTERVAL '2 days 4 hours',
   8, 5, 6, 'D3',
   'City en bord de mer, ambiance détendue.', false, 'open'),

  -- ── 7. Foot 11 Rivesaltes — moyen (12/22) ─────────────────────────────────
  ('fb660000-0000-0000-0000-000000000007'::uuid,
   'Foot 11 Rivesaltes', 'eleven',
   (SELECT id FROM venues WHERE name = 'Stade Municipal Rivesaltes' LIMIT 1),
   'fa660000-0000-0000-0000-000000000027'::uuid,
   NOW() + INTERVAL '3 days',
   22, 12, 4, 'D3',
   'Match à 11 dimanche après-midi. Cherche encore 10 joueurs.', false, 'open'),

  -- ── 8. Five Thuir — peu rempli (3/10) ─────────────────────────────────────
  ('fb660000-0000-0000-0000-000000000008'::uuid,
   'Five Thuir — Détente', 'five',
   (SELECT id FROM venues WHERE name = 'Terrain de Thuir' LIMIT 1),
   'fa660000-0000-0000-0000-000000000035'::uuid,
   NOW() + INTERVAL '4 days',
   10, 3, 5, 'D4',
   'Five débutants Thuir, super ambiance. Tous niveaux.', false, 'open'),

  -- ── 9. City Canet débutants — peu rempli (3/8) ────────────────────────────
  ('fb660000-0000-0000-0000-000000000009'::uuid,
   'City Canet — Débutants bienvenus', 'city',
   (SELECT id FROM venues WHERE name = 'Complexe Sportif Canet' LIMIT 1),
   'fa660000-0000-0000-0000-000000000033'::uuid,
   NOW() + INTERVAL '4 days 5 hours',
   8, 3, 6, 'D4',
   'City Canet ouvert aux débutants. Viens te marrer.', false, 'open'),

  -- ── 10. Stade Aimé Giral — quasi vide (1/22) ──────────────────────────────
  ('fb660000-0000-0000-0000-000000000010'::uuid,
   'Foot 11 Aimé Giral — Cherche joueurs', 'eleven',
   (SELECT id FROM venues WHERE name = 'Stade Aimé Giral' LIMIT 1),
   'fa660000-0000-0000-0000-000000000004'::uuid,
   NOW() + INTERVAL '6 days',
   22, 1, 4, 'D3',
   'Lance un match à 11 sur Aimé Giral, cherche encore 21 joueurs !', false, 'open');

-- ── 5. match_players — joueurs inscrits (current_players ci-dessus) ─────────

INSERT INTO match_players (match_id, user_id, status) VALUES
  -- Match 1 (five, 9 joueurs) : ZizouPerp + 8
  ('fb660000-0000-0000-0000-000000000001'::uuid, 'fa660000-0000-0000-0000-000000000001'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000001'::uuid, 'fa660000-0000-0000-0000-000000000002'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000001'::uuid, 'fa660000-0000-0000-0000-000000000005'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000001'::uuid, 'fa660000-0000-0000-0000-000000000007'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000001'::uuid, 'fa660000-0000-0000-0000-000000000010'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000001'::uuid, 'fa660000-0000-0000-0000-000000000011'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000001'::uuid, 'fa660000-0000-0000-0000-000000000016'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000001'::uuid, 'fa660000-0000-0000-0000-000000000022'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000001'::uuid, 'fa660000-0000-0000-0000-000000000026'::uuid, 'confirmed'),

  -- Match 2 (city, 7 joueurs)
  ('fb660000-0000-0000-0000-000000000002'::uuid, 'fa660000-0000-0000-0000-000000000018'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000002'::uuid, 'fa660000-0000-0000-0000-000000000017'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000002'::uuid, 'fa660000-0000-0000-0000-000000000019'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000002'::uuid, 'fa660000-0000-0000-0000-000000000023'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000002'::uuid, 'fa660000-0000-0000-0000-000000000028'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000002'::uuid, 'fa660000-0000-0000-0000-000000000030'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000002'::uuid, 'fa660000-0000-0000-0000-000000000040'::uuid, 'confirmed'),

  -- Match 3 (five compétitif, 8 joueurs D2-D3)
  ('fb660000-0000-0000-0000-000000000003'::uuid, 'fa660000-0000-0000-0000-000000000005'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000003'::uuid, 'fa660000-0000-0000-0000-000000000001'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000003'::uuid, 'fa660000-0000-0000-0000-000000000006'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000003'::uuid, 'fa660000-0000-0000-0000-000000000008'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000003'::uuid, 'fa660000-0000-0000-0000-000000000009'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000003'::uuid, 'fa660000-0000-0000-0000-000000000013'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000003'::uuid, 'fa660000-0000-0000-0000-000000000014'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000003'::uuid, 'fa660000-0000-0000-0000-000000000021'::uuid, 'confirmed'),

  -- Match 4 (eleven Canet, 18 joueurs)
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000003'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000004'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000006'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000012'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000015'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000020'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000021'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000024'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000025'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000027'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000029'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000030'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000033'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000035'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000038'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000041'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000042'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000004'::uuid, 'fa660000-0000-0000-0000-000000000045'::uuid, 'confirmed'),

  -- Match 5 (Five Cabestany, 6 joueurs)
  ('fb660000-0000-0000-0000-000000000005'::uuid, 'fa660000-0000-0000-0000-000000000016'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000005'::uuid, 'fa660000-0000-0000-0000-000000000031'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000005'::uuid, 'fa660000-0000-0000-0000-000000000034'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000005'::uuid, 'fa660000-0000-0000-0000-000000000037'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000005'::uuid, 'fa660000-0000-0000-0000-000000000043'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000005'::uuid, 'fa660000-0000-0000-0000-000000000046'::uuid, 'confirmed'),

  -- Match 6 (City Argelès, 5 joueurs)
  ('fb660000-0000-0000-0000-000000000006'::uuid, 'fa660000-0000-0000-0000-000000000020'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000006'::uuid, 'fa660000-0000-0000-0000-000000000045'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000006'::uuid, 'fa660000-0000-0000-0000-000000000033'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000006'::uuid, 'fa660000-0000-0000-0000-000000000048'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000006'::uuid, 'fa660000-0000-0000-0000-000000000019'::uuid, 'confirmed'),

  -- Match 7 (Foot 11 Rivesaltes, 12 joueurs)
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000027'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000038'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000011'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000017'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000023'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000028'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000029'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000032'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000036'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000039'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000044'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000007'::uuid, 'fa660000-0000-0000-0000-000000000049'::uuid, 'confirmed'),

  -- Match 8 (Five Thuir, 3 joueurs)
  ('fb660000-0000-0000-0000-000000000008'::uuid, 'fa660000-0000-0000-0000-000000000035'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000008'::uuid, 'fa660000-0000-0000-0000-000000000015'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000008'::uuid, 'fa660000-0000-0000-0000-000000000050'::uuid, 'confirmed'),

  -- Match 9 (City Canet débutants, 3 joueurs)
  ('fb660000-0000-0000-0000-000000000009'::uuid, 'fa660000-0000-0000-0000-000000000033'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000009'::uuid, 'fa660000-0000-0000-0000-000000000047'::uuid, 'confirmed'),
  ('fb660000-0000-0000-0000-000000000009'::uuid, 'fa660000-0000-0000-0000-000000000012'::uuid, 'confirmed'),

  -- Match 10 (Aimé Giral quasi vide, 1 joueur = organizer)
  ('fb660000-0000-0000-0000-000000000010'::uuid, 'fa660000-0000-0000-0000-000000000004'::uuid, 'confirmed');

-- ── 6. Messages communauté (18 msgs, pseudos 100% présents dans seed) ───────

INSERT INTO community_messages (user_id, content, created_at) VALUES
  ('fa660000-0000-0000-0000-000000000001'::uuid, 'Qui est chaud pour le five de ce soir ? Il reste une place 🔥',                NOW() - INTERVAL '14 minutes'),
  ('fa660000-0000-0000-0000-000000000002'::uuid, 'Je suis là ! 18h ça me va 👍',                                                  NOW() - INTERVAL '13 minutes'),
  ('fa660000-0000-0000-0000-000000000011'::uuid, 'C''est quel terrain du coup ?',                                                  NOW() - INTERVAL '12 minutes'),
  ('fa660000-0000-0000-0000-000000000001'::uuid, 'Foot5 Perpignan — Bd du Conflent',                                             NOW() - INTERVAL '11 minutes'),
  ('fa660000-0000-0000-0000-000000000003'::uuid, 'Qui vient au foot à 11 dimanche à Canet ?',                                    NOW() - INTERVAL '10 minutes'),
  ('fa660000-0000-0000-0000-000000000012'::uuid, 'Présent avec CanetStyle 👍',                                                    NOW() - INTERVAL '9 minutes'),
  ('fa660000-0000-0000-0000-000000000033'::uuid, 'Confirmé, on arrive à 14h',                                                     NOW() - INTERVAL '8 minutes'),
  ('fa660000-0000-0000-0000-000000000004'::uuid, 'Je lance un foot 11 sur Aimé Giral pour la semaine pro, manque 21 joueurs ⚽',  NOW() - INTERVAL '7 minutes'),
  ('fa660000-0000-0000-0000-000000000016'::uuid, 'Tu vises quel niveau RabonaKing ?',                                            NOW() - INTERVAL '6 minutes'),
  ('fa660000-0000-0000-0000-000000000004'::uuid, 'D3 minimum, terrain synthé en bon état',                                       NOW() - INTERVAL '5 minutes'),
  ('fa660000-0000-0000-0000-000000000006'::uuid, 'Présent pour le foot 11, je ramène TurboGoal',                                 NOW() - INTERVAL '4 minutes'),
  ('fa660000-0000-0000-0000-000000000031'::uuid, 'Five débutants jeudi à Thuir si certains veulent — tous niveaux 👋',          NOW() - INTERVAL '3 minutes'),
  ('fa660000-0000-0000-0000-000000000047'::uuid, 'Carrément, je m''inscris',                                                      NOW() - INTERVAL '2 minutes'),
  ('fa660000-0000-0000-0000-000000000002'::uuid, 'GG à tous hier soir, belle intensité 🔥',                                       NOW() - INTERVAL '1 minute'),
  ('fa660000-0000-0000-0000-000000000008'::uuid, 'Dispo vendredi ou samedi perso',                                               NOW()),
  ('fa660000-0000-0000-0000-000000000020'::uuid, 'Quelqu''un d''Argelès joue régulièrement ? Cherche un groupe',                  NOW() - INTERVAL '20 minutes'),
  ('fa660000-0000-0000-0000-000000000027'::uuid, 'Sur Rivesaltes pareil, foot 11 dimanche aprem',                                NOW() - INTERVAL '18 minutes'),
  ('fa660000-0000-0000-0000-000000000044'::uuid, 'Premier match ce soir grâce à l''app, merci pour l''orga 🙏',                   NOW() - INTERVAL '17 minutes');

-- ── 7. Passe finale — fige score + level + city + postal_code voulus ────────
WITH desired(id, score, lvl, city, pc) AS (VALUES
  ('fa660000-0000-0000-0000-000000000001'::uuid, 1380, 'D2', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000002'::uuid, 1290, 'D2', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000003'::uuid, 1210, 'D2', 'Canet-en-Roussillon', '66140'),
  ('fa660000-0000-0000-0000-000000000004'::uuid, 1180, 'D2', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000005'::uuid, 1150, 'D2', 'Saint-Estève',        '66240'),
  ('fa660000-0000-0000-0000-000000000006'::uuid, 1080, 'D2', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000007'::uuid,  990, 'D2', 'Le Soler',            '66270'),
  ('fa660000-0000-0000-0000-000000000008'::uuid,  920, 'D2', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000009'::uuid,  860, 'D2', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000010'::uuid,  790, 'D2', 'Canet-en-Roussillon', '66140'),
  ('fa660000-0000-0000-0000-000000000011'::uuid,  720, 'D3', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000012'::uuid,  690, 'D3', 'Cabestany',           '66330'),
  ('fa660000-0000-0000-0000-000000000013'::uuid,  660, 'D3', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000014'::uuid,  640, 'D3', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000015'::uuid,  620, 'D3', 'Thuir',               '66300'),
  ('fa660000-0000-0000-0000-000000000016'::uuid,  590, 'D3', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000017'::uuid,  570, 'D3', 'Saint-Estève',        '66240'),
  ('fa660000-0000-0000-0000-000000000018'::uuid,  550, 'D3', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000019'::uuid,  530, 'D3', 'Argelès-sur-Mer',     '66700'),
  ('fa660000-0000-0000-0000-000000000020'::uuid,  510, 'D3', 'Argelès-sur-Mer',     '66700'),
  ('fa660000-0000-0000-0000-000000000021'::uuid,  490, 'D3', 'Cabestany',           '66330'),
  ('fa660000-0000-0000-0000-000000000022'::uuid,  470, 'D3', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000023'::uuid,  450, 'D3', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000024'::uuid,  430, 'D3', 'Canet-en-Roussillon', '66140'),
  ('fa660000-0000-0000-0000-000000000025'::uuid,  410, 'D3', 'Bompas',              '66430'),
  ('fa660000-0000-0000-0000-000000000026'::uuid,  390, 'D3', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000027'::uuid,  370, 'D3', 'Rivesaltes',          '66600'),
  ('fa660000-0000-0000-0000-000000000028'::uuid,  350, 'D3', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000029'::uuid,  330, 'D3', 'Canet-en-Roussillon', '66140'),
  ('fa660000-0000-0000-0000-000000000030'::uuid,  310, 'D3', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000031'::uuid,  280, 'D4', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000032'::uuid,  260, 'D4', 'Cabestany',           '66330'),
  ('fa660000-0000-0000-0000-000000000033'::uuid,  240, 'D4', 'Canet-en-Roussillon', '66140'),
  ('fa660000-0000-0000-0000-000000000034'::uuid,  220, 'D4', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000035'::uuid,  200, 'D4', 'Thuir',               '66300'),
  ('fa660000-0000-0000-0000-000000000036'::uuid,  180, 'D4', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000037'::uuid,  160, 'D4', 'Le Soler',            '66270'),
  ('fa660000-0000-0000-0000-000000000038'::uuid,  140, 'D4', 'Rivesaltes',          '66600'),
  ('fa660000-0000-0000-0000-000000000039'::uuid,  130, 'D4', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000040'::uuid,  115, 'D4', 'Bompas',              '66430'),
  ('fa660000-0000-0000-0000-000000000041'::uuid,  100, 'D4', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000042'::uuid,   85, 'D4', 'Cabestany',           '66330'),
  ('fa660000-0000-0000-0000-000000000043'::uuid,   70, 'D4', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000044'::uuid,   55, 'D4', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000045'::uuid,   45, 'D4', 'Argelès-sur-Mer',     '66700'),
  ('fa660000-0000-0000-0000-000000000046'::uuid,   35, 'D4', 'Elne',                '66200'),
  ('fa660000-0000-0000-0000-000000000047'::uuid,   25, 'D4', 'Canet-en-Roussillon', '66140'),
  ('fa660000-0000-0000-0000-000000000048'::uuid,   15, 'D4', 'Perpignan',           '66000'),
  ('fa660000-0000-0000-0000-000000000049'::uuid,   10, 'D4', 'Rivesaltes',          '66600'),
  ('fa660000-0000-0000-0000-000000000050'::uuid,    0, 'D4', 'Perpignan',           '66000')
)
UPDATE profiles p
SET reputation_score = d.score,
    level            = d.lvl,
    reputation_rank  = d.lvl,
    city             = d.city,
    postal_code      = d.pc
FROM desired d
WHERE p.id = d.id;

-- ── 8. Vérifications post-seed ──────────────────────────────────────────────

SELECT 'profils par niveau' AS check_name, level, COUNT(*) AS n
FROM profiles WHERE id::text LIKE 'fa66%' GROUP BY level ORDER BY level;

SELECT 'profils par ville' AS check_name, city, COUNT(*) AS n
FROM profiles WHERE id::text LIKE 'fa66%' GROUP BY city ORDER BY n DESC;

SELECT 'remplissage matchs' AS check_name,
       title,
       current_players || '/' || max_players AS fill,
       ROUND(current_players::numeric / max_players * 100) || '%' AS pct
FROM matches WHERE id::text LIKE 'fb66%' ORDER BY scheduled_at;

SELECT 'organizers manquants' AS check_name, COUNT(*) AS n
FROM matches m WHERE m.id::text LIKE 'fb66%'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = m.organizer_id);

SELECT 'match_players orphelins' AS check_name, COUNT(*) AS n
FROM match_players mp WHERE mp.match_id::text LIKE 'fb66%'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = mp.user_id);

SELECT 'matchs incohérents (count)' AS check_name, COUNT(*) AS n
FROM matches m WHERE m.id::text LIKE 'fb66%'
  AND m.current_players <> (
    SELECT COUNT(*) FROM match_players mp
    WHERE mp.match_id = m.id AND mp.status = 'confirmed'
  );
