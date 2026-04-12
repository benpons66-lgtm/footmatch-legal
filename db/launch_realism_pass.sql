-- FootMatch - passe finale de realisme pour la communaute de lancement
-- A executer APRES les scripts de seed
-- Objectif :
-- 1. rendre les faux profils/matchs/championnats plus naturels
-- 2. plafonner toute la communaute seedee a D2 maximum
-- 3. eviter les textes trop "generes" pour les premiers utilisateurs

update profiles
set
  reputation_score = least(coalesce(reputation_score, 0), 1499),
  level = case
    when least(coalesce(reputation_score, 0), 1499) >= 750 then 'D2'
    when least(coalesce(reputation_score, 0), 1499) >= 300 then 'D3'
    else 'D4'
  end,
  reputation_rank = case
    when least(coalesce(reputation_score, 0), 1499) >= 750 then 'D2'
    when least(coalesce(reputation_score, 0), 1499) >= 300 then 'D3'
    else 'D4'
  end
where id::text like 'fa%';

do $$
declare
  names text[] := array[
    'Ligue locale du lundi',
    'Championnat quartier centre',
    'Tournoi du mercredi soir',
    'Coupe five du secteur',
    'Challenge city entre amis',
    'Ligue du midi',
    'Saison five hiver',
    'Championnat apres boulot',
    'Ligue des habituels',
    'Tournoi du vendredi soir',
    'Derby local',
    'Coupe nouveaux joueurs',
    'Ligue du dimanche matin',
    'Challenge terrain nord',
    'Saison five indoor'
  ];
  descriptions text[] := array[
    'Matchs hebdomadaires entre equipes locales avec un rythme amateur.',
    'Saison reguliere pour joueurs qui veulent jouer chaque semaine.',
    'Format simple en semaine avec des equipes stables.',
    'Petite competition five avec bon esprit demande.',
    'Championnat accessible pour groupes melanges et joueurs reguliers.',
    'Matchs en semaine sur des formats courts et efficaces.',
    'Edition de saison pour continuer a jouer meme pendant les mois froids.',
    'Rencontres organisees en soiree pour les joueurs disponibles apres 18h.',
    'Competition locale pour joueurs qui se croisent souvent sur les terrains.',
    'Format simple avec calendrier leger et matchs en fin de semaine.',
    'Petite rivalite de quartier dans un cadre amateur.',
    'Competition ouverte pour integrer facilement de nouvelles equipes.',
    'Matchs le week-end pour groupes amateurs reguliers.',
    'Championnat local au format detendu mais serieux.',
    'Competition indoor avec effectifs stables et niveau amateur.'
  ];
  team_names text[] := array[
    'FC Montchat','AS Villette','Sporting Nord','Union Centre','FC Prado','Olympique Gerland','SC Bercy','FC Canal',
    'AC Gambetta','US Euralille','FC Capitole','AS Minimes','US Reze','FC Bastide','SC Villeurbanne','US Joliette',
    'Racing Belleville','FC Vaise','AS Jaures','Union 93','Sporting Croix','FC Lingostiere','AS Blagnac','FC Rangueil'
  ];
  champ_ids uuid[];
  champ_id uuid;
  idx integer;
  team_pos integer;
  team_id uuid;
begin
  select array(
    select id
    from championships
    where organizer_id::text like 'fa%'
    order by created_at, id
    limit 15
  )
  into champ_ids;

  for idx in 1..coalesce(array_length(champ_ids, 1), 0) loop
    champ_id := champ_ids[idx];

    update championships
    set
      name = names[idx],
      description = descriptions[idx]
    where id = champ_id;

    team_pos := 1;
    for team_id in
      select id
      from championship_teams
      where championship_id = champ_ids[idx]
      order by created_at nulls last, id
    loop
      update championship_teams
      set name = team_names[team_pos]
      where id = team_id;

      team_pos := team_pos + 1;
      if team_pos > array_length(team_names, 1) then
        team_pos := 1;
      end if;
    end loop;
  end loop;
end $$;

delete from community_messages
where user_id::text like 'fa%';

do $$
declare
  msgs text[] := array[
    'Qui est chaud pour un five ce soir vers 20h ?',
    'Il manque un gardien pour demain a Lyon.',
    'Des retours sur le terrain de Gerland ?',
    'Premier match trouve ici, bonne surprise.',
    'Je suis plutot D4-D3, vous conseillez quoi pour commencer ?',
    'On cherche encore deux joueurs pour completer un city.',
    'Match samedi matin a Marseille si certains veulent rejoindre.',
    'Nouveau sur l''app, on peut venir solo sans connaitre de monde ?',
    'Le five de jeudi a Lille etait top, merci a l''orga.',
    'Il reste 3 places pour vendredi 19h a Bordeaux.',
    'Des joueurs reguliers sur Toulouse pour monter un petit groupe ?',
    'Quelqu''un a un match ouvert dimanche matin sur Nantes ?',
    'Je cherche surtout des matchs ou ca joue propre.',
    'On monte une equipe tranquille pour la semaine prochaine.'
  ];
  uids uuid[];
  idx integer;
begin
  select array(
    select id
    from profiles
    where id::text like 'fa%'
    order by reputation_score desc, created_at
    limit 14
  )
  into uids;

  for idx in 1..coalesce(array_length(msgs, 1), 0) loop
    if uids[idx] is not null then
      insert into community_messages (user_id, content, created_at)
      values (uids[idx], msgs[idx], now() - ((idx * 5) || ' hours')::interval);
    end if;
  end loop;
end $$;

select reputation_rank, count(*) as total
from profiles
where id::text like 'fa%'
group by reputation_rank
order by reputation_rank;

select id, title, level, current_players, max_players, status
from matches
where id::text like 'fb%'
order by scheduled_at;
