// components/PlayerCard.tsx — FootMatch Carte Joueur v5 — Premium Dark Design
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { getLevelConfig } from './ReputationBadge';
import { MANGA_AVATARS } from './AvatarPicker';

const { width } = Dimensions.get('window');
const CARD_WIDTH  = width * 0.82;

// ─── Score fixe par grade ─────────────────────────────────────────────────────
export const CARD_SCORES: Record<string, number> = {
  D4: 50, D3: 60, D2: 62, D1: 65,
  R3: 70, R2: 75, R1: 80,
  N3: 84, N2: 87, N1: 90,
  'Ligue 2': 92, 'Ligue 1': 94,
  'Serie A': 96, 'Bundesliga': 97, 'Liga': 98, 'Premier League': 99,
  'Ligue des Champions': 104, 'Euro': 108, 'Coupe du Monde': 115,
  'GOAT': 120,
};

// ─── Tier display helper ──────────────────────────────────────────────────────
function getTierDisplay(rank: string): { tier: string; grade: string } {
  if (['D4','D3','D2','D1'].includes(rank)) return { tier: 'DISTRICT', grade: rank };
  if (['R3','R2','R1'].includes(rank)) return { tier: 'RÉGIONAL', grade: rank };
  if (['N3','N2','N1'].includes(rank)) return { tier: 'NATIONAL', grade: rank };
  if (rank === 'Ligue 2')  return { tier: 'PRO', grade: 'L.2' };
  if (rank === 'Ligue 1')  return { tier: 'PRO', grade: 'L.1' };
  if (rank === 'Serie A')  return { tier: 'PRO', grade: 'S.A' };
  if (rank === 'Bundesliga') return { tier: 'PRO', grade: 'BDL' };
  if (rank === 'Liga')     return { tier: 'PRO', grade: 'LIGA' };
  if (rank === 'Premier League') return { tier: 'PRO', grade: 'P.L' };
  if (rank === 'Ligue des Champions') return { tier: 'ÉLITE', grade: 'LDC' };
  if (rank === 'Euro')     return { tier: 'ÉLITE', grade: 'EURO' };
  if (rank === 'Coupe du Monde') return { tier: 'ÉLITE', grade: 'CDM' };
  return { tier: 'LÉGENDAIRE', grade: 'GOAT' };
}

