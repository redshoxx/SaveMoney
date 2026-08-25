import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState, ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
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

function CompactAction({
  icon,
  label,
  onPress,
  disabled,
  destructive,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 34,
        paddingHorizontal: 11,
        borderRadius: 10,
        borderWidth: destructive ? 1 : 0,
        borderColor: destructive ? colors.danger : 'transparent',
        backgroundColor: destructive ? 'transparent' : colors.primarySoft,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        opacity: disabled ? 0.35 : pressed ? 0.68 : 1,
      })}
    >
      <Symbol name={icon} size={12} color={destructive ? colors.danger : colors.primaryDark} />
      <Text style={{ color: destructive ? colors.danger : colors.primaryDark, fontSize: 11.5, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}

function AreaCard({ goal, monthSaved, onDelete }: { goal: Goal; monthSaved: number; onDelete: () => void }) {
  const recurring = goal.mode === 'recurring';
  const recurringAmount = goal.recurringAmount ?? goal.targetAmount;
  const completed = !recurring && goal.savedAmount >= goal.targetAmount;
  const current = recurring ? monthSaved : goal.savedAmount;
  const target = recurring ? recurringAmount : goal.targetAmount;
  const percentage = progress(current, target);
  const change = (mode: 'save' | 'withdraw') => router.push({ pathname: '/save', params: { goalId: goal.id, mode } });

  return (
    <View style={{ borderRadius: 16, padding: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}>
          <Symbol name={completed ? 'checkmark' : goal.icon} size={16} color={colors.primaryDark} />
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 15.5, fontWeight: '900' }}>{goal.title}</Text>
          <Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 10.5 }}>
            {recurring
              ? `${formatMoney(current)} / ${formatMoney(target)} diesen Monat · gesamt ${formatMoney(goal.savedAmount)}`
              : completed
                ? `${formatMoney(goal.targetAmount)} erreicht`
                : `${formatMoney(goal.savedAmount)} / ${formatMoney(goal.targetAmount)} · ${formatMoney(Math.max(0, goal.targetAmount - goal.savedAmount))} offen`}
          </Text>
        </View>

        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{Math.round(percentage * 100)}%</Text>
        <Pressable accessibilityLabel={`${goal.title} verwalten`} onPress={onDelete} hitSlop={10} style={{ width: 30, height: 34, alignItems: 'center', justifyContent: 'center' }}>
          <Symbol name="ellipsis" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      <ProgressBar value={percentage} color={completed ? colors.success : colors.primary} height={4} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ flex: 1, color: colors.textMuted, fontSize: 10.5 }} numberOfLines={1}>
          {recurring ? `${formatMoney(recurringAmount)} monatlich · ab Tag ${goal.recurringDay ?? 1}` : completed ? 'Abgeschlossen' : 'Aktives Sparziel'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {!completed ? <CompactAction icon="plus" label="Sparen" onPress={() => change('save')} /> : null}
          <CompactAction icon="minus" label={completed ? 'Korrigieren' : 'Abziehen'} destructive onPress={() => change('withdraw')} disabled={goal.savedAmount <= 0} />
        </View>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>{title}</Text>
      {children}
    </View>
  );
}

export default function GoalsScreen() {
  const store = useAppStore();
  const recurringGoals = store.goals.filter((goal) => goal.mode === 'recurring');
  const activeTargets = store.goals.filter((goal) => goal.mode === 'target' && goal.savedAmount < goal.targetAmount);
  const completedTargets = store.goals.filter((goal) => goal.mode === 'target' && goal.savedAmount >= goal.targetAmount);
  const totalInAreas = Math.max(0, store.goals.reduce((sum, goal) => sum + goal.savedAmount, 0));
  const monthlyPlanned = recurringGoals.reduce((sum, goal) => sum + (goal.recurringAmount ?? goal.targetAmount), 0);

  const remove = (goal: Goal) => {
    Alert.alert('Sparbereich verwalten', goal.title, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteGoal(goal.id) },
    ]);
  };

  const card = (goal: Goal) => (
    <AreaCard
      key={goal.id}
      goal={goal}
      monthSaved={goal.mode === 'recurring' ? savedThisMonth(store.contributions, goal.id) : 0}
      onDelete={() => remove(goal)}
    />
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 8, paddingBottom: 88, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.35 }}>Sparen</Text>
          <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>Ziele und Rücklagen kompakt verwalten</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Sparbereich hinzufügen" onPress={() => router.push('/add-goal')} style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, opacity: pressed ? 0.7 : 1 })}>
          <Symbol name="plus" size={16} color={colors.primaryDark} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 }}>
          <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '900' }}>GESAMT</Text>
          <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(totalInAreas)}</Text>
        </View>
        <View style={{ flex: 1, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 }}>
          <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '900' }}>PRO MONAT</Text>
          <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(monthlyPlanned)}</Text>
        </View>
      </View>

      {store.goals.length === 0 ? (
        <EmptyState icon="target" title="Noch kein Sparbereich" body="Lege ein Ziel oder eine monatliche Rücklage an." />
      ) : (
        <>
          {recurringGoals.length ? <Section title="Rücklagen">{recurringGoals.map(card)}</Section> : null}
          {activeTargets.length ? <Section title="Ziele">{activeTargets.map(card)}</Section> : null}
          {completedTargets.length ? <Section title="Erreicht">{completedTargets.map(card)}</Section> : null}
        </>
      )}
    </ScrollView>
  );
}
