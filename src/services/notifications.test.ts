const mockRunAsync = jest.fn<Promise<void>, any[]>(async () => undefined);
const mockGetAllAsync = jest.fn<Promise<any[]>, any[]>(async () => []);
const mockGetFirstAsync = jest.fn<Promise<any>, any[]>(async () => null);

jest.mock('@/src/db/database', () => ({
  getDb: jest.fn(async () => ({ runAsync: mockRunAsync, getAllAsync: mockGetAllAsync, getFirstAsync: mockGetFirstAsync })),
}));

import { cancelAllReminderNotifications, getNotificationPermissionState, requestNotificationPermission, setNotificationsEnabled, syncReminderNotification } from './notifications';

describe('notifications', () => {
  beforeEach(() => {
    mockRunAsync.mockClear();
    mockGetAllAsync.mockClear();
    mockGetFirstAsync.mockClear();
  });

  it('reports native notifications as unavailable in this SDK/runtime path', async () => {
    await expect(getNotificationPermissionState()).resolves.toBe('unavailable');
    await expect(requestNotificationPermission()).resolves.toBe(false);
  });

  it('keeps reminder writes safe by returning no notification id', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({ value: 'true' });

    await expect(syncReminderNotification({
      id: 'rem_1',
      application_id: 'app_1',
      reminder_date: '2099-05-01',
      title: 'Follow up: Engineer at Acme',
      completed: 0,
      created_at: '2026-05-01T00:00:00.000Z',
      updated_at: '2026-05-01T00:00:00.000Z',
    })).resolves.toBeNull();
  });

  it('clears stored notification ids when disabled', async () => {
    mockGetAllAsync.mockResolvedValueOnce([{ id: 'rem_1', notification_id: 'notification_1' }]);

    await setNotificationsEnabled(false);

    expect(mockRunAsync).toHaveBeenCalledWith('UPDATE reminders SET notification_id = NULL');
  });

  it('clears all reminder notification ids directly', async () => {
    mockGetAllAsync.mockResolvedValueOnce([{ id: 'rem_1', notification_id: 'notification_1' }]);

    await cancelAllReminderNotifications();

    expect(mockRunAsync).toHaveBeenCalledWith('UPDATE reminders SET notification_id = NULL');
  });
});
