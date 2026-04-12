import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, StatusBar, Platform, Modal,
  ActivityIndicator, RefreshControl, KeyboardAvoidingView,
  Pressable, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius } from '../constants/theme';
import type {
  Team, Cup, Championship, CompetitionFormat, WeeklyRankEntry,
} from '../types';
import { COMPETITION_FORMATS } from '../types';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  currentUserId: string;
  onOpenTeam: (team: Team) => void;
  onOpenChampionship: (c: Championship) => void;
  onOpenCup: (cup: Cup) => void;
}

type Section = 'teams' | 'championships' | 'cups' | 'ranking' | null;

// ─── Hub — 4 cartes 2×2 ──────────────────────────────────────────────────────

export default function CompetitionsScreen({
  currentUserId, onOpenTeam, onOpenChampionship, onOpenCup,
}: Props) {
  const [section, setSection] = useState<Section>(null);
  const [counts, setCounts] = useState({ teams: 0, championships: 0, cups: 0 });

  useEffect(() => {
    async function loadCounts() {
      const [t, c, cu] = await Promise.all([
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase.from('championships').select('id', { count: 'exact', head: true }),
        supabase.from('cups').select('id', { count: 'exact', head: true }),
      ]);
      setCounts({ teams: t.count ?? 0, championships: c.count ?? 0, cups: cu.count ?? 0 });
    }
    loadCounts();
  }, []);

  if (section === 'teams') {
    return (
      <TeamsSection
        currentUserId={currentUserId}
        onOpen={onOpenTeam}
        onBack={() => setSection(null)}
      />
    );
  }
  if (section === 'championships') {
    return (
      <ChampionshipsSection
        currentUserId={currentUserId}
        onOpen={onOpenChampionship}
        onBack={() => setSection(null)}
      />
    );
  }
  if (section === 'cups') {
    return (
      <CupsSection
        currentUserId={currentUserId}
        onOpen={onOpenCup}
        onBack={() => setSection(null)}
      />
    );
  }
  if (section === 'ranking') {
    return <RankingSection onBack={() => setSection(null)} />;
  }

  // ── Hub 2×2 ──────────────────────────────────────────────────────────────────
  return (
    <View style={hub.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={hub.header}>
        <Text style={hub.logo}>🏆 Compétitions</Text>
        <Text style={hub.sub}>Équipes · Championnats · Coupes · Classement</Text>
      </View>

      <View style={hub.grid}>
        {/* Équipes */}
        <TouchableOpacity
          style={[hub.card, { backgroundColor: Colors.greenDim, borderColor: Colors.green + '55' }]}
          onPress={() => setSection('teams')}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Section Équipes"
        >
          <Text style={hub.cardEmoji}>👥</Text>
          <Text style={hub.cardTitle}>Équipes</Text>
          <Text style={hub.cardSub}>Crée ou rejoins une équipe persistante</Text>
          <View style={hub.cardBadge}>
            <Text style={[hub.cardBadgeText, { color: Colors.green }]}>{counts.teams} équipe{counts.teams !== 1 ? 's' : ''}</Text>
          </View>
        </TouchableOpacity>

        {/* Championnats */}
        <TouchableOpacity
          style={[hub.card, { backgroundColor: 'rgba(185,246,202,0.06)', borderColor: Colors.greenLight + '40' }]}
          onPress={() => setSection('championships')}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Section Championnats"
        >
          <Text style={hub.cardEmoji}>🏅</Text>
          <Text style={hub.cardTitle}>Championnats</Text>
          <Text style={hub.cardSub}>Ligue aller-retour, meilleure équipe gagne</Text>
          <View style={hub.cardBadge}>
            <Text style={[hub.cardBadgeText, { color: Colors.greenLight }]}>{counts.championships} championnat{counts.championships !== 1 ? 's' : ''}</Text>
          </View>
        </TouchableOpacity>

        {/* Coupes */}
        <TouchableOpacity
          style={[hub.card, { backgroundColor: 'rgba(255,215,0,0.07)', borderColor: '#FFD70055' }]}
          onPress={() => setSection('cups')}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Section Coupes"
        >
          <Text style={hub.cardEmoji}>🏆</Text>
          <Text style={hub.cardTitle}>Coupes</Text>
          <Text style={hub.cardSub}>Élimination directe 4 · 8 · 16 équipes</Text>
          <View style={hub.cardBadge}>
            <Text style={[hub.cardBadgeText, { color: '#FFD700' }]}>{counts.cups} coupe{counts.cups !== 1 ? 's' : ''}</Text>
          </View>
        </TouchableOpacity>

        {/* Classement */}
        <TouchableOpacity
          style={[hub.card, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }]}
          onPress={() => setSection('ranking')}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Section Classement national"
        >
          <Text style={hub.cardEmoji}>📊</Text>
          <Text style={hub.cardTitle}>Classement</Text>
          <Text style={hub.cardSub}>Ranking national hebdomadaire des équipes</Text>
          <View style={hub.cardBadge}>
            <Text style={[hub.cardBadgeText, { color: Colors.textMuted }]}>Cette semaine</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Hub styles ───────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const STATUS_H = Platform.OS === 'ios' ? 50 : 32;
const HEADER_H = 72;
const GRID_PADDING = 14;
const GRID_GAP = 10;
// Hauteur disponible = écran - barre status - header - nav bas - padding grille - gap
const CARD_H = Math.round((SCREEN_H - STATUS_H - HEADER_H - 80 - GRID_PADDING * 2 - GRID_GAP) / 2);
const CARD_W = Math.round((SCREEN_W - GRID_PADDING * 2 - GRID_GAP) / 2);

const hub = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: STATUS_H,
  },
  header: {
    height: HEADER_H,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    justifyContent: 'flex-end',
    gap: 4,
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  cardBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ÉQUIPES
// ═══════════════════════════════════════════════════════════════════════════════

type TeamWithLoc = Team & { captain?: { pseudo: string; avatar_id?: string; city?: string; postal_code?: string } };

function TeamsSection({ currentUserId, onOpen, onBack }: { currentUserId: string; onOpen: (t: Team) => void; onBack: () => void }) {
  const [teams, setTeams] = useState<TeamWithLoc[]>([]);
  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<'none' | 'create' | 'join'>('none');
  const [query, setQuery] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('⚽');
  const [format, setFormat] = useState<CompetitionFormat>('all');
  const [creating, setCreating] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data: memberRows } = await supabase.from('team_members').select('team_id').eq('user_id', currentUserId);
      const ids = new Set((memberRows ?? []).map((r: { team_id: string }) => r.team_id));
      setMyTeamIds(ids);
      const { data } = await supabase
        .from('teams')
        .select('*, captain:profiles!captain_id(pseudo,city,postal_code), members:team_members(count)')
        .order('created_at', { ascending: false })
        .limit(200);
      const rows = (data ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        member_count: Array.isArray(r.members) && r.members.length > 0 ? (r.members[0] as { count: number }).count : 0,
      }));
      setTeams(rows as TeamWithLoc[]);
    } finally { setLoading(false); setRefreshing(false); }
  }, [currentUserId]);

  const norm = (s?: string | null) => (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filtered = query.trim() === ''
    ? teams
    : teams.filter(t => {
        const q = norm(query);
        return norm(t.name).includes(q)
          || norm(t.captain?.city).includes(q)
          || norm(t.captain?.postal_code).includes(q);
      });

  useEffect(() => { load(); }, [load]);

  async function createTeam() {
    if (!name.trim()) { Alert.alert('Nom requis'); return; }
    setCreating(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data, error } = await supabase.from('teams')
        .insert({ name: name.trim(), captain_id: currentUserId, description: description.trim() || null, invite_code: code, badge_emoji: badge, preferred_format: format })
        .select().single();
      if (error) throw error;
      await supabase.from('team_members').insert({ team_id: data.id, user_id: currentUserId, role: 'captain' });
      setModal('none'); setName(''); setDescription(''); setBadge('⚽'); setFormat('all');
      load();
    } catch (e: unknown) { Alert.alert('Erreur', e instanceof Error ? e.message : String(e)); }
    finally { setCreating(false); }
  }

  async function joinTeam() {
    if (!inviteCode.trim()) { Alert.alert('Code requis'); return; }
    setJoining(true);
    try {
      const { data: team, error } = await supabase.from('teams').select('id, name').eq('invite_code', inviteCode.trim().toUpperCase()).single();
      if (error || !team) { Alert.alert('Code invalide', 'Aucune équipe trouvée.'); return; }
      const { error: joinErr } = await supabase.from('team_members').insert({ team_id: team.id, user_id: currentUserId, role: 'player' });
      if (joinErr) { if (joinErr.code === '23505') Alert.alert('Déjà membre'); else throw joinErr; return; }
      setModal('none'); setInviteCode('');
      Alert.alert('Bienvenue !', `Tu as rejoint ${team.name} !`);
      load();
    } catch (e: unknown) { Alert.alert('Erreur', e instanceof Error ? e.message : String(e)); }
    finally { setJoining(false); }
  }

  const BADGES = ['⚽', '🏆', '⚡', '🔥', '🦁', '🐺', '🦊', '🐯', '🦅', '🌟'];

  return (
    <View style={sec.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <SectionHeader title="Équipes" emoji="👥" onBack={onBack} />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Nom, ville, code postal..." />
      {loading
        ? <View style={sec.center}><ActivityIndicator color={Colors.green} size="large" /></View>
        : (
          <ScrollView showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.green} />}
            contentContainerStyle={{ paddingBottom: 100 }}>
            {query.trim() === '' && myTeamIds.size > 0 && (
              <View style={sec.section}>
                <Text style={sec.sectionTitle}>Mes équipes</Text>
                {filtered.filter(t => myTeamIds.has(t.id)).map(t => <TeamCard key={t.id} team={t} isMine onPress={() => onOpen(t)} />)}
              </View>
            )}
            <View style={sec.section}>
              {query.trim() === '' && <Text style={sec.sectionTitle}>Toutes les équipes</Text>}
              {filtered.filter(t => !myTeamIds.has(t.id)).length === 0 && filtered.filter(t => myTeamIds.has(t.id)).length === 0 && (
                <Text style={sec.empty}>{query.trim() ? 'Aucun résultat' : 'Aucune équipe — sois le premier !'}</Text>
              )}
              {filtered.filter(t => !myTeamIds.has(t.id)).map(t => <TeamCard key={t.id} team={t} isMine={false} onPress={() => onOpen(t)} />)}
            </View>
          </ScrollView>
        )}
      <View style={sec.fabGroup}>
        <TouchableOpacity style={sec.fabSecondary} onPress={() => setModal('join')} accessibilityRole="button" accessibilityLabel="Rejoindre une équipe">
          <Ionicons name="enter-outline" size={20} color={Colors.green} />
          <Text style={sec.fabSecondaryText}>Rejoindre</Text>
        </TouchableOpacity>
        <TouchableOpacity style={sec.fab} onPress={() => setModal('create')} accessibilityRole="button" accessibilityLabel="Créer une équipe">
          <Ionicons name="add" size={24} color={Colors.bg} />
          <Text style={sec.fabText}>Créer</Text>
        </TouchableOpacity>
      </View>

      <BottomSheet visible={modal === 'create'} onClose={() => setModal('none')} title="Créer une équipe">
        <Text style={sec.label}>Badge</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          {BADGES.map((b) => (
            <TouchableOpacity key={b} style={[sec.badgeBtn, badge === b && sec.badgeBtnActive]} onPress={() => setBadge(b)} accessibilityRole="button" accessibilityLabel={`Badge ${b}`}>
              <Text style={{ fontSize: 22 }}>{b}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={sec.label}>Nom *</Text>
        <TextInput style={sec.input} placeholder="Ex: Les Lions FC" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} maxLength={40} />
        <Text style={sec.label}>Description (optionnel)</Text>
        <TextInput style={[sec.input, { height: 70, textAlignVertical: 'top' }]} placeholder="Présente ton équipe..." placeholderTextColor={Colors.textMuted} value={description} onChangeText={setDescription} maxLength={200} multiline />
        <Text style={sec.label}>Format préféré (indicatif)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
          {(Object.keys(COMPETITION_FORMATS) as CompetitionFormat[]).map((f) => {
            const fmt = COMPETITION_FORMATS[f];
            return (
              <TouchableOpacity key={f} style={[sec.formatBtn, format === f && sec.formatBtnActive]} onPress={() => setFormat(f)} accessibilityRole="button" accessibilityLabel={`Format ${fmt.label}`}>
                <Text style={sec.formatEmoji}>{fmt.emoji}</Text>
                <Text style={[sec.formatLabel, format === f && { color: Colors.bg }]}>{fmt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={sec.hint}>Le format est indicatif — n'importe quel nombre de joueurs peut rejoindre.</Text>
        <TouchableOpacity style={[sec.btnPrimary, creating && { opacity: 0.6 }]} onPress={createTeam} disabled={creating} accessibilityRole="button" accessibilityLabel="Créer l'équipe">
          {creating ? <ActivityIndicator color={Colors.bg} size="small" /> : <Text style={sec.btnPrimaryText}>Créer l'équipe</Text>}
        </TouchableOpacity>
      </BottomSheet>

      <BottomSheet visible={modal === 'join'} onClose={() => setModal('none')} title="Rejoindre une équipe">
        <Text style={sec.label}>Code d'invitation</Text>
        <TextInput style={sec.input} placeholder="Ex: ABC123" placeholderTextColor={Colors.textMuted} value={inviteCode} onChangeText={setInviteCode} autoCapitalize="characters" maxLength={8} />
        <TouchableOpacity style={[sec.btnPrimary, joining && { opacity: 0.6 }]} onPress={joinTeam} disabled={joining} accessibilityRole="button" accessibilityLabel="Rejoindre">
          {joining ? <ActivityIndicator color={Colors.bg} size="small" /> : <Text style={sec.btnPrimaryText}>Rejoindre</Text>}
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
}

function TeamCard({ team, isMine, onPress }: { team: Team; isMine: boolean; onPress: () => void }) {
  const fmt = COMPETITION_FORMATS[team.preferred_format];
  const total = team.wins + team.draws + team.losses;
  return (
    <TouchableOpacity style={[sec.card, isMine && sec.cardMine]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Équipe ${team.name}`}>
      <View style={sec.cardRow}>
        <Text style={sec.teamBadge}>{team.badge_emoji}</Text>
        <View style={sec.cardInfo}>
          <View style={sec.cardNameRow}>
            <Text style={sec.teamName}>{team.name}</Text>
            {isMine && <View style={sec.mineBadge}><Text style={sec.mineBadgeText}>Ma team</Text></View>}
          </View>
          <Text style={sec.cardSub}>{fmt.emoji} {fmt.label} · {team.member_count ?? 0} joueur{(team.member_count ?? 0) !== 1 ? 's' : ''}</Text>
          {total > 0 && <Text style={sec.cardRecord}>{team.wins}V · {team.draws}N · {team.losses}D</Text>}
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION CHAMPIONNATS
// ═══════════════════════════════════════════════════════════════════════════════

function ChampionshipsSection({ currentUserId, onOpen, onBack }: { currentUserId: string; onOpen: (c: Championship) => void; onBack: () => void }) {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<'none' | 'create' | 'join'>('none');
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxTeams, setMaxTeams] = useState(8);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await supabase.from('championships')
        .select('*, organizer:profiles!organizer_id(pseudo), team_count:championship_teams(count)')
        .order('created_at', { ascending: false }).limit(200);
      const rows = (data ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        team_count: Array.isArray(r.team_count) && r.team_count.length > 0 ? (r.team_count[0] as { count: number }).count : 0,
      }));
      setChampionships(rows as Championship[]);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const norm = (s?: string | null) => (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = query.trim() === '' ? championships : championships.filter(c => norm(c.name).includes(norm(query)));

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!name.trim()) { Alert.alert('Nom requis'); return; }
    setCreating(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from('championships').insert({ name: name.trim(), organizer_id: currentUserId, description: description.trim() || null, max_teams: maxTeams, join_code: code });
      if (error) throw error;
      setModal('none'); setName(''); setDescription(''); setMaxTeams(8); load();
    } catch (e: unknown) { Alert.alert('Erreur', e instanceof Error ? e.message : String(e)); }
    finally { setCreating(false); }
  }

  async function join() {
    if (!joinCode.trim()) { Alert.alert('Code requis'); return; }
    setJoining(true);
    try {
      const { data: champ, error } = await supabase.from('championships').select('id,name,organizer_id,max_teams,status,join_code').eq('join_code', joinCode.trim().toUpperCase()).single();
      if (error || !champ) { Alert.alert('Code invalide'); return; }
      setModal('none'); setJoinCode(''); onOpen(champ as Championship);
    } catch (e: unknown) { Alert.alert('Erreur', e instanceof Error ? e.message : String(e)); }
    finally { setJoining(false); }
  }

  const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
    registration: { label: 'Inscriptions', color: Colors.greenLight, bg: 'rgba(185,246,202,0.12)' },
    active:       { label: 'En cours',     color: Colors.green,      bg: Colors.greenDim },
    finished:     { label: 'Terminé',      color: Colors.textMuted,  bg: 'rgba(255,255,255,0.06)' },
  };
  const MAX_OPTIONS = [4, 6, 8, 10, 12, 16];

  return (
    <View style={sec.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <SectionHeader title="Championnats" emoji="🏅" onBack={onBack} />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Rechercher par nom..." />
      {loading
        ? <View style={sec.center}><ActivityIndicator color={Colors.green} size="large" /></View>
        : (
          <ScrollView showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.green} />}
            contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={sec.section}>
              {filtered.length === 0 && <Text style={sec.empty}>{query.trim() ? 'Aucun résultat' : 'Aucun championnat — crée le premier !'}</Text>}
              {filtered.map((c) => {
                const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.registration;
                return (
                  <TouchableOpacity key={c.id} style={sec.card} onPress={() => onOpen(c)} accessibilityRole="button" accessibilityLabel={`Championnat ${c.name}`}>
                    <View style={sec.cardRow}>
                      <View style={sec.champIcon}><Ionicons name="trophy" size={20} color={Colors.green} /></View>
                      <View style={sec.cardInfo}>
                        <View style={sec.cardNameRow}>
                          <Text style={sec.teamName}>{c.name}</Text>
                          <View style={[sec.statusBadge, { backgroundColor: badge.bg }]}><Text style={[sec.statusText, { color: badge.color }]}>{badge.label}</Text></View>
                        </View>
                        <Text style={sec.cardSub}>{c.team_count ?? 0}/{c.max_teams} équipes · {c.organizer?.pseudo ?? '?'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      <View style={sec.fabGroup}>
        <TouchableOpacity style={sec.fabSecondary} onPress={() => setModal('join')} accessibilityRole="button" accessibilityLabel="Rejoindre un championnat">
          <Ionicons name="enter-outline" size={20} color={Colors.green} />
          <Text style={sec.fabSecondaryText}>Rejoindre</Text>
        </TouchableOpacity>
        <TouchableOpacity style={sec.fab} onPress={() => setModal('create')} accessibilityRole="button" accessibilityLabel="Créer un championnat">
          <Ionicons name="add" size={24} color={Colors.bg} />
          <Text style={sec.fabText}>Créer</Text>
        </TouchableOpacity>
      </View>

      <BottomSheet visible={modal === 'create'} onClose={() => setModal('none')} title="Créer un championnat">
        <Text style={sec.label}>Nom *</Text>
        <TextInput style={sec.input} placeholder="Ex: Ligue du Quartier" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} maxLength={50} />
        <Text style={sec.label}>Description (optionnel)</Text>
        <TextInput style={[sec.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Décris le championnat..." placeholderTextColor={Colors.textMuted} value={description} onChangeText={setDescription} multiline maxLength={200} />
        <Text style={sec.label}>Nombre max d'équipes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          {MAX_OPTIONS.map((n) => (
            <TouchableOpacity key={n} style={[sec.numBtn, maxTeams === n && sec.numBtnActive]} onPress={() => setMaxTeams(n)} accessibilityRole="button" accessibilityLabel={`${n} équipes`}>
              <Text style={[sec.numBtnText, maxTeams === n && { color: Colors.bg }]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={[sec.btnPrimary, creating && { opacity: 0.6 }]} onPress={create} disabled={creating} accessibilityRole="button" accessibilityLabel="Créer le championnat">
          {creating ? <ActivityIndicator color={Colors.bg} size="small" /> : <Text style={sec.btnPrimaryText}>Créer le championnat</Text>}
        </TouchableOpacity>
      </BottomSheet>

      <BottomSheet visible={modal === 'join'} onClose={() => setModal('none')} title="Rejoindre un championnat">
        <Text style={sec.label}>Code d'accès</Text>
        <TextInput style={sec.input} placeholder="Ex: XYZ789" placeholderTextColor={Colors.textMuted} value={joinCode} onChangeText={setJoinCode} autoCapitalize="characters" maxLength={8} />
        <TouchableOpacity style={[sec.btnPrimary, joining && { opacity: 0.6 }]} onPress={join} disabled={joining} accessibilityRole="button" accessibilityLabel="Rejoindre">
          {joining ? <ActivityIndicator color={Colors.bg} size="small" /> : <Text style={sec.btnPrimaryText}>Rejoindre</Text>}
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION COUPES
// ═══════════════════════════════════════════════════════════════════════════════

function CupsSection({ currentUserId, onOpen, onBack }: { currentUserId: string; onOpen: (c: Cup) => void; onBack: () => void }) {
  const [cups, setCups] = useState<Cup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<'none' | 'create' | 'join'>('none');
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxTeams, setMaxTeams] = useState<4 | 8 | 16>(8);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await supabase.from('cups')
        .select('*, organizer:profiles!organizer_id(pseudo), team_count:cup_teams(count)')
        .order('created_at', { ascending: false }).limit(200);
      const rows = (data ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        team_count: Array.isArray(r.team_count) && r.team_count.length > 0 ? (r.team_count[0] as { count: number }).count : 0,
      }));
      setCups(rows as Cup[]);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const norm = (s?: string | null) => (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = query.trim() === '' ? cups : cups.filter(c => norm(c.name).includes(norm(query)));

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!name.trim()) { Alert.alert('Nom requis'); return; }
    setCreating(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from('cups').insert({ name: name.trim(), organizer_id: currentUserId, description: description.trim() || null, max_teams: maxTeams, join_code: code });
      if (error) throw error;
      setModal('none'); setName(''); setDescription(''); setMaxTeams(8); load();
    } catch (e: unknown) { Alert.alert('Erreur', e instanceof Error ? e.message : String(e)); }
    finally { setCreating(false); }
  }

  async function join() {
    if (!joinCode.trim()) { Alert.alert('Code requis'); return; }
    setJoining(true);
    try {
      const { data: cup, error } = await supabase.from('cups').select('*').eq('join_code', joinCode.trim().toUpperCase()).single();
      if (error || !cup) { Alert.alert('Code invalide'); return; }
      setModal('none'); setJoinCode(''); onOpen(cup as Cup);
    } catch (e: unknown) { Alert.alert('Erreur', e instanceof Error ? e.message : String(e)); }
    finally { setJoining(false); }
  }

  const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
    registration: { label: 'Inscriptions', color: Colors.greenLight, bg: 'rgba(185,246,202,0.12)' },
    active:       { label: 'En cours',     color: Colors.green,      bg: Colors.greenDim },
    finished:     { label: 'Terminé',      color: Colors.textMuted,  bg: 'rgba(255,255,255,0.06)' },
  };
  const SIZE_OPTIONS: Array<4 | 8 | 16> = [4, 8, 16];

  return (
    <View style={sec.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <SectionHeader title="Coupes" emoji="🏆" onBack={onBack} />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Rechercher par nom..." />
      {loading
        ? <View style={sec.center}><ActivityIndicator color={Colors.green} size="large" /></View>
        : (
          <ScrollView showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.green} />}
            contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={sec.section}>
              {filtered.length === 0 && <Text style={sec.empty}>{query.trim() ? 'Aucun résultat' : 'Aucune coupe — organise-en une !'}</Text>}
              {filtered.map((c) => {
                const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.registration;
                return (
                  <TouchableOpacity key={c.id} style={sec.card} onPress={() => onOpen(c)} accessibilityRole="button" accessibilityLabel={`Coupe ${c.name}`}>
                    <View style={sec.cardRow}>
                      <View style={[sec.champIcon, { backgroundColor: 'rgba(255,215,0,0.10)' }]}><Ionicons name="ribbon" size={20} color="#FFD700" /></View>
                      <View style={sec.cardInfo}>
                        <View style={sec.cardNameRow}>
                          <Text style={sec.teamName}>{c.name}</Text>
                          <View style={[sec.statusBadge, { backgroundColor: badge.bg }]}><Text style={[sec.statusText, { color: badge.color }]}>{badge.label}</Text></View>
                        </View>
                        <Text style={sec.cardSub}>{c.team_count ?? 0}/{c.max_teams} équipes · {c.organizer?.pseudo ?? '?'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      <View style={sec.fabGroup}>
        <TouchableOpacity style={sec.fabSecondary} onPress={() => setModal('join')} accessibilityRole="button" accessibilityLabel="Rejoindre une coupe">
          <Ionicons name="enter-outline" size={20} color={Colors.green} />
          <Text style={sec.fabSecondaryText}>Rejoindre</Text>
        </TouchableOpacity>
        <TouchableOpacity style={sec.fab} onPress={() => setModal('create')} accessibilityRole="button" accessibilityLabel="Créer une coupe">
          <Ionicons name="add" size={24} color={Colors.bg} />
          <Text style={sec.fabText}>Créer</Text>
        </TouchableOpacity>
      </View>

      <BottomSheet visible={modal === 'create'} onClose={() => setModal('none')} title="Créer une coupe">
        <Text style={sec.label}>Nom *</Text>
        <TextInput style={sec.input} placeholder="Ex: Coupe de Printemps" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} maxLength={50} />
        <Text style={sec.label}>Description (optionnel)</Text>
        <TextInput style={[sec.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Présente la coupe..." placeholderTextColor={Colors.textMuted} value={description} onChangeText={setDescription} multiline maxLength={200} />
        <Text style={sec.label}>Nombre d'équipes</Text>
        <View style={sec.sizeRow}>
          {SIZE_OPTIONS.map((n) => (
            <TouchableOpacity key={n} style={[sec.sizeBtn, maxTeams === n && sec.sizeBtnActive]} onPress={() => setMaxTeams(n)} accessibilityRole="button" accessibilityLabel={`${n} équipes`}>
              <Text style={[sec.sizeBtnText, maxTeams === n && { color: Colors.bg }]}>{n}</Text>
              <Text style={[sec.sizeBtnSub, maxTeams === n && { color: Colors.bg }]}>{n === 4 ? 'Demi' : n === 8 ? 'Quarts' : '1/8'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[sec.btnPrimary, creating && { opacity: 0.6 }]} onPress={create} disabled={creating} accessibilityRole="button" accessibilityLabel="Créer la coupe">
          {creating ? <ActivityIndicator color={Colors.bg} size="small" /> : <Text style={sec.btnPrimaryText}>Créer la coupe</Text>}
        </TouchableOpacity>
      </BottomSheet>

      <BottomSheet visible={modal === 'join'} onClose={() => setModal('none')} title="Rejoindre une coupe">
        <Text style={sec.label}>Code d'accès</Text>
        <TextInput style={sec.input} placeholder="Ex: CUP123" placeholderTextColor={Colors.textMuted} value={joinCode} onChangeText={setJoinCode} autoCapitalize="characters" maxLength={8} />
        <TouchableOpacity style={[sec.btnPrimary, joining && { opacity: 0.6 }]} onPress={join} disabled={joining} accessibilityRole="button" accessibilityLabel="Rejoindre">
          {joining ? <ActivityIndicator color={Colors.bg} size="small" /> : <Text style={sec.btnPrimaryText}>Rejoindre</Text>}
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION CLASSEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function RankingSection({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<WeeklyRankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekLabel, setWeekLabel] = useState('');

  const getMonday = (d: Date): Date => {
    const day = d.getDay();
    const copy = new Date(d);
    const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
    copy.setDate(diff);
    return copy;
  };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const monday = getMonday(new Date());
      const weekStart = monday.toISOString().split('T')[0];
      setWeekLabel(monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));

      const { data: snap } = await supabase
        .from('weekly_ranking_snapshots')
        .select('*, team:teams!team_id(id,name,badge_emoji,captain_id,captain:profiles!captain_id(pseudo))')
        .eq('week_start', weekStart).order('rank', { ascending: true }).limit(100);

      if (snap && snap.length > 0) { setEntries(snap as WeeklyRankEntry[]); return; }

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 7);
      const weekEnd = sunday.toISOString().split('T')[0];
      const { data: challenges } = await supabase.from('team_challenges')
        .select('challenger_id, challenged_id, home_score, away_score, status')
        .eq('status', 'played').gte('created_at', weekStart).lt('created_at', weekEnd);

      if (!challenges || challenges.length === 0) { setEntries([]); return; }

      const stats: Record<string, { wins: number; draws: number; losses: number; gf: number; ga: number }> = {};
      const ensure = (id: string) => { if (!stats[id]) stats[id] = { wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 }; };
      for (const ch of challenges) {
        const hs = ch.home_score ?? 0; const as_ = ch.away_score ?? 0;
        ensure(ch.challenger_id); ensure(ch.challenged_id);
        if (hs > as_) { stats[ch.challenger_id].wins += 1; stats[ch.challenged_id].losses += 1; }
        else if (hs < as_) { stats[ch.challenger_id].losses += 1; stats[ch.challenged_id].wins += 1; }
        else { stats[ch.challenger_id].draws += 1; stats[ch.challenged_id].draws += 1; }
        stats[ch.challenger_id].gf += hs; stats[ch.challenger_id].ga += as_;
        stats[ch.challenged_id].gf += as_; stats[ch.challenged_id].ga += hs;
      }
      const teamIds = Object.keys(stats);
      const { data: teamsData } = await supabase.from('teams').select('id,name,badge_emoji,captain_id,captain:profiles!captain_id(pseudo)').in('id', teamIds);
      const ranked = teamIds.map((tid) => { const s = stats[tid]; const pts = s.wins * 3 + s.draws; return { team_id: tid, ...s, points: pts }; })
        .sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga)).map((r, i) => ({ ...r, rank: i + 1 }));
      const teamMap = Object.fromEntries((teamsData ?? []).map((t: Record<string, unknown>) => [t.id, t]));
      const fullEntries: WeeklyRankEntry[] = ranked.map((r) => ({
        id: `${weekStart}-${r.team_id}`, week_start: weekStart, goals_for: r.gf, goals_against: r.ga, ...r,
        team: teamMap[r.team_id] as WeeklyRankEntry['team'],
      }));
      setEntries(fullEntries);
      const upsertRows = fullEntries.map((e) => ({ week_start: weekStart, team_id: e.team_id, rank: e.rank, points: e.points, wins: e.wins, draws: e.draws, losses: e.losses, goals_for: e.goals_for, goals_against: e.goals_against }));
      await supabase.from('weekly_ranking_snapshots').upsert(upsertRows, { onConflict: 'week_start,team_id' });
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const MEDALS = ['🥇', '🥈', '🥉'] as const;
  const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'] as const;
  const PODEST_H = [110, 80, 65] as const;

  return (
    <View style={sec.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <SectionHeader title="Classement" emoji="📊" onBack={onBack} />
      {loading
        ? <View style={sec.center}><ActivityIndicator color={Colors.green} size="large" /></View>
        : (
          <ScrollView showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.green} />}
            contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={sec.section}>
              <Text style={sec.weekLabel}>Semaine du {weekLabel}</Text>
              {entries.length === 0 && (
                <View style={sec.emptyBox}>
                  <Ionicons name="bar-chart-outline" size={40} color={Colors.textMuted} />
                  <Text style={sec.empty}>Aucun match joué cette semaine</Text>
                  <Text style={sec.emptySub}>Défiez d'autres équipes pour apparaître ici !</Text>
                </View>
              )}
              {podium.length > 0 && (
                <View style={sec.podiumRow}>
                  {[1, 0, 2].map((idx) => {
                    const e = podium[idx];
                    if (!e) return null;
                    const isFirst = idx === 0;
                    return (
                      <View key={e.id} style={[sec.podiumCard, isFirst && { marginBottom: 0 }]}>
                        <Text style={{ fontSize: 20, marginBottom: 2 }}>{MEDALS[idx]}</Text>
                        <Text style={{ fontSize: 26, marginBottom: 2 }}>{e.team?.badge_emoji ?? '⚽'}</Text>
                        <Text style={[sec.podiumName, isFirst && { fontSize: 13 }]} numberOfLines={2}>{e.team?.name ?? '—'}</Text>
                        <Text style={[sec.podiumPts, { color: MEDAL_COLORS[idx] }]}>{e.points} pts</Text>
                        <View style={[sec.podiumPodest, { height: PODEST_H[idx], borderTopColor: MEDAL_COLORS[idx], backgroundColor: MEDAL_COLORS[idx] + '18' }]} />
                      </View>
                    );
                  })}
                </View>
              )}
              {rest.map((e) => (
                <View key={e.id} style={sec.rankRow}>
                  <Text style={sec.rankNum}>{e.rank}</Text>
                  <Text style={sec.rankBadge}>{e.team?.badge_emoji ?? '⚽'}</Text>
                  <View style={sec.rankInfo}>
                    <Text style={sec.rankName}>{e.team?.name ?? '—'}</Text>
                    <Text style={sec.rankSub}>{e.wins}V {e.draws}N {e.losses}D · {e.goals_for}-{e.goals_against}</Text>
                  </View>
                  <View style={sec.rankPts}>
                    <Text style={sec.rankPtsNum}>{e.points}</Text>
                    <Text style={sec.rankPtsSub}>pts</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder: string }) {
  return (
    <View style={sec.searchWrap}>
      <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginLeft: Spacing.md }} />
      <TextInput
        style={sec.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={{ paddingHorizontal: Spacing.sm }} accessibilityRole="button" accessibilityLabel="Effacer la recherche">
          <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function SectionHeader({ title, emoji, onBack }: { title: string; emoji: string; onBack: () => void }) {
  return (
    <View style={sec.sectionHdr}>
      <TouchableOpacity onPress={onBack} style={sec.backBtn} accessibilityRole="button" accessibilityLabel="Retour aux compétitions">
        <Ionicons name="arrow-back" size={22} color={Colors.text} />
      </TouchableOpacity>
      <Text style={sec.sectionHdrEmoji}>{emoji}</Text>
      <Text style={sec.sectionHdrTitle}>{title}</Text>
    </View>
  );
}

function BottomSheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sec.overlay} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={sec.sheet}>
          <Pressable onPress={() => {}} accessibilityRole="none">
            <View style={sec.sheetHandle} />
            <Text style={sec.sheetTitle}>{title}</Text>
            {children}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const sec = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight ?? 0) + 8 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: Spacing.md, backgroundColor: Colors.bg3, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, height: 40 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingHorizontal: Spacing.sm, height: 40 },
  sectionHdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, gap: Spacing.sm },
  backBtn: { width: 38, height: 38, borderRadius: Radius.full, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  sectionHdrEmoji: { fontSize: 22 },
  sectionHdrTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.green, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.sm },
  empty: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: Spacing.xl },
  emptySub: { color: Colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 4 },
  emptyBox: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  card: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderSubtle, marginBottom: Spacing.sm, padding: Spacing.md },
  cardMine: { borderColor: Colors.greenBorder, backgroundColor: Colors.greenDim },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  teamBadge: { fontSize: 28, width: 40, textAlign: 'center' },
  cardInfo: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  teamName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.textMuted },
  cardRecord: { fontSize: 12, color: Colors.greenLight },
  mineBadge: { backgroundColor: Colors.greenDim, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  mineBadgeText: { fontSize: 10, color: Colors.green, fontWeight: '600' },
  champIcon: { width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.greenDim, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '600' },
  fabGroup: { position: 'absolute', bottom: 16, right: Spacing.xl, flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  fab: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.green, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 12, elevation: 4, shadowColor: Colors.green, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8 },
  fabText: { color: Colors.bg, fontWeight: '700', fontSize: 14 },
  fabSecondary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.card, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 12, borderWidth: 1, borderColor: Colors.greenBorder },
  fabSecondaryText: { color: Colors.green, fontWeight: '600', fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.bg2, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl, maxHeight: '90%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderSubtle, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: Colors.bg3, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, color: Colors.text, fontSize: 15, padding: Spacing.md, marginBottom: Spacing.md },
  hint: { fontSize: 11, color: Colors.textMuted, marginBottom: Spacing.lg, fontStyle: 'italic' },
  badgeBtn: { width: 44, height: 44, borderRadius: Radius.sm, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: Colors.bg3 },
  badgeBtnActive: { borderColor: Colors.green },
  formatBtn: { alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg3, marginRight: Spacing.sm, minWidth: 70 },
  formatBtnActive: { backgroundColor: Colors.green, borderColor: Colors.green },
  formatEmoji: { fontSize: 16, marginBottom: 2 },
  formatLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  numBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg3, marginRight: Spacing.sm },
  numBtnActive: { backgroundColor: Colors.green, borderColor: Colors.green },
  numBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textMuted },
  sizeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  sizeBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg3, alignItems: 'center' },
  sizeBtnActive: { backgroundColor: Colors.green, borderColor: Colors.green },
  sizeBtnText: { fontSize: 20, fontWeight: '700', color: Colors.textMuted },
  sizeBtnSub: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  btnPrimary: { backgroundColor: Colors.green, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  btnPrimaryText: { color: Colors.bg, fontWeight: '700', fontSize: 15 },
  weekLabel: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl },
  podiumRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.xl, paddingHorizontal: Spacing.md },
  podiumCard: { flex: 1, alignItems: 'center', maxWidth: 110 },
  podiumName: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 4 },
  podiumPts: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  podiumPodest: { width: '100%', borderTopWidth: 3, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: Spacing.sm },
  rankNum: { width: 24, fontSize: 13, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' },
  rankBadge: { fontSize: 20, width: 30, textAlign: 'center' },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  rankSub: { fontSize: 11, color: Colors.textMuted },
  rankPts: { alignItems: 'center' },
  rankPtsNum: { fontSize: 16, fontWeight: '700', color: Colors.green },
  rankPtsSub: { fontSize: 10, color: Colors.textMuted },
});
