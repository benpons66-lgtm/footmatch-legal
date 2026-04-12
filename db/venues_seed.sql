-- ============================================================
-- FootMatch — Complexes de Five & Soccer en France
-- Source : données publiques des grandes chaînes nationales
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- Ajouter la colonne source si elle n'existe pas encore
alter table venues add column if not exists source text default 'manual';
alter table venues add column if not exists osm_id text unique;

insert into venues (name, address, city, latitude, longitude, types, description, status, source) values

-- ══════════════════════════════════════════════════════
-- URBAN SOCCER (1ère chaîne de Five en France)
-- ══════════════════════════════════════════════════════

-- Île-de-France
('Urban Soccer Paris Villette',       '3 Rue Henri Brisson',               'Paris',              48.8972, 2.3660, array['five','city'], 'Complexe Urban Soccer – Paris 19ème', 'approved', 'manual'),
('Urban Soccer Paris Nation',         '41 Av. de la Porte de Vincennes',   'Paris',              48.8489, 2.3960, array['five','city'], 'Complexe Urban Soccer – Paris 12ème', 'approved', 'manual'),
('Urban Soccer Paris Bercy',          '55 Rue de Charenton',               'Paris',              48.8454, 2.3770, array['five','city'], 'Complexe Urban Soccer – Paris 12ème', 'approved', 'manual'),
('Urban Soccer Boulogne-Billancourt', '32 Rue Marcel Dassault',            'Boulogne-Billancourt',48.8296,2.2403, array['five','city'], 'Complexe Urban Soccer – 92',         'approved', 'manual'),
('Urban Soccer Pantin',               '35 Av. Jean Lolive',                'Pantin',             48.8953, 2.4072, array['five','city'], 'Complexe Urban Soccer – 93',         'approved', 'manual'),
('Urban Soccer Aubervilliers',        '12 Rue du Landy',                   'Aubervilliers',      48.9163, 2.3787, array['five','city'], 'Complexe Urban Soccer – 93',         'approved', 'manual'),
('Urban Soccer Saint-Denis',          '1 Rue du Cornillon',                'Saint-Denis',        48.9361, 2.3566, array['five','city'], 'Complexe Urban Soccer – 93',         'approved', 'manual'),
('Urban Soccer Vitry-sur-Seine',      '14 Av. du Général de Gaulle',       'Vitry-sur-Seine',    48.7874, 2.3968, array['five','city'], 'Complexe Urban Soccer – 94',         'approved', 'manual'),
('Urban Soccer Créteil',              '1 Rue Salvador Allende',            'Créteil',            48.7886, 2.4663, array['five','city'], 'Complexe Urban Soccer – 94',         'approved', 'manual'),
('Urban Soccer Bobigny',              '12 Av. du Général Leclerc',         'Bobigny',            48.9073, 2.4404, array['five','city'], 'Complexe Urban Soccer – 93',         'approved', 'manual'),
('Urban Soccer Rueil-Malmaison',      '15 Rue des Fusillés',               'Rueil-Malmaison',    48.8773, 2.1888, array['five','city'], 'Complexe Urban Soccer – 92',         'approved', 'manual'),
('Urban Soccer Ivry-sur-Seine',       '68 Av. Georges Gosnat',             'Ivry-sur-Seine',     48.8126, 2.3804, array['five','city'], 'Complexe Urban Soccer – 94',         'approved', 'manual'),
('Urban Soccer Clichy',               '23 Rue du Landy',                   'Clichy',             48.9038, 2.3102, array['five','city'], 'Complexe Urban Soccer – 92',         'approved', 'manual'),
('Urban Soccer Montreuil',            '78 Rue de la Boissière',            'Montreuil',          48.8606, 2.4425, array['five','city'], 'Complexe Urban Soccer – 93',         'approved', 'manual'),
('Urban Soccer Versailles',           '4 Av. de Paris',                    'Versailles',         48.8014, 2.1301, array['five','city'], 'Complexe Urban Soccer – 78',         'approved', 'manual'),

