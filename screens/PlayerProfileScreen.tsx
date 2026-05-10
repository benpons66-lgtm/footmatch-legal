import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius } from '../constants/theme';
import { getLevelConfig, getLevelFromScore, getLevelProgress } from '../components/ReputationBadge';
import { fetchComputedStatsForUsers, getDisplayReputationScore, isSeededProfileId } from '../lib/playerStats';
import PlayerCard from '../components/PlayerCard';

const SKILL_LABELS: Record<string, string> = {
  vitesse: 'Vitesse',
  dribbles: 'Dribbles',
  physique: 'Physique',
  '2pieds': '2 Pieds',
  technique: 'Technique',
  tete: 'Tete',
  gardien: 'Gardien',
  vision: 'Vision',
};

interface Props {
  playerId: string;
  currentUserId: string | null;
  isBlocked?: boolean;
  onBack: () => void;
  onInvite: () => void;
  onToggleBlock?: () => void;
}

export default function PlayerProfileScreen({ playerId, currentUserId, isBlocked = false, onBack, onInvite, onToggleBlock }: Props) {
  const [loading, setLoading] = useState(true);
  interface ProfileData {
    id: string;
    pseudo: string;
    reputation_score: number | null;
    created_at: string;
    skill?: string | null;
  }
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState({ matchesPlayed: 0, matchesOrganized: 0, ratingsReceivedCount: 0, goals: 0, assists: 0 });
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    loadProfile();
  }, [playerId]);

  async function loadProfile() {
    setLoading(true);
    try {
      // ── Joueur Supabase (seed unifié, id commence par 'fa') ───────────────
      const { data: p } = await supabase
        .from('profiles')
        .select('id, pseudo, reputation_score, created_at, skill')
        .eq('id', playerId)
        .single();

      if (!p || !isSeededProfileId(p.id)) {
        setProfile(null);
        return;
      }

      const computed = (await fetchComputedStatsForUsers([playerId]))[playerId];
      setProfile(p);
      setStats({
        matchesPlayed:        computed?.matchesPlayed ?? 0,
        matchesOrganized:     computed?.matchesOrganized ?? 0,
        ratingsReceivedCount: computed?.ratingsReceivedCount ?? 0,
        goals:                0,
        assists:              0,
      });
      setDisplayScore(getDisplayReputationScore(playerId, p.reputation_score, computed));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color={Colors.green} size="large" />
        <Text style={{ color: Colors.textMuted, marginTop: 12 }}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center', padding: 40 }]}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="person-outline" size={56} color={Colors.textMuted} />
        <Text style={{ color: Colors.text, fontSize: 18, fontWeight: '700', marginTop: 16 }}>Joueur introuvable</Text>
        <TouchableOpacity style={s.backBtnCenter} onPress={onBack}>
          <Text style={s.backBtnCenterText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const score = displayScore;
  const rank = getLevelFromScore(score);
  const cfg = getLevelConfig(rank);
  const levelProgress = getLevelProgress(score);
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.green} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>PROFIL JOUEUR</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Carte joueur */}
        <PlayerCard
          pseudo={profile.pseudo}
          rank={rank}
          score={score}
          stats={{
            matchesPlayed: stats.matchesPlayed,
            matchesOrganized: stats.matchesOrganized,
            avgRating: null,
            ratingsGiven: stats.ratingsReceivedCount,
            noShows: 0,
          }}
        />

        {/* Infos joueur sous la carte */}
        <View style={[s.playerInfoCard, { borderColor: cfg.color + '30' }]}>
          <Text style={[s.pseudo, { color: cfg.color }]}>{profile.pseudo}</Text>
          <View style={[s.levelBadge, { backgroundColor: cfg.bgColor, borderColor: cfg.borderColor }]}>
            <Text style={[s.levelBadgeText, { color: cfg.color }]}>{cfg.tier} — {rank}</Text>
          </View>
          {profile.skill && (
            <View style={s.skillBadge}>
              <Text style={s.skillBadgeText}>{SKILL_LABELS[profile.skill] ?? profile.skill}</Text>
            </View>
          )}
          {levelProgress.next && (
            <View style={{ width: '100%', gap: 4, marginTop: 4 }}>
              <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${levelProgress.progress}%` as `${number}%`, backgroundColor: cfg.color, borderRadius: 2 }} />
              </View>
              <Text style={{ fontSize: 10, color: cfg.color, textAlign: 'center', fontWeight: '700', opacity: 0.8 }}>
                {levelProgress.pointsToNext} pts avant {levelProgress.next}
              </Text>
            </View>
          )}
          {memberSince && <Text style={s.memberSince}>Membre depuis {memberSince}</Text>}
        </View>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={[s.statN, { color: Colors.green }]}>{stats.matchesPlayed}</Text>
            <Text style={s.statL}>Matchs joues</Text>
          </View>
          <View style={[s.statBox, s.statBoxMiddle]}>
            <Text style={[s.statN, { color: Colors.greenLight }]}>{stats.matchesOrganized}</Text>
            <Text style={s.statL}>Organises</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statN, { color: Colors.green }]}>{stats.ratingsReceivedCount}</Text>
            <Text style={s.statL}>Matchs notes</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={[s.statN, { color: Colors.greenLight }]}>{stats.goals}</Text>
            <Text style={s.statL}>Buts</Text>
          </View>
          <View style={[s.statBox, s.statBoxMiddle]}>
            <Text style={[s.statN, { color: Colors.green }]}>{stats.assists}</Text>
            <Text style={s.statL}>Passes d.</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statN, { color: Colors.green }]}>{score}</Text>
            <Text style={s.statL}>Points</Text>
          </View>
        </View>

        {currentUserId && currentUserId !== playerId && (
          <>
            <TouchableOpacity style={s.inviteBtn} onPress={onInvite} activeOpacity={0.85}>
              <Ionicons name="add-circle" size={20} color="#000" />
              <Text style={s.inviteBtnText}>Inviter a un match</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.blockBtn, isBlocked && s.blockBtnActive]} onPress={onToggleBlock} activeOpacity={0.8}>
              <Ionicons name={isBlocked ? 'checkmark-circle' : 'ban'} size={18} color={isBlocked ? Colors.green : '#FF8A8A'} />
              <Text style={[s.blockBtnText, isBlocked && s.blockBtnTextActive]}>
                {isBlocked ? 'Joueur bloque' : 'Bloquer ce joueur'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTitle: { fontSize: 14, fontWeight: '900', color: Colors.text, letterSpacing: 1.5, textTransform: 'uppercase' },
  backBtn: { padding: 4 },
  scroll: { padding: Spacing.xl, gap: 16, alignItems: 'center' },
  playerInfoCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: 20, alignItems: 'center', gap: 10, width: '100%', borderWidth: 1 },
  pseudo: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  levelBadge: { borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1 },
  levelBadgeText: { fontSize: 12, fontWeight: '700' },
  skillBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,230,118,0.08)', borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(0,230,118,0.30)' },
  skillBadgeText: { fontSize: 13, fontWeight: '800', color: Colors.greenLight },
  memberSince: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', width: '100%', backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4 },
  statBoxMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statN: { fontSize: 22, fontWeight: '900' },
  statL: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', textAlign: 'center' },
  rankCard: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1 },
  rankName: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  rankScore: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.green, borderRadius: Radius.full, paddingVertical: 15, paddingHorizontal: 32, alignSelf: 'center', marginTop: 8 },
  inviteBtnText: { fontSize: 16, fontWeight: '900', color: '#000' },
  blockBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,138,138,0.10)', borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: 24, borderWidth: 1, borderColor: 'rgba(255,138,138,0.25)' },
  blockBtnActive: { backgroundColor: Colors.greenDim, borderColor: Colors.greenBorder },
  blockBtnText: { fontSize: 14, fontWeight: '800', color: '#FF8A8A' },
  blockBtnTextActive: { color: Colors.green },
  backBtnCenter: { marginTop: 24, backgroundColor: Colors.greenDim, borderRadius: Radius.full, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: Colors.green + '40' },
  backBtnCenterText: { color: Colors.green, fontWeight: '700' },
});
