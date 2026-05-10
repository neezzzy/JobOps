import * as SQLite from 'expo-sqlite';
import { APPLICATION_STATUSES, type ApplicationInput, type ApplicationStatus, type JobApplication, type Reminder, type StatusHistory } from '@/src/types/application';
import type { ResumeVersion, ResumeVersionInput } from '@/src/types/resume';
import { createId } from '@/src/utils/ids';
import { nowIso } from '@/src/utils/dates';
import { runMigrations } from './migrations';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('jobops.db').then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }
  return dbPromise;
}

export async function listApplications() {
  const db = await getDb();
  return db.getAllAsync<JobApplication>('SELECT * FROM applications ORDER BY created_at DESC');
}

export async function getApplication(id: string) {
  const db = await getDb();
  return db.getFirstAsync<JobApplication>('SELECT * FROM applications WHERE id = ?', id);
}

export async function createApplication(input: ApplicationInput) {
  const db = await getDb();
  const id = createId('app');
  const timestamp = nowIso();
  await db.runAsync(
    `INSERT INTO applications (
      id, title, company, location, salary_min, salary_max, salary_text, posting_url, source_site,
      status, date_saved, date_applied, resume_version_id, cover_letter_version, follow_up_date,
      notes, job_description, parsed_keywords, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.title,
    input.company,
    input.location ?? null,
    input.salary_min ?? null,
    input.salary_max ?? null,
    input.salary_text ?? null,
    input.posting_url ?? null,
    input.source_site ?? null,
    input.status,
    input.date_saved,
    input.date_applied ?? null,
    input.resume_version_id ?? null,
    input.cover_letter_version ?? null,
    input.follow_up_date ?? null,
    input.notes ?? null,
    input.job_description ?? null,
    input.parsed_keywords ?? null,
    timestamp,
    timestamp,
  );
  await addStatusHistory(id, null, input.status);
  await syncReminder(id, input.title, input.company, input.follow_up_date ?? null);
  return id;
}

export async function updateApplication(id: string, input: ApplicationInput) {
  const existing = await getApplication(id);
  if (!existing) return;
  const db = await getDb();
  const timestamp = nowIso();
  await db.runAsync(
    `UPDATE applications SET
      title = ?, company = ?, location = ?, salary_min = ?, salary_max = ?, salary_text = ?,
      posting_url = ?, source_site = ?, status = ?, date_saved = ?, date_applied = ?,
      resume_version_id = ?, cover_letter_version = ?, follow_up_date = ?, notes = ?,
      job_description = ?, parsed_keywords = ?, updated_at = ?
    WHERE id = ?`,
    input.title,
    input.company,
    input.location ?? null,
    input.salary_min ?? null,
    input.salary_max ?? null,
    input.salary_text ?? null,
    input.posting_url ?? null,
    input.source_site ?? null,
    input.status,
    input.date_saved,
    input.date_applied ?? null,
    input.resume_version_id ?? null,
    input.cover_letter_version ?? null,
    input.follow_up_date ?? null,
    input.notes ?? null,
    input.job_description ?? null,
    input.parsed_keywords ?? null,
    timestamp,
    id,
  );
  if (existing.status !== input.status) {
    await addStatusHistory(id, existing.status, input.status);
  }
  await syncReminder(id, input.title, input.company, input.follow_up_date ?? null);
}

export async function changeApplicationStatus(id: string, nextStatus: ApplicationStatus) {
  const existing = await getApplication(id);
  if (!existing || existing.status === nextStatus) return;
  const db = await getDb();
  const timestamp = nowIso();
  await db.runAsync('UPDATE applications SET status = ?, date_applied = COALESCE(date_applied, ?), updated_at = ? WHERE id = ?', nextStatus, nextStatus === 'Applied' ? timestamp.slice(0, 10) : null, timestamp, id);
  await addStatusHistory(id, existing.status, nextStatus);
}

export async function deleteApplication(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM reminders WHERE application_id = ?', id);
  await db.runAsync('DELETE FROM status_history WHERE application_id = ?', id);
  await db.runAsync('DELETE FROM applications WHERE id = ?', id);
}

export async function listResumeVersions() {
  const db = await getDb();
  return db.getAllAsync<ResumeVersion>('SELECT * FROM resume_versions ORDER BY created_at DESC');
}

export async function getResumeVersion(id: string) {
  const db = await getDb();
  return db.getFirstAsync<ResumeVersion>('SELECT * FROM resume_versions WHERE id = ?', id);
}

export async function createResumeVersion(input: ResumeVersionInput) {
  const db = await getDb();
  const timestamp = nowIso();
  const id = createId('res');
  await db.runAsync(
    `INSERT INTO resume_versions (
      id, name, target_role, notes, file_uri, file_name, file_type, file_size, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.name,
    input.target_role ?? null,
    input.notes ?? null,
    input.file_uri ?? null,
    input.file_name ?? null,
    input.file_type ?? null,
    input.file_size ?? null,
    timestamp,
    timestamp,
  );
  return id;
}

export async function updateResumeVersion(id: string, input: ResumeVersionInput) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE resume_versions SET
      name = ?, target_role = ?, notes = ?, file_uri = ?, file_name = ?, file_type = ?, file_size = ?, updated_at = ?
    WHERE id = ?`,
    input.name,
    input.target_role ?? null,
    input.notes ?? null,
    input.file_uri ?? null,
    input.file_name ?? null,
    input.file_type ?? null,
    input.file_size ?? null,
    nowIso(),
    id,
  );
}

export async function deleteResumeVersion(id: string) {
  const db = await getDb();
  await db.runAsync('UPDATE applications SET resume_version_id = NULL WHERE resume_version_id = ?', id);
  await db.runAsync('DELETE FROM resume_versions WHERE id = ?', id);
}

export async function listReminders(includeCompleted = false) {
  const db = await getDb();
  return db.getAllAsync<Reminder & { company?: string; job_title?: string }>(
    `SELECT reminders.*, applications.company, applications.title as job_title
     FROM reminders
     LEFT JOIN applications ON applications.id = reminders.application_id
     ${includeCompleted ? '' : 'WHERE reminders.completed = 0'}
     ORDER BY reminders.reminder_date ASC`,
  );
}

export async function updateReminderDate(id: string, reminderDate: string) {
  const db = await getDb();
  await db.runAsync('UPDATE reminders SET reminder_date = ?, completed = 0, updated_at = ? WHERE id = ?', reminderDate, nowIso(), id);
}

export async function setReminderCompleted(id: string, completed: boolean) {
  const db = await getDb();
  await db.runAsync('UPDATE reminders SET completed = ?, updated_at = ? WHERE id = ?', completed ? 1 : 0, nowIso(), id);
}

export async function listStatusHistory(applicationId: string) {
  const db = await getDb();
  return db.getAllAsync<StatusHistory>('SELECT * FROM status_history WHERE application_id = ? ORDER BY changed_at DESC', applicationId);
}

async function addStatusHistory(applicationId: string, oldStatus: string | null, newStatus: ApplicationStatus) {
  if (!APPLICATION_STATUSES.includes(newStatus)) return;
  const db = await getDb();
  await db.runAsync('INSERT INTO status_history (id, application_id, old_status, new_status, changed_at) VALUES (?, ?, ?, ?, ?)', createId('hist'), applicationId, oldStatus, newStatus, nowIso());
}

async function syncReminder(applicationId: string, title: string, company: string, date: string | null) {
  const db = await getDb();
  const existing = await db.getFirstAsync<Reminder>('SELECT * FROM reminders WHERE application_id = ?', applicationId);
  if (!date) {
    if (existing) await db.runAsync('DELETE FROM reminders WHERE application_id = ?', applicationId);
    return;
  }
  const timestamp = nowIso();
  const reminderTitle = `Follow up: ${title} at ${company}`;
  if (existing) {
    await db.runAsync('UPDATE reminders SET reminder_date = ?, title = ?, completed = 0, updated_at = ? WHERE application_id = ?', date, reminderTitle, timestamp, applicationId);
  } else {
    await db.runAsync('INSERT INTO reminders (id, application_id, reminder_date, title, completed, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)', createId('rem'), applicationId, date, reminderTitle, timestamp, timestamp);
  }
}
