-- ═══════════════════════════════════════════════════════════════════════════════
-- FootMatch — Schéma Compétitions
-- Tables : teams, team_members, team_challenges, cups, cup_teams, cup_matches,
--          weekly_ranking_snapshots
-- À exécuter dans le SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════════
-- 1. ÉQUIPES PERSISTANTES
--    Format libre : 5v5, 7v7, 9v9, 11v11 ou mixte — aucune restriction de taille
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS teams (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  captain_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description      TEXT,
  invite_code      TEXT        NOT NULL UNIQUE,
  badge_emoji      TEXT        NOT NULL DEFAULT '⚽',
  preferred_format TEXT        NOT NULL DEFAULT 'all'
                   CHECK (preferred_format IN ('five','seven','nine','eleven','all')),
  wins             INT         NOT NULL DEFAULT 0,
  draws            INT         NOT NULL DEFAULT 0,
  losses           INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_captain     ON teams(captain_id);
CREATE INDEX IF NOT EXISTS idx_teams_invite_code ON teams(invite_code);

-- ════════════════════════════════════════════════════════════════════════════════
-- 2. MEMBRES D'ÉQUIPE
--    Contrainte unique : un joueur ne peut rejoindre la même équipe qu'une fois
--    Aucune limite de taille imposée en base — la flexibilité est voulue
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS team_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'player'
             CHECK (role IN ('captain', 'player')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- ════════════════════════════════════════════════════════════════════════════════
-- 3. DÉFIS ENTRE ÉQUIPES (matchs amicaux)
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS team_challenges (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  challenged_id UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  proposed_at   TIMESTAMPTZ,
  message       TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','declined','played','cancelled')),
  home_score    INT,
  away_score    INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (challenger_id <> challenged_id)
);

CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON team_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON team_challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status     ON team_challenges(status);

-- ════════════════════════════════════════════════════════════════════════════════
-- 4. COUPES (élimination directe)
--    Tailles supportées : 4, 8 ou 16 équipes
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cups (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  organizer_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  max_teams    INT         NOT NULL DEFAULT 8
               CHECK (max_teams IN (4, 8, 16)),
  status       TEXT        NOT NULL DEFAULT 'registration'
               CHECK (status IN ('registration','active','finished')),
  join_code    TEXT        NOT NULL UNIQUE,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cups_organizer ON cups(organizer_id);
CREATE INDEX IF NOT EXISTS idx_cups_join_code ON cups(join_code);
CREATE INDEX IF NOT EXISTS idx_cups_status    ON cups(status);

-- ════════════════════════════════════════════════════════════════════════════════
-- 5. ÉQUIPES INSCRITES À UNE COUPE
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cup_teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cup_id     UUID        NOT NULL REFERENCES cups(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  seed       INT,
  captain_id UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cup_id, name),
  UNIQUE (cup_id, captain_id)  -- un captain ne peut inscrire qu'une équipe par coupe
);

CREATE INDEX IF NOT EXISTS idx_cup_teams_cup ON cup_teams(cup_id);

-- ════════════════════════════════════════════════════════════════════════════════
-- 6. MATCHS DE COUPE (bracket)
--    round : 1=finale, 2=demi-finales, 3=quarts, 4=huitièmes
--    match_number : position 1-based dans le round (pour calculer l'avancement)
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cup_matches (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cup_id       UUID        NOT NULL REFERENCES cups(id) ON DELETE CASCADE,
  round        INT         NOT NULL,
  match_number INT         NOT NULL,
  home_team_id UUID        REFERENCES cup_teams(id) ON DELETE SET NULL,
  away_team_id UUID        REFERENCES cup_teams(id) ON DELETE SET NULL,
  winner_id    UUID        REFERENCES cup_teams(id) ON DELETE SET NULL,
  home_score   INT,
  away_score   INT,
  scheduled_at TIMESTAMPTZ,
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','scheduled','played','walkover')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cup_id, round, match_number)
);

CREATE INDEX IF NOT EXISTS idx_cup_matches_cup   ON cup_matches(cup_id);
CREATE INDEX IF NOT EXISTS idx_cup_matches_round ON cup_matches(cup_id, round);

-- ════════════════════════════════════════════════════════════════════════════════
-- 7. CLASSEMENT NATIONAL HEBDOMADAIRE
--    Snapshot calculé depuis team_challenges (matchs joués dans la semaine)
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS weekly_ranking_snapshots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start    DATE        NOT NULL,
  team_id       UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  rank          INT         NOT NULL,
  points        INT         NOT NULL DEFAULT 0,
  wins          INT         NOT NULL DEFAULT 0,
  draws         INT         NOT NULL DEFAULT 0,
  losses        INT         NOT NULL DEFAULT 0,
  goals_for     INT         NOT NULL DEFAULT 0,
  goals_against INT         NOT NULL DEFAULT 0,
  UNIQUE (week_start, team_id)
);

CREATE INDEX IF NOT EXISTS idx_weekly_rank_week ON weekly_ranking_snapshots(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_rank_rank ON weekly_ranking_snapshots(week_start, rank);

-- ════════════════════════════════════════════════════════════════════════════════
-- 8. RLS (Row Level Security)
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE teams                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members             ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_challenges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cups                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cup_teams                ENABLE ROW LEVEL SECURITY;
ALTER TABLE cup_matches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_ranking_snapshots ENABLE ROW LEVEL SECURITY;

-- ── teams ─────────────────────────────────────────────────────────────────────
CREATE POLICY "teams_select" ON teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (auth.uid() = captain_id);
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (auth.uid() = captain_id);

-- ── team_members ──────────────────────────────────────────────────────────────
CREATE POLICY "tm_select" ON team_members FOR SELECT USING (true);
CREATE POLICY "tm_insert" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tm_delete" ON team_members FOR DELETE USING (
  auth.uid() = user_id
  OR auth.uid() = (SELECT captain_id FROM teams WHERE id = team_id)
);

-- ── team_challenges ───────────────────────────────────────────────────────────
CREATE POLICY "tc_select" ON team_challenges FOR SELECT USING (true);
CREATE POLICY "tc_insert" ON team_challenges FOR INSERT WITH CHECK (
  auth.uid() = (SELECT captain_id FROM teams WHERE id = challenger_id)
);
CREATE POLICY "tc_update" ON team_challenges FOR UPDATE USING (
  auth.uid() = (SELECT captain_id FROM teams WHERE id = challenger_id)
  OR auth.uid() = (SELECT captain_id FROM teams WHERE id = challenged_id)
);

-- ── cups ──────────────────────────────────────────────────────────────────────
CREATE POLICY "cups_select" ON cups FOR SELECT USING (true);
CREATE POLICY "cups_insert" ON cups FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "cups_update" ON cups FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "cups_delete" ON cups FOR DELETE USING (auth.uid() = organizer_id);

-- ── cup_teams ─────────────────────────────────────────────────────────────────
CREATE POLICY "ct_select" ON cup_teams FOR SELECT USING (true);
CREATE POLICY "ct_insert" ON cup_teams FOR INSERT WITH CHECK (
  auth.uid() = captain_id
  OR auth.uid() = (SELECT organizer_id FROM cups WHERE id = cup_id)
);
CREATE POLICY "ct_delete" ON cup_teams FOR DELETE USING (
  auth.uid() = captain_id
  OR auth.uid() = (SELECT organizer_id FROM cups WHERE id = cup_id)
);

-- ── cup_matches ───────────────────────────────────────────────────────────────
CREATE POLICY "cm_select" ON cup_matches FOR SELECT USING (true);
CREATE POLICY "cm_insert" ON cup_matches FOR INSERT WITH CHECK (
  auth.uid() = (SELECT organizer_id FROM cups WHERE id = cup_id)
);
CREATE POLICY "cm_update" ON cup_matches FOR UPDATE USING (
  auth.uid() = (SELECT organizer_id FROM cups WHERE id = cup_id)
  OR auth.uid() = (SELECT captain_id FROM cup_teams WHERE id = home_team_id)
  OR auth.uid() = (SELECT captain_id FROM cup_teams WHERE id = away_team_id)
);

-- ── weekly_ranking_snapshots ──────────────────────────────────────────────────
CREATE POLICY "wrs_select" ON weekly_ranking_snapshots FOR SELECT USING (true);
-- Upsert déclenché côté client (premier utilisateur de la semaine calcule + cache)
CREATE POLICY "wrs_upsert" ON weekly_ranking_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "wrs_update" ON weekly_ranking_snapshots FOR UPDATE USING (true);

-- ════════════════════════════════════════════════════════════════════════════════
-- FIN DU SCRIPT
-- ════════════════════════════════════════════════════════════════════════════════
