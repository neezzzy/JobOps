import { getDb } from '@/src/db/database';
import type { Reminder } from '@/src/types/application';
import { cancelNotification, getNotificationPermissionState, requestNotificationPermission, syncReminderNotification as syncReminderNotificationWithState, type NotificationPermissionState } from './notificationScheduler';

const NOTIFICATION_ENABLED_KEY = 'notificationsEnabled';

export { cancelNotification, getNotificationPermissionState, requestNotificationPermission, type NotificationPermissionState };

export async function getNotificationsEnabled() {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM preferences WHERE key = ?', NOTIFICATION_ENABLED_KEY);
  return row?.value === 'true';
}

export async function setNotificationsEnabled(enabled: boolean) {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)', NOTIFICATION_ENABLED_KEY, String(enabled));
  if (enabled) {
    await requestNotificationPermission();
    await rescheduleAllReminderNotifications();
  } else {
    await cancelAllReminderNotifications();
  }
}

export async function syncReminderNotification(reminder: Reminder | null) {
  return syncReminderNotificationWithState(reminder, await getNotificationsEnabled());
}

export async function rescheduleAllReminderNotifications() {
  const db = await getDb();
  const enabled = await getNotificationsEnabled();
  const reminders = await db.getAllAsync<Reminder>('SELECT * FROM reminders');
  for (const reminder of reminders) {
    const notificationId = await syncReminderNotificationWithState(reminder, enabled);
    await db.runAsync('UPDATE reminders SET notification_id = ?, updated_at = ? WHERE id = ?', notificationId, new Date().toISOString(), reminder.id);
  }
}

export async function cancelAllReminderNotifications() {
  const db = await getDb();
  const reminders = await db.getAllAsync<Reminder>('SELECT * FROM reminders WHERE notification_id IS NOT NULL');
  for (const reminder of reminders) {
    await cancelNotification(reminder.notification_id);
  }
  await db.runAsync('UPDATE reminders SET notification_id = NULL');
}
