import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import PlayerCard from '../components/PlayerCard';
import { LEVEL_THRESHOLDS, getLevelConfig } from '../components/ReputationBadge';
import Copyright from '../components/Copyright';

// Uniquement les 4 cartes District
const DISTRICT_LEVELS = LEVEL_THRESHOLDS.filter(t => t.tier === 'District');

const EMPTY_STATS = {
  matchesPlayed: 0, matchesOrganized: 0, avgRating: null,
  ratingsGiven: 0, noShows: 0, goals: 0, assists: 0, skill: null,
};

interface Props {
  onBack: () => void;
  currentRank: string;
  pseudo: string;
  score: number;
  avatarId?: string;
}

export default function CardGalleryScreen({ onBack, currentRank, pseudo, score, avatarId }: Props) {
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.green} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>🃏 CARTES DISTRICT</Text>
          <Text style={s.headerSub}>D4 → D1 · Fais évoluer ta carte</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
      >
        {DISTRICT_LEVELS.map(item => {
          const cfg  = getLevelConfig(item.key);
          const isMe = item.key === currentRank;
          const fakeScore = isMe ? score : item.score + 10;

          return (
            <View key={item.key} style={s.cardWrap}>
              {/* Badge "C'est toi !" */}
              {isMe && (
                <View style={[s.meBadge, { backgroundColor: cfg.color }]}>
                  <Text style={s.meBadgeText}>👆 C'est toi !</Text>
                </View>
              )}

              {/* Séparateur de grade */}
              <View style={s.tierHeader}>
                <View style={[s.tierDot, { backgroundColor: cfg.color }]} />
                <Text style={[s.tierName, { color: cfg.color }]}>
                  DISTRICT — Grade {item.key}
                </Text>
                <View style={[s.tierLine, { backgroundColor: cfg.color + '30' }]} />
              </View>

              {/* La carte centrée */}
              <View style={{ alignItems: 'center' }}>
                <PlayerCard
                  pseudo={isMe ? pseudo : `Joueur ${item.key}`}
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
        })}

        <Copyright />
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.bg },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn:          { padding: 4, width: 36 },
  headerTitle:      { fontSize: 15, fontWeight: '900', color: Colors.text, letterSpacing: 1 },
  headerSub:        { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  list:             { paddingHorizontal: Spacing.lg, paddingTop: 24, gap: 32 },

  cardWrap:         { gap: 12 },

  meBadge:          { alignSelf: 'center', borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 4 },
  meBadgeText:      { fontSize: 13, fontWeight: '900', color: '#000' },

  tierHeader:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierDot:          { width: 8, height: 8, borderRadius: 4 },
  tierName:         { fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  tierLine:         { flex: 1, height: 1 },
  scoreRequired:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.25)', marginTop: 8 },
  scoreRequiredTxt: { fontSize: 11, fontWeight: '700' },

});
