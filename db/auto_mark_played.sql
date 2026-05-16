-- FootMatch — auto-mark des matchs terminés comme 'played'
-- À exécuter une fois dans l'éditeur SQL Supabase.

-- ── 1. Policy : tout utilisateur authentifié peut marquer un match passé comme joué ──
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_update_played" ON matches;
CREATE POLICY "matches_update_played" ON matches
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND status NOT IN ('cancelled', 'played')
    AND scheduled_at < now() - interval '3 hours'
  )
  WITH CHECK (status = 'played');

-- Conserver la policy existante de l'organisateur pour les autres updates
DROP POLICY IF EXISTS "matches_update_organizer" ON matches;
CREATE POLICY "matches_update_organizer" ON matches
  FOR UPDATE
  USING (auth.uid() = organizer_id);

-- ── 2. Fonction utilitaire pour marquer tous les matchs passés comme joués ──
CREATE OR REPLACE FUNCTION mark_past_matches_as_played()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE matches
  SET status = 'played'
  WHERE status NOT IN ('cancelled', 'played')
    AND scheduled_at < now() - interval '3 hours';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Donner accès à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION mark_past_matches_as_played() TO authenticated;

-- ── 3. Rattraper immédiatement tous les matchs passés en retard ──
SELECT mark_past_matches_as_played() AS matchs_mis_a_jour;
