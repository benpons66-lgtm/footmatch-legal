import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { supabase } from '../lib/supabase';
import ReputationBadge, { RANK_CONFIG, LEVEL_THRESHOLDS, getLevelFromScore, getLevelProgress, getLevelConfig, TIER_COLOR } from '../components/ReputationBadge';
import { fetchComputedStatsForUsers, getDisplayReputationScore, isLaunchCommunityProfile } from '../lib/playerStats';
type ReputationRank = string;

const RANK_THRESHOLDS = LEVEL_THRESHOLDS.map((t, i, arr) => ({
  rank:  t.key as ReputationRank,
  tier:  t.tier,
  min:   t.score,
  max:   arr[i + 1] ? arr[i + 1].score - 1 : 99999,
}));

const SCORE_BREAKDOWN = [
  { icon:'⚽', label:'Match joué',           points:'+200',    desc:'Par match confirmé et joué'                          },
  { icon:'🎯', label:'Match organisé',       points:'+700',    desc:'Par match créé (hors annulé)'                        },
  { icon:'📝', label:'Note donnée',          points:'+80',     desc:'Récompense la participation active'                  },
  { icon:'🏆', label:'Compétition créée',    points:'+3 000',  desc:'Lancer un championnat ou une coupe'                  },
  { icon:'⭐', label:'Bonne note reçue',     points:'+150',    desc:'Bonus par note de 4 ou 5 étoiles reçue'              },
  { icon:'❌', label:'No-show',              points:'-1 000',  desc:'Absence non signalée — pénalité sévère'              },
];

interface Props {
  userId: string;
  currentUserId: string;
  onBack: () => void;
}

