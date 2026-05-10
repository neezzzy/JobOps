import type { SQLiteDatabase } from 'expo-sqlite';
import { schemaSql } from './schema';

export async function runMigrations(db: SQLiteDatabase) {
  await db.execAsync(schemaSql);
}
