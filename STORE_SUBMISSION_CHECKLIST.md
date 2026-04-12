# Checklist de Soumission Store — FootMatch

> Document de référence pour la soumission de FootMatch sur l'App Store (Apple) et le Google Play Store.
> Cochez chaque item au fur et à mesure de l'avancement.

---

## 0. Avant de commencer — Vérifications générales

- [ ] La version de l'app dans `app.json` (`version`) est correcte et incrémentée
- [ ] Le `buildNumber` (iOS) et `versionCode` (Android) sont à jour
- [ ] Le fichier `.env` de production est configuré avec les vraies clés (non committées)
- [ ] Tous les `TODO` et `FIXME` critiques sont résolus
- [ ] Les feature flags de développement/debug sont désactivés en production
- [ ] L'URL de la politique de confidentialité (`public/privacy-policy.html`) est déployée et accessible publiquement

---

## 1. Sécurité et Infrastructure — Rotation des secrets

- [ ] **Rotation des clés Supabase**
  - [ ] Générer un nouveau `anon key` dans le dashboard Supabase (Project Settings > API)
  - [ ] Générer un nouveau `service_role key`
  - [ ] Mettre à jour les variables d'environnement de production
  - [ ] Vérifier que l'ancienne clé ne fonctionne plus après rotation
- [ ] **Vérification des Row Level Security (RLS)**
  - [ ] Toutes les tables sensibles ont des policies RLS activées
  - [ ] Tester les policies en mode anon et en mode authentifié
- [ ] **Tokens et secrets tiers**
  - [ ] Vérifier la validité des tokens de notification push (APNs, FCM)
  - [ ] Vérifier les clés d'API tierces (si applicable)
- [ ] Le fichier `google-play-service-account.json` est présent localement (non committé)
- [ ] Les identifiants Apple (`ascAppId`, `appleTeamId`) sont renseignés dans `eas.json`

---

## 2. Base de données — Migrations SQL

- [ ] **Exécuter toutes les migrations en attente**
  ```bash
  supabase db push --linked
  ```
- [ ] Vérifier que les migrations s'appliquent sans erreur sur la base de production
- [ ] Vérifier l'intégrité des données après migration (requêtes de contrôle)
- [ ] Sauvegarder la base de données avant la migration (snapshot Supabase)
- [ ] Les index de performance sont créés (colonnes de recherche fréquente)
- [ ] Les triggers et fonctions PL/pgSQL sont à jour
- [ ] Tester les migrations sur un environnement de staging avant la production

---

## 3. Edge Functions — Déploiement

- [ ] **Déployer toutes les Edge Functions**
  ```bash
  supabase functions deploy --project-ref <PROJECT_REF>
  ```
- [ ] Vérifier que chaque fonction déployée répond correctement (tests smoke)
- [ ] Les variables d'environnement des Edge Functions sont configurées dans le dashboard
- [ ] Les logs des Edge Functions ne montrent pas d'erreurs critiques
- [ ] Les timeouts des Edge Functions sont adaptés à la charge attendue

---

## 4. Build — Construction des binaires avec EAS

### 4.1 Build de validation (preview)

- [ ] Lancer un build preview Android
  ```bash
  eas build --platform android --profile preview
  ```
- [ ] Lancer un build preview iOS
  ```bash
  eas build --platform ios --profile preview
  ```
- [ ] Installer et tester le build preview sur un appareil physique (Android APK)
- [ ] Installer et tester le build preview iOS via TestFlight interne ou simulateur

### 4.2 Build de production

- [ ] Vérifier que `EXPO_PUBLIC_APP_ENV=production` est bien configuré dans `eas.json`
- [ ] Lancer le build de production Android
  ```bash
  eas build --platform android --profile production
  ```
- [ ] Lancer le build de production iOS
  ```bash
  eas build --platform ios --profile production
  ```
- [ ] Les builds se terminent sans erreur sur le dashboard EAS
- [ ] Télécharger et conserver les artefacts de build (`.aab` Android, `.ipa` iOS)

### 4.3 Tests sur les binaires de production

