// components/PlayerCard.tsx — FootMatch Carte Joueur
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLevelConfig, getLevelProgress } from './ReputationBadge';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.88, 360);

// ─── Score FIFA-style par grade ───────────────────────────────────────────────
export const CARD_SCORES: Record<string, number> = {
  D4: 50, D3: 60, D2: 62, D1: 65,
  R3: 70, R2: 75, R1: 80,
  N3: 84, N2: 87, N1: 90,
  'Ligue 2': 92, 'Ligue 1': 94,
  'Serie A': 96, 'Bundesliga': 97, 'Liga': 98, 'Premier League': 99,
  'Ligue des Champions': 104, 'Euro': 108, 'Coupe du Monde': 115,
  'GOAT': 120,
};

// ─── Labels skill ─────────────────────────────────────────────────────────────
const SKILL_LABELS: Record<string, string> = {
  vitesse:   'Vitesse',
  dribbles:  'Dribbles',
  physique:  'Physique',
  '2pieds':  '2 Pieds',
  technique: 'Technique',
  tete:      'Tête',
  gardien:   'Gardien',
  vision:    'Vision',
};

const SKILL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  vitesse:   'flash-outline',
  dribbles:  'git-branch-outline',
  physique:  'barbell-outline',
  '2pieds':  'swap-horizontal-outline',
  technique: 'trophy-outline',
  tete:      'ellipse-outline',
  gardien:   'shield-checkmark-outline',
  vision:    'eye-outline',
};

// ─── Tier / grade ─────────────────────────────────────────────────────────────
function getTierDisplay(rank: string): { tier: string; grade: string } {
  if (['D4','D3','D2','D1'].includes(rank)) return { tier: 'DISTRICT', grade: rank };
  if (['R3','R2','R1'].includes(rank))      return { tier: 'RÉGIONAL', grade: rank };
  if (['N3','N2','N1'].includes(rank))      return { tier: 'NATIONAL', grade: rank };
  if (rank === 'Ligue 2')  return { tier: 'PRO', grade: 'L.2' };
  if (rank === 'Ligue 1')  return { tier: 'PRO', grade: 'L.1' };
  if (rank === 'Serie A')  return { tier: 'PRO', grade: 'S.A' };
  if (rank === 'Bundesliga') return { tier: 'PRO', grade: 'BDL' };
  if (rank === 'Liga')     return { tier: 'PRO', grade: 'LIGA' };
  if (rank === 'Premier League') return { tier: 'ÉLITE', grade: 'P.L' };
  if (rank === 'Ligue des Champions') return { tier: 'ÉLITE', grade: 'LDC' };
  if (rank === 'Euro')     return { tier: 'ÉLITE', grade: 'EURO' };
  if (rank === 'Coupe du Monde') return { tier: 'ÉLITE', grade: 'CDM' };
  return { tier: 'LÉGENDAIRE', grade: 'GOAT' };
}

