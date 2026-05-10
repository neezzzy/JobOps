import type { Reminder } from '@/src/types/application';

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  return 'unavailable';
}

export async function requestNotificationPermission() {
  return false;
}

export async function syncReminderNotification(_reminder: Reminder | null, _enabled: boolean) {
  return null;
}

export async function cancelNotification(_notificationId?: string | null) {
  return undefined;
}
