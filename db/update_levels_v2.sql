-- FootMatch - Mise a jour systeme de niveaux v2
-- 20 paliers : District (D4 a D1) | Regional (R3 a R1) | National (N3 a N1)
--            | Pro (Ligue 2 a Premier League) | Elite (LDC a Coupe du Monde) | GOAT
-- Colle ce script dans Supabase SQL Editor

-- Etape 1 : Mettre a jour le champ level selon le reputation_score
UPDATE profiles SET level =
  CASE
    WHEN reputation_score >= 50000 THEN 'GOAT'
    WHEN reputation_score >= 30000 THEN 'Coupe du Monde'
    WHEN reputation_score >= 20000 THEN 'Euro'
    WHEN reputation_score >= 14000 THEN 'Ligue des Champions'
    WHEN reputation_score >= 10000 THEN 'Premier League'
    WHEN reputation_score >= 7500  THEN 'Liga'
    WHEN reputation_score >= 5500  THEN 'Bundesliga'
    WHEN reputation_score >= 4000  THEN 'Serie A'
    WHEN reputation_score >= 2800  THEN 'Ligue 1'
    WHEN reputation_score >= 2000  THEN 'Ligue 2'
    WHEN reputation_score >= 1400  THEN 'N1'
    WHEN reputation_score >= 1000  THEN 'N2'
    WHEN reputation_score >= 700   THEN 'N3'
    WHEN reputation_score >= 480   THEN 'R1'
    WHEN reputation_score >= 320   THEN 'R2'
    WHEN reputation_score >= 200   THEN 'R3'
    WHEN reputation_score >= 120   THEN 'D1'
    WHEN reputation_score >= 60    THEN 'D2'
    WHEN reputation_score >= 25    THEN 'D3'
    ELSE 'D4'
  END;

-- Etape 2 : Synchroniser reputation_rank avec le nouveau level
UPDATE profiles SET reputation_rank = level;

-- Verification : distribution des niveaux
SELECT level, COUNT(*) AS total
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
