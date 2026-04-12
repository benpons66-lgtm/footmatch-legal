import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius } from '../constants/theme';

// ─── 20 niveaux : District → GOAT ─────────────────────────────────────────────
export type FootLevel =
  'D4'|'D3'|'D2'|'D1'|
  'R3'|'R2'|'R1'|
  'N3'|'N2'|'N1'|
  'Ligue 2'|'Ligue 1'|'Serie A'|'Bundesliga'|'Liga'|'Premier League'|
  'Ligue des Champions'|'Euro'|'Coupe du Monde'|'GOAT';

export type ReputationRank = FootLevel; // backward compat alias

// ─── Barème de points (v2 : 150 événements mix = ~50 000 pts = GOAT) ──────────
// Match joué (confirmed)   : +200 pts
// Match créé (organisé)    : +700 pts
// Note donnée              : +80  pts
// Compétition créée        : +3 000 pts
// Bonne note reçue (>=4)   : +150 pts bonus
// No-show signalé          : -1 000 pts

export const LEVEL_THRESHOLDS: Array<{
  key: FootLevel; score: number; tier: string;
  color: string; bgColor: string; borderColor: string; emoji: string;
}> = [
  { key:'D4',                  score:0,     tier:'District', color:'#8B8B8B', bgColor:'rgba(139,139,139,0.10)', borderColor:'rgba(139,139,139,0.25)', emoji:'⚽' },
  { key:'D3',                  score:300,   tier:'District', color:'#9CA3AF', bgColor:'rgba(156,163,175,0.10)', borderColor:'rgba(156,163,175,0.25)', emoji:'⚽' },
  { key:'D2',                  score:750,   tier:'District', color:'#B0B7C3', bgColor:'rgba(176,183,195,0.10)', borderColor:'rgba(176,183,195,0.25)', emoji:'⚽' },
  { key:'D1',                  score:1500,  tier:'District', color:'#CDD0D8', bgColor:'rgba(205,208,216,0.10)', borderColor:'rgba(205,208,216,0.25)', emoji:'⚽' },
  { key:'R3',                  score:2500,  tier:'Régional',  color:'#93C5FD', bgColor:'rgba(147,197,253,0.10)', borderColor:'rgba(147,197,253,0.25)', emoji:'🔵' },
  { key:'R2',                  score:4000,  tier:'Régional',  color:'#60A5FA', bgColor:'rgba(96,165,250,0.10)',  borderColor:'rgba(96,165,250,0.25)',  emoji:'🔵' },
  { key:'R1',                  score:6000,  tier:'Régional',  color:'#3B82F6', bgColor:'rgba(59,130,246,0.10)',  borderColor:'rgba(59,130,246,0.25)',  emoji:'🔵' },
  { key:'N3',                  score:9000,  tier:'National',  color:'#6EE7B7', bgColor:'rgba(110,231,183,0.10)', borderColor:'rgba(110,231,183,0.25)', emoji:'🟢' },
  { key:'N2',                  score:13000, tier:'National',  color:'#34D399', bgColor:'rgba(52,211,153,0.10)',  borderColor:'rgba(52,211,153,0.25)',  emoji:'🟢' },
  { key:'N1',                  score:18000, tier:'National',  color:'#10B981', bgColor:'rgba(16,185,129,0.10)',  borderColor:'rgba(16,185,129,0.25)',  emoji:'🟢' },
  { key:'Ligue 2',             score:24000, tier:'Pro',       color:'#FDE68A', bgColor:'rgba(253,230,138,0.10)', borderColor:'rgba(253,230,138,0.25)', emoji:'⭐' },
  { key:'Ligue 1',             score:29000, tier:'Pro',       color:'#FBBF24', bgColor:'rgba(251,191,36,0.10)',  borderColor:'rgba(251,191,36,0.25)',  emoji:'⭐' },
  { key:'Serie A',             score:33500, tier:'Pro',       color:'#FB923C', bgColor:'rgba(251,146,60,0.10)',  borderColor:'rgba(251,146,60,0.25)',  emoji:'🔴' },
  { key:'Bundesliga',          score:37500, tier:'Pro',       color:'#F87171', bgColor:'rgba(248,113,113,0.10)', borderColor:'rgba(248,113,113,0.25)', emoji:'🦅' },
  { key:'Liga',                score:41000, tier:'Pro',       color:'#EF4444', bgColor:'rgba(239,68,68,0.10)',   borderColor:'rgba(239,68,68,0.25)',   emoji:'🔴' },
  { key:'Premier League',      score:44000, tier:'Pro',       color:'#DC2626', bgColor:'rgba(220,38,38,0.10)',   borderColor:'rgba(220,38,38,0.25)',   emoji:'🦁' },
  { key:'Ligue des Champions', score:46500, tier:'Élite',     color:'#C4B5FD', bgColor:'rgba(196,181,253,0.10)', borderColor:'rgba(196,181,253,0.25)', emoji:'🏆' },
  { key:'Euro',                score:48000, tier:'Élite',     color:'#A78BFA', bgColor:'rgba(167,139,250,0.10)', borderColor:'rgba(167,139,250,0.25)', emoji:'🌟' },
  { key:'Coupe du Monde',      score:49000, tier:'Élite',     color:'#7C3AED', bgColor:'rgba(124,58,237,0.10)',  borderColor:'rgba(124,58,237,0.25)',  emoji:'🌍' },
  { key:'GOAT',                score:50000, tier:'GOAT',      color:'#F97316', bgColor:'rgba(249,115,22,0.12)',  borderColor:'rgba(249,115,22,0.30)',  emoji:'🐐' },
];

