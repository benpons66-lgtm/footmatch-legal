-- FootMatch - remise en coherence des donnees fake
-- A executer apres les scripts de seed et reputation_v2.sql

-- 1. Synchroniser le nombre de joueurs dans les faux matchs
update matches m
set current_players = sub.player_count
from (
  select match_id, count(*)::int as player_count
  from match_players
  where status = 'confirmed'
  group by match_id
) sub
where m.id = sub.match_id
  and m.id::text like 'fb%';

-- 2. Fermer les anciens matchs fake deja passes
update matches
set status = 'completed'
where id::text like 'fb%'
  and scheduled_at < now()
  and status not in ('cancelled', 'completed');

-- 3. Recalculer le score de reputation des faux profils depuis les vrais faux evenements
--    et plafonner tout le monde a D2 maximum pour garder une communaute de lancement credible
do $$
declare
  r record;
  v_score integer;
begin
  for r in select id from profiles where id::text like 'fa%' loop
    v_score := least(compute_reputation_score(r.id), 1499);
    update profiles
    set
      reputation_score = v_score,
      level = get_level_from_score(v_score),
      reputation_rank = get_level_from_score(v_score)
    where id = r.id;
  end loop;
end $$;

-- 4. Harmoniser les faux matchs sur un niveau realiste de lancement
update matches
set level = case
  when current_players >= greatest(ceil(max_players * 0.75), 2) then 'D2'
  when current_players >= greatest(ceil(max_players * 0.45), 2) then 'D3'
  else 'D4'
end
where id::text like 'fb%';

-- 5. Verification rapide
select
  p.id,
  p.pseudo,
  p.reputation_score,
  p.reputation_rank,
  coalesce(mp.matches_played, 0) as matches_played,
  coalesce(mo.matches_organized, 0) as matches_organized
from profiles p
left join (
  select user_id, count(*)::int as matches_played
  from match_players
  where status = 'confirmed'
  group by user_id
) mp on mp.user_id = p.id
left join (
  select organizer_id, count(*)::int as matches_organized
  from matches
  where status <> 'cancelled'
  group by organizer_id
) mo on mo.organizer_id = p.id
where p.id::text like 'fa%'
order by p.reputation_score desc, matches_played desc
limit 30;
