# FootMatch

Application mobile de organisation de matchs de football amateur.  
Construite avec Expo (React Native), TypeScript strict, Supabase et Zustand.

> Ce repo est distinct de la landing page FootMatch.

## Prérequis

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Un projet Supabase avec les tables configurées

## Installation

```bash
git clone https://github.com/benpons66-lgtm/footmatch-mobile.git
cd footmatch-mobile
cp .env.example .env
# Remplir .env avec tes vraies valeurs Supabase
npm install
npx expo start
```

## Variables d'environnement

Copier `.env.example` en `.env` et renseigner :

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL de ton projet Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anon de Supabase |

## Stack

- **Expo SDK 54** / React Native
- **TypeScript** strict
- **Supabase** (base de données, auth, temps réel)
- **Zustand** (gestion d'état)
