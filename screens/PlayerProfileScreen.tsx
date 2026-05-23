import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, StatusBar, Platform, Share, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, Radius } from '../constants/theme';
import { getLevelFromScore } from '../components/ReputationBadge';
import { fetchComputedStatsForUsers, getDisplayReputationScore } from '../lib/playerStats';
import PlayerCard from '../components/PlayerCard';
import Copyright from '../components/Copyright';

interface Disponibilite {
  jour:  string;
  debut: string;
  fin:   string;
}

interface Props {
  playerId: string;
  currentUserId: string | null;
  isBlocked?: boolean;
  onBack: () => void;
  onInvite: () => void;
  onToggleBlock?: () => void;
  /** Stats réelles de l'utilisateur connecté (source de vérité = profil perso).
   *  Utilisées uniquement quand playerId === currentUserId. */
  currentUserStats?: {
    matchesPlayed: number;
    matchesOrganized: number;
  };
}

interface ProfileData {
  id:               string;
  pseudo:           string;
  reputation_score: number | null;
  created_at:       string;
  birth_date?:      string | null;
  skill?:           string | null;
  disponibilites?:  Disponibilite[] | null;
  city?:            string | null;
  postal_code?:     string | null;
  goals?:           number | null;
  assists?:         number | null;
  instagram?:       string | null;
  tiktok?:          string | null;
}

