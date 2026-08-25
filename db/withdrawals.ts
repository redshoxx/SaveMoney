import * as SQLite from 'expo-sqlite';

import type { Contribution } from '@/types/models';
import { makeId } from '@/utils/money';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('sparflow.db');
  const db = await dbPromise;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS goal_withdrawals (
      id TEXT PRIMARY KEY NOT NULL,
      goal_id TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      note TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_goal_withdrawals_created_at ON goal_withdrawals(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_goal_withdrawals_goal ON goal_withdrawals(goal_id);
  `);
  return db;
}

export async function loadWithdrawals(): Promise<Contribution[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; goal_id: string; amount: number; note: string | null; created_at: string }>(
    'SELECT id, goal_id, amount, note, created_at FROM goal_withdrawals ORDER BY created_at DESC LIMIT 500',
  );
  return rows.map((row) => ({
    id: row.id,
    sourceType: 'goal',
    sourceId: row.goal_id,
    amount: -Math.abs(Number(row.amount)),
    note: row.note,
    createdAt: row.created_at,
  }));
}

export async function withdrawGoalAmount(goalId: string, amount: number, note?: string | null) {
  const db = await getDb();
  const goal = await db.getFirstAsync<{ saved_amount: number; title: string }>(
    'SELECT saved_amount, title FROM goals WHERE id = ?',
    goalId,
  );
  if (!goal) throw new Error('Sparbereich wurde nicht gefunden.');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Bitte gib einen gültigen Betrag ein.');

  const available = Math.max(0, Number(goal.saved_amount));
  if (available <= 0) throw new Error('In diesem Sparbereich ist noch kein Betrag verfügbar.');
  const applied = Math.min(amount, available);

  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE goals SET saved_amount = MAX(0, saved_amount - ?) WHERE id = ?', applied, goalId);
    await db.runAsync(
      `INSERT INTO goal_withdrawals (id, goal_id, amount, note, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      makeId('withdraw'),
      goalId,
      applied,
      note?.trim() || `Entnahme: ${goal.title}`,
      new Date().toISOString(),
    );
  });

  return applied;
}

export async function removeGoalWithdrawals(goalId: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM goal_withdrawals WHERE goal_id = ?', goalId);
}

export async function clearWithdrawals() {
  const db = await getDb();
  await db.runAsync('DELETE FROM goal_withdrawals');
}
