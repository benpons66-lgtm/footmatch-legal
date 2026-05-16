import { useState } from 'react';
import { Alert, Share } from 'react-native';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { fetchComputedStatsForUsers, getDisplayReputationScore, isLaunchCommunityProfile, isSeededProfileId } from '../lib/playerStats';
import { getLevelFromScore } from '../components/ReputationBadge';
import type { Match, MatchPlayer, AppUser, LiveStats } from '../types';

interface UseMatchesReturn {
  selectedMatch: Match | null;
  setSelectedMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  matchPlayers: MatchPlayer[];
  myMatches: string[];
  myCreatedMatches: Match[];
  myRatings: Record<string, number>;
  loading: boolean;
  refreshing: boolean;
  matchesLoaded: boolean;
  liveStats: LiveStats;
  toRateCount: number;
  // Actions
  loadMatches: (isRefresh?: boolean) => Promise<void>;
  loadMatchDetail: (match: Match, onNavigate: () => void) => Promise<void>;
  loadMyMatches: (userId: string) => Promise<void>;
  loadLiveStats: () => Promise<void>;
  handleJoin: (userId: string) => Promise<void>;
  handleLeave: (userId: string, onSuccess: () => void) => void;
  handleShare: () => Promise<void>;
  handleShareProfile: (user: AppUser, matchCount: number) => Promise<void>;
  handleRate: (matchId: string, rating: number, userId: string) => Promise<void>;
  handleCreateMatch: (params: CreateMatchParams, userId: string, onSuccess: () => void) => Promise<void>;
  setRatingLoading: (v: boolean) => void;
  ratingLoading: boolean;
}

export interface CreateMatchParams {
  title: string;
  type: 'five' | 'city' | 'eleven';
  venueId: string;
  date: string;
  time: string;
  maxPlayers: string;
  description: string;
  isPrivate: boolean;
}

