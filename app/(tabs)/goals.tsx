import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState, ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

export default function GoalsScreen() {
  const store = useAppStore();
  const goals = store.preferences.showCompletedGoals
    ? store.goals
    : store.goals.filter((goal) => goal.savedAmount < goal.targetAmount);

  const remove = (id: string, title: string) => {
    Alert.alert('Sparziel löschen?', `„${title}“ und die zugehörigen Buchungen werden entfernt.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteGoal(id) },
    ]);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 105, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 3 }}>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>{goals.length} {goals.length === 1 ? 'Ziel' : 'Ziele'}</Text>
        <Pressable
          accessibilityLabel="Neues Sparziel"
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
          title={store.goals.length > 0 ? 'Alle Ziele erreicht' : 'Noch kein Sparziel'}
          body={store.goals.length > 0 ? 'Erreichte Ziele lassen sich in den Einstellungen einblenden.' : 'Tippe oben auf + und lege dein erstes Ziel an.'}
        />
      ) : (
        goals.map((goal) => {
          const percentage = progress(goal.savedAmount, goal.targetAmount);
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
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>{goal.title}</Text>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>
                    {formatMoney(goal.savedAmount)} / {formatMoney(goal.targetAmount)}
                  </Text>
                </View>
                <Text style={{ color: goal.color, fontSize: 13, fontWeight: '900' }}>{Math.round(percentage * 100)} %</Text>
                <Pressable onPress={() => remove(goal.id, goal.title)} hitSlop={10}>
                  <Symbol name="ellipsis" size={17} color={colors.textMuted} />
                </Pressable>
              </View>
              <ProgressBar value={percentage} color={goal.color} height={6} />
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
