import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, StatusBar, Platform, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius } from '../constants/theme';
import { getLevelConfig, getLevelFromScore, getLevelProgress } from '../components/ReputationBadge';
import { fetchComputedStatsForUsers, getDisplayReputationScore } from '../lib/playerStats';
import PlayerCard from '../components/PlayerCard';
import { getCachedPlayer } from './PlayersScreen';

interface Disponibilite {
  jour:  string;
  debut: string;
  fin:   string;
}

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

interface ProfileData {
  id:               string;
  pseudo:           string;
  reputation_score: number | null;
  created_at:       string;
  skill?:           string | null;
  disponibilites?:  Disponibilite[] | null;
  city?:            string | null;
  postal_code?:     string | null;
}

export default function PlayerProfileScreen({ playerId, currentUserId, isBlocked = false, onBack, onInvite, onToggleBlock }: Props) {
  const cached = getCachedPlayer(playerId);

  const [loading, setLoading] = useState(!cached);
  const [profile, setProfile] = useState<ProfileData | null>(
    cached ? { id: cached.id, pseudo: cached.pseudo, reputation_score: cached.reputation, created_at: '', skill: null } : null
  );
  const [stats, setStats] = useState({
    matchesPlayed:        cached?.matchesPlayed ?? 0,
    matchesOrganized:     0,
    ratingsReceivedCount: 0,
  });
  const [displayScore, setDisplayScore] = useState(cached?.reputation ?? 0);

  useEffect(() => {
    loadProfile();
  }, [playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfile() {
    try {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, pseudo, reputation_score, created_at, skill, disponibilites, city, postal_code')
        .eq('id', playerId)
        .single();

      if (!p) {
        if (!cached) setProfile(null);
        return;
      }

      const computed = (await fetchComputedStatsForUsers([playerId]))[playerId];
      setProfile(p);
      setStats({
        matchesPlayed:        computed?.matchesPlayed ?? 0,
        matchesOrganized:     computed?.matchesOrganized ?? 0,
        ratingsReceivedCount: computed?.ratingsReceivedCount ?? 0,
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

  async function handleSharePlayer() {
    try {
      const profileLink = `https://footmatch.app/joueur/${profile!.id}`;
      await Share.share({
        message: `Découvre ${profile!.pseudo} sur FootMatch !\n⚽ ${rank} · ${score} pts\n\n👉 ${profileLink}\n🆓 Télécharge FootMatch — trouve un match en 30 secondes !`,
        title: `Profil FootMatch — ${profile!.pseudo}`,
        url: profileLink,
      });
    } catch {
      // Partage annulé ou erreur silencieuse
    }
  }

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
          {/* Badge niveau — on affiche uniquement le rang (ex: D2) sans "District —" */}
          <View style={[s.levelBadge, { backgroundColor: cfg.bgColor, borderColor: cfg.borderColor }]}>
            <Text style={[s.levelBadgeText, { color: cfg.color }]}>{rank}</Text>
          </View>
          {/* Ville et code postal à la place de "Progression" */}
          {(profile.city || profile.postal_code) && (
            <View style={s.locationBadge}>
              <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
              <Text style={s.locationBadgeText}>
                {[profile.city, profile.postal_code].filter(Boolean).join(' · ')}
              </Text>
            </View>
          )}
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

        {/* ── Disponibilités habituelles (affichage complet) ── */}
        <View style={s.dispoCard}>
          <View style={s.dispoHeader}>
            <Ionicons name="calendar-outline" size={15} color={Colors.green} />
            <Text style={s.dispoTitle}>Disponibilités habituelles</Text>
          </View>
          {(() => {
            const dispos: Disponibilite[] = Array.isArray(profile.disponibilites) ? profile.disponibilites : [];
            if (dispos.length === 0) {
              return (
                <Text style={s.dispoEmpty}>Aucun créneau renseigné par ce joueur</Text>
              );
            }
            return dispos.map(d => (
              <View key={d.jour} style={s.dispoRow}>
                <Text style={s.dispoJour}>{d.jour}</Text>
                <Text style={s.dispoCren}>{d.debut} → {d.fin}</Text>
              </View>
            ));
          })()}
        </View>

        {currentUserId && currentUserId !== playerId && (
          <>
            <TouchableOpacity style={s.inviteBtn} onPress={onInvite} activeOpacity={0.85}>
              <Ionicons name="add-circle" size={20} color="#000" />
              <Text style={s.inviteBtnText}>Inviter a un match</Text>
            </TouchableOpacity>
            {/* Rangée Partager + Bloquer */}
            <View style={s.actionRow}>
              <TouchableOpacity style={s.shareBtn} onPress={handleSharePlayer} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Partager le profil de ${profile.pseudo}`}>
                <Ionicons name="share-social-outline" size={18} color={Colors.green} />
                <Text style={s.shareBtnText}>Partager</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.blockBtn, isBlocked && s.blockBtnActive]} onPress={onToggleBlock} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={isBlocked ? 'Débloquer ce joueur' : 'Bloquer ce joueur'}>
                <Ionicons name={isBlocked ? 'checkmark-circle' : 'ban'} size={18} color={isBlocked ? Colors.green : '#FF8A8A'} />
                <Text style={[s.blockBtnText, isBlocked && s.blockBtnTextActive]}>
                  {isBlocked ? 'Débloqué' : 'Bloquer'}
                </Text>
              </TouchableOpacity>
            </View>
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
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  locationBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  memberSince: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  // Disponibilités
  dispoCard:   { width: '100%', backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(0,230,118,0.15)', padding: Spacing.lg, gap: 8 },
  dispoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dispoTitle:  { fontSize: 13, fontWeight: '800', color: Colors.text },
  dispoEmpty:  { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },
  dispoRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dispoJour:   { fontSize: 13, fontWeight: '800', color: Colors.green, width: 34 },
  dispoCren:   { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  // ── Boutons d'action (autre joueur) ────────────────────────────────────────
  inviteBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.green, borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: 24, width: '100%' },
  inviteBtnText:    { fontSize: 15, fontWeight: '800', color: '#000' },
  actionRow:        { flexDirection: 'row', gap: 10, width: '100%' },
  shareBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.bg3, borderRadius: Radius.full, paddingVertical: 12, borderWidth: 1, borderColor: Colors.greenBorder },
  shareBtnText:     { fontSize: 14, fontWeight: '700', color: Colors.green },
  blockBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.bg3, borderRadius: Radius.full, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,138,138,0.25)' },
  blockBtnActive:   { borderColor: Colors.greenBorder, backgroundColor: Colors.greenDim },
  blockBtnText:     { fontSize: 14, fontWeight: '700', color: '#FF8A8A' },
  blockBtnTextActive: { color: Colors.green },

  // Ecran joueur introuvable
  backBtnCenter:      { marginTop: 24, backgroundColor: Colors.greenDim, borderRadius: Radius.full, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(0,230,118,0.40)' },
  backBtnCenterText:  { color: Colors.green, fontWeight: '700' },
});
