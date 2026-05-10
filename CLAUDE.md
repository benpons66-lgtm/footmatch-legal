# FootMatch — Contexte Projet Claude

> Fichier chargé à chaque session. Mis à jour le 2026-04-27 par Ben Pons (Perpignan).
> **Cap actuel : publier sur App Store + Play Store fin mai 2026.**

---

## 🎯 Produit

**FootMatch** — App mobile qui met en relation des joueurs de foot amateur pour rejoindre ou créer des matchs (Five, City Stade, Foot à 11) en temps réel.

**Promesse** : Trouve un match en 30 secondes.

**Statut** : V1 fonctionnelle, en finition. 3 chantiers avant store. Lancement géographique = **Perpignan + agglo (66)** uniquement pour la V1.

---

## 🚦 Les 3 chantiers avant le launch (priorisés)

L'app marche déjà mais a des bugs d'utilisation. Avant les stores, on attaque dans cet ordre :

### Chantier 1 — Unifier la fake data (priorité absolue)
**Problème actuel** : 3 sources de fake data parallèles qui ne se parlent pas → incohérences visibles partout.

| Source | À faire |
|---|---|
| `data/fakeData.ts` (50 joueurs `fp-001`…) | **À supprimer** une fois la migration faite |
| `db/seed_fake_data.sql` (100 joueurs `fa00…` France entière) | **À remplacer** par le nouveau seed unifié |
| `db/seed_1000_players.sql` (1000 joueurs France) | **À supprimer** — trop pour Perpignan |

