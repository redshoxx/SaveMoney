import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState, ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

function savedThisMonth(contributions: ReturnType<typeof useAppStore>['contributions'], goalId: string) {
  const now = new Date();
  return contributions.reduce((sum, item) => {
    if (item.sourceType !== 'goal' || item.sourceId !== goalId) return sum;
    const date = new Date(item.createdAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() ? sum + item.amount : sum;
  }, 0);
}

export default function GoalsScreen() {
  const store = useAppStore();
  const goals = store.preferences.showCompletedGoals
    ? store.goals
    : store.goals.filter((goal) => goal.mode === 'recurring' || goal.savedAmount < goal.targetAmount);

  const remove = (id: string, title: string) => {
    Alert.alert('Sparbereich löschen?', `„${title}“ und die zugehörigen Buchungen werden entfernt.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteGoal(id) },
    ]);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 105, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 3 }}>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>{goals.length} {goals.length === 1 ? 'Sparbereich' : 'Sparbereiche'}</Text>
        <Pressable
          accessibilityLabel="Neuen Sparbereich anlegen"
          onPress={() => router.push('/add-goal')}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primarySoft,
            opacity: pressed ? 0.7 : 1,
          })}>
          <Symbol name="plus" size={16} color={colors.primaryDark} />
        </Pressable>
      </View>

      {goals.length === 0 ? (
        <EmptyState
          icon="target"
          title={store.goals.length > 0 ? 'Alle Ziele erreicht' : 'Noch nichts angelegt'}
          body={store.goals.length > 0 ? 'Erreichte Ziele lassen sich in den Einstellungen einblenden.' : 'Lege ein Ziel oder eine monatliche Rücklage an.'}
        />
      ) : (
        goals.map((goal) => {
          const recurring = goal.mode === 'recurring';
          const monthSaved = recurring ? savedThisMonth(store.contributions, goal.id) : 0;
          const recurringAmount = goal.recurringAmount ?? goal.targetAmount;
          const percentage = recurring ? progress(monthSaved, recurringAmount) : progress(goal.savedAmount, goal.targetAmount);

          return (
            <Pressable
              key={goal.id}
              onPress={() => router.push('/save')}
              style={({ pressed }) => ({
                borderRadius: 15,
                padding: 13,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 8,
                opacity: pressed ? 0.72 : 1,
              })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <View style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: `${goal.color}18` }}>
                  <Symbol name={goal.icon} size={15} color={goal.color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>{goal.title}</Text>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>
                    {recurring
                      ? `${formatMoney(recurringAmount)} / Monat · gesamt ${formatMoney(goal.savedAmount)}`
                      : `${formatMoney(goal.savedAmount)} / ${formatMoney(goal.targetAmount)}`}
                  </Text>
                </View>
                <Text style={{ color: goal.color, fontSize: 12, fontWeight: '900' }}>
                  {recurring ? `${Math.round(percentage * 100)} % Monat` : `${Math.round(percentage * 100)} %`}
                </Text>
                <Pressable onPress={() => remove(goal.id, goal.title)} hitSlop={10}>
                  <Symbol name="ellipsis" size={17} color={colors.textMuted} />
                </Pressable>
              </View>
              <ProgressBar value={percentage} color={goal.color} height={6} />
              {recurring ? (
                <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>
                  Diesen Monat {formatMoney(monthSaved)} von {formatMoney(recurringAmount)} · fällig ab {goal.recurringDay ?? 1}.
                </Text>
              ) : null}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
