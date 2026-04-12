import React, { useState } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import PlayerCard, { CARD_CHARACTERS } from '../components/PlayerCard';
import { LEVEL_THRESHOLDS, getLevelConfig, TIER_COLOR } from '../components/ReputationBadge';

const { width } = Dimensions.get('window');

const TIERS = ['District','Régional','National','Pro','Élite','GOAT'];

const EMPTY_STATS = { matchesPlayed:0, matchesOrganized:0, avgRating:null, ratingsGiven:0, noShows:0 };

interface Props {
  onBack: () => void;
  currentRank: string;
  pseudo: string;
  score: number;
  avatarId?: string;
}

export default function CardGalleryScreen({ onBack, currentRank, pseudo, score, avatarId }: Props) {
  const [selectedTier, setSelectedTier] = useState<string>('all');

  const levels = LEVEL_THRESHOLDS.filter(t =>
    selectedTier === 'all' || t.tier === selectedTier
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.green} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>🃏 GALERIE DES CARTES</Text>
          <Text style={s.headerSub}>20 personnages · Trouve le tien</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Grille des cartes — filtres dans le header du FlatList */}
      <FlatList
        data={levels}
        keyExtractor={t => t.key}
        numColumns={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
            style={s.filterScroll}
          >
            {(['all', ...TIERS] as string[]).map(item => {
              const active = selectedTier === item;
              const color  = item === 'all' ? Colors.green : (TIER_COLOR[item] ?? Colors.green);
              return (
                <TouchableOpacity
                  key={item}
                  style={[s.chip, active && { backgroundColor: color + '20', borderColor: color + '70' }]}
                  onPress={() => setSelectedTier(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipTxt, active && { color }]}>
                    {item === 'all' ? '⚽ Tous' : item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        }
        renderItem={({ item }) => {
          const cfg    = getLevelConfig(item.key);
          const char   = CARD_CHARACTERS[item.key];
          const isMe   = item.key === currentRank;

          // Score fictif pour chaque carte (montre la progression)
          const fakeScore = item.key === currentRank ? score : item.score + 10;

          return (
            <View style={[s.cardWrap, isMe && s.cardWrapMe]}>
              {/* Badge "C'est toi !" */}
              {isMe && (
                <View style={[s.meBadge, { backgroundColor: cfg.color }]}>
                  <Text style={s.meBadgeText}>👆 C'est toi !</Text>
                </View>
              )}
              {/* Tier separator */}
              <View style={s.tierHeader}>
                <View style={[s.tierDot, { backgroundColor: cfg.color }]} />
                <Text style={[s.tierName, { color: cfg.color }]}>
                  {cfg.tier.toUpperCase()} — Grade {item.key}
                </Text>
                <View style={[s.tierLine, { backgroundColor: cfg.color + '30' }]} />
              </View>

              {/* La carte centrée */}
              <View style={{ alignItems: 'center' }}>
                <PlayerCard
                  pseudo={isMe ? pseudo : char.name}
                  rank={item.key}
                  score={fakeScore}
                  stats={EMPTY_STATS}
                  avatarId={isMe ? avatarId : undefined}
                  size="full"
                />
              </View>

              {/* Score requis */}
              {item.score > 0 && !isMe && (
                <View style={[s.scoreRequired, { borderColor: cfg.color + '30' }]}>
                  <Ionicons name="lock-closed-outline" size={13} color={cfg.color + '80'} />
                  <Text style={[s.scoreRequiredTxt, { color: cfg.color + '80' }]}>
                    Débloqué à {item.score} pts de réputation
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex:1, backgroundColor:Colors.bg },
  header:           { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.xl, paddingTop: Platform.OS==='ios'?56:44, paddingBottom:14, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.06)' },
  backBtn:          { padding:4, width:36 },
  headerTitle:      { fontSize:15, fontWeight:'900', color:Colors.text, letterSpacing:1 },
  headerSub:        { fontSize:11, color:Colors.textMuted, marginTop:2 },

  filterScroll:     { height: 52, marginBottom: 12 },
  filterRow:        { paddingHorizontal:Spacing.lg, gap:8, alignItems:'center', paddingVertical:8 },
  chip:             { paddingHorizontal:14, paddingVertical:7, borderRadius:20, backgroundColor:Colors.bg2, borderWidth:1, borderColor:'rgba(255,255,255,0.08)' },
  chipTxt:          { fontSize:12, fontWeight:'700', color:Colors.textMuted },

  list:             { paddingHorizontal:Spacing.lg, paddingBottom:100, gap:32 },

  cardWrap:         { gap:12 },
  cardWrapMe:       { },

  meBadge:          { alignSelf:'center', borderRadius:Radius.full, paddingHorizontal:16, paddingVertical:6, marginBottom:4 },
  meBadgeText:      { fontSize:13, fontWeight:'900', color:'#000' },

  tierHeader:       { flexDirection:'row', alignItems:'center', gap:8 },
  tierDot:          { width:8, height:8, borderRadius:4 },
  tierName:         { fontSize:12, fontWeight:'900', letterSpacing:0.8, textTransform:'uppercase' },
  tierLine:         { flex:1, height:1 },

  scoreRequired:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, borderWidth:1, borderRadius:Radius.full, paddingVertical:6, paddingHorizontal:14, alignSelf:'center', marginTop:4 },
  scoreRequiredTxt: { fontSize:11, fontWeight:'600' },
});