export const TIER_COLOR: Record<string, string> = {
  District: '#9CA3AF',
  Régional:  '#60A5FA',
  National:  '#34D399',
  Pro:       '#FBBF24',
  Élite:     '#A78BFA',
  GOAT:      '#F97316',
};

// RANK_CONFIG rétro-compatible (clé = level key)
export const RANK_CONFIG: Record<string, { emoji:string; color:string; bgColor:string; borderColor:string; tier:string }> =
  Object.fromEntries(LEVEL_THRESHOLDS.map(l => [l.key, {
    emoji: l.emoji, color: l.color, bgColor: l.bgColor, borderColor: l.borderColor, tier: l.tier,
  }]));

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getLevelFromScore(score: number): FootLevel {
  let level: FootLevel = 'D4';
  for (const t of LEVEL_THRESHOLDS) {
    if (score >= t.score) level = t.key;
    else break;
  }
  return level;
}

export function getLevelConfig(level: string) {
  return RANK_CONFIG[level] ?? RANK_CONFIG['D4'];
}

export function getLevelColor(level: string): string {
  return getLevelConfig(level).color;
}

export function getLevelProgress(score: number): {
  current: FootLevel; next: FootLevel | null;
  progress: number; pointsToNext: number;
  currentScore: number; nextScore: number;
  tier: string;
} {
  let currentIdx = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (score >= LEVEL_THRESHOLDS[i].score) currentIdx = i;
    else break;
  }
  const cur  = LEVEL_THRESHOLDS[currentIdx];
  const next = LEVEL_THRESHOLDS[currentIdx + 1] ?? null;
  if (!next) {
    return { current: cur.key, next: null, progress: 100, pointsToNext: 0, currentScore: cur.score, nextScore: cur.score, tier: cur.tier };
  }
  const progress = Math.min(((score - cur.score) / (next.score - cur.score)) * 100, 100);
  return { current: cur.key, next: next.key, progress, pointsToNext: next.score - score, currentScore: cur.score, nextScore: next.score, tier: cur.tier };
}

// ─── Composant Badge ──────────────────────────────────────────────────────────
const SIZES: any = {
  xs: { container:{ paddingHorizontal:6,  paddingVertical:2 }, text:{ fontSize:9  } },
  sm: { container:{ paddingHorizontal:9,  paddingVertical:3 }, text:{ fontSize:11 } },
  md: { container:{ paddingHorizontal:12, paddingVertical:5 }, text:{ fontSize:13 } },
  lg: { container:{ paddingHorizontal:16, paddingVertical:8 }, text:{ fontSize:16 } },
};

interface Props {
  score:    number;
  rank:     string;
  size?:    'xs'|'sm'|'md'|'lg';
  showScore?: boolean;
  onPress?: () => void;
}

export default function ReputationBadge({ score, rank, size='sm', showScore=false, onPress }: Props) {
  const cfg = getLevelConfig(rank);
  const sz  = SIZES[size];
  const content = (
    <View style={[styles.badge, { backgroundColor:cfg.bgColor, borderColor:cfg.borderColor }, sz.container]}>
      <Text style={sz.text}>{cfg.emoji}</Text>
      <Text style={[styles.rank, sz.text, { color:cfg.color }]}>{rank}</Text>
      {showScore && <Text style={[sz.text, { color:cfg.color, opacity:0.7 }]}> · {score} pts</Text>}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{content}</TouchableOpacity>;
  return content;
}

const styles = StyleSheet.create({
  badge: { flexDirection:'row', alignItems:'center', borderRadius:999, borderWidth:1, gap:4, alignSelf:'flex-start' },
  rank:  { fontWeight:'800', letterSpacing:0.3 },
});
