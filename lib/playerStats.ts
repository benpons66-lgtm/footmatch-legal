import { supabase } from './supabase';

export interface ComputedPlayerStats {
  matchesPlayed: number;
  matchesOrganized: number;
  ratingsGiven: number;
  avgRating: number | null;
  ratingsReceivedCount: number;
  goodRatingsReceived: number;
  noShows: number;
}

export function isSeededProfileId(id?: string | null): boolean {
  return !!id && id.startsWith('fa');
}

export const MAX_FAKE_REPUTATION_SCORE = 1499;

export function capFakeReputationScore(score: number): number {
  return Math.max(0, Math.min(score, MAX_FAKE_REPUTATION_SCORE));
}

export function computeReputationScoreFromStats(stats: ComputedPlayerStats): number {
  return Math.max(
    0,
    stats.matchesPlayed * 200 +
      stats.matchesOrganized * 700 +
      stats.ratingsGiven * 80 +
      stats.goodRatingsReceived * 150 -
      stats.noShows * 1000
  );
}

export function getVisibleActivityCount(stats: ComputedPlayerStats | null | undefined): number {
  if (!stats) return 0;
  return (
    (stats.matchesPlayed ?? 0) +
    (stats.matchesOrganized ?? 0) +
    (stats.ratingsGiven ?? 0) +
    (stats.ratingsReceivedCount ?? 0)
  );
}

export function hasVisibleActivity(stats: ComputedPlayerStats | null | undefined): boolean {
  return getVisibleActivityCount(stats) > 0;
}

export function isLaunchCommunityProfile(profileId: string, stats: ComputedPlayerStats | null | undefined): boolean {
  return isSeededProfileId(profileId);
}

export function getDisplayReputationScore(profileId: string, storedScore: number | null | undefined, stats: ComputedPlayerStats): number {
  if (isSeededProfileId(profileId)) return capFakeReputationScore(computeReputationScoreFromStats(stats));
  if (!hasVisibleActivity(stats)) return computeReputationScoreFromStats(stats);
  return storedScore ?? 0;
}

function createEmptyStats(): ComputedPlayerStats {
  return {
    matchesPlayed: 0,
    matchesOrganized: 0,
    ratingsGiven: 0,
    avgRating: null,
    ratingsReceivedCount: 0,
    goodRatingsReceived: 0,
    noShows: 0,
  };
}

export async function fetchComputedStatsForUsers(userIds: string[]): Promise<Record<string, ComputedPlayerStats>> {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  const statsByUser: Record<string, ComputedPlayerStats> = {};

  ids.forEach((id) => {
    statsByUser[id] = createEmptyStats();
  });

  if (ids.length === 0) return statsByUser;

  const [matchPlayersRes, matchesRes, ratingsGivenRes, ratingsReceivedRes, noShowsRes] = await Promise.all([
    supabase.from('match_players').select('user_id').in('user_id', ids).eq('status', 'confirmed'),
    supabase.from('matches').select('organizer_id').in('organizer_id', ids).neq('status', 'cancelled'),
    supabase.from('match_ratings').select('user_id, rating').in('user_id', ids),
    (async () => {
      const res = await supabase.from('match_ratings').select('rated_user_id, rating').in('rated_user_id', ids);
      if (!res.error) return res;
      return { data: [], error: null } as any;
    })(),
    (async () => {
      const res = await supabase.from('no_show_reports').select('reported_user').in('reported_user', ids);
      if (!res.error) return res;
      return { data: [], error: null } as any;
    })(),
  ]);

  (matchPlayersRes.data ?? []).forEach((row: any) => {
    if (statsByUser[row.user_id]) statsByUser[row.user_id].matchesPlayed += 1;
  });

  (matchesRes.data ?? []).forEach((row: any) => {
    if (statsByUser[row.organizer_id]) statsByUser[row.organizer_id].matchesOrganized += 1;
  });

  (ratingsGivenRes.data ?? []).forEach((row: any) => {
    if (statsByUser[row.user_id]) statsByUser[row.user_id].ratingsGiven += 1;
  });

  const receivedBuckets: Record<string, { total: number; count: number; good: number }> = {};
  (ratingsReceivedRes.data ?? []).forEach((row: any) => {
    if (!row.rated_user_id) return;
    const bucket = receivedBuckets[row.rated_user_id] ?? { total: 0, count: 0, good: 0 };
    bucket.total += row.rating ?? 0;
    bucket.count += 1;
    if ((row.rating ?? 0) >= 4) bucket.good += 1;
    receivedBuckets[row.rated_user_id] = bucket;
  });

  Object.entries(receivedBuckets).forEach(([userId, bucket]) => {
    if (!statsByUser[userId]) return;
    statsByUser[userId].ratingsReceivedCount = bucket.count;
    statsByUser[userId].goodRatingsReceived = bucket.good;
    statsByUser[userId].avgRating = bucket.count > 0 ? Math.round((bucket.total / bucket.count) * 10) / 10 : null;
  });

  (noShowsRes.data ?? []).forEach((row: any) => {
    if (statsByUser[row.reported_user]) statsByUser[row.reported_user].noShows += 1;
  });

  return statsByUser;
}
