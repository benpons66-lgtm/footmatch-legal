import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Animated, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../constants/theme';

const { width: W, height: H } = Dimensions.get('window');

const SLIDES = [
  {
    icon:    'football' as const,
    iconBg:  Colors.green,
    badge:   '⚡ 30 secondes pour jouer',
    title:   'Trouve ton match\nmaintenant',
    sub:     'Five, City Stade, Foot à 11 — filtre par niveau, distance et type. Plus jamais de dimanche sans ballon.',
    accent:  Colors.green,
    stat:    '🟢 +1 000 joueurs actifs',
  },
  {
    icon:    'people' as const,
    iconBg:  Colors.greenLight,
    badge:   '👥 Communauté sérieuse',
    title:   'Les vrais joueurs\nsont ici',
    sub:     'Système de réputation unique. Notes, classements, championnats — chaque match compte pour ton rang.',
    accent:  Colors.greenLight,
    stat:    '🏆 15 championnats en cours',
  },
  {
    icon:    'trophy' as const,
    iconBg:  Colors.green,
    badge:   '🚀 100% gratuit, toujours',
    title:   'Rookie → Légende\nc\'est ton histoire',
    sub:     'Inscris-toi en 20 secondes. Aucune CB, aucun abonnement. FootMatch, c\'est le terrain dans ta poche.',
    accent:  Colors.green,
    stat:    '⚽ Rejoins la communauté',
  },
];

interface Props {
  onStart:  () => void;
  onLogin:  () => void;
  onGuest?: () => void;
}

export default function OnboardingScreen({ onStart, onLogin, onGuest }: Props) {
  const [current, setCurrent] = useState(0);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const iconScale  = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const counterAnim = useRef(new Animated.Value(0)).current;

  function animateIn(fromRight = true) {
    fadeAnim.setValue(0);
    slideAnim.setValue(fromRight ? 60 : -60);
    iconScale.setValue(0);
    iconRotate.setValue(fromRight ? 0.3 : -0.3);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(iconRotate, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }

  useEffect(() => {
    animateIn(true);
    startPulse();
  }, []);

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
  const isLast = current === SLIDES.length - 1;

  const rotation = iconRotate.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] });

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Background glow */}
      <Animated.View style={[s.glow, { backgroundColor: slide.accent + '18', transform: [{ scale: pulseAnim }] }]} />

      {/* Skip */}
      {current < SLIDES.length - 1 && (
        <TouchableOpacity style={s.skip} onPress={onStart} activeOpacity={0.6}>
          <Text style={s.skipText}>Passer</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Illustration */}
      <Animated.View style={[s.illustrationWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Animated.View style={[s.iconCircleOuter, { borderColor: slide.accent + '30', transform: [{ scale: pulseAnim }] }]}>
          <Animated.View style={[s.iconCircleInner, { backgroundColor: slide.accent + '20', borderColor: slide.accent + '50', transform: [{ scale: iconScale }, { rotate: rotation }] }]}>
            <Ionicons name={slide.icon} size={64} color={slide.accent} />
          </Animated.View>
        </Animated.View>

        {/* Floating chips around the icon */}
        <View style={[s.chip, s.chipTL, { borderColor: slide.accent + '40' }]}>
          <Ionicons name="location" size={12} color={slide.accent} />
          <Text style={[s.chipText, { color: slide.accent }]}>Près de toi</Text>
        </View>
        <View style={[s.chip, s.chipBR, { borderColor: slide.accent + '40' }]}>
          <Ionicons name="people" size={12} color={slide.accent} />
          <Text style={[s.chipText, { color: slide.accent }]}>+2.4k</Text>
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={[s.badge, { backgroundColor: slide.accent + '15', borderColor: slide.accent + '35' }]}>
          <Text style={[s.badgeText, { color: slide.accent }]}>{slide.badge}</Text>
        </View>
        <Text style={s.title}>{slide.title}</Text>
        <Text style={s.sub}>{slide.sub}</Text>
        {'stat' in slide && slide.stat && (
          <View style={s.statPill}>
            <Text style={[s.statPillText, { color: slide.accent }]}>{slide.stat}</Text>
          </View>
        )}
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
          <Text style={s.ctaBtnText}>{isLast ? 'Commencer maintenant' : 'Suivant'}</Text>
          <Ionicons name={isLast ? 'rocket' : 'arrow-forward'} size={18} color="#000" />
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
  glow:             { position:'absolute', width:W*1.2, height:W*1.2, borderRadius:W*0.6, top:-W*0.3, alignSelf:'center', pointerEvents:'none' },
  skip:             { position:'absolute', top: Platform.OS==='ios'?56:40, right:24, flexDirection:'row', alignItems:'center', gap:5, zIndex:10 },
  skipText:         { color:Colors.textMuted, fontSize:14, fontWeight:'500' },

  illustrationWrap: { flex:1, alignItems:'center', justifyContent:'center', width:'100%' },
  iconCircleOuter:  { width:220, height:220, borderRadius:110, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  iconCircleInner:  { width:150, height:150, borderRadius:75, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  chip:             { position:'absolute', flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(255,255,255,0.04)', borderWidth:1, borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:5 },
  chipTL:           { top:30, left:0 },
  chipBR:           { bottom:30, right:0 },
  chipText:         { fontSize:12, fontWeight:'700' },

  content:          { width:'100%', alignItems:'center', marginBottom:28 },
  badge:            { flexDirection:'row', alignItems:'center', gap:6, borderWidth:1, borderRadius:Radius.full, paddingHorizontal:14, paddingVertical:6, marginBottom:20 },
  badgeText:        { fontSize:13, fontWeight:'700' },
  title:            { fontSize:34, fontWeight:'900', color:Colors.text, textAlign:'center', lineHeight:40, letterSpacing:-0.5, marginBottom:14 },
  sub:              { fontSize:15, color:Colors.textMuted, textAlign:'center', lineHeight:22, maxWidth:300 },

  dots:             { flexDirection:'row', gap:8, marginBottom:28 },
  dot:              { width:8, height:8, borderRadius:4, backgroundColor:'rgba(255,255,255,0.15)' },
  dotActive:        { width:24, borderRadius:4 },

  cta:              { width:'100%', gap:12 },
  ctaBtn:           { borderRadius:Radius.full, paddingVertical:17, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10 },
  ctaBtnText:       { fontSize:16, fontWeight:'900', color:'#000', letterSpacing:0.3 },
  loginBtn:         { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7, paddingVertical:10 },
  loginText:        { fontSize:14, color:Colors.textMuted, fontWeight:'500' },
  guestBtn:         { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:8 },
  guestText:        { fontSize:12, color:'rgba(255,255,255,0.2)' },
  statPill:         { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  statPillText:     { fontSize: 13, fontWeight: '700' },
});
