-- FootMatch — Ajout de la colonne disponibilites sur la table profiles
-- À exécuter via le dashboard Supabase (SQL Editor) ou via la CLI
-- Idempotent : peut être rejoué sans erreur

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS disponibilites JSONB DEFAULT NULL;

-- Commentaire : format attendu
-- [{ "jour": "Jeudi", "debut": "17:00", "fin": "19:00" }, ...]
-- Jours possibles : "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"
-- Valeurs de temps : format "HH:MM" (ex: "17:00", "20:30")

-- Policy RLS : le joueur peut lire ses propres disponibilités
-- (la lecture publique est déjà couverte par "Lecture profiles publique")
-- Update : uniquement par le propriétaire du profil
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
