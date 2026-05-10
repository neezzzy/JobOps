const mockRunAsync = jest.fn(async () => undefined);
const mockExecAsync = jest.fn(async () => undefined);
const mockGetAllAsync = jest.fn(async (): Promise<any[]> => []);
const mockGetFirstAsync = jest.fn(async () => null);

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => ({
    runAsync: mockRunAsync,
    execAsync: mockExecAsync,
    getAllAsync: mockGetAllAsync,
    getFirstAsync: mockGetFirstAsync,
  })),
}));

import { createApplication, deleteApplication, getAppPreferences, setAppPreference } from './database';

describe('database', () => {
  beforeEach(() => {
    mockRunAsync.mockClear();
    mockExecAsync.mockClear();
    mockGetAllAsync.mockClear();
    mockGetFirstAsync.mockClear();
  });

  it('creates applications with status history and reminders', async () => {
    const id = await createApplication({
      title: 'Product Analyst',
      company: 'Acme',
      status: 'Saved',
      date_saved: '2026-05-01',
      follow_up_date: '2026-05-05',
    });

    expect(id).toMatch(/^app_/);
    expect(mockRunAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO applications'), expect.stringMatching(/^app_/), 'Product Analyst', 'Acme', null, null, null, null, null, 'Saved', '2026-05-01', null, null, null, '2026-05-05', null, null, null, expect.any(String), expect.any(String));
    expect(mockRunAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO status_history'), expect.stringMatching(/^hist_/), expect.stringMatching(/^app_/), null, 'Saved', expect.any(String));
    expect(mockRunAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO reminders'), expect.stringMatching(/^rem_/), expect.stringMatching(/^app_/), '2026-05-05', 'Follow up: Product Analyst at Acme', expect.any(String), expect.any(String));
  });

  it('deletes related application data', async () => {
    await deleteApplication('app_1');

    const statements = mockRunAsync.mock.calls.map((call) => (call as unknown[])[0]);
    expect(statements).toEqual(expect.arrayContaining([
      'DELETE FROM reminders WHERE application_id = ?',
      'DELETE FROM status_history WHERE application_id = ?',
      'DELETE FROM applications WHERE id = ?',
    ]));
  });

  it('reads preference defaults and saved values', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      { key: 'themeMode', value: 'dark' },
      { key: 'textSize', value: 'large' },
      { key: 'highContrast', value: 'true' },
    ]);

    await expect(getAppPreferences()).resolves.toEqual({
      themeMode: 'dark',
      textSize: 'large',
      highContrast: true,
    });
  });

  it('stores individual preferences', async () => {
    await setAppPreference('themeMode', 'light');

    expect(mockRunAsync).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)',
      'themeMode',
      'light',
    );
  });
});