**Cible** : **un seul fichier seed SQL** (`db/seed_perpignan_v1.sql`) qui produit :
- **50 profils** ancrés Perpignan + Canet + Cabestany + Thuir + Rivesaltes + Argelès
- Pseudos cohérents (mix street/foot/catalan), tous distincts
- 3 niveaux uniquement : **D4 / D3 / D2** (cap absolu D2 pour la V1, on n'est pas la NBA)
- ~10 matchs avec **distribution réaliste de remplissage** : 40% bien remplis (≥75%), 30% moyennement (40-70%), 20% peu (<40%), 10% presque vides
- 15-20 messages communauté avec pseudos *qui existent réellement* dans le seed
- IDs cohérents entre tables (`organizer_id` du match = profil seed existant ; `playerIds` = profils seed existants ; pseudos cités dans messages = pseudos seed existants)

**Règle d'or après migration** : *toute la lecture passe par Supabase*. Plus aucun écran ne lit `data/fakeData.ts`.

### Chantier 1.5 — Bug fixes d'utilisation (NE PAS SAUTER)
**Avant tout chantier esthétique**, on corrige les bugs fonctionnels qui empêchent l'usage normal de l'app. La règle : *un écran qui plante ne peut pas être joli*.

Méthode :
- Reproduire le bug sur device avant de patcher
- Fix minimal et ciblé, pas de refactor opportuniste
- Vérifier qu'aucun bug "freeze" / "écran bloqué" / "action impossible" n'existe sur les parcours critiques : créer/rejoindre un match, envoyer un message communauté, voir un profil, déconnexion

Bugs résolus (2026-05-10) :
- ✅ Rejoindre/quitter un match → `current_players` remis à jour manuellement en base ET en local (ne jamais supprimer cette ligne même si un trigger SQL existe, les deux cohabitent sans conflit)
- ✅ Champ prix non saisissable → `price` ajouté au form state + soumission corrigée
- ✅ Chat navigation bloquée → `Keyboard.dismiss()` au send
- ✅ Logout intempestif au démarrage → `ensureValidSession()` différée de 2s (laisse Supabase charger la session)

Bugs en cours :
- _(aucun connu — màj au fil de l'eau)_

### Chantier 2 — Refonte esthétique "modern football"
**Direction visuelle** : on garde le dark + accent vert mais on durcit l'identité football moderne.

- Inspirations à explorer : **Onefootball** (cards de match), **FIFA Mobile** (animation joueur), **Strava** (clean stats), **Sofascore** (densité info match)
- Trois écrans à refaire en priorité : **liste Matchs**, **détail Match**, **profil Joueur**
- **Désactiver les "cartes joueurs humoristiques"** (Castolo, Momo le Gaucher, etc. dans `PlayerCard.tsx`) — on garde le composant mais la version sérieuse uniquement (stats + niveau D4/D3/D2, c'est tout)
- Conserver pour la V1 : navigation 4 onglets + FAB central, dark map, dark mode exclusif

### Chantier 3 — Tests + soumission stores
- Tests bout-en-bout sur device physique (iOS + Android) sur les parcours critiques
- Build prod via EAS, métadonnées stores, screenshots
- Soumission

**Hors scope V1** : découper App.tsx, push notifications avancées, expansion hors Perpignan, features premium. Tout ça → V1.1+.

---

## 🏗️ Architecture technique

### Stack
- React Native + **Expo SDK 54** / React 19 / RN 0.81
- TypeScript strict
- **Supabase** (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
- **Zustand v5** (`store/useStore.ts`)
- Navigation custom via `useState` dans App.tsx (pas de React Navigation)
- `@expo/vector-icons` (Ionicons), `react-native-maps` 1.20.1, `expo-notifications`, `expo-location`, `expo-image-picker`

### Structure
```
footmatch/
├── App.tsx                    ⚠️ 3218 lignes — monolithique assumé jusqu'au launch
├── index.ts                   Entry point + ErrorBoundary
├── constants/theme.ts         Colors, Spacing, Radius, MATCH_TYPES
├── lib/
│   ├── supabase.ts            Client Supabase
│   └── playerStats.ts         fetchComputedStatsForUsers, getDisplayReputationScore, isSeededProfileId
├── store/useStore.ts          Zustand global
├── types/index.ts             Types TS (Match, Team, Cup, etc.)
├── components/                ErrorBoundary, ReputationBadge, RadarView, LevelUpModal,
│                              GuestModal, AvatarPicker, PlayerCard
├── screens/                   Splash, Onboarding, Legal, Reputation, CardGallery,
│                              Championship*, Competitions, Community, TeamDetail,
│                              CupDetail, Players, PlayerProfile
├── data/fakeData.ts           ⚠️ EN COURS DE SUPPRESSION (chantier 1) — ne plus rien y ajouter
├── db/                        Scripts SQL — voir db/SUPABASE_RUN_ORDER.md
├── supabase/functions/        Edge Functions (delete-account)
├── legal/                     Privacy, TOS, Account Deletion (markdown)
└── mocks/react-native-maps.web.js
```

---

## 🎨 Design system

### Couleurs (`constants/theme.ts`)
Palette dark verte. **Toujours utiliser `Colors`, `Spacing`, `Radius` du theme** — jamais de valeurs en dur.

```
bg #080D08 / bg2 #0F160F / bg3 #172017 / card #131913
green #00E676 (primaire) · greenDark #00A854 · greenLight #B9F6CA
text #E8F5E8 / textMuted #5A7A5A / textDim #3A5A3A
border rgba(0,230,118,0.15)
```

### Identité (cible chantier 2)
- Dark + accent néon vert
- Plus dense en infos (style Sofascore/Onefootball)
- Typo plus typée "sport" — à valider quand on attaque le chantier 2
- Animations micro (Reanimated *uniquement si* perf OK — sinon on s'abstient)

### Navigation
- 4 onglets bottom : **Matchs · Joueurs · Communauté · Profil**
- FAB central "Créer un match"
- État dans `App.tsx` (`activeTab` + `currentScreen`)

### Niveaux — UNE seule échelle
- **D4 (débutant) / D3 (intermédiaire) / D2 (confirmé)** — cap V1 à D2
- Tout le reste (`Légende`, `Pro`, `Premier League`, `GOAT`, "personnages humoristiques") = **désactivé pour la V1**
- Source : `components/ReputationBadge.tsx` (`getLevelFromScore`, `LEVEL_THRESHOLDS`)

---

## 🗄️ Supabase

### Règles absolues
- **Jamais d'appel Supabase direct dans un écran** sans passer par un helper de `lib/`
- **Jamais désactiver RLS** — toutes les tables sensibles ont des policies
- Profils seedés ont des IDs commençant par `fa` (`isSeededProfileId` dans `lib/playerStats.ts`)
- Régénérer les types après migration : `npx supabase gen types typescript --project-id <ID> > types/supabase.ts`

### Edge Functions
- `delete-account` (RGPD)

### Migrations — ordre cible (chantier 1 finalisé)
1. `db/store_readiness.sql`
2. `db/community_profile_and_venues.sql`
3. `db/security_hardening.sql`
4. `db/seed_perpignan_v1.sql` ← **à créer en chantier 1, remplace les 3 anciens seeds**

Anciens scripts (`seed_fake_data.sql`, `seed_1000_players.sql`, `seed_matchs_et_fixtures.sql`, `fake_data_consistency.sql`, `launch_realism_pass.sql`) → **à supprimer** dès que le nouveau seed est en place.

---

## 📦 Build & stores

- **Bundle iOS** : `fr.footmatch.app` · **Package Android** : `fr.footmatch.app`
- **EAS** : owner `footmatch`, project `footmatch-app`
- **Compte démo Apple Review** : `review@footmatch.fr`
- **Email support** : `support@footmatch.fr` · DPO : `footmatch.app@proton.me`
- **Repo légal** : https://github.com/benpons66-lgtm/footmatch-legal
  - Privacy : https://benpons66-lgtm.github.io/footmatch-legal/PRIVACY_POLICY.html
  - TOS : https://benpons66-lgtm.github.io/footmatch-legal/TERMS_OF_SERVICE.html
  - Suppression compte : https://benpons66-lgtm.github.io/footmatch-legal/ACCOUNT_DELETION.html
- **Compte Google Play perso** → règle des 20 testeurs / 14 jours possible (cf. LAUNCH_PLAN_1WEEK.md). À vérifier avant le D-day Android.

---

## 🛠️ Commandes

```bash
# Dev
npx expo start
npx expo start --clear
npx expo start --tunnel

# Lint / format
npm run lint
npm run lint:strict
npm run format

# Build prod
eas build --platform ios --profile production
eas build --platform android --profile production
eas build:list

# Submit
eas submit --platform ios --profile production
eas submit --platform android --profile production

# Supabase
npx supabase gen types typescript --project-id <ID> > types/supabase.ts
npx supabase functions deploy delete-account
```

---

## 📋 Règles de développement

1. **Lire le fichier avant de le modifier** (toujours).
2. **Corrections minimales** — ne pas refactor opportuniste, surtout pas avant le launch.
3. **Pas de nouvelle dépendance** sans valider avec Ben.
4. **TypeScript strict** — pas d'erreur, pas de `any` sans justif.
5. **Toujours répondre en français.**
6. **Style** — utiliser `Colors`, `Spacing`, `Radius` du theme. Jamais de hex en dur.
7. **Tester mentalement** iOS *et* Android avant de livrer.
8. **Niveaux** : le système de scoring utilise N3/N2/N1/R3… (`ReputationBadge.tsx`) — c'est la seule source de vérité. D4/D3/D2 dans la DB = legacy, normaliser via `normalizeLevel()`.
9. **Fake data** : `data/fakeData.ts` supprimé. Tout passe par Supabase.
10. **Cartes joueurs humoristiques** : désactivées V1. Ne pas les remettre.

### ⚠️ Garde-fous App.tsx (fichier le plus risqué — 3200+ lignes)

Ces patterns ont causé des bugs réels. Les appliquer sans exception :

| Action | Règle |
|---|---|
| Rejoindre un match | Toujours faire `supabase.from('matches').update({ current_players })` **ET** `setSelectedMatch` — les deux, même si un trigger SQL existe |
| Quitter un match | Idem — mettre à jour la base ET l'état local |
| Auth au démarrage | Ne jamais forcer logout dans le `useEffect` principal sans délai ≥ 1500ms (Supabase charge la session de façon asynchrone) |
| Modifier le form state | Si tu ajoutes un champ au form, l'ajouter aussi dans l'état initial ET dans le reset après submit |
| Supprimer un hook/state | Vérifier d'abord que rien ne le référence (grep avant delete) |
| Modifier une prop de screen | Mettre à jour **tous** les call-sites dans App.tsx (grep `<PlayersScreen`, `<CommunityScreen`, etc.) |

### ⚠️ Garde-fous Supabase

| Action | Règle |
|---|---|
| Nouveau script SQL | Toujours `ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `DELETE WHERE id NOT IN (SELECT id FROM auth.users)` |
| Supprimer une colonne | Vérifier d'abord que le code ne la lit pas (`grep -r "column_name"`) |
| Ajouter une table | RLS activé par défaut, policies ajoutées dans le même script |
| Rejouer un seed | Cleanup défensif d'abord (`db/cleanup_before_reseed.sql`) |

### Checklist avant de livrer un patch App.tsx

- [ ] J'ai lu les lignes touchées **et** leurs 20 lignes de contexte
- [ ] Je n'ai pas supprimé une mise à jour de state sans vérifier pourquoi elle existait
- [ ] Les boutons modifiés ont toujours un `onPress` non-vide et un `accessibilityLabel`
- [ ] `form` state : tout nouveau champ est dans l'objet initial ET dans le reset
- [ ] Supabase : les updates optimistes (setXxx) sont doublés d'un vrai appel DB

---

## 🧭 Comment je collabore avec Ben

- **Direct** : pas de blabla, je vais à l'essentiel.
- **Diff avant apply** sur tout ce qui est >30 lignes ou touche App.tsx. Petits changements localisés → j'applique direct.
- **Si je trouve un bug** en lisant : je le signale, je ne le corrige pas en silence.
- **Avant de livrer** : je dis ce qui a changé, ce qui est testé, ce qui reste à vérifier.
- **Budget outils** ~50€/mois — solutions gratuites/low-cost d'abord.
- **Format** : court, factuel, pas de "résumé final" à rallonge.

---

## 👤 Développeur

**Ben Pons** — Entrepreneur solo, Perpignan
- Autodidacte (parti de zéro)
- Social : TikTok + Instagram `@FootMatch.app`
- GitHub : `benpons66-lgtm`

---

## 🧰 Skills FootMatch (chargés selon contexte)

| Skill | Triggers |
|---|---|
| `bug-fixer` | "bug", "erreur", "crash", "ça marche pas" |
| `code-review` | "review", "vérifie", "c'est propre" |
| `performance-check` | "lent", "lag", "perf" |
| `store-readiness` | "publier", "store", "prêt à sortir" |

---

## 🚀 Roadmap

### V1 — fin mai 2026 (cap actuel)
- ✅ App fonctionnelle
- 🔄 **Chantier 1** : unification fake data
- 🔄 **Chantier 2** : refonte esthétique "modern football"
- 🔄 **Chantier 3** : tests device + soumission stores

### V1.1 — post-launch
- Bugs P0/P1 remontés
- Début découpage App.tsx (extraire screens individuels)
- Analytics basiques
- Push notifications "match près de toi"

### V2 — vision
- Expansion hors 66 (ville par ville)
- Tournois amateurs organisés
- Partenariats clubs / mairies
