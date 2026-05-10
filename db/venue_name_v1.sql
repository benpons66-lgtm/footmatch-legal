-- V1 simplification: venue saisi en texte libre, venue_id devient nullable
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ALTER COLUMN venue_id DROP NOT NULL;

-- Autoriser l'organisateur à supprimer son match
DROP POLICY IF EXISTS "matches_delete_organizer" ON matches;
CREATE POLICY "matches_delete_organizer" ON matches
  FOR DELETE USING (auth.uid() = organizer_id);