// ─── Couleur accent par tier ──────────────────────────────────────────────────
const TIER_ACCENT: Record<string, { primary: string; secondary: string; bg: string; border: string }> = {
  DISTRICT:  { primary: '#00E676', secondary: '#00C853', bg: '#0C1C0C', border: 'rgba(0,230,118,0.32)' },
  RÉGIONAL:  { primary: '#60A5FA', secondary: '#3B82F6', bg: '#0C0F1C', border: 'rgba(96,165,250,0.32)' },
  NATIONAL:  { primary: '#34D399', secondary: '#10B981', bg: '#0A1A12', border: 'rgba(52,211,153,0.32)' },
  PRO:       { primary: '#FBBF24', secondary: '#F59E0B', bg: '#1A1400', border: 'rgba(251,191,36,0.32)' },
  ÉLITE:     { primary: '#A78BFA', secondary: '#7C3AED', bg: '#0E0A1A', border: 'rgba(167,139,250,0.32)' },
  LÉGENDAIRE:{ primary: '#F97316', secondary: '#EA580C', bg: '#1A0A00', border: 'rgba(249,115,22,0.32)' },
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface PlayerStats {
  matchesPlayed: number;
  matchesOrganized: number;
  avgRating: number | null;
  ratingsGiven: number;
  noShows: number;
  goals?: number;
  assists?: number;
  skill?: string | null;
}

interface Props {
  pseudo: string;
  rank: string;
  score: number;
  stats: PlayerStats;
  avatarId?: string;
  onPress?: () => void;
  size?: 'full' | 'mini';
  disableAnimations?: boolean;
  scale?: number;
}

// ─── Composant ────────────────────────────────────────────────────────────────
export default function PlayerCard({
  pseudo, rank, score, stats,
  onPress, size = 'full', disableAnimations = false, scale: scaleProp = 1,
}: Props) {
  const tierInfo  = getTierDisplay(rank);
  const accent    = TIER_ACCENT[tierInfo.tier] ?? TIER_ACCENT['DISTRICT'];
  const cardScore = CARD_SCORES[rank] ?? 50;
  const progress  = getLevelProgress(score);

  const isFull = size === 'full';
  const cW     = (isFull ? CARD_WIDTH : CARD_WIDTH * 0.5) * scaleProp;
  const m      = (isFull ? 1 : 0.5) * scaleProp;

  const floatY   = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (disableAnimations) return;
    Animated.loop(Animated.sequence([
      Animated.timing(floatY, { toValue: -5, duration: 2600, useNativeDriver: true }),
      Animated.timing(floatY, { toValue: 0,  duration: 2600, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(shimmerX, { toValue: 2,  duration: 1800, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(shimmerX, { toValue: -1, duration: 0,    useNativeDriver: true }),
    ])).start();
  }, [rank, disableAnimations]); // eslint-disable-line react-hooks/exhaustive-deps

  const prog      = progress.progress / 100;
  const progWidth = cW - 48 - 68 - 20;
  const fillWidth = progWidth * prog;

  const skillLabel = stats.skill ? (SKILL_LABELS[stats.skill] ?? stats.skill) : null;
  const skillIcon  = stats.skill ? (SKILL_ICONS[stats.skill]  ?? 'flash-outline') : 'flash-outline';

  const cardContent = (
    <View style={{ width: cW, paddingTop: m * 36, alignItems: 'center' }}>

      {/* ── BALL BADGE ────────────────────────────────────────────────────── */}
      <View style={[s.ballBadge, {
        width: m * 80, height: m * 80, borderRadius: m * 40,
        backgroundColor: accent.bg,
        shadowColor: '#C9A227', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7, shadowRadius: 12, elevation: 12,
        borderWidth: 2, borderColor: 'rgba(200,158,0,0.55)',
      }]}>
        <View style={[s.footballOuter, { width: m * 46, height: m * 46, borderRadius: m * 23 }]}>
          <Text style={{ fontSize: m * 30 }}>⚽</Text>
        </View>
      </View>

      {/* ── CARD ──────────────────────────────────────────────────────────── */}
      <Animated.View style={[s.card, {
        width: cW,
        backgroundColor: accent.bg,
        borderColor: accent.border,
        shadowColor: accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35, shadowRadius: 20, elevation: 16,
        transform: (!disableAnimations && isFull) ? [{ translateY: floatY }] : [],
      }]}>

        {/* Coins décoratifs */}
        {isFull && (
          <>
            <View style={[s.corner, s.cornerTL, { borderColor: accent.primary + '55' }]} />
            <View style={[s.corner, s.cornerTR, { borderColor: accent.primary + '55' }]} />
            <View style={[s.corner, s.cornerBL, { borderColor: accent.primary + '55' }]} />
            <View style={[s.corner, s.cornerBR, { borderColor: accent.primary + '55' }]} />
          </>
        )}

        {/* Ligne shimmer top */}
        <View style={[s.topLine, { backgroundColor: accent.primary + 'AA' }]} />

        {/* ── HEADER : Score + Level ─────────────────────────────────────── */}
        <View style={[s.header, { paddingHorizontal: m * 18, paddingTop: m * 14 }]}>
          <View>
            <Text style={[s.scoreNum, { fontSize: m * 88, color: accent.primary, lineHeight: m * 96 }]}>
              {cardScore}
            </Text>
            <Text style={[s.scoreLbl, { fontSize: m * 8, color: accent.primary + '66', letterSpacing: m * 4 }]}>
              SCORE
            </Text>
          </View>
          <View style={s.levelBlock}>
            <View style={[s.tierPill, { borderColor: accent.primary + '55', backgroundColor: accent.primary + '0D' }]}>
              <Text style={[s.tierPillText, { fontSize: m * 8, color: accent.primary, letterSpacing: m * 2 }]}>
                {tierInfo.tier}
              </Text>
            </View>
            <Text style={[s.gradeNum, { fontSize: m * 50, color: accent.primary, lineHeight: m * 52, letterSpacing: m * 2 }]}>
              {tierInfo.grade}
            </Text>
            <View style={[s.shieldBox, {
              width: m * 32, height: m * 32, borderRadius: m * 7,
              borderColor: accent.primary + '33', backgroundColor: accent.primary + '0D',
            }]}>
              <Ionicons name="shield-outline" size={m * 16} color={accent.primary} />
            </View>
          </View>
        </View>

        {/* ── HERO : Éclair ──────────────────────────────────────────────── */}
        {isFull && (
          <View style={s.heroZone}>
            <View style={[s.heroHalo, { backgroundColor: 'rgba(255,160,0,0.10)', width: m * 110, height: m * 38 }]} />
            <Text style={[s.boltText, { fontSize: m * 46, lineHeight: m * 50 }]}>⚡</Text>
          </View>
        )}

        {/* ── NOM ────────────────────────────────────────────────────────── */}
        <View style={[s.nameZone, { paddingHorizontal: m * 20, paddingBottom: m * 8 }]}>
          <View style={s.divider}>
            <View style={[s.divLine, { backgroundColor: accent.primary + '33' }]} />
            <View style={s.divCenter}>
              <View style={[s.divDash, { backgroundColor: accent.primary + '40' }]} />
              <View style={s.divDot} />
              <View style={[s.divDash, { backgroundColor: accent.primary + '40' }]} />
            </View>
            <View style={[s.divLine, { backgroundColor: accent.primary + '33' }]} />
          </View>
          <Text style={[s.playerName, { fontSize: m * 30, letterSpacing: m * 4 }]} numberOfLines={1}>
            {pseudo.toUpperCase()}
          </Text>
          <Text style={[s.playerSub, { fontSize: m * 10, color: accent.primary + '88', letterSpacing: m * 3 }]}>
            {tierInfo.tier} · {tierInfo.grade}
          </Text>
        </View>

        {/* ── STATS ──────────────────────────────────────────────────────── */}
        {isFull && (
          <View style={s.stats}>

            <StatRow icon="football-outline" label="Matchs joués"    sub="Total de matchs" value={stats.matchesPlayed}    accent={accent.primary} m={m} />
            <StatRow icon="calendar-outline" label="Matchs organisés" sub="Matchs créés"    value={stats.matchesOrganized} accent={accent.primary} m={m} />

            {/* Buts */}
            <View style={[s.statRow, { borderTopColor: accent.primary + '12' }]}>
              <View style={[s.statIco, { borderColor: accent.primary + '30', backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                <Text style={{ fontSize: m * 15 }}>⚽</Text>
              </View>
              <View style={s.statText}>
                <Text style={[s.statName, { fontSize: m * 13 }]}>Buts</Text>
                <Text style={[s.statSub,  { fontSize: m * 10 }]}>Saisis manuellement</Text>
              </View>
              <Text style={[s.statVal, { fontSize: m * 24, color: accent.primary }]}>{stats.goals ?? 0}</Text>
            </View>

            {/* Passes décisives */}
            <View style={[s.statRow, { borderTopColor: accent.primary + '12' }]}>
              <View style={[s.statIco, { borderColor: accent.primary + '30', backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                <Ionicons name="git-merge-outline" size={m * 16} color={accent.primary} />
              </View>
              <View style={s.statText}>
                <Text style={[s.statName, { fontSize: m * 13 }]}>Passes déc.</Text>
                <Text style={[s.statSub,  { fontSize: m * 10 }]}>Saisis manuellement</Text>
              </View>
              <Text style={[s.statVal, { fontSize: m * 24, color: accent.primary }]}>{stats.assists ?? 0}</Text>
            </View>

            {/* Skill */}
            <View style={[s.statRow, { borderTopColor: accent.primary + '12' }]}>
              <View style={[s.statIco, { borderColor: accent.primary + '30', backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                <Ionicons name={skillIcon} size={m * 16} color={accent.primary} />
              </View>
              <View style={s.statText}>
                <Text style={[s.statName, { fontSize: m * 13 }]}>Skill principal</Text>
                <Text style={[s.statSub,  { fontSize: m * 10 }]}>Caractéristique forte</Text>
              </View>
              <Text style={[s.skillVal, { fontSize: m * 13, color: accent.primary }]}>{skillLabel ?? '—'}</Text>
            </View>

            {/* Notes */}
            <View style={[s.statRow, { borderTopColor: accent.primary + '12' }]}>
              <View style={[s.statIco, { borderColor: accent.primary + '30', backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                <Ionicons name="star-outline" size={m * 16} color={accent.primary} />
              </View>
              <View style={s.statText}>
                <Text style={[s.statName, { fontSize: m * 13 }]}>Notes données</Text>
                <Text style={[s.statSub,  { fontSize: m * 10 }]}>Évaluations laissées</Text>
              </View>
              <View style={s.notesRight}>
                <View style={s.notesTop}>
                  <Text style={[s.starGold, { fontSize: m * 13 }]}>★</Text>
                  <Text style={[s.notesAvg, { fontSize: m * 24, color: accent.primary }]}>
                    {stats.avgRating != null ? stats.avgRating.toFixed(1).replace('.', ',') : '—'}
                  </Text>
                </View>
                <Text style={[s.notesCount, { fontSize: m * 10 }]}>{stats.ratingsGiven} notes</Text>
              </View>
            </View>

          </View>
        )}

        {/* ── FOOTER : barre de progression ──────────────────────────────── */}
        {isFull && (
          <View style={[s.footer, { borderTopColor: accent.primary + '12', paddingHorizontal: m * 18, paddingVertical: m * 10 }]}>
            <View style={s.progRow}>
              <View style={[s.pill, s.pillCur, { borderColor: accent.primary + '66', backgroundColor: accent.primary + '14' }]}>
                <Text style={[s.pillText, { fontSize: m * 13, color: accent.primary }]}>{tierInfo.grade}</Text>
              </View>
              <View style={[s.progTrack, { flex: 1, height: m * 6, backgroundColor: accent.primary + '15' }]}>
                <View style={[s.progFill, { width: fillWidth, backgroundColor: accent.secondary }]}>
                  {!disableAnimations && (
                    <Animated.View style={[s.progShimmer, {
                      transform: [{ translateX: shimmerX.interpolate({
                        inputRange: [-1, 2],
                        outputRange: [-fillWidth, fillWidth * 2],
                      }) }],
                    }]} />
                  )}
                  <View style={[s.progDot, {
                    width: m * 14, height: m * 14, borderRadius: m * 7,
                    backgroundColor: accent.primary, borderColor: accent.bg,
                    shadowColor: accent.primary,
                  }]} />
                </View>
              </View>
              <View style={[s.pill, s.pillNxt, { borderColor: accent.primary + '22' }]}>
                <Text style={[s.pillText, { fontSize: m * 13, color: accent.primary + '55' }]}>
                  {progress.next ?? '—'}
                </Text>
              </View>
            </View>
            <View style={s.progMeta}>
              <Text style={[s.progInfo, { fontSize: m * 11, color: accent.primary + '80' }]}>
                {score.toLocaleString('fr-FR')} pts
                {progress.next ? ` · ${progress.pointsToNext.toLocaleString('fr-FR')} pts avant ${progress.next}` : ' · Niveau max'}
              </Text>
            </View>
          </View>
        )}

      </Animated.View>
    </View>
  );

  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.90}>{cardContent}</TouchableOpacity>
    : cardContent;
}

// ─── Stat row helper ──────────────────────────────────────────────────────────
function StatRow({ icon, label, sub, value, accent, m }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; sub: string; value: number; accent: string; m: number;
}) {
  return (
    <View style={[s.statRow, { borderTopColor: accent + '12' }]}>
      <View style={[s.statIco, { borderColor: accent + '30', backgroundColor: 'rgba(0,0,0,0.35)' }]}>
        <Ionicons name={icon} size={m * 16} color={accent} />
      </View>
      <View style={s.statText}>
        <Text style={[s.statName, { fontSize: m * 13 }]}>{label}</Text>
        <Text style={[s.statSub,  { fontSize: m * 10 }]}>{sub}</Text>
      </View>
      <Text style={[s.statVal, { fontSize: m * 24, color: accent }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  ballBadge:    { position: 'absolute', top: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center' },
  footballOuter:{ alignItems: 'center', justifyContent: 'center' },
  card:         { borderRadius: 22, borderWidth: 1.5, overflow: 'hidden', position: 'relative' },
  topLine:      { position: 'absolute', top: 0, left: 0, right: 0, height: 1, zIndex: 5, opacity: 0.8 },

  corner:    { position: 'absolute', width: 16, height: 16, zIndex: 6 },
  cornerTL:  { top: 10, left: 10,  borderTopWidth: 1.5,    borderLeftWidth: 1.5,  borderTopLeftRadius: 3 },
  cornerTR:  { top: 10, right: 10, borderTopWidth: 1.5,    borderRightWidth: 1.5, borderTopRightRadius: 3 },
  cornerBL:  { bottom: 10, left: 10,  borderBottomWidth: 1.5, borderLeftWidth: 1.5,  borderBottomLeftRadius: 3 },
  cornerBR:  { bottom: 10, right: 10, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderBottomRightRadius: 3 },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  scoreNum:     { fontWeight: '900' },
  scoreLbl:     { fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  levelBlock:   { alignItems: 'flex-end', gap: 4, paddingTop: 2 },
  tierPill:     { borderRadius: 100, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  tierPillText: { fontWeight: '800', textTransform: 'uppercase' },
  gradeNum:     { fontWeight: '900' },
  shieldBox:    { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  heroZone:  { alignItems: 'center', justifyContent: 'center', paddingVertical: 4, position: 'relative' },
  heroHalo:  { position: 'absolute', borderRadius: 80 },
  boltText:  { textShadowColor: 'rgba(255,180,0,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18 },

  nameZone:   { alignItems: 'center' },
  divider:    { flexDirection: 'row', alignItems: 'center', width: '85%', marginBottom: 10 },
  divLine:    { flex: 1, height: 1 },
  divCenter:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6 },
  divDash:    { width: 12, height: 1 },
  divDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(200,155,0,0.85)', shadowColor: '#C9A227', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5 },
  playerName: { fontWeight: '900', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8, textAlign: 'center' },
  playerSub:  { fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },

  stats:   {},
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 16, borderTopWidth: 1 },
  statIco: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statText:{ flex: 1 },
  statName:{ fontWeight: '700', color: '#EAF4EE', letterSpacing: 0.1 },
  statSub: { fontWeight: '500', color: 'rgba(140,200,165,0.38)', marginTop: 2 },
  statVal: { fontWeight: '900', letterSpacing: -0.5, lineHeight: 28 },
  skillVal:{ fontWeight: '900', letterSpacing: 0.5, textAlign: 'right' },

  notesRight: { alignItems: 'flex-end' },
  notesTop:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  starGold:   { color: '#FFB800', textShadowColor: 'rgba(255,184,0,0.65)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  notesAvg:   { fontWeight: '900', letterSpacing: -0.5, lineHeight: 28 },
  notesCount: { color: 'rgba(140,200,165,0.38)', fontWeight: '500' },

  footer:      { borderTopWidth: 1 },
  progRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  progTrack:   { borderRadius: 100, overflow: 'hidden', position: 'relative' },
  progFill:    { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 100, overflow: 'hidden' },
  progShimmer: { position: 'absolute', top: 0, bottom: 0, width: 40, backgroundColor: 'rgba(255,255,255,0.30)' },
  progDot:     { position: 'absolute', right: -7, top: '50%', marginTop: -7, borderWidth: 2, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 4 },
  pill:        { borderRadius: 100, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 4 },
  pillCur:     {},
  pillNxt:     { backgroundColor: 'transparent' },
  pillText:    { fontWeight: '800', letterSpacing: 1 },
  progMeta:    { alignItems: 'center' },
  progInfo:    { fontWeight: '600', letterSpacing: 0.2 },
});
