# Ordre d'exécution Supabase

## Schéma (une seule fois)

Execute ces scripts dans l'ordre dans le SQL Editor de Supabase :

1. `db/SETUP_COMPLET.sql` — schéma complet (tables, RLS, index)
2. `db/community_chat.sql` — messagerie communauté
3. `db/community_profile_and_venues.sql` — profils étendus + venues
4. `db/championship_schema.sql` — championnats
5. `db/competitions_schema.sql` — compétitions
6. `db/add_skill_column.sql` — colonne skill
7. `db/reputation_v2.sql` — système de réputation v2
8. `db/update_levels_v2.sql` — niveaux D2/D3/D4
9. `db/rls_missing_tables.sql` — RLS manquants
10. `db/security_hardening.sql` — renforcement sécurité
11. `db/venue_name_v1.sql` — venue_name texte libre + delete policy
12. `db/store_readiness.sql` — vérifications store
13. `db/invite_notifications.sql` — système d'invitations + notifications

## Fake data de lancement (Perpignan)

> **Source unique** : `db/seed_perpignan_v1.sql`
> Remplace tous les anciens seeds (seed_fake_data, seed_1000_players, seed_matchs_et_fixtures).

### Si la DB est déjà sale (données mélangées)

1. Lance d'abord `db/cleanup_before_reseed.sql` — supprime toutes les données orphelines
2. Puis lance `db/seed_perpignan_v1.sql` — charge les 50 joueurs + 10 matchs + 18 messages Perpignan

### Si la DB est vierge

Lance directement `db/seed_perpignan_v1.sql` (idempotent, inclut son propre nettoyage).

## Identifiants fake data

- Profils : préfixe `fa660000-...` (50 joueurs, D4/D3/D2, agglo Perpignan)
- Matchs  : préfixe `fb660000-...` (10 matchs, distribution réaliste)

## Vérifications rapides après seed

```sql
-- Profils par niveau (attendu : D2=10, D3=20, D4=20)
SELECT level, count(*) FROM profiles WHERE id::text LIKE 'fa66%' GROUP BY level;

-- Remplissage des matchs
SELECT title, current_players || '/' || max_players AS fill
FROM matches WHERE id::text LIKE 'fb66%' ORDER BY scheduled_at;

-- Messages communauté
SELECT p.pseudo, cm.content FROM community_messages cm
JOIN profiles p ON p.id = cm.user_id ORDER BY cm.created_at DESC LIMIT 5;
```
