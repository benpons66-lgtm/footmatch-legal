---
name: ui-component
description: Crée ou modifie un composant visuel FootMatch en respectant le design system (dark mode, néon vert, manga/gaming). Utilise ce skill quand Ben parle de composant UI, design, style, CSS, couleur, bouton, carte, badge, modal, input, formulaire, layout, animation, quand il dit "crée un composant", "refais le style", "c'est moche", "change le design", "ajoute un badge", "nouvelle carte".
---

# UI Component — FootMatch

## Contexte visuel FootMatch
L'app a une identité forte :
- **Dark mode exclusif** (fond `#0d1117`, proche GitHub dark)
- **Accent néon vert** (`#00FF66`) pour CTA, actif, highlights
- **Esthétique manga / gaming** — avatars manga, cartes FIFA-like
- **Coins arrondis généreux**, ombres vertes subtiles
- **Typographie** : poids 600-700 pour titres, 500 pour texte courant

## Design tokens (référence absolue)

Depuis `constants/theme.ts` :

```typescript
Colors = {
  bg:           '#0d1117',
  bg2:          '#161b22',
  bg3:          '#21262d',
  green:        '#00FF66',
  greenDim:     'rgba(0,230,118,0.10)',
  greenBorder:  'rgba(0,230,118,0.20)',
  greenLight:   '#00E676',
  greenDark:    '#00C853',
  text:         '#E6EDF3',
  textMuted:    'rgba(230,237,243,0.5)',
  textDim:      'rgba(230,237,243,0.3)',
  border:       'rgba(255,255,255,0.1)',
  borderSubtle: 'rgba(255,255,255,0.06)',
}
```

**Spacing** : multiples de 4 (4, 8, 12, 16, 20, 24, 32)
**Radius** : petit (8), moyen (12), grand (16), pill (999)

## Règles de design

### À FAIRE
- Utiliser **uniquement** les couleurs de `Colors`
- Espacer généreusement (padding 16+ par défaut)
- Utiliser `activeOpacity={0.8}` sur toutes les `TouchableOpacity`
- Ajouter une ombre verte subtle sur les CTA primaires (`shadowColor: Colors.green`)
- Bordures subtiles (`Colors.borderSubtle`) plutôt que séparateurs lourds
- Icons via `Ionicons` de `@expo/vector-icons`
- Poids 700 pour titres principaux, 600 pour sous-titres
- Toujours un `StatusBar` light content

### À NE PAS FAIRE
- Jamais de couleur hardcodée (`#fff`, `blue`, etc.) hors `Colors`
- Jamais d'image SVG externe sans validation
- Jamais de texte sans couleur définie (risque d'invisibilité en dark)
- Jamais de padding 0 dans un bouton touchable
- Jamais de Touchable sans feedback visuel
- Jamais de `fontWeight: 'bold'` → utiliser `'700'`

## Composants types FootMatch

### Bouton primaire CTA
```tsx
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: Colors.green,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: Colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
```

### Bouton secondaire outline
```tsx
secondaryButton: {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: Colors.greenBorder,
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 12,
  alignItems: 'center',
},
secondaryButtonText: {
  color: Colors.green,
  fontSize: 16,
  fontWeight: '600',
},
```

### Card standard
```tsx
card: {
  backgroundColor: Colors.bg2,
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  borderColor: Colors.borderSubtle,
  marginBottom: 12,
},
cardTitle: {
  color: Colors.text,
  fontSize: 18,
  fontWeight: '700',
  marginBottom: 8,
},
cardSubtitle: {
  color: Colors.textMuted,
  fontSize: 14,
  fontWeight: '500',
},
```

### Input
```tsx
input: {
  backgroundColor: Colors.bg3,
  color: Colors.text,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: Colors.border,
  fontSize: 16,
},
inputFocused: {
  borderColor: Colors.green,
},
```

### Badge
```tsx
badge: {
  backgroundColor: Colors.greenDim,
  paddingVertical: 4,
  paddingHorizontal: 10,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: Colors.greenBorder,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
badgeText: {
  color: Colors.green,
  fontSize: 12,
  fontWeight: '600',
},
```

## Workflow

### Étape 1 — Lire les composants existants
Avant de créer, lire 2-3 composants similaires pour reprendre les patterns :
- Un composant dans `components/` (ReputationBadge, PlayerCard)
- Une section dans un écran existant

### Étape 2 — Proposer un mockup textuel
Décrire en 3-5 lignes à quoi ressemblera le composant avant de coder.

### Étape 3 — Coder avec StyleSheet
- Toujours `StyleSheet.create` en bas du fichier
- Pas de `style={{...}}` inline pour les styles répétés
- Props typées avec interface

### Étape 4 — Accessibilité (minimum)
- `accessibilityLabel` sur les boutons icon-only
- `accessibilityRole="button"` sur les Touchable
- Taille tactile min 44x44 (iOS HIG)

### Étape 5 — Responsive
- `flex: 1` plutôt que width fixe
- `Dimensions.get('window')` si besoin de tailles dynamiques
- Padding horizontal constant pour cohérence

## Format de réponse

```
🎨 COMPOSANT À CRÉER
[Description courte]

📐 MOCKUP (description visuelle)
[Comment ça va être rendu]

📝 CODE
[Composant complet TSX + StyleSheet]

📍 OÙ L'UTILISER
[Import + exemple d'appel]

✅ CHECKLIST DESIGN
- [ ] Colors/Spacing/Radius depuis theme
- [ ] Touchable avec activeOpacity
- [ ] Types props stricts
- [ ] Accessibilité de base

📊 Score qualité : X/10
```

## Règles de communication
- Toujours en français
- Si Ben demande un look qui casse le design system, lui proposer une alternative cohérente
- Ne jamais inventer de couleur ou de spacing
- Demander "tu veux une version avec animation ?" uniquement si pertinent (sinon rester simple)
