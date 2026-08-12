import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Local notifications only — no push tokens, no server, and no Expo push
// credentials. A daily nudge is something the phone can schedule for itself,
// and local scheduling still works inside Expo Go.

const DAILY_REMINDER_ID = 'goalpath-daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** '09:00' -> { hour: 9, minute: 0 }. Returns null if the string is malformed. */
export const parseTime = (value) => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || '');
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
};

export const getPermissionStatus = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

/**
 * Asks for permission if it has not been decided yet. iOS only ever shows the
 * system prompt once, so a previous denial has to be resolved in Settings —
 * callers should treat `false` as "tell the user to enable it there".
 */
export const requestPermission = async () => {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  if (!existing.canAskAgain) return false;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const cancelDailyReminder = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier === DAILY_REMINDER_ID || n.content?.data?.kind === 'daily-reminder')
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
};

/**
 * Schedules the one daily reminder, replacing any previous one.
 * Returns false when the time is unusable or permission is missing, so the
 * caller can avoid reporting success for a reminder that will never fire.
 */
export const scheduleDailyReminder = async (time) => {
  const parsed = parseTime(time);
  if (!parsed) return false;

  const granted = await requestPermission();
  if (!granted) return false;

  // Always clear first: without this, changing the time leaves the old one
  // armed and the user gets two notifications a day.
  await cancelDailyReminder();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'LOCKED IN',
      body: 'Time to log today’s habits.',
      data: { kind: 'daily-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: parsed.hour,
      minute: parsed.minute,
      channelId: Platform.OS === 'android' ? 'daily-reminder' : undefined,
    },
  });

  return true;
};

/**
 * Applies whatever the user's saved preferences say. Safe to call on every launch.
 *
 * `prompt` defaults to false so a cold start never fires the system permission
 * dialog out of context — at launch we only re-arm reminders that permission
 * already covers. The settings screen passes `prompt: true`, where the user
 * has just asked for reminders and the dialog makes sense.
 */
export const syncRemindersFromPreferences = async (preferences, { prompt = false } = {}) => {
  const enabled = preferences?.notificationsEnabled !== false
    && preferences?.pushNotificationsEnabled !== false;

  if (!enabled) {
    await cancelDailyReminder();
    return false;
  }

  if (!prompt && (await getPermissionStatus()) !== 'granted') return false;

  return scheduleDailyReminder(preferences?.dailyReminderTime || '09:00');
};

export const getScheduledReminder = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.find((n) => n.content?.data?.kind === 'daily-reminder') || null;
};
