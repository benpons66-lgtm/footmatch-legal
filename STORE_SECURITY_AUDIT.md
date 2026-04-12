# FootMatch - Audit store et securite

Etat du depot apres cette passe :

- Le code compile avec `npx tsc --noEmit`
- La suppression de compte in-app appelle une edge function dediee
- Les bases legales locales existent dans `legal/`
- Un script de durcissement RLS est disponible dans `db/security_hardening.sql`

## Corrige dans le depot

- Parcours de suppression de compte cote app et edge function `delete-account`
- Signalement in-app de messages
- Blocage local d'utilisateurs dans les discussions
- Permission localisation demandee au moment utile
- Permission notifications demandee au moment utile
- Textes legaux integres dans l'application
- Configuration Expo nettoyee et fichier d'exemple `.env.example`

## A deployer avant soumission App Store / Play Store

1. Deployer `supabase/functions/delete-account`
2. Executer `db/store_readiness.sql`
3. Executer `db/community_profile_and_venues.sql`
4. Executer `db/security_hardening.sql`
5. Heberger publiquement :
   - `legal/PRIVACY_POLICY.md`
   - `legal/TERMS_OF_SERVICE.md`
   - `legal/ACCOUNT_DELETION.md`
6. Verifier que `support@footmatch.fr` est actif
7. Fournir un compte de demonstration Apple avec backend actif

## Risques restants

- Les formulaires App Privacy / Data Safety restent a remplir dans les consoles Apple et Google
- Les policies RLS des tables historiques non presentes dans ce depot doivent etre reverifiees directement dans Supabase
- Les buckets Supabase Storage et leurs policies doivent etre verifies si des photos utilisateur/terrains sont utilisees en production
