-- FootMatch
-- Colonnes profils pour ville / code postal / stats perso
-- Validation automatique des terrains communautaires apres votes

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS goals INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assists INTEGER NOT NULL DEFAULT 0;

ALTER TABLE venue_proposals
  ADD COLUMN IF NOT EXISTS validated_venue_id UUID NULL REFERENCES venues(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION refresh_venue_proposal_status(p_proposal_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_yes INTEGER := 0;
  v_no INTEGER := 0;
  v_total INTEGER := 0;
  v_status TEXT := 'pending';
  v_validated_venue_id UUID;
  v_proposal RECORD;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE vote IS TRUE),
    COUNT(*) FILTER (WHERE vote IS FALSE),
    COUNT(*)
  INTO v_yes, v_no, v_total
  FROM venue_votes
  WHERE proposal_id = p_proposal_id;

  IF v_total >= 3 AND v_yes * 100 >= v_total * 70 THEN
    v_status := 'validated';
  ELSIF v_total >= 3 AND v_no * 100 > v_total * 50 THEN
    v_status := 'rejected';
  END IF;

  UPDATE venue_proposals
  SET
    votes_yes = v_yes,
    votes_no = v_no,
    status = v_status
  WHERE id = p_proposal_id;

  IF v_status <> 'validated' THEN
    RETURN;
  END IF;

  SELECT *
  INTO v_proposal
  FROM venue_proposals
  WHERE id = p_proposal_id;

  IF v_proposal.validated_venue_id IS NOT NULL THEN
    RETURN;
  END IF;

  INSERT INTO venues (
    name,
    address,
    city,
    latitude,
    longitude,
    types,
    description,
    status,
    source
  )
  VALUES (
    v_proposal.name,
    v_proposal.address,
    v_proposal.city,
    v_proposal.latitude,
    v_proposal.longitude,
    v_proposal.types,
    COALESCE(v_proposal.description, 'Terrain valide par la communaute FootMatch'),
    'approved',
    'community'
  )
  RETURNING id INTO v_validated_venue_id;

  UPDATE venue_proposals
  SET validated_venue_id = v_validated_venue_id
  WHERE id = p_proposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION handle_venue_vote_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM refresh_venue_proposal_status(COALESCE(NEW.proposal_id, OLD.proposal_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS venue_vote_change_refresh ON venue_votes;

CREATE TRIGGER venue_vote_change_refresh
AFTER INSERT OR UPDATE OR DELETE ON venue_votes
FOR EACH ROW
EXECUTE FUNCTION handle_venue_vote_change();

UPDATE profiles
SET
  city = COALESCE(city, 'Paris'),
  postal_code = COALESCE(postal_code, '75000')
WHERE id LIKE 'fa%' AND (city IS NULL OR postal_code IS NULL);

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM venue_proposals LOOP
    PERFORM refresh_venue_proposal_status(r.id);
  END LOOP;
END;
$$;