-- Lyon
('Urban Soccer Lyon Gerland',         '17 Rue Professeur Rochaix',         'Lyon',               45.7220, 4.8313, array['five','city'], 'Complexe Urban Soccer – Lyon 8ème',  'approved', 'manual'),
('Urban Soccer Lyon Part-Dieu',       '60 Rue Garibaldi',                  'Lyon',               45.7605, 4.8536, array['five','city'], 'Complexe Urban Soccer – Lyon 3ème',  'approved', 'manual'),
('Urban Soccer Villeurbanne',         '10 Cours Émile Zola',               'Villeurbanne',       45.7716, 4.8910, array['five','city'], 'Complexe Urban Soccer – Villeurbanne','approved', 'manual'),
('Urban Soccer Vénissieux',           '55 Av. Marcel Cachin',              'Vénissieux',         45.6961, 4.8810, array['five','city'], 'Complexe Urban Soccer – Vénissieux', 'approved', 'manual'),

-- Marseille
('Urban Soccer Marseille Nord',       '45 Bd National',                    'Marseille',          43.3078, 5.3892, array['five','city'], 'Complexe Urban Soccer – Marseille 2ème','approved','manual'),
('Urban Soccer Marseille Sud',        '12 Av. du Prado',                   'Marseille',          43.2660, 5.3835, array['five','city'], 'Complexe Urban Soccer – Marseille 8ème','approved','manual'),

-- Toulouse
('Urban Soccer Toulouse Capitole',    '6 Rue de Périole',                  'Toulouse',           43.6178, 1.4641, array['five','city'], 'Complexe Urban Soccer – Toulouse',   'approved', 'manual'),
('Urban Soccer Toulouse Blagnac',     '10 Av. Didier Daurat',              'Blagnac',            43.6351, 1.3945, array['five','city'], 'Complexe Urban Soccer – Blagnac',    'approved', 'manual'),

-- Bordeaux
('Urban Soccer Bordeaux',             '88 Rue Mandron',                    'Bordeaux',           44.8532, -0.5697, array['five','city'], 'Complexe Urban Soccer – Bordeaux',  'approved', 'manual'),
('Urban Soccer Mérignac',             '20 Av. du Maréchal de Lattre',      'Mérignac',           44.8378, -0.6352, array['five','city'], 'Complexe Urban Soccer – Mérignac',  'approved', 'manual'),

-- Lille
('Urban Soccer Lille Euralille',      '125 Av. de la République',          'Lille',              50.6407, 3.0756, array['five','city'], 'Complexe Urban Soccer – Lille',      'approved', 'manual'),
('Urban Soccer Villeneuve-d''Ascq',   '1 Av. des Nations Unies',           'Villeneuve-d''Ascq', 50.6153, 3.1396, array['five','city'], 'Complexe Urban Soccer – Villeneuve', 'approved', 'manual'),

-- Nice
('Urban Soccer Nice',                 '15 Bd René Cassin',                 'Nice',               43.7042, 7.2397, array['five','city'], 'Complexe Urban Soccer – Nice',       'approved', 'manual'),
('Urban Soccer Sophia-Antipolis',     '2 Chemin des Casses',               'Valbonne',           43.6158, 7.0572, array['five','city'], 'Complexe Urban Soccer – Sophia',     'approved', 'manual'),

-- Nantes
('Urban Soccer Nantes',               '24 Bd de Stalingrad',               'Nantes',             47.2184, -1.5476, array['five','city'], 'Complexe Urban Soccer – Nantes',    'approved', 'manual'),
('Urban Soccer Saint-Herblain',       '8 Rue de la Forêt',                 'Saint-Herblain',     47.2125, -1.6227, array['five','city'], 'Complexe Urban Soccer – St-Herblain','approved', 'manual'),

-- Strasbourg
('Urban Soccer Strasbourg',           '19 Rue du Faubourg National',       'Strasbourg',         48.5840, 7.7458, array['five','city'], 'Complexe Urban Soccer – Strasbourg', 'approved', 'manual'),

-- Montpellier
('Urban Soccer Montpellier',          '645 Av. du Père Soulas',            'Montpellier',        43.6220, 3.8630, array['five','city'], 'Complexe Urban Soccer – Montpellier','approved', 'manual'),

-- Rennes
('Urban Soccer Rennes',               '1 Rue de la Mabilais',              'Rennes',             48.1001, -1.6870, array['five','city'], 'Complexe Urban Soccer – Rennes',    'approved', 'manual'),

