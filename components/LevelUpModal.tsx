import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated, StyleSheet,
  Dimensions, StatusBar,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

// Rank config — 20 niveaux FootMatch
const RANK_CONFIG: Record<string, { emoji: string; color: string; glow: string; title: string }> = {
  D4:                   { emoji: '⚽', color: '#8B8B8B', glow: '#8B8B8B', title: 'DISTRICT 4' },
  D3:                   { emoji: '⚽', color: '#9CA3AF', glow: '#9CA3AF', title: 'DISTRICT 3' },
  D2:                   { emoji: '⚽', color: '#B0B7C3', glow: '#B0B7C3', title: 'DISTRICT 2' },
  D1:                   { emoji: '⚽', color: '#CDD0D8', glow: '#CDD0D8', title: 'DISTRICT 1' },
  R3:                   { emoji: '🔵', color: '#93C5FD', glow: '#93C5FD', title: 'RÉGIONAL 3' },
  R2:                   { emoji: '🔵', color: '#60A5FA', glow: '#60A5FA', title: 'RÉGIONAL 2' },
  R1:                   { emoji: '🔵', color: '#3B82F6', glow: '#3B82F6', title: 'RÉGIONAL 1' },
  N3:                   { emoji: '🟢', color: '#6EE7B7', glow: '#6EE7B7', title: 'NATIONAL 3' },
  N2:                   { emoji: '🟢', color: '#34D399', glow: '#34D399', title: 'NATIONAL 2' },
  N1:                   { emoji: '🟢', color: '#10B981', glow: '#10B981', title: 'NATIONAL 1' },
  'Ligue 2':            { emoji: '⭐', color: '#FDE68A', glow: '#FDE68A', title: 'LIGUE 2' },
  'Ligue 1':            { emoji: '⭐', color: '#FBBF24', glow: '#FBBF24', title: 'LIGUE 1' },
  'Serie A':            { emoji: '🔴', color: '#FB923C', glow: '#FB923C', title: 'SERIE A' },
  'Bundesliga':         { emoji: '🦅', color: '#F87171', glow: '#F87171', title: 'BUNDESLIGA' },
  'Liga':               { emoji: '🔴', color: '#EF4444', glow: '#EF4444', title: 'LIGA' },
  'Premier League':     { emoji: '🦁', color: '#DC2626', glow: '#DC2626', title: 'PREMIER LEAGUE' },
  'Ligue des Champions':{ emoji: '🏆', color: '#C4B5FD', glow: '#C4B5FD', title: 'LIGUE DES CHAMPIONS' },
  'Euro':               { emoji: '🌟', color: '#A78BFA', glow: '#A78BFA', title: 'EURO' },
  'Coupe du Monde':     { emoji: '🌍', color: '#7C3AED', glow: '#7C3AED', title: 'COUPE DU MONDE' },
  'GOAT':               { emoji: '🐐', color: '#F97316', glow: '#F97316', title: '🐐 GOAT 🐐' },
};

// Pre-computed speed lines (angle, length, dist from center, width)
const SPEED_LINES = [
  [0, 65, 95, 2], [15, 42, 80, 1], [30, 70, 100, 3], [45, 38, 85, 1],
  [60, 58, 92, 2], [75, 44, 78, 1], [90, 72, 105, 3], [105, 40, 82, 1],
  [120, 62, 98, 2], [135, 36, 75, 1], [150, 68, 102, 2], [165, 46, 88, 1],
  [180, 60, 96, 3], [195, 43, 81, 1], [210, 74, 107, 2], [225, 39, 77, 1],
  [240, 55, 93, 2], [255, 47, 83, 1], [270, 67, 101, 3], [285, 41, 79, 1],
  [300, 63, 97, 2], [315, 37, 74, 1], [330, 71, 104, 2], [345, 45, 87, 1],
] as const;

interface Props {
  rank: string;
  onClose: () => void;
}

