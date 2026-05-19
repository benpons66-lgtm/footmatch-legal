import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  StatusBar,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius } from '../constants/theme';
import Copyright from '../components/Copyright';

interface Team {
  id: string;
  name: string;
  captain_id: string;
  captain?: { pseudo: string };
}

interface Match {
  id: string;
  championship_id: string;
  home_team_id: string;
  away_team_id: string;
  round: number;
  scheduled_at: string | null;
  home_score: number | null;
  away_score: number | null;
  status: 'pending_date' | 'scheduled' | 'played' | 'cancelled';
  home_team?: Team;
  away_team?: Team;
}

interface Standing {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  diff: number;
  points: number;
}

interface Props {
  championship: { id: string; name: string; organizer_id: string; max_teams: number; status: string; join_code: string };
  currentUserId: string;
  onBack: () => void;
}

function generateFixtures(teams: Team[]): { home: Team; away: Team; round: number }[] {
  const list: { home: Team; away: Team; round: number }[] = [];
  const pool = [...teams];
  if (pool.length % 2 !== 0) pool.push({ id: 'bye', name: 'BYE', captain_id: '' });
  const rounds = pool.length - 1;
  const half = pool.length / 2;

  for (let round = 0; round < rounds; round += 1) {
    for (let i = 0; i < half; i += 1) {
      const home = pool[i];
      const away = pool[pool.length - 1 - i];
      if (home.id !== 'bye' && away.id !== 'bye') {
        list.push({ home, away, round: round + 1 });
      }
    }
    pool.splice(1, 0, pool.pop()!);
  }

  const firstLeg = [...list];
  firstLeg.forEach((fixture) => {
    list.push({ home: fixture.away, away: fixture.home, round: fixture.round + rounds });
  });

  return list;
}

