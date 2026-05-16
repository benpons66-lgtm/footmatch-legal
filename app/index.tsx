import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Radius, MATCH_TYPES } from '../constants/theme';
import { useStore } from '../store/useStore';

export default function HomeScreen() {
  const { currentUser } = useStore();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      
      {/* Header */}
      <View style={s.header}>
        <Text style={s.logo}>Foot<Text style={s.logoGreen}>Match</Text></Text>
        <Text style={s.tagline}>Trouve ton prochain match</Text>
      </View>

      {/* Hero */}
      <View style={s.hero}>
        <Text style={s.heroLabel}>🔥 Application prête !</Text>
        <Text style={s.heroTitle}>
          Bienvenue sur{'\n'}<Text style={s.heroGreen}>FootMatch</Text>
        </Text>
        <Text style={s.heroSub}>
          Supabase connecté ✅{'\n'}
          Navigation prête ✅{'\n'}
          Base de données prête ✅
        </Text>
      </View>

      {/* Types de matchs */}
      <Text style={s.sectionTitle}>Types de matchs</Text>
      <View style={s.typesRow}>
        {Object.entries(MATCH_TYPES).map(([key, cfg]) => (
          <View key={key} style={[s.typeCard, { borderColor: cfg.borderColor, backgroundColor: cfg.dimColor }]}>
            <Text style={s.typeEmoji}>{cfg.emoji}</Text>
            <Text style={[s.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
            <Text style={s.typeMax}>{cfg.maxPlayers} joueurs</Text>
          </View>
        ))}
      </View>

      {/* Status */}
      <View style={s.statusCard}>
        <Text style={s.statusTitle}>✅ Tout est configuré !</Text>
        <Text style={s.statusText}>
          • Supabase URL connectée{'\n'}
          • Base de données installée{'\n'}
          • Prêt à coder les écrans
        </Text>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, paddingTop: 60 },
  
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  logo: { fontSize: 42, fontWeight: '900', color: Colors.text },
  logoGreen: { color: Colors.green },
  tagline: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  hero: {
    backgroundColor: Colors.bg3, borderRadius: Radius.xl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  heroLabel: { fontSize: 12, color: Colors.green, marginBottom: 6 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: Colors.text, marginBottom: 12 },
  heroGreen: { color: Colors.green },
  heroSub: { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },

  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.text,
    textTransform: 'uppercase', marginBottom: 12,
  },
  typesRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  typeCard: {
    flex: 1, borderRadius: Radius.md, borderWidth: 1,
    padding: 12, alignItems: 'center', gap: 4,
  },
  typeEmoji: { fontSize: 24 },
  typeLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  typeMax: { fontSize: 11, color: Colors.textMuted },

  statusCard: {
    backgroundColor: Colors.greenDim, borderRadius: Radius.lg,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.greenBorder,
  },
  statusTitle: { fontSize: 16, fontWeight: '700', color: Colors.green, marginBottom: 8 },
  statusText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
});