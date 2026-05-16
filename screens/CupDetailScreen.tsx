import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, StatusBar, Platform, Modal,
  ActivityIndicator, KeyboardAvoidingView, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius } from '../constants/theme';
import type { Cup, CupTeam, CupMatch } from '../types';

interface Props {
  cup: Cup;
  currentUserId: string;
  onBack: () => void;
}

export default function CupDetailScreen({ cup, currentUserId, onBack }: Props) {
  const [tab, setTab] = useState<'bracket' | 'teams'>('bracket');
  const [teams, setTeams] = useState<CupTeam[]>([]);
  const [matches, setMatches] = useState<CupMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);

  // Register team modal
  const [regModal, setRegModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [registering, setRegistering] = useState(false);

  // Score modal
  const [scoreModal, setScoreModal] = useState<CupMatch | null>(null);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [savingScore, setSavingScore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsRes, matchesRes] = await Promise.all([
        supabase
          .from('cup_teams')
          .select('*, captain:profiles!captain_id(pseudo)')
          .eq('cup_id', cup.id)
          .order('seed', { ascending: true, nullsFirst: false }),
        supabase
          .from('cup_matches')
          .select('*, home_team:cup_teams!home_team_id(id,name), away_team:cup_teams!away_team_id(id,name), winner:cup_teams!winner_id(id,name)')
          .eq('cup_id', cup.id)
          .order('round', { ascending: false })
          .order('match_number', { ascending: true }),
      ]);
      setTeams((teamsRes.data ?? []) as CupTeam[]);
      setMatches((matchesRes.data ?? []) as CupMatch[]);
      setIsOrganizer(cup.organizer_id === currentUserId);
    } finally {
      setLoading(false);
    }
  }, [cup.id, cup.organizer_id, currentUserId]);

  useEffect(() => { load(); }, [load]);

  async function registerTeam() {
    if (!teamName.trim()) { Alert.alert('Nom requis'); return; }
    if (teams.length >= cup.max_teams) {
      Alert.alert('Complet', 'Le nombre maximum d\'équipes est atteint.');
      return;
    }
    setRegistering(true);
    try {
      const { error } = await supabase.from('cup_teams').insert({
        cup_id: cup.id,
        name: teamName.trim(),
        captain_id: currentUserId,
      });
      if (error) {
        if (error.code === '23505') Alert.alert('Déjà inscrit', 'Tu as déjà une équipe dans cette coupe.');
        else throw error;
        return;
      }
      setRegModal(false);
      setTeamName('');
      load();
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    } finally {
      setRegistering(false);
    }
  }

  async function startCup() {
    if (teams.length < 4) { Alert.alert('Minimum 4 équipes requises pour démarrer.'); return; }
    const n = teams.length;
    const validSizes = [4, 8, 16];
    const size = validSizes.find(s => s >= n) ?? 16;

    Alert.alert('Démarrer la coupe', `Générer le bracket pour ${size} équipes ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Démarrer', onPress: () => generateBracket(size) },
    ]);
  }

  async function generateBracket(size: number) {
    // Shuffle teams
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const round = Math.log2(size); // 4→2, 8→3, 16→4
    const matchCount = size / 2;
    const rows: {
      cup_id: string; round: number; match_number: number;
      home_team_id: string | null; away_team_id: string | null;
    }[] = [];

    for (let i = 0; i < matchCount; i += 1) {
      rows.push({
        cup_id: cup.id,
        round,
        match_number: i + 1,
        home_team_id: shuffled[i * 2]?.id ?? null,
        away_team_id: shuffled[i * 2 + 1]?.id ?? null,
      });
    }
    // Also generate empty slots for subsequent rounds
    let r = round - 1;
    let cnt = matchCount / 2;
    while (r >= 1) {
      for (let i = 0; i < cnt; i += 1) {
        rows.push({ cup_id: cup.id, round: r, match_number: i + 1, home_team_id: null, away_team_id: null });
      }
      cnt = Math.floor(cnt / 2);
      r -= 1;
    }

    try {
      const { error } = await supabase.from('cup_matches').insert(rows);
      if (error) throw error;
      await supabase.from('cups').update({ status: 'active' }).eq('id', cup.id);
      load();
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    }
  }

  async function saveScore() {
    if (!scoreModal) return;
    const hs = parseInt(homeScore, 10);
    const as_ = parseInt(awayScore, 10);
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0 || hs === as_) {
      Alert.alert('Score invalide', 'Les scores doivent être différents (pas de match nul dans une coupe).');
      return;
    }
    setSavingScore(true);
    try {
      const winnerId = hs > as_ ? scoreModal.home_team_id : scoreModal.away_team_id;
      await supabase.from('cup_matches').update({
        home_score: hs, away_score: as_, status: 'played', winner_id: winnerId,
      }).eq('id', scoreModal.id);

      // Advance winner to next round
      if (scoreModal.round > 1) {
        const nextRound = scoreModal.round - 1;
        const nextMatch = Math.ceil(scoreModal.match_number / 2);
        const isHome = scoreModal.match_number % 2 === 1;
        const field = isHome ? 'home_team_id' : 'away_team_id';
        await supabase.from('cup_matches')
          .update({ [field]: winnerId })
          .eq('cup_id', cup.id)
          .eq('round', nextRound)
          .eq('match_number', nextMatch);
      } else {
        // Final played — finish cup
        await supabase.from('cups').update({ status: 'finished' }).eq('id', cup.id);
      }

      setScoreModal(null);
      setHomeScore('');
      setAwayScore('');
      load();
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    } finally {
      setSavingScore(false);
    }
  }

  // Group matches by round (descending = huitième → demi → finale from left to right display)
  const maxRound = matches.length > 0 ? Math.max(...matches.map(m => m.round)) : 0;
  const rounds: CupMatch[][] = [];
  for (let r = maxRound; r >= 1; r -= 1) {
    const roundMatches = matches.filter(m => m.round === r).sort((a, b) => a.match_number - b.match_number);
    if (roundMatches.length > 0) rounds.push(roundMatches);
  }

  const ROUND_NAMES: Record<number, string> = { 1: 'Finale', 2: 'Demi-finales', 3: 'Quarts', 4: '1/8' };

  const statusBadge = cup.status === 'registration'
    ? { label: 'Inscriptions', color: Colors.greenLight, bg: 'rgba(185,246,202,0.12)' }
    : cup.status === 'active'
      ? { label: 'En cours', color: Colors.green, bg: Colors.greenDim }
      : { label: 'Terminé', color: Colors.textMuted, bg: 'rgba(255,255,255,0.06)' };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="ribbon" size={22} color="#FFD700" />
          <View style={{ flex: 1 }}>
            <Text style={styles.cupName} numberOfLines={1}>{cup.name}</Text>
            <View style={styles.cupMetaRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                <Text style={[styles.statusText, { color: statusBadge.color }]}>{statusBadge.label}</Text>
              </View>
              <Text style={styles.cupMeta}>{cup.max_teams} équipes max · organisé par {cup.organizer?.pseudo ?? '?'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Join code */}
      <View style={styles.codeRow}>
        <Ionicons name="key-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.codeLabel}>Code : </Text>
        <Text style={styles.codeValue}>{cup.join_code}</Text>
        <View style={styles.teamCountBadge}>
          <Text style={styles.teamCountText}>{teams.length}/{cup.max_teams}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['bracket', 'teams'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabPill, tab === t && styles.tabPillActive]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityLabel={t === 'bracket' ? 'Bracket' : 'Équipes'}
            accessibilityState={{ selected: tab === t }}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'bracket' ? 'Bracket' : 'Équipes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <View style={styles.center}><ActivityIndicator color={Colors.green} size="large" /></View>
        : (
          <>
            {tab === 'bracket' && (
              <View style={{ flex: 1 }}>
                {rounds.length === 0 ? (
                  <View style={styles.center}>
                    <Ionicons name="git-branch-outline" size={48} color={Colors.textMuted} style={{ marginBottom: Spacing.md }} />
                    <Text style={styles.emptyTitle}>Bracket non généré</Text>
                    {cup.status === 'registration' && (
                      <Text style={styles.emptySub}>
                        {teams.length < 4
                          ? `${4 - teams.length} équipes de plus pour démarrer`
                          : 'L\'organisateur peut lancer la coupe'}
                      </Text>
                    )}
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                      <View style={styles.bracketContainer}>
                        {rounds.map((roundMatches, ri) => {
                          const r = roundMatches[0]?.round ?? 0;
                          const roundName = ROUND_NAMES[r] ?? `Round ${r}`;
                          return (
                            <View key={r} style={styles.bracketCol}>
                              <Text style={styles.roundLabel}>{roundName}</Text>
                              <View style={styles.matchesCol}>
                                {roundMatches.map((m, mi) => {
                                  const canScore = isOrganizer && m.status !== 'played' && m.home_team_id !== null && m.away_team_id !== null;
                                  return (
                                    <TouchableOpacity
                                      key={m.id}
                                      style={[
                                        styles.matchSlot,
                                        m.status === 'played' && styles.matchSlotPlayed,
                                        mi > 0 && ri > 0 && { marginTop: Spacing['3xl'] },
                                      ]}
                                      onPress={() => {
                                        if (canScore) {
                                          setScoreModal(m);
                                          setHomeScore('');
                                          setAwayScore('');
                                        }
                                      }}
                                      disabled={!canScore}
                                      accessibilityRole="button"
                                      accessibilityLabel={`Match ${m.home_team?.name ?? 'TBD'} vs ${m.away_team?.name ?? 'TBD'}`}
                                    >
                                      <TeamSlot
                                        name={m.home_team?.name ?? null}
                                        score={m.status === 'played' ? m.home_score : null}
                                        isWinner={m.winner_id === m.home_team_id}
                                        played={m.status === 'played'}
                                      />
                                      <View style={styles.matchDivider} />
                                      <TeamSlot
                                        name={m.away_team?.name ?? null}
                                        score={m.status === 'played' ? m.away_score : null}
                                        isWinner={m.winner_id === m.away_team_id}
                                        played={m.status === 'played'}
                                      />
                                      {canScore && (
                                        <View style={styles.editHint}>
                                          <Ionicons name="pencil" size={10} color={Colors.green} />
                                        </View>
                                      )}
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </ScrollView>
                )}
              </View>
            )}

            {tab === 'teams' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.section}>
                  {teams.length === 0 && <Text style={styles.empty}>Aucune équipe inscrite</Text>}
                  {teams.map((t, i) => (
                    <View key={t.id} style={styles.teamRow}>
                      <Text style={styles.seedNum}>{t.seed ?? i + 1}</Text>
                      <View style={styles.teamInfo}>
                        <Text style={styles.teamName}>{t.name}</Text>
                        <Text style={styles.teamSub}>
                          {t.captain?.pseudo !== undefined ? `Cap. ${t.captain.pseudo}` : 'Pas de capitaine'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </>
        )}

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        {cup.status === 'registration' && !isOrganizer && (
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => setRegModal(true)}
            accessibilityRole="button"
            accessibilityLabel="S'inscrire à la coupe"
          >
            <Text style={styles.btnPrimaryText}>S'inscrire</Text>
          </TouchableOpacity>
        )}
        {cup.status === 'registration' && isOrganizer && teams.length >= 4 && matches.length === 0 && (
          <TouchableOpacity style={styles.btnPrimary} onPress={startCup} accessibilityRole="button" accessibilityLabel="Démarrer la coupe">
            <Ionicons name="play" size={16} color={Colors.bg} />
            <Text style={styles.btnPrimaryText}>Lancer la coupe</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Register team modal */}
      <Modal visible={regModal} transparent animationType="slide" onRequestClose={() => setRegModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setRegModal(false)} accessibilityRole="button" accessibilityLabel="Fermer">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
            <Pressable onPress={() => {}} accessibilityRole="none">
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>S'inscrire à la coupe</Text>
              <Text style={styles.label}>Nom de ton équipe *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Les Faucons"
                placeholderTextColor={Colors.textMuted}
                value={teamName}
                onChangeText={setTeamName}
                maxLength={40}
              />
              <TouchableOpacity
                style={[styles.btnPrimary, registering && { opacity: 0.6 }]}
                onPress={registerTeam}
                disabled={registering}
                accessibilityRole="button"
                accessibilityLabel="Confirmer l'inscription"
              >
                {registering
                  ? <ActivityIndicator color={Colors.bg} size="small" />
                  : <Text style={styles.btnPrimaryText}>Confirmer l'inscription</Text>}
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Score modal */}
      <Modal visible={!!scoreModal} transparent animationType="slide" onRequestClose={() => setScoreModal(null)}>
        <Pressable style={styles.overlay} onPress={() => setScoreModal(null)} accessibilityRole="button" accessibilityLabel="Fermer">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
            <Pressable onPress={() => {}} accessibilityRole="none">
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Saisir le score</Text>
              <Text style={styles.scoreHint}>Pas de match nul dans une coupe — un vainqueur est requis.</Text>
              <View style={styles.scoreInputRow}>
                <View style={styles.scoreTeamCol}>
                  <Text style={styles.scoreTeamName} numberOfLines={2}>
                    {scoreModal?.home_team?.name ?? 'TBD'}
                  </Text>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    value={homeScore}
                    onChangeText={setHomeScore}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <Text style={styles.scoreSep}>–</Text>
                <View style={styles.scoreTeamCol}>
                  <Text style={styles.scoreTeamName} numberOfLines={2}>
                    {scoreModal?.away_team?.name ?? 'TBD'}
                  </Text>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    value={awayScore}
                    onChangeText={setAwayScore}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.btnPrimary, savingScore && { opacity: 0.6 }]}
                onPress={saveScore}
                disabled={savingScore}
                accessibilityRole="button"
                accessibilityLabel="Valider le score"
              >
                {savingScore
                  ? <ActivityIndicator color={Colors.bg} size="small" />
                  : <Text style={styles.btnPrimaryText}>Valider le score</Text>}
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

function TeamSlot({ name, score, isWinner, played }: {
  name: string | null; score: number | null | undefined;
  isWinner: boolean; played: boolean;
}) {
  return (
    <View style={[slotStyles.row, isWinner && slotStyles.winner]}>
      <Text style={[slotStyles.name, isWinner && slotStyles.nameWinner]} numberOfLines={1}>
        {name ?? 'TBD'}
      </Text>
      {played && score !== null && score !== undefined && (
        <Text style={[slotStyles.score, isWinner && slotStyles.scoreWinner]}>{score}</Text>
      )}
    </View>
  );
}

const slotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    minHeight: 36,
  },
  winner: {
    backgroundColor: Colors.greenDim,
  },
  name: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  nameWinner: {
    color: Colors.green,
    fontWeight: '700',
  },
  score: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: Spacing.sm,
    minWidth: 20,
    textAlign: 'right',
  },
  scoreWinner: {
    color: Colors.green,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight ?? 0) + 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cupName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  cupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cupMeta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: 4,
  },
  codeLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  codeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.green,
    letterSpacing: 1,
    flex: 1,
  },
  teamCountBadge: {
    backgroundColor: Colors.bg3,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  teamCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tabPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tabPillActive: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textDim,
    textAlign: 'center',
  },
  empty: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },

  // Bracket
  bracketContainer: {
    flexDirection: 'row',
    padding: Spacing.xl,
    gap: Spacing.xl,
    alignItems: 'center',
  },
  bracketCol: {
    width: 150,
    alignItems: 'center',
  },
  roundLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.green,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  matchesCol: {
    width: '100%',
    gap: Spacing.md,
    justifyContent: 'center',
    flex: 1,
  },
  matchSlot: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  matchSlotPlayed: {
    borderColor: Colors.greenBorder,
  },
  matchDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  editHint: {
    position: 'absolute',
    top: 4,
    right: 4,
  },

  // Teams tab
  section: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  seedNum: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg3,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    overflow: 'hidden',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  teamSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.green,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  btnPrimaryText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg2,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderSubtle,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  scoreHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bg3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 15,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  scoreInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  scoreTeamCol: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreTeamName: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreInput: {
    width: '100%',
    backgroundColor: Colors.bg3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 32,
    fontWeight: '700',
    padding: Spacing.md,
    textAlign: 'center',
  },
  scoreSep: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 28,
  },
});
