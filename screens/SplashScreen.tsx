// screens/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const bgOpacity      = useRef(new Animated.Value(0)).current;
  const ball1X         = useRef(new Animated.Value(-100)).current;
  const ball1Y         = useRef(new Animated.Value(height * 0.6)).current;
  const ball1Scale     = useRef(new Animated.Value(0.5)).current;
  const ball1Rotate    = useRef(new Animated.Value(0)).current;
  const ball2X         = useRef(new Animated.Value(width + 100)).current;
  const ball2Scale     = useRef(new Animated.Value(0.3)).current;
  const flashOpacity   = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0)).current;
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoY          = useRef(new Animated.Value(60)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY       = useRef(new Animated.Value(20)).current;
  const glowOpacity    = useRef(new Animated.Value(0)).current;
  const glowScale      = useRef(new Animated.Value(0.5)).current;
  const particle1      = useRef(new Animated.Value(0)).current;
  const particle2      = useRef(new Animated.Value(0)).current;
  const particle3      = useRef(new Animated.Value(0)).current;
  const ctaOpacity     = useRef(new Animated.Value(0)).current;
  const screenFlash    = useRef(new Animated.Value(0)).current;
  const mangaLines     = useRef(new Animated.Value(0)).current;

  useEffect(() => { runAnimation(); }, []);

  function runAnimation() {
    Animated.timing(bgOpacity, { toValue:1, duration:300, useNativeDriver:true }).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ball1X,      { toValue:width+150, duration:800, useNativeDriver:true }),
        Animated.timing(ball1Y,      { toValue:height*0.35, duration:800, useNativeDriver:true }),
        Animated.timing(ball1Scale,  { toValue:1.4, duration:800, useNativeDriver:true }),
        Animated.timing(ball1Rotate, { toValue:3, duration:800, useNativeDriver:true }),
      ]).start();
    }, 200);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ball2X,     { toValue:-150, duration:600, useNativeDriver:true }),
        Animated.timing(ball2Scale, { toValue:1.2,  duration:600, useNativeDriver:true }),
      ]).start();
    }, 500);

    setTimeout(() => {
      Animated.sequence([
        Animated.timing(screenFlash, { toValue:1, duration:80,  useNativeDriver:true }),
        Animated.timing(screenFlash, { toValue:0, duration:150, useNativeDriver:true }),
      ]).start();
      Animated.timing(mangaLines, { toValue:1, duration:400, useNativeDriver:true }).start();
    }, 900);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue:1, duration:200, useNativeDriver:true }),
        Animated.spring(glowScale,   { toValue:1.8, useNativeDriver:true, tension:40, friction:5 }),
      ]).start(() => {
        Animated.timing(glowOpacity, { toValue:0.3, duration:400, useNativeDriver:true }).start();
      });
    }, 950);

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(logoScale,   { toValue:1, useNativeDriver:true, tension:80, friction:6 }),
        Animated.timing(logoOpacity, { toValue:1, duration:300, useNativeDriver:true }),
        Animated.spring(logoY,       { toValue:0, useNativeDriver:true, tension:80, friction:8 }),
      ]).start();
      Animated.sequence([
        Animated.timing(flashOpacity, { toValue:0.6, duration:60,  useNativeDriver:true }),
        Animated.timing(flashOpacity, { toValue:0,   duration:200, useNativeDriver:true }),
      ]).start();
    }, 1100);

    setTimeout(() => {
      Animated.stagger(100, [
        Animated.timing(particle1, { toValue:1, duration:600, useNativeDriver:true }),
        Animated.timing(particle2, { toValue:1, duration:600, useNativeDriver:true }),
        Animated.timing(particle3, { toValue:1, duration:600, useNativeDriver:true }),
      ]).start();
    }, 1300);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue:1, duration:500, useNativeDriver:true }),
        Animated.spring(taglineY,       { toValue:0, useNativeDriver:true, tension:60, friction:8 }),
      ]).start();
    }, 1500);

    setTimeout(() => {
      Animated.timing(ctaOpacity, { toValue:1, duration:400, useNativeDriver:true }).start();
    }, 2000);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity,    { toValue:0, duration:400, useNativeDriver:true }),
        Animated.timing(taglineOpacity, { toValue:0, duration:400, useNativeDriver:true }),
        Animated.timing(ctaOpacity,     { toValue:0, duration:400, useNativeDriver:true }),
        Animated.timing(bgOpacity,      { toValue:0, duration:400, useNativeDriver:true }),
      ]).start(() => onFinish());
    }, 3200);
  }

  const ball1RotateDeg = ball1Rotate.interpolate({ inputRange:[0,3], outputRange:['0deg','1080deg'] });
  const mangaLinesOpacity = mangaLines.interpolate({ inputRange:[0,0.3,1], outputRange:[0,1,0] });
  const p1Y = particle1.interpolate({ inputRange:[0,1], outputRange:[0,-80] });
  const p1X = particle1.interpolate({ inputRange:[0,1], outputRange:[0,-60] });
  const p2Y = particle2.interpolate({ inputRange:[0,1], outputRange:[0,-100] });
  const p2X = particle2.interpolate({ inputRange:[0,1], outputRange:[0,40] });
  const p3Y = particle3.interpolate({ inputRange:[0,1], outputRange:[0,-70] });
  const p3X = particle3.interpolate({ inputRange:[0,1], outputRange:[0,80] });

  return (
    <Animated.View style={[s.container, { opacity: bgOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={s.bg} />

      <Animated.View style={[s.mangaContainer, { opacity: mangaLinesOpacity }]}>
        {Array.from({length:20}).map((_,i) => (
          <View key={i} style={[s.mangaLine, {
            top:`${(i/20)*100}%` as any,
            left: i%2===0 ? 0 : undefined,
            right: i%2!==0 ? 0 : undefined,
            width:`${40+((i*7)%40)}%` as any,
            opacity: 0.1 + ((i*3)%20)/100,
            height: 1 + (i%3===0 ? 1 : 0),
          }]} />
        ))}
      </Animated.View>

      <Animated.View style={[s.screenFlash, { opacity: screenFlash }]} />
      <Animated.View style={[s.screenFlash, { opacity: flashOpacity, backgroundColor:'#00FF66' }]} />

      <Animated.View style={[s.ball, { transform:[{ translateX:ball1X },{ translateY:ball1Y },{ scale:ball1Scale },{ rotate:ball1RotateDeg }] }]}>
        <Text style={s.ballEmoji}>⚽</Text>
        <View style={s.trail1} />
        <View style={s.trail2} />
      </Animated.View>

      <Animated.View style={[s.ball2, { transform:[{ translateX:ball2X },{ scale:ball2Scale }] }]}>
        <Text style={s.ball2Emoji}>⚽</Text>
      </Animated.View>

      <Animated.View style={[s.glow, { opacity:glowOpacity, transform:[{ scale:glowScale }] }]} />

      <Animated.View style={[s.particle, s.p1, { opacity:particle1, transform:[{translateY:p1Y},{translateX:p1X}] }]}><Text style={s.particleText}>✦</Text></Animated.View>
      <Animated.View style={[s.particle, s.p2, { opacity:particle2, transform:[{translateY:p2Y},{translateX:p2X}] }]}><Text style={s.particleText}>★</Text></Animated.View>
      <Animated.View style={[s.particle, s.p3, { opacity:particle3, transform:[{translateY:p3Y},{translateX:p3X}] }]}><Text style={s.particleText}>⚡</Text></Animated.View>

      <View style={s.center}>
        <View style={s.lineRow}>
          <View style={s.lineLeft} />
          <View style={s.lineDot} />
          <View style={s.lineRight} />
        </View>

        <Animated.View style={[s.logoWrap, { opacity:logoOpacity, transform:[{ scale:logoScale },{ translateY:logoY }] }]}>
          <Text style={s.logoText}>FOOT<Text style={s.logoGreen}>MATCH</Text></Text>
          <Text style={s.logoBall}>⚽</Text>
        </Animated.View>

        <Animated.View style={[s.taglineWrap, { opacity:taglineOpacity, transform:[{ translateY:taglineY }] }]}>
          <Text style={s.tagline}>TON TERRAIN. TON MATCH.</Text>
          <Text style={s.taglineSub}>LA LÉGENDE COMMENCE ICI</Text>
        </Animated.View>

        <Animated.View style={[s.ctaWrap, { opacity:ctaOpacity }]}>
          <View style={s.ctaDots}>
            <View style={s.ctaDot} />
            <View style={[s.ctaDot, s.ctaDotActive]} />
            <View style={s.ctaDot} />
          </View>
          <Text style={s.ctaText}>CHARGEMENT...</Text>
        </Animated.View>
      </View>

      <View style={[s.corner, s.cornerTL]} />
      <View style={[s.corner, s.cornerTR]} />
      <View style={[s.corner, s.cornerBL]} />
      <View style={[s.corner, s.cornerBR]} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor:'#000' },
  bg:            { ...StyleSheet.absoluteFillObject, backgroundColor:'#050505' },
  mangaContainer:{ ...StyleSheet.absoluteFillObject, overflow:'hidden' },
  mangaLine:     { position:'absolute', backgroundColor:'#fff' },
  screenFlash:   { ...StyleSheet.absoluteFillObject, backgroundColor:'#fff', zIndex:10 },
  ball:          { position:'absolute', top:0, left:0, zIndex:5 },
  ballEmoji:     { fontSize:64 },
  trail1:        { position:'absolute', right:0, top:'40%', width:100, height:3, backgroundColor:'rgba(0,255,102,0.5)', borderRadius:2 },
  trail2:        { position:'absolute', right:0, top:'55%', width:140, height:2, backgroundColor:'rgba(0,255,102,0.25)', borderRadius:2 },
  ball2:         { position:'absolute', top:100, left:0, zIndex:4 },
  ball2Emoji:    { fontSize:36 },
  glow:          { position:'absolute', alignSelf:'center', top:'42%', width:200, height:200, borderRadius:100, backgroundColor:'rgba(0,255,102,0.15)', zIndex:2 },
  particle:      { position:'absolute', zIndex:6 },
  particleText:  { fontSize:20, color:'#00FF66' },
  p1:            { top:'45%', left:'30%' },
  p2:            { top:'48%', left:'50%' },
  p3:            { top:'46%', left:'65%' },
  center:        { flex:1, alignItems:'center', justifyContent:'center', zIndex:8 },
  lineRow:       { flexDirection:'row', alignItems:'center', gap:8, marginBottom:20 },
  lineLeft:      { width:80, height:1, backgroundColor:'rgba(0,255,102,0.5)' },
  lineRight:     { width:80, height:1, backgroundColor:'rgba(0,255,102,0.5)' },
  lineDot:       { width:6, height:6, borderRadius:3, backgroundColor:'#00FF66' },
  logoWrap:      { alignItems:'center', marginBottom:20 },
  logoText:      { fontSize:52, fontWeight:'900', color:'#fff', letterSpacing:4 },
  logoGreen:     { color:'#00FF66' },
  logoBall:      { fontSize:28, marginTop:4 },
  taglineWrap:   { alignItems:'center', gap:6 },
  tagline:       { fontSize:13, fontWeight:'900', color:'rgba(255,255,255,0.9)', letterSpacing:4 },
  taglineSub:    { fontSize:10, color:'rgba(0,255,102,0.7)', letterSpacing:3 },
  ctaWrap:       { marginTop:48, alignItems:'center', gap:10 },
  ctaDots:       { flexDirection:'row', gap:8 },
  ctaDot:        { width:6, height:6, borderRadius:3, backgroundColor:'rgba(255,255,255,0.2)' },
  ctaDotActive:  { backgroundColor:'#00FF66', width:20 },
  ctaText:       { fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:3 },
  corner:        { position:'absolute', width:20, height:20, borderColor:'rgba(0,255,102,0.4)', zIndex:9 },
  cornerTL:      { top:56, left:20, borderTopWidth:2, borderLeftWidth:2 },
  cornerTR:      { top:56, right:20, borderTopWidth:2, borderRightWidth:2 },
  cornerBL:      { bottom:40, left:20, borderBottomWidth:2, borderLeftWidth:2 },
  cornerBR:      { bottom:40, right:20, borderBottomWidth:2, borderRightWidth:2 },
});
