import * as SQLite from 'expo-sqlite';

import type { AppSnapshot, Challenge, Contribution, Goal } from '@/types/models';
import { makeId } from '@/utils/money';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('sparflow.db');
  }

  const db = await databasePromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL CHECK(target_amount > 0),
      saved_amount REAL NOT NULL DEFAULT 0 CHECK(saved_amount >= 0),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY NOT NULL,
      template_id TEXT,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      target_amount REAL NOT NULL CHECK(target_amount > 0),
      saved_amount REAL NOT NULL DEFAULT 0 CHECK(saved_amount >= 0),
      step_amount REAL NOT NULL CHECK(step_amount > 0),
      total_steps INTEGER NOT NULL CHECK(total_steps > 0),
      completed_steps INTEGER NOT NULL DEFAULT 0 CHECK(completed_steps >= 0),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS contributions (
      id TEXT PRIMARY KEY NOT NULL,
      source_type TEXT NOT NULL CHECK(source_type IN ('goal', 'challenge')),
      source_id TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_contributions_created_at
      ON contributions(created_at DESC);
  `);

  return db;
}

function mapGoal(row: Record<string, unknown>): Goal {
  return {
    id: String(row.id),
    title: String(row.title),
    targetAmount: Number(row.target_amount),
    savedAmount: Number(row.saved_amount),
    icon: String(row.icon),
    color: String(row.color),
    createdAt: String(row.created_at),
  };
}

function mapChallenge(row: Record<string, unknown>): Challenge {
  return {
    id: String(row.id),
    templateId: row.template_id ? String(row.template_id) : null,
    title: String(row.title),
    subtitle: String(row.subtitle ?? ''),
    targetAmount: Number(row.target_amount),
    savedAmount: Number(row.saved_amount),
    stepAmount: Number(row.step_amount),
    totalSteps: Number(row.total_steps),
    completedSteps: Number(row.completed_steps),
    icon: String(row.icon),
    color: String(row.color),
    createdAt: String(row.created_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
  };
}

function mapContribution(row: Record<string, unknown>): Contribution {
  return {
    id: String(row.id),
    sourceType: row.source_type as Contribution['sourceType'],
    sourceId: String(row.source_id),
    amount: Number(row.amount),
    note: row.note ? String(row.note) : null,
    createdAt: String(row.created_at),
  };
}

export async function loadSnapshot(): Promise<AppSnapshot> {
  const db = await getDatabase();
  const [goalRows, challengeRows, contributionRows] = await Promise.all([
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM goals ORDER BY created_at DESC'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM challenges ORDER BY completed_at IS NOT NULL, created_at DESC'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM contributions ORDER BY created_at DESC LIMIT 100'),
  ]);

  return {
    goals: goalRows.map(mapGoal),
    challenges: challengeRows.map(mapChallenge),
    contributions: contributionRows.map(mapContribution),
  };
}

export async function insertGoal(input: {
  title: string;
  targetAmount: number;
  icon: string;
  color: string;
}) {
  const db = await getDatabase();
  const id = makeId('goal');
  await db.runAsync(
    `INSERT INTO goals (id, title, target_amount, saved_amount, icon, color, created_at)
     VALUES (?, ?, ?, 0, ?, ?, ?)`,
    id,
    input.title.trim(),
    input.targetAmount,
    input.icon,
    input.color,
    new Date().toISOString(),
  );
  return id;
}

export async function addGoalContribution(goalId: string, amount: number) {
  const db = await getDatabase();
  const goal = await db.getFirstAsync<{ target_amount: number; saved_amount: number; title: string }>(
    'SELECT target_amount, saved_amount, title FROM goals WHERE id = ?',
    goalId,
  );
  if (!goal) throw new Error('Sparziel wurde nicht gefunden.');

  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.saved_amount));
  if (remaining <= 0) return;
  const applied = Math.min(amount, remaining);
  if (applied <= 0) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE goals SET saved_amount = MIN(target_amount, saved_amount + ?) WHERE id = ?',
      applied,
      goalId,
    );
    await db.runAsync(
      `INSERT INTO contributions (id, source_type, source_id, amount, note, created_at)
       VALUES (?, 'goal', ?, ?, ?, ?)`,
      makeId('save'),
      goalId,
      applied,
      goal.title,
      new Date().toISOString(),
    );
  });
}

export async function insertChallenge(input: {
  templateId?: string | null;
  title: string;
  subtitle: string;
  targetAmount: number;
  stepAmount: number;
  totalSteps: number;
  icon: string;
  color: string;
}) {
  const db = await getDatabase();
  const id = makeId('challenge');
  await db.runAsync(
    `INSERT INTO challenges (
      id, template_id, title, subtitle, target_amount, saved_amount, step_amount,
      total_steps, completed_steps, icon, color, created_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?, ?, NULL)`,
    id,
    input.templateId ?? null,
    input.title.trim(),
    input.subtitle.trim(),
    input.targetAmount,
    input.stepAmount,
    input.totalSteps,
    input.icon,
    input.color,
    new Date().toISOString(),
  );
  return id;
}

export async function completeChallengeStep(challengeId: string) {
  const db = await getDatabase();
  const challenge = await db.getFirstAsync<{
    target_amount: number;
    saved_amount: number;
    step_amount: number;
    completed_steps: number;
    title: string;
  }>('SELECT target_amount, saved_amount, step_amount, completed_steps, title FROM challenges WHERE id = ?', challengeId);

  if (!challenge) throw new Error('Challenge wurde nicht gefunden.');
  const remaining = Number(challenge.target_amount) - Number(challenge.saved_amount);
  if (remaining <= 0) return;

  const applied = Math.min(Number(challenge.step_amount), remaining);
  const nextSaved = Number(challenge.saved_amount) + applied;
  const completedAt = nextSaved >= Number(challenge.target_amount) ? new Date().toISOString() : null;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE challenges
       SET saved_amount = MIN(target_amount, saved_amount + ?),
           completed_steps = completed_steps + 1,
           completed_at = COALESCE(?, completed_at)
       WHERE id = ?`,
      applied,
      completedAt,
      challengeId,
    );
    await db.runAsync(
      `INSERT INTO contributions (id, source_type, source_id, amount, note, created_at)
       VALUES (?, 'challenge', ?, ?, ?, ?)`,
      makeId('save'),
      challengeId,
      applied,
      challenge.title,
      new Date().toISOString(),
    );
  });
}

export async function removeGoal(goalId: string) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM contributions WHERE source_type = 'goal' AND source_id = ?", goalId);
    await db.runAsync('DELETE FROM goals WHERE id = ?', goalId);
  });
}

export async function removeChallenge(challengeId: string) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM contributions WHERE source_type = 'challenge' AND source_id = ?", challengeId);
    await db.runAsync('DELETE FROM challenges WHERE id = ?', challengeId);
  });
}

export async function clearAllData() {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM contributions');
    await db.runAsync('DELETE FROM goals');
    await db.runAsync('DELETE FROM challenges');
  });
}
