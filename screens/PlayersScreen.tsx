// screens/PlayersScreen.tsx — FootMatch Joueurs v3 (Supabase, seed unifié)
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, type TextInput as TextInputType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { fetchComputedStatsForUsers } from '../lib/playerStats';

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = 'D4' | 'D3' | 'D2';

interface Disponibilite {
  jour:  string;
  debut: string;
  fin:   string;
}

interface Player {
  id:               string;
  pseudo:           string;
  level:            Level;
  reputation:       number;
  city:             string;
  postalCode:       string;
  matchesPlayed:    number;
  disponibilites:   Disponibilite[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  currentUserId:    string | null;
  blockedUserIds:   string[];
  guestMode:        boolean;
  cityName?:        string;
  onInvite:         (playerId: string) => void;
  onShowGuestModal: () => void;
  onViewProfile:    (playerId: string) => void;
  /** Incrémenter ce compteur depuis le parent pour forcer le focus sur la barre de recherche */
  searchSignal?:    number;
}

// ─── Config niveaux ───────────────────────────────────────────────────────────

const LEVEL_CFG: Record<Level, { label: string; color: string; bg: string; border: string }> = {
  D2: { label: 'D2 · Confirmé',  color: '#00E676', bg: 'rgba(0,230,118,0.12)',  border: 'rgba(0,230,118,0.35)'  },
  D3: { label: 'D3 · Interméd.', color: '#B9F6CA', bg: 'rgba(185,246,202,0.10)',border: 'rgba(185,246,202,0.30)' },
  D4: { label: 'D4 · Débutant',  color: '#5A7A5A', bg: 'rgba(90,122,90,0.12)',  border: 'rgba(90,122,90,0.30)'  },
};

const FILTERS: { key: 'all' | Level; label: string }[] = [
  { key: 'all', label: 'Tous'   },
  { key: 'D2',  label: '🏆 D2' },
  { key: 'D3',  label: '⚽ D3' },
  { key: 'D4',  label: '🎽 D4' },
];

// Niveau brut → clé Level (D4 par défaut). Tolère anciennes valeurs FR si encore en base.
function normalizeLevel(raw: string | null | undefined): Level {
  if (raw === 'D2' || raw === 'D3' || raw === 'D4') return raw;
  if (raw === 'Confirmé' || raw === 'Pro' || raw === 'Légende') return 'D2';
  if (raw === 'Intermédiaire')                                   return 'D3';
  return 'D4';
}

// ─── Cache module-level (survit aux navigations) ──────────────────────────────

let _cachedPlayers: Player[] = [];
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export function getCachedPlayer(id: string) {
  return _cachedPlayers.find(p => p.id === id) ?? null;
}

/** Injecte des données minimales dans le cache si le joueur n'y est pas encore.
 *  Appelé avant de naviguer vers PlayerProfileScreen pour affichage instantané. */
export function seedPlayerCache(partial: { id: string; pseudo: string; reputation: number; matchesPlayed?: number }) {
  if (_cachedPlayers.find(p => p.id === partial.id)) return; // déjà en cache
  _cachedPlayers = [
    ..._cachedPlayers,
    {
      id:             partial.id,
      pseudo:         partial.pseudo,
      level:          'D4',
      reputation:     partial.reputation,
      city:           '',
      postalCode:     '',
      matchesPlayed:  partial.matchesPlayed ?? 0,
      disponibilites: [],
    },
  ];
}

export async function prefetchPlayers(): Promise<void> {
  if (_cachedPlayers.length > 0 && Date.now() - _cacheTime < CACHE_TTL) return;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, pseudo, level, reputation_score, city, postal_code, disponibilites')
    .order('reputation_score', { ascending: false })
    .limit(500);
  if (!data || error) return;
  const stats = await fetchComputedStatsForUsers(data.map((p: any) => p.id));
  _cachedPlayers = data.map((p: any) => ({
    id:             p.id,
    pseudo:         p.pseudo ?? 'Joueur',
    level:          normalizeLevel(p.level),
    reputation:     p.reputation_score ?? 0,
    city:           p.city ?? 'Perpignan',
    postalCode:     p.postal_code ?? '66000',
    matchesPlayed:  stats[p.id]?.matchesPlayed ?? 0,
    disponibilites: Array.isArray(p.disponibilites) ? p.disponibilites : [],
  }));
  _cacheTime = Date.now();
}

// ─── Composant ────────────────────────────────────────────────────────────────

/** Formate les disponibilités pour l'affichage compact dans la carte joueur */
function formatDispos(dispos: Disponibilite[]): string | null {
  if (!dispos || dispos.length === 0) return null;
  const first2 = dispos.slice(0, 2).map(d => `${d.jour} ${d.debut}-${d.fin}`).join(' · ');
  const extra  = dispos.length > 2 ? ` …+${dispos.length - 2}` : '';
  return first2 + extra;
}

export default function PlayersScreen({
  currentUserId, blockedUserIds, guestMode, cityName = 'Perpignan', onInvite, onShowGuestModal, onViewProfile, searchSignal,
}: Props) {

  const [players, setPlayers]     = useState<Player[]>(_cachedPlayers);
  const [loading, setLoading]     = useState(_cachedPlayers.length === 0);
  const [search,    setSearch]    = useState('');
  const [activeFilter, setFilter] = useState<'all' | Level>('all');
  const searchInputRef            = useRef<TextInputType>(null);

  // Quand le parent incrémente searchSignal, on focus la barre de recherche
  useEffect(() => {
    if (searchSignal && searchSignal > 0) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [searchSignal]);

  // ── Fetch profiles + stats Supabase ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cacheHit = _cachedPlayers.length > 0 && Date.now() - _cacheTime < CACHE_TTL;
      if (!cacheHit) setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, pseudo, level, reputation_score, city, postal_code, disponibilites')
        .order('reputation_score', { ascending: false })
        .limit(500);

      if (error || !data) { if (!cancelled && !cacheHit) { setPlayers([]); setLoading(false); } return; }

      const ids   = data.map(p => p.id);
      const stats = await fetchComputedStatsForUsers(ids);

      if (cancelled) return;

      const mapped: Player[] = data.map((p: any) => ({
        id:             p.id,
        pseudo:         p.pseudo ?? 'Joueur',
        level:          normalizeLevel(p.level),
        reputation:     p.reputation_score ?? 0,
        city:           p.city ?? 'Perpignan',
        postalCode:     p.postal_code ?? '66000',
        matchesPlayed:  stats[p.id]?.matchesPlayed ?? 0,
        disponibilites: Array.isArray(p.disponibilites) ? p.disponibilites : [],
      }));

      _cachedPlayers = mapped;
      _cacheTime = Date.now();
      setPlayers(mapped);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Filtre + recherche ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players
      .filter(p => !blockedUserIds.includes(p.id))
      .filter(p => activeFilter === 'all' || p.level === activeFilter)
      .filter(p => {
        if (!q) return true;
        return (
          p.pseudo.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)   ||
          p.postalCode.includes(q)
        );
      });
  }, [players, search, activeFilter, blockedUserIds]);

  const activeCount = players.length;

  // ── Rendu d'une carte joueur ───────────────────────────────────────────────
  function renderPlayer({ item }: { item: Player }) {
    const cfg       = LEVEL_CFG[item.level];
    const init      = (item.pseudo ?? '?')[0].toUpperCase();
    const dispoText = formatDispos(item.disponibilites);

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => onViewProfile(item.id)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`Voir le profil de ${item.pseudo}`}
      >
        <View style={[s.levelBar, { backgroundColor: cfg.color }]} />

        <View style={[s.avatar, { borderColor: cfg.color + '50' }]}>
          <Text style={[s.avatarText, { color: cfg.color }]}>{init}</Text>
        </View>

        <View style={s.info}>
          <Text style={s.pseudo} numberOfLines={1}>{item.pseudo}</Text>

          <View style={s.metaRow}>
            <View style={[s.levelBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              <Text style={[s.levelText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            {item.matchesPlayed > 0 && (
              <Text style={s.metaMuted}>{item.matchesPlayed} matchs</Text>
            )}
          </View>

          <View style={s.locRow}>
            <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
            <Text style={s.locText}>{item.city} · {item.postalCode}</Text>
          </View>

          {/* Disponibilités compactes */}
          <View style={s.dispoRow}>
            <Ionicons name="time-outline" size={10} color={dispoText ? Colors.green : Colors.textDim} />
            <Text
              style={[s.dispoText, !dispoText && s.dispoTextEmpty]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {dispoText ?? 'Disponibilités non renseignées'}
            </Text>
          </View>
        </View>

        {item.id !== currentUserId && (
          <TouchableOpacity
            style={s.inviteBtn}
            onPress={guestMode ? onShowGuestModal : () => onInvite(item.id)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Inviter ${item.pseudo}`}
          >
            <Ionicons name="add-circle-outline" size={15} color={Colors.green} />
            <Text style={s.inviteText}>Inviter</Text>
          </TouchableOpacity>
        )}
        {item.id === currentUserId && (
          <View style={s.meBadge}>
            <Text style={s.meText}>Moi</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>

      <View style={s.activeBanner}>
        <View style={s.activeDot} />
        <Text style={s.activeBannerText}>
          <Text style={s.activeBannerCount}>{activeCount}</Text>
          {` joueurs actifs autour de ${cityName}`}
        </Text>
      </View>

      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
        <TextInput
          ref={searchInputRef}
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Pseudo, ville, code postal…"
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Effacer la recherche">
            <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.filterRow}>
        {FILTERS.map(f => {
          const active = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={f.label}
              accessibilityState={{ selected: active }}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={s.count}>
        {filtered.length} joueur{filtered.length !== 1 ? 's' : ''}
        {activeFilter !== 'all' ? ` · ${activeFilter}` : ''}
        {search ? ` · "${search}"` : ''}
      </Text>

      {loading && players.length === 0 ? (
        <View style={s.empty}>
          <ActivityIndicator color={Colors.green} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          renderItem={renderPlayer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={s.emptyTitle}>Aucun joueur trouvé</Text>
              <Text style={s.emptyText}>
                {search ? `Aucun résultat pour "${search}"` : 'Essaie un autre filtre'}
              </Text>
            </View>
          }
        />
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: Spacing.xl,
    marginTop: 14,
    marginBottom: 2,
    backgroundColor: 'rgba(0,230,118,0.07)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  activeDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.green,
  },
  activeBannerText:  { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  activeBannerCount: { color: Colors.green, fontWeight: '800' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.xl,
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.xl,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.greenDim,
    borderColor: Colors.greenBorder,
  },
  chipText:       { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: Colors.green },

  count: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: Spacing.xl,
    marginBottom: 8,
  },

  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: Radius.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    paddingVertical: 10,
    paddingRight: 12,
    gap: 12,
  },
  levelBar: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginLeft: 0 },
  avatar: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  info: { flex: 1, gap: 3 },
  pseudo: { fontSize: 14, fontWeight: '700', color: Colors.text },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  levelText: { fontSize: 10, fontWeight: '700' },
  metaMuted: { fontSize: 11, color: Colors.textMuted },

  locRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText:  { fontSize: 11, color: Colors.textMuted },

  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.greenDim,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  inviteText: { fontSize: 11, fontWeight: '700', color: Colors.green },

  dispoRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dispoText:     { fontSize: 10, color: Colors.green, fontWeight: '600', flex: 1 },
  dispoTextEmpty:{ color: Colors.textDim },

  meBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.greenDim, borderWidth: 1, borderColor: Colors.green + '40' },
  meText:  { fontSize: 10, fontWeight: '700', color: Colors.green },

  count: { fontSize: 11, color: Colors.textMuted, marginHorizontal: Spacing.xl, marginBottom: 6, fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptyText:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
