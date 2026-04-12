import { useState, useRef } from 'react';
import { Alert, FlatList } from 'react-native';
import { supabase } from '../lib/supabase';
import { isSeededProfileId } from '../lib/playerStats';
import type { ChatMessage, CommunityMessage, Match, AppUser } from '../types';

interface UseChatReturn {
  // Match chat
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  newMessage: string;
  setNewMessage: (v: string) => void;
  sendingMsg: boolean;
  sendMessage: () => Promise<void>;
  loadMessages: (matchId: string) => Promise<void>;
  // Community chat
  communityMessages: CommunityMessage[];
  setCommunityMessages: React.Dispatch<React.SetStateAction<CommunityMessage[]>>;
  communityMessage: string;
  setCommunityMessage: (v: string) => void;
  sendingCommunityMsg: boolean;
  sendCommunityMessage: () => Promise<void>;
  loadCommunityMessages: (blockedUserIds: string[], currentUserId: string) => Promise<void>;
  // Shared
  flatListRef: React.RefObject<FlatList>;
  // Report
  reportMessage: (
    message: ChatMessage | CommunityMessage,
    matchId?: string,
    reporterId?: string,
  ) => Promise<void>;
}

export function useChat(
  selectedMatch: Match | null,
  currentUser: AppUser | null,
  blockedUserIds: string[],
  ensureCleanContent: (text: string, ctx?: string) => boolean,
): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([]);
  const [communityMessage, setCommunityMessage] = useState('');
  const [sendingCommunityMsg, setSendingCommunityMsg] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  function scrollToEnd(animated = true): void {
    requestAnimationFrame(() =>
      flatListRef.current?.scrollToEnd({ animated }),
    );
  }

  // ── Load match messages ────────────────────────────────────────────────────
  async function loadMessages(matchId: string): Promise<void> {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, user:profiles(id,pseudo)')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(
        (data as ChatMessage[]).filter((m) => !blockedUserIds.includes(m.user_id)),
      );
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }

  // ── Send match message ─────────────────────────────────────────────────────
  async function sendMessage(): Promise<void> {
    const content = newMessage.trim();
    if (!content || !currentUser || !selectedMatch) return;
    if (!ensureCleanContent(content, 'ce message')) return;

    const tempId = `match-temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      match_id: selectedMatch.id,
      user_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
      user: { id: currentUser.id, pseudo: currentUser.pseudo },
    };

    setSendingMsg(true);
    setNewMessage('');
    setMessages((prev) => [...prev, optimistic]);
    scrollToEnd();

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ match_id: selectedMatch.id, user_id: currentUser.id, content })
        .select('*, user:profiles(id,pseudo)')
        .single();
      if (error) throw error;

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        data as ChatMessage,
      ]);
      scrollToEnd();
    } catch (e: unknown) {
      // Rollback optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(content);
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSendingMsg(false);
    }
  }

  // ── Load community messages ────────────────────────────────────────────────
  async function loadCommunityMessages(
    blocked: string[],
    currentUserId: string,
  ): Promise<void> {
    const { data } = await supabase
      .from('community_messages')
      .select('*, user:profiles(id,pseudo)')
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setCommunityMessages(
        (data as CommunityMessage[]).filter((m) => {
          const authorId = String(m.user_id ?? '');
          return (
            !blocked.includes(m.user_id) &&
            (isSeededProfileId(authorId) || authorId === currentUserId)
          );
        }),
      );
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }

  // ── Send community message ─────────────────────────────────────────────────
  async function sendCommunityMessage(): Promise<void> {
    const content = communityMessage.trim();
    if (!content || !currentUser) return;
    if (!ensureCleanContent(content, 'ce message')) return;

    const tempId = `community-temp-${Date.now()}`;
    const optimistic: CommunityMessage = {
      id: tempId,
      user_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
      user: { id: currentUser.id, pseudo: currentUser.pseudo },
    };

    setSendingCommunityMsg(true);
    setCommunityMessage('');
    setCommunityMessages((prev) => [...prev, optimistic]);
    scrollToEnd();

    try {
      const { data, error } = await supabase
        .from('community_messages')
        .insert({ user_id: currentUser.id, content })
        .select('*, user:profiles(id,pseudo)')
        .single();
      if (error) throw error;

      setCommunityMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        data as CommunityMessage,
      ]);
      scrollToEnd();
    } catch (e: unknown) {
      // Rollback optimistic update
      setCommunityMessages((prev) => prev.filter((m) => m.id !== tempId));
      setCommunityMessage(content);
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSendingCommunityMsg(false);
    }
  }

  // ── Report message ─────────────────────────────────────────────────────────
  async function reportMessage(
    message: ChatMessage | CommunityMessage,
    matchId?: string,
    reporterId?: string,
  ): Promise<void> {
    if (!reporterId || message.user_id === reporterId) return;

    Alert.alert(
      'Signaler ce message',
      `Signaler le message de ${message.user?.pseudo ?? 'cet utilisateur'} comme inapproprié ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Signaler',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('message_reports').insert({
                message_id: message.id,
                reporter_id: reporterId,
                match_id: matchId ?? null,
              });
            } catch {
              // ignore — signalement non critique
            }
            Alert.alert('Signalement envoyé', 'Merci, nous examinerons ce message sous 24h.');
          },
        },
      ],
    );
  }

  return {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    sendingMsg,
    sendMessage,
    loadMessages,
    communityMessages,
    setCommunityMessages,
    communityMessage,
    setCommunityMessage,
    sendingCommunityMsg,
    sendCommunityMessage,
    loadCommunityMessages,
    flatListRef,
    reportMessage,
  };
}