- [ ] Tester le flux d'inscription complet (nouvel utilisateur)
- [ ] Tester le flux de connexion (utilisateur existant)
- [ ] Tester la géolocalisation et l'affichage des matchs proches
- [ ] Tester la messagerie in-app (envoi et réception)
- [ ] Tester l'upload de photos (profil, matchs)
- [ ] Tester les notifications push (foreground et background)
- [ ] Tester la suppression de compte (Paramètres > Mon Compte > Supprimer)
- [ ] Tester le comportement hors connexion (mode avion)
- [ ] Vérifier les performances (pas de freeze, transitions fluides)
- [ ] Vérifier l'absence de crash sur les parcours critiques

---

## 5. App Store Connect (Apple)

### 5.1 Configuration de l'application

- [ ] Se connecter sur [App Store Connect](https://appstoreconnect.apple.com)
- [ ] Créer l'application si elle n'existe pas (Mes apps > +)
- [ ] Renseigner le Bundle ID (doit correspondre à `app.json`)
- [ ] Renseigner le SKU (identifiant unique interne)
- [ ] Sélectionner la catégorie principale : **Sports**
- [ ] Sélectionner la catégorie secondaire (si applicable)
- [ ] Renseigner l'`ascAppId` dans `eas.json` > submit > production > ios

### 5.2 Métadonnées et description

- [ ] **Nom de l'app** : FootMatch (max 30 caractères)
- [ ] **Sous-titre** : (max 30 caractères)
- [ ] **Description** : (max 4 000 caractères) — inclure mots-clés naturellement
- [ ] **Mots-clés** : (max 100 caractères) — football, match, joueurs, terrain, sport
- [ ] **URL de support** : URL vers la page de support ou contact
- [ ] **URL de politique de confidentialité** : URL publique vers `privacy-policy.html`
- [ ] **URL de marketing** (optionnel)
- [ ] **Mentions légales** (optionnel)

### 5.3 Screenshots et previews

- [ ] **iPhone 6.9" (iPhone 16 Pro Max)** — 3 à 10 screenshots obligatoires
- [ ] **iPhone 6.5" (iPhone 14 Plus / 13 Pro Max)** — 3 à 10 screenshots
- [ ] **iPhone 5.5"** (si support iOS 12+) — 3 à 10 screenshots
- [ ] **iPad Pro 12.9" (6e gen)** — si l'app supporte iPad
- [ ] **iPad Pro 12.9" (2e gen)** — si l'app supporte iPad
- [ ] Les screenshots montrent les fonctionnalités clés (accueil, matchs, profil, messagerie)
- [ ] Preview vidéo de l'app (optionnel mais recommandé, max 30 secondes)
- [ ] Les screenshots sont en français

### 5.4 Informations de version

- [ ] Numéro de version correct (correspond à `app.json`)
- [ ] **Notes de version** rédigées en français (quoi de neuf dans cette version)
- [ ] Informations de contact du testeur Apple (nom, prénom, e-mail, téléphone)
- [ ] **Identifiants de démonstration** : compte de test pour la revue Apple
  - Login : `review@footmatch.fr`
  - Mot de passe : (à définir, compte de test dédié)
- [ ] Notes à destination de l'équipe de revue Apple (si fonctionnalité spéciale)

### 5.5 Classification par âge (App Rating)

- [ ] Remplir le questionnaire de classification par âge
- [ ] Vérifier que la classification est appropriée (probablement 4+ ou 12+)
- [ ] Aucun contenu inapproprié non signalé

### 5.6 Tarification et disponibilité

- [ ] Sélectionner le prix (gratuit ou payant)
- [ ] Sélectionner les pays/régions de distribution
- [ ] Date de disponibilité configurée

### 5.7 Soumission et revue

- [ ] Soumettre le build depuis EAS
  ```bash
  eas submit --platform ios --profile production
  ```
  ou manuellement via App Store Connect
- [ ] Sélectionner le build à soumettre pour revue
- [ ] Cliquer sur **Soumettre pour revue**
- [ ] Délai de revue Apple : généralement 24-48h (peut varier)

---

## 6. Google Play Console (Android)

### 6.1 Configuration de l'application

- [ ] Se connecter sur [Google Play Console](https://play.google.com/console)
- [ ] Créer l'application si elle n'existe pas (Créer une application)
- [ ] Sélectionner la langue par défaut : Français
- [ ] Sélectionner le type : Application
- [ ] Accepter les politiques du programme développeur

### 6.2 Fiche Play Store

- [ ] **Nom de l'application** : FootMatch (max 30 caractères)
- [ ] **Description courte** : (max 80 caractères)
- [ ] **Description complète** : (max 4 000 caractères)
- [ ] **Icône de l'application** (512 x 512 px, PNG, max 1 Mo)
- [ ] **Bannière** (1 024 x 500 px, PNG ou JPEG) — optionnelle
- [ ] **URL de politique de confidentialité** : URL publique vers `privacy-policy.html`

### 6.3 Screenshots et graphismes

- [ ] **Téléphone** : 2 à 8 screenshots (min 320px, max 3 840px sur chaque côté)
- [ ] **Tablette 7"** (optionnel mais recommandé)
- [ ] **Tablette 10"** (optionnel mais recommandé)
- [ ] **Vidéo de présentation YouTube** (optionnel)
- [ ] Les screenshots sont de haute qualité et en français

### 6.4 Classification du contenu

- [ ] Remplir le questionnaire IARC de classification du contenu
- [ ] Vérifier la classification obtenue (probablement PEGI 3 ou PEGI 7)

### 6.5 Formulaire de sécurité des données (Data Safety)

- [ ] Accéder à **Sécurité des données** dans la Play Console
- [ ] Déclarer la collecte de données personnelles :
  - [ ] **Adresse e-mail** (collectée, obligatoire, non partagée avec des tiers)
  - [ ] **Localisation approximative** (collectée, optionnelle, usage de l'app)
  - [ ] **Localisation précise** (collectée, optionnelle, usage de l'app)
  - [ ] **Photos et vidéos** (collectées, optionnelles, fonctionnalité app)
  - [ ] **Messages in-app** (collectés, optionnels, fonctionnalité app)
  - [ ] **Identifiants d'appareil** (collectés, sécurité)
- [ ] Déclarer que les données peuvent être supprimées sur demande de l'utilisateur
- [ ] Déclarer les pratiques de sécurité (chiffrement en transit, chiffrement au repos)
- [ ] Soumettre le formulaire de sécurité des données pour revue

### 6.6 Tarification et distribution

- [ ] Sélectionner le prix (gratuit)
- [ ] Sélectionner les pays de distribution
- [ ] Confirmer que l'app est conforme aux politiques Google Play

### 6.7 Compte de service et soumission

- [ ] Vérifier que `google-play-service-account.json` est valide et a les permissions nécessaires
- [ ] Soumettre le build via EAS
  ```bash
  eas submit --platform android --profile production
  ```
- [ ] Vérifier que le bundle AAB est bien reçu dans la Play Console (track interne)
- [ ] Promouvoir vers la track **Bêta fermée** puis **Production** après validation

---

## 7. Post-soumission — Monitoring et suivi

### 7.1 Pendant la revue

- [ ] Surveiller les e-mails Apple/Google pour toute notification de revue
- [ ] Vérifier quotidiennement le statut dans App Store Connect et Play Console
- [ ] En cas de rejet : lire attentivement le motif, corriger, re-soumettre

### 7.2 Après la mise en ligne

- [ ] Vérifier que l'app est bien visible et téléchargeable sur les stores
- [ ] Tester un téléchargement depuis l'App Store et le Play Store
- [ ] Surveiller les crashs dans les premières 48h
  - [ ] Dashboard EAS / Expo
  - [ ] Supabase logs
  - [ ] Sentry (si configuré)
- [ ] Surveiller les avis et notes des premiers utilisateurs
- [ ] Vérifier les métriques de performance (temps de chargement, taux de crash)
- [ ] Communiquer le lancement (réseaux sociaux, e-mail, etc.)

### 7.3 Monitoring continu

- [ ] Mettre en place des alertes de crash (seuil > 1%)
- [ ] Surveiller les métriques Supabase (latence DB, usage storage, Edge Functions)
- [ ] Planifier la prochaine mise à jour corrective (patch) dans les 2 semaines
- [ ] Documenter les retours utilisateurs et prioriser le backlog

---

## Contacts utiles

| Service | URL | Contact |
|---------|-----|---------|
| App Store Connect | https://appstoreconnect.apple.com | contact@footmatch.fr |
| Google Play Console | https://play.google.com/console | contact@footmatch.fr |
| Supabase Dashboard | https://supabase.com/dashboard | support@footmatch.fr |
| EAS Dashboard | https://expo.dev | support@footmatch.fr |
| CNIL (RGPD) | https://www.cnil.fr | privacy@footmatch.fr |

---

*Dernière mise à jour : 31 mars 2026 — FootMatch SAS*
