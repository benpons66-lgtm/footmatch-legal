import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, StatusBar, Platform, Modal,
  ActivityIndicator, KeyboardAvoidingView, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius } from '../constants/theme';
import type { Team, TeamMember, TeamChallenge } from '../types';
import { COMPETITION_FORMATS } from '../types';

interface Props {
  team: Team;
  currentUserId: string;
  onBack: () => void;
}

export default function TeamDetailScreen({ team, currentUserId, onBack }: Props) {
  const [tab, setTab] = useState<'roster' | 'challenges'>('roster');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [challenges, setChallenges] = useState<TeamChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isCaptain, setIsCaptain] = useState(false);

  // Challenge modals
  const [challengeModal, setChallengeModal] = useState(false);
  const [allTeams, setAllTeams] = useState<Pick<Team, 'id' | 'name' | 'badge_emoji'>[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');
  const [challengeMsg, setChallengeMsg] = useState('');
  const [proposedAt, setProposedAt] = useState('');
  const [sendingChallenge, setSendingChallenge] = useState(false);

  // Score modal
  const [scoreModal, setScoreModal] = useState<TeamChallenge | null>(null);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [savingScore, setSavingScore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, challengesRes] = await Promise.all([
        supabase
          .from('team_members')
          .select('*, user:profiles!user_id(pseudo, avatar_id, level)')
          .eq('team_id', team.id)
          .order('role', { ascending: false }),
        supabase
          .from('team_challenges')
          .select('*, challenger:teams!challenger_id(id,name,badge_emoji), challenged:teams!challenged_id(id,name,badge_emoji)')
          .or(`challenger_id.eq.${team.id},challenged_id.eq.${team.id}`)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      const mems = (membersRes.data ?? []) as TeamMember[];
      setMembers(mems);
      setChallenges((challengesRes.data ?? []) as TeamChallenge[]);

      const me = mems.find(m => m.user_id === currentUserId);
      setIsMember(!!me);
      setIsCaptain(me?.role === 'captain' || team.captain_id === currentUserId);
    } finally {
      setLoading(false);
    }
  }, [team.id, team.captain_id, currentUserId]);

  useEffect(() => { load(); }, [load]);

  async function joinTeam() {
    const { error } = await supabase
      .from('team_members')
      .insert({ team_id: team.id, user_id: currentUserId, role: 'player' });
    if (error) {
      if (error.code === '23505') Alert.alert('Déjà membre');
      else Alert.alert('Erreur', error.message);
      return;
    }
    load();
  }

  async function leaveTeam() {
    Alert.alert('Quitter l\'équipe', 'Es-tu sûr de vouloir quitter cette équipe ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter', style: 'destructive', onPress: async () => {
          await supabase.from('team_members').delete()
            .eq('team_id', team.id).eq('user_id', currentUserId);
          load();
        },
      },
    ]);
  }

  async function kickMember(memberId: string, pseudo: string) {
    Alert.alert('Exclure', `Exclure ${pseudo} de l'équipe ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Exclure', style: 'destructive', onPress: async () => {
          await supabase.from('team_members').delete().eq('id', memberId);
          load();
        },
      },
    ]);
  }

  async function loadTeamsForChallenge() {
    const { data } = await supabase
      .from('teams')
      .select('id, name, badge_emoji')
      .neq('id', team.id)
      .limit(50);
    setAllTeams((data ?? []) as Pick<Team, 'id' | 'name' | 'badge_emoji'>[]);
    setChallengeModal(true);
  }

  async function sendChallenge() {
    if (!selectedOpponent) { Alert.alert('Sélectionne une équipe adverse'); return; }
    setSendingChallenge(true);
    try {
      const { error } = await supabase.from('team_challenges').insert({
        challenger_id: team.id,
        challenged_id: selectedOpponent,
        message: challengeMsg.trim() || null,
        proposed_at: proposedAt ? new Date(proposedAt).toISOString() : null,
      });
      if (error) throw error;
      setChallengeModal(false);
      setSelectedOpponent('');
      setChallengeMsg('');
      setProposedAt('');
      Alert.alert('Défi envoyé !', 'L\'équipe adverse a été notifiée.');
      load();
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    } finally {
      setSendingChallenge(false);
    }
  }

  async function respondChallenge(challengeId: string, accept: boolean) {
    await supabase.from('team_challenges').update({ status: accept ? 'accepted' : 'declined' }).eq('id', challengeId);
    load();
  }

  async function saveScore() {
    if (!scoreModal) return;
    const hs = parseInt(homeScore, 10);
    const as_ = parseInt(awayScore, 10);
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
      Alert.alert('Scores invalides');
      return;
    }
    setSavingScore(true);
    try {
      await supabase.from('team_challenges').update({
        home_score: hs, away_score: as_, status: 'played',
      }).eq('id', scoreModal.id);

      // Update teams record
      const homeWon = hs > as_;
      const awayWon = as_ > hs;
      const draw = hs === as_;

      const updateTeam = async (teamId: string, win: boolean, d: boolean) => {
        const { data: t } = await supabase.from('teams').select('wins,draws,losses').eq('id', teamId).single();
        if (!t) return;
        await supabase.from('teams').update({
          wins: t.wins + (win ? 1 : 0),
          draws: t.draws + (d ? 1 : 0),
          losses: t.losses + (!win && !d ? 1 : 0),
        }).eq('id', teamId);
      };

      await Promise.all([
        updateTeam(scoreModal.challenger_id, homeWon, draw),
        updateTeam(scoreModal.challenged_id, awayWon, draw),
      ]);

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

  const fmt = COMPETITION_FORMATS[team.preferred_format];
  const total = team.wins + team.draws + team.losses;
  const winRate = total > 0 ? Math.round((team.wins / total) * 100) : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.teamBadge}>{team.badge_emoji}</Text>
          <View>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamSub}>{fmt.emoji} {fmt.label}</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{members.length}</Text>
          <Text style={styles.statLabel}>Joueurs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: Colors.green }]}>{team.wins}</Text>
          <Text style={styles.statLabel}>Victoires</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{team.draws}</Text>
          <Text style={styles.statLabel}>Nuls</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: Colors.textMuted }]}>{team.losses}</Text>
          <Text style={styles.statLabel}>Défaites</Text>
        </View>
        {winRate !== null && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: Colors.greenLight }]}>{winRate}%</Text>
              <Text style={styles.statLabel}>Win rate</Text>
            </View>
          </>
        )}
      </View>

      {/* Invite code */}
      {isMember && (
        <View style={styles.inviteRow}>
          <Ionicons name="link-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.inviteText}>Code d'invitation : </Text>
          <Text style={styles.inviteCode}>{team.invite_code}</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['roster', 'challenges'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabPill, tab === t && styles.tabPillActive]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityLabel={t === 'roster' ? 'Effectif' : 'Défis'}
            accessibilityState={{ selected: tab === t }}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'roster' ? 'Effectif' : 'Défis'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <View style={styles.center}><ActivityIndicator color={Colors.green} size="large" /></View>
        : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {tab === 'roster' && (
              <View style={styles.section}>
                {members.map((m) => (
                  <View key={m.id} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={{ fontSize: 16 }}>👤</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{m.user?.pseudo ?? '?'}</Text>
                      <Text style={styles.memberSub}>{m.user?.level ?? ''}</Text>
                    </View>
                    {m.role === 'captain' && (
                      <View style={styles.captainBadge}>
                        <Text style={styles.captainText}>⭐ Capitaine</Text>
                      </View>
                    )}
                    {isCaptain && m.role !== 'captain' && m.user_id !== currentUserId && (
                      <TouchableOpacity
                        onPress={() => kickMember(m.id, m.user?.pseudo ?? '?')}
                        style={styles.kickBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Exclure ${m.user?.pseudo ?? 'ce joueur'}`}
                      >
                        <Ionicons name="remove-circle-outline" size={18} color={Colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {tab === 'challenges' && (
              <View style={styles.section}>
                {challenges.length === 0 && (
                  <Text style={styles.empty}>Aucun défi — lance le premier !</Text>
                )}
                {challenges.map((c) => {
                  const isChallenger = c.challenger_id === team.id;
                  const opponent = isChallenger ? c.challenged : c.challenger;
                  const pending = c.status === 'pending' && !isChallenger;
                  const accepted = c.status === 'accepted';
                  const canScore = accepted && (isCaptain || (isChallenger && isMember));

                  return (
                    <View key={c.id} style={styles.challengeCard}>
                      <View style={styles.challengeHeader}>
                        <Text style={styles.challengeOpponent}>
                          {opponent?.badge_emoji ?? '⚽'} {opponent?.name ?? '—'}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[c.status]?.bg ?? Colors.bg3 }]}>
                          <Text style={[styles.statusText, { color: STATUS_COLORS[c.status]?.color ?? Colors.textMuted }]}>
                            {STATUS_LABELS[c.status]}
                          </Text>
                        </View>
                      </View>

                      {c.status === 'played' && c.home_score !== null && c.away_score !== null && (
                        <Text style={styles.scoreText}>
                          {isChallenger ? c.home_score : c.away_score} – {isChallenger ? c.away_score : c.home_score}
                        </Text>
                      )}

                      {c.message !== null && c.message !== undefined && c.message.length > 0 && (
                        <Text style={styles.challengeMsg}>"{c.message}"</Text>
                      )}

                      <View style={styles.challengeActions}>
                        {pending && (
                          <>
                            <TouchableOpacity
                              style={styles.acceptBtn}
                              onPress={() => respondChallenge(c.id, true)}
                              accessibilityRole="button"
                              accessibilityLabel="Accepter le défi"
                            >
                              <Text style={styles.acceptBtnText}>Accepter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.declineBtn}
                              onPress={() => respondChallenge(c.id, false)}
                              accessibilityRole="button"
                              accessibilityLabel="Refuser le défi"
                            >
                              <Text style={styles.declineBtnText}>Refuser</Text>
                            </TouchableOpacity>
                          </>
                        )}
                        {canScore && (
                          <TouchableOpacity
                            style={styles.scoreBtn}
                            onPress={() => {
                              setScoreModal(c);
                              setHomeScore('');
                              setAwayScore('');
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Saisir le score"
                          >
                            <Text style={styles.scoreBtnText}>Saisir le score</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

      {/* Action button at bottom */}
      <View style={styles.bottomBar}>
        {!isMember && (
          <TouchableOpacity style={styles.btnPrimary} onPress={joinTeam} accessibilityRole="button" accessibilityLabel="Rejoindre l'équipe">
            <Text style={styles.btnPrimaryText}>Rejoindre l'équipe</Text>
          </TouchableOpacity>
        )}
        {isMember && !isCaptain && (
          <TouchableOpacity style={styles.btnSecondary} onPress={leaveTeam} accessibilityRole="button" accessibilityLabel="Quitter l'équipe">
            <Text style={styles.btnSecondaryText}>Quitter l'équipe</Text>
          </TouchableOpacity>
        )}
        {isCaptain && tab === 'challenges' && (
          <TouchableOpacity style={styles.btnPrimary} onPress={loadTeamsForChallenge} accessibilityRole="button" accessibilityLabel="Lancer un défi">
            <Ionicons name="flash" size={16} color={Colors.bg} />
            <Text style={styles.btnPrimaryText}>Lancer un défi</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Challenge modal */}
      <Modal visible={challengeModal} transparent animationType="slide" onRequestClose={() => setChallengeModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setChallengeModal(false)} accessibilityRole="button" accessibilityLabel="Fermer">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
            <Pressable onPress={() => {}} accessibilityRole="none">
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Lancer un défi</Text>

              <Text style={styles.label}>Adversaire</Text>
              <ScrollView style={{ maxHeight: 160, marginBottom: Spacing.md }} showsVerticalScrollIndicator={false}>
                {allTeams.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.opponentRow, selectedOpponent === t.id && styles.opponentRowActive]}
                    onPress={() => setSelectedOpponent(t.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Sélectionner ${t.name}`}
                    accessibilityState={{ selected: selectedOpponent === t.id }}
                  >
                    <Text style={styles.opponentBadge}>{t.badge_emoji}</Text>
                    <Text style={[styles.opponentName, selectedOpponent === t.id && { color: Colors.bg }]}>{t.name}</Text>
                    {selectedOpponent === t.id && <Ionicons name="checkmark" size={16} color={Colors.bg} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Message (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Rendez-vous sur le terrain..."
                placeholderTextColor={Colors.textMuted}
                value={challengeMsg}
                onChangeText={setChallengeMsg}
                maxLength={150}
              />

              <TouchableOpacity
                style={[styles.btnPrimary, sendingChallenge && { opacity: 0.6 }]}
                onPress={sendChallenge}
                disabled={sendingChallenge}
                accessibilityRole="button"
                accessibilityLabel="Envoyer le défi"
              >
                {sendingChallenge
                  ? <ActivityIndicator color={Colors.bg} size="small" />
                  : <Text style={styles.btnPrimaryText}>Envoyer le défi</Text>}
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
              <View style={styles.scoreInputRow}>
                <View style={styles.scoreTeamCol}>
                  <Text style={styles.scoreTeamName} numberOfLines={1}>
                    {scoreModal?.challenger?.badge_emoji} {scoreModal?.challenger?.name ?? '—'}
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
                  <Text style={styles.scoreTeamName} numberOfLines={1}>
                    {scoreModal?.challenged?.badge_emoji} {scoreModal?.challenged?.name ?? '—'}
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

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  declined: 'Refusé',
  played: 'Joué',
  cancelled: 'Annulé',
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  pending:   { color: '#FFD700',        bg: 'rgba(255,215,0,0.12)' },
  accepted:  { color: Colors.green,     bg: Colors.greenDim },
  declined:  { color: Colors.textMuted, bg: 'rgba(255,255,255,0.06)' },
  played:    { color: Colors.greenLight, bg: 'rgba(185,246,202,0.10)' },
  cancelled: { color: Colors.textMuted, bg: 'rgba(255,255,255,0.06)' },
};

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
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  teamBadge: {
    fontSize: 32,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  teamSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderSubtle,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: 4,
  },
  inviteText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  inviteCode: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.green,
    letterSpacing: 1,
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
  },
  section: {
    paddingHorizontal: Spacing.xl,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  memberSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  captainBadge: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  captainText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '600',
  },
  kickBtn: {
    padding: 4,
  },
  challengeCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  challengeOpponent: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.green,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },
  challengeMsg: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  challengeActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  acceptBtn: {
    backgroundColor: Colors.green,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  acceptBtnText: {
    color: Colors.bg,
    fontWeight: '600',
    fontSize: 12,
  },
  declineBtn: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  declineBtnText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  scoreBtn: {
    backgroundColor: Colors.greenDim,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  scoreBtnText: {
    color: Colors.green,
    fontWeight: '600',
    fontSize: 12,
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
  empty: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
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
  btnSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    color: Colors.textMuted,
    fontWeight: '600',
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
  opponentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg3,
    marginBottom: 4,
  },
  opponentRowActive: {
    backgroundColor: Colors.green,
  },
  opponentBadge: {
    fontSize: 16,
  },
  opponentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
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