// ─── Personnages humouristiques ───────────────────────────────────────────────
export const CARD_CHARACTERS: Record<string, {
  name: string; nickname: string; quote: string;
  face: string; hat: string; extra: string;
  vit: number; pas: number; pui: number;
  vitNote: string; pasNote: string; puiNote: string;
  role: string; roleIcon: string; roleNote: string;
}> = {
  D4: {
    name: 'Castolo', nickname: 'Le Prodige de sa Mère',
    quote: '"Meilleur joueur du terrain... selon sa mère"',
    face: '😤', hat: '🎩', extra: '🧓',
    vit:1, pas:1, pui:1,
    vitNote:'marche rapide', pasNote:'atteint parfois la cible', puiNote:'ouvre des pots de confiture',
    role: 'ROOKIE', roleIcon: '🎮', roleNote: 'Pas encore de stats',
  },
  D3: {
    name: 'Valère Gergrain', nickname: 'Le Maïs qui Pousse',
    quote: '"Pousse doucement mais sûrement. Très doucement."',
    face: '😅', hat: '🌽', extra: '🌱',
    vit:1, pas:1, pui:2,
    vitNote:'jogging de santé', pasNote:'visait le but', puiNote:'bonne alimentation',
    role: 'SHOWMAN', roleIcon: '🎬', roleNote: '12 vidéos / match',
  },
  D2: {
    name: 'Momo le Gaucher', nickname: 'Ambidextre dans le Mauvais Sens',
    quote: '"Ambidextre dans le mauvais sens du terme"',
    face: '🤷', hat: '🦶', extra: '🦶',
    vit:1, pas:2, pui:1,
    vitNote:'se dépêche pas', pasNote:'ça arrive', puiNote:'frappe des 2 pieds, rate des 2',
    role: 'CLAQUETTES', roleIcon: '🦶', roleNote: '0 but cette saison',
  },
  D1: {
    name: 'Dédé Tatane', nickname: 'Champion de la Touche',
    quote: '"Son lancer de touche est sa seule arme. Elle est redoutable."',
    face: '😎', hat: '🤲', extra: '📐',
    vit:2, pas:1, pui:2,
    vitNote:'sur les touches', pasNote:'passe = lancer', puiNote:'bras très musclés',
    role: 'SPÉCIALISTE', roleIcon: '🤲', roleNote: 'Record touche : 47m',
  },
  R3: {
    name: 'Kevin Trapèze', nickname: 'Bosseur du Synthétique',
    quote: '"Il a usé 4 paires de crampons. Sur 2 matchs."',
    face: '😤', hat: '👟', extra: '🔩',
    vit:2, pas:2, pui:2,
    vitNote:'côté gauche uniquement', pasNote:'précision correcte', puiNote:'solide comme le synthé',
    role: 'BOSSEUR', roleIcon: '💪', roleNote: '8 matchs d\'affilée',
  },
  R2: {
    name: 'Rodrîgo Laplanche', nickname: 'La Merguez du Milieu',
    quote: '"Fort comme un bœuf, rapide comme une merguez froide"',
    face: '🦾', hat: '🌭', extra: '💥',
    vit:2, pas:2, pui:3,
    vitNote:'en ligne droite', pasNote:'direct comme la merguez', puiNote:'frappe qui fait peur',
    role: 'BULLDOZER', roleIcon: '🔥', roleNote: '3 plaquages / match',
  },
  R1: {
    name: 'Thierry la Boulette', nickname: '73% de Dribbles Réussis sur YouTube',
    quote: '"Analyse les matchs en vidéo. Ne joue plus depuis 2019."',
    face: '🧐', hat: '📱', extra: '💻',
    vit:3, pas:2, pui:2,
    vitNote:'court en vidéo', pasNote:'vu 312 tutos', puiNote:'clique fort sur pause',
    role: 'ANALYSTE', roleIcon: '📊', roleNote: '7 tutos / semaine',
  },
  N3: {
    name: 'Salvatore Paëllo', nickname: "L'Italien du 93",
    quote: '"Né à Bondy, se prend pour Pirlo depuis 2006"',
    face: '🤌', hat: '🇮🇹', extra: '☕',
    vit:3, pas:3, pui:2,
    vitNote:'élégante mais lente', pasNote:'ça a du style', puiNote:'préfère la technique',
    role: 'STYLISTE', roleIcon: '🤌', roleNote: '4 gestes tech / match',
  },
  N2: {
    name: 'Mamadou Superstar', nickname: 'Crampons Dorés, Passes en Argent',
    quote: '"Il a le style. Les résultats suivent... bientôt."',
    face: '😎', hat: '✨', extra: '🌟',
    vit:3, pas:3, pui:3,
    vitNote:'sprint avec la classe', pasNote:'en argent pas en or', puiNote:'frappe et célèbre',
    role: 'SUPERSTAR', roleIcon: '✨', roleNote: '4.8 / 5 en style',
  },
  N1: {
    name: 'Jérémy Touchatout', nickname: 'Il Veut la Balle. Tout le Temps.',
    quote: '"Appelle sa propre touche. Réclame le corner. Signe les feuilles."',
    face: '🙋', hat: '📋', extra: '🗣️',
    vit:3, pas:3, pui:3,
    vitNote:'court pour réclamer', pasNote:'se passe à lui-même', puiNote:'tape dans tout',
    role: 'BALLON-HOG', roleIcon: '🗣️', roleNote: '38 touches / match',
  },
  'Ligue 2': {
    name: 'Roberto Fantazio', nickname: 'Semi-Pro le Samedi',
    quote: '"Signature au Five à 14h, réunion de bilan à 9h. Il gère."',
    face: '🕴️', hat: '💼', extra: '📊',
    vit:3, pas:3, pui:4,
    vitNote:'rapide entre les réunions', pasNote:'passe optimisée', puiNote:'frappe rentable',
    role: 'MANAGER', roleIcon: '💼', roleNote: 'Budget géré, terrain payé',
  },
  'Ligue 1': {
    name: 'Julien Magnifique', nickname: 'Légende dans sa Tête',
    quote: '"Son pic de forme était sous Sarkozy. Il y croit encore."',
    face: '🕰️', hat: '📰', extra: '🏆',
    vit:4, pas:3, pui:3,
    vitNote:'2007 il était rapide', pasNote:'classe intemporelle', puiNote:'souvenir de frappe',
    role: 'LÉGENDE', roleIcon: '🏆', roleNote: 'Époque 2007-2009',
  },
  'Serie A': {
    name: 'Marco Bellisimo', nickname: 'Venu pour la Boulangerie',
    quote: '"Croissant le matin, but splendide le soir. La bella vita."',
    face: '😍', hat: '🥐', extra: '🇮🇹',
    vit:4, pas:4, pui:3,
    vitNote:'rapide comme un espresso', pasNote:'belle comme la pasta', puiNote:'frappe bellissima',
    role: 'ARTISTE', roleIcon: '🎨', roleNote: 'Beauté > efficacité',
  },
  'Bundesliga': {
    name: 'Hans Präzision', nickname: 'Précis comme une Montre',
    quote: '"Tir millimétré. Arrive systématiquement à la 23e minute."',
    face: '🤖', hat: '⌚', extra: '🎯',
    vit:4, pas:4, pui:4,
    vitNote:'calculée au millimètre', pasNote:'précision horlogère', puiNote:'tir programmé',
    role: 'MACHINE', roleIcon: '🤖', roleNote: '96% de précision',
  },
  'Liga': {
    name: 'El Magnifico Pérez', nickname: 'Dribble en Espagnol, Plonge en Français',
    quote: '"Technique espagnole, simulation française. Le meilleur des deux mondes."',
    face: '🎭', hat: '🇪🇸', extra: '🌹',
    vit:4, pas:5, pui:3,
    vitNote:'Ole ! Ole !', pasNote:'passe comme Xavi', puiNote:'frappe ou plonge ?',
    role: 'ACTEUR', roleIcon: '🎭', roleNote: '3 simulations / match',
  },
  'Premier League': {
    name: 'Sir Johnny Footix', nickname: 'Play Like English, Cry Like French',
    quote: '"Joue dur, tacle tout, pleure à la moindre faute adverse."',
    face: '😤', hat: '🦁', extra: '😭',
    vit:4, pas:4, pui:5,
    vitNote:'sprint de guerrier', pasNote:'direct au but', puiNote:'frappe comme un lion',
    role: 'WARRIOR', roleIcon: '🦁', roleNote: '8 tacles / match',
  },
  'Ligue des Champions': {
    name: 'Zlatano Jr.', nickname: 'Héritier de Tout, Formé par Personne',
    quote: '"Il est venu au monde avec la technique. Personne ne lui a rien appris."',
    face: '🦅', hat: '👑', extra: '💎',
    vit:5, pas:4, pui:4,
    vitNote:'dépasse les défenseurs', pasNote:'vision extra-terrestre', puiNote:'frappe de légende',
    role: 'PRODIGE', roleIcon: '👑', roleNote: 'Talent naturel max',
  },
  'Euro': {
    name: 'Eurico Deluxe', nickname: 'Formé à la PlayStation',
    quote: '"FIFA Div 1 depuis 2009. Sur le terrain, ça passe moins bien."',
    face: '🕹️', hat: '🌍', extra: '🎮',
    vit:5, pas:5, pui:4,
    vitNote:'L2 + carré enfoncés', pasNote:'comme en FIFA', puiNote:'bouton triangle',
    role: 'GAMER', roleIcon: '🕹️', roleNote: 'FIFA div1 × terrain div3',
  },
  'Coupe du Monde': {
    name: 'Mondialino', nickname: 'Seul Français à avoir Gagné Seul',
    quote: '"Les 10 autres étaient juste là pour tenir compagnie."',
    face: '🌍', hat: '🏆', extra: '🥇',
    vit:5, pas:5, pui:5,
    vitNote:'vitesse mondiale', pasNote:'passe de champion', puiNote:'frappe décisive',
    role: 'CHAMPION', roleIcon: '🌍', roleNote: 'MVP de chaque match',
  },
  'GOAT': {
    name: 'Menaldo', nickname: 'Messi + Ronaldo + Garges-lès-Gonesse',
    quote: '"Portugal ? Argentine ? Non. 93. Le vrai berceau du foot mondial."',
    face: '🐐', hat: '👑', extra: '🌟',
    vit:5, pas:5, pui:5,
    vitNote:'insaisissable', pasNote:'assist du siècle', puiNote:'but de Dieu',
    role: 'G.O.A.T', roleIcon: '🐐', roleNote: 'Intransférable',
  },
};