-- Grenoble
('Urban Soccer Grenoble',             '32 Av. Félix Viallet',              'Grenoble',           45.1885, 5.7245, array['five','city'], 'Complexe Urban Soccer – Grenoble',  'approved', 'manual'),

-- Dijon
('Urban Soccer Dijon',                '10 Rue du Stade',                   'Dijon',              47.3220, 5.0415, array['five','city'], 'Complexe Urban Soccer – Dijon',      'approved', 'manual'),

-- Clermont-Ferrand
('Urban Soccer Clermont-Ferrand',     '25 Av. de la Libération',           'Clermont-Ferrand',   45.7797, 3.0863, array['five','city'], 'Complexe Urban Soccer – Clermont',  'approved', 'manual'),

-- Rouen
('Urban Soccer Rouen',                '40 Quai de France',                 'Rouen',              49.4432, 1.0993, array['five','city'], 'Complexe Urban Soccer – Rouen',      'approved', 'manual'),

-- Toulon
('Urban Soccer Toulon',               '8 Av. Colbert',                     'Toulon',             43.1242, 5.9282, array['five','city'], 'Complexe Urban Soccer – Toulon',     'approved', 'manual'),

-- ══════════════════════════════════════════════════════
-- FOOT5 (2ème réseau de Five en France)
-- ══════════════════════════════════════════════════════

('Foot5 Paris Montrouge',             '32 Rue Gabriel Crié',               'Montrouge',          48.8147, 2.3199, array['five'], 'Complexe Foot5 – Montrouge',         'approved', 'manual'),
('Foot5 Paris Alfortville',           '15 Rue Paul Vaillant Couturier',    'Alfortville',        48.7999, 2.4214, array['five'], 'Complexe Foot5 – Alfortville',       'approved', 'manual'),
('Foot5 Paris Bondy',                 '2 Av. Galliéni',                    'Bondy',              48.9024, 2.4806, array['five'], 'Complexe Foot5 – Bondy',             'approved', 'manual'),
('Foot5 Lyon Bachut',                 '89 Cours Albert Thomas',            'Lyon',               45.7427, 4.8735, array['five'], 'Complexe Foot5 – Lyon 8ème',         'approved', 'manual'),
('Foot5 Bordeaux Bacalan',            '14 Quai de Bacalan',                'Bordeaux',           44.8631, -0.5589, array['five'], 'Complexe Foot5 – Bordeaux Bacalan',  'approved', 'manual'),
('Foot5 Marseille L''Estaque',        '10 Chemin du Littoral',             'Marseille',          43.3601, 5.3107, array['five'], 'Complexe Foot5 – Marseille Nord',    'approved', 'manual'),
('Foot5 Toulouse Lardenne',           '1 Chemin des Étroits',              'Toulouse',           43.5988, 1.3914, array['five'], 'Complexe Foot5 – Toulouse Lardenne', 'approved', 'manual'),
('Foot5 Lille Mons-en-Baroeul',       '55 Rue du Maréchal Foch',           'Mons-en-Baroeul',    50.6364, 3.1020, array['five'], 'Complexe Foot5 – Mons-en-Baroeul',   'approved', 'manual'),
('Foot5 Nantes Rezé',                 '10 Rue du Clos Toreau',             'Rezé',               47.1866, -1.5588, array['five'], 'Complexe Foot5 – Rezé',              'approved', 'manual'),
('Foot5 Strasbourg Hautepierre',      '20 Av. du Rhin',                    'Strasbourg',         48.5963, 7.7044, array['five'], 'Complexe Foot5 – Hautepierre',       'approved', 'manual'),
('Foot5 Montpellier Lattes',          '1440 Av. de la Mer',                'Lattes',             43.5756, 3.9001, array['five'], 'Complexe Foot5 – Lattes',            'approved', 'manual'),
('Foot5 Rennes Cesson',               '2 Rue du Tertre',                   'Cesson-Sévigné',     48.1152, -1.6027, array['five'], 'Complexe Foot5 – Cesson',            'approved', 'manual'),
('Foot5 Reims',                       '14 Rue Clovis',                     'Reims',              49.2583, 4.0317, array['five'], 'Complexe Foot5 – Reims',             'approved', 'manual'),
('Foot5 Le Havre',                    '28 Bd de Strasbourg',               'Le Havre',           49.4938, 0.1077, array['five'], 'Complexe Foot5 – Le Havre',          'approved', 'manual'),
('Foot5 Angers',                      '1 Rue Louis Gain',                  'Angers',             47.4784, -0.5632, array['five'], 'Complexe Foot5 – Angers',            'approved', 'manual'),
('Foot5 Tours',                       '88 Av. du Général de Gaulle',       'Tours',              47.3941, 0.6848, array['five'], 'Complexe Foot5 – Tours',             'approved', 'manual'),
('Foot5 Caen',                        '15 Rue Joseph Philippon',           'Caen',               49.1829, -0.3707, array['five'], 'Complexe Foot5 – Caen',              'approved', 'manual'),
('Foot5 Metz',                        '3 Av. Louis le Débonnaire',         'Metz',               49.1193, 6.1757, array['five'], 'Complexe Foot5 – Metz',              'approved', 'manual'),
('Foot5 Amiens',                      '4 Rue des Lombards',                'Amiens',             49.8942, 2.2957, array['five'], 'Complexe Foot5 – Amiens',            'approved', 'manual'),
('Foot5 Orléans',                     '12 Rue de la Halte',                'Orléans',            47.9029, 1.9039, array['five'], 'Complexe Foot5 – Orléans',           'approved', 'manual'),
('Foot5 Perpignan',                   '10 Bd du Conflent',                 'Perpignan',          42.6986, 2.8954, array['five'], 'Complexe Foot5 – Perpignan',         'approved', 'manual'),
('Foot5 Brest',                       '2 Rue Victor Hugo',                 'Brest',              48.3905, -4.4860, array['five'], 'Complexe Foot5 – Brest',             'approved', 'manual'),
('Foot5 Pau',                         '18 Rue Maréchal Joffre',            'Pau',                43.2951, -0.3708, array['five'], 'Complexe Foot5 – Pau',               'approved', 'manual'),
('Foot5 Avignon',                     '5 Av. Saint-Ruf',                   'Avignon',            43.9493, 4.8055, array['five'], 'Complexe Foot5 – Avignon',           'approved', 'manual'),

