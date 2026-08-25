import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState, ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { Goal } from '@/types/models';
import { formatMoney, progress } from '@/utils/money';

function savedThisMonth(contributions: ReturnType<typeof useAppStore>['contributions'], goalId: string) {
  const now = new Date();
  const value = contributions.reduce((sum, item) => {
    if (item.sourceType !== 'goal' || item.sourceId !== goalId) return sum;
    const date = new Date(item.createdAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() ? sum + item.amount : sum;
  }, 0);
  return Math.max(0, value);
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: 90, gap: 2 }}>
      <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '900' }}>{label}</Text>
      <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}

function AreaCard({ goal, monthSaved, onDelete }: { goal: Goal; monthSaved: number; onDelete: () => void }) {
  const recurring = goal.mode === 'recurring';
  const recurringAmount = goal.recurringAmount ?? goal.targetAmount;
  const percentage = recurring ? progress(monthSaved, recurringAmount) : progress(goal.savedAmount, goal.targetAmount);
  const completed = !recurring && goal.savedAmount >= goal.targetAmount;
  const change = (mode: 'save' | 'withdraw') => router.push({ pathname: '/save', params: { goalId: goal.id, mode } });

  return (
    <View style={{ borderRadius: 18, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: `${goal.color}18` }}>
          <Symbol name={goal.icon} size={18} color={goal.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>{goal.title}</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>
            {recurring ? `${formatMoney(recurringAmount)} monatlich · Tag ${goal.recurringDay ?? 1}` : completed ? 'Ziel erreicht' : `${formatMoney(goal.targetAmount - goal.savedAmount)} fehlen noch`}
          </Text>
        </View>
        <Text style={{ color: goal.color, fontSize: 12, fontWeight: '900' }}>{Math.round(percentage * 100)}%</Text>
        <Pressable onPress={onDelete} hitSlop={9}><Symbol name="ellipsis" size={17} color={colors.textMuted} /></Pressable>
      </View>

      <ProgressBar value={percentage} color={goal.color} height={7} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <SmallStat label={recurring ? 'DIESEN MONAT' : 'GESPART'} value={formatMoney(recurring ? monthSaved : goal.savedAmount)} />
        <SmallStat label={recurring ? 'MONATSZIEL' : 'ZIEL'} value={formatMoney(recurring ? recurringAmount : goal.targetAmount)} />
        {recurring ? <SmallStat label="GESAMT" value={formatMoney(goal.savedAmount)} /> : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={() => change('save')} style={({ pressed }) => ({ flex: 1, minHeight: 42, borderRadius: 12, backgroundColor: goal.color, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.75 : 1 })}>
          <Symbol name="plus" size={13} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>Sparen</Text>
        </Pressable>
        <Pressable disabled={goal.savedAmount <= 0} onPress={() => change('withdraw')} style={({ pressed }) => ({ flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: goal.savedAmount > 0 ? colors.danger : colors.border, backgroundColor: goal.savedAmount > 0 ? colors.dangerSoft : colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: goal.savedAmount <= 0 ? 0.45 : pressed ? 0.7 : 1 })}>
          <Symbol name="minus" size={13} color={goal.savedAmount > 0 ? colors.danger : colors.textMuted} />
          <Text style={{ color: goal.savedAmount > 0 ? colors.danger : colors.textMuted, fontSize: 12, fontWeight: '900' }}>Abziehen</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function GoalsScreen() {
  const store = useAppStore();
  const visibleGoals = store.preferences.showCompletedGoals
    ? store.goals
    : store.goals.filter((goal) => goal.mode === 'recurring' || goal.savedAmount < goal.targetAmount);
  const recurringGoals = visibleGoals.filter((goal) => goal.mode === 'recurring');
  const targetGoals = visibleGoals.filter((goal) => goal.mode === 'target');
  const totalInAreas = store.goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  const monthlyPlanned = store.goals.filter((goal) => goal.mode === 'recurring').reduce((sum, goal) => sum + (goal.recurringAmount ?? goal.targetAmount), 0);

  const remove = (goal: Goal) => {
    Alert.alert('Sparbereich löschen?', `„${goal.title}“ und die zugehörigen Buchungen werden entfernt.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteGoal(goal.id) },
    ]);
  };

  const renderGroup = (title: string, goals: Goal[]) => {
    if (!goals.length) return null;
    return (
      <View style={{ gap: 9 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>{title}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>{goals.length}</Text>
        </View>
        {goals.map((goal) => <AreaCard key={goal.id} goal={goal} monthSaved={goal.mode === 'recurring' ? savedThisMonth(store.contributions, goal.id) : 0} onDelete={() => remove(goal)} />)}
      </View>
    );
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 15, paddingBottom: 110, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.6 }}>Sparbereiche</Text><Text style={{ color: colors.textMuted, fontSize: 12.5 }}>Ziele und laufende Rücklagen an einem Ort.</Text></View>
        <Pressable onPress={() => router.push('/add-goal')} style={({ pressed }) => ({ width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1 })}><Symbol name="plus" size={18} color="#FFFFFF" /></Pressable>
      </View>

      <View style={{ borderRadius: 18, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        <SmallStat label="IN BEREICHEN" value={formatMoney(totalInAreas)} />
        <SmallStat label="MONAT GEPLANT" value={formatMoney(monthlyPlanned)} />
        <SmallStat label="BEREICHE" value={String(store.goals.length)} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={() => router.push({ pathname: '/add-goal', params: { mode: 'target' } })} style={({ pressed }) => ({ flex: 1, minHeight: 45, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.72 : 1 })}><Symbol name="target" size={14} color={colors.primaryDark} /><Text style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>Neues Ziel</Text></Pressable>
        <Pressable onPress={() => router.push({ pathname: '/add-goal', params: { mode: 'recurring' } })} style={({ pressed }) => ({ flex: 1, minHeight: 45, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.72 : 1 })}><Symbol name="arrow.triangle.2.circlepath" size={14} color={colors.primaryDark} /><Text style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>Rücklage</Text></Pressable>
      </View>

      {visibleGoals.length === 0 ? (
        <EmptyState icon="target" title={store.goals.length > 0 ? 'Alle Ziele erreicht' : 'Noch keine Sparbereiche'} body={store.goals.length > 0 ? 'Erreichte Ziele kannst du in den Einstellungen wieder einblenden.' : 'Lege ein Ziel oder eine monatliche Rücklage an.'} />
      ) : (
        <>
          {renderGroup('Monatliche Rücklagen', recurringGoals)}
          {renderGroup('Sparziele', targetGoals)}
        </>
      )}
    </ScrollView>
  );
}
