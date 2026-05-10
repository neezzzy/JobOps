import { exportApplicationsCsv, importApplicationsCsv, previewApplicationsCsv, clearAllData, importAllData, previewBackup } from './exportImport';

const mockRunAsync = jest.fn<Promise<void>, any[]>(async () => undefined);
const mockGetAllAsync = jest.fn<Promise<any[]>, any[]>(async () => []);
const mockGetFirstAsync = jest.fn<Promise<any>, any[]>(async () => null);

jest.mock('@/src/db/database', () => ({
  getDb: jest.fn(async () => ({ runAsync: mockRunAsync, getAllAsync: mockGetAllAsync, getFirstAsync: mockGetFirstAsync })),
}));

describe('exportImport', () => {
  beforeEach(() => {
    mockRunAsync.mockClear();
    mockGetAllAsync.mockClear();
    mockGetFirstAsync.mockClear();
    mockGetFirstAsync.mockResolvedValue(null);
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

  it('exports applications as Sheets-compatible CSV with escaped values', async () => {
    mockGetAllAsync.mockResolvedValueOnce([{ id: 'app_1', title: 'Engineer, Mobile', company: 'Acme', status: 'Saved', date_saved: '2026-05-01', notes: 'Line one\nLine two' }]);

    const csv = await exportApplicationsCsv();

    expect(csv).toContain('"Engineer, Mobile"');
    expect(csv).toContain('"Line one\nLine two"');
  });

  it('previews pasted application CSV and detects duplicates', async () => {
    mockGetFirstAsync.mockResolvedValueOnce(null);
    mockGetAllAsync.mockResolvedValueOnce([{ id: 'app_1', title: 'Product Analyst', company: 'Acme' }]);

    const preview = await previewApplicationsCsv('title,company,status\nProduct Analyst,Acme,Saved');

    expect(preview.valid).toBe(true);
    expect(preview.rows).toBe(1);
    expect(preview.duplicates).toBe(1);
  });

  it('rejects application CSV missing required columns', async () => {
    const preview = await previewApplicationsCsv('company\nAcme');

    expect(preview.valid).toBe(false);
    expect(preview.errors).toContain('Missing required column: title');
  });

  it('imports new CSV rows and skips duplicates by default', async () => {
    mockGetFirstAsync.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'app_1' });
    mockGetAllAsync.mockResolvedValueOnce([]);

    const result = await importApplicationsCsv('title,company,status,notes\nProduct Analyst,Acme,Saved,"Uses ""quoted"" notes"');

    expect(result.created).toBe(1);
    expect(mockRunAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO applications'), expect.stringMatching(/^app_/), 'Product Analyst', 'Acme', null, null, null, null, null, 'Saved', 'Normal', null, null, expect.any(String), null, null, null, null, 'Uses "quoted" notes', null, null, expect.any(String), expect.any(String));
  });
});
