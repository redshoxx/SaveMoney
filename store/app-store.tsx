import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { challengeTemplates } from '@/data/challenge-templates';
import {
  addGoalContribution,
  clearAllData,
  completeChallengeStep as completeChallengeStepDb,
  insertChallenge,
  insertGoal,
  loadSnapshot,
  removeChallenge,
  removeGoal,
} from '@/db/database';
import type { AppSnapshot, ChallengeTemplate } from '@/types/models';

const EMPTY: AppSnapshot = { goals: [], challenges: [], contributions: [] };

type CreateGoalInput = {
  title: string;
  targetAmount: number;
  icon?: string;
  color?: string;
};

type CustomChallengeInput = {
  title: string;
  targetAmount: number;
  stepAmount: number;
};

type StoreValue = AppSnapshot & {
  loading: boolean;
  error: string | null;
  totalSaved: number;
  level: number;
  xpInLevel: number;
  streak: number;
  reload: () => Promise<void>;
  createGoal: (input: CreateGoalInput) => Promise<void>;
  saveToGoal: (goalId: string, amount: number) => Promise<void>;
  startTemplate: (template: ChallengeTemplate) => Promise<void>;
  createCustomChallenge: (input: CustomChallengeInput) => Promise<void>;
  completeChallengeStep: (challengeId: string) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  deleteChallenge: (challengeId: string) => Promise<void>;
  resetAll: () => Promise<void>;
};

const AppStoreContext = createContext<StoreValue | null>(null);

function calculateStreak(snapshot: AppSnapshot) {
  if (snapshot.contributions.length === 0) return 0;
  const uniqueDays = Array.from(
    new Set(snapshot.contributions.map((item) => new Date(item.createdAt).toLocaleDateString('en-CA'))),
  ).sort((a, b) => (a < b ? 1 : -1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const latest = new Date(`${uniqueDays[0]}T00:00:00`);
  if (latest < yesterday) return 0;

  let streak = 1;
  let cursor = latest;
  for (let index = 1; index < uniqueDays.length; index += 1) {
    const expected = new Date(cursor);
    expected.setDate(cursor.getDate() - 1);
    const candidate = new Date(`${uniqueDays[index]}T00:00:00`);
    if (candidate.getTime() !== expected.getTime()) break;
    streak += 1;
    cursor = candidate;
  }
  return streak;
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setSnapshot(await loadSnapshot());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Lokale Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const runMutation = useCallback(
    async (mutation: () => Promise<void>, feedback: 'light' | 'success' = 'light') => {
      try {
        setError(null);
        await mutation();
        if (process.env.EXPO_OS === 'ios') {
          if (feedback === 'success') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
        await reload();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Aktion konnte nicht gespeichert werden.');
        throw cause;
      }
    },
    [reload],
  );

  const value = useMemo<StoreValue>(() => {
    const totalSaved = snapshot.contributions.reduce((sum, item) => sum + item.amount, 0);
    const xp = Math.floor(totalSaved);
    const level = Math.floor(xp / 100) + 1;
    const xpInLevel = xp % 100;

    return {
      ...snapshot,
      loading,
      error,
      totalSaved,
      level,
      xpInLevel,
      streak: calculateStreak(snapshot),
      reload,
      createGoal: (input) =>
        runMutation(async () => {
          await insertGoal({
            title: input.title,
            targetAmount: input.targetAmount,
            icon: input.icon ?? 'target',
            color: input.color ?? '#1D7A46',
          });
        }, 'success'),
      saveToGoal: (goalId, amount) => runMutation(() => addGoalContribution(goalId, amount)),
      startTemplate: (template) =>
        runMutation(async () => {
          const alreadyActive = snapshot.challenges.some(
            (item) => item.templateId === template.id && !item.completedAt,
          );
          if (alreadyActive) throw new Error('Diese Challenge läuft bereits.');
          await insertChallenge({
            templateId: template.id,
            title: template.title,
            subtitle: template.subtitle,
            targetAmount: template.targetAmount,
            stepAmount: template.stepAmount,
            totalSteps: template.totalSteps,
            icon: template.icon,
            color: template.color,
          });
        }, 'success'),
      createCustomChallenge: (input) =>
        runMutation(async () => {
          await insertChallenge({
            title: input.title,
            subtitle: 'Deine eigene Spar-Challenge',
            targetAmount: input.targetAmount,
            stepAmount: input.stepAmount,
            totalSteps: Math.max(1, Math.ceil(input.targetAmount / input.stepAmount)),
            icon: 'wand.and.stars',
            color: '#7652B7',
          });
        }, 'success'),
      completeChallengeStep: (challengeId) => runMutation(() => completeChallengeStepDb(challengeId)),
      deleteGoal: (goalId) => runMutation(() => removeGoal(goalId)),
      deleteChallenge: (challengeId) => runMutation(() => removeChallenge(challengeId)),
      resetAll: () => runMutation(clearAllData, 'success'),
    };
  }, [error, loading, reload, runMutation, snapshot]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('useAppStore muss innerhalb des AppStoreProvider verwendet werden.');
  return context;
}

export { challengeTemplates };
