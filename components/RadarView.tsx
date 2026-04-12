import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions,
} from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';

const { width: SW } = Dimensions.get('window');
const RADAR_SIZE = Math.min(SW - 48, 320);
const R = RADAR_SIZE / 2;
const MAX_KM = 5;

// Deterministic angle from match id
function idToAngle(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 360) * Math.PI) / 180;
}

const TYPE_COLOR: Record<string, string> = {
  five: Colors.green,
  city: Colors.yellow,
  eleven: Colors.blue,
};

// Trail lines behind sweep (angle offset, opacity)
const TRAIL: [number, number][] = [
  [-6, 0.45], [-16, 0.28], [-32, 0.16], [-54, 0.08], [-82, 0.04],
];

interface Props {
  matches: any[];
  userLocation: { latitude: number; longitude: number } | null;
  onMatchPress: (match: any) => void;
}

export default function RadarView({ matches, userLocation, onMatchPress }: Props) {
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const [selected, setSelected] = useState<any>(null);
  const pulseRef = useRef<Record<string, Animated.Value>>({});

  const nearby = matches.filter(m =>
    m.distanceKm !== null && m.distanceKm !== undefined && m.distanceKm <= MAX_KM && new Date(m.scheduled_at) > new Date()
  );

  // init pulse anim per match
  nearby.forEach(m => {
    if (!pulseRef.current[m.id]) pulseRef.current[m.id] = new Animated.Value(0);
  });

  useEffect(() => {
    // Sweep rotation
    Animated.loop(
      Animated.timing(sweepAnim, { toValue: 1, duration: 3600, useNativeDriver: true })
    ).start();

    // Blip pulse per match with staggered delay
    nearby.forEach((m, i) => {
      const a = pulseRef.current[m.id];
      if (!a) return;
      const run = () => Animated.loop(
        Animated.sequence([
          Animated.delay(i * 400 % 2000),
          Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 700, useNativeDriver: true }),
          Animated.delay(1800),
        ])
      ).start();
      run();
    });
  }, [nearby.length]);

  // Position of a blip on the radar circle
  function blipPos(match: any) {
    const dist = Math.min(match.distanceKm ?? 2, MAX_KM);
    const r = (dist / MAX_KM) * (R - 20);
    const angle = idToAngle(match.id);
    return { x: R + r * Math.cos(angle) - 9, y: R + r * Math.sin(angle) - 9 };
  }

  const sweepDeg = sweepAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={s.wrapper}>

      {/* Radar disc */}
      <View style={[s.disc, { width: RADAR_SIZE, height: RADAR_SIZE, borderRadius: R }]}>

        {/* Rings */}
        {[0.28, 0.55, 0.78, 1].map((frac, i) => (
          <View key={i} style={[s.ring, {
            width: RADAR_SIZE * frac, height: RADAR_SIZE * frac,
            borderRadius: (RADAR_SIZE * frac) / 2,
            left: R - (RADAR_SIZE * frac) / 2,
            top: R - (RADAR_SIZE * frac) / 2,
          }]} />
        ))}

        {/* Crosshair */}
        <View style={[s.crossH, { top: R - 0.5 }]} />
        <View style={[s.crossV, { left: R - 0.5 }]} />

        {/* Distance labels (at 12 o'clock per ring) */}
        {[1.4, 2.75, 3.9, 5].map((km, i) => (
          <Text key={km} style={[s.kmLabel, {
            top: R - (RADAR_SIZE * [0.28, 0.55, 0.78, 1][i]) / 2 + 2,
            left: R + 4,
          }]}>
            {km}km
          </Text>
        ))}

        {/* Sweep trail */}
        {TRAIL.map(([offset, opacity], i) => (
          <Animated.View key={i} style={[s.sweepLine, {
            opacity,
            transform: [
              { translateY: R / 2 },
              { rotate: sweepAnim.interpolate({ inputRange: [0, 1], outputRange: [`${offset}deg`, `${360 + offset}deg`] }) },
              { translateY: -R / 2 },
            ],
          }]} />
        ))}

        {/* Main sweep */}
        <Animated.View style={[s.sweepLine, s.sweepMain, {
          transform: [
            { translateY: R / 2 },
            { rotate: sweepDeg },
            { translateY: -R / 2 },
          ],
        }]} />

        {/* Center */}
        <View style={[s.centerDot, { left: R - 7, top: R - 7 }]} />
        <Text style={[s.youLabel, { left: R + 8, top: R - 8 }]}>Vous</Text>

        {/* Match blips */}
        {nearby.map(match => {
          const { x, y } = blipPos(match);
          const color = TYPE_COLOR[match.type] ?? Colors.green;
          const pa = pulseRef.current[match.id];
          const ringScale = pa?.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) ?? new Animated.Value(1);
          const ringOpacity = pa?.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }) ?? new Animated.Value(0);
          const isSelected = selected?.id === match.id;

          return (
            <TouchableOpacity
              key={match.id}
              style={[s.blipWrap, { left: x, top: y }]}
              onPress={() => setSelected(isSelected ? null : match)}
              activeOpacity={0.7}
            >
              {/* Pulse ring */}
              <Animated.View style={[s.blipRing, {
                borderColor: color,
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              }]} />
              {/* Core dot */}
              <View style={[s.blipCore, {
                backgroundColor: color,
                shadowColor: color,
                borderWidth: isSelected ? 2 : 0,
                borderColor: '#fff',
              }]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Match popup */}
      {selected && (
        <TouchableOpacity
          style={s.popup}
          onPress={() => { onMatchPress(selected); setSelected(null); }}
          activeOpacity={0.9}
        >
          <View style={[s.popupType, {
            backgroundColor: (TYPE_COLOR[selected.type] ?? Colors.green) + '22',
            borderColor: (TYPE_COLOR[selected.type] ?? Colors.green) + '55',
          }]}>
            <Text style={[s.popupTypeText, { color: TYPE_COLOR[selected.type] ?? Colors.green }]}>
              {selected.type === 'five' ? '⚡ Five' : selected.type === 'city' ? '🏙️ City Stade' : '⚽ Foot à 11'}
            </Text>
          </View>
          <Text style={s.popupTitle} numberOfLines={1}>{selected.title}</Text>
          <Text style={s.popupSub}>
            {selected.venue?.name ?? '?'} · {(selected.distanceKm ?? 0).toFixed(1)} km ·{' '}
            {selected.current_players}/{selected.max_players} joueurs
          </Text>
          <View style={s.popupCta}>
            <Text style={s.popupCtaText}>Voir le match →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Empty */}
      {nearby.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyText}>Aucun match dans un rayon de 5 km</Text>
        </View>
      )}

      {/* Legend */}
      <View style={s.legend}>
        {([['five', '⚡ Five'], ['city', '🏙️ City'], ['eleven', '⚽ 11']] as const).map(([t, l]) => (
          <View key={t} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: TYPE_COLOR[t] }]} />
            <Text style={s.legendLabel}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:       { alignItems: 'center', paddingTop: Spacing.lg },
  disc:          { backgroundColor: '#050D05', borderWidth: 1.5, borderColor: Colors.greenBorder, overflow: 'hidden', position: 'relative' },

  ring:          { position: 'absolute', borderWidth: 1, borderColor: Colors.green, opacity: 0.18 },
  crossH:        { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Colors.green, opacity: 0.12 },
  crossV:        { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: Colors.green, opacity: 0.12 },
  kmLabel:       { position: 'absolute', fontSize: 9, color: Colors.green, opacity: 0.4, fontWeight: '600' },

  sweepLine:     {
    position: 'absolute',
    left: R - 1,
    top: 0,
    width: 2,
    height: R,
    backgroundColor: Colors.green,
  },
  sweepMain:     { opacity: 0.95, shadowColor: Colors.green, shadowRadius: 6, shadowOpacity: 0.8 },

  centerDot:     { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.green, shadowColor: Colors.green, shadowRadius: 8, shadowOpacity: 1 },
  youLabel:      { position: 'absolute', fontSize: 9, color: Colors.green, fontWeight: '700', opacity: 0.7 },

  blipWrap:      { position: 'absolute', width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  blipRing:      { position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
  blipCore:      { width: 10, height: 10, borderRadius: 5, shadowRadius: 4, shadowOpacity: 0.9, elevation: 4 },

  popup:         { marginTop: 16, backgroundColor: Colors.bg2, borderRadius: Radius.lg, padding: Spacing.lg, width: RADAR_SIZE, borderWidth: 1, borderColor: Colors.border },
  popupType:     { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, marginBottom: 8 },
  popupTypeText: { fontSize: 11, fontWeight: '700' },
  popupTitle:    { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  popupSub:      { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  popupCta:      { backgroundColor: Colors.green, borderRadius: Radius.full, paddingVertical: 9, alignItems: 'center' },
  popupCtaText:  { color: '#000', fontWeight: '900', fontSize: 13 },

  empty:         { marginTop: 20, padding: Spacing.lg, alignItems: 'center' },
  emptyText:     { color: Colors.textMuted, fontSize: 13 },

  legend:        { flexDirection: 'row', gap: 20, marginTop: 14, justifyContent: 'center' },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendLabel:   { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
});