export default function PlayerProfileScreen({ playerId, currentUserId, isBlocked = false, onBack, onInvite, onToggleBlock, currentUserStats }: Props) {

  // Toujours démarrer en état de chargement : on n'affiche jamais de données
  // périmées d'un autre joueur. Le cache sert uniquement à accélérer le fetch,
  // pas à pré-remplir l'UI.
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState({
    matchesPlayed:        0,
    matchesOrganized:     0,
    ratingsReceivedCount: 0,
    avgRating:            null as number | null,
  });
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    loadProfile();
  }, [playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfile() {
    try {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, pseudo, reputation_score, created_at, birth_date, skill, disponibilites, city, postal_code, goals, assists, instagram, tiktok')
        .eq('id', playerId)
        .single();

      if (!p) {
        setProfile(null);
        return;
      }

      const computed = (await fetchComputedStatsForUsers([playerId]))[playerId];
      setProfile({ ...p, city: p.city ?? 'Perpignan', postal_code: p.postal_code ?? '66000' });
      const isCurrentUser = playerId === currentUserId;
      setStats({
        // Pour l'utilisateur connecté, utiliser les stats du profil perso (inclut matchs futurs)
        matchesPlayed:        (isCurrentUser && currentUserStats) ? currentUserStats.matchesPlayed    : computed?.matchesPlayed    ?? 0,
        matchesOrganized:     (isCurrentUser && currentUserStats) ? currentUserStats.matchesOrganized : computed?.matchesOrganized ?? 0,
        ratingsReceivedCount: computed?.ratingsReceivedCount ?? 0,
        avgRating:            computed?.avgRating ?? null,
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
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;
  const age = profile.birth_date
    ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  function buildSocialUrl(platform: 'instagram' | 'tiktok', handle: string): string {
    // Accepte pseudo (@nom ou nom) ou URL complète
    const clean = handle.trim().replace(/^@/, '');
    if (platform === 'instagram') {
      return clean.startsWith('http') ? clean : `https://www.instagram.com/${clean}/`;
    }
    return clean.startsWith('http') ? clean : `https://www.tiktok.com/@${clean}`;
  }

  async function openSocial(platform: 'instagram' | 'tiktok', handle: string) {
    const url = buildSocialUrl(platform, handle);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch {
      // Erreur silencieuse
    }
  }

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
            matchesPlayed:    stats.matchesPlayed,
            matchesOrganized: stats.matchesOrganized,
            avgRating:        stats.avgRating,
            ratingsGiven:     stats.ratingsReceivedCount,
            noShows:          0,
            goals:            profile.goals   ?? 0,
            assists:          profile.assists ?? 0,
            skill:            profile.skill   ?? null,
          }}
        />

        {/* Infos joueur + disponibilités fusionnées */}
        <View style={s.infoCard}>
          <Text style={s.infoCardName}>{profile.pseudo}</Text>

          {/* Ville + CP — toujours visible, fallback si absent */}
          <View style={s.infoCardRow}>
            <Ionicons name="location-outline" size={13} color={(profile.city || profile.postal_code) ? Colors.textMuted : Colors.textDim} />
            {(profile.city || profile.postal_code) ? (
              <Text style={s.infoCardRowText}>
                {[profile.city, profile.postal_code].filter(Boolean).join(' · ')}
              </Text>
            ) : (
              <Text style={s.infoCardRowTextDim}>Ville non renseignée</Text>
            )}
          </View>

          {memberSince && (
            <View style={s.infoCardRow}>
              <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
              <Text style={s.infoCardRowText}>Membre depuis {memberSince}</Text>
            </View>
          )}

          {age !== null && (
            <View style={s.infoCardRow}>
              <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
              <Text style={s.infoCardRowText}>{age} ans</Text>
            </View>
          )}

          <View style={s.infoCardDivider} />

          {/* Titre section disponibilités */}
          <View style={s.infoCardDispoHeader}>
            <Ionicons name="calendar-outline" size={13} color={Colors.green} />
            <Text style={s.infoCardDispoHeaderText}>Disponibilités habituelles</Text>
          </View>

          {(() => {
            const dispos: Disponibilite[] = Array.isArray(profile.disponibilites) ? profile.disponibilites : [];
            if (dispos.length === 0) {
              return <Text style={s.infoCardDispoEmpty}>Disponibilités non renseignées</Text>;
            }
            const first2 = dispos.slice(0, 2).map(d => `${d.jour} ${d.debut}-${d.fin}`).join(' · ');
            const extra = dispos.length > 2 ? ` …+${dispos.length - 2}` : '';
            return <Text style={s.infoCardDispoText} numberOfLines={2}>{first2 + extra}</Text>;
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



        {/* ── Réseaux sociaux (si renseignés) ── */}
        {(profile.instagram || profile.tiktok) && (
          <View style={s.socialRow}>
            {profile.instagram && (
              <TouchableOpacity
                style={s.socialBtnInstagram}
                onPress={() => openSocial('instagram', profile!.instagram!)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Voir ${profile.pseudo} sur Instagram`}
              >
                <Ionicons name="logo-instagram" size={18} color="#fff" />
                <Text style={s.socialBtnText}>Instagram</Text>
              </TouchableOpacity>
            )}
            {profile.tiktok && (
              <TouchableOpacity
                style={s.socialBtnTiktok}
                onPress={() => openSocial('tiktok', profile!.tiktok!)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Voir ${profile.pseudo} sur TikTok`}
              >
                <Ionicons name="musical-notes" size={18} color="#fff" />
                <Text style={s.socialBtnText}>TikTok</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Copyright />
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
  // Carte info + disponibilités fusionnées
  infoCard:              { width: '100%', backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(0,230,118,0.15)', padding: Spacing.lg, gap: 10, alignItems: 'center' },
  infoCardName:          { fontSize: 20, fontWeight: '900', color: Colors.text, textAlign: 'center', marginBottom: 2 },
  infoCardRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  infoCardRowText:       { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  infoCardRowTextDim:    { fontSize: 12, color: Colors.textDim, fontStyle: 'italic' },
  infoCardDivider:       { height: 1, backgroundColor: 'rgba(0,230,118,0.08)', marginVertical: 2, width: '100%' },
  infoCardDispoHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  infoCardDispoHeaderText: { fontSize: 12, fontWeight: '800', color: Colors.text },
  infoCardDispoEmpty:    { fontSize: 12, color: Colors.textDim, fontStyle: 'italic', textAlign: 'center' },
  infoCardDispoText:     { fontSize: 12, color: Colors.green, fontWeight: '600', textAlign: 'center' },
  // ── Boutons d'action (autre joueur) ─────────────────────────────────────────
  inviteBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.green, borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: 24, width: '100%' },
  inviteBtnText:    { fontSize: 15, fontWeight: '800', color: '#000' },
  actionRow:        { flexDirection: 'row', gap: 10, width: '100%' },
  shareBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.bg3, borderRadius: Radius.full, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  shareBtnText:     { fontSize: 13, fontWeight: '700', color: Colors.green },
  blockBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.bg3, borderRadius: Radius.full, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,138,138,0.30)' },
  blockBtnActive:   { borderColor: Colors.greenBorder, backgroundColor: Colors.greenDim },
  blockBtnText:     { fontSize: 13, fontWeight: '700', color: '#FF8A8A' },
  blockBtnTextActive: { color: Colors.green },
  backBtnCenter:    { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full, backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border },
  backBtnCenterText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  // ── Réseaux sociaux ──────────────────────────────────────────────────────────
  socialRow:           { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  socialBtnInstagram:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#C13584', borderRadius: Radius.full, paddingVertical: 12, paddingHorizontal: 14 },
  socialBtnTiktok:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#010101', borderRadius: Radius.full, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  socialBtnText:       { fontSize: 13, fontWeight: '700', color: '#fff' },
});