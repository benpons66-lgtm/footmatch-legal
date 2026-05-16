# FootMatch — Contexte Projet Claude

> Mis à jour le 2026-05-16 par Ben Pons (Perpignan).
> **⚡ URGENCE : soumission stores aujourd'hui. On ne régresse pas, on ne casse rien.**

---

## 🎯 Produit

**FootMatch** — App mobile qui met en relation des joueurs de foot amateur pour rejoindre ou créer des matchs (Five, City Stade, Foot à 11) en temps réel.

**Promesse** : Trouve un match en 30 secondes.

**Statut** : V1 **terminée et fonctionnelle**. On est en phase de finition finale — correction des derniers bugs mineurs écran par écran, puis soumission Google Play + App Store.

**Contexte concurrentiel** : un site `footmatch.fr` s'est lancé il y a 8 jours (clubs de foot, positionnement différent). FootMatch garde son nom et son identité. On sort en premier sur le marché des joueurs amateurs.

**Zone de lancement V1** : Perpignan + agglo (66) uniquement.

---

## 🚦 Phase actuelle — Finition avant soumission

Tous les grands chantiers sont terminés :
- ✅ Chantier 1 — Fake data unifiée (`db/seed_perpignan_v1.sql` en place, `data/fakeData.ts` supprimé)
- ✅ Chantier 1.5 — Bugs fonctionnels critiques corrigés
- ✅ Chantier 2 — Refonte esthétique "modern football"

**Ce qui reste** : 2-3 bugs mineurs ciblés, à corriger écran par écran avec Ben.

### Méthode de travail en finition

- Ben envoie les écrans / fichiers un par un
- Je lis le fichier complet **avant** de toucher quoi que ce soit
- Fix minimal et ciblé — **aucun refactor opportuniste**
- Je signale tout bug supplémentaire détecté en lisant, sans le corriger en silence
- Je dis ce qui a changé, ce qui est testé, ce qui reste à vérifier

### Règle absolue de cette phase

> **ON NE RÉGRESSE PAS. ON NE CASSE RIEN.**
>
> Avant chaque modification, vérifier que les parcours critiques restent intacts :
> créer un match · rejoindre/quitter · chat communauté · voir un profil · déconnexion.

### Historique des bugs résolus (référence)

