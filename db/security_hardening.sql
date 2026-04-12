-- FootMatch - durcissement securite / store readiness
-- A executer apres le schema principal.

-- Profils
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Terrains approuves
ALTER TABLE IF EXISTS venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venues_public_read" ON venues;
CREATE POLICY "venues_public_read" ON venues
  FOR SELECT USING (true);

-- Propositions de terrain
ALTER TABLE IF EXISTS venue_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venue_proposals_public_read" ON venue_proposals;
CREATE POLICY "venue_proposals_public_read" ON venue_proposals
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "venue_proposals_insert_self" ON venue_proposals;
CREATE POLICY "venue_proposals_insert_self" ON venue_proposals
  FOR INSERT WITH CHECK (auth.uid() = proposed_by);

DROP POLICY IF EXISTS "venue_proposals_update_owner" ON venue_proposals;
CREATE POLICY "venue_proposals_update_owner" ON venue_proposals
  FOR UPDATE USING (auth.uid() = proposed_by)
  WITH CHECK (auth.uid() = proposed_by);

DROP POLICY IF EXISTS "venue_proposals_delete_owner" ON venue_proposals;
CREATE POLICY "venue_proposals_delete_owner" ON venue_proposals
  FOR DELETE USING (auth.uid() = proposed_by);

-- Votes de validation de terrain
ALTER TABLE IF EXISTS venue_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venue_votes_read_own" ON venue_votes;
CREATE POLICY "venue_votes_read_own" ON venue_votes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "venue_votes_insert_self" ON venue_votes;
CREATE POLICY "venue_votes_insert_self" ON venue_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "venue_votes_update_self" ON venue_votes;
CREATE POLICY "venue_votes_update_self" ON venue_votes
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "venue_votes_delete_self" ON venue_votes;
CREATE POLICY "venue_votes_delete_self" ON venue_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Signalements
ALTER TABLE IF EXISTS message_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_reports_select_own" ON message_reports;
CREATE POLICY "message_reports_select_own" ON message_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Demandes de suppression
ALTER TABLE IF EXISTS account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_delete_update_own" ON account_deletion_requests;
CREATE POLICY "account_delete_update_own" ON account_deletion_requests
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_postal_code ON profiles(postal_code);
CREATE INDEX IF NOT EXISTS idx_venue_proposals_status ON venue_proposals(status);
CREATE INDEX IF NOT EXISTS idx_venue_proposals_proposed_by ON venue_proposals(proposed_by);
CREATE INDEX IF NOT EXISTS idx_venue_votes_user_id ON venue_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_reporter_id ON message_reports(reporter_id);