-- ══════════════════════════════════════════════════════
-- CITÉFOOT & AUTRES CHAÎNES
-- ══════════════════════════════════════════════════════

('Citéfoot Paris Aubervilliers',      '45 Rue du Landy',                   'Aubervilliers',      48.9107, 2.3831, array['five','city'], 'Citéfoot – Aubervilliers',          'approved', 'manual'),
('Citéfoot Lyon Vaise',               '125 Rue Pierre Corneille',          'Lyon',               45.7692, 4.8099, array['five','city'], 'Citéfoot – Lyon Vaise',             'approved', 'manual'),
('Citéfoot Marseille',                '25 Chemin des Bourrely',            'Marseille',          43.3380, 5.4101, array['five','city'], 'Citéfoot – Marseille',              'approved', 'manual'),
('Citéfoot Bordeaux',                 '9 Rue du Moulin',                   'Bordeaux',           44.8456, -0.5884, array['five','city'], 'Citéfoot – Bordeaux',              'approved', 'manual'),
('Citéfoot Toulouse',                 '1 Rue de la Croix Verte',           'Toulouse',           43.5912, 1.4598, array['five','city'], 'Citéfoot – Toulouse',               'approved', 'manual'),
('Citéfoot Nice Lingostière',         '2 Av. de la Marne',                 'Nice',               43.7390, 7.1978, array['five','city'], 'Citéfoot – Nice Lingostière',       'approved', 'manual'),
('Citéfoot Nantes',                   '32 Bd Léon Bureau',                 'Nantes',             47.2082, -1.5661, array['five','city'], 'Citéfoot – Nantes',                'approved', 'manual'),
('Citéfoot Strasbourg',               '15 Route du Rhin',                  'Strasbourg',         48.5630, 7.7867, array['five','city'], 'Citéfoot – Strasbourg',             'approved', 'manual'),
('Citéfoot Rennes',                   '2 Av. des Buttes de Coëmes',        'Rennes',             48.1058, -1.6512, array['five','city'], 'Citéfoot – Rennes',                'approved', 'manual'),
('Citéfoot Grenoble',                 '5 Rue des Bains',                   'Grenoble',           45.1835, 5.7312, array['five','city'], 'Citéfoot – Grenoble',               'approved', 'manual'),
('Citéfoot Reims',                    '10 Rue Châtivesle',                 'Reims',              49.2502, 4.0218, array['five','city'], 'Citéfoot – Reims',                  'approved', 'manual'),
('Citéfoot Clermont-Ferrand',         '3 Av. de la République',            'Clermont-Ferrand',   45.7721, 3.0912, array['five','city'], 'Citéfoot – Clermont',               'approved', 'manual'),
('Citéfoot Limoges',                  '15 Rue Victor Hugo',                'Limoges',            45.8354, 1.2644, array['five','city'], 'Citéfoot – Limoges',                'approved', 'manual'),

