import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, StatusBar, Platform, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius } from '../constants/theme';

interface Championship {
  id: string;
  name: string;
  organizer_id: string;
  max_teams: number;
  status: 'registration' | 'active' | 'finished';
  join_code: string;
  description?: string;
  created_at: string;
  organizer?: { pseudo: string };
  team_count?: number;
}

interface Props {
  currentUserId: string;
  onBack?: () => void;
  onOpen: (championship: Championship) => void;
}

function genCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const MAX_TEAMS_OPTIONS = [4, 6, 8, 10, 12, 16];

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  registration: { label: 'Inscriptions', color: Colors.greenLight, bg: 'rgba(0,230,118,0.10)' },
  active:       { label: 'En cours',     color: Colors.green,  bg: Colors.greenDim },
  finished:     { label: 'Terminé',      color: Colors.textMuted, bg: 'rgba(255,255,255,0.06)' },
};

export default function ChampionshipScreen({ currentUserId, onBack, onOpen }: Props) {
  const [view, setView] = useState<'list' | 'create' | 'join'>('list');
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Create form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxTeams, setMaxTeams] = useState(8);

  // Join form
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => { loadChampionships(); }, []);

  async function loadChampionships(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await supabase
        .from('championships')
        .select('*, organizer:profiles(pseudo), championship_teams(id)')
        .order('created_at', { ascending: false });

      if (!data) return;

      interface ChampionshipRow {
        id: string;
        name: string;
        organizer_id: string;
        max_teams: number;
        status: 'registration' | 'active' | 'finished';
        join_code: string;
        description?: string;
        created_at: string;
        organizer?: { pseudo: string };
        championship_teams?: { id: string }[];
      }
      setChampionships(
        (data as ChampionshipRow[])
          .filter((c) => c.organizer_id === currentUserId || String(c.organizer_id ?? '').startsWith('fa'))
          .map(c => ({
            ...c,
            team_count: c.championship_teams?.length ?? 0,
          }))
      );
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) { Alert.alert('Erreur', 'Donne un nom au championnat'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('championships')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          organizer_id: currentUserId,
          max_teams: maxTeams,
          status: 'registration',
          join_code: genCode(),
        })
        .select()
        .single();
      if (error) throw error;
      Alert.alert('Championnat créé !', `Code d'invitation : ${data.join_code}\nPartage-le à tes équipes !`);
      setName(''); setDescription(''); setMaxTeams(8);
      setView('list');
      loadChampionships();
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) { Alert.alert('Erreur', 'Entre le code d\'invitation'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('championships')
        .select('*')
        .eq('join_code', code)
        .single();
      if (error || !data) { Alert.alert('Code invalide', 'Vérifie le code et réessaie.'); return; }
      if (data.status !== 'registration') { Alert.alert('Inscriptions fermées', 'Ce championnat ne prend plus d\'équipes.'); return; }
      setJoinCode('');
      setView('list');
      onOpen(data);
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // ── CREATE VIEW ──
  if (view === 'create') {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
        <StatusBar barStyle="light-content" />
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('list')}><Ionicons name="chevron-back" size={22} color={Colors.green} /></TouchableOpacity>
          <Text style={s.headerTitle}>CRÉER UN CHAMPIONNAT</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={s.section}>
          <Text style={s.label}>Nom du championnat *</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Championnat du quartier 2026"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={s.section}>
          <Text style={s.label}>Description (optionnelle)</Text>
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Règles, lieu, fréquence des matchs..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </View>

        <View style={s.section}>
          <Text style={s.label}>Nombre d'équipes maximum</Text>
          <View style={s.teamsRow}>
            {MAX_TEAMS_OPTIONS.map(n => (
              <TouchableOpacity
                key={n}
                style={[s.teamBtn, maxTeams === n && s.teamBtnActive]}
                onPress={() => setMaxTeams(n)}
              >
                <Text style={[s.teamBtnText, maxTeams === n && s.teamBtnTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.infoBox}>
          <Text style={s.infoText}>
            📋 Format : Ligue (aller-retour){'\n'}
            📅 {maxTeams * (maxTeams - 1)} matchs au total · {maxTeams - 1} journées{'\n'}
            🔑 Un code d'invitation sera généré pour inviter les équipes
          </Text>
        </View>

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={s.btnText}>{loading ? 'Création...' : '🏆 Créer le championnat'}</Text>
        </TouchableOpacity>
        <View style={{ height: 60 }} />
      </ScrollView>
    );
  }

  // ── JOIN VIEW ──
  if (view === 'join') {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('list')}><Ionicons name="chevron-back" size={22} color={Colors.green} /></TouchableOpacity>
          <Text style={s.headerTitle}>REJOINDRE</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={s.pad}>
          <Text style={s.joinEmoji}>🔑</Text>
          <Text style={s.joinTitle}>Code d'invitation</Text>
          <Text style={s.joinSub}>Demande le code à l'organisateur du championnat</Text>
          <TextInput
            style={[s.input, s.codeInput]}
            value={joinCode}
            onChangeText={t => setJoinCode(t.toUpperCase())}
            placeholder="EX: A3B7CX"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            maxLength={8}
          />
          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleJoin} disabled={loading}>
            <Text style={s.btnText}>{loading ? 'Recherche...' : 'Rejoindre →'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── LIST VIEW ──
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        {onBack && <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={22} color={Colors.green} /></TouchableOpacity>}
        <Text style={s.headerTitle}>CHAMPIONNATS</Text>
        <TouchableOpacity onPress={() => setView('join')}><Text style={s.joinBtn}>🔑 Rejoindre</Text></TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadChampionships(true)} tintColor={Colors.green} />}
      >
        {initialLoading && (
          <View style={{ alignItems: 'center', paddingTop: 80, gap: 12 }}>
            <ActivityIndicator color={Colors.green} size="large" />
            <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Chargement des championnats...</Text>
          </View>
        )}
        {!initialLoading && championships.length === 0 && !refreshing && (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🏆</Text>
            <Text style={s.emptyTitle}>Aucun championnat</Text>
            <Text style={s.emptyText}>Crée le premier ou rejoins-en un avec un code !</Text>
          </View>
        )}
        {championships.map(c => {
          const stCfg = STATUS_LABEL[c.status];
          const isOrganizer = c.organizer_id === currentUserId;
          return (
            <TouchableOpacity key={c.id} style={s.card} onPress={() => onOpen(c)} activeOpacity={0.85}>
              <View style={s.cardTop}>
                <View style={[s.statusBadge, { backgroundColor: stCfg.bg }]}>
                  <Text style={[s.statusText, { color: stCfg.color }]}>{stCfg.label}</Text>
                </View>
                {isOrganizer && (
                  <View style={s.orgBadge}><Text style={s.orgBadgeText}>👑 Organisateur</Text></View>
                )}
              </View>
              <Text style={s.cardName}>{c.name}</Text>
              {c.description && <Text style={s.cardDesc} numberOfLines={2}>{c.description}</Text>}
              <View style={s.cardFooter}>
                <Text style={s.cardMeta}>🏟️ {c.team_count}/{c.max_teams} équipes</Text>
                <Text style={s.cardCode}>Code : <Text style={s.cardCodeVal}>{c.join_code}</Text></Text>
              </View>
              {c.status === 'registration' && (
                <View style={s.progressBg}>
                  <View style={[s.progressFill, { width: `${((c.team_count ?? 0) / c.max_teams) * 100}%` as `${number}%` }]} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setView('create')} activeOpacity={0.85}>
        <Ionicons name="add" size={22} color="#000" /><Text style={s.fabText}>Créer</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bg },
  pad:             { padding: Spacing.xl },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:     { fontSize: 15, fontWeight: '900', color: Colors.text, letterSpacing: 1.5 },
  back:            { color: Colors.green, fontSize: 15, fontWeight: '600', minWidth: 60 },
  joinBtn:         { color: Colors.greenLight, fontSize: 13, fontWeight: '700' },

  section:         { marginBottom: Spacing.lg },
  label:           { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:           { backgroundColor: Colors.bg2, borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.text, borderWidth: 1.5, borderColor: Colors.border },
  teamsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  teamBtn:         { paddingHorizontal: 18, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg2 },
  teamBtnActive:   { borderColor: Colors.green, backgroundColor: Colors.greenDim },
  teamBtnText:     { fontSize: 16, fontWeight: '800', color: Colors.textMuted },
  teamBtnTextActive:{ color: Colors.green },
  infoBox:         { backgroundColor: Colors.bg2, borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  infoText:        { fontSize: 13, color: Colors.textMuted, lineHeight: 22 },
  btn:             { backgroundColor: Colors.green, borderRadius: Radius.full, padding: 16, alignItems: 'center' },
  btnDisabled:     { opacity: 0.5 },
  btnText:         { fontSize: 16, fontWeight: '900', color: '#000' },

  // Join
  joinEmoji:       { fontSize: 56, textAlign: 'center', marginTop: 32, marginBottom: 12 },
  joinTitle:       { fontSize: 22, fontWeight: '900', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  joinSub:         { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  codeInput:       { textAlign: 'center', fontSize: 24, fontWeight: '900', letterSpacing: 8, marginBottom: 24 },

  // Cards
  card:            { marginHorizontal: Spacing.xl, marginBottom: 14, backgroundColor: Colors.bg2, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  cardTop:         { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  statusBadge:     { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusText:      { fontSize: 11, fontWeight: '700' },
  orgBadge:        { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'rgba(0,230,118,0.10)' },
  orgBadgeText:    { fontSize: 11, fontWeight: '700', color: Colors.greenLight },
  cardName:        { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  cardDesc:        { fontSize: 13, color: Colors.textMuted, marginBottom: 10, lineHeight: 18 },
  cardFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  cardMeta:        { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  cardCode:        { fontSize: 12, color: Colors.textMuted },
  cardCodeVal:     { color: Colors.green, fontWeight: '900', letterSpacing: 2 },
  progressBg:      { height: 3, backgroundColor: Colors.bg3, borderRadius: 2, marginTop: 12, overflow: 'hidden' },
  progressFill:    { height: 3, backgroundColor: Colors.green, borderRadius: 2 },

  // Empty
  empty:           { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji:      { fontSize: 56, marginBottom: 16 },
  emptyTitle:      { fontSize: 20, fontWeight: '900', color: Colors.text, marginBottom: 8 },
  emptyText:       { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  // FAB
  fab:             { position: 'absolute', bottom: 32, right: 24, backgroundColor: Colors.green, borderRadius: Radius.full, paddingHorizontal: 24, paddingVertical: 14, shadowColor: Colors.green, shadowRadius: 12, shadowOpacity: 0.5, elevation: 8 },
  fabText:         { fontSize: 15, fontWeight: '900', color: '#000' },
});