function computeStandings(teams: Team[], matches: Match[]): Standing[] {
  const table: Record<string, Standing> = {};
  teams.forEach((team) => {
    table[team.id] = {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      diff: 0,
      points: 0,
    };
  });

  matches
    .filter((match) => match.status === 'played' && match.home_score !== null && match.home_score !== undefined && match.away_score !== null && match.away_score !== undefined)
    .forEach((match) => {
      const home = table[match.home_team_id];
      const away = table[match.away_team_id];
      if (!home || !away) return;

      const hs = match.home_score ?? 0;
      const as = match.away_score ?? 0;

      home.played += 1;
      away.played += 1;
      home.gf += hs;
      home.ga += as;
      away.gf += as;
      away.ga += hs;

      if (hs > as) {
        home.won += 1;
        away.lost += 1;
        home.points += 3;
      } else if (hs < as) {
        away.won += 1;
        home.lost += 1;
        away.points += 3;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    });

  return Object.values(table)
    .map((row) => ({ ...row, diff: row.gf - row.ga }))
    .sort((a, b) => b.points - a.points || b.diff - a.diff || b.gf - a.gf);
}

function deterministic(seed: string, modulo: number) {
  return seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % modulo;
}

function hydrateFakeMatches(matches: Match[], fakeChampionship: boolean): Match[] {
  if (!fakeChampionship || matches.length === 0) return matches;

  const playedCutoff = Math.max(1, Math.floor(matches.length * 0.65));
  const now = Date.now();

  return matches.map((match, index) => {
    const baseDate = match.scheduled_at ?? new Date(now - (matches.length - index) * 2 * 24 * 60 * 60 * 1000).toISOString();
    const shouldBePlayed = match.status === 'played' || index < playedCutoff;

    if (!shouldBePlayed) {
      return {
        ...match,
        scheduled_at: baseDate,
        status: match.status === 'cancelled' ? 'cancelled' : 'scheduled',
      };
    }

    return {
      ...match,
      scheduled_at: baseDate,
      status: 'played',
      home_score: match.home_score ?? deterministic(`${match.id}-h`, 6),
      away_score: match.away_score ?? deterministic(`${match.id}-a`, 6),
    };
  });
}

export default function ChampionshipDetailScreen({ championship, currentUserId, onBack }: Props) {
  const [tab, setTab] = useState<'standing' | 'calendar' | 'team'>('standing');
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');

  const [dateModal, setDateModal] = useState<Match | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  const [resultModal, setResultModal] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const [homeScoreInput, setHomeScoreInput] = useState('');
  const [awayScoreInput, setAwayScoreInput] = useState('');

  const isOrganizer = championship.organizer_id === currentUserId;
  const isFakeChampionship = String(championship.organizer_id ?? '').startsWith('fa');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [{ data: teamsData }, { data: matchesData }] = await Promise.all([
        supabase.from('championship_teams').select('*, captain:profiles(pseudo)').eq('championship_id', championship.id),
        supabase
          .from('championship_matches')
          .select('*, home_team:championship_teams!home_team_id(id,name,captain_id), away_team:championship_teams!away_team_id(id,name,captain_id)')
          .eq('championship_id', championship.id)
          .order('round')
          .order('status'),
      ]);

      const safeTeams = teamsData ?? [];
      setTeams(safeTeams);
      setMyTeam(safeTeams.find((team: Team) => team.captain_id === currentUserId) ?? null);
      setMatches(hydrateFakeMatches(matchesData ?? [], isFakeChampionship));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam() {
    if (!teamName.trim()) {
      Alert.alert('Erreur', 'Donne un nom a ton equipe');
      return;
    }
    if (teams.length >= championship.max_teams) {
      Alert.alert('Complet', 'Le championnat est complet.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('championship_teams').insert({
        championship_id: championship.id,
        name: teamName.trim(),
        captain_id: currentUserId,
      });
      if (error) throw error;
      setTeamName('');
      setShowTeamModal(false);
      await loadAll();
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleStartChampionship() {
    if (teams.length < 2) {
      Alert.alert('Erreur', 'Il faut au moins 2 equipes.');
      return;
    }

    Alert.alert(
      'Lancer le championnat ?',
      `${teams.length} equipes vont generer le calendrier complet.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Lancer',
          onPress: async () => {
            setLoading(true);
            try {
              const fixtures = generateFixtures(teams);
              const inserts = fixtures.map((fixture) => ({
                championship_id: championship.id,
                home_team_id: fixture.home.id,
                away_team_id: fixture.away.id,
                round: fixture.round,
                status: 'pending_date',
              }));
              await supabase.from('championship_matches').insert(inserts);
              await supabase.from('championships').update({ status: 'active' }).eq('id', championship.id);
              await loadAll();
            } catch (e: unknown) {
              Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleSetDate() {
    if (!dateModal || !dateInput || !timeInput) return;
    const dt = new Date(`${dateInput}T${timeInput}:00`);
    if (Number.isNaN(dt.getTime())) { Alert.alert('Erreur', 'Date invalide'); return; }
    const matchId = dateModal.id;
    const iso = dt.toISOString();
    try {
      const { error } = await supabase
        .from('championship_matches')
        .update({ scheduled_at: iso, status: 'scheduled' })
        .eq('id', matchId);
      if (error) throw error;
      // Mise à jour locale — pas de rechargement réseau
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, scheduled_at: iso, status: 'scheduled' } : m));
      setDateModal(null);
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSetResult() {
    if (!resultModal) return;
    const hs = parseInt(homeScore, 10);
    const as = parseInt(awayScore, 10);
    if (Number.isNaN(hs) || Number.isNaN(as) || hs < 0 || as < 0) { Alert.alert('Erreur', 'Entre des scores valides'); return; }
    const matchId = resultModal.id;
    try {
      const { error } = await supabase
        .from('championship_matches')
        .update({ home_score: hs, away_score: as, status: 'played' })
        .eq('id', matchId);
      if (error) throw error;
      // Mise à jour locale — pas de rechargement réseau
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, home_score: hs, away_score: as, status: 'played' } : m));
      setResultModal(null);
      setHomeScore('');
      setAwayScore('');
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSaveScore() {
    if (!scoringMatch) return;
    const hs = parseInt(homeScoreInput, 10);
    const as = parseInt(awayScoreInput, 10);
    if (Number.isNaN(hs) || Number.isNaN(as) || hs < 0 || as < 0) { Alert.alert('Erreur', 'Entre des scores valides'); return; }
    const matchId = scoringMatch.id;
    try {
      const { error } = await supabase
        .from('championship_matches')
        .update({ home_score: hs, away_score: as, status: 'played' })
        .eq('id', matchId);
      if (error) throw error;
      // Mise à jour locale — pas de rechargement réseau
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, home_score: hs, away_score: as, status: 'played' } : m));
      setScoringMatch(null);
      setHomeScoreInput('');
      setAwayScoreInput('');
      Alert.alert('Score enregistre', 'Le classement a ete mis a jour.');
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    }
  }

  function dismissScoreModal() {
    Keyboard.dismiss();
    setScoringMatch(null);
    setHomeScoreInput('');
    setAwayScoreInput('');
  }

  const standings = computeStandings(teams, matches);
  const byRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const canJoin = !myTeam && championship.status === 'registration' && teams.length < championship.max_teams;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.green} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle} numberOfLines={1}>{championship.name}</Text>
          <Text style={s.headerSub}>{teams.length}/{championship.max_teams} equipes</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {(canJoin || (isOrganizer && championship.status === 'registration' && teams.length >= 2)) && (
        <View style={s.actionsBar}>
          {canJoin && (
            <TouchableOpacity style={s.actionBtn} onPress={() => setShowTeamModal(true)}>
              <Text style={s.actionBtnText}>Inscrire mon equipe</Text>
            </TouchableOpacity>
          )}
          {isOrganizer && championship.status === 'registration' && teams.length >= 2 && (
            <TouchableOpacity style={[s.actionBtn, s.actionBtnPrimary]} onPress={handleStartChampionship} disabled={loading}>
              <Text style={[s.actionBtnText, { color: '#000' }]}>Lancer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={s.tabs}>
        {(['standing', 'calendar', 'team'] as const).map((key) => (
          <TouchableOpacity key={key} style={[s.tab, tab === key && s.tabActive]} onPress={() => setTab(key)}>
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>
              {key === 'standing' ? 'Classement' : key === 'calendar' ? 'Calendrier' : 'Equipes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'standing' && (
          <View style={s.pad}>
            {standings.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyText}>Le classement apparaitra une fois les matchs joues.</Text>
              </View>
            ) : (
              <View style={s.table}>
                <View style={[s.tableRow, s.tableHeader]}>
                  <Text style={[s.tableCell, s.tableCellRank]}>#</Text>
                  <Text style={[s.tableCell, s.tableCellTeam]}>Equipe</Text>
                  <Text style={s.tableCell}>J</Text>
                  <Text style={s.tableCell}>V</Text>
                  <Text style={s.tableCell}>N</Text>
                  <Text style={s.tableCell}>D</Text>
                  <Text style={s.tableCell}>Diff</Text>
                  <Text style={[s.tableCell, s.tableCellPts]}>Pts</Text>
                </View>
                {standings.map((row, index) => {
                  const isMine = row.team.captain_id === currentUserId;
                  return (
                    <View key={row.team.id} style={[s.tableRow, index % 2 === 0 && s.tableRowAlt, isMine && s.tableRowMine]}>
                      <Text style={[s.tableCell, s.tableCellRank]}>{index + 1}</Text>
                      <Text style={[s.tableCell, s.tableCellTeam, { color: Colors.text }]} numberOfLines={1}>{row.team.name}</Text>
                      <Text style={s.tableCell}>{row.played}</Text>
                      <Text style={s.tableCell}>{row.won}</Text>
                      <Text style={s.tableCell}>{row.drawn}</Text>
                      <Text style={s.tableCell}>{row.lost}</Text>
                      <Text style={s.tableCell}>{row.diff > 0 ? `+${row.diff}` : row.diff}</Text>
                      <Text style={[s.tableCell, s.tableCellPts]}>{row.points}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {tab === 'calendar' && (
          <View style={s.pad}>
            {Object.keys(byRound).length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyText}>Le calendrier sera visible ici.</Text>
              </View>
            ) : (
              Object.entries(byRound).map(([round, roundMatches]) => (
                <View key={round} style={s.roundBlock}>
                  <Text style={s.roundTitle}>Journee {round}</Text>
                  {roundMatches.map((match) => {
                    const isMyMatch = myTeam && (match.home_team_id === myTeam.id || match.away_team_id === myTeam.id);
                    const canSetDate = isMyMatch && match.status === 'pending_date';
                    const canSetResult = isOrganizer && match.status === 'scheduled';
                    return (
                      <View key={match.id} style={[s.matchCard, isMyMatch && s.matchCardMine]}>
                        <View style={s.matchTeams}>
                          <Text style={[s.matchTeamName, match.home_team_id === myTeam?.id && { color: Colors.green }]} numberOfLines={1}>
                            {match.home_team?.name ?? '?'}
                          </Text>
                          <Text style={s.matchScoreText}>
                            {match.status === 'played' ? `${match.home_score} - ${match.away_score}` : 'VS'}
                          </Text>
                          <Text style={[s.matchTeamName, s.matchTeamAway, match.away_team_id === myTeam?.id && { color: Colors.green }]} numberOfLines={1}>
                            {match.away_team?.name ?? '?'}
                          </Text>
                        </View>

                        {match.scheduled_at && (
                          <Text style={s.matchDate}>
                            {new Date(match.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}

                        {match.status === 'pending_date' && <Text style={s.matchPending}>Date a definir</Text>}

                        {canSetDate && (
                          <TouchableOpacity style={s.matchAction} onPress={() => { setDateModal(match); setDateInput(''); setTimeInput(''); }}>
                            <Text style={s.matchActionText}>Proposer une date</Text>
                          </TouchableOpacity>
                        )}

                        {canSetResult && (
                          <TouchableOpacity style={s.matchAction} onPress={() => { setResultModal(match); setHomeScore(''); setAwayScore(''); }}>
                            <Text style={s.matchActionText}>Entrer le score</Text>
                          </TouchableOpacity>
                        )}

                        {match.status !== 'played' && (
                          <TouchableOpacity style={s.matchAction} onPress={() => { setScoringMatch(match); setHomeScoreInput(''); setAwayScoreInput(''); }}>
                            <Text style={s.matchActionText}>Saisir score</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'team' && (
          <View style={s.pad}>
            {teams.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyText}>Aucune equipe inscrite.</Text>
              </View>
            ) : (
              teams.map((team, index) => (
                <View key={team.id} style={[s.teamCard, team.captain_id === currentUserId && s.teamCardMine]}>
                  <Text style={s.teamRank}>#{index + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.teamName}>{team.name}</Text>
                    <Text style={s.teamCap}>Capitaine : {team.captain?.pseudo ?? '?'}</Text>
                  </View>
                  {team.captain_id === currentUserId && <Text style={s.teamYou}>Mon equipe</Text>}
                </View>
              ))
            )}
          </View>
        )}

        <Copyright />
        <View style={{ height: 80 }} />
      </ScrollView>

      <Modal visible={showTeamModal} transparent animationType="slide" onRequestClose={() => setShowTeamModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Inscrire mon equipe</Text>
            <TextInput
              style={s.input}
              value={teamName}
              onChangeText={setTeamName}
              placeholder="Nom de l'equipe"
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity style={[s.btn, loading && { opacity: 0.5 }]} onPress={handleCreateTeam} disabled={loading}>
              <Text style={s.btnText}>{loading ? 'Inscription...' : 'Valider'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowTeamModal(false)}>
              <Text style={s.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!dateModal} transparent animationType="slide" onRequestClose={() => setDateModal(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Proposer une date</Text>
            <TextInput style={s.input} value={dateInput} onChangeText={setDateInput} placeholder="AAAA-MM-JJ" placeholderTextColor={Colors.textMuted} />
            <TextInput style={[s.input, { marginTop: 10 }]} value={timeInput} onChangeText={setTimeInput} placeholder="HH:MM" placeholderTextColor={Colors.textMuted} />
            <TouchableOpacity style={s.btn} onPress={handleSetDate}>
              <Text style={s.btnText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalCancel} onPress={() => setDateModal(null)}>
              <Text style={s.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!resultModal} transparent animationType="slide" onRequestClose={() => setResultModal(null)}>
        <Pressable style={s.modalOverlay} onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={s.modal} onPress={() => {}}>
              <TouchableOpacity style={s.keyboardCloseBtn} onPress={Keyboard.dismiss}>
                <Text style={s.keyboardCloseBtnText}>Fermer clavier</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Entrer le score</Text>
              <View style={s.scoreRow}>
                <TextInput
                  style={[s.input, s.scoreInput]}
                  value={homeScore}
                  onChangeText={setHomeScore}
                  placeholder="0"
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                  inputMode="numeric"
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={() => Keyboard.dismiss()}
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={s.scoreDash}>-</Text>
                <TextInput
                  style={[s.input, s.scoreInput]}
                  value={awayScore}
                  onChangeText={setAwayScore}
                  placeholder="0"
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                  inputMode="numeric"
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={() => Keyboard.dismiss()}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <TouchableOpacity style={s.btn} onPress={handleSetResult}>
                <Text style={s.btnText}>Valider le score</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalCancel} onPress={() => setResultModal(null)}>
                <Text style={s.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <Modal visible={scoringMatch !== null} transparent animationType="slide" onRequestClose={dismissScoreModal}>
        <Pressable style={s.modalOverlay} onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={s.modal} onPress={() => {}}>
              <TouchableOpacity style={s.keyboardCloseBtn} onPress={Keyboard.dismiss}>
                <Text style={s.keyboardCloseBtnText}>Fermer clavier</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Saisir le score</Text>
              {scoringMatch && (
                <View style={{ gap: 16 }}>
                  <View style={s.scoreTeamsRow}>
                    <Text style={s.scoreTeamLabel} numberOfLines={2}>{scoringMatch.home_team?.name ?? 'Domicile'}</Text>
                    <TextInput
                      style={s.scoreField}
                      value={homeScoreInput}
                      onChangeText={setHomeScoreInput}
                      keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                      inputMode="numeric"
                      returnKeyType="done"
                      blurOnSubmit
                      onSubmitEditing={() => Keyboard.dismiss()}
                      maxLength={2}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <Text style={s.scoreDash}>-</Text>
                    <TextInput
                      style={s.scoreField}
                      value={awayScoreInput}
                      onChangeText={setAwayScoreInput}
                      keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                      inputMode="numeric"
                      returnKeyType="done"
                      blurOnSubmit
                      onSubmitEditing={() => Keyboard.dismiss()}
                      maxLength={2}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <Text style={[s.scoreTeamLabel, { textAlign: 'left' }]} numberOfLines={2}>{scoringMatch.away_team?.name ?? 'Exterieur'}</Text>
                  </View>
                  <TouchableOpacity style={s.btn} onPress={handleSaveScore}>
                    <Text style={s.btnText}>Valider le score</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.modalCancel} onPress={dismissScoreModal}>
                    <Text style={s.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pad: { padding: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
  actionsBar: { flexDirection: 'row', gap: 10, padding: Spacing.xl, paddingBottom: 0 },
  actionBtn: { flex: 1, borderRadius: Radius.full, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  actionBtnPrimary: { backgroundColor: Colors.green, borderColor: Colors.green },
  actionBtnText: { fontSize: 13, fontWeight: '800', color: Colors.text },
  tabs: { flexDirection: 'row', marginHorizontal: Spacing.xl, marginTop: 14, gap: 8 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: Radius.full, backgroundColor: Colors.bg2, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  tabActive: { backgroundColor: Colors.greenDim, borderColor: Colors.green },
  tabText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  tabTextActive: { color: Colors.green },
  table: { backgroundColor: Colors.bg2, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  tableHeader: { backgroundColor: Colors.bg3 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  tableRowAlt: { backgroundColor: 'rgba(0,230,118,0.03)' },
  tableRowMine: { backgroundColor: 'rgba(0,230,118,0.08)' },
  tableCell: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', width: 28, fontWeight: '600' },
  tableCellRank: { width: 24 },
  tableCellTeam: { flex: 1, textAlign: 'left', paddingHorizontal: 6 },
  tableCellPts: { width: 32, fontSize: 14, fontWeight: '900' },
  roundBlock: { marginBottom: Spacing.xl },
  roundTitle: { fontSize: 13, fontWeight: '900', color: Colors.green, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  matchCard: { backgroundColor: Colors.bg2, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  matchCardMine: { borderColor: Colors.greenBorder },
  matchTeams: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  matchTeamName: { flex: 1, fontSize: 14, fontWeight: '800', color: Colors.textMuted },
  matchTeamAway: { textAlign: 'right' },
  matchScoreText: { fontSize: 18, fontWeight: '900', color: Colors.text, minWidth: 54, textAlign: 'center' },
  matchDate: { fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
  matchPending: { fontSize: 12, color: Colors.greenLight, fontWeight: '600' },
  matchAction: { marginTop: 8, backgroundColor: Colors.greenDim, borderRadius: Radius.full, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.greenBorder },
  matchActionText: { fontSize: 12, fontWeight: '700', color: Colors.green },
  teamCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg2, borderRadius: Radius.md, padding: Spacing.lg, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', gap: 12 },
  teamCardMine: { borderColor: Colors.greenBorder },
  teamRank: { fontSize: 20, fontWeight: '900', color: Colors.textMuted, width: 32 },
  teamName: { fontSize: 16, fontWeight: '800', color: Colors.text },
  teamCap: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  teamYou: { fontSize: 11, color: Colors.green, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  modalCancel: { alignItems: 'center', paddingVertical: 12 },
  modalCancelText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: Colors.bg3, borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.text, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  btn: { backgroundColor: Colors.green, borderRadius: Radius.full, padding: 16, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '900', color: '#000' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreInput: { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '900' },
  scoreDash: { fontSize: 24, color: Colors.textMuted, fontWeight: '900' },
  keyboardCloseBtn: { alignSelf: 'flex-end', backgroundColor: Colors.greenDim, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.greenBorder },
  keyboardCloseBtnText: { fontSize: 12, color: Colors.green, fontWeight: '800' },
  scoreTeamsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreTeamLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  scoreField:     { width: 52, height: 52, borderRadius: 8, backgroundColor: Colors.bg3, borderWidth: 2, borderColor: Colors.border, textAlign: 'center', fontSize: 24, fontWeight: '900', color: Colors.text },
});
