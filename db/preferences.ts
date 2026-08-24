import * as SQLite from 'expo-sqlite';

export type AppPreferences = {
  haptics: boolean;
  confirmQuickSave: boolean;
  showMonthly: boolean;
  showGamification: boolean;
  showQuickAmounts: boolean;
  showCompletedGoals: boolean;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  haptics: true,
  confirmQuickSave: false,
  showMonthly: false,
  showGamification: false,
  showQuickAmounts: true,
  showCompletedGoals: false,
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('sparflow.db');
  const db = await dbPromise;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  return db;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return fallback;
}

export async function loadPreferences(): Promise<AppPreferences> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM app_settings');
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    haptics: parseBoolean(map.haptics, DEFAULT_PREFERENCES.haptics),
    confirmQuickSave: parseBoolean(map.confirmQuickSave, DEFAULT_PREFERENCES.confirmQuickSave),
    showMonthly: parseBoolean(map.showMonthly, DEFAULT_PREFERENCES.showMonthly),
    showGamification: parseBoolean(map.showGamification, DEFAULT_PREFERENCES.showGamification),
    showQuickAmounts: parseBoolean(map.showQuickAmounts, DEFAULT_PREFERENCES.showQuickAmounts),
    showCompletedGoals: parseBoolean(map.showCompletedGoals, DEFAULT_PREFERENCES.showCompletedGoals),
  };
}

export async function savePreference<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value ? '1' : '0',
  );
}

export async function resetPreferences() {
  const db = await getDb();
  await db.runAsync('DELETE FROM app_settings');
}
