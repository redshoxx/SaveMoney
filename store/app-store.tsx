import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { challengeTemplates } from '@/data/challenge-templates';
import { savingActions } from '@/data/saving-actions';
import {
  addGoalContribution,
  applySavingRule as applySavingRuleDb,
  clearAllData,
  completeChallengeStep as completeChallengeStepDb,
  insertChallenge,
  insertGoal,
  insertSavingRule,
  loadSnapshot,
  markNoSpendDay as markNoSpendDayDb,
  removeChallenge,
  removeGoal,
  removeSavingRule,
  toggleSavingRule as toggleSavingRuleDb,
} from '@/db/database';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  resetPreferences as resetPreferencesDb,
  savePreference,
  type AppPreferences,
} from '@/db/preferences';
import type {
  AppSnapshot,
  ChallengeMode,
  ChallengeTemplate,
  SavingRuleFrequency,
} from '@/types/models';
import {
  buildAchievements,
  calculateStreak,
  forecastGoal,
  getPeriodMetrics,
  levelInfo,
  localDayKey,
  monthlyBuckets,
  weeklyBuckets,
} from '@/utils/insights';

const EMPTY: AppSnapshot = { goals: [], challenges: [], contributions: [], savingRules: [], noSpendDays: [] };

type CreateGoalInput = {
  title: string;
  targetAmount: number;
  icon?: string;
  color?: string;
  targetDate?: string | null;
};

type CustomChallengeInput = {
  title: string;
  targetAmount: number;
  stepAmount: number;
  mode: ChallengeMode;
  durationDays?: number | null;
};

type CreateRuleInput = {
  title: string;
  goalId: string;
  amount: number;
  frequency: SavingRuleFrequency;
  weekday?: number | null;
  dayOfMonth?: number | null;
};

function ruleIsDue(rule: AppSnapshot['savingRules'][number]) {
  if (!rule.enabled) return false;
  const now = new Date();
  const today = localDayKey(now);
  const last = rule.lastAppliedAt ? new Date(rule.lastAppliedAt) : null;
  if (rule.frequency === 'daily') return !last || localDayKey(last) !== today;
  if (rule.frequency === 'weekly') {
    if (rule.weekday != null && now.getDay() !== rule.weekday) return false;
    if (!last) return true;
    const diff = Math.floor((new Date(today).getTime() - new Date(localDayKey(last)).getTime()) / 86_400_000);
    return diff >= 7;
  }
  if (rule.dayOfMonth != null && now.getDate() !== rule.dayOfMonth) return false;
  return !last || last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear();
}

type StoreValue = AppSnapshot & {
  loading: boolean;
  error: string | null;
  preferences: AppPreferences;
  totalSaved: number;
  level: number;
  levelName: string;
  xpInLevel: number;
  xpTarget: number;
  streak: number;
  primaryGoal: AppSnapshot['goals'][number] | undefined;
  periodMetrics: ReturnType<typeof getPeriodMetrics>;
  weeklyData: ReturnType<typeof weeklyBuckets>;
  monthlyData: ReturnType<typeof monthlyBuckets>;
  forecast: ReturnType<typeof forecastGoal>;
  achievements: ReturnType<typeof buildAchievements>;
  dueRules: AppSnapshot['savingRules'];
  todayIsNoSpend: boolean;
  reload: () => Promise<void>;
  setPreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => Promise<void>;
  restorePreferenceDefaults: () => Promise<void>;
  createGoal: (input: CreateGoalInput) => Promise<void>;
  saveToGoal: (goalId: string, amount: number, note?: string) => Promise<void>;
  startTemplate: (template: ChallengeTemplate) => Promise<void>;
  createCustomChallenge: (input: CustomChallengeInput) => Promise<void>;
  completeChallengeStep: (challengeId: string, amountOverride?: number) => Promise<void>;
  createRule: (input: CreateRuleInput) => Promise<void>;
  toggleRule: (ruleId: string, enabled: boolean) => Promise<void>;
  applyRule: (ruleId: string) => Promise<void>;
  deleteRule: (ruleId: string) => Promise<void>;
  markNoSpend: (goalId?: string | null, amount?: number) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  deleteChallenge: (challengeId: string) => Promise<void>;
  resetAll: () => Promise<void>;
};

const AppStoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(EMPTY);
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const [nextSnapshot, nextPreferences] = await Promise.all([loadSnapshot(), loadPreferences()]);
      setSnapshot(nextSnapshot);
      setPreferences(nextPreferences);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Lokale Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const runMutation = useCallback(async (mutation: () => Promise<unknown>, feedback: 'light' | 'success' = 'light') => {
    try {
      setError(null);
      await mutation();
      if (preferences.haptics && process.env.EXPO_OS === 'ios') {
        if (feedback === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Aktion konnte nicht gespeichert werden.');
      throw cause;
    }
  }, [preferences.haptics, reload]);

  const updatePreference = useCallback(async <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
    await savePreference(key, value);
    setPreferences((current) => ({ ...current, [key]: value }));
    if (preferences.haptics && process.env.EXPO_OS === 'ios') {
      await Haptics.selectionAsync();
    }
  }, [preferences.haptics]);

  const restorePreferenceDefaults = useCallback(async () => {
    await resetPreferencesDb();
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const value = useMemo<StoreValue>(() => {
    const totalSaved = snapshot.contributions.reduce((sum, item) => sum + item.amount, 0);
    const streak = calculateStreak(snapshot.contributions);
    const level = levelInfo(Math.floor(totalSaved));
    const primaryGoal = snapshot.goals.find((goal) => goal.savedAmount < goal.targetAmount) ?? snapshot.goals[0];
    const periodMetrics = getPeriodMetrics(snapshot.contributions);
    const achievements = buildAchievements({ totalSaved, streak, goals: snapshot.goals, challenges: snapshot.challenges, noSpendDays: snapshot.noSpendDays });

    return {
      ...snapshot,
      loading,
      error,
      preferences,
      totalSaved,
      level: level.level,
      levelName: level.name,
      xpInLevel: level.xpInLevel,
      xpTarget: level.xpTarget,
      streak,
      primaryGoal,
      periodMetrics,
      weeklyData: weeklyBuckets(snapshot.contributions),
      monthlyData: monthlyBuckets(snapshot.contributions),
      forecast: forecastGoal(primaryGoal, snapshot.contributions),
      achievements,
      dueRules: snapshot.savingRules.filter(ruleIsDue),
      todayIsNoSpend: snapshot.noSpendDays.some((item) => item.date === localDayKey()),
      reload,
      setPreference: updatePreference,
      restorePreferenceDefaults,
      createGoal: (input) => runMutation(() => insertGoal({
        title: input.title,
        targetAmount: input.targetAmount,
        icon: input.icon ?? 'target',
        color: input.color ?? '#1D7A46',
        targetDate: input.targetDate ?? null,
      }), 'success'),
      saveToGoal: (goalId, amount, note) => runMutation(() => addGoalContribution(goalId, amount, note), 'success'),
      startTemplate: (template) => runMutation(async () => {
        const alreadyActive = snapshot.challenges.some((item) => item.templateId === template.id && !item.completedAt);
        if (alreadyActive) throw new Error('Diese Challenge läuft bereits.');
        await insertChallenge({
          templateId: template.id,
          title: template.title,
          subtitle: template.subtitle,
          targetAmount: template.targetAmount,
          stepAmount: template.stepAmount,
          totalSteps: template.totalSteps,
          mode: template.mode,
          durationDays: template.durationDays ?? null,
          icon: template.icon,
          color: template.color,
        });
      }, 'success'),
      createCustomChallenge: (input) => runMutation(() => insertChallenge({
        title: input.title,
        subtitle: input.mode === 'action' ? 'Sparen, wenn du die Aktion schaffst.' : 'Deine eigene Spar-Challenge',
        targetAmount: input.targetAmount,
        stepAmount: input.stepAmount,
        totalSteps: Math.max(1, Math.ceil(input.targetAmount / input.stepAmount)),
        mode: input.mode,
        durationDays: input.durationDays ?? null,
        icon: input.mode === 'random' ? 'die.face.5.fill' : 'wand.and.stars',
        color: '#7652B7',
      }), 'success'),
      completeChallengeStep: (challengeId, amountOverride) => runMutation(() => completeChallengeStepDb(challengeId, amountOverride), 'success'),
      createRule: (input) => runMutation(() => insertSavingRule(input), 'success'),
      toggleRule: (ruleId, enabled) => runMutation(() => toggleSavingRuleDb(ruleId, enabled)),
      applyRule: (ruleId) => runMutation(() => applySavingRuleDb(ruleId), 'success'),
      deleteRule: (ruleId) => runMutation(() => removeSavingRule(ruleId)),
      markNoSpend: (goalId, amount = 0) => runMutation(() => markNoSpendDayDb(localDayKey(), goalId, amount), 'success'),
      deleteGoal: (goalId) => runMutation(() => removeGoal(goalId)),
      deleteChallenge: (challengeId) => runMutation(() => removeChallenge(challengeId)),
      resetAll: () => runMutation(clearAllData, 'success'),
    };
  }, [error, loading, preferences, reload, restorePreferenceDefaults, runMutation, snapshot, updatePreference]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('useAppStore muss innerhalb des AppStoreProvider verwendet werden.');
  return context;
}

export { challengeTemplates, savingActions };
