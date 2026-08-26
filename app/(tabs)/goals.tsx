import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { NeonCard, NeonProgress } from '@/components/neon-ui';
import { EmptyState, Symbol } from '@/components/ui';
import { accents, colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { Goal } from '@/types/models';
import { formatMoney, progress } from '@/utils/money';

function savedThisMonth(contributions: ReturnType<typeof useAppStore>['contributions'], goalId: string) {
  const now = new Date();
  return Math.max(0, contributions.reduce((sum, item) => {
    if (item.sourceType !== 'goal' || item.sourceId !== goalId) return sum;
    const date = new Date(item.createdAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() ? sum + item.amount : sum;
  }, 0));
}

function IconTile({ goal, accent }: { goal: Goal; accent: string }) {
  return (
    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
      <Symbol name={goal.icon} size={17} color="#FFFFFF" />
    </View>
  );
}

function GoalRow({ goal, monthSaved, accent, onDelete }: { goal: Goal; monthSaved: number; accent: string; onDelete: () => void }) {
  const recurring = goal.mode === 'recurring';
  const target = recurring ? Math.max(0, goal.recurringAmount ?? goal.targetAmount) : Math.max(0, goal.targetAmount);
  const current = recurring ? monthSaved : Math.max(0, goal.savedAmount);
  const percentage = progress(current, target);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/goal-detail', params: { goalId: goal.id } })}
      onLongPress={onDelete}
      style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
    >
      <NeonCard style={{ padding: 12, gap: 9 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconTile goal={goal} accent={accent} />
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>{goal.title}</Text>
            <NeonProgress value={percentage} color={accent} height={4} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text selectable style={{ color: colors.text, fontSize: 11.5, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{formatMoney(current)} / {formatMoney(target)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 9.5 }}>{Math.round(percentage * 100)}%</Text>
          </View>
          <Symbol name="chevron.right" size={9} color={colors.textMuted} />
        </View>
      </NeonCard>
    </Pressable>
  );
}

function Section({ title, subtitle, onAdd, children }: { title: string; subtitle?: string; onAdd: () => void; children: ReactNode }) {
  return (
    <View style={{ gap: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text selectable style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>{title}</Text>
          {subtitle ? <Text style={{ color: colors.textMuted, fontSize: 10 }}>{subtitle}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onAdd}
          style={({ pressed }) => ({ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}
        >
          <Symbol name="plus" size={13} color={colors.text} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

export default function GoalsScreen() {
  const store = useAppStore();
  const recurringGoals = store.goals.filter((goal) => goal.mode === 'recurring');
  const activeTargets = store.goals.filter((goal) => goal.mode === 'target' && goal.savedAmount < goal.targetAmount);
  const completedTargets = store.goals.filter((goal) => goal.mode === 'target' && goal.savedAmount >= goal.targetAmount);

  const remove = (goal: Goal) => {
    Alert.alert('Sparziel verwalten', goal.title, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteGoal(goal.id) },
    ]);
  };

  const addGoal = () => router.push('/add-goal');

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 12, paddingBottom: 106, gap: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text selectable style={{ flex: 1, color: colors.text, fontSize: 23, fontWeight: '800', letterSpacing: -0.6 }}>Meine Ziele</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('Ziele', 'Lange auf ein Ziel drücken, um es zu verwalten.')}
          style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.55 : 1 })}
        >
          <Symbol name="slider.horizontal.3" size={17} color={colors.text} />
        </Pressable>
      </View>

      {store.goals.length === 0 ? (
        <EmptyState icon="target" title="Noch kein Sparziel" body="Lege deine erste Rücklage oder ein Sparziel an." />
      ) : (
        <>
          <Section title="Monatliche Rücklagen" subtitle="Regelmäßige Beträge für Fixkosten und Rücklagen" onAdd={addGoal}>
            <View style={{ gap: 8 }}>
              {recurringGoals.length ? recurringGoals.map((goal, index) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  monthSaved={savedThisMonth(store.contributions, goal.id)}
                  accent={accents[index % accents.length] ?? colors.primary}
                  onDelete={() => remove(goal)}
                />
              )) : <Text style={{ color: colors.textMuted, fontSize: 11 }}>Noch keine monatliche Rücklage.</Text>}
            </View>
          </Section>

          <Section title="Sparziele" subtitle="Konkrete Ziele mit Zielbetrag" onAdd={addGoal}>
            <View style={{ gap: 8 }}>
              {activeTargets.length ? activeTargets.map((goal, index) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  monthSaved={0}
                  accent={accents[(index + recurringGoals.length) % accents.length] ?? colors.primary}
                  onDelete={() => remove(goal)}
                />
              )) : <Text style={{ color: colors.textMuted, fontSize: 11 }}>Noch kein aktives Sparziel.</Text>}
            </View>
          </Section>

          {completedTargets.length ? (
            <Section title="Erreicht" subtitle="Abgeschlossene Ziele" onAdd={addGoal}>
              <View style={{ gap: 8 }}>
                {completedTargets.map((goal) => (
                  <GoalRow
                    key={goal.id}
                    goal={goal}
                    monthSaved={0}
                    accent={colors.success}
                    onDelete={() => remove(goal)}
                  />
                ))}
              </View>
            </Section>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
