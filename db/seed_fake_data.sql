-- ============================================================
-- FootMatch — Seed Data: Profiles, Matches, Match Players
-- Generated: 2026-03-28
-- Run in Supabase SQL Editor in the order shown below:
--   BLOCK 1 → profiles
--   BLOCK 2 → matches
--   BLOCK 3 → match_players
-- ============================================================


-- ============================================================
-- BLOCK 1 — 100 FAKE PROFILES
-- ============================================================

INSERT INTO profiles (id, pseudo, level, reputation_score, reputation_rank) VALUES

-- ── 3 LÉGENDE (score 1500-2500, rank 'Légende', level 'Pro') ──
('fa000000-0000-0000-0000-000000000001', 'ZidouStyle',        'Pro',           2480, 'Légende'),
('fa000000-0000-0000-0000-000000000002', 'MbappeVitesse',     'Pro',           2105, 'Légende'),
('fa000000-0000-0000-0000-000000000003', 'BenzemaStyle',      'Pro',           1742, 'Légende'),

-- ── 12 PRO (score 600-900, rank 'Pro', level 'Pro') ──
('fa000000-0000-0000-0000-000000000004', 'KingFoot',          'Pro',            887, 'Pro'),
('fa000000-0000-0000-0000-000000000005', 'TurboGoal',         'Pro',            864, 'Pro'),
('fa000000-0000-0000-0000-000000000006', 'KantéRunner',       'Pro',            841, 'Pro'),
('fa000000-0000-0000-0000-000000000007', 'GriezStyle',        'Pro',            820, 'Pro'),
('fa000000-0000-0000-0000-000000000008', 'PogbaPass',         'Pro',            798, 'Pro'),
('fa000000-0000-0000-0000-000000000009', 'VaraneMur',         'Pro',            775, 'Pro'),
('fa000000-0000-0000-0000-000000000010', 'TikiTaka',          'Pro',            752, 'Pro'),
('fa000000-0000-0000-0000-000000000011', 'LeButeur',          'Pro',            731, 'Pro'),
('fa000000-0000-0000-0000-000000000012', 'LaFlèche',          'Pro',            710, 'Pro'),
('fa000000-0000-0000-0000-000000000013', 'FootAddict',        'Pro',            689, 'Pro'),
('fa000000-0000-0000-0000-000000000014', 'NightFive',         'Pro',            655, 'Pro'),
('fa000000-0000-0000-0000-000000000015', 'ElPistolero',       'Pro',            622, 'Pro'),

-- ── 30 CONFIRMÉ (score 250-599, rank 'Confirmé', level 'Confirmé') ──
('fa000000-0000-0000-0000-000000000016', 'Parisien93',        'Confirmé',       592, 'Confirmé'),
('fa000000-0000-0000-0000-000000000017', 'LyonnaisFC',        'Confirmé',       575, 'Confirmé'),
('fa000000-0000-0000-0000-000000000018', 'Marseilou13',       'Confirmé',       558, 'Confirmé'),
('fa000000-0000-0000-0000-000000000019', 'PierreFC',          'Confirmé',       541, 'Confirmé'),
('fa000000-0000-0000-0000-000000000020', 'ThomasBall',        'Confirmé',       524, 'Confirmé'),
('fa000000-0000-0000-0000-000000000021', 'SergioGoal',        'Confirmé',       508, 'Confirmé'),
('fa000000-0000-0000-0000-000000000022', 'DribleurFou',       'Confirmé',       491, 'Confirmé'),
('fa000000-0000-0000-0000-000000000023', 'AlexBorde',         'Confirmé',       474, 'Confirmé'),
('fa000000-0000-0000-0000-000000000024', 'MaxiDribble',       'Confirmé',       458, 'Confirmé'),
('fa000000-0000-0000-0000-000000000025', 'LilleBallon',       'Confirmé',       441, 'Confirmé'),
('fa000000-0000-0000-0000-000000000026', 'FootBoost',         'Confirmé',       425, 'Confirmé'),
('fa000000-0000-0000-0000-000000000027', 'OlympienBleu',      'Confirmé',       408, 'Confirmé'),
('fa000000-0000-0000-0000-000000000028', 'NantaisFoot',       'Confirmé',       391, 'Confirmé'),
('fa000000-0000-0000-0000-000000000029', 'BordeauxGold',      'Confirmé',       374, 'Confirmé'),
('fa000000-0000-0000-0000-000000000030', 'ToulousainFoot',    'Confirmé',       358, 'Confirmé'),
('fa000000-0000-0000-0000-000000000031', 'NiceAzur',          'Confirmé',       341, 'Confirmé'),
('fa000000-0000-0000-0000-000000000032', 'CapitaleFC',        'Confirmé',       325, 'Confirmé'),
('fa000000-0000-0000-0000-000000000033', 'RhôneStyle',        'Confirmé',       308, 'Confirmé'),
('fa000000-0000-0000-0000-000000000034', 'MedStyle',          'Confirmé',       291, 'Confirmé'),
('fa000000-0000-0000-0000-000000000035', 'AtlantiqueFC',      'Confirmé',       275, 'Confirmé'),
('fa000000-0000-0000-0000-000000000036', 'GoalkeeperPro',     'Confirmé',       272, 'Confirmé'),
('fa000000-0000-0000-0000-000000000037', 'MillieuTech',       'Confirmé',       269, 'Confirmé'),
('fa000000-0000-0000-0000-000000000038', 'DefenseurFort',     'Confirmé',       265, 'Confirmé'),
('fa000000-0000-0000-0000-000000000039', 'AttaquantVif',      'Confirmé',       262, 'Confirmé'),
('fa000000-0000-0000-0000-000000000040', 'TactikMaster',      'Confirmé',       258, 'Confirmé'),
('fa000000-0000-0000-0000-000000000041', 'FootTech69',        'Confirmé',       255, 'Confirmé'),
('fa000000-0000-0000-0000-000000000042', 'VenteDeButeur',     'Confirmé',       253, 'Confirmé'),
('fa000000-0000-0000-0000-000000000043', 'PasseurParis',      'Confirmé',       251, 'Confirmé'),
('fa000000-0000-0000-0000-000000000044', 'SudisteFoot',       'Confirmé',       250, 'Confirmé'),
('fa000000-0000-0000-0000-000000000045', 'NordFoot',          'Confirmé',       250, 'Confirmé'),

