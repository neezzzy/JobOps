import type { SQLiteDatabase } from 'expo-sqlite';
import { schemaSql } from './schema';

export async function runMigrations(db: SQLiteDatabase) {
  await db.execAsync(schemaSql);
  await addMissingResumeFileColumns(db);
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