export default function ReputationScreen({ userId, currentUserId, onBack }: Props) {
  const [tab, setTab]               = useState<'score'|'leaderboard'>('score');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [score, setScore]           = useState(0);
  const [rank, setRank]             = useState<ReputationRank>('D4');
  const [stats, setStats]           = useState({ matchesPlayed:0, matchesOrganized:0, avgRating:null as number|null, ratingsGiven:0, noShows:0 });
  interface LeaderboardEntry {
    id: string;
    pseudo: string;
    reputation_score: number;
    matches_played: number;
    position: number;
  }
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myPosition, setMyPosition] = useState<number|null>(null);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (tab === 'score' && score > 0) animateScore(score);
  }, [score, tab]);

  async function animateScore(target: number) {
    let current = 0;
    const steps = 40;
    const inc = target / steps;
    const iv = setInterval(() => {
      current = Math.min(current + inc, target);
      setDisplayScore(Math.round(current));
      if (current >= target) clearInterval(iv);
    }, 20);
  }

  async function loadAll(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    await Promise.all([loadReputation(), loadLeaderboard()]);
    setLoading(false); setRefreshing(false);
  }

  async function loadReputation() {
    const { data: profile } = await supabase.from('profiles').select('reputation_score, reputation_rank').eq('id', userId).single();
    const computed = (await fetchComputedStatsForUsers([userId]))[userId];
    const sc = getDisplayReputationScore(userId, profile?.reputation_score, computed);
    setScore(sc);
    setRank(getLevelFromScore(sc));
    setStats({
      matchesPlayed: computed?.matchesPlayed ?? 0,
      matchesOrganized: computed?.matchesOrganized ?? 0,
      avgRating: computed?.avgRating ?? null,
      ratingsGiven: computed?.ratingsGiven ?? 0,
      noShows: computed?.noShows ?? 0,
    });
  }

  async function loadLeaderboard() {
    const { data } = await supabase
      .from('profiles')
      .select('id, pseudo, reputation_score')
      .order('reputation_score', { ascending: false })
      .limit(50);
    if (!data) return;

    interface ProfileRow {
      id: string;
      pseudo: string;
      reputation_score: number | null;
    }
    const rows = data as ProfileRow[];
    const statsByUser = await fetchComputedStatsForUsers(rows.map((entry) => entry.id));
    const computedLeaderboard: LeaderboardEntry[] = rows
      .map((entry) => ({
        id: entry.id,
        pseudo: entry.pseudo,
        reputation_score: getDisplayReputationScore(entry.id, entry.reputation_score, statsByUser[entry.id]),
        matches_played: statsByUser[entry.id]?.matchesPlayed ?? 0,
        position: 0,
      }))
      .filter((entry) => isLaunchCommunityProfile(entry.id, statsByUser[entry.id]))
      .sort((a, b) => b.reputation_score - a.reputation_score)
      .slice(0, 20)
      .map((entry, index) => ({ ...entry, position: index + 1 }));

    setLeaderboard(computedLeaderboard);
    const me = computedLeaderboard.find((r) => r.id === currentUserId);
    if (me) setMyPosition(me.position);
  }

  if (loading) return (
    <View style={[s.container, { alignItems:'center', justifyContent:'center' }]}>
      <ActivityIndicator color={Colors.green} size="large" />
      <Text style={{ color:Colors.textMuted, marginTop:12 }}>Calcul de la réputation...</Text>
    </View>
  );

  const cfg       = getLevelConfig(rank);
  const lvlPrg    = getLevelProgress(score);
  const nextCfg   = lvlPrg.next ? getLevelConfig(lvlPrg.next) : null;
  const progressPct = lvlPrg.progress;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={22} color={Colors.green} /></TouchableOpacity>
        <Text style={s.headerTitle}>⚡ Réputation</Text>
        <ReputationBadge score={score} rank={rank} size="sm" showScore />
      </View>

      <View style={s.tabs}>
        {([['score','Mon Score'],['leaderboard','Classement']] as const).map(([key,label])=>(
          <TouchableOpacity key={key} style={[s.tab, tab===key && { borderBottomColor:cfg.color }]} onPress={()=>setTab(key)}>
            <Text style={[s.tabText, tab===key && { color:cfg.color }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>loadAll(true)} tintColor={Colors.green} />}>

        {tab === 'score' && <>
          <View style={[s.heroCard, { borderColor:cfg.borderColor }]}>
            <View style={[s.ring, { borderColor:cfg.color }]}>
              <Text style={{ fontSize:26 }}>{cfg.emoji}</Text>
              <Text style={[s.ringN, { color:cfg.color }]}>{displayScore}</Text>
              <Text style={s.ringLabel}>pts</Text>
            </View>
            <ReputationBadge score={score} rank={rank} size="lg" />
            <Text style={s.heroSub}>Score de réputation FootMatch</Text>

            {lvlPrg.next && nextCfg && (
              <View style={s.progressSection}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                  <Text style={{ fontSize:11, color:cfg.color, fontWeight:'800', textTransform:'uppercase' }}>{cfg.emoji} {rank}</Text>
                  <Text style={{ fontSize:11, color:nextCfg.color, fontWeight:'700' }}>
                    {nextCfg.emoji} {lvlPrg.next} → {lvlPrg.nextScore} pts
                  </Text>
                </View>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width:`${Math.min(progressPct,100)}%` as `${number}%`, backgroundColor:cfg.color }]} />
                </View>
                <Text style={{ fontSize:11, color:Colors.textMuted, textAlign:'center', marginTop:4 }}>
                  <Text style={{ color:cfg.color, fontWeight:'700' }}>{lvlPrg.pointsToNext} pts</Text> pour atteindre {lvlPrg.next}
                </Text>
              </View>
            )}
          </View>

          <View style={s.statsGrid}>
            {[
              { icon:'⚽', label:'Matchs joués',  value:stats.matchesPlayed,                             color:Colors.green      },
              { icon:'🎯', label:'Organisés',      value:stats.matchesOrganized,                          color:Colors.green      },
              { icon:'⭐', label:'Note moyenne',   value:stats.avgRating ? `${stats.avgRating}/5` : '—', color:Colors.greenLight  },
              { icon:'📝', label:'Notes données',  value:stats.ratingsGiven,                              color:Colors.greenLight  },
            ].map(st=>(
              <View key={st.label} style={s.statCard}>
                <Text style={{ fontSize:22 }}>{st.icon}</Text>
                <Text style={[s.statN, { color:st.color }]}>{st.value}</Text>
                <Text style={s.statL}>{st.label}</Text>
              </View>
            ))}
          </View>

          {stats.noShows > 0 && (
            <View style={s.noShowAlert}>
              <Text style={{ color:Colors.greenDark, fontWeight:'600', textAlign:'center' }}>
                ❌ {stats.noShows} absence{stats.noShows>1?'s':''} signalée{stats.noShows>1?'s':''} · -{stats.noShows*1000} pts
              </Text>
            </View>
          )}

          {/* Objectif GOAT */}
          {(() => {
            const totalEvents = stats.matchesPlayed + stats.matchesOrganized + stats.ratingsGiven;
            const pct = Math.min(Math.round((totalEvents / 150) * 100), 100);
            return (
              <View style={[s.breakdownCard, { borderColor: Colors.green + '20' }]}>
                <Text style={s.breakdownTitle}>🎯 Objectif GOAT</Text>
                <Text style={{ fontSize:12, color:Colors.textMuted, marginBottom:10 }}>
                  Participe à 150 événements pour atteindre le statut légendaire
                </Text>
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                  <Text style={{ fontSize:12, color:Colors.textMuted, fontWeight:'700' }}>
                    {totalEvents} / 150 événements
                  </Text>
                  <Text style={{ fontSize:12, color:Colors.green, fontWeight:'900' }}>{pct}%</Text>
                </View>
                <View style={[s.progressBar, { marginBottom:0 }]}>
                  <View style={[s.progressFill, { width:`${pct}%` as `${number}%`, backgroundColor:Colors.green }]} />
                </View>
              </View>
            );
          })()}

          <View style={s.breakdownCard}>
            <Text style={s.breakdownTitle}>📊 Comment ça marche</Text>
            {SCORE_BREAKDOWN.map(item=>(
              <View key={item.label} style={s.breakdownRow}>
                <Text style={{ fontSize:20, width:28 }}>{item.icon}</Text>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:13, fontWeight:'700', color:Colors.text }}>{item.label}</Text>
                  <Text style={{ fontSize:11, color:Colors.textMuted, marginTop:2 }}>{item.desc}</Text>
                </View>
                <Text style={[s.breakdownPts, { color:item.points.startsWith('+')?Colors.green:Colors.greenDark }]}>{item.points}</Text>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>🏅 Les 20 niveaux FootMatch</Text>
          {(['District','Régional','National','Pro','Élite','GOAT'] as const).map(tier => (
            <View key={tier} style={{ marginBottom:12 }}>
              <Text style={{ fontSize:11, color:TIER_COLOR[tier]??Colors.textMuted, fontWeight:'900', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
                — {tier} —
              </Text>
              {RANK_THRESHOLDS.filter(r => r.tier === tier).map(r => {
                const rc = getLevelConfig(r.rank);
                const isCurrent = r.rank === rank;
                return (
                  <View key={r.rank} style={[s.rankItem, isCurrent && { borderColor:rc.color, backgroundColor:rc.bgColor }]}>
                    <Text style={{ fontSize:20, width:30 }}>{rc.emoji}</Text>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontSize:14, fontWeight:'800', color:isCurrent?rc.color:Colors.text }}>{r.rank}</Text>
                      <Text style={{ fontSize:10, color:Colors.textMuted, marginTop:1 }}>
                        {r.min === 0 ? 'Départ' : `${r.min} pts`} {r.max < 99999 ? `→ ${r.max} pts` : '→ ∞'}
                      </Text>
                    </View>
                    {isCurrent && (
                      <View style={{ backgroundColor:rc.color+'20', borderRadius:8, paddingHorizontal:8, paddingVertical:3 }}>
                        <Text style={{ fontSize:10, color:rc.color, fontWeight:'800' }}>← Toi</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
          <View style={{ height:40 }} />
        </>}

        {tab === 'leaderboard' && <>
          {myPosition && (
            <View style={s.myPosBanner}>
              <Text style={{ color:Colors.green, fontWeight:'700', textAlign:'center' }}>🏆 Ta position : #{myPosition}</Text>
            </View>
          )}
          {leaderboard.map((entry, i)=>{
            const rc = getLevelConfig(getLevelFromScore(entry.reputation_score ?? 0));
            const isMe = entry.id === currentUserId;
            const medals = ['🥇','🥈','🥉'];
            return (
              <View key={entry.id} style={[s.leaderRow, isMe && s.leaderRowMe]}>
                <Text style={{ fontSize:18, width:32, textAlign:'center' }}>{i<3?medals[i]:`#${entry.position}`}</Text>
                <View style={[s.leaderAvatar, { borderColor:rc.color }]}>
                  <Text style={[s.leaderAvatarText, { color:rc.color }]}>{entry.pseudo[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={[s.leaderName, isMe && { color:Colors.green }]}>{entry.pseudo}{isMe?' (toi)':''}</Text>
                  <View style={{ flexDirection:'row', gap:6, marginTop:2 }}>
                    <ReputationBadge score={entry.reputation_score} rank={getLevelFromScore(entry.reputation_score ?? 0)} size="xs" />
                    <Text style={{ fontSize:11, color:Colors.textMuted }}>{entry.matches_played} matchs</Text>
                  </View>
                </View>
                <Text style={[s.leaderScore, { color:rc.color }]}>{entry.reputation_score}</Text>
              </View>
            );
          })}
          {leaderboard.length === 0 && (
            <View style={{ alignItems:'center', paddingTop:60 }}>
              <Text style={{ fontSize:52 }}>🏆</Text>
              <Text style={{ fontSize:20, fontWeight:'900', color:Colors.text, textTransform:'uppercase', marginTop:12 }}>Classement vide</Text>
              <Text style={{ fontSize:14, color:Colors.textMuted, marginTop:8 }}>Joue des matchs pour apparaître !</Text>
            </View>
          )}
          <View style={{ height:40 }} />
        </>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:Colors.bg },
  header:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.xl, paddingTop:56, paddingBottom:14, borderBottomWidth:1, borderBottomColor:Colors.border },
  back:           { color:Colors.green, fontSize:15, fontWeight:'600' },
  headerTitle:    { fontSize:16, fontWeight:'900', color:Colors.text, textTransform:'uppercase' },
  tabs:           { flexDirection:'row', borderBottomWidth:1, borderBottomColor:Colors.border },
  tab:            { flex:1, paddingVertical:14, alignItems:'center', borderBottomWidth:2, borderBottomColor:'transparent' },
  tabText:        { fontSize:12, fontWeight:'700', textTransform:'uppercase', color:Colors.textMuted },
  scroll:         { flex:1 },
  scrollContent:  { padding:Spacing.xl, gap:16 },
  heroCard:       { backgroundColor:Colors.card, borderRadius:Radius.xl, padding:Spacing['2xl'], alignItems:'center', borderWidth:1, gap:12 },
  ring:           { width:120, height:120, borderRadius:60, borderWidth:3, alignItems:'center', justifyContent:'center', marginBottom:4 },
  ringN:          { fontSize:36, fontWeight:'900', lineHeight:38 },
  ringLabel:      { fontSize:11, color:Colors.textMuted, fontWeight:'600', textTransform:'uppercase' },
  heroSub:        { fontSize:12, color:Colors.textMuted },
  progressSection:{ width:'100%', marginTop:8 },
  progressBar:    { height:6, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' },
  progressFill:   { height:'100%', borderRadius:3 },
  statsGrid:      { flexDirection:'row', gap:10, flexWrap:'wrap' },
  statCard:       { width:'47%', backgroundColor:Colors.bg3, borderRadius:Radius.lg, padding:14, borderWidth:1, borderColor:Colors.borderSubtle, alignItems:'center', gap:4 },
  statN:          { fontSize:26, fontWeight:'900' },
  statL:          { fontSize:10, color:Colors.textMuted, textTransform:'uppercase', textAlign:'center' },
  noShowAlert:    { backgroundColor:'rgba(0,168,84,0.10)', borderRadius:Radius.md, padding:12, borderWidth:1, borderColor:'rgba(0,168,84,0.30)' },
  breakdownCard:  { backgroundColor:Colors.card, borderRadius:Radius.lg, padding:Spacing.xl, borderWidth:1, borderColor:Colors.borderSubtle },
  breakdownTitle: { fontSize:14, fontWeight:'900', color:Colors.text, textTransform:'uppercase', marginBottom:14 },
  breakdownRow:   { flexDirection:'row', alignItems:'center', paddingVertical:10, borderBottomWidth:1, borderBottomColor:Colors.borderSubtle, gap:12 },
  breakdownPts:   { fontSize:16, fontWeight:'900', minWidth:36, textAlign:'right' },
  sectionTitle:   { fontSize:14, fontWeight:'900', color:Colors.text, textTransform:'uppercase' },
  rankItem:       { flexDirection:'row', alignItems:'center', backgroundColor:Colors.card, borderRadius:Radius.md, padding:14, borderWidth:1, borderColor:Colors.borderSubtle, gap:12, marginBottom:8 },
  myPosBanner:    { backgroundColor:Colors.greenDim, borderRadius:Radius.md, padding:12, borderWidth:1, borderColor:Colors.greenBorder, marginBottom:8 },
  leaderRow:      { flexDirection:'row', alignItems:'center', backgroundColor:Colors.card, borderRadius:Radius.md, padding:12, borderWidth:1, borderColor:Colors.borderSubtle, gap:12, marginBottom:8 },
  leaderRowMe:    { borderColor:Colors.greenBorder, backgroundColor:Colors.greenDim },
  leaderAvatar:   { width:40, height:40, borderRadius:20, backgroundColor:Colors.bg3, borderWidth:2, alignItems:'center', justifyContent:'center' },
  leaderAvatarText:{ fontSize:16, fontWeight:'900' },
  leaderName:     { fontSize:14, fontWeight:'700', color:Colors.text, textTransform:'uppercase' },
  leaderScore:    { fontSize:22, fontWeight:'900' },
});
