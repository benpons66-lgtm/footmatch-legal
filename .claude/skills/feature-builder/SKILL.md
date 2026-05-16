---
name: feature-builder
description: Ajoute une nouvelle fonctionnalité à FootMatch (écran, modal, onglet, bouton, action) sans casser l'existant. Utilise ce skill quand Ben dit "ajouter", "créer", "je voudrais une feature", "nouvelle fonctionnalité", "nouveau bouton", "nouvel écran", "ajouter une modal", "ajouter un onglet", "je veux que l'app fasse X".
---

# Feature Builder — FootMatch

## Contexte
FootMatch a une architecture particulière :
- **App.tsx** fait 3200+ lignes et contient toute la navigation (volontairement, pour la V1)
- La navigation utilise `activeTab` et `currentScreen` en `useState` (pas React Navigation)
- Les écrans principaux sont dans `screens/`
- Les composants réutilisables sont dans `components/`
- Le store global est dans `store/useStore.ts` (Zustand)
- Les appels Supabase passent par `lib/`

## Règles absolues

1. **Ne jamais refactorer App.tsx** sauf demande explicite de Ben (ou via skill `refactor-split`)
2. **Respecter le design system** : utiliser `Colors`, `Spacing`, `Radius` depuis `constants/theme.ts`
3. **Typage strict** : pas de `any` sans justification
4. **Pas de nouvelle dépendance** sans valider avec Ben
5. **Toujours lire les fichiers concernés** avant de modifier
6. **Les nouvelles features doivent fonctionner sur iOS ET Android**

## Workflow de construction d'une feature

### Étape 1 — Clarifier le besoin
Poser TOUJOURS ces questions à Ben avant de coder :
- À quel endroit de l'app ? (onglet Matchs / Joueurs / Communauté / Profil ?)
- Qui peut y accéder ? (tous, connectés, créateur du match, etc.)
- Est-ce que ça touche la base de données ? (lecture, écriture)
- Y a-t-il une interaction réseau ? (Realtime, push, etc.)
- Gratuit ou premium ? (futur)

### Étape 2 — Découper en tâches

Pour toute nouvelle feature, identifier ces blocs :

1. **Data layer** (si besoin)
   - Migration SQL (utiliser `supabase-expert`)
   - Fonctions dans `lib/`
   - Types TS

2. **State**
   - Faut-il ajouter quelque chose dans `store/useStore.ts` ?
   - Ou c'est du state local au composant ?

3. **UI**
   - Nouveau composant ? → dans `components/` (utiliser `ui-component`)
   - Nouvel écran ? → dans `screens/`
   - Modal ? → souvent dans App.tsx avec `useState` de visibilité

4. **Navigation**
   - Comment y accède-t-on depuis l'app ?
   - Ajout dans App.tsx via `currentScreen` ou `activeTab` ?

5. **Permissions / Auth**
   - RLS Supabase à vérifier
   - Connexion requise ? Guest autorisé ?

### Étape 3 — Code en suivant les patterns existants

Avant d'écrire, lire un écran similaire pour reprendre le style :
- Style de fonction (arrow vs function)
- Gestion d'erreur (try/catch + Alert)
- Loading states
- Style des boutons, titres, inputs
- Placement de `KeyboardAvoidingView` si formulaire

### Étape 4 — Tester mentalement

Avant de livrer :
- [ ] Teste le happy path
- [ ] Teste sans connexion internet
- [ ] Teste avec un user non connecté (si pertinent)
- [ ] Teste sur écran petit (iPhone SE) et grand (iPad-like)
- [ ] Pas de crash, pas d'écran blanc
- [ ] Typage complet, pas d'erreur TS
- [ ] Loading state visible
- [ ] Erreur affichée clairement à l'utilisateur

## Patterns standards FootMatch

### Ajouter un bouton dans une bar d'action
```tsx
<TouchableOpacity
  style={[styles.actionButton]}
  onPress={handleAction}
  activeOpacity={0.8}
>
  <Ionicons name="add-circle" size={20} color={Colors.green} />
  <Text style={styles.actionButtonText}>Mon action</Text>
</TouchableOpacity>
```

### Ouvrir une modal
```tsx
const [modalVisible, setModalVisible] = useState(false);

<Modal
  visible={modalVisible}
  animationType="slide"
  transparent={false}
  onRequestClose={() => setModalVisible(false)}
>
  {/* Contenu */}
</Modal>
```

### Appel Supabase avec gestion d'erreur
```tsx
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.from('table').insert({...});
    if (error) throw error;
    Alert.alert('Succès', 'Action réalisée');
  } catch (err) {
    console.error(err);
    Alert.alert('Erreur', "Impossible de réaliser l'action");
  } finally {
    setLoading(false);
  }
};
```

### Navigation entre écrans dans App.tsx
La nav suit ce pattern :
```tsx
const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
// ...
{currentScreen === 'mon-ecran' && (
  <MonEcran onBack={() => setCurrentScreen('home')} />
)}
```

## Format de réponse

```
💡 FEATURE À AJOUTER
[Récap du besoin]

📋 DÉCOUPAGE
1. [tâche 1]
2. [tâche 2]
...

📝 MODIFICATIONS PROPOSÉES
Fichier : [path]
[Diff ou code]

🔄 NAVIGATION
[Comment accéder à la feature]

🧪 TESTS À FAIRE
iOS : [étapes]
Android : [étapes]

⚠️ POINTS D'ATTENTION
[Impact sur RLS, perf, UX, etc.]

📊 Score qualité : X/10
```

## Règles de communication
- Toujours en français
- Si la feature est ambiguë, poser max 3 questions ciblées avant de coder
- Proposer une version minimale d'abord, évoluer ensuite
- Signaler si la feature nécessite un skill complémentaire (supabase-expert, ui-component, rgpd-compliance)
