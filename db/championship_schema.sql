-- ============================================================
-- FootMatch – Tables Championnat
-- Colle ce SQL dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- 1. CHAMPIONNATS
create table if not exists championships (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  organizer_id  uuid references profiles(id) on delete cascade,
  max_teams     int  not null default 8,
  status        text not null default 'registration'
                  check (status in ('registration', 'active', 'finished')),
  join_code     text not null unique,
  created_at    timestamptz default now()
);

-- 2. ÉQUIPES
create table if not exists championship_teams (
  id                uuid primary key default gen_random_uuid(),
  championship_id   uuid references championships(id) on delete cascade,
  name              text not null,
  captain_id        uuid references profiles(id) on delete set null,
  created_at        timestamptz default now()
);

-- 3. MATCHS DU CHAMPIONNAT
create table if not exists championship_matches (
  id                uuid primary key default gen_random_uuid(),
  championship_id   uuid references championships(id) on delete cascade,
  home_team_id      uuid references championship_teams(id) on delete cascade,
  away_team_id      uuid references championship_teams(id) on delete cascade,
  round             int not null default 1,
  scheduled_at      timestamptz,
  home_score        int,
  away_score        int,
  status            text not null default 'pending_date'
                      check (status in ('pending_date', 'scheduled', 'played', 'cancelled')),
  created_at        timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table championships         enable row level security;
alter table championship_teams    enable row level security;
alter table championship_matches  enable row level security;

-- Lecture publique
create policy "championships_select" on championships         for select using (true);
create policy "teams_select"         on championship_teams    for select using (true);
create policy "matches_select"       on championship_matches  for select using (true);

-- Création : utilisateur connecté
create policy "championships_insert" on championships
  for insert with check (auth.uid() = organizer_id);

create policy "teams_insert" on championship_teams
  for insert with check (auth.uid() = captain_id);

-- Mise à jour : organisateur ou capitaine selon la table
create policy "championships_update" on championships
  for update using (auth.uid() = organizer_id);

create policy "matches_update" on championship_matches
  for update using (
    auth.uid() = (select organizer_id from championships where id = championship_id)
    or
    auth.uid() = (select captain_id from championship_teams where id = home_team_id)
    or
    auth.uid() = (select captain_id from championship_teams where id = away_team_id)
  );

-- Suppression : organisateur uniquement
create policy "championships_delete" on championships
  for delete using (auth.uid() = organizer_id);

create policy "teams_delete" on championship_teams
  for delete using (
    auth.uid() = captain_id
    or auth.uid() = (select organizer_id from championships where id = championship_id)
  );

-- ============================================================
-- INDEX pour les performances
-- ============================================================
create index if not exists idx_champ_teams_champ_id  on championship_teams   (championship_id);
create index if not exists idx_champ_matches_champ_id on championship_matches (championship_id);
create index if not exists idx_champ_matches_round    on championship_matches (round);
