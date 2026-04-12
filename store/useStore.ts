import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppUser, Match } from '../types';

// ─── Filtres de la liste des matchs ──────────────────────────────────────────

interface MatchFilters {
  type?: string;
  hasSpots?: boolean;
}

// ─── Coordonnées GPS ──────────────────────────────────────────────────────────

interface LatLon {
  latitude: number;
  longitude: number;
}

// ─── Store global Zustand ─────────────────────────────────────────────────────

interface AppState {
  // Utilisateur connecté (null = déconnecté)
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;

  // Liste des matchs chargés depuis Supabase
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  addMatch: (match: Match) => void;

  // Filtres actifs sur la liste
  filters: MatchFilters;
  setFilters: (filters: MatchFilters) => void;

  // Dernière localisation GPS connue
  userLocation: LatLon | null;
  setUserLocation: (loc: LatLon | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // ── Utilisateur ────────────────────────────────────────────────────────
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      // ── Matchs ─────────────────────────────────────────────────────────────
      matches: [],
      setMatches: (matches) => set({ matches }),
      addMatch: (match) => set((s) => ({ matches: [match, ...s.matches] })),

      // ── Filtres ────────────────────────────────────────────────────────────
      filters: { type: 'all' },
      setFilters: (filters) => set({ filters }),

      // ── Localisation ───────────────────────────────────────────────────────
      userLocation: null,
      setUserLocation: (loc) => set({ userLocation: loc }),
    }),
    {
      name: 'footmatch-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // On ne persiste que currentUser et filters.
      // Les matchs et la localisation sont rechargés à chaque démarrage.
      partialize: (state) => ({
        currentUser: state.currentUser,
        filters: state.filters,
      }),
    },
  ),
);
