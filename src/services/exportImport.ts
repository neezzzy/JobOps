import { getDb } from '@/src/db/database';
import { APPLICATION_STATUSES, NEXT_ACTION_TYPES, PRIORITIES, type ApplicationInput, type ApplicationStatus, type JobApplication, type NextActionType, type Reminder, type StatusHistory } from '@/src/types/application';
import type { ResumeVersion } from '@/src/types/resume';
import { createId } from '@/src/utils/ids';
import { nowIso, todayIsoDate } from '@/src/utils/dates';

export type JobOpsBackup = {
  exportedAt: string;
  version: 1 | 2;
  applications: JobApplication[];
  resume_versions: ResumeVersion[];
  status_history: StatusHistory[];
  reminders: Reminder[];
};

export type BackupPreview = {
  valid: boolean;
  version?: number;
  exportedAt?: string;
  counts?: {
    applications: number;
    resume_versions: number;
    reminders: number;
    status_history: number;
  };
  error?: string;
};

export type CsvImportMode = 'skip' | 'update';

export type CsvPreview = {
  valid: boolean;
  rows: number;
  creatable: number;
  duplicates: number;
  errors: string[];
};

const APPLICATION_CSV_COLUMNS = [
  'id',
  'title',
  'company',
  'location',
  'salary_text',
  'work_mode',
  'posting_url',
  'source_site',
  'status',
  'priority',
  'next_action_type',
  'next_action_date',
  'date_saved',
  'date_applied',
  'resume_version_id',
  'cover_letter_version',
  'notes',
  'job_description',
  'parsed_keywords',
] as const;

const RESUME_CSV_COLUMNS = ['id', 'name', 'target_role', 'notes', 'file_name', 'file_type', 'file_size', 'created_at', 'updated_at'] as const;
const REMINDER_CSV_COLUMNS = ['id', 'application_id', 'reminder_date', 'title', 'completed', 'created_at', 'updated_at'] as const;

export async function exportAllData(): Promise<string> {
  const db = await getDb();
  const backup: JobOpsBackup = {
    exportedAt: new Date().toISOString(),
    version: 2,
    applications: await db.getAllAsync<JobApplication>('SELECT * FROM applications ORDER BY created_at DESC'),
    resume_versions: await db.getAllAsync<ResumeVersion>('SELECT * FROM resume_versions ORDER BY created_at DESC'),
    status_history: await db.getAllAsync<StatusHistory>('SELECT * FROM status_history ORDER BY changed_at DESC'),
    reminders: await db.getAllAsync<Reminder>('SELECT * FROM reminders ORDER BY reminder_date ASC'),
  };
  return JSON.stringify(backup, null, 2);
}

export async function exportApplicationsCsv() {
  const db = await getDb();
  const rows = await db.getAllAsync<JobApplication>('SELECT * FROM applications ORDER BY created_at DESC');
  return stringifyCsv(APPLICATION_CSV_COLUMNS, rows);
}

export async function exportResumeVersionsCsv() {
  const db = await getDb();
  const rows = await db.getAllAsync<ResumeVersion>('SELECT * FROM resume_versions ORDER BY created_at DESC');
  return stringifyCsv(RESUME_CSV_COLUMNS, rows);
}

export async function exportRemindersCsv() {
  const db = await getDb();
  const rows = await db.getAllAsync<Reminder>('SELECT * FROM reminders ORDER BY reminder_date ASC');
  return stringifyCsv(REMINDER_CSV_COLUMNS, rows);
}

export function previewBackup(json: string): BackupPreview {
  try {
    const parsed = JSON.parse(json) as Partial<JobOpsBackup>;
    validateBackupShape(parsed);
    return {
      valid: true,
      version: parsed.version ?? 1,
      exportedAt: parsed.exportedAt,
      counts: {
        applications: parsed.applications?.length ?? 0,
        resume_versions: parsed.resume_versions?.length ?? 0,
        reminders: parsed.reminders?.length ?? 0,
        status_history: parsed.status_history?.length ?? 0,
      },
    };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Backup could not be read.' };
  }
}

export async function previewApplicationsCsv(csv: string): Promise<CsvPreview> {
  const parsed = parseApplicationCsv(csv);
  if (!parsed.valid) return parsed;
  const db = await getDb();
  let duplicates = 0;
  for (const row of parsed.inputs) {
    const existing = await findExistingApplication(db, row);
    if (existing) duplicates += 1;
  }
  return {
    valid: parsed.errors.length === 0,
    rows: parsed.inputs.length,
    creatable: parsed.inputs.length - duplicates,
    duplicates,
    errors: parsed.errors,
  };
}

