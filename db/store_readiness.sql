-- FootMatch - prerequis moderation et suppression de compte pour publication stores

create table if not exists message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null,
  reporter_id uuid not null references profiles(id) on delete cascade,
  match_id uuid null,
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);

alter table message_reports enable row level security;
drop policy if exists "message_reports_insert" on message_reports;
create policy "message_reports_insert" on message_reports
  for insert with check (auth.uid() = reporter_id);

create table if not exists account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  email text,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'rejected')),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table account_deletion_requests enable row level security;
drop policy if exists "account_delete_insert" on account_deletion_requests;
drop policy if exists "account_delete_select_own" on account_deletion_requests;
create policy "account_delete_insert" on account_deletion_requests
  for insert with check (auth.uid() = user_id);
create policy "account_delete_select_own" on account_deletion_requests
  for select using (auth.uid() = user_id);