export function useMatches(
  currentUser: AppUser | null,
  blockedUserIds: string[],
  ensureCleanContent: (text: string, ctx?: string) => boolean,
  scheduleMatchReminder: (title: string, date: Date, matchId: string, prompt?: boolean) => Promise<void>,
  cancelMatchReminder: (matchId: string) => Promise<void>,
): UseMatchesReturn {
  const { matches, setMatches } = useStore();

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [myMatches, setMyMatches] = useState<string[]>([]);
  const [myCreatedMatches, setMyCreatedMatches] = useState<Match[]>([]);
  const [myRatings, setMyRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [matchesLoaded, setMatchesLoaded] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [liveStats, setLiveStats] = useState<LiveStats>({ players: 847, matchesTonight: 12 });

  const toRateCount = matches.filter(
    (m) =>
      myMatches.includes(m.id) &&
      new Date((m as Match).scheduled_at) < new Date() &&
      !myRatings[m.id],
  ).length;

  function isLaunchCommunityMatch(match: Match): boolean {
    if (!match) return false;
    return (
      String(match.id ?? '').startsWith('fb') ||
      isSeededProfileId(match.organizer_id) ||
      match.organizer_id === currentUser?.id ||
      myMatches.includes(match.id)
    );
  }

  async function hydrateMatchesWithActualPlayers(rawMatches: Match[]): Promise<Match[]> {
    const matchIds = rawMatches.map((m) => m.id).filter(Boolean);
    if (matchIds.length === 0) return rawMatches;

    const { data } = await supabase
      .from('match_players')
      .select('match_id')
      .in('match_id', matchIds)
      .eq('status', 'confirmed');

    const counts = new Map<string, number>();
    (data ?? []).forEach((row: { match_id: string }) => {
      counts.set(row.match_id, (counts.get(row.match_id) ?? 0) + 1);
    });

    return rawMatches.map((match) => ({
      ...match,
      current_players:
        counts.get(String(match.id)) ?? Math.max(0, Number(match.current_players ?? 0)),
    }));
  }

  async function enrichMatchPlayers(rawPlayers: MatchPlayer[]): Promise<MatchPlayer[]> {
    const userIds = rawPlayers
      .map((p) => p.user?.id)
      .filter((id): id is string => Boolean(id));

    const statsByUser = await fetchComputedStatsForUsers(userIds);

    return rawPlayers
      .map((player) => {
        const user = player.user;
        if (!user?.id) return player;
        const stats = statsByUser[user.id];
        const displayScore = getDisplayReputationScore(user.id, user.reputation_score ?? null, stats);
        return {
          ...player,
          user: {
            ...user,
            display_score: displayScore,
            display_level: getLevelFromScore(displayScore),
            display_matches_played: stats?.matchesPlayed ?? 0,
          },
        };
      })
      .filter(
        (p) =>
          !p.user?.id ||
          isLaunchCommunityProfile(p.user.id, statsByUser[p.user.id]) ||
          p.user.id === currentUser?.id,
      );
  }

  // ── Auto-marquer les matchs passés comme joués ────────────────────────────
  async function autoMarkPlayedMatches(): Promise<void> {
    try {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('matches')
        .update({ status: 'played' })
        .lt('scheduled_at', threeHoursAgo)
        .not('status', 'in', '("cancelled","played")');
    } catch {
      // Non critique — l'affichage utilise le temps comme fallback
    }
  }

  // ── Load all matches ───────────────────────────────────────────────────────
  async function loadMatches(isRefresh = false): Promise<void> {
    if (isRefresh) setRefreshing(true);
    try {
      await autoMarkPlayedMatches();
      const { data } = await supabase
        .from('matches')
        .select('*, venue:venues(*)')
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: true });

      const hydrated = await hydrateMatchesWithActualPlayers((data ?? []) as Match[]);
      const launchMatches = hydrated.filter(isLaunchCommunityMatch);
      setMatches(launchMatches);
      setLiveStats((prev) => ({
        ...prev,
        matchesTonight: launchMatches.filter(
          (m) => m.status === 'open' && new Date(m.scheduled_at) >= new Date(),
        ).length,
      }));
      setMatchesLoaded(true);
    } finally {
      setRefreshing(false);
    }
  }

  // ── Load match detail ──────────────────────────────────────────────────────
  async function loadMatchDetail(match: Match, onNavigate: () => void): Promise<void> {
    // Fixer le state avant la navigation pour éviter la race condition
    const [hydratedMatch] = await hydrateMatchesWithActualPlayers([match]);
    setSelectedMatch(hydratedMatch ?? match);
    setMatchPlayers([]); // reset pendant le chargement
    onNavigate();

    const { data } = await supabase
      .from('match_players')
      .select('*, user:profiles(id,pseudo,level,reputation_score,reputation_rank)')
      .eq('match_id', match.id)
      .eq('status', 'confirmed');

    if (data) {
      const enriched = await enrichMatchPlayers(data as MatchPlayer[]);
      setMatchPlayers(enriched);
      setSelectedMatch((prev) =>
        prev ? { ...prev, current_players: enriched.length } : prev,
      );
    }
  }

  // ── Load my matches ────────────────────────────────────────────────────────
  async function loadMyMatches(userId: string): Promise<void> {
    const { data: joined } = await supabase
      .from('match_players')
      .select('match_id')
      .eq('user_id', userId)
      .eq('status', 'confirmed');

    if (joined) {
      const ids = joined.map((d: { match_id: string }) => d.match_id);
      setMyMatches(ids);

      // Planifier rappels pour matchs futurs déjà rejoints
      if (ids.length > 0) {
        const { data: upcoming } = await supabase
          .from('matches')
          .select('id, title, scheduled_at')
          .in('id', ids)
          .gt('scheduled_at', new Date().toISOString());
        if (upcoming) {
          for (const m of upcoming as { id: string; title: string; scheduled_at: string }[]) {
            scheduleMatchReminder(m.title, new Date(m.scheduled_at), m.id, false);
          }
        }
      }
    }

    const { data: created } = await supabase
      .from('matches')
      .select('*, venue:venues(name)')
      .eq('organizer_id', userId)
      .order('scheduled_at', { ascending: false });
    if (created) setMyCreatedMatches(created as Match[]);

    const { data: ratings } = await supabase
      .from('match_ratings')
      .select('match_id, rating')
      .eq('user_id', userId);
    if (ratings) {
      const r: Record<string, number> = {};
      (ratings as { match_id: string; rating: number }[]).forEach((x) => {
        r[x.match_id] = x.rating;
      });
      setMyRatings(r);
    }
  }

  // ── Load live stats ────────────────────────────────────────────────────────
  async function loadLiveStats(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const [profilesRes, matchesRes, matchPlayersRes] = await Promise.all([
        supabase.from('profiles').select('id').limit(2500),
        supabase.from('matches').select('id, organizer_id, status, scheduled_at').eq('status', 'open').gte('scheduled_at', now).limit(500),
        supabase.from('match_players').select('user_id, status').eq('status', 'confirmed').limit(10000),
      ]);

      const seededPlayers = (profilesRes.data ?? []).filter((p: { id: string }) =>
        isSeededProfileId(p.id),
      );
      const fallbackIds = new Set<string>();
      (matchPlayersRes.data ?? []).forEach((row: { user_id: string }) => {
        if (isSeededProfileId(row.user_id)) fallbackIds.add(row.user_id);
      });
      (matchesRes.data ?? []).forEach((m: { organizer_id: string }) => {
        if (isSeededProfileId(m.organizer_id)) fallbackIds.add(m.organizer_id);
      });

      const launchMatchCount = (matchesRes.data ?? []).filter((m: any) =>
        isLaunchCommunityMatch(m as Match),
      ).length;

      setLiveStats({
        players: seededPlayers.length > 0 ? seededPlayers.length : fallbackIds.size,
        matchesTonight: launchMatchCount,
      });
    } catch {
      // ignore — stat non critique
    }
  }

  // ── Join match ─────────────────────────────────────────────────────────────
  async function handleJoin(userId: string): Promise<void> {
    if (!selectedMatch) return;
    if (myMatches.includes(selectedMatch.id)) {
      Alert.alert('Déjà inscrit !');
      return;
    }
    if (selectedMatch.current_players >= selectedMatch.max_players) {
      Alert.alert('Match complet !');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('match_players')
        .insert({ match_id: selectedMatch.id, user_id: userId, status: 'confirmed' });
      if (error) throw error;

      const newCount = Math.max(matchPlayers.length + 1, selectedMatch.current_players + 1);
      await supabase
        .from('matches')
        .update({ current_players: newCount })
        .eq('id', selectedMatch.id);

      setMyMatches((prev) => [...prev, selectedMatch.id]);
      setSelectedMatch((prev) => (prev ? { ...prev, current_players: newCount } : prev));

      const { data } = await supabase
        .from('match_players')
        .select('*, user:profiles(id,pseudo,level,reputation_score,reputation_rank)')
        .eq('match_id', selectedMatch.id)
        .eq('status', 'confirmed');
      if (data) setMatchPlayers(await enrichMatchPlayers(data as MatchPlayer[]));

      scheduleMatchReminder(
        selectedMatch.title,
        new Date(selectedMatch.scheduled_at),
        selectedMatch.id,
        true,
      );
      Alert.alert('Inscrit !', 'Tu es dans le match !');
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  // ── Leave match ────────────────────────────────────────────────────────────
  function handleLeave(userId: string, onSuccess: () => void): void {
    if (!selectedMatch) return;
    Alert.alert('Quitter le match', 'Tu veux vraiment quitter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase
              .from('match_players')
              .delete()
              .eq('match_id', selectedMatch.id)
              .eq('user_id', userId);

            const newCount = Math.max(0, matchPlayers.length - 1);
            await supabase
              .from('matches')
              .update({ current_players: newCount })
              .eq('id', selectedMatch.id);

            cancelMatchReminder(selectedMatch.id);
            setMyMatches((prev) => prev.filter((id) => id !== selectedMatch.id));
            onSuccess();
          } catch (e: unknown) {
            Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inconnue');
          }
        },
      },
    ]);
  }

  // ── Share match ────────────────────────────────────────────────────────────
  async function handleShare(): Promise<void> {
    if (!selectedMatch) return;
    try {
      const spots = selectedMatch.max_players - selectedMatch.current_players;
      const spotsText =
        spots === 0
          ? 'Complet'
          : spots === 1
          ? 'Dernière place !'
          : `${spots} places restantes`;
      const date = new Date(selectedMatch.scheduled_at).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
      await Share.share({
        message: `⚽ ${selectedMatch.title}\n📍 ${selectedMatch.venue?.name ?? 'Terrain'}, ${selectedMatch.venue?.city ?? ''}\n📅 ${date}\n👥 ${selectedMatch.current_players}/${selectedMatch.max_players} joueurs · ${spotsText}\n\nRejoins-nous gratuitement sur FootMatch !`,
        title: selectedMatch.title,
      });
    } catch {
      // ignore — partage annulé
    }
  }

  // ── Share profile ──────────────────────────────────────────────────────────
  async function handleShareProfile(user: AppUser, matchCount: number): Promise<void> {
    try {
      const rank = user.reputation_rank ?? 'D4';
      const score = user.reputation_score ?? 0;
      await Share.share({
        message: `${user.pseudo} sur FootMatch\nRang : ${rank} · ${score} pts\n${matchCount} match${matchCount > 1 ? 's' : ''} joué${matchCount > 1 ? 's' : ''}\n\nRejoins-moi sur FootMatch — trouve un match en 30 secondes !`,
        title: `Profil FootMatch — ${user.pseudo}`,
      });
    } catch {
      // ignore
    }
  }

  // ── Rate match ─────────────────────────────────────────────────────────────
  async function handleRate(matchId: string, rating: number, userId: string): Promise<void> {
    setRatingLoading(true);
    try {
      const { error } = await supabase
        .from('match_ratings')
        .upsert({ match_id: matchId, user_id: userId, rating }, { onConflict: 'match_id,user_id' });
      if (error) throw error;
      setMyRatings((prev) => ({ ...prev, [matchId]: rating }));
      Alert.alert('Merci !', 'Ta note a été enregistrée !');
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setRatingLoading(false);
    }
  }

  // ── Create match ───────────────────────────────────────────────────────────
  async function handleCreateMatch(
    params: CreateMatchParams,
    userId: string,
    onSuccess: () => void,
  ): Promise<void> {
    if (!params.title.trim()) { Alert.alert('Erreur', 'Donne un nom au match'); return; }
    if (!params.venueId) { Alert.alert('Erreur', 'Choisis un terrain'); return; }
    if (!params.date || !params.time) { Alert.alert('Erreur', 'Choisis une date et heure'); return; }
    if (parseInt(params.maxPlayers) < 2) { Alert.alert('Erreur', 'Il faut au moins 2 joueurs'); return; }
    if (!ensureCleanContent(params.title, 'ce titre')) return;
    if (params.description.trim() && !ensureCleanContent(params.description, 'cette description')) return;

    const [day, month, year] = params.date.split('/');
    const scheduledAt = new Date(`${year}-${month}-${day}T${params.time}:00`).toISOString();
    if (isNaN(new Date(scheduledAt).getTime())) {
      Alert.alert('Erreur', 'Format de date invalide (JJ/MM/AAAA HH:MM)');
      return;
    }
    if (new Date(scheduledAt) <= new Date()) {
      Alert.alert('Erreur', 'La date doit être dans le futur');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          title: params.title.trim(),
          type: params.type,
          venue_id: params.venueId,
          organizer_id: userId,
          scheduled_at: scheduledAt,
          max_players: parseInt(params.maxPlayers),
          current_players: 1,
          price_per_player: 0,
          level: 'Tous niveaux',
          description: params.description,
          is_private: params.isPrivate,
          status: 'open',
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('match_players').insert({
        match_id: data.id,
        user_id: userId,
        status: 'confirmed',
      });

      scheduleMatchReminder(data.title, new Date(data.scheduled_at), data.id, true);
      setMyMatches((prev) => [...prev, data.id]);
      Alert.alert('Match créé !', 'Ton match est en ligne !');
      onSuccess();
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return {
    selectedMatch,
    setSelectedMatch,
    matchPlayers,
    myMatches,
    myCreatedMatches,
    myRatings,
    loading,
    refreshing,
    matchesLoaded,
    liveStats,
    toRateCount,
    loadMatches,
    loadMatchDetail,
    loadMyMatches,
    loadLiveStats,
    handleJoin,
    handleLeave,
    handleShare,
    handleShareProfile,
    handleRate,
    handleCreateMatch,
    setRatingLoading,
    ratingLoading,
  };
}
