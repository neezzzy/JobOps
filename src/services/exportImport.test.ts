import { clearAllData, importAllData, previewBackup } from './exportImport';

const mockRunAsync = jest.fn(async () => undefined);
const mockGetAllAsync = jest.fn(async () => []);

jest.mock('@/src/db/database', () => ({
  getDb: jest.fn(async () => ({ runAsync: mockRunAsync, getAllAsync: mockGetAllAsync })),
}));

describe('exportImport', () => {
  beforeEach(() => {
    mockRunAsync.mockClear();
    mockGetAllAsync.mockClear();
  });

  it('rejects backups that are missing required data', async () => {
    await expect(importAllData('{}')).rejects.toThrow('missing required data');
  });

  it('restores compatible backup data', async () => {
    await importAllData(JSON.stringify({
      applications: [],
      resume_versions: [{
        id: 'res_1',
        name: 'Main resume',
        target_role: 'Analyst',
        notes: 'Notes',
        created_at: '2026-05-01T00:00:00.000Z',
        updated_at: '2026-05-01T00:00:00.000Z',
      }],
      status_history: [],
      reminders: [],
    }));

    expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM reminders');
    expect(mockRunAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO resume_versions'), 'res_1', 'Main resume', 'Analyst', 'Notes', null, null, null, null, '2026-05-01T00:00:00.000Z', '2026-05-01T00:00:00.000Z');
  });

  it('previews v1 and v2 compatible backups', () => {
    const preview = previewBackup(JSON.stringify({
      version: 2,
      exportedAt: '2026-05-01T00:00:00.000Z',
      applications: [{}],
      resume_versions: [],
      status_history: [],
      reminders: [{}],
    }));

    expect(preview.valid).toBe(true);
    expect(preview.counts?.applications).toBe(1);
    expect(preview.counts?.reminders).toBe(1);
  });

  it('clears local tables in dependency order', async () => {
    await clearAllData();

    expect(mockRunAsync.mock.calls.map((call) => (call as unknown[])[0])).toEqual([
      'DELETE FROM reminders',
      'DELETE FROM status_history',
      'DELETE FROM applications',
      'DELETE FROM resume_versions',
    ]);
  });
});