export default function LevelUpModal({ rank, onClose }: Props) {
  const cfg = RANK_CONFIG[rank] ?? { emoji: '⭐', color: '#00E676', glow: '#00E676', title: rank.toUpperCase() };

  // Animations
  const bgOpacity    = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const linesOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale   = useRef(new Animated.Value(0)).current;
  const badgeGlow    = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(60)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const rankUpScale  = useRef(new Animated.Value(0)).current;
  const ctaOpacity   = useRef(new Animated.Value(0)).current;
  const shakeX       = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Background fade in
      Animated.timing(bgOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      // 2. White flash
      Animated.sequence([
        Animated.timing(flashOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
      // 3. Speed lines + badge appear simultaneously
      Animated.parallel([
        Animated.timing(linesOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(badgeScale, {
          toValue: 1, friction: 4, tension: 120, useNativeDriver: true,
        }),
      ]),
      // 4. Screen shake
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -12, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 12, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]),
      // 5. "RANK UP!" text bounce in
      Animated.parallel([
        Animated.spring(rankUpScale, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }),
        Animated.timing(badgeGlow, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // 6. Rank title slide up
      Animated.parallel([
        Animated.timing(titleY, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]),
      // 7. CTA button
      Animated.delay(300),
      Animated.timing(ctaOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(badgeGlow, { toValue: 1.3, duration: 700, useNativeDriver: true }),
        Animated.timing(badgeGlow, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const badgeGlowInterp = badgeGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View style={[s.overlay, { opacity: bgOpacity, transform: [{ translateX: shakeX }] }]}>
      <StatusBar barStyle="light-content" />

      {/* White flash */}
      <Animated.View style={[s.flash, { opacity: flashOpacity }]} pointerEvents="none" />

      {/* Speed lines */}
      <Animated.View style={[s.linesWrap, { opacity: linesOpacity }]} pointerEvents="none">
        {SPEED_LINES.map(([angle, length, dist, width], i) => {
          const rad = (angle * Math.PI) / 180;
          const x = SW / 2 + dist * Math.cos(rad);
          const y = SH / 2 + dist * Math.sin(rad);
          return (
            <View key={i} style={[s.speedLine, {
              left: x, top: y,
              width: length, height: width,
              transform: [{ rotate: `${angle}deg` }],
              opacity: 0.25 + (i % 3) * 0.12,
            }]} />
          );
        })}
      </Animated.View>

      {/* Content */}
      <View style={s.content}>

        {/* RANK UP! label */}
        <Animated.Text style={[s.rankUpText, {
          color: cfg.color,
          transform: [{ scale: rankUpScale }],
          textShadowColor: cfg.glow,
          textShadowRadius: 20,
        }]}>
          RANK UP!
        </Animated.Text>

        {/* Badge emoji */}
        <Animated.View style={[s.badgeWrap, {
          transform: [{ scale: Animated.multiply(badgeScale, badgeGlowInterp) }],
          shadowColor: cfg.glow,
        }]}>
          <Text style={s.badgeEmoji}>{cfg.emoji}</Text>
          {/* Glow ring */}
          <Animated.View style={[s.glowRing, {
            borderColor: cfg.color,
            transform: [{ scale: badgeGlowInterp }],
          }]} />
        </Animated.View>

        {/* Rank title */}
        <Animated.View style={{ transform: [{ translateY: titleY }], opacity: titleOpacity }}>
          <Text style={[s.rankTitle, { color: cfg.color, textShadowColor: cfg.glow }]}>
            {cfg.title}
          </Text>
          <Text style={s.rankSub}>Nouveau rang débloqué !</Text>
        </Animated.View>

        {/* Manga dots decoration */}
        <View style={s.dotsRow}>
          {[cfg.color, '#ffffff44', cfg.color].map((c, i) => (
            <View key={i} style={[s.dot, { backgroundColor: c }]} />
          ))}
        </View>

        {/* Continue button */}
        <Animated.View style={{ opacity: ctaOpacity, width: '100%' }}>
          <TouchableOpacity style={[s.ctaBtn, { backgroundColor: cfg.color }]} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.ctaBtnText}>CONTINUER !</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.96)', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  flash:       { ...StyleSheet.absoluteFillObject, backgroundColor: '#ffffff' },
  linesWrap:   { ...StyleSheet.absoluteFillObject },
  speedLine:   { position: 'absolute', backgroundColor: '#ffffff' },

  content:     { alignItems: 'center', paddingHorizontal: 32, gap: 16, width: '100%' },

  rankUpText:  {
    fontSize: 42, fontWeight: '900', letterSpacing: 6,
    textTransform: 'uppercase', marginBottom: 4,
    fontStyle: 'italic',
  },

  badgeWrap:   {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 30, shadowOpacity: 0.9, elevation: 20,
  },
  badgeEmoji:  { fontSize: 72 },
  glowRing:    {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    borderWidth: 2, opacity: 0.5,
  },

  rankTitle:   {
    fontSize: 32, fontWeight: '900', textAlign: 'center',
    letterSpacing: 3, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
  },
  rankSub:     { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 4, fontWeight: '600' },

  dotsRow:     { flexDirection: 'row', gap: 8, marginVertical: 4 },
  dot:         { width: 8, height: 8, borderRadius: 4 },

  ctaBtn:      { borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  ctaBtnText:  { fontSize: 18, fontWeight: '900', color: '#000', letterSpacing: 3 },
});
