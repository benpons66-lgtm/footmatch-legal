---
name: eas-deploy
description: Gère les builds EAS et la soumission aux stores pour FootMatch. Utilise ce skill quand Ben parle de EAS, build, submit, eas build, eas submit, TestFlight, internal testing, preview, production, certificat, provisioning profile, keystore, variables d'environnement, bump de version, numéro de version, versionCode, buildNumber, ou quand il dit "je veux builder", "crée un build", "envoie à TestFlight", "prépare une release".
---

# EAS Deploy — FootMatch

## Contexte
FootMatch est une app Expo SDK 54 publiée via **EAS** (Expo Application Services).

- **Bundle ID iOS** : `fr.footmatch.app`
- **Package Android** : `fr.footmatch.app`
- **EAS Project** : `footmatch-app`
- **Owner** : `footmatch`
- Configuration : `eas.json` + `app.json`

## Règles absolues

1. **Ne jamais builder en production** sans confirmation explicite de Ben
2. **Toujours bumper la version** avant une release store
3. **Toujours vérifier le changelog mental** avant build production
4. **Les secrets** (clés Supabase, tokens) vont dans `eas secrets`, pas dans le repo
5. **Tester un build preview** avant un build production
6. **Un build production = coût** → éviter les relances inutiles

## Profils EAS (rappel)

- **development** : build avec dev client, pour debug local
- **preview** : APK Android / simulator iOS, pour tests internes
- **production** : build optimisé, prêt pour stores

## Commandes clés

### Build
```bash
# Preview (test interne)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production (stores)
eas build --platform all --profile production

# Relance d'un build en cas d'échec
eas build:list                # Voir les derniers builds
eas build:view [build-id]     # Détails d'un build
```

### Submit aux stores
```bash
# iOS (App Store Connect)
eas submit --platform ios --profile production

# Android (Google Play)
eas submit --platform android --profile production
```

### Variables d'env / secrets
```bash
eas secret:list
eas secret:create --scope project --name MY_KEY --value "xxx"
eas secret:delete --scope project --name MY_KEY
```

### Credentials
```bash
eas credentials                # Menu interactif
```

## Workflow de release

### Avant le build production

**Checklist obligatoire :**
1. ✅ Tous les bugs critiques corrigés
2. ✅ Tests manuels sur iOS ET Android (preview build)
3. ✅ Privacy Policy en ligne et accessible (déjà fait — repo `footmatch-legal`)
4. ✅ Terms of Service en ligne
5. ✅ Account Deletion flow fonctionnel (requis Apple)
6. ✅ Compte demo Apple valide : `review@footmatch.fr`
7. ✅ Migrations SQL appliquées en prod (si changement récent)
8. ✅ `app.json` → version bumpée
9. ✅ `app.json` → `ios.buildNumber` et `android.versionCode` incrémentés
10. ✅ Pas de `console.log` de debug ou de clés hardcodées
11. ✅ Screenshots stores prêts (sinon skill `marketing-content`)

### Bump de version
Dans `app.json` :
```json
{
  "expo": {
    "version": "1.0.1",          // version visible utilisateur (semver)
    "ios": {
      "buildNumber": "2"          // incrémenter à chaque submit App Store
    },
    "android": {
      "versionCode": 2            // incrémenter à chaque submit Play Store (entier)
    }
  }
}
```

**Règles de bump :**
- **Patch** (1.0.0 → 1.0.1) : bugfix uniquement
- **Minor** (1.0.0 → 1.1.0) : nouvelle feature sans breaking
- **Major** (1.0.0 → 2.0.0) : refonte, breaking changes

Après chaque submit :
- iOS : `buildNumber` +1 même si même `version`
- Android : `versionCode` +1 (strictement croissant)

### Étape standard d'une release

```
1. Bump version dans app.json
2. Commit : "chore: bump version to X.X.X"
3. eas build --platform all --profile production
4. Tester chaque binaire (TestFlight + Internal Testing Play)
5. eas submit --platform all --profile production
6. Tag git : git tag vX.X.X && git push origin vX.X.X
7. Release notes dans App Store Connect + Play Console
```

## Diagnostic des problèmes classiques

### Build échoue — étapes
1. Lire le log EAS complet (`eas build:view [id]`)
2. Chercher la première erreur en remontant
3. Erreurs fréquentes :
   - Dépendance incompatible Expo SDK 54 → vérifier compat
   - `app.json` mal formaté → JSON lint
   - Clé manquante → `eas secret:list`
   - Provisioning expiré → `eas credentials`
   - Pod install iOS → régénérer avec `expo prebuild --clean`

### Submit échoue App Store
- Metadata incomplet → compléter dans App Store Connect
- Capture d'écran mauvaise taille → utiliser skill `marketing-content`
- Privacy labels → revalider dans App Store Connect
- Export compliance → répondre dans `app.json` :
  ```json
  "ios": { "config": { "usesNonExemptEncryption": false } }
  ```

### Submit échoue Play
- Signing key mismatch → `eas credentials` → restaurer
- versionCode pas supérieur → bump
- Target API level → vérifier `app.json`

## Variables d'environnement FootMatch

À avoir dans `eas secret` :
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions uniquement, pas dans l'app)

⚠️ Préfixe `EXPO_PUBLIC_` = exposé dans le bundle client, ne PAS mettre de secret sensible dedans.

## Format de réponse

```
🚀 OBJECTIF DU BUILD
[preview / production / release store]

✅ PRÉ-REQUIS VÉRIFIÉS
- [ ] Version bumpée
- [ ] Tests OK
- [ ] ...

⚡ COMMANDES À LANCER
```
eas build --platform all --profile production
```

🧪 APRÈS LE BUILD
1. [étape test TestFlight]
2. [étape test Play Internal]

🏪 SUBMIT STORE
```
eas submit --platform all --profile production
```

⚠️ RISQUES
[Coût, temps, points d'attention]

📊 Score qualité : X/10
```

## Règles de communication
- Toujours en français
- Rappeler le coût d'un build prod à Ben (~4-6€ en crédits EAS si hors free tier)
- Proposer un build preview avant un build prod si pas fait récemment
- Alerter si des prérequis store manquent (utiliser aussi skill `store-readiness`)
- Dire clairement si une commande est destructive / irréversible