-- ── 35 INTERMÉDIAIRE (score 100-249, rank 'Intermédiaire', level 'Intermédiaire') ──
('fa000000-0000-0000-0000-000000000046', 'NewKid001',         'Intermédiaire',  245, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000047', 'FootCasual',        'Intermédiaire',  238, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000048', 'WeekendFoot',       'Intermédiaire',  231, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000049', 'PetiteBalle',       'Intermédiaire',  224, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000050', 'RueduFoot',         'Intermédiaire',  217, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000051', 'LucasPlay',         'Intermédiaire',  211, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000052', 'KévinBall',         'Intermédiaire',  205, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000053', 'RaphaëlFC',         'Intermédiaire',  199, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000054', 'JulienTouché',      'Intermédiaire',  193, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000055', 'NicolasDrib',       'Intermédiaire',  187, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000056', 'AntoineFoot',       'Intermédiaire',  181, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000057', 'ClémentGoal',       'Intermédiaire',  175, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000058', 'MatthieuPass',      'Intermédiaire',  169, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000059', 'GuillaumeFive',     'Intermédiaire',  163, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000060', 'SylvainBall',       'Intermédiaire',  157, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000061', 'YannickFC',         'Intermédiaire',  151, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000062', 'FabienGoal',        'Intermédiaire',  148, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000063', 'OlivierTir',        'Intermédiaire',  145, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000064', 'BaptisteFoot',      'Intermédiaire',  142, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000065', 'DamienPlay',        'Intermédiaire',  139, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000066', 'SébastienBall',     'Intermédiaire',  136, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000067', 'XavierFive',        'Intermédiaire',  133, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000068', 'PascalFoot',        'Intermédiaire',  130, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000069', 'FrédéricShot',      'Intermédiaire',  127, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000070', 'ThierryBoot',       'Intermédiaire',  124, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000071', 'BriceDrib',         'Intermédiaire',  121, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000072', 'CyrilTech',         'Intermédiaire',  118, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000073', 'DorisFC',           'Intermédiaire',  115, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000074', 'EmmaGoal',          'Intermédiaire',  112, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000075', 'ClaraFoot',         'Intermédiaire',  109, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000076', 'SofiaPlay',         'Intermédiaire',  106, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000077', 'JuliaBall',         'Intermédiaire',  104, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000078', 'LéaFive',           'Intermédiaire',  103, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000079', 'CamilleSport',      'Intermédiaire',  102, 'Intermédiaire'),
('fa000000-0000-0000-0000-000000000080', 'ChloéFoot',         'Intermédiaire',  101, 'Intermédiaire'),

-- ── 20 DÉBUTANT (score 10-99, rank 'Débutant', level 'Débutant') ──
('fa000000-0000-0000-0000-000000000081', 'DebuParis01',       'Débutant',        95, 'Débutant'),
('fa000000-0000-0000-0000-000000000082', 'FirstKick',         'Débutant',        88, 'Débutant'),
('fa000000-0000-0000-0000-000000000083', 'JustStarting',      'Débutant',        81, 'Débutant'),
('fa000000-0000-0000-0000-000000000084', 'FootNewbie',        'Débutant',        74, 'Débutant'),
('fa000000-0000-0000-0000-000000000085', 'PlayerOne99',       'Débutant',        67, 'Débutant'),
('fa000000-0000-0000-0000-000000000086', 'JuniorBalle',       'Débutant',        61, 'Débutant'),
('fa000000-0000-0000-0000-000000000087', 'TotoFoot',          'Débutant',        55, 'Débutant'),
('fa000000-0000-0000-0000-000000000088', 'PetitFoot',         'Débutant',        49, 'Débutant'),
('fa000000-0000-0000-0000-000000000089', 'NoviceBall',        'Débutant',        43, 'Débutant'),
('fa000000-0000-0000-0000-000000000090', 'LernerFC',          'Débutant',        38, 'Débutant'),
('fa000000-0000-0000-0000-000000000091', 'PremierMatch',      'Débutant',        33, 'Débutant'),
('fa000000-0000-0000-0000-000000000092', 'FootDecouverte',    'Débutant',        28, 'Débutant'),
('fa000000-0000-0000-0000-000000000093', 'TerreDeJeu',        'Débutant',        24, 'Débutant'),
('fa000000-0000-0000-0000-000000000094', 'KickOff01',         'Débutant',        21, 'Débutant'),
('fa000000-0000-0000-0000-000000000095', 'BleuDeFoot',        'Débutant',        18, 'Débutant'),
('fa000000-0000-0000-0000-000000000096', 'StagiaireFC',       'Débutant',        16, 'Débutant'),
('fa000000-0000-0000-0000-000000000097', 'ZeroToHero',        'Débutant',        14, 'Débutant'),
('fa000000-0000-0000-0000-000000000098', 'BabyFoot93',        'Débutant',        12, 'Débutant'),
('fa000000-0000-0000-0000-000000000099', 'FootDépart',        'Débutant',        11, 'Débutant'),
('fa000000-0000-0000-0000-000000000100', 'PremierePartie',    'Débutant',        10, 'Débutant')

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- BLOCK 2 — 20 FAKE MATCHES
-- ============================================================
-- Distribution:
--   8 × five  (max_players = 10)
--   7 × city  (max_players = 14)
--   5 × eleven(max_players = 22)
--   15 future matches + 5 past matches
--   2 URGENT matches (current_players = max_players - 1)
-- ============================================================

INSERT INTO matches (
  id, title, type,
  venue_id,
  organizer_id,
  scheduled_at,
  max_players, current_players,
  price_per_player, level,
  description,
  is_private, status
) VALUES

-- ── MATCH 01 · URGENT · five · Paris · FUTURE (+3h) ──
(
  'fb000000-0000-0000-0000-000000000001',
  'Five Rapide – Porte de la Villette',
  'five',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Paris Villette' LIMIT 1),
  'fa000000-0000-0000-0000-000000000001',
  NOW() + INTERVAL '3 hours',
  10, 9,
  8, 'Pro',
  'Match five intense en soirée. Niveau Pro requis. Une place restante, rejoignez-nous !',
  false, 'open'
),

-- ── MATCH 02 · URGENT · city · Lyon · FUTURE (+5h) ──
(
  'fb000000-0000-0000-0000-000000000002',
  'City Match Lyon Gerland – Dernière Place !',
  'city',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Lyon Gerland' LIMIT 1),
  'fa000000-0000-0000-0000-000000000004',
  NOW() + INTERVAL '5 hours',
  14, 13,
  10, 'Confirmé',
  'Match city à Lyon Gerland. Ambiance garantie ! Il ne reste qu''une place, dépêchez-vous.',
  false, 'open'
),

-- ── MATCH 03 · five · Paris Nation · FUTURE (+1 day) ──
(
  'fb000000-0000-0000-0000-000000000003',
  'Five du Dimanche – Paris Nation',
  'five',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Paris Nation' LIMIT 1),
  'fa000000-0000-0000-0000-000000000002',
  NOW() + INTERVAL '1 day',
  10, 6,
  7, 'Confirmé',
  'Match cinq contre cinq ouvert à tous les confirmés. Terrain couvert, parking gratuit.',
  false, 'open'
),

-- ── MATCH 04 · city · Marseille · FUTURE (+1 day) ──
(
  'fb000000-0000-0000-0000-000000000004',
  'City League Marseille Nord',
  'city',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Marseille Nord' LIMIT 1),
  'fa000000-0000-0000-0000-000000000016',
  NOW() + INTERVAL '1 day',
  14, 8,
  9, 'Intermédiaire',
  'Match city ouvert à tous niveaux dès intermédiaire. Complexe top avec vestiaires.',
  false, 'open'
),

-- ── MATCH 05 · eleven · Bordeaux · FUTURE (+2 days) ──
(
  'fb000000-0000-0000-0000-000000000005',
  'Grand Match 11 vs 11 – Bordeaux',
  'eleven',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Bordeaux' LIMIT 1),
  'fa000000-0000-0000-0000-000000000005',
  NOW() + INTERVAL '2 days',
  22, 14,
  5, 'Intermédiaire',
  'Vrai match de football à onze sur gazon synthétique. Tous niveaux intermédiaires bienvenus.',
  false, 'open'
),

-- ── MATCH 06 · five · Toulouse · FUTURE (+2 days) ──
(
  'fb000000-0000-0000-0000-000000000006',
  'Five Capitole – Toulouse',
  'five',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Toulouse Capitole' LIMIT 1),
  'fa000000-0000-0000-0000-000000000017',
  NOW() + INTERVAL '2 days',
  10, 5,
  8, 'Confirmé',
  'Five en soirée au coeur de Toulouse. Niveau confirmé, jeu technique attendu.',
  false, 'open'
),

-- ── MATCH 07 · city · Lille · FUTURE (+3 days) ──
(
  'fb000000-0000-0000-0000-000000000007',
  'City Cup Lille Euralille',
  'city',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Lille Euralille' LIMIT 1),
  'fa000000-0000-0000-0000-000000000006',
  NOW() + INTERVAL '3 days',
  14, 9,
  10, 'Pro',
  'Match city de haut niveau à Euralille. Niveau pro uniquement. Pressing et intensité.',
  false, 'open'
),

-- ── MATCH 08 · five · Nice · FUTURE (+3 days) ──
(
  'fb000000-0000-0000-0000-000000000008',
  'Five Côte d''Azur – Nice',
  'five',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Nice' LIMIT 1),
  'fa000000-0000-0000-0000-000000000018',
  NOW() + INTERVAL '3 days',
  10, 4,
  7, 'Intermédiaire',
  'Five décontracté sous le soleil niçois. Accueil bienveillant pour les intermédiaires.',
  false, 'open'
),

-- ── MATCH 09 · eleven · Paris Bercy · FUTURE (+4 days) ──
(
  'fb000000-0000-0000-0000-000000000009',
  '11 vs 11 – Paris Bercy Weekend',
  'eleven',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Paris Bercy' LIMIT 1),
  'fa000000-0000-0000-0000-000000000003',
  NOW() + INTERVAL '4 days',
  22, 16,
  6, 'Confirmé',
  'Grand match 11 vs 11 organisé chaque weekend. Venez nombreux, bonne ambiance assurée.',
  false, 'open'
),

-- ── MATCH 10 · city · Nantes · FUTURE (+4 days) ──
(
  'fb000000-0000-0000-0000-000000000010',
  'City Match Nantes – Les Canaris',
  'city',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Nantes' LIMIT 1),
  'fa000000-0000-0000-0000-000000000028',
  NOW() + INTERVAL '4 days',
  14, 7,
  8, 'Confirmé',
  'Match city dans l''esprit du FC Nantes. Jeu de passes et fair-play au programme.',
  false, 'open'
),

-- ── MATCH 11 · five · Lyon Part-Dieu · FUTURE (+5 days) ──
(
  'fb000000-0000-0000-0000-000000000011',
  'Five Intense – Lyon Part-Dieu',
  'five',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Lyon Part-Dieu' LIMIT 1),
  'fa000000-0000-0000-0000-000000000007',
  NOW() + INTERVAL '5 days',
  10, 7,
  8, 'Pro',
  'Five haut niveau à Lyon Part-Dieu. Jeu rapide, technique, pressing constant. Pros uniquement.',
  false, 'open'
),

-- ── MATCH 12 · city · Marseille Sud · FUTURE (+5 days) ──
(
  'fb000000-0000-0000-0000-000000000012',
  'City Game Marseille Prado',
  'city',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Marseille Sud' LIMIT 1),
  'fa000000-0000-0000-0000-000000000019',
  NOW() + INTERVAL '5 days',
  14, 10,
  9, 'Confirmé',
  'Match city au Prado, vue sur la mer. Ambiance OM, passion et engagement.',
  false, 'open'
),

-- ── MATCH 13 · eleven · Toulouse Blagnac · FUTURE (+6 days) ──
(
  'fb000000-0000-0000-0000-000000000013',
  '11 vs 11 Toulouse Aéroport Cup',
  'eleven',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Toulouse Blagnac' LIMIT 1),
  'fa000000-0000-0000-0000-000000000020',
  NOW() + INTERVAL '6 days',
  22, 11,
  5, 'Débutant',
  'Match 11 vs 11 ouvert aux débutants. Idéal pour découvrir le foot organisé.',
  false, 'open'
),

-- ── MATCH 14 · five · Paris Villette (private) · FUTURE (+6 days) ──
(
  'fb000000-0000-0000-0000-000000000014',
  'Five Privé – Équipe des Légendes',
  'five',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Paris Villette' LIMIT 1),
  'fa000000-0000-0000-0000-000000000001',
  NOW() + INTERVAL '6 days',
  10, 8,
  15, 'Pro',
  'Session privée entre joueurs de niveau Légende et Pro. Sur invitation uniquement.',
  true, 'open'
),

-- ── MATCH 15 · city · Bordeaux · FUTURE (+7 days) ──
(
  'fb000000-0000-0000-0000-000000000015',
  'City Bordeaux Girondins Style',
  'city',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Bordeaux' LIMIT 1),
  'fa000000-0000-0000-0000-000000000029',
  NOW() + INTERVAL '7 days',
  14, 6,
  8, 'Intermédiaire',
  'Match city dans l''esprit des Girondins. Tous les intermédiaires bienvenus.',
  false, 'open'
),

-- ── MATCH 16 · eleven · Lyon Villeurbanne · PAST (-1 day) ──
(
  'fb000000-0000-0000-0000-000000000016',
  '11 vs 11 Villeurbanne Classic',
  'eleven',
  (SELECT id FROM venues WHERE name = 'Urban Soccer Villeurbanne' LIMIT 1),
  'fa000000-0000-0000-0000-000000000008',
  NOW() - INTERVAL '1 day',
  22, 22,
  5, 'Confirmé',
  'Match 11 vs 11 – terminé. Résultat : 3-2 pour l''équipe rouge. Super ambiance !',
  false, 'closed'
),

-- ── MATCH 17 · five · Marseille Foot Indoor · PAST (-2 days) ──
(
  'fb000000-0000-0000-0000-000000000017',
  'Five Indoor Marseille – Match Amical',
  'five',
  (SELECT id FROM venues WHERE name = 'Foot Indoor Marseille' LIMIT 1),
  'fa000000-0000-0000-0000-000000000009',
  NOW() - INTERVAL '2 days',
  10, 10,
  7, 'Confirmé',
  'Match amical indoor terminé. Niveau confirmé, belle partie jouée.',
  false, 'closed'
),

-- ── MATCH 18 · city · Lille Foot5 · PAST (-3 days) ──
(
  'fb000000-0000-0000-0000-000000000018',
  'City Challenge Lille Nord',
  'city',
  (SELECT id FROM venues WHERE name = 'Foot5 Lille Mons-en-Baroeul' LIMIT 1),
  'fa000000-0000-0000-0000-000000000010',
  NOW() - INTERVAL '3 days',
  14, 12,
  9, 'Intermédiaire',
  'Match city terminé. Ambiance festive et fair-play au programme.',
  false, 'closed'
),

-- ── MATCH 19 · five · Nantes Foot5 · PAST (-4 days) ──
(
  'fb000000-0000-0000-0000-000000000019',
  'Five Nantais – Session du Jeudi',
  'five',
  (SELECT id FROM venues WHERE name = 'Foot5 Nantes Rezé' LIMIT 1),
  'fa000000-0000-0000-0000-000000000011',
  NOW() - INTERVAL '4 days',
  10, 8,
  7, 'Intermédiaire',
  'Session five hebdomadaire terminée. Bonne participation.',
  false, 'closed'
),

-- ── MATCH 20 · city · Nice Citéfoot · PAST (-5 days) ──
(
  'fb000000-0000-0000-0000-000000000020',
  'City Game Nice Lingostière',
  'city',
  (SELECT id FROM venues WHERE name = 'Citéfoot Nice Lingostière' LIMIT 1),
  'fa000000-0000-0000-0000-000000000012',
  NOW() - INTERVAL '5 days',
  14, 11,
  9, 'Confirmé',
  'Match city terminé à Nice Lingostière. Beau niveau, merci à tous les participants.',
  false, 'closed'
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- BLOCK 3 — MATCH PLAYERS
-- ============================================================
-- For each match: organizer (row 1) + enough players to reach current_players.
-- Player UUIDs are drawn from profiles 01-100 in sequence.
-- ============================================================

INSERT INTO match_players (match_id, user_id, status) VALUES

-- ── MATCH 01 · 9 players (organizer = 01) ──
('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000001', 'confirmed'),
('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000004', 'confirmed'),
('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000005', 'confirmed'),
('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000006', 'confirmed'),
('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000007', 'confirmed'),
('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000008', 'confirmed'),
('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000009', 'confirmed'),
('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000010', 'confirmed'),
('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000011', 'confirmed'),

-- ── MATCH 02 · 13 players (organizer = 04) ──
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000004', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000016', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000017', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000018', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000019', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000020', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000021', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000022', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000023', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000024', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000025', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000026', 'confirmed'),
('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000027', 'confirmed'),

-- ── MATCH 03 · 6 players (organizer = 02) ──
('fb000000-0000-0000-0000-000000000003', 'fa000000-0000-0000-0000-000000000002', 'confirmed'),
('fb000000-0000-0000-0000-000000000003', 'fa000000-0000-0000-0000-000000000030', 'confirmed'),
('fb000000-0000-0000-0000-000000000003', 'fa000000-0000-0000-0000-000000000031', 'confirmed'),
('fb000000-0000-0000-0000-000000000003', 'fa000000-0000-0000-0000-000000000032', 'confirmed'),
('fb000000-0000-0000-0000-000000000003', 'fa000000-0000-0000-0000-000000000033', 'confirmed'),
('fb000000-0000-0000-0000-000000000003', 'fa000000-0000-0000-0000-000000000034', 'confirmed'),

-- ── MATCH 04 · 8 players (organizer = 16) ──
('fb000000-0000-0000-0000-000000000004', 'fa000000-0000-0000-0000-000000000016', 'confirmed'),
('fb000000-0000-0000-0000-000000000004', 'fa000000-0000-0000-0000-000000000046', 'confirmed'),
('fb000000-0000-0000-0000-000000000004', 'fa000000-0000-0000-0000-000000000047', 'confirmed'),
('fb000000-0000-0000-0000-000000000004', 'fa000000-0000-0000-0000-000000000048', 'confirmed'),
('fb000000-0000-0000-0000-000000000004', 'fa000000-0000-0000-0000-000000000049', 'confirmed'),
('fb000000-0000-0000-0000-000000000004', 'fa000000-0000-0000-0000-000000000050', 'confirmed'),
('fb000000-0000-0000-0000-000000000004', 'fa000000-0000-0000-0000-000000000051', 'confirmed'),
('fb000000-0000-0000-0000-000000000004', 'fa000000-0000-0000-0000-000000000052', 'confirmed'),

-- ── MATCH 05 · 14 players (organizer = 05) ──
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000005', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000053', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000054', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000055', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000056', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000057', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000058', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000059', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000060', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000061', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000062', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000063', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000064', 'confirmed'),
('fb000000-0000-0000-0000-000000000005', 'fa000000-0000-0000-0000-000000000065', 'confirmed'),

-- ── MATCH 06 · 5 players (organizer = 17) ──
('fb000000-0000-0000-0000-000000000006', 'fa000000-0000-0000-0000-000000000017', 'confirmed'),
('fb000000-0000-0000-0000-000000000006', 'fa000000-0000-0000-0000-000000000035', 'confirmed'),
('fb000000-0000-0000-0000-000000000006', 'fa000000-0000-0000-0000-000000000036', 'confirmed'),
('fb000000-0000-0000-0000-000000000006', 'fa000000-0000-0000-0000-000000000037', 'confirmed'),
('fb000000-0000-0000-0000-000000000006', 'fa000000-0000-0000-0000-000000000038', 'confirmed'),

-- ── MATCH 07 · 9 players (organizer = 06) ──
('fb000000-0000-0000-0000-000000000007', 'fa000000-0000-0000-0000-000000000006', 'confirmed'),
('fb000000-0000-0000-0000-000000000007', 'fa000000-0000-0000-0000-000000000013', 'confirmed'),
('fb000000-0000-0000-0000-000000000007', 'fa000000-0000-0000-0000-000000000014', 'confirmed'),
('fb000000-0000-0000-0000-000000000007', 'fa000000-0000-0000-0000-000000000015', 'confirmed'),
('fb000000-0000-0000-0000-000000000007', 'fa000000-0000-0000-0000-000000000039', 'confirmed'),
('fb000000-0000-0000-0000-000000000007', 'fa000000-0000-0000-0000-000000000040', 'confirmed'),
('fb000000-0000-0000-0000-000000000007', 'fa000000-0000-0000-0000-000000000041', 'confirmed'),
('fb000000-0000-0000-0000-000000000007', 'fa000000-0000-0000-0000-000000000042', 'confirmed'),
('fb000000-0000-0000-0000-000000000007', 'fa000000-0000-0000-0000-000000000043', 'confirmed'),

-- ── MATCH 08 · 4 players (organizer = 18) ──
('fb000000-0000-0000-0000-000000000008', 'fa000000-0000-0000-0000-000000000018', 'confirmed'),
('fb000000-0000-0000-0000-000000000008', 'fa000000-0000-0000-0000-000000000066', 'confirmed'),
('fb000000-0000-0000-0000-000000000008', 'fa000000-0000-0000-0000-000000000067', 'confirmed'),
('fb000000-0000-0000-0000-000000000008', 'fa000000-0000-0000-0000-000000000068', 'confirmed'),

-- ── MATCH 09 · 16 players (organizer = 03) ──
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000003', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000069', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000070', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000071', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000072', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000073', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000074', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000075', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000076', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000077', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000078', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000079', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000080', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000081', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000082', 'confirmed'),
('fb000000-0000-0000-0000-000000000009', 'fa000000-0000-0000-0000-000000000083', 'confirmed'),

-- ── MATCH 10 · 7 players (organizer = 28) ──
('fb000000-0000-0000-0000-000000000010', 'fa000000-0000-0000-0000-000000000028', 'confirmed'),
('fb000000-0000-0000-0000-000000000010', 'fa000000-0000-0000-0000-000000000044', 'confirmed'),
('fb000000-0000-0000-0000-000000000010', 'fa000000-0000-0000-0000-000000000045', 'confirmed'),
('fb000000-0000-0000-0000-000000000010', 'fa000000-0000-0000-0000-000000000084', 'confirmed'),
('fb000000-0000-0000-0000-000000000010', 'fa000000-0000-0000-0000-000000000085', 'confirmed'),
('fb000000-0000-0000-0000-000000000010', 'fa000000-0000-0000-0000-000000000086', 'confirmed'),
('fb000000-0000-0000-0000-000000000010', 'fa000000-0000-0000-0000-000000000087', 'confirmed'),

-- ── MATCH 11 · 7 players (organizer = 07) ──
('fb000000-0000-0000-0000-000000000011', 'fa000000-0000-0000-0000-000000000007', 'confirmed'),
('fb000000-0000-0000-0000-000000000011', 'fa000000-0000-0000-0000-000000000012', 'confirmed'),
('fb000000-0000-0000-0000-000000000011', 'fa000000-0000-0000-0000-000000000013', 'confirmed'),
('fb000000-0000-0000-0000-000000000011', 'fa000000-0000-0000-0000-000000000014', 'confirmed'),
('fb000000-0000-0000-0000-000000000011', 'fa000000-0000-0000-0000-000000000015', 'confirmed'),
('fb000000-0000-0000-0000-000000000011', 'fa000000-0000-0000-0000-000000000088', 'confirmed'),
('fb000000-0000-0000-0000-000000000011', 'fa000000-0000-0000-0000-000000000089', 'confirmed'),

-- ── MATCH 12 · 10 players (organizer = 19) ──
('fb000000-0000-0000-0000-000000000012', 'fa000000-0000-0000-0000-000000000019', 'confirmed'),
('fb000000-0000-0000-0000-000000000012', 'fa000000-0000-0000-0000-000000000021', 'confirmed'),
('fb000000-0000-0000-0000-000000000012', 'fa000000-0000-0000-0000-000000000022', 'confirmed'),
('fb000000-0000-0000-0000-000000000012', 'fa000000-0000-0000-0000-000000000023', 'confirmed'),
('fb000000-0000-0000-0000-000000000012', 'fa000000-0000-0000-0000-000000000024', 'confirmed'),
('fb000000-0000-0000-0000-000000000012', 'fa000000-0000-0000-0000-000000000025', 'confirmed'),
('fb000000-0000-0000-0000-000000000012', 'fa000000-0000-0000-0000-000000000090', 'confirmed'),
('fb000000-0000-0000-0000-000000000012', 'fa000000-0000-0000-0000-000000000091', 'confirmed'),
('fb000000-0000-0000-0000-000000000012', 'fa000000-0000-0000-0000-000000000092', 'confirmed'),
('fb000000-0000-0000-0000-000000000012', 'fa000000-0000-0000-0000-000000000093', 'confirmed'),

-- ── MATCH 13 · 11 players (organizer = 20) ──
('fb000000-0000-0000-0000-000000000013', 'fa000000-0000-0000-0000-000000000020', 'confirmed'),
('fb000000-0000-0000-0000-000000000013', 'fa000000-0000-0000-0000-000000000094', 'confirmed'),
('fb000000-0000-0000-0000-000000000013', 'fa000000-0000-0000-0000-000000000095', 'confirmed'),
('fb000000-0000-0000-0000-000000000013', 'fa000000-0000-0000-0000-000000000096', 'confirmed'),
('fb000000-0000-0000-0000-000000000013', 'fa000000-0000-0000-0000-000000000097', 'confirmed'),
('fb000000-0000-0000-0000-000000000013', 'fa000000-0000-0000-0000-000000000098', 'confirmed'),
('fb000000-0000-0000-0000-000000000013', 'fa000000-0000-0000-0000-000000000099', 'confirmed'),
('fb000000-0000-0000-0000-000000000013', 'fa000000-0000-0000-0000-000000000100', 'confirmed'),
('fb000000-0000-0000-0000-000000000013', 'fa000000-0000-0000-0000-000000000081', 'confirmed'),
('fb000000-0000-0000-0000-000000000013', 'fa000000-0000-0000-0000-000000000082', 'confirmed'),
('fb000000-0000-0000-0000-000000000013', 'fa000000-0000-0000-0000-000000000083', 'confirmed'),

-- ── MATCH 14 · 8 players (organizer = 01, private) ──
('fb000000-0000-0000-0000-000000000014', 'fa000000-0000-0000-0000-000000000001', 'confirmed'),
('fb000000-0000-0000-0000-000000000014', 'fa000000-0000-0000-0000-000000000002', 'confirmed'),
('fb000000-0000-0000-0000-000000000014', 'fa000000-0000-0000-0000-000000000003', 'confirmed'),
('fb000000-0000-0000-0000-000000000014', 'fa000000-0000-0000-0000-000000000004', 'confirmed'),
('fb000000-0000-0000-0000-000000000014', 'fa000000-0000-0000-0000-000000000005', 'confirmed'),
('fb000000-0000-0000-0000-000000000014', 'fa000000-0000-0000-0000-000000000006', 'confirmed'),
('fb000000-0000-0000-0000-000000000014', 'fa000000-0000-0000-0000-000000000007', 'confirmed'),
('fb000000-0000-0000-0000-000000000014', 'fa000000-0000-0000-0000-000000000008', 'confirmed'),

-- ── MATCH 15 · 6 players (organizer = 29) ──
('fb000000-0000-0000-0000-000000000015', 'fa000000-0000-0000-0000-000000000029', 'confirmed'),
('fb000000-0000-0000-0000-000000000015', 'fa000000-0000-0000-0000-000000000049', 'confirmed'),
('fb000000-0000-0000-0000-000000000015', 'fa000000-0000-0000-0000-000000000050', 'confirmed'),
('fb000000-0000-0000-0000-000000000015', 'fa000000-0000-0000-0000-000000000051', 'confirmed'),
('fb000000-0000-0000-0000-000000000015', 'fa000000-0000-0000-0000-000000000052', 'confirmed'),
('fb000000-0000-0000-0000-000000000015', 'fa000000-0000-0000-0000-000000000053', 'confirmed'),

-- ── MATCH 16 · 22 players (organizer = 08, PAST/closed) ──
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000008', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000009', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000010', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000011', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000012', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000013', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000016', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000017', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000018', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000019', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000020', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000021', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000022', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000023', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000024', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000025', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000026', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000027', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000028', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000029', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000030', 'confirmed'),
('fb000000-0000-0000-0000-000000000016', 'fa000000-0000-0000-0000-000000000031', 'confirmed'),

-- ── MATCH 17 · 10 players (organizer = 09, PAST/closed) ──
('fb000000-0000-0000-0000-000000000017', 'fa000000-0000-0000-0000-000000000009', 'confirmed'),
('fb000000-0000-0000-0000-000000000017', 'fa000000-0000-0000-0000-000000000032', 'confirmed'),
('fb000000-0000-0000-0000-000000000017', 'fa000000-0000-0000-0000-000000000033', 'confirmed'),
('fb000000-0000-0000-0000-000000000017', 'fa000000-0000-0000-0000-000000000034', 'confirmed'),
('fb000000-0000-0000-0000-000000000017', 'fa000000-0000-0000-0000-000000000035', 'confirmed'),
('fb000000-0000-0000-0000-000000000017', 'fa000000-0000-0000-0000-000000000036', 'confirmed'),
('fb000000-0000-0000-0000-000000000017', 'fa000000-0000-0000-0000-000000000037', 'confirmed'),
('fb000000-0000-0000-0000-000000000017', 'fa000000-0000-0000-0000-000000000038', 'confirmed'),
('fb000000-0000-0000-0000-000000000017', 'fa000000-0000-0000-0000-000000000039', 'confirmed'),
('fb000000-0000-0000-0000-000000000017', 'fa000000-0000-0000-0000-000000000040', 'confirmed'),

-- ── MATCH 18 · 12 players (organizer = 10, PAST/closed) ──
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000010', 'confirmed'),
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000054', 'confirmed'),
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000055', 'confirmed'),
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000056', 'confirmed'),
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000057', 'confirmed'),
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000058', 'confirmed'),
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000059', 'confirmed'),
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000060', 'confirmed'),
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000061', 'confirmed'),
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000062', 'confirmed'),
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000063', 'confirmed'),
('fb000000-0000-0000-0000-000000000018', 'fa000000-0000-0000-0000-000000000064', 'confirmed'),

-- ── MATCH 19 · 8 players (organizer = 11, PAST/closed) ──
('fb000000-0000-0000-0000-000000000019', 'fa000000-0000-0000-0000-000000000011', 'confirmed'),
('fb000000-0000-0000-0000-000000000019', 'fa000000-0000-0000-0000-000000000065', 'confirmed'),
('fb000000-0000-0000-0000-000000000019', 'fa000000-0000-0000-0000-000000000066', 'confirmed'),
('fb000000-0000-0000-0000-000000000019', 'fa000000-0000-0000-0000-000000000067', 'confirmed'),
('fb000000-0000-0000-0000-000000000019', 'fa000000-0000-0000-0000-000000000068', 'confirmed'),
('fb000000-0000-0000-0000-000000000019', 'fa000000-0000-0000-0000-000000000069', 'confirmed'),
('fb000000-0000-0000-0000-000000000019', 'fa000000-0000-0000-0000-000000000070', 'confirmed'),
('fb000000-0000-0000-0000-000000000019', 'fa000000-0000-0000-0000-000000000071', 'confirmed'),

-- ── MATCH 20 · 11 players (organizer = 12, PAST/closed) ──
('fb000000-0000-0000-0000-000000000020', 'fa000000-0000-0000-0000-000000000012', 'confirmed'),
('fb000000-0000-0000-0000-000000000020', 'fa000000-0000-0000-0000-000000000072', 'confirmed'),
('fb000000-0000-0000-0000-000000000020', 'fa000000-0000-0000-0000-000000000073', 'confirmed'),
('fb000000-0000-0000-0000-000000000020', 'fa000000-0000-0000-0000-000000000074', 'confirmed'),
('fb000000-0000-0000-0000-000000000020', 'fa000000-0000-0000-0000-000000000075', 'confirmed'),
('fb000000-0000-0000-0000-000000000020', 'fa000000-0000-0000-0000-000000000076', 'confirmed'),
('fb000000-0000-0000-0000-000000000020', 'fa000000-0000-0000-0000-000000000077', 'confirmed'),
('fb000000-0000-0000-0000-000000000020', 'fa000000-0000-0000-0000-000000000078', 'confirmed'),
('fb000000-0000-0000-0000-000000000020', 'fa000000-0000-0000-0000-000000000079', 'confirmed'),
('fb000000-0000-0000-0000-000000000020', 'fa000000-0000-0000-0000-000000000080', 'confirmed'),
('fb000000-0000-0000-0000-000000000020', 'fa000000-0000-0000-0000-000000000084', 'confirmed')

ON CONFLICT DO NOTHING;

-- ============================================================
-- BLOCK 4 — NORMALISATION REALISTE DES PROFILS ET MATCHS FAKE
-- Objectif : aucun faux joueur au-dessus de D2
-- ============================================================

UPDATE profiles
SET
  reputation_score = CASE
    WHEN substring(id::text from 35 for 3)::int <= 12 THEN 820 + ((substring(id::text from 35 for 3)::int - 1) * 42)
    WHEN substring(id::text from 35 for 3)::int <= 38 THEN 320 + ((substring(id::text from 35 for 3)::int - 13) * 18)
    ELSE floor(random() * 260)::int
  END,
  level = CASE
    WHEN substring(id::text from 35 for 3)::int <= 12 THEN 'D2'
    WHEN substring(id::text from 35 for 3)::int <= 38 THEN 'D3'
    ELSE 'D4'
  END,
  reputation_rank = CASE
    WHEN substring(id::text from 35 for 3)::int <= 12 THEN 'D2'
    WHEN substring(id::text from 35 for 3)::int <= 38 THEN 'D3'
    ELSE 'D4'
  END
WHERE id::text LIKE 'fa%';

UPDATE matches
SET level = CASE
  WHEN current_players >= greatest(ceil(max_players * 0.75), 2) THEN 'D2'
  WHEN current_players >= greatest(ceil(max_players * 0.45), 2) THEN 'D3'
  ELSE 'D4'
END
WHERE id::text LIKE 'fb%';

-- ============================================================
-- BLOCK 5 — PASSE DE REALISME FINALE
-- Objectif : profils plus sobres et matchs plus naturels
-- ============================================================

DO $$
DECLARE
  pseudos TEXT[] := ARRAY[
    'samir93','mehdi75','yassine_foot','nassim92','adil_paris','karimfive','bilal_95','aminejeu','walidfc','momo_paris',
    'samylyon','hamza_foot','ilyes13','reda_ball','sofiane75','yanisfive','rachidfc','omar13','nabiljeu','hicham_foot',
    'pierre_lyon','thomasfoot','lucas95','enzofive','antoinefc','maximejeu','julienball','arthur_foot','leo_paris','hugo92',
    'romainfive','baptistefc','quentin_jeu','kevin75','dorianfoot','remi_paris','clementfc','loicfive','damienjeu','florian_foot',
    'alex95','charlesball','tristanfc','gabrieljeu','raf_foot','valentin75','jeremyfc','tibo_paris','edouardfive','guillaume93',
    'bilal_lyon','younes75','mouradfc','idrissjeu','mamadou93','ibra_foot','lamine75','cheikhfc','rubenball','carlosfive',
    'diego93','mateo75','sergiofc','pablojeu','nassimfoot','ayoub_95','tarekfc','walid93','mehdi_lyon','amine75',
    'sarahfive','ines_foot','emma75','clarajeu','lea_paris','sofiafc','camillefive','julia_foot','nora75','manonjeu',
    'paul_foot','louis93','simonfc','noe_jeu','maelfive','axel_foot','theo75','nathanfc','tom_jeu','eliasfive',
    'mehdi_debut','samy_match','walidnew','karimstart','amine_city','nabilfive','leo_debut','hugo_city','thomasjeu','lucas_debut'
  ];
  idx INTEGER;
  pid TEXT;
BEGIN
  FOR idx IN 1..100 LOOP
    pid := 'fa000000-0000-0000-0000-' || lpad(idx::text, 12, '0');
    UPDATE profiles
    SET pseudo = pseudos[idx]
    WHERE id = pid::uuid;
  END LOOP;
END $$;

UPDATE matches
SET
  title = CASE id::text
    WHEN 'fb000000-0000-0000-0000-000000000001' THEN 'Five ce soir - Paris Villette'
    WHEN 'fb000000-0000-0000-0000-000000000002' THEN 'City ce soir - Lyon Gerland'
    WHEN 'fb000000-0000-0000-0000-000000000003' THEN 'Five dimanche - Paris Nation'
    WHEN 'fb000000-0000-0000-0000-000000000004' THEN 'City mercredi - Marseille Nord'
    WHEN 'fb000000-0000-0000-0000-000000000005' THEN 'Foot a 11 dimanche - Bordeaux'
    WHEN 'fb000000-0000-0000-0000-000000000006' THEN 'Five apres boulot - Toulouse'
    WHEN 'fb000000-0000-0000-0000-000000000007' THEN 'City fin de semaine - Lille'
    WHEN 'fb000000-0000-0000-0000-000000000008' THEN 'Five en soiree - Nice'
    WHEN 'fb000000-0000-0000-0000-000000000009' THEN 'Foot a 11 weekend - Paris Bercy'
    WHEN 'fb000000-0000-0000-0000-000000000010' THEN 'City jeudi - Nantes'
    WHEN 'fb000000-0000-0000-0000-000000000011' THEN 'Five Part-Dieu - Lyon'
    WHEN 'fb000000-0000-0000-0000-000000000012' THEN 'City du soir - Marseille Prado'
    WHEN 'fb000000-0000-0000-0000-000000000013' THEN 'Foot a 11 - Toulouse Blagnac'
    WHEN 'fb000000-0000-0000-0000-000000000014' THEN 'Five prive entre habituels'
    WHEN 'fb000000-0000-0000-0000-000000000015' THEN 'City du dimanche - Bordeaux'
    WHEN 'fb000000-0000-0000-0000-000000000016' THEN 'Foot a 11 - Villeurbanne'
    WHEN 'fb000000-0000-0000-0000-000000000017' THEN 'Five amical - Marseille'
    WHEN 'fb000000-0000-0000-0000-000000000018' THEN 'City du mardi - Lille'
    WHEN 'fb000000-0000-0000-0000-000000000019' THEN 'Five du jeudi - Nantes'
    WHEN 'fb000000-0000-0000-0000-000000000020' THEN 'City Lingostiere - Nice'
    ELSE title
  END,
  description = CASE id::text
    WHEN 'fb000000-0000-0000-0000-000000000001' THEN 'Depart dans quelques heures, ambiance correcte et jeu simple. Il reste une place.'
    WHEN 'fb000000-0000-0000-0000-000000000002' THEN 'Match du soir a Gerland. Groupe regulier, il manque encore un joueur.'
    WHEN 'fb000000-0000-0000-0000-000000000003' THEN 'Five du week-end, niveau D3-D4, terrain couvert.'
    WHEN 'fb000000-0000-0000-0000-000000000004' THEN 'City ouvert a un groupe melange, bon esprit demande.'
    WHEN 'fb000000-0000-0000-0000-000000000005' THEN 'Foot a 11 sur synthetique, groupe amateur, match sans pression.'
    WHEN 'fb000000-0000-0000-0000-000000000006' THEN 'Five en semaine apres le travail, niveau correct, jeu collectif.'
    WHEN 'fb000000-0000-0000-0000-000000000007' THEN 'City de fin de semaine, joueurs habituels, encore quelques places.'
    WHEN 'fb000000-0000-0000-0000-000000000008' THEN 'Five ouvert, rythme tranquille, parfait pour relancer une partie.'
    WHEN 'fb000000-0000-0000-0000-000000000009' THEN 'Match a 11 prevu le week-end avec un noyau deja forme.'
    WHEN 'fb000000-0000-0000-0000-000000000010' THEN 'City en soiree, on cherche surtout des joueurs fiables.'
    WHEN 'fb000000-0000-0000-0000-000000000011' THEN 'Five a Lyon, groupe propre, bon niveau amateur.'
    WHEN 'fb000000-0000-0000-0000-000000000012' THEN 'City au Prado, match engage mais dans un bon esprit.'
    WHEN 'fb000000-0000-0000-0000-000000000013' THEN 'Foot a 11 accessible pour se remettre dans le rythme.'
    WHEN 'fb000000-0000-0000-0000-000000000014' THEN 'Session privee entre joueurs qui se connaissent deja.'
    WHEN 'fb000000-0000-0000-0000-000000000015' THEN 'City du dimanche avec un groupe melange et quelques places libres.'
    WHEN 'fb000000-0000-0000-0000-000000000016' THEN 'Match termine, bonne intensite et effectif complet.'
    WHEN 'fb000000-0000-0000-0000-000000000017' THEN 'Five amical joue en indoor, rythme correct et bon etat d''esprit.'
    WHEN 'fb000000-0000-0000-0000-000000000018' THEN 'City termine avec un groupe serieux et quelques nouveaux.'
    WHEN 'fb000000-0000-0000-0000-000000000019' THEN 'Session hebdo classique, match joue sans incident.'
    WHEN 'fb000000-0000-0000-0000-000000000020' THEN 'City termine a Nice, groupe regulier et match propre.'
    ELSE description
  END
WHERE id::text LIKE 'fb%';
