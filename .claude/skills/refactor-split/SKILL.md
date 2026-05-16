---
name: refactor-split
description: Aide à découper App.tsx (3200+ lignes) en fichiers plus petits sans régression. Utilise ce skill quand Ben parle de refactor, découper, split, nettoyer, organiser, App.tsx trop gros, extraire, séparer, sortir un écran, sortir une fonction, ou quand il dit "App.tsx est trop gros", "faut que je range", "découpe ça", "sépare en plusieurs fichiers".
---

# Refactor Split — FootMatch

## Contexte
`App.tsx` contient 3200+ lignes : navigation, toutes les modals, les handlers globaux, les styles. C'est **volontaire pour la V1** parce que Ben voulait aller vite.

**À partir de la V1.1 publiée, on peut découper progressivement** sans casser l'existant.

## Règle d'or

⚠️ **NE JAMAIS refactorer juste pour refactorer.** Chaque split doit :
1. Être déclenché par un besoin concret (ajout de feature, bug récurrent)
2. Ne pas introduire de régression visible par l'utilisateur
3. Être testé immédiatement sur iOS ET Android
4. Être committé seul (1 refactor = 1 commit) pour pouvoir revert

## Règles absolues

1. **Refactorer par petits lots** (1 modal, 1 écran, 1 handler à la fois)
2. **Tester après chaque split** — pas d'accumulation de 10 modifs
3. **Ne pas renommer les variables** pendant un refactor structurel (séparer renommage et extraction)
4. **Préserver le comportement exact** — zéro changement fonctionnel
5. **Commits atomiques** : `refactor: extract XModal from App.tsx`
6. **Ne pas toucher à la logique métier** pendant un refactor — juste déplacer

## Plan de découpe recommandé (par ordre de priorité)

### Niveau 1 — Styles (faible risque)
Extraire les `StyleSheet.create` massifs d'App.tsx dans :
- `styles/app.ts`
- `styles/modals.ts`
- `styles/tabs.ts`

**Impact** : nul, juste un import en plus. Facile à rollback.

### Niveau 2 — Modals (risque modéré)
Sortir chaque modal en composant séparé dans `components/modals/` :
- `CreateMatchModal.tsx`
- `JoinMatchModal.tsx`
- `ChatModal.tsx`
- `GuestModal.tsx` (si pas déjà fait)
- etc.

Pattern :
```tsx
// Avant (dans App.tsx)
{showCreateModal && (
  <Modal visible={showCreateModal} ...>
    {/* 200 lignes */}
  </Modal>
)}

// Après
<CreateMatchModal
  visible={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onCreated={handleMatchCreated}
/>
```

### Niveau 3 — Handlers Supabase (risque modéré)
Extraire les fonctions async qui appellent Supabase dans `lib/` :
- `lib/matches.ts` → `fetchMatches`, `createMatch`, `joinMatch`, `leaveMatch`
- `lib/chat.ts` → `sendMessage`, `subscribeToMatchChat`
- `lib/auth.ts` → `signIn`, `signUp`, `signOut`
- `lib/profile.ts` → `fetchProfile`, `updateProfile`

**Bénéfice** : les mêmes fonctions sont réutilisables hors App.tsx.

### Niveau 4 — Navigation (risque ÉLEVÉ)
Découper la navigation en :
- `navigation/AppNavigator.tsx` (logique activeTab + currentScreen)
- `navigation/TabBar.tsx` (la tab bar custom)

**⚠️ Ne faire qu'après avoir beaucoup testé les niveaux 1-3.**

### Niveau 5 — Migration vers React Navigation (gros chantier)
Seulement si vraiment nécessaire (routing profond, deep links, etc.).
**Ne PAS faire tant que la V1.x fonctionne.**

## Workflow de refactor

### Étape 1 — Choisir une cible
Avec Ben, définir UN seul bloc à extraire. Ne pas en prendre 3.

### Étape 2 — Lire intégralement le code ciblé
- Variables utilisées (captures de closure)
- Props nécessaires en entrée
- Callbacks à retourner
- State local vs state partagé (store Zustand)

### Étape 3 — Préparer la signature
Définir l'interface du composant/fonction extrait avant de coder :
```typescript
interface CreateMatchModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (matchId: string) => void;
  userLocation: { lat: number; lng: number } | null;
}
```

### Étape 4 — Extraire en conservant le comportement
Copier le code tel quel dans le nouveau fichier, adapter les imports et props.

### Étape 5 — Remplacer dans App.tsx
Remplacer le bloc original par l'appel au nouveau composant.

### Étape 6 — Tester immédiatement
- Lancer `expo start`
- Tester le flow complet
- iOS + Android

### Étape 7 — Commit atomique
```bash
git add .
git commit -m "refactor: extract CreateMatchModal from App.tsx"
```

## Checklist avant de livrer un refactor

- [ ] Aucun changement fonctionnel (juste déplacement)
- [ ] Tests manuels passés iOS + Android
- [ ] Pas de warning TypeScript nouveau
- [ ] App.tsx a diminué de X lignes (mesurer)
- [ ] Commit atomique prêt
- [ ] Plan pour le prochain split identifié

## Mesure du progrès
Garder en tête la taille de App.tsx :
- État initial : ~3200 lignes
- Objectif V1.1 : <2500 lignes
- Objectif V1.2 : <1500 lignes
- Objectif V2 : <800 lignes (navigation uniquement)

## Format de réponse

```
🎯 CIBLE DU REFACTOR
[Bloc à extraire, pourquoi maintenant]

📊 AVANT
App.tsx : X lignes
Bloc ciblé : lignes X à Y (Z lignes)

📦 NOUVEAU FICHIER
Path : [...]
Signature : [...]

📝 CODE EXTRAIT
[Fichier complet]

🔁 REMPLACEMENT DANS App.tsx
[Diff du remplacement]

🧪 TESTS À FAIRE
[Flow complet à dérouler]

✅ APRÈS
App.tsx attendu : X - Z lignes

📊 Score qualité : X/10
```

## Règles de communication
- Toujours en français
- Rappeler à Ben de **commit avant de commencer** (filet de sécurité)
- Ne jamais extraire plus d'un bloc à la fois
- Alerter si le bloc utilise du state complexe (hooks, closures) — simplifier d'abord
- Proposer de tester entre chaque étape, pas à la fin
