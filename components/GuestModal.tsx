import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../constants/theme';

interface Props {
  visible:    boolean;
  onRegister: () => void;
  onLogin:    () => void;
  onClose:    () => void;
}

const PERKS = [
  { icon: 'flash',        text: 'Rejoindre un match en 1 tap',          color: Colors.green  },
  { icon: 'add-circle',   text: 'Créer tes propres matchs',              color: '#3B82F6'     },
  { icon: 'chatbubbles',  text: 'Chatter avec les joueurs',              color: '#8B5CF6'     },
  { icon: 'trophy',       text: 'Créer et rejoindre des championnats',   color: Colors.yellow },
  { icon: 'star',         text: 'Développer ta réputation',              color: '#F97316'     },
];

export default function GuestModal({ visible, onRegister, onLogin, onClose }: Props) {
  const slideAnim   = useRef(new Animated.Value(500)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(slideAnim,   { toValue: 0, tension: 75, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim,   { toValue: 500, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[s.overlay, { opacity: overlayAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <View style={s.lockWrap}>
            <Ionicons name="lock-closed" size={26} color={Colors.green} />
          </View>
          <Text style={s.title}>Fonctionnalité membres</Text>
          <Text style={s.sub}>Crée un compte gratuit pour débloquer toutes les fonctionnalités</Text>
        </View>

        {/* Perks */}
        <View style={s.perks}>
          {PERKS.map((p, i) => (
            <View key={i} style={s.perk}>
              <View style={[s.perkIcon, { backgroundColor: p.color + '18' }]}>
                <Ionicons name={p.icon as any} size={16} color={p.color} />
              </View>
              <Text style={s.perkText}>{p.text}</Text>
              <Ionicons name="checkmark-circle" size={16} color={p.color} style={{ marginLeft: 'auto' }} />
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={s.ctas}>
          <TouchableOpacity style={s.registerBtn} onPress={onRegister} activeOpacity={0.85}>
            <Ionicons name="rocket" size={18} color="#000" />
            <Text style={s.registerText}>S'inscrire gratuitement</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.loginBtn} onPress={onLogin} activeOpacity={0.7}>
            <Text style={s.loginText}>J'ai déjà un compte · Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} activeOpacity={0.5} style={s.continueBtn}>
            <Text style={s.continueText}>Continuer en invité</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet:        { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#111811', borderTopLeftRadius:24, borderTopRightRadius:24, paddingBottom: Platform.OS==='ios'?40:28 },
  handle:       { width:40, height:4, borderRadius:2, backgroundColor:'rgba(255,255,255,0.15)', alignSelf:'center', marginTop:12, marginBottom:4 },

  header:       { alignItems:'center', paddingHorizontal:28, paddingTop:20, paddingBottom:20 },
  lockWrap:     { width:60, height:60, borderRadius:30, backgroundColor: Colors.green + '15', borderWidth:1, borderColor: Colors.green + '30', alignItems:'center', justifyContent:'center', marginBottom:14 },
  title:        { fontSize:20, fontWeight:'800', color:Colors.text, marginBottom:8, textAlign:'center' },
  sub:          { fontSize:14, color:Colors.textMuted, textAlign:'center', lineHeight:20 },

  perks:        { paddingHorizontal:24, gap:10, marginBottom:24 },
  perk:         { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'rgba(255,255,255,0.04)', borderRadius:12, paddingHorizontal:14, paddingVertical:12 },
  perkIcon:     { width:34, height:34, borderRadius:10, alignItems:'center', justifyContent:'center' },
  perkText:     { fontSize:14, color:Colors.text, fontWeight:'500', flex:1 },

  ctas:         { paddingHorizontal:24, gap:10 },
  registerBtn:  { backgroundColor:Colors.green, borderRadius:Radius.full, paddingVertical:16, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10 },
  registerText: { fontSize:16, fontWeight:'900', color:'#000' },
  loginBtn:     { borderRadius:Radius.full, paddingVertical:14, alignItems:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.12)' },
  loginText:    { fontSize:14, color:Colors.textMuted, fontWeight:'600' },
  continueBtn:  { paddingVertical:10, alignItems:'center' },
  continueText: { fontSize:13, color:'rgba(255,255,255,0.25)' },
});
