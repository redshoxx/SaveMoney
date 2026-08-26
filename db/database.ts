import * as SQLite from 'expo-sqlite';

import type {
  AppSnapshot,
  Challenge,
  ChallengeMode,
  Contribution,
  Goal,
  GoalMode,
  NoSpendDay,
  SavingRule,
  SavingRuleFrequency,
} from '@/types/models';
import { makeId } from '@/utils/money';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let databaseReadyPromise: Promise<void> | null = null;

async function ensureColumn(db: SQLite.SQLiteDatabase, table: string, column: string, definition: string) {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!rows.some((row) => row.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function backfillDisplayNumbers(db: SQLite.SQLiteDatabase) {
  const rows = await db.getAllAsync<{
    kind: 'goal' | 'challenge';
    id: string;
    created_at: string;
    display_number: number | null;
  }>(`
    SELECT 'goal' AS kind, id, created_at, display_number FROM goals
    UNION ALL
    SELECT 'challenge' AS kind, id, created_at, display_number FROM challenges
    ORDER BY created_at ASC, id ASC
  `);

  let highest = rows.reduce((max, row) => Math.max(max, Number(row.display_number) || 0), 0);
  const missing = rows.filter((row) => !Number(row.display_number));

  if (missing.length) {
    await db.withTransactionAsync(async () => {
      for (const row of missing) {
        highest += 1;
        const table = row.kind === 'goal' ? 'goals' : 'challenges';
        await db.runAsync(`UPDATE ${table} SET display_number = ? WHERE id = ?`, highest, row.id);
      }
    });
  }

  await db.runAsync(
    `INSERT INTO app_counters (key, value) VALUES ('entity_number', ?)
     ON CONFLICT(key) DO UPDATE SET value = MAX(value, excluded.value)`,
    highest,
  );
}

async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      display_number INTEGER,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL CHECK(target_amount > 0),
      saved_amount REAL NOT NULL DEFAULT 0 CHECK(saved_amount >= 0),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY NOT NULL,
      display_number INTEGER,
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

    CREATE TABLE IF NOT EXISTS saving_rules (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      goal_id TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly')),
      weekday INTEGER,
      day_of_month INTEGER,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_applied_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS no_spend_days (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL UNIQUE,
      saved_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_counters (
      key TEXT PRIMARY KEY NOT NULL,
      value INTEGER NOT NULL DEFAULT 0
    );
  `);

  await ensureColumn(db, 'goals', 'target_date', 'TEXT');
  await ensureColumn(db, 'goals', 'mode', "TEXT NOT NULL DEFAULT 'target'");
  await ensureColumn(db, 'goals', 'recurring_amount', 'REAL');
  await ensureColumn(db, 'goals', 'recurring_day', 'INTEGER');
  await ensureColumn(db, 'goals', 'display_number', 'INTEGER');
  await ensureColumn(db, 'challenges', 'mode', "TEXT NOT NULL DEFAULT 'fixed'");
  await ensureColumn(db, 'challenges', 'duration_days', 'INTEGER');
  await ensureColumn(db, 'challenges', 'display_number', 'INTEGER');

  await db.runAsync(
    "UPDATE goals SET target_date = substr(target_date, 1, 10) WHERE target_date IS NOT NULL AND instr(target_date, 'T') > 0",
  );
  await backfillDisplayNumbers(db);

  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_display_number ON goals(display_number) WHERE display_number IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_display_number ON challenges(display_number) WHERE display_number IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_contributions_source ON contributions(source_type, source_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_rules_goal ON saving_rules(goal_id);
  `);
}

export async function getDatabase() {
  if (!databasePromise) databasePromise = SQLite.openDatabaseAsync('sparflow.db');
  const db = await databasePromise;
  if (!databaseReadyPromise) {
    databaseReadyPromise = initializeDatabase(db).catch((error) => {
      databaseReadyPromise = null;
      throw error;
    });
  }
  await databaseReadyPromise;
  return db;
}

async function nextEntityNumber(db: SQLite.SQLiteDatabase) {
  await db.runAsync("INSERT OR IGNORE INTO app_counters (key, value) VALUES ('entity_number', 0)");
  await db.runAsync("UPDATE app_counters SET value = value + 1 WHERE key = 'entity_number'");
  const row = await db.getFirstAsync<{ value: number }>("SELECT value FROM app_counters WHERE key = 'entity_number'");
  if (!row) throw new Error('Interne Nummer konnte nicht erzeugt werden.');
  return Number(row.value);
}

function mapGoal(row: Record<string, unknown>): Goal {
  return {
    id: String(row.id),
    displayNumber: Number(row.display_number) || 0,
    title: String(row.title),
    mode: (row.mode ? String(row.mode) : 'target') as GoalMode,
    targetAmount: Number(row.target_amount),
    savedAmount: Number(row.saved_amount),
    recurringAmount: row.recurring_amount == null ? null : Number(row.recurring_amount),
    recurringDay: row.recurring_day == null ? null : Number(row.recurring_day),
    icon: String(row.icon),
    color: String(row.color),
    targetDate: row.target_date ? String(row.target_date) : null,
    createdAt: String(row.created_at),
  };
}

function mapChallenge(row: Record<string, unknown>): Challenge {
  return {
    id: String(row.id),
    displayNumber: Number(row.display_number) || 0,
    templateId: row.template_id ? String(row.template_id) : null,
    title: String(row.title),
    subtitle: String(row.subtitle ?? ''),
    targetAmount: Number(row.target_amount),
    savedAmount: Number(row.saved_amount),
    stepAmount: Number(row.step_amount),
    totalSteps: Number(row.total_steps),
    completedSteps: Number(row.completed_steps),
    mode: (row.mode ? String(row.mode) : 'fixed') as ChallengeMode,
    durationDays: row.duration_days == null ? null : Number(row.duration_days),
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

function mapRule(row: Record<string, unknown>): SavingRule {
  return {
    id: String(row.id),
    title: String(row.title),
    goalId: String(row.goal_id),
    amount: Number(row.amount),
    frequency: String(row.frequency) as SavingRuleFrequency,
    weekday: row.weekday == null ? null : Number(row.weekday),
    dayOfMonth: row.day_of_month == null ? null : Number(row.day_of_month),
    enabled: Number(row.enabled) === 1,
    lastAppliedAt: row.last_applied_at ? String(row.last_applied_at) : null,
    createdAt: String(row.created_at),
  };
}

function mapNoSpendDay(row: Record<string, unknown>): NoSpendDay {
  return {
    id: String(row.id),
    date: String(row.date),
    savedAmount: Number(row.saved_amount),
    createdAt: String(row.created_at),
  };
}

export async function loadSnapshot(): Promise<AppSnapshot> {
  const db = await getDatabase();
  const [goalRows, challengeRows, contributionRows, ruleRows, noSpendRows] = await Promise.all([
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM goals ORDER BY created_at DESC'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM challenges ORDER BY completed_at IS NOT NULL, created_at DESC'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM contributions ORDER BY created_at DESC LIMIT 500'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM saving_rules ORDER BY created_at DESC'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM no_spend_days ORDER BY date DESC LIMIT 365'),
  ]);

  return {
    goals: goalRows.map(mapGoal),
    challenges: challengeRows.map(mapChallenge),
    contributions: contributionRows.map(mapContribution),
    savingRules: ruleRows.map(mapRule),
    noSpendDays: noSpendRows.map(mapNoSpendDay),
  };
}

export async function insertGoal(input: {
  title: string;
  mode?: GoalMode;
  targetAmount: number;
  recurringAmount?: number | null;
  recurringDay?: number | null;
  icon: string;
  color: string;
  targetDate?: string | null;
}) {
  const db = await getDatabase();
  const id = makeId('goal');
  const mode = input.mode ?? 'target';
  const createdAt = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    const displayNumber = await nextEntityNumber(db);
    await db.runAsync(
      `INSERT INTO goals (id, display_number, title, mode, target_amount, saved_amount, recurring_amount, recurring_day, icon, color, target_date, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
      id,
      displayNumber,
      input.title.trim(),
      mode,
      input.targetAmount,
      mode === 'recurring' ? input.recurringAmount ?? input.targetAmount : null,
      mode === 'recurring' ? input.recurringDay ?? 1 : null,
      input.icon,
      input.color,
      input.targetDate?.slice(0, 10) ?? null,
      createdAt,
    );
  });
  return id;
}

export async function addGoalContribution(goalId: string, amount: number, note?: string | null) {
  const db = await getDatabase();
  const goal = await db.getFirstAsync<{ target_amount: number; saved_amount: number; title: string; mode: string }>(
    'SELECT target_amount, saved_amount, title, mode FROM goals WHERE id = ?', goalId,
  );
  if (!goal) throw new Error('Sparbereich wurde nicht gefunden.');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Bitte gib einen gültigen Sparbetrag ein.');

  const recurring = goal.mode === 'recurring';
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.saved_amount));
  if (!recurring && remaining <= 0) throw new Error('Dieses Sparziel ist bereits erreicht.');
  const applied = recurring ? amount : Math.min(amount, remaining);

  await db.withTransactionAsync(async () => {
    if (recurring) {
      await db.runAsync('UPDATE goals SET saved_amount = saved_amount + ? WHERE id = ?', applied, goalId);
    } else {
      await db.runAsync('UPDATE goals SET saved_amount = MIN(target_amount, saved_amount + ?) WHERE id = ?', applied, goalId);
    }
    await db.runAsync(
      `INSERT INTO contributions (id, source_type, source_id, amount, note, created_at)
       VALUES (?, 'goal', ?, ?, ?, ?)`,
      makeId('save'), goalId, applied, note?.trim() || goal.title, new Date().toISOString(),
    );
  });
  return applied;
}

export async function insertChallenge(input: {
  templateId?: string | null;
  title: string;
  subtitle: string;
  targetAmount: number;
  stepAmount: number;
  totalSteps: number;
  mode?: ChallengeMode;
  durationDays?: number | null;
  icon: string;
  color: string;
}) {
  const db = await getDatabase();
  const id = makeId('challenge');
  const createdAt = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    const displayNumber = await nextEntityNumber(db);
    await db.runAsync(
      `INSERT INTO challenges (
        id, display_number, template_id, title, subtitle, target_amount, saved_amount, step_amount,
        total_steps, completed_steps, mode, duration_days, icon, color, created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?, ?, ?, ?, NULL)`,
      id, displayNumber, input.templateId ?? null, input.title.trim(), input.subtitle.trim(), input.targetAmount,
      input.stepAmount, input.totalSteps, input.mode ?? 'fixed', input.durationDays ?? null,
      input.icon, input.color, createdAt,
    );
  });
  return id;
}

export async function completeChallengeStep(challengeId: string, overrideAmount?: number) {
  const db = await getDatabase();
  const challenge = await db.getFirstAsync<{
    target_amount: number; saved_amount: number; step_amount: number; title: string;
  }>('SELECT target_amount, saved_amount, step_amount, title FROM challenges WHERE id = ?', challengeId);
  if (!challenge) throw new Error('Challenge wurde nicht gefunden.');

  const remaining = Number(challenge.target_amount) - Number(challenge.saved_amount);
  if (remaining <= 0) throw new Error('Diese Challenge ist bereits abgeschlossen.');
  const requested = overrideAmount && overrideAmount > 0 ? overrideAmount : Number(challenge.step_amount);
  const applied = Math.min(requested, remaining);
  const nextSaved = Number(challenge.saved_amount) + applied;
  const completedAt = nextSaved >= Number(challenge.target_amount) ? new Date().toISOString() : null;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE challenges SET saved_amount = MIN(target_amount, saved_amount + ?),
       completed_steps = MIN(total_steps, completed_steps + 1),
       completed_at = COALESCE(?, completed_at) WHERE id = ?`,
      applied, completedAt, challengeId,
    );
    await db.runAsync(
      `INSERT INTO contributions (id, source_type, source_id, amount, note, created_at)
       VALUES (?, 'challenge', ?, ?, ?, ?)`,
      makeId('save'), challengeId, applied, challenge.title, new Date().toISOString(),
    );
  });
  return applied;
}

export async function insertSavingRule(input: {
  title: string;
  goalId: string;
  amount: number;
  frequency: SavingRuleFrequency;
  weekday?: number | null;
  dayOfMonth?: number | null;
}) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO saving_rules (id, title, goal_id, amount, frequency, weekday, day_of_month, enabled, last_applied_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, NULL, ?)`,
    makeId('rule'), input.title.trim(), input.goalId, input.amount, input.frequency,
    input.weekday ?? null, input.dayOfMonth ?? null, new Date().toISOString(),
  );
}

export async function toggleSavingRule(ruleId: string, enabled: boolean) {
  const db = await getDatabase();
  await db.runAsync('UPDATE saving_rules SET enabled = ? WHERE id = ?', enabled ? 1 : 0, ruleId);
}

export async function applySavingRule(ruleId: string) {
  const db = await getDatabase();
  const rule = await db.getFirstAsync<{ goal_id: string; amount: number; title: string }>(
    'SELECT goal_id, amount, title FROM saving_rules WHERE id = ?', ruleId,
  );
  if (!rule) throw new Error('Sparregel wurde nicht gefunden.');
  const applied = await addGoalContribution(rule.goal_id, Number(rule.amount), `Sparregel: ${rule.title}`);
  await db.runAsync('UPDATE saving_rules SET last_applied_at = ? WHERE id = ?', new Date().toISOString(), ruleId);
  return applied;
}

export async function removeSavingRule(ruleId: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM saving_rules WHERE id = ?', ruleId);
}

export async function markNoSpendDay(date: string, goalId?: string | null, amount = 0) {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM no_spend_days WHERE date = ?', date);
  if (existing) throw new Error('Dieser Tag ist bereits als No-Spend-Day markiert.');

  let applied = 0;
  if (goalId && amount > 0) applied = await addGoalContribution(goalId, amount, 'No-Spend-Day');
  await db.runAsync(
    'INSERT INTO no_spend_days (id, date, saved_amount, created_at) VALUES (?, ?, ?, ?)',
    makeId('nospend'), date, applied, new Date().toISOString(),
  );
}

export async function removeGoal(goalId: string) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM saving_rules WHERE goal_id = ?', goalId);
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
    await db.runAsync('DELETE FROM saving_rules');
    await db.runAsync('DELETE FROM no_spend_days');
    await db.runAsync('DELETE FROM contributions');
    await db.runAsync('DELETE FROM goals');
    await db.runAsync('DELETE FROM challenges');
  });
}
