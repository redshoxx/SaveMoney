import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Card, EmptyState, ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

const QUICK = [5, 10, 20];

function Shortcut({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 74,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Symbol name={icon} size={20} color={colors.primaryDark} />
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 12 }}>{title}</Text>
    </Pressable>
  );
}

export default function GoalsScreen() {
  const store = useAppStore();
  const activeChallenges = store.challenges.filter((item) => !item.completedAt);
  const goals = store.preferences.showCompletedGoals
    ? store.goals
    : store.goals.filter((goal) => goal.savedAmount < goal.targetAmount);

  const save = async (goalId: string, amount: number) => {
    try {
      await store.saveToGoal(goalId, amount, 'Schnell sparen');
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Sparen fehlgeschlagen.');
    }
  };

  const remove = (id: string, title: string) => {
    Alert.alert('Sparziel löschen?', `„${title}“ und die zugehörigen Buchungen werden entfernt.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteGoal(id) },
    ]);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 115, gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 9 }}>
        <Shortcut icon="plus" title="Neues Ziel" onPress={() => router.push('/add-goal')} />
        <Shortcut icon="flag.fill" title="Challenges" onPress={() => router.push('/(tabs)/challenges')} />
        <Shortcut icon="clock.badge.checkmark.fill" title="Sparregeln" onPress={() => router.push('/rules')} />
        <Shortcut icon="sparkles" title="Sparideen" onPress={() => router.push('/play')} />
      </View>

      {activeChallenges.length > 0 ? (
        <Pressable onPress={() => router.push('/(tabs)/challenges')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#F1ECFB', alignItems: 'center', justifyContent: 'center' }}>
              <Symbol name="flag.fill" size={17} color="#7652B7" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.text, fontWeight: '900' }}>{activeChallenges.length} aktive {activeChallenges.length === 1 ? 'Challenge' : 'Challenges'}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Fortschritt mit einem Tap aktualisieren</Text>
            </View>
            <Symbol name="chevron.right" size={14} color={colors.textMuted} />
          </Card>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>Sparziele</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{goals.length}</Text>
      </View>

      {goals.length === 0 ? (
        <EmptyState
          icon="target"
          title={store.goals.length > 0 ? 'Alle Ziele erreicht' : 'Noch kein Sparziel'}
          body={store.goals.length > 0 ? 'Abgeschlossene Ziele kannst du in den Einstellungen wieder einblenden.' : 'Lege ein Ziel an und spare danach direkt mit einem Tap.'}
        />
      ) : (
        <View style={{ gap: 11 }}>
          {goals.map((goal) => {
            const percentage = progress(goal.savedAmount, goal.targetAmount);
            const complete = percentage >= 1;

            return (
              <Card key={goal.id} style={{ gap: 11 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>{goal.title}</Text>
                    <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>
                      {complete ? 'Ziel erreicht' : `Noch ${formatMoney(Math.max(0, goal.targetAmount - goal.savedAmount))}`}
                    </Text>
                  </View>
                  <Text selectable style={{ color: goal.color, fontSize: 15, fontWeight: '900' }}>{Math.round(percentage * 100)} %</Text>
                  <Pressable onPress={() => remove(goal.id, goal.title)} hitSlop={10}>
                    <Symbol name="ellipsis" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>

                <ProgressBar value={percentage} color={goal.color} height={9} />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text selectable style={{ color: colors.text, fontWeight: '900' }}>{formatMoney(goal.savedAmount)}</Text>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>von {formatMoney(goal.targetAmount)}</Text>
                </View>

                {!complete ? (
                  <View style={{ flexDirection: 'row', gap: 7 }}>
                    {QUICK.map((amount) => (
                      <Pressable
                        key={amount}
                        onPress={() => void save(goal.id, amount)}
                        style={({ pressed }) => ({
                          flex: 1,
                          minHeight: 40,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.surfaceMuted,
                          opacity: pressed ? 0.65 : 1,
                        })}>
                        <Text style={{ color: colors.primaryDark, fontWeight: '900' }}>+{amount} €</Text>
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => router.push('/save')}
                      style={({ pressed }) => ({
                        width: 42,
                        minHeight: 40,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.primarySoft,
                        opacity: pressed ? 0.65 : 1,
                      })}>
                      <Symbol name="plus" size={15} color={colors.primaryDark} />
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