export async function importApplicationsCsv(csv: string, mode: CsvImportMode = 'skip') {
  const parsed = parseApplicationCsv(csv);
  if (!parsed.valid) {
    throw new Error(parsed.errors[0] ?? 'CSV could not be imported.');
  }
  const db = await getDb();
  const timestamp = nowIso();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const input of parsed.inputs) {
    const existing = await findExistingApplication(db, input);
    if (existing && mode === 'skip') {
      skipped += 1;
      continue;
    }
    if (existing && mode === 'update') {
      await db.runAsync(
        `UPDATE applications SET
          title = ?, company = ?, location = ?, salary_text = ?, work_mode = ?, posting_url = ?, source_site = ?,
          status = ?, priority = ?, next_action_type = ?, next_action_date = ?, date_saved = ?, date_applied = ?,
          resume_version_id = ?, cover_letter_version = ?, notes = ?, job_description = ?, parsed_keywords = ?, updated_at = ?
        WHERE id = ?`,
        input.title,
        input.company,
        input.location ?? null,
        input.salary_text ?? null,
        input.work_mode ?? null,
        input.posting_url ?? null,
        input.source_site ?? null,
        input.status,
        input.priority ?? null,
        input.next_action_type ?? null,
        input.next_action_date ?? null,
        input.date_saved,
        input.date_applied ?? null,
        input.resume_version_id ?? null,
        input.cover_letter_version ?? null,
        input.notes ?? null,
        input.job_description ?? null,
        input.parsed_keywords ?? null,
        timestamp,
        existing.id,
      );
      updated += 1;
      continue;
    }
    await db.runAsync(
      `INSERT INTO applications (
        id, title, company, location, salary_min, salary_max, salary_text, work_mode, posting_url, source_site,
        status, priority, archived_at, next_action_type, next_action_date, date_saved, date_applied, resume_version_id, cover_letter_version, follow_up_date,
        notes, job_description, parsed_keywords, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.id || createId('app'),
      input.title,
      input.company,
      input.location ?? null,
      input.salary_text ?? null,
      input.work_mode ?? null,
      input.posting_url ?? null,
      input.source_site ?? null,
      input.status,
      input.priority ?? null,
      input.next_action_type ?? null,
      input.next_action_date ?? null,
      input.date_saved,
      input.date_applied ?? null,
      input.resume_version_id ?? null,
      input.cover_letter_version ?? null,
      input.next_action_date ?? null,
      input.notes ?? null,
      input.job_description ?? null,
      input.parsed_keywords ?? null,
      timestamp,
      timestamp,
    );
    created += 1;
  }

  return { created, updated, skipped };
}

export async function importAllData(json: string) {
  const parsed = JSON.parse(json) as Partial<JobOpsBackup>;
  validateBackupShape(parsed);

  const db = await getDb();
  await clearAllData();

  for (const item of parsed.resume_versions) {
    await db.runAsync(
      `INSERT INTO resume_versions (
        id, name, target_role, notes, file_uri, file_name, file_type, file_size, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.name,
      item.target_role ?? null,
      item.notes ?? null,
      item.file_uri ?? null,
      item.file_name ?? null,
      item.file_type ?? null,
      item.file_size ?? null,
      item.created_at,
      item.updated_at,
    );
  }
  for (const item of parsed.applications) {
    await db.runAsync(
      `INSERT INTO applications (
        id, title, company, location, salary_min, salary_max, salary_text, work_mode, posting_url, source_site,
        status, priority, archived_at, next_action_type, next_action_date, date_saved, date_applied, resume_version_id, cover_letter_version, follow_up_date,
        notes, job_description, parsed_keywords, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.title,
      item.company,
      item.location ?? null,
      item.salary_min ?? null,
      item.salary_max ?? null,
      item.salary_text ?? null,
      item.work_mode ?? null,
      item.posting_url ?? null,
      item.source_site ?? null,
      item.status,
      item.priority ?? 'Normal',
      item.archived_at ?? null,
      item.next_action_type ?? null,
      item.next_action_date ?? item.follow_up_date ?? null,
      item.date_saved,
      item.date_applied ?? null,
      item.resume_version_id ?? null,
      item.cover_letter_version ?? null,
      item.follow_up_date ?? null,
      item.notes ?? null,
      item.job_description ?? null,
      item.parsed_keywords ?? null,
      item.created_at,
      item.updated_at,
    );
  }
  for (const item of parsed.status_history) {
    await db.runAsync('INSERT INTO status_history (id, application_id, old_status, new_status, changed_at) VALUES (?, ?, ?, ?, ?)', item.id, item.application_id, item.old_status ?? null, item.new_status, item.changed_at);
  }
  for (const item of parsed.reminders) {
    await db.runAsync(
      'INSERT INTO reminders (id, application_id, reminder_date, title, completed, notification_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      item.id,
      item.application_id,
      item.reminder_date,
      item.title,
      item.completed ?? 0,
      item.notification_id ?? null,
      item.created_at,
      item.updated_at,
    );
  }
}

export async function clearAllData() {
  const db = await getDb();
  await db.runAsync('DELETE FROM reminders');
  await db.runAsync('DELETE FROM status_history');
  await db.runAsync('DELETE FROM applications');
  await db.runAsync('DELETE FROM resume_versions');
}

function validateBackupShape(parsed: Partial<JobOpsBackup>): asserts parsed is JobOpsBackup {
  if (!Array.isArray(parsed.applications) || !Array.isArray(parsed.resume_versions) || !Array.isArray(parsed.status_history) || !Array.isArray(parsed.reminders)) {
    throw new Error('This backup is missing required data.');
  }
}

function stringifyCsv<T extends Record<string, unknown>>(columns: readonly string[], rows: T[]) {
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(',')),
  ].join('\n');
}

function escapeCsv(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseApplicationCsv(csv: string): CsvPreview & { inputs: (ApplicationInput & { id?: string })[] } {
  const rows = parseCsvRows(csv.trim());
  const errors: string[] = [];
  if (rows.length < 2) {
    return { valid: false, rows: 0, creatable: 0, duplicates: 0, errors: ['CSV needs a header row and at least one application row.'], inputs: [] };
  }
  const headers = rows[0].map((header) => header.trim());
  for (const required of ['title', 'company']) {
    if (!headers.includes(required)) errors.push(`Missing required column: ${required}`);
  }
  const inputs = rows.slice(1).map((row, index) => {
    const record = Object.fromEntries(headers.map((header, columnIndex) => [header, row[columnIndex]?.trim() ?? '']));
    const line = index + 2;
    const status = parseChoice(record.status, APPLICATION_STATUSES, 'Saved');
    const priority = parseChoice(record.priority, PRIORITIES, 'Normal');
    const nextActionType = parseChoice(record.next_action_type, NEXT_ACTION_TYPES, null);
    const workMode = parseChoice(record.work_mode, ['Remote', 'Hybrid', 'On-site'] as const, null);
    if (!record.title) errors.push(`Row ${line}: title is required.`);
    if (!record.company) errors.push(`Row ${line}: company is required.`);
    if (record.status && !status) errors.push(`Row ${line}: status is not valid.`);
    if (record.priority && !priority) errors.push(`Row ${line}: priority is not valid.`);
    if (record.next_action_type && !nextActionType) errors.push(`Row ${line}: next_action_type is not valid.`);
    if (record.work_mode && !workMode) errors.push(`Row ${line}: work_mode is not valid.`);
    return {
      id: record.id || undefined,
      title: record.title,
      company: record.company,
      location: nullIfBlank(record.location),
      salary_min: null,
      salary_max: null,
      salary_text: nullIfBlank(record.salary_text),
      work_mode: workMode,
      posting_url: nullIfBlank(record.posting_url),
      source_site: nullIfBlank(record.source_site),
      status: (status ?? 'Saved') as ApplicationStatus,
      priority,
      archived_at: null,
      next_action_type: nextActionType as NextActionType | null,
      next_action_date: nullIfBlank(record.next_action_date),
      date_saved: record.date_saved || todayIsoDate(),
      date_applied: nullIfBlank(record.date_applied),
      resume_version_id: nullIfBlank(record.resume_version_id),
      cover_letter_version: nullIfBlank(record.cover_letter_version),
      follow_up_date: nullIfBlank(record.next_action_date),
      notes: nullIfBlank(record.notes),
      job_description: nullIfBlank(record.job_description),
      parsed_keywords: nullIfBlank(record.parsed_keywords),
    };
  });
  return { valid: errors.length === 0, rows: inputs.length, creatable: inputs.length, duplicates: 0, errors, inputs };
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((cells) => cells.some((value) => value.trim()));
}

function parseChoice<const T extends readonly string[]>(value: string | undefined, allowed: T, fallback: T[number] | null) {
  if (!value) return fallback;
  return allowed.includes(value) ? value as T[number] : null;
}

function nullIfBlank(value?: string) {
  return value?.trim() || null;
}

async function findExistingApplication(db: Awaited<ReturnType<typeof getDb>>, input: ApplicationInput & { id?: string }) {
  if (input.id) {
    const byId = await db.getFirstAsync<JobApplication>('SELECT * FROM applications WHERE id = ?', input.id);
    if (byId) return byId;
  }
  if (input.posting_url) {
    const byUrl = await db.getFirstAsync<JobApplication>('SELECT * FROM applications WHERE posting_url = ? LIMIT 1', input.posting_url);
    if (byUrl) return byUrl;
  }
  const rows = await db.getAllAsync<JobApplication>('SELECT * FROM applications WHERE lower(company) = lower(?)', input.company);
  const title = compactKey(input.title);
  return rows.find((row) => compactKey(row.title) === title) ?? null;
}

function compactKey(value?: string | null) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, '').trim() ?? '';
}
