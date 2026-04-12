// screens/PlayersScreen.tsx — FootMatch Joueurs v2 (simple + fakeData)
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { FAKE_PLAYERS, type FakePlayer, type Level } from '../data/fakeData';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  currentUserId:  string | null;
  blockedUserIds: string[];
  guestMode:      boolean;
  onInvite:       () => void;
  onShowGuestModal: () => void;
  onViewProfile:  (playerId: string) => void;
}

// ─── Config niveaux ───────────────────────────────────────────────────────────

const LEVEL_CFG: Record<Level, { label: string; color: string; bg: string; border: string }> = {
  D2: { label: 'D2 · Confirmé',  color: '#00E676', bg: 'rgba(0,230,118,0.12)',  border: 'rgba(0,230,118,0.35)'  },
  D3: { label: 'D3 · Interméd.', color: '#B9F6CA', bg: 'rgba(185,246,202,0.10)',border: 'rgba(185,246,202,0.30)' },
  D4: { label: 'D4 · Débutant',  color: '#5A7A5A', bg: 'rgba(90,122,90,0.12)',  border: 'rgba(90,122,90,0.30)'  },
};

const FILTERS: { key: 'all' | Level; label: string }[] = [
  { key: 'all', label: 'Tous'     },
  { key: 'D2',  label: '⚡ D2'   },
  { key: 'D3',  label: '🎯 D3'   },
  { key: 'D4',  label: '🌱 D4'   },
];

// Nombre de joueurs "actifs" affichés dans la bannière (fictif mais crédible)
const ACTIVE_COUNT = 12;

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PlayersScreen({
  currentUserId, blockedUserIds, guestMode, onInvite, onShowGuestModal, onViewProfile,
}: Props) {

  const [search,    setSearch]    = useState('');
  const [activeFilter, setFilter] = useState<'all' | Level>('all');

  // Filtre + recherche en mémoire — pas de Supabase
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAKE_PLAYERS
      .filter(p => p.id !== currentUserId)
      .filter(p => !blockedUserIds.includes(p.id))
      .filter(p => activeFilter === 'all' || p.level === activeFilter)
      .filter(p => {
        if (!q) return true;
        return (
          p.pseudo.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)   ||
          p.postalCode.includes(q)
        );
      })
      .sort((a, b) => b.reputation - a.reputation);
  }, [search, activeFilter, currentUserId, blockedUserIds]);

  // ── Rendu d'une carte joueur ───────────────────────────────────────────────
  function renderPlayer({ item }: { item: FakePlayer }) {
    const cfg   = LEVEL_CFG[item.level];
    const init  = (item.pseudo ?? '?')[0].toUpperCase();

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => onViewProfile(item.id)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`Voir le profil de ${item.pseudo}`}
      >
        {/* Barre de niveau à gauche */}
        <View style={[s.levelBar, { backgroundColor: cfg.color }]} />

        {/* Avatar initiale */}
        <View style={[s.avatar, { borderColor: cfg.color + '50' }]}>
          <Text style={[s.avatarText, { color: cfg.color }]}>{init}</Text>
        </View>

        {/* Infos */}
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
        </View>

        {/* Bouton Inviter */}
        <TouchableOpacity
          style={s.inviteBtn}
          onPress={guestMode ? onShowGuestModal : onInvite}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Inviter ${item.pseudo}`}
        >
          <Ionicons name="add-circle-outline" size={15} color={Colors.green} />
          <Text style={s.inviteText}>Inviter</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>

      {/* Bannière joueurs actifs */}
      <View style={s.activeBanner}>
        <View style={s.activeDot} />
        <Text style={s.activeBannerText}>
          <Text style={s.activeBannerCount}>{ACTIVE_COUNT}</Text>
          {' joueurs actifs maintenant à Perpignan'}
        </Text>
      </View>

      {/* Barre de recherche */}
      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
        <TextInput
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

      {/* Filtres niveau */}
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

      {/* Compteur */}
      <Text style={s.count}>
        {filtered.length} joueur{filtered.length !== 1 ? 's' : ''}
        {activeFilter !== 'all' ? ` · ${activeFilter}` : ''}
        {search ? ` · "${search}"` : ''}
      </Text>

      {/* Liste */}
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

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // ── Bannière active ──────────────────────────────────────────────────────────
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

  // ── Recherche ────────────────────────────────────────────────────────────────
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

  // ── Filtres ──────────────────────────────────────────────────────────────────
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

  // ── Compteur ─────────────────────────────────────────────────────────────────
  count: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: Spacing.xl,
    marginBottom: 8,
  },

  // ── Liste ────────────────────────────────────────────────────────────────────
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },

  // ── Carte joueur ─────────────────────────────────────────────────────────────
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

  // ── Bouton Inviter ────────────────────────────────────────────────────────────
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

  // ── Empty ─────────────────────────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptyText:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
