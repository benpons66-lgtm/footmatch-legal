import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLOCKED_USERS_STORAGE_KEY = 'footmatch-blocked-users';
const SUPPORT_EMAIL = 'support@footmatch.fr';

export const MODERATION_HINT =
  'FootMatch applique une politique de tolérance zéro contre le harcèlement, la haine, le spam et les contenus sexuels non sollicités.';

// Termes interdits — complétés par une modération côté serveur
const FORBIDDEN_PATTERNS = [
  /connard|connasse|fdp|encule|pute|salope/i,
  /nazi|sale\s+noir|sale\s+blanc|sale\s+arabe/i,
  /viol|menace|je\s+vais\s+te\s+tuer/i,
];

interface UseModerationReturn {
  blockedUserIds: string[];
  loadBlockedUsers: () => Promise<void>;
  moderateText: (content: string) => boolean;
  ensureCleanContent: (content: string, context?: string) => boolean;
  blockUser: (userId: string, pseudo?: string | null) => Promise<void>;
  unblockUser: (userId: string, pseudo?: string | null) => Promise<void>;
  toggleBlock: (userId: string, pseudo?: string | null) => Promise<void>;
  isBlocked: (userId: string) => boolean;
  handleMessageLongPress: (
    message: { id: string; user_id: string; user?: { pseudo?: string } },
    onReport: (message: { id: string; user_id: string }) => void,
  ) => void;
}

export function useModeration(currentUserId?: string | null): UseModerationReturn {
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  async function loadBlockedUsers(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(BLOCKED_USERS_STORAGE_KEY);
      if (raw) setBlockedUserIds(JSON.parse(raw) as string[]);
    } catch {
      // ignore — storage unavailable
    }
  }

  async function persistBlockedUsers(next: string[]): Promise<void> {
    setBlockedUserIds(next);
    try {
      await AsyncStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  /** Retourne true si le contenu est propre */
  function moderateText(content: string): boolean {
    const normalized = content.trim();
    if (!normalized) return false;
    return !FORBIDDEN_PATTERNS.some((rule) => rule.test(normalized));
  }

  /** Bloque l'action et affiche une alerte si le contenu est interdit */
  function ensureCleanContent(content: string, context = 'ce contenu'): boolean {
    if (moderateText(content)) return true;
    Alert.alert(
      'Contenu refusé',
      `On ne peut pas publier ${context} car il semble contenir des propos interdits.\n\n${MODERATION_HINT}`,
    );
    return false;
  }

  function isBlocked(userId: string): boolean {
    return blockedUserIds.includes(userId);
  }

  async function blockUser(userId: string, pseudo?: string | null): Promise<void> {
    if (!userId || userId === currentUserId) return;
    const next = Array.from(new Set([...blockedUserIds, userId]));
    await persistBlockedUsers(next);
    Alert.alert(
      'Utilisateur bloqué',
      `${pseudo ?? 'Cet utilisateur'} ne te sera plus proposé dans les discussions sur cet appareil.`,
    );
  }

  async function unblockUser(userId: string, pseudo?: string | null): Promise<void> {
    if (!userId || userId === currentUserId) return;
    const next = blockedUserIds.filter((id) => id !== userId);
    await persistBlockedUsers(next);
    Alert.alert('Utilisateur débloqué', `${pseudo ?? 'Ce joueur'} peut de nouveau apparaître.`);
  }

  async function toggleBlock(userId: string, pseudo?: string | null): Promise<void> {
    if (isBlocked(userId)) {
      await unblockUser(userId, pseudo);
    } else {
      await blockUser(userId, pseudo);
    }
  }

  function handleMessageLongPress(
    message: { id: string; user_id: string; user?: { pseudo?: string } },
    onReport: (msg: { id: string; user_id: string }) => void,
  ): void {
    if (!currentUserId || message.user_id === currentUserId) return;
    const pseudo = message.user?.pseudo ?? 'cet utilisateur';

    Alert.alert('Modération', `Que veux-tu faire avec ${pseudo} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: isBlocked(message.user_id) ? 'Débloquer' : 'Bloquer',
        onPress: () => toggleBlock(message.user_id, pseudo),
      },
      {
        text: 'Signaler',
        style: 'destructive',
        onPress: () => onReport(message),
      },
    ]);
  }

  return {
    blockedUserIds,
    loadBlockedUsers,
    moderateText,
    ensureCleanContent,
    blockUser,
    unblockUser,
    toggleBlock,
    isBlocked,
    handleMessageLongPress,
  };
}
