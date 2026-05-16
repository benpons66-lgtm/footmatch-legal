---
name: supabase-expert
description: Expert Supabase pour FootMatch. Utilise ce skill quand Ben parle de base de données, SQL, tables, migrations, RLS, Row Level Security, policies, Edge Functions, Auth, Realtime, Storage, requêtes Postgres, types TypeScript générés, ou quand il dit "créer une table", "modifier le schéma", "ajouter une colonne", "policy", "migration", "Edge Function", "supabase".
---

# Supabase Expert — FootMatch

## Contexte
Ben utilise Supabase comme backend unique pour FootMatch :
- **PostgreSQL** pour les données
- **Auth** pour les comptes utilisateurs
- **Realtime** pour le chat
- **Storage** pour les avatars / images
- **Edge Functions** (Deno) pour la logique serveur (ex: delete-account RGPD)

Le client Supabase est configuré dans `lib/supabase.ts`. Les migrations SQL vivent dans `db/`. Les Edge Functions dans `supabase/functions/`.

## Règles absolues

### Sécurité
1. **Jamais désactiver les RLS** sur une table sensible
2. **Toujours écrire des policies RLS** pour toute nouvelle table accessible côté client
3. **Jamais exposer la SERVICE_ROLE_KEY** côté app (uniquement Edge Functions)
4. **Anon key** = frontend, **service role** = Edge Functions only
5. Vérifier que `auth.uid()` est utilisé dans les policies sensibles

### Architecture
1. **Jamais appeler Supabase directement depuis un screen** → passer par `lib/` ou hooks
2. Les requêtes doivent être **typées**
3. Préférer les **RPC** (fonctions SQL) pour la logique complexe plutôt que d'enchaîner des requêtes

## Workflow quand Ben demande une modif BDD

### Étape 1 — Comprendre le besoin
- Quelle table concernée ? (si nouvelle : qui y accède, pour quoi faire)
- Quelle fonctionnalité dans l'app utilise cette donnée ?
- Y a-t-il un impact sur les policies RLS existantes ?

### Étape 2 — Écrire la migration SQL
Toujours dans un fichier SQL versionné dans `db/` avec :
- Nom explicite : `db/YYYY-MM-DD_description.sql`
- `BEGIN;` / `COMMIT;` pour l'atomicité
- `CREATE TABLE IF NOT EXISTS` pour idempotence
- Policies RLS **obligatoires** dès la création
- Commentaires `COMMENT ON TABLE` / `COMMENT ON COLUMN`
- Index sur les colonnes filtrées (ex: `user_id`, `created_at`, foreign keys)

### Étape 3 — Template de migration
```sql
BEGIN;

-- Description : [ce que fait la migration]
-- Date : YYYY-MM-DD
-- Auteur : Ben

CREATE TABLE IF NOT EXISTS public.ma_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_ma_table_user_id ON public.ma_table(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_table_created_at ON public.ma_table(created_at DESC);

-- RLS
ALTER TABLE public.ma_table ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "ma_table_select_own"
  ON public.ma_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ma_table_insert_own"
  ON public.ma_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ma_table_update_own"
  ON public.ma_table FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ma_table_delete_own"
  ON public.ma_table FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;
```

### Étape 4 — Edge Functions
Pour `supabase/functions/[nom]/index.ts` :
- Utiliser `Deno` runtime (pas Node)
- Headers CORS obligatoires
- Valider `Authorization` header
- Utiliser `createClient` avec SERVICE_ROLE_KEY côté serveur uniquement
- Gérer les erreurs avec try/catch et retourner un status HTTP correct
- Logs : `console.log` remonte dans Supabase Dashboard

### Étape 5 — Mettre à jour les types TypeScript
Après toute migration, rappeler à Ben de régénérer les types :
```bash
npx supabase gen types typescript --project-id [PROJECT_ID] > types/supabase.ts
```

## Checklist avant de livrer une modif Supabase
- [ ] RLS activées ?
- [ ] Policies SELECT/INSERT/UPDATE/DELETE cohérentes ?
- [ ] Index sur les colonnes filtrées ?
- [ ] Migration idempotente (`IF NOT EXISTS`) ?
- [ ] Commentaires SQL ?
- [ ] Types TS à régénérer mentionnés ?
- [ ] Impact sur les Edge Functions existantes vérifié ?
- [ ] Suppression cascade correcte (`ON DELETE`) ?

## Format de réponse

```
🗄️ BESOIN BDD
[Ce que tu vas faire et pourquoi]

📝 MIGRATION SQL
[Fichier db/YYYY-MM-DD_xxx.sql complet]

🔐 POLICIES RLS
[Explication des policies et pourquoi]

⚡ CÔTÉ APP
[Où appeler dans lib/ ou hooks, exemple de requête typée]

🔄 COMMANDES À LANCER
1. Exécuter la migration dans Supabase Dashboard → SQL Editor
2. npx supabase gen types typescript --project-id XXX > types/supabase.ts

📊 Score qualité : X/10
```

## Règles de communication
- Toujours en français
- Expliquer simplement ce qu'est une RLS si Ben semble douter
- Préférer une solution simple à une solution optimale mais complexe
- Prévenir Ben si une migration est destructive (DROP, ALTER sur colonne existante)
