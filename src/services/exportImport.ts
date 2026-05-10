import { getDb } from '@/src/db/database';
import type { JobApplication, Reminder, StatusHistory } from '@/src/types/application';
import type { ResumeVersion } from '@/src/types/resume';

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
    await db.runAsync('INSERT INTO reminders (id, application_id, reminder_date, title, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', item.id, item.application_id, item.reminder_date, item.title, item.completed ?? 0, item.created_at, item.updated_at);
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
