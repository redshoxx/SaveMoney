import * as SQLite from 'expo-sqlite';

import type { ChallengeCell, ChallengeCellShape } from '@/types/models';
import { makeId } from '@/utils/money';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('sparflow.db');
  const db = await dbPromise;
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS challenge_cells (
      id TEXT PRIMARY KEY NOT NULL,
      challenge_id TEXT NOT NULL,
      cell_index INTEGER NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      contribution_id TEXT,
      grid_columns INTEGER NOT NULL DEFAULT 5,
      shape TEXT NOT NULL DEFAULT 'rounded' CHECK(shape IN ('rounded', 'circle')),
      UNIQUE(challenge_id, cell_index),
      FOREIGN KEY(challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_challenge_cells_challenge ON challenge_cells(challenge_id, cell_index);
  `);
  return db;
}

function mapCell(row: Record<string, unknown>): ChallengeCell {
  return {
    id: String(row.id),
    challengeId: String(row.challenge_id),
    index: Number(row.cell_index),
    amount: Number(row.amount),
    completed: Number(row.completed) === 1,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    contributionId: row.contribution_id ? String(row.contribution_id) : null,
    gridColumns: Math.max(3, Math.min(8, Number(row.grid_columns) || 5)),
    shape: (row.shape === 'circle' ? 'circle' : 'rounded') as ChallengeCellShape,
  };
}

export async function loadChallengeCells(): Promise<ChallengeCell[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM challenge_cells ORDER BY challenge_id, cell_index');
  return rows.map(mapCell);
}

export async function createChallengeCells(challengeId: string, amounts: number[], gridColumns = 5, shape: ChallengeCellShape = 'rounded') {
  const db = await getDb();
  const clean = amounts.filter((amount) => Number.isFinite(amount) && amount > 0).slice(0, 160);
  if (clean.length === 0) return;
  const columns = Math.max(3, Math.min(8, Math.round(gridColumns)));

  await db.withTransactionAsync(async () => {
    for (let index = 0; index < clean.length; index += 1) {
      await db.runAsync(
        `INSERT OR IGNORE INTO challenge_cells
         (id, challenge_id, cell_index, amount, completed, completed_at, contribution_id, grid_columns, shape)
         VALUES (?, ?, ?, ?, 0, NULL, NULL, ?, ?)`,
        makeId('cell'), challengeId, index, clean[index], columns, shape,
      );
    }
  });
}

export async function completeChallengeCell(challengeId: string, cellIndex: number) {
  const db = await getDb();
  const challenge = await db.getFirstAsync<{ title: string; target_amount: number; saved_amount: number; completed_steps: number; total_steps: number }>(
    'SELECT title, target_amount, saved_amount, completed_steps, total_steps FROM challenges WHERE id = ?', challengeId,
  );
  if (!challenge) throw new Error('Challenge wurde nicht gefunden.');
  const cell = await db.getFirstAsync<{ id: string; amount: number; completed: number }>(
    'SELECT id, amount, completed FROM challenge_cells WHERE challenge_id = ? AND cell_index = ?', challengeId, cellIndex,
  );
  if (!cell) throw new Error('Dieses Challenge-Feld wurde nicht gefunden.');
  if (Number(cell.completed) === 1) return 0;

  const amount = Number(cell.amount);
  const nextSaved = Math.min(Number(challenge.target_amount), Number(challenge.saved_amount) + amount);
  const nextCompleted = Math.min(Number(challenge.total_steps), Number(challenge.completed_steps) + 1);
  const isDone = nextCompleted >= Number(challenge.total_steps) || nextSaved >= Number(challenge.target_amount) - 0.001;
  const now = new Date().toISOString();
  const contributionId = makeId('save');

  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE challenge_cells SET completed = 1, completed_at = ?, contribution_id = ? WHERE challenge_id = ? AND cell_index = ? AND completed = 0', now, contributionId, challengeId, cellIndex);
    await db.runAsync('UPDATE challenges SET saved_amount = ?, completed_steps = ?, completed_at = ? WHERE id = ?', nextSaved, nextCompleted, isDone ? now : null, challengeId);
    await db.runAsync(
      `INSERT INTO contributions (id, source_type, source_id, amount, note, created_at)
       VALUES (?, 'challenge', ?, ?, ?, ?)`,
      contributionId, challengeId, amount, `${challenge.title} · Feld ${cellIndex + 1}`, now,
    );
  });
  return amount;
}

export async function undoChallengeCell(challengeId: string, cellIndex: number) {
  const db = await getDb();
  const challenge = await db.getFirstAsync<{ saved_amount: number; completed_steps: number }>('SELECT saved_amount, completed_steps FROM challenges WHERE id = ?', challengeId);
  if (!challenge) throw new Error('Challenge wurde nicht gefunden.');
  const cell = await db.getFirstAsync<{ amount: number; completed: number; contribution_id: string | null }>('SELECT amount, completed, contribution_id FROM challenge_cells WHERE challenge_id = ? AND cell_index = ?', challengeId, cellIndex);
  if (!cell || Number(cell.completed) !== 1) return 0;

  const amount = Number(cell.amount);
  await db.withTransactionAsync(async () => {
    if (cell.contribution_id) await db.runAsync('DELETE FROM contributions WHERE id = ?', cell.contribution_id);
    await db.runAsync('UPDATE challenge_cells SET completed = 0, completed_at = NULL, contribution_id = NULL WHERE challenge_id = ? AND cell_index = ?', challengeId, cellIndex);
    await db.runAsync('UPDATE challenges SET saved_amount = MAX(0, saved_amount - ?), completed_steps = MAX(0, completed_steps - 1), completed_at = NULL WHERE id = ?', amount, challengeId);
  });
  return amount;
}

export async function removeChallengeCells(challengeId: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM challenge_cells WHERE challenge_id = ?', challengeId);
}

export async function clearChallengeCells() {
  const db = await getDb();
  await db.runAsync('DELETE FROM challenge_cells');
}