// ─── Styles visuels par tier (atmo = fond photo) ──────────────────────────────
const CARD_STYLE: Record<string, {
  bg: string; atmo: string; atmo2: string;
  border: string; glowLayers: number;
}> = {
  D4: { bg:'#0C0C0C', atmo:'#0A160A', atmo2:'#0E200E', border:'#252525', glowLayers:0 },
  D3: { bg:'#0C0C0C', atmo:'#0C1A0C', atmo2:'#112611', border:'#2A2A2A', glowLayers:0 },
  D2: { bg:'#0C0C0C', atmo:'#0D1C0D', atmo2:'#122812', border:'#2E2E2E', glowLayers:0 },
  D1: { bg:'#0C0C0C', atmo:'#0F1E0F', atmo2:'#142C14', border:'#323232', glowLayers:0 },
  R3: { bg:'#0A0A0F', atmo:'#0A0F1A', atmo2:'#0F1A2E', border:'#25253A', glowLayers:0 },
  R2: { bg:'#0A0A0F', atmo:'#090E1C', atmo2:'#0E1A34', border:'#28283C', glowLayers:1 },
  R1: { bg:'#0A0A0F', atmo:'#080D1C', atmo2:'#0C1830', border:'#2A2A42', glowLayers:1 },
  N3: { bg:'#090F09', atmo:'#081408', atmo2:'#0B1E0C', border:'#252E25', glowLayers:1 },
  N2: { bg:'#080E08', atmo:'#071207', atmo2:'#091C0A', border:'#222A22', glowLayers:1 },
  N1: { bg:'#080E08', atmo:'#061006', atmo2:'#0A1A0A', border:'#1E281E', glowLayers:2 },
  'Ligue 2':  { bg:'#0D0B00', atmo:'#150F00', atmo2:'#1E1500', border:'#2E2400', glowLayers:1 },
  'Ligue 1':  { bg:'#0E0C00', atmo:'#1A1100', atmo2:'#261800', border:'#382C00', glowLayers:2 },
  'Serie A':  { bg:'#0E0700', atmo:'#1A0C00', atmo2:'#261200', border:'#381600', glowLayers:2 },
  'Bundesliga':{ bg:'#0E0000', atmo:'#1A0000', atmo2:'#260000', border:'#380808', glowLayers:2 },
  'Liga':     { bg:'#0F0000', atmo:'#1C0000', atmo2:'#2A0000', border:'#3E0808', glowLayers:2 },
  'Premier League': { bg:'#0E0000', atmo:'#1C0000', atmo2:'#2A0000', border:'#400000', glowLayers:3 },
  'Ligue des Champions': { bg:'#07070F', atmo:'#0C0C20', atmo2:'#121232', border:'#1E1C38', glowLayers:2 },
  'Euro':     { bg:'#060610', atmo:'#0A0A1C', atmo2:'#0E0E2A', border:'#181630', glowLayers:3 },
  'Coupe du Monde': { bg:'#05050F', atmo:'#08081A', atmo2:'#0C0C24', border:'#161428', glowLayers:3 },
  'GOAT':     { bg:'#0A0500', atmo:'#180800', atmo2:'#280D00', border:'#3C1000', glowLayers:4 },
};

