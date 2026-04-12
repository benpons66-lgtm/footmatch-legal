-- ============================================================
-- FootMatch — Ajout colonne skill sur profiles
-- Colle ce script dans Supabase SQL Editor
-- ============================================================

-- Ajouter la colonne skill (nullable, un seul skill par joueur)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skill TEXT;

-- Index pour filtrer par skill plus tard
CREATE INDEX IF NOT EXISTS idx_profiles_skill ON profiles(skill);

-- Mettre à jour le niveau automatiquement en fonction du score de réputation
-- (optionnel : tu peux lancer ça pour recalculer tous les niveaux existants)
UPDATE profiles SET level =
  CASE
    WHEN reputation_score >= 300 THEN 'Pro'
    WHEN reputation_score >= 200 THEN 'Confirmé'
    WHEN reputation_score >= 80  THEN 'Intermédiaire'
    ELSE 'Débutant'
  END;

-- Attribuer des skills aléatoires aux joueurs qui n'en ont pas encore
-- (pour que la communauté soit réaliste dès le lancement)
UPDATE profiles
SET skill = (ARRAY['vitesse','dribbles','physique','2pieds','technique','tete','gardien','vision'])[1 + floor(random() * 8)::int]
WHERE skill IS NULL;

-- Vérification
SELECT skill, COUNT(*) FROM profiles GROUP BY skill ORDER BY COUNT(*) DESC;
SELECT level, COUNT(*) FROM profiles GROUP BY level ORDER BY COUNT(*) DESC;
