import type { SQLiteDatabase } from 'expo-sqlite';
import { schemaSql } from './schema';

export async function runMigrations(db: SQLiteDatabase) {
  await db.execAsync(schemaSql);
  await addMissingResumeFileColumns(db);
  await addMissingApplicationUxColumns(db);
  await addMissingReminderNotificationColumns(db);
}

async function addMissingResumeFileColumns(db: SQLiteDatabase) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(resume_versions)');
  const existing = new Set(columns.map((column) => column.name));
  const additions = [
    ['file_uri', 'TEXT'],
    ['file_name', 'TEXT'],
    ['file_type', 'TEXT'],
    ['file_size', 'INTEGER'],
  ] as const;

  for (const [name, type] of additions) {
    if (!existing.has(name)) {
      await db.execAsync(`ALTER TABLE resume_versions ADD COLUMN ${name} ${type}`);
    }
  }
}

async function addMissingApplicationUxColumns(db: SQLiteDatabase) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(applications)');
  const existing = new Set(columns.map((column) => column.name));
  const additions = [
    ['work_mode', 'TEXT'],
    ['priority', 'TEXT'],
    ['archived_at', 'TEXT'],
    ['next_action_type', 'TEXT'],
    ['next_action_date', 'TEXT'],
  ] as const;

  for (const [name, type] of additions) {
    if (!existing.has(name)) {
      await db.execAsync(`ALTER TABLE applications ADD COLUMN ${name} ${type}`);
    }
  }
}

async function addMissingReminderNotificationColumns(db: SQLiteDatabase) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(reminders)');
  const existing = new Set(columns.map((column) => column.name));
  if (!existing.has('notification_id')) {
    await db.execAsync('ALTER TABLE reminders ADD COLUMN notification_id TEXT');
  }
}
