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

function AreaCard({ goal, monthSaved, onDelete }: { goal: Goal; monthSaved: number; onDelete: () => void }) {
  const recurring = goal.mode === 'recurring';
  const recurringAmount = goal.recurringAmount ?? goal.targetAmount;
  const completed = !recurring && goal.savedAmount >= goal.targetAmount;
  const current = recurring ? monthSaved : goal.savedAmount;
  const target = recurring ? recurringAmount : goal.targetAmount;
  const percentage = progress(current, target);
  const change = (mode: 'save' | 'withdraw') => router.push({ pathname: '/save', params: { goalId: goal.id, mode } });

  return (
    <View style={{ borderRadius: 18, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: `${goal.color}18` }}>
          <Symbol name={completed ? 'checkmark' : goal.icon} size={18} color={goal.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>{goal.title}</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>
            {recurring
              ? `${formatMoney(current)} von ${formatMoney(target)} diesen Monat`
              : completed
                ? `${formatMoney(goal.targetAmount)} erreicht`
                : `${formatMoney(Math.max(0, goal.targetAmount - goal.savedAmount))} fehlen noch`}
          </Text>
        </View>
        <Text style={{ color: goal.color, fontSize: 12, fontWeight: '900' }}>{Math.round(percentage * 100)}%</Text>
        <Pressable accessibilityLabel={`${goal.title} verwalten`} onPress={onDelete} hitSlop={10} style={{ minWidth: 28, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}>
          <Symbol name="ellipsis" size={17} color={colors.textMuted} />
        </Pressable>
      </View>

      <ProgressBar value={percentage} color={goal.color} height={7} />

      {!completed ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable accessibilityRole="button" onPress={() => change('save')} style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 13, backgroundColor: goal.color, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.75 : 1 })}>
            <Symbol name="plus" size={13} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '900' }}>Sparen</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={goal.savedAmount <= 0} onPress={() => change('withdraw')} style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: goal.savedAmount > 0 ? colors.danger : colors.border, backgroundColor: goal.savedAmount > 0 ? colors.dangerSoft : colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: goal.savedAmount <= 0 ? 0.4 : pressed ? 0.7 : 1 })}>
            <Symbol name="minus" size={13} color={goal.savedAmount > 0 ? colors.danger : colors.textMuted} />
            <Text style={{ color: goal.savedAmount > 0 ? colors.danger : colors.textMuted, fontSize: 12.5, fontWeight: '900' }}>Abziehen</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => change('withdraw')} style={({ pressed }) => ({ minHeight: 42, borderRadius: 13, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}>
          <Symbol name="minus" size={13} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>Betrag korrigieren</Text>
        </Pressable>
      )}
    </View>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 9 }}>
      <View style={{ gap: 2 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.textMuted, fontSize: 11 }}>{subtitle}</Text> : null}
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
  const totalInAreas = Math.max(0, store.goals.reduce((sum, goal) => sum + goal.savedAmount, 0));
  const monthlyPlanned = recurringGoals.reduce((sum, goal) => sum + (goal.recurringAmount ?? goal.targetAmount), 0);

  const remove = (goal: Goal) => {
    Alert.alert('Sparbereich löschen?', `„${goal.title}“ und die zugehörigen Buchungen werden entfernt.`, [
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
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 96, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.5 }}>Sparen</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>Ziele und monatliche Rücklagen.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Sparbereich hinzufügen" onPress={() => router.push('/add-goal')} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1 })}>
          <Symbol name="plus" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={{ borderRadius: 18, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 18 }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '900' }}>IN BEREICHEN</Text>
          <Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(totalInAreas)}</Text>
        </View>
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '900' }}>MONAT GEPLANT</Text>
          <Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(monthlyPlanned)}</Text>
        </View>
      </View>

      {store.goals.length === 0 ? (
        <EmptyState icon="target" title="Noch kein Sparbereich" body="Lege ein Ziel oder eine monatliche Rücklage an. Danach bekommst du auf Start automatisch eine passende Spar-Empfehlung." />
      ) : (
        <>
          {recurringGoals.length ? <Section title="Monatliche Rücklagen" subtitle="Wiederkehrende Beträge, die du regelmäßig zurücklegst.">{recurringGoals.map(card)}</Section> : null}
          {activeTargets.length ? <Section title="Sparziele">{activeTargets.map(card)}</Section> : null}
          {completedTargets.length ? <Section title="Erreicht" subtitle="Deine abgeschlossenen Ziele bleiben sichtbar.">{completedTargets.map(card)}</Section> : null}
        </>
      )}
    </ScrollView>
  );
}
