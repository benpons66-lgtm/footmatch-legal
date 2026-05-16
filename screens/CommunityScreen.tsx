// screens/CommunityScreen.tsx — FootMatch Communauté v6 (Supabase)
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView, Platform,
  Pressable, Animated, Keyboard, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { Colors, Radius } from '../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id:         string;
  username:   string;
  content:    string;
  created_at: string;
  isSystem?:  boolean;
}

// Message système d'accroche, affiché en tête de liste tant que le chat tourne.
const SYSTEM_MESSAGE: Message = {
  id:         'msg-sys-live',
  username:   'FootMatch',
  content:    '⚽ Plusieurs matchs ouverts cette semaine — trouve le tien !',
  created_at: new Date().toISOString(),
  isSystem:   true,
};

// Fallback affiché si la table community_messages est vide (pré-launch)
const FALLBACK_MESSAGES: Message[] = [
  { id: 'fb-1',  username: 'ZizouPerp',    content: 'Quelqu\'un pour un Five ce soir à 20h ? On est déjà 4.',            created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'fb-2',  username: 'ElToro',       content: 'Dispo ! C\'est où ?',                                               created_at: new Date(Date.now() - 4 * 3600000 - 50 * 60000).toISOString() },
  { id: 'fb-3',  username: 'ZizouPerp',    content: 'City Stade Moulin à Vent, 66000.',                                  created_at: new Date(Date.now() - 4 * 3600000 - 40 * 60000).toISOString() },
  { id: 'fb-4',  username: 'LaFleche',     content: 'Je peux venir avec mon frère, ça fait 6.',                          created_at: new Date(Date.now() - 4 * 3600000 - 30 * 60000).toISOString() },
  { id: 'fb-5',  username: 'WeekendFive',  content: 'Samedi matin j\'organise un match à Canet, niveau D3 minimum.',     created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'fb-6',  username: 'CanetStyle',   content: 'Super ! Je m\'inscris.',                                            created_at: new Date(Date.now() - 2 * 3600000 - 45 * 60000).toISOString() },
  { id: 'fb-7',  username: 'LaFuria',      content: 'Quelqu\'un connaît un terrain bien à Thuir ?',                     created_at: new Date(Date.now() - 2 * 3600000 - 20 * 60000).toISOString() },
  { id: 'fb-8',  username: 'RivesalteBoy', content: 'Le stade municipal est souvent libre le dimanche matin.',           created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'fb-9',  username: 'NightFive',    content: 'Match ce soir 21h30 à Perpignan, il reste 2 places !',             created_at: new Date(Date.now() - 90 * 60000).toISOString() },
  { id: 'fb-10', username: 'StreetFoot',   content: 'On a fini 5-4, quel match ! GG à tous.',                           created_at: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: 'fb-11', username: 'TikiMaestro',  content: 'Prochain match organisé vendredi 19h, rejoignez-nous !',           created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 'fb-12', username: 'BabyMbappe',   content: 'Quelqu\'un pour s\'entraîner les tirs francs demain matin ?',      created_at: new Date(Date.now() - 15 * 60000).toISOString() },
];

