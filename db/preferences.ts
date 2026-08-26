import { getDatabase } from '@/db/database';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AppPreferences = {
  themeMode: ThemeMode;
  haptics: boolean;
  confirmQuickSave: boolean;
  showMonthly: boolean;
  showGamification: boolean;
  showQuickAmounts: boolean;
  showCompletedGoals: boolean;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  themeMode: 'system',
  haptics: true,
  confirmQuickSave: false,
  showMonthly: false,
  showGamification: false,
  showQuickAmounts: true,
  showCompletedGoals: false,
};

let readyPromise: Promise<void> | null = null;

async function getDb() {
  const db = await getDatabase();
  if (!readyPromise) {
    readyPromise = db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `).catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  await readyPromise;
  return db;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return fallback;
}

function parseThemeMode(value: string | undefined): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : DEFAULT_PREFERENCES.themeMode;
}

export async function loadPreferences(): Promise<AppPreferences> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM app_settings');
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    themeMode: parseThemeMode(map.themeMode),
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
  const serialized = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    serialized,
  );
}

export async function resetPreferences() {
  const db = await getDb();
  await db.runAsync('DELETE FROM app_settings');
}