-- ══════════════════════════════════════════════════════
-- COMPLEXES INDÉPENDANTS CONNUS
-- ══════════════════════════════════════════════════════

('Seven Sport Paris',                 '10 Rue des Envierges',              'Paris',              48.8687, 2.3942, array['city','eleven'], 'Seven Sport – Paris 20ème',        'approved', 'manual'),
('Paris Five',                        '30 Av. de la Porte Dorée',          'Paris',              48.8365, 2.4069, array['five'],          'Paris Five – Porte Dorée',         'approved', 'manual'),
('Soccer City Lyon',                  '14 Rue André Philip',               'Lyon',               45.7490, 4.8458, array['city','five'],  'Soccer City Lyon',                  'approved', 'manual'),
('Foot Indoor Marseille',             '88 Bd de la Blancarde',             'Marseille',          43.2878, 5.4002, array['five'],          'Foot Indoor Marseille',             'approved', 'manual'),
('Complexe Five Toulouse Fenouillet', '1 Chemin du Moulin',                'Fenouillet',         43.6765, 1.3997, array['five'],          'Five Fenouillet',                   'approved', 'manual'),
('Football Indoor Bordeaux',          '1 Av. des Terres de Borde',         'Bordeaux',           44.8703, -0.5402, array['five'],         'Football Indoor Bordeaux',          'approved', 'manual'),
('Indoor Soccer Lille',               '4 Av. des Nations Unies',           'Loos',               50.5954, 2.9992, array['five'],          'Indoor Soccer Loos',                'approved', 'manual'),
('Five Club Nice',                    '55 Bd René Cassin',                 'Nice',               43.6888, 7.2299, array['five'],          'Five Club Nice',                    'approved', 'manual'),
('Complexe Sportif de Five Nantes',   '12 Rue de la Vendée',               'Nantes',             47.2401, -1.5213, array['five'],         'Five Nantes Est',                   'approved', 'manual'),
('Five Stars Strasbourg',             '8 Rue de la Course',                'Strasbourg',         48.5681, 7.7321, array['five'],          'Five Stars Strasbourg',             'approved', 'manual'),
('Five Park Montpellier',             '100 Av. de la Pompignane',          'Montpellier',        43.5956, 3.9081, array['five'],          'Five Park Montpellier',             'approved', 'manual'),
('Stade Indoor Rennes',               '5 Bd de la Tour d''Auvergne',       'Rennes',             48.1096, -1.6710, array['five','city'],  'Stade Indoor Rennes',               'approved', 'manual'),
('City Stade Grenoble',               '3 Rue de la Viscose',               'Grenoble',           45.1740, 5.7481, array['city'],          'City Stade Grenoble',               'approved', 'manual'),
('Indoor Five Dijon',                 '2 Rue de la Liberté',               'Dijon',              47.3185, 5.0524, array['five'],          'Indoor Five Dijon',                 'approved', 'manual'),
('Five Star Clermont',                '7 Av. de Royat',                    'Clermont-Ferrand',   45.7673, 3.0592, array['five'],          'Five Star Clermont',                'approved', 'manual'),
('Foot à 5 Toulon',                   '12 Bd Commandant Nicolas',          'Toulon',             43.1162, 5.9372, array['five'],          'Foot à 5 Toulon',                   'approved', 'manual'),
('Complexe de Five Caen',             '5 Allée des Essarts',               'Caen',               49.1904, -0.3594, array['five'],         'Five Caen Rive Droite',             'approved', 'manual'),
('Five Stadium Rouen',                '99 Av. Jean Rondeaux',              'Rouen',              49.4498, 1.0892, array['five'],          'Five Stadium Rouen',                'approved', 'manual'),
('Football Five Metz',                '25 Rue aux Arènes',                 'Metz',               49.1120, 6.1892, array['five'],          'Football Five Metz',                'approved', 'manual'),
('Foot5 Nancy',                       '6 Rue des Brice',                   'Nancy',              48.6921, 6.1844, array['five'],          'Foot5 Nancy',                       'approved', 'manual'),
('Five Indoor Reims',                 '5 Rue de la Justice',               'Reims',              49.2654, 4.0189, array['five'],          'Five Indoor Reims',                 'approved', 'manual'),
('Complexe Five Angers',              '11 Bd du Doyenné',                  'Angers',             47.4712, -0.5541, array['five'],         'Five Angers',                       'approved', 'manual'),
('Indoor Five Tours',                 '30 Rue Nationale',                  'Tours',              47.3924, 0.6947, array['five'],          'Indoor Five Tours',                 'approved', 'manual'),
('Foot à 5 Le Mans',                  '2 Av. du Général de Gaulle',        'Le Mans',            48.0061, 0.1996, array['five'],          'Foot à 5 Le Mans',                  'approved', 'manual'),
('Complexe Five Amiens',              '10 Rue des Otages',                 'Amiens',             49.8912, 2.2891, array['five'],          'Five Amiens',                       'approved', 'manual'),
('Five Indoor Brest',                 '2 Rue de Lyon',                     'Brest',              48.3812, -4.4920, array['five'],         'Five Indoor Brest',                 'approved', 'manual'),
('Foot5 Saint-Étienne',               '20 Cours Fauriel',                  'Saint-Étienne',      45.4354, 4.3924, array['five'],          'Foot5 Saint-Étienne',               'approved', 'manual'),
('Five Park Bordeaux Mériadeck',      '9 Rue du Château d''Eau',           'Bordeaux',           44.8441, -0.5801, array['five'],         'Five Park Mériadeck',               'approved', 'manual'),
('Foot à 5 Perpignan',                '25 Av. de Grande Bretagne',         'Perpignan',          42.6901, 2.9102, array['five'],          'Foot à 5 Perpignan',                'approved', 'manual'),
('Complexe Five Pau',                 '3 Rue des Cordeliers',              'Pau',                43.2879, -0.3634, array['five'],         'Five Pau',                          'approved', 'manual'),
('Indoor Five Avignon',               '5 Rue de la Croix',                 'Avignon',            43.9561, 4.8011, array['five'],          'Indoor Five Avignon',               'approved', 'manual'),
('Five Stadium Limoges',              '22 Rue du Général Leclerc',         'Limoges',            45.8298, 1.2541, array['five'],          'Five Stadium Limoges',              'approved', 'manual'),
('Foot à 5 Orléans',                  '14 Av. de Paris',                   'Orléans',            47.9012, 1.9121, array['five'],          'Foot à 5 Orléans',                  'approved', 'manual'),
('Five Arena Marseille Aubagne',      '1 Av. Victor Hugo',                 'Aubagne',            43.2940, 5.5683, array['five'],          'Five Arena Aubagne',                'approved', 'manual'),
('Soccer Park Lyon Décines',          '45 Av. du Montout',                 'Décines-Charpieu',   45.7671, 5.0080, array['five','city'],  'Soccer Park Décines',               'approved', 'manual'),
('Five Complex Bordeaux Pessac',      '1 Av. Noël Bordeaux',               'Pessac',             44.8066, -0.6261, array['five'],         'Five Complex Pessac',               'approved', 'manual'),
('City Five Marseille La Valentine',  '24 Av. de La Valentine',            'Marseille',          43.2921, 5.4497, array['five','city'],  'City Five La Valentine',            'approved', 'manual'),
('Five Indoor Bayonne',               '15 Allée des Platanes',             'Bayonne',            43.4928, -1.4748, array['five'],         'Five Indoor Bayonne',               'approved', 'manual'),
('Complexe Five Nîmes',               '8 Av. Feuchères',                   'Nîmes',              43.8365, 4.3580, array['five'],          'Five Nîmes',                        'approved', 'manual')

on conflict do nothing;

-- ══════════════════════════════════════════════════════
-- Vérification
-- ══════════════════════════════════════════════════════
select count(*) as total_venues, count(distinct city) as villes from venues where status='approved';