// ─── Helper temps relatif ─────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)    return 'à l\'instant';
  if (s < 3600)  return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)}h`;
  return `il y a ${Math.floor(s / 86400)}j`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onJoinMatch?: (id: string) => void;
  onNavigate?: (screen: string, filter?: string) => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────
export default function CommunityScreen({ onJoinMatch, onNavigate }: Props) {
  const { currentUser } = useStore();
  const myPseudo = currentUser?.pseudo ?? 'Moi';

  const [messages, setMessages] = useState<Message[]>([SYSTEM_MESSAGE]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [input, setInput]       = useState('');
  const listRef                 = useRef<FlatList>(null);
  const sysScale                = useRef(new Animated.Value(1)).current;
  const listOpacity             = useRef(new Animated.Value(0)).current;
  const initialScrollDone       = useRef(false);

  // ── Chargement messages depuis Supabase ───────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('community_messages')
        .select('id, content, created_at, user:profiles(id, pseudo)')
        .order('created_at', { ascending: true })
        .limit(100);

      if (cancelled) return;

      if (!error && data) {
        const mapped: Message[] = data.map((m: any) => ({
          id:         m.id,
          username:   m.user?.pseudo ?? 'Joueur',
          content:    m.content,
          created_at: m.created_at,
        }));
        setMessages([SYSTEM_MESSAGE, ...(mapped.length > 0 ? mapped : FALLBACK_MESSAGES)]);
      }

      if (!cancelled) setLoadingMessages(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Envoi ──────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const msg: Message = {
      id:         Date.now().toString(),
      username:   myPseudo,
      content:    text,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, msg]);
    setInput('');
    Keyboard.dismiss();
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);

    await supabase.from('community_messages').insert({
      user_id: currentUser?.id,
      content: text,
    });
  }

  // ── Animation message système ──────────────────────────────────────────────
  function onSysPressIn() {
    Animated.spring(sysScale, { toValue: 0.95, useNativeDriver: true, speed: 30 }).start();
  }
  function onSysPressOut() {
    Animated.spring(sysScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  }
  function onSysPress() {
    onNavigate?.('home', 'urgent');
  }

  // ── Rendu bulle ────────────────────────────────────────────────────────────
  function renderItem({ item, index }: { item: Message; index: number }) {
    // Message système
    if (item.isSystem) {
      return (
        <Pressable
          onPress={onSysPress}
          onPressIn={onSysPressIn}
          onPressOut={onSysPressOut}
          accessibilityRole="button"
          accessibilityLabel="Rejoindre un match maintenant"
        >
          <Animated.View style={[s.sysRow, { transform: [{ scale: sysScale }] }]}>
            {/* Badge LIVE */}
            <View style={s.sysBadgeRow}>
              <View style={s.sysLiveDot} />
              <Text style={s.sysLiveText}>EN DIRECT</Text>
            </View>
            {/* Contenu */}
            <Text style={s.sysText}>{item.content}</Text>
            {/* CTA */}
            <View style={s.sysCtaRow}>
              <Text style={s.sysCtaText}>Rejoindre un match</Text>
              <Ionicons name="arrow-forward" size={13} color={Colors.green} />
            </View>
          </Animated.View>
        </Pressable>
      );
    }

    const isMe = item.username === myPseudo;

    // Afficher le pseudo seulement si le message précédent vient d'un autre
    const prev = messages[index - 1];
    const showName = !isMe && (!prev || prev.username !== item.username || prev.isSystem);

    if (isMe) {
      return (
        <View style={s.rowRight}>
          <View style={s.bubbleRight}>
            <Text style={s.textRight}>{item.content}</Text>
            <Text style={s.timeRight}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={s.rowLeft}>
        <View style={s.avatarWrap}>
          <Text style={s.avatarLetter}>{item.username[0].toUpperCase()}</Text>
        </View>
        <View style={s.bubbleLeft}>
          {showName && <Text style={s.bubbleName}>{item.username}</Text>}
          <Text style={s.textLeft}>{item.content}</Text>
          <Text style={s.timeLeft}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
    );
  }

  const canSend = input.trim().length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>

      {/* Liste messages — flex:1 pour prendre tout l'espace disponible */}
      {loadingMessages ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={Colors.green} size="small" />
        </View>
      ) : (
      <Animated.View style={[s.listWrap, { opacity: listOpacity }]}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderItem}
        contentContainerStyle={
          messages.length === 0
            ? s.contentEmpty
            : s.contentList
        }
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          listRef.current?.scrollToEnd({ animated: false });
          if (!initialScrollDone.current) {
            initialScrollDone.current = true;
            setTimeout(
              () => Animated.timing(listOpacity, { toValue: 1, duration: 120, useNativeDriver: true }).start(),
              80,
            );
          }
        }}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>👋</Text>
            <Text style={s.emptyTitle}>Sois le premier à écrire !</Text>
            <Text style={s.emptyHint}>Le chat de la communauté FootMatch</Text>
          </View>
        }
      />
      </Animated.View>
      )}

      {/* Input — KAV uniquement autour de la barre, pas du scroll */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 85 : 0}
      >
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Ton message..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            maxLength={200}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[s.sendBtn, !canSend && s.sendBtnOff]}
            onPress={sendMessage}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color={canSend ? '#000' : Colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // ── Liste ────────────────────────────────────────────────────────────────────
  listWrap:     { flex: 1 },
  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  contentList:  { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  contentEmpty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },

  // ── Empty ────────────────────────────────────────────────────────────────────
  emptyWrap:  { alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 46 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptyHint:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19 },

  // ── Message système / CTA ─────────────────────────────────────────────────────
  sysRow: {
    alignSelf: 'center',
    marginVertical: 10,
    backgroundColor: 'rgba(0,230,118,0.10)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxWidth: '88%',
    gap: 6,
  },
  // Badge LIVE
  sysBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  sysLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  sysLiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.green,
    letterSpacing: 1.2,
  },
  // Texte principal
  sysText: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  // Bouton bas
  sysCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.greenBorder,
  },
  sysCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.green,
    letterSpacing: 0.2,
  },
  sysArrow: { fontSize: 11, color: Colors.green, textAlign: 'center', marginTop: 3, opacity: 0.7, fontWeight: '700', letterSpacing: 0.3 },

  // ── Mes messages (droite) ────────────────────────────────────────────────────
  rowRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
    paddingLeft: 60,
  },
  bubbleRight: {
    backgroundColor: Colors.green,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    maxWidth: '70%',
  },
  textRight: { fontSize: 15, color: '#000', lineHeight: 20 },
  timeRight: { fontSize: 10, color: 'rgba(0,0,0,0.4)', marginTop: 3, textAlign: 'right' },

  // ── Messages des autres (gauche) ─────────────────────────────────────────────
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
    paddingRight: 60,
    gap: 7,
  },
  avatarWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  avatarLetter: { fontSize: 12, fontWeight: '700', color: Colors.green },
  bubbleLeft: {
    backgroundColor: Colors.bg3,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    maxWidth: '70%',
  },
  bubbleName: { fontSize: 11, fontWeight: '700', color: Colors.green, marginBottom: 2 },
  textLeft:   { fontSize: 15, color: Colors.text, lineHeight: 20 },
  timeLeft:   { fontSize: 10, color: Colors.textMuted, marginTop: 3 },

  // ── Barre input ──────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