// ─── Étoiles ──────────────────────────────────────────────────────────────────
function Stars({ value, size }: { value: number; size: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[0,1,2,3,4].map(i => (
        <Text key={i} style={{ fontSize: size, color: i < value ? '#D4AF37' : 'rgba(255,255,255,0.13)' }}>
          ★
        </Text>
      ))}
    </View>
  );
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface PlayerStats {
  matchesPlayed: number; matchesOrganized: number;
  avgRating: number | null; ratingsGiven: number; noShows: number;
}
interface Props {
  pseudo: string; rank: string; score: number;
  stats: PlayerStats; avatarId?: string;
  onPress?: () => void; size?: 'full' | 'mini';
  disableAnimations?: boolean; scale?: number;
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function PlayerCard({
  pseudo, rank, score, stats, avatarId,
  onPress, size = 'full', disableAnimations = false, scale: scaleProp = 1,
}: Props) {
  const cfg    = getLevelConfig(rank);
  const cs     = CARD_STYLE[rank] ?? CARD_STYLE['D4'];
  const char   = CARD_CHARACTERS[rank] ?? CARD_CHARACTERS['D4'];
  const avatar = MANGA_AVATARS.find(a => a.id === avatarId) ?? MANGA_AVATARS[0];
  const isElite = ['Ligue des Champions','Euro','Coupe du Monde','GOAT'].includes(rank);
  const cardScore = CARD_SCORES[rank] ?? 50;
  const tierInfo  = getTierDisplay(rank);

  const floatY    = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (disableAnimations) return;
    if (size === 'full') {
      Animated.loop(Animated.sequence([
        Animated.timing(floatY, { toValue: -5, duration: 2400, useNativeDriver: true }),
        Animated.timing(floatY, { toValue:  0, duration: 2400, useNativeDriver: true }),
      ])).start();
    }
    if (isElite) {
      Animated.loop(Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1,    duration: 1200, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.35, duration: 1200, useNativeDriver: true }),
      ])).start();
    }
  }, [rank, size, disableAnimations]); // eslint-disable-line react-hooks/exhaustive-deps

  const cW      = (size === 'mini' ? CARD_WIDTH * 0.48 : CARD_WIDTH) * scaleProp;
  const cH      = cW * 1.56;
  const m       = (size === 'mini' ? 0.48 : 1) * scaleProp;
  const photoH  = cH * 0.44;
  const crownH  = m * 38;

  const isFull  = size === 'full';

  const cardContent = (
    <View style={{ width: cW, paddingTop: crownH * 0.55, alignItems: 'center' }}>

      {/* ── COURONNE ──────────────────────────────────────────────────────────── */}
      <View style={{ position: 'absolute', top: 0, zIndex: 100, width: '100%', alignItems: 'center' }}
            pointerEvents="none">
        <View style={[s.crownWrap, {
          width: crownH * 1.8, height: crownH * 1.3,
          borderRadius: crownH * 0.8,
          backgroundColor: cs.bg,
          borderColor: '#D4AF37' + '55',
          shadowColor: '#D4AF37',
          elevation: 10,
        }]}>
          <Text style={{ fontSize: crownH * 0.72 }}>👑</Text>
        </View>
      </View>

      {/* ── CARTE ─────────────────────────────────────────────────────────────── */}
      <Animated.View style={[s.card, {
        width: cW, height: cH,
        backgroundColor: cs.bg,
        borderColor: cs.border,
        borderWidth: 2,
        shadowColor: disableAnimations ? 'transparent' : cfg.color,
        shadowOffset: { width: 0, height: disableAnimations ? 0 : 10 },
        shadowOpacity: disableAnimations ? 0 : 0.55,
        shadowRadius: disableAnimations ? 0 : 22,
        elevation: disableAnimations ? 0 : 14,
        transform: (!disableAnimations && isFull) ? [{ translateY: floatY }] : [],
      }]}>

        {/* Bordure intérieure lumineuse */}
        <View style={[s.innerBorder, { borderColor: cfg.color + '18' }]} pointerEvents="none" />

        {/* ── SECTION PHOTO ───────────────────────────────────────────────────── */}
        <View style={{ height: photoH, overflow: 'hidden' }}>

          {/* Fond atmosphérique */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#07100A' }]} />
          <View style={{
            position: 'absolute',
            left: -cW * 0.15, top: -cW * 0.25,
            width: cW * 1.3, height: cW * 1.3,
            borderRadius: cW * 0.65,
            backgroundColor: cs.atmo,
          }} />
          <View style={{
            position: 'absolute',
            left: cW * 0.12, top: -cW * 0.08,
            width: cW * 0.76, height: cW * 0.76,
            borderRadius: cW * 0.38,
            backgroundColor: cs.atmo2,
          }} />

          {/* Avatar principal — centré dans l'espace au-dessus du nom overlay */}
          <View style={[s.avatarCenter, { bottom: m * 62 }]} pointerEvents="none">
            <Text style={{ fontSize: m * 115, lineHeight: m * 120 }}>{char.face}</Text>
          </View>

          {/* Score — haut gauche */}
          <View style={[s.scoreOverlay, { padding: m * 10 }]}>
            <Text style={[s.scoreNum, { fontSize: m * 68, color: cfg.color, lineHeight: m * 64 }]}>
              {cardScore}
            </Text>
            <Text style={[s.scoreLabel, { fontSize: m * 9, color: cfg.color + 'AA' }]}>SCORE</Text>
          </View>

          {/* Tier — haut droit */}
          <View style={[s.tierOverlay, { padding: m * 10 }]}>
            <View style={[s.tierBadge, {
              borderColor: cfg.color + '55',
              backgroundColor: 'rgba(0,0,0,0.55)',
            }]}>
              <Text style={[s.tierLabel, { fontSize: m * 8, color: cfg.color }]}>
                {tierInfo.tier}
              </Text>
            </View>
            <Text style={[s.gradeText, { fontSize: m * 22, color: cfg.color }]}>
              {tierInfo.grade}
            </Text>
            <Text style={{ fontSize: m * 16 }}>⚽</Text>
          </View>

          {/* Overlay nom — bas de la photo */}
          <View style={s.nameOverlay}>
            {/* Lignes dorées décoratives */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <View style={s.dividerDot} />
              <View style={s.dividerLine} />
            </View>
            <Text style={[s.charName, { fontSize: m * 21 }]} numberOfLines={1}>
              {char.name}
            </Text>
            <Text style={[s.charNick, { fontSize: m * 10.5 }]} numberOfLines={1}>
              {char.nickname}
            </Text>
          </View>
        </View>

        {/* ── BADGE RÔLE ──────────────────────────────────────────────────────── */}
        {isFull && (
          <View style={[s.roleBadge, {
            borderTopColor: cs.border,
            borderBottomColor: cs.border,
            backgroundColor: '#0C0C0C',
          }]}>
            <Text style={[s.roleText, { fontSize: m * 12.5, color: '#4ADE80' }]}>{char.role}</Text>
            <Text style={{ fontSize: m * 13 }}> {char.roleIcon}</Text>
            <View style={[s.roleDot, { backgroundColor: cfg.color + '55' }]} />
            <Text style={[s.roleNote, { fontSize: m * 11, color: '#D0D0D0' }]}>
              ⚡ {char.roleNote}
            </Text>
          </View>
        )}

        {/* ── STATS ───────────────────────────────────────────────────────────── */}
        {isFull && [
          { icon:'⚔️', label:'ATTAQUE',   value: char.vit, note: char.vitNote },
          { icon:'🛡️', label:'DEFENSE',   value: char.pas, note: char.pasNote },
          { icon:'💪',  label:'ENDURANCE', value: char.pui, note: char.puiNote },
        ].map((stat, idx) => (
          <View key={stat.label} style={[s.statRow, {
            backgroundColor: idx === 1 ? '#0F0F0F' : '#0C0C0C',
            borderTopColor: '#1C1C1C',
          }]}>
            <Text style={[s.statIcon, { fontSize: m * 18, width: m * 28 }]}>{stat.icon}</Text>
            <View style={s.statInfo}>
              <Text style={[s.statName, { fontSize: m * 11.5, color: '#FFFFFF' }]}>{stat.label}</Text>
              <Text style={[s.statDesc, { fontSize: m * 9.5 }]} numberOfLines={1}>{stat.note}</Text>
            </View>
            <Stars value={stat.value} size={m * 13} />
          </View>
        ))}

        {/* ── CITATION ────────────────────────────────────────────────────────── */}
        {isFull && (
          <View style={[s.quoteSection, { borderTopColor: '#1C1C1C' }]}>
            <Text style={[s.quoteText, { fontSize: m * 10.5, color: cfg.color + 'AA' }]} numberOfLines={2}>
              {char.quote}
            </Text>
          </View>
        )}

        {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
        {isFull && (
          <View style={[s.footer, { borderTopColor: '#1C1C1C' }]}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={[s.trophyCircle, { borderColor: cfg.color + '40' }]}>
                <Text style={{ fontSize: m * 16 }}>🏆</Text>
                <Text style={[s.trophyYear, { fontSize: m * 7, color: '#777' }]}>2026</Text>
              </View>
            </View>
            <Text style={[s.brandText, { fontSize: m * 12, color: '#D0D0D0' }]}>Foot Match ®</Text>
          </View>
        )}

        {/* Glow ring élite */}
        {!disableAnimations && isElite && (
          <Animated.View style={[s.eliteGlow, { borderColor: cfg.color, opacity: glowPulse }]} />
        )}
        {!disableAnimations && cs.glowLayers >= 2 && (
          <Animated.View style={[s.eliteGlow2, { borderColor: cfg.color + '44', opacity: glowPulse }]} />
        )}

      </Animated.View>
    </View>
  );

  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.88}>{cardContent}</TouchableOpacity>
    : cardContent;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Carte principale
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'column',
  },
  innerBorder: {
    position: 'absolute', top: 2, left: 2, right: 2, bottom: 2,
    borderRadius: 18, borderWidth: 1, zIndex: 1,
  },

  // Couronne
  crownWrap: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },

  // Score (overlay absolu haut-gauche)
  scoreOverlay: { position: 'absolute', top: 0, left: 0, zIndex: 3 },
  scoreNum:     { fontWeight: '900', letterSpacing: -2 },
  scoreLabel:   { fontWeight: '800', letterSpacing: 2.5, marginTop: -8 },

  // Tier (overlay absolu haut-droit)
  tierOverlay: { position: 'absolute', top: 0, right: 0, zIndex: 3, alignItems: 'flex-end', gap: 3 },
  tierBadge:   { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  tierLabel:   { fontWeight: '800', letterSpacing: 0.3 },
  gradeText:   { fontWeight: '900', letterSpacing: -0.3 },

  // Avatar
  avatarCenter: {
    position: 'absolute', top: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },

  // Overlay nom
  nameOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
    backgroundColor: 'rgba(0,0,0,0.68)',
    paddingHorizontal: 12, paddingTop: 5, paddingBottom: 8,
    alignItems: 'center', gap: 2,
  },
  dividerRow:  { flexDirection: 'row', alignItems: 'center', width: '72%', marginBottom: 3 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#C9A227', opacity: 0.7 },
  dividerDot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#C9A227', marginHorizontal: 5 },
  charName:    { fontWeight: '900', letterSpacing: 0.3, color: '#FFFFFF', textAlign: 'center' },
  charNick:    { fontStyle: 'italic', color: '#BBBBBB', textAlign: 'center', opacity: 0.9 },

  // Rôle
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, paddingHorizontal: 14,
    borderTopWidth: 1, borderBottomWidth: 1,
  },
  roleText: { fontWeight: '800', letterSpacing: 0.5 },
  roleNote: { fontWeight: '500' },
  roleDot:  { width: 4, height: 4, borderRadius: 2, marginHorizontal: 7 },

  // Stats
  statRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 13,
    borderTopWidth: 1, gap: 6,
  },
  statIcon: { textAlign: 'center' },
  statInfo: { flex: 1, gap: 1 },
  statName: { fontWeight: '800', letterSpacing: 0.3 },
  statDesc: { fontStyle: 'italic', color: '#888888', lineHeight: 13 },

  // Citation — flex:1 pour remplir l'espace restant et centrer le texte
  quoteSection: {
    flex: 1,
    paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  quoteText: { fontStyle: 'italic', textAlign: 'center', lineHeight: 15 },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 7,
    borderTopWidth: 1,
  },
  trophyCircle: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  trophyYear: { fontWeight: '700', letterSpacing: 1, marginTop: -2 },
  brandText:  { fontWeight: '700', letterSpacing: 0.3 },

  // Glow élite
  eliteGlow:  { position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 23, borderWidth: 2 },
  eliteGlow2: { position: 'absolute', top: -7, left: -7, right: -7, bottom: -7, borderRadius: 27, borderWidth: 1.5 },
});