| Date | Bug | Fix |
|---|---|---|
| 2026-05-10 | Rejoindre/quitter un match → `current_players` pas mis à jour | Update Supabase **ET** `setSelectedMatch` — les deux cohabitent |
| 2026-05-10 | Champ prix non saisissable | `price` ajouté au form state + reset corrigé |
| 2026-05-10 | Chat — navigation bloquée après envoi | `Keyboard.dismiss()` au send |
| 2026-05-10 | Logout intempestif au démarrage | `ensureValidSession()` différée 2s |

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
├── App.tsx                    ⚠️ 3200+ lignes — monolithique assumé jusqu'au launch
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
├── db/                        Scripts SQL — voir db/SUPABASE_RUN_ORDER.md
├── supabase/functions/        Edge Functions (delete-account)
├── legal/                     Privacy, TOS, Account Deletion (markdown)
└── mocks/react-native-maps.web.js
```

> `data/fakeData.ts` → **supprimé**. Toute la lecture passe par Supabase.

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

### Identité visuelle (appliquée)
- Dark + accent néon vert, style Sofascore/Onefootball
- Navigation 4 onglets bottom : **Matchs · Joueurs · Communauté · Profil** + FAB central
- Dark mode exclusif
- État navigation dans `App.tsx` (`activeTab` + `currentScreen`)

### Niveaux — UNE seule échelle
- **D4 (débutant) / D3 (intermédiaire) / D2 (confirmé)** — cap V1 à D2
- Tout le reste (`Légende`, `Pro`, `GOAT`, personnages humoristiques) = **désactivé V1 — ne pas remettre**
- Source de vérité : `components/ReputationBadge.tsx` (`getLevelFromScore`, `LEVEL_THRESHOLDS`)
- D4/D3/D2 en DB = legacy → normaliser via `normalizeLevel()`

---

## 🗄️ Supabase

### Règles absolues
- **Jamais d'appel Supabase direct dans un écran** sans passer par un helper de `lib/`
- **Jamais désactiver RLS** — toutes les tables sensibles ont des policies
- Profils seedés : IDs commençant par `fa` (`isSeededProfileId` dans `lib/playerStats.ts`)
- Régénérer les types après migration : `npx supabase gen types typescript --project-id <ID> > types/supabase.ts`

### Edge Functions
- `delete-account` (RGPD)

### Migrations en place
1. `db/store_readiness.sql`
2. `db/community_profile_and_venues.sql`
3. `db/security_hardening.sql`
4. `db/seed_perpignan_v1.sql` ✅ (remplace tous les anciens seeds)

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
- **Compte Google Play perso** → règle des 20 testeurs / 14 jours (cf. LAUNCH_PLAN_1WEEK.md). À vérifier avant D-day Android.

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

1. **Lire le fichier avant de le modifier** (toujours, sans exception).
2. **Corrections minimales** — pas de refactor, pas de "tant qu'on y est".
3. **Pas de nouvelle dépendance** sans valider avec Ben.
4. **TypeScript strict** — pas d'erreur, pas de `any` sans justif.
5. **Toujours répondre en français.**
6. **Style** — utiliser `Colors`, `Spacing`, `Radius` du theme. Jamais de hex en dur.
7. **Tester mentalement** iOS *et* Android avant de livrer.
8. **Fake data** : tout passe par Supabase. `data/fakeData.ts` n'existe plus.
9. **Cartes joueurs humoristiques** : désactivées V1. Ne pas les remettre.

### ⚠️ Garde-fous App.tsx (fichier le plus risqué — 3200+ lignes)

| Action | Règle |
|---|---|
| Rejoindre un match | Toujours `supabase.from('matches').update({ current_players })` **ET** `setSelectedMatch` — les deux, même si un trigger SQL existe |
| Quitter un match | Idem — mettre à jour la base ET l'état local |
| Auth au démarrage | Ne jamais forcer logout dans le `useEffect` principal sans délai ≥ 1500ms |
| Modifier le form state | Tout nouveau champ → dans l'état initial ET dans le reset après submit |
| Supprimer un hook/state | Grep avant delete — vérifier que rien ne le référence |
| Modifier une prop de screen | Mettre à jour **tous** les call-sites dans App.tsx |

### ⚠️ Garde-fous Supabase

| Action | Règle |
|---|---|
| Nouveau script SQL | Toujours `ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS` |
| Supprimer une colonne | Grep d'abord — vérifier que le code ne la lit pas |
| Ajouter une table | RLS activé par défaut + policies dans le même script |
| Rejouer un seed | Cleanup défensif d'abord (`db/cleanup_before_reseed.sql`) |

### Checklist avant de livrer un patch App.tsx

- [ ] J'ai lu les lignes touchées **et** leurs 20 lignes de contexte
- [ ] Je n'ai pas supprimé une mise à jour de state sans vérifier pourquoi elle existait
- [ ] Les boutons modifiés ont toujours un `onPress` non-vide et un `accessibilityLabel`
- [ ] `form` state : tout nouveau champ est dans l'objet initial ET dans le reset
- [ ] Supabase : les updates optimistes (`setXxx`) sont doublés d'un vrai appel DB
- [ ] Les 5 parcours critiques restent intacts (créer · rejoindre · chat · profil · logout)

---

## 🧭 Comment je collabore avec Ben

- **Direct** : pas de blabla, je vais à l'essentiel.
- **Écran par écran** : Ben envoie les fichiers problématiques, je lis + corrige + on valide avant de passer au suivant.
- **Diff avant apply** sur tout ce qui est >30 lignes ou touche App.tsx. Petits changements localisés → j'applique direct.
- **Si je trouve un bug** en lisant : je le signale en haut de ma réponse avant tout.
- **Avant de livrer** : je dis ce qui a changé, ce qui est testé, ce qui reste à vérifier.
- **Budget outils** ~50€/mois — solutions gratuites/low-cost d'abord.

---

## 👤 Développeur

**Ben Pons** — Entrepreneur solo, Perpignan
- Autodidacte (parti de zéro)
- Social : TikTok + Instagram `@FootMatch.app`
- GitHub : `benpons66-lgtm`

---

## 🧰 Skills FootMatch

| Skill | Triggers |
|---|---|
| `bug-fixer` | "bug", "erreur", "crash", "ça marche pas" |
| `code-review` | "review", "vérifie", "c'est propre" |
| `performance-check` | "lent", "lag", "perf" |
| `store-readiness` | "publier", "store", "prêt à sortir" |

---

## 🚀 Roadmap

### V1 — soumission stores aujourd'hui (16 mai 2026)
- ✅ App fonctionnelle
- ✅ Fake data unifiée (Perpignan, seed unique)
- ✅ Bugs fonctionnels critiques corrigés
- ✅ Refonte esthétique "modern football"
- 🔄 Derniers bugs mineurs (2-3 ciblés, en cours)
- 🔄 Build prod EAS + soumission

### V1.1 — post-launch
- Bugs P0/P1 remontés par les premiers utilisateurs
- Début découpage App.tsx (extraire screens individuels)
- Analytics basiques
- Push notifications "match près de toi"

### V2 — vision
- Expansion hors 66 (ville par ville)
- Tournois amateurs organisés
- Partenariats clubs / mairies
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  