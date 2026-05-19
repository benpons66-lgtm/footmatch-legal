import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Animated, StatusBar, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../constants/theme';

const { width: W } = Dimensions.get('window');

type IllustrationKey = 'logo' | 'people' | 'trophy';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SLIDES: {
  illustration: IllustrationKey;
  badge:    string;
  title1:   string;
  title2:   string;
  sub:      string;
  stat:     string;
  btnLabel: string;
  btnIcon:  IoniconName;
  accent:   string;
}[] = [
  {
    illustration: 'logo',
    badge:    '📍 PRÈS DE TOI',
    title1:   'Trouve ton',
    title2:   'match maintenant',
    sub:      'Five, city stade, foot à 11 — filtre par niveau, distance et type.',
    stat:     '⚡ Match en 30 secondes',
    btnLabel: 'Trouver un match',
    btnIcon:  'arrow-forward',
    accent:   Colors.green,
  },
  {
    illustration: 'people',
    badge:    '👥 COMMUNAUTÉ SÉRIEUSE',
    title1:   'Joue avec des',
    title2:   'joueurs fiables',
    sub:      'Notes, niveaux et réputation pour trouver les bons joueurs à chaque match.',
    stat:     '💬 Chat en direct',
    btnLabel: 'Continuer',
    btnIcon:  'arrow-forward',
    accent:   Colors.greenLight,
  },
  {
    illustration: 'trophy',
    badge:    '🚀 100% GRATUIT',
    title1:   'Le terrain dans',
    title2:   'ta poche',
    sub:      'Inscris-toi en 20 secondes. Gratuit. Sans abonnement. Aucune CB, aucun engagement.',
    stat:     '⚽ Rejoins la communauté',
    btnLabel: 'Commencer gratuitement',
    btnIcon:  'rocket',
    accent:   Colors.green,
  },
];

interface Props {
  onStart:  () => void;
  onLogin:  () => void;
  onGuest?: () => void;
}

export default function OnboardingScreen({ onStart, onLogin, onGuest }: Props) {
  const [current, setCurrent] = useState(0);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  function animateIn(fromRight = true) {
    fadeAnim.setValue(0);
    slideAnim.setValue(fromRight ? 60 : -60);
    iconScale.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }

  useEffect(() => {
    animateIn(true);
    startPulse();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function goTo(index: number) {
    const forward = index > current;
    setCurrent(index);
    animateIn(forward);
  }

  function next() {
    if (current < SLIDES.length - 1) goTo(current + 1);
    else onStart();
  }

  const slide = SLIDES[current];

  function renderIllustration() {
    if (slide.illustration === 'logo') {
      return (
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Image
            source={require('../assets/logo footmatch transparent.png')}
            style={s.logoImg}
            resizeMode="contain"
          />
        </Animated.View>
      );
    }
    if (slide.illustration === 'people') {
      return (
        <Animated.View style={[s.iconWrap, { transform: [{ scale: iconScale }] }]}>
          <Ionicons name="people" size={72} color={slide.accent} />
          <View style={[s.shieldBadge, { backgroundColor: slide.accent }]}>
            <Ionicons name="star" size={14} color="#000" />
          </View>
        </Animated.View>
      );
    }
    // trophy
    return (
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <Ionicons name="trophy" size={80} color={slide.accent} />
      </Animated.View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Background glow */}
      <Animated.View style={[s.glow, { backgroundColor: slide.accent + '15', transform: [{ scale: pulseAnim }] }]} />

      {/* Skip */}
      {current < SLIDES.length - 1 && (
        <TouchableOpacity style={s.skip} onPress={onStart} activeOpacity={0.6}>
          <Text style={s.skipText}>Passer</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Illustration */}
      <Animated.View style={[s.illustrationWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Animated.View style={[s.appIcon, { borderColor: slide.accent + '50', transform: [{ scale: pulseAnim }] }]}>
          {renderIllustration()}
        </Animated.View>
      </Animated.View>

      {/* Content */}
      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Badge */}
        <View style={[s.badge, { backgroundColor: slide.accent + '15', borderColor: slide.accent + '40' }]}>
          <Text style={[s.badgeText, { color: slide.accent }]}>{slide.badge}</Text>
        </View>

        {/* Titre 2 lignes */}
        <Text style={s.title}>
          {slide.title1}{'\n'}
          <Text style={[s.title, { color: slide.accent }]}>{slide.title2}</Text>
        </Text>

        {/* Sous-titre */}
        <Text style={s.sub}>{slide.sub}</Text>

        {/* Stat pill */}
        <View style={[s.statPill, { borderColor: slide.accent + '30' }]}>
          <Text style={[s.statPillText, { color: slide.accent }]}>{slide.stat}</Text>
        </View>
      </Animated.View>

      {/* Dots */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
            <Animated.View style={[s.dot, i === current && [s.dotActive, { backgroundColor: slide.accent }]]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <View style={s.cta}>
        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: slide.accent }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={s.ctaBtnText}>{slide.btnLabel}</Text>
          <Ionicons name={slide.btnIcon} size={18} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={s.loginBtn} onPress={onLogin} activeOpacity={0.7}>
          <Text style={s.loginText}>J'ai déjà un compte →</Text>
        </TouchableOpacity>

        {onGuest && (
          <TouchableOpacity style={s.guestBtn} onPress={onGuest} activeOpacity={0.5}>
            <Ionicons name="eye-outline" size={13} color="rgba(255,255,255,0.2)" />
            <Text style={s.guestText}>Continuer en tant qu'invité</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex:1, backgroundColor:'#080C08', alignItems:'center', paddingHorizontal:28, paddingTop: Platform.OS==='ios'?60:48, paddingBottom: Platform.OS==='ios'?44:28 },
  glow:             { position:'absolute', width:W*1.4, height:W*1.4, borderRadius:W*0.7, top:-W*0.4, alignSelf:'center', pointerEvents:'none' },
  skip:             { position:'absolute', top: Platform.OS==='ios'?56:40, right:24, flexDirection:'row', alignItems:'center', gap:5, zIndex:10 },
  skipText:         { color:Colors.textMuted, fontSize:14, fontWeight:'500' },

  // Illustration — cadre style app icon
  illustrationWrap: { flex:1, alignItems:'center', justifyContent:'center', width:'100%' },
  appIcon:          { width:200, height:200, borderRadius:44, backgroundColor:'rgba(0,230,118,0.06)', borderWidth:1.5, alignItems:'center', justifyContent:'center', shadowColor:Colors.green, shadowRadius:24, shadowOpacity:0.25, elevation:8 },
  logoImg:          { width:150, height:150 },
  iconWrap:         { alignItems:'center', justifyContent:'center' },
  shieldBadge:      { position:'absolute', bottom:-6, right:-12, width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'#080C08' },

  // Content
  content:          { width:'100%', alignItems:'center', marginBottom:24 },
  badge:            { borderWidth:1, borderRadius:Radius.full, paddingHorizontal:16, paddingVertical:7, marginBottom:18 },
  badgeText:        { fontSize:12, fontWeight:'800', letterSpacing:1 },
  title:            { fontSize:36, fontWeight:'900', color:Colors.text, textAlign:'center', lineHeight:42, letterSpacing:-0.5, marginBottom:12 },
  sub:              { fontSize:15, color:Colors.textMuted, textAlign:'center', lineHeight:22, maxWidth:300, marginBottom:4 },
  statPill:         { marginTop:12, backgroundColor:'rgba(255,255,255,0.04)', borderRadius:Radius.full, paddingHorizontal:18, paddingVertical:8, borderWidth:1 },
  statPillText:     { fontSize:13, fontWeight:'700' },

  // Dots
  dots:             { flexDirection:'row', gap:8, marginBottom:24 },
  dot:              { width:8, height:8, borderRadius:4, backgroundColor:'rgba(255,255,255,0.15)' },
  dotActive:        { width:24, borderRadius:4 },

  // CTA
  cta:              { width:'100%', gap:12 },
  ctaBtn:           { borderRadius:Radius.full, paddingVertical:17, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10 },
  ctaBtnText:       { fontSize:16, fontWeight:'900', color:'#000', letterSpacing:0.3 },
  loginBtn:         { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7, paddingVertical:10 },
  loginText:        { fontSize:14, color:Colors.textMuted, fontWeight:'500' },
  guestBtn:         { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:8 },
  guestText:        { fontSize:12, color:'rgba(255,255,255,0.2)' },
});
