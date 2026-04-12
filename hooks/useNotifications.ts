import * as Notifications from 'expo-notifications';

interface UseNotificationsReturn {
  ensurePermission: (prompt?: boolean) => Promise<boolean>;
  scheduleMatchReminder: (title: string, date: Date, matchId: string, prompt?: boolean) => Promise<void>;
  cancelMatchReminder: (matchId: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  async function ensurePermission(prompt = false): Promise<boolean> {
    try {
      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted) return true;
      if (!prompt) return false;
      const requested = await Notifications.requestPermissionsAsync();
      return (
        requested.granted ||
        requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
      );
    } catch {
      return false;
    }
  }

  async function scheduleMatchReminder(
    title: string,
    date: Date,
    matchId: string,
    prompt = false,
  ): Promise<void> {
    try {
      const canNotify = await ensurePermission(prompt);
      if (!canNotify) return;

      const oneHourBefore = new Date(date.getTime() - 60 * 60 * 1000);
      const oneDayBefore = new Date(date.getTime() - 24 * 60 * 60 * 1000);
      const now = new Date();

      if (oneHourBefore > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `match-1h-${matchId}`,
          content: {
            title: 'Match dans 1 heure',
            body: `Ton match "${title}" commence dans 1h. Prépare-toi.`,
            sound: true,
          },
          trigger: {
            seconds: Math.floor((oneHourBefore.getTime() - Date.now()) / 1000),
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          },
        });
      }

      if (oneDayBefore > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `match-1d-${matchId}`,
          content: {
            title: 'Match demain',
            body: `N'oublie pas ton match "${title}" demain.`,
            sound: true,
          },
          trigger: {
            seconds: Math.floor((oneDayBefore.getTime() - Date.now()) / 1000),
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          },
        });
      }
    } catch {
      // ignore — les notifications sont optionnelles
    }
  }

  async function cancelMatchReminder(matchId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(`match-1h-${matchId}`);
      await Notifications.cancelScheduledNotificationAsync(`match-1d-${matchId}`);
    } catch {
      // ignore
    }
  }

  return { ensurePermission, scheduleMatchReminder, cancelMatchReminder };
}
