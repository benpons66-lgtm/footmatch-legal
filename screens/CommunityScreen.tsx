// screens/CommunityScreen.tsx — FootMatch Communauté v6 (Supabase)
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView, Platform,
  Animated, Keyboard, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing } from '../constants/theme';
import Copyright from '../components/Copyright';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id:         string;
  userId?:    string;   // ID Supabase de l'auteur (absent pour les messages fallback)
  username:   string;
  content:    string;
  created_at: string;
}

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
  onViewProfile?:  (playerId: string) => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────
export default function CommunityScreen({ onViewProfile }: Props) {
  const { currentUser } = useStore();
  const myPseudo = currentUser?.pseudo ?? 'Moi';

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [input, setInput]       = useState('');
  const listRef                 = useRef<FlatList>(null);
  const listOpacity             = useRef(new Animated.Value(0)).current;
  const initialScrollDone       = useRef(false);
  const pendingMessages         = useRef<Map<string, string>>(new Map());
  const profileCache            = useRef<Map<string, string>>(new Map());
  const usingFallback           = useRef(false);
  const currentUserRef          = useRef(currentUser);
  const myPseudoRef             = useRef(myPseudo);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { myPseudoRef.current = myPseudo; }, [myPseudo]);

  // ── Chargement messages + abonnement Realtime ────────────────────────────
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
          userId:     m.user?.id ?? undefined,
          username:   m.user?.pseudo ?? 'Joueur',
          content:    m.content,
          created_at: m.created_at,
        }));
        if (mapped.length > 0) {
          setMessages(mapped);
          usingFallback.current = false;
        } else {
          setMessages(FALLBACK_MESSAGES);
          usingFallback.current = true;
        }
      }

      if (!cancelled) setLoadingMessages(false);
    }

    load();

    // Abonnement Realtime — nouveaux messages en direct
    const channel = supabase
      .channel('community-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages' },
        async (payload) => {
          const row = payload.new as { id: string; user_id: string; content: string; created_at: string };
          const me = currentUserRef.current;

          // Résoudre le pseudo (cache local pour éviter N requêtes)
          let username: string;
          if (row.user_id === me?.id) {
            username = myPseudoRef.current;
          } else if (profileCache.current.has(row.user_id)) {
            username = profileCache.current.get(row.user_id)!;
          } else {
            const { data } = await supabase.from('profiles').select('pseudo').eq('id', row.user_id).single();
            username = data?.pseudo ?? 'Joueur';
            profileCache.current.set(row.user_id, username);
          }

          const incoming: Message = {
            id:         row.id,
            userId:     row.user_id,
            username,
            content:    row.content,
            created_at: row.created_at,
          };

          setMessages(prev => {
            // Remplacer les messages de fallback au premier vrai message
            if (usingFallback.current) {
              usingFallback.current = false;
              return [incoming];
            }

            if (row.user_id === me?.id) {
              // Remplacer le message optimiste par la version DB
              const idx = prev.findIndex(m => m.id.startsWith('temp-') && m.content === row.content);
              if (idx !== -1) {
                const updated = [...prev];
                pendingMessages.current.delete(prev[idx].id);
                updated[idx] = incoming;
                return updated;
              }
            }

            // Dédupliquer (sécurité)
            if (prev.some(m => m.id === incoming.id)) return prev;

            return [...prev, incoming];
          });

          // Scroll auto pour les messages des autres
          if (row.user_id !== me?.id) {
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Envoi ──────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const tempId = `temp-${Date.now()}`;
    const msg: Message = {
      id:         tempId,
      userId:     currentUser?.id,
      username:   myPseudo,
      content:    text,
      created_at: new Date().toISOString(),
    };

    pendingMessages.current.set(tempId, text);
    // Si on affichait le fallback, on le remplace par le vrai message
    if (usingFallback.current) {
      usingFallback.current = false;
      setMessages([msg]);
    } else {
      setMessages(prev => [...prev, msg]);
    }
    setInput('');
    Keyboard.dismiss();
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);

    await supabase.from('community_messages').insert({
      user_id: currentUser?.id,
      content: text,
    });
  }

  // ── Rendu bulle ────────────────────────────────────────────────────────────
  function renderItem({ item, index }: { item: Message; index: number }) {
    const isMe = item.username === myPseudo;

    // Afficher le pseudo seulement si le message précédent vient d'un autre
    const prev = messages[index - 1];
    const showName = !isMe && (!prev || prev.username !== item.username);

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
          {showName && (
            item.userId && onViewProfile
              ? <TouchableOpacity onPress={() => onViewProfile(item.userId!)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`Voir le profil de ${item.username}`}>
                  <Text style={s.bubbleName}>{item.username}</Text>
                </TouchableOpacity>
              : <Text style={s.bubbleName}>{item.username}</Text>
          )}
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
        ListFooterComponent={<Copyright />}
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
  inputBar:   { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, paddingBottom: 20, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  input:      { flex: 1, backgroundColor: Colors.bg2, borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 10, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border, maxHeight: 100 },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendBtnOff: { backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.border },
});
