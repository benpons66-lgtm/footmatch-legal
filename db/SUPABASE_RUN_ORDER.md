# Ordre d'execution Supabase

Execute les scripts dans cet ordre pour obtenir une communaute de lancement propre, realiste et plafonnee a `D2`.

1. `db/seed_fake_data.sql`
2. `db/seed_1000_players.sql`
3. `db/seed_matchs_et_fixtures.sql`
4. `db/SETUP_COMPLET.sql`
5. `db/store_readiness.sql`
6. `db/community_profile_and_venues.sql`
7. `db/security_hardening.sql`
8. `db/fake_data_consistency.sql`
9. `db/launch_realism_pass.sql`

## Ce que fait la passe finale

- plafonne tous les faux profils a `D2` maximum
- remet des pseudos plus sobres sur les profils seedes a la main
- remplace les titres et descriptions de faux matchs trop "show off"
- nettoie les noms de championnats et d'equipes
- regenere un chat communaute plus naturel

## Verifications rapides a faire dans Supabase apres execution

1. Verifier qu'aucun faux profil n'est au-dessus de `D2`
```sql
select reputation_rank, count(*) 
from profiles
where id::text like 'fa%'
group by reputation_rank
order by reputation_rank;
```

2. Verifier les 20 premiers faux profils
```sql
select id, pseudo, reputation_score, reputation_rank
from profiles
where id::text like 'fa%'
order by reputation_score desc
limit 20;
```

3. Verifier les faux matchs
```sql
select id, title, level, current_players, max_players, status
from matches
where id::text like 'fb%'
order by scheduled_at;
```

4. Verifier le chat communaute
```sql
select p.pseudo, cm.content, cm.created_at
from community_messages cm
join profiles p on p.id = cm.user_id
order by cm.created_at desc
limit 20;
```
