import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Card, ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

const QUICK_AMOUNTS = [5, 10, 20, 50];

export default function HomeScreen() {
  const store = useAppStore();
  const goal = store.primaryGoal;
  const dueRule = store.dueRules[0];

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Aktion fehlgeschlagen.');
    }
  };

  const quickSave = (amount: number) => {
    if (!goal) {
      router.push('/add-goal');
      return;
    }

    const save = () => void run(() => store.saveToGoal(goal.id, amount, 'Schnell sparen'));
    if (!store.preferences.confirmQuickSave) {
      save();
      return;
    }

    Alert.alert(
      `${formatMoney(amount)} sparen?`,
      `Der Betrag wird direkt zu „${goal.title}“ hinzugefügt.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Sparen', onPress: save },
      ],
    );
  };

  if (store.loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const goalProgress = goal ? progress(goal.savedAmount, goal.targetAmount) : 0;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 14 }}>
      {store.error ? (
        <View style={{ backgroundColor: '#FDECEC', borderRadius: 14, padding: 12 }}>
          <Text selectable style={{ color: colors.danger, fontWeight: '700' }}>{store.error}</Text>
        </View>
      ) : null}

      <View style={{ paddingTop: 6, gap: 4 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '800' }}>GESAMT GESPART</Text>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 44, fontWeight: '900', letterSpacing: -1.6, fontVariant: ['tabular-nums'] }}>
          {formatMoney(store.totalSaved)}
        </Text>
        {store.preferences.showMonthly ? (
          <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
            {formatMoney(store.periodMetrics.month)} diesen Monat
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => router.push('/save')}
        style={({ pressed }) => ({
          minHeight: 56,
          borderRadius: 18,
          backgroundColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.8 : 1,
        })}>
        <Symbol name="plus" size={18} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>Geld sparen</Text>
      </Pressable>

      {goal ? (
        <Card style={{ gap: 12 }}>
          <Pressable onPress={() => router.push('/(tabs)/goals')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{goal.title}</Text>
                <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
                  {formatMoney(goal.savedAmount)} von {formatMoney(goal.targetAmount)}
                </Text>
              </View>
              <Text selectable style={{ color: goal.color, fontWeight: '900', fontSize: 16 }}>
                {Math.round(goalProgress * 100)} %
              </Text>
            </View>
            <View style={{ marginTop: 10 }}>
              <ProgressBar value={goalProgress} color={goal.color} height={9} />
            </View>
          </Pressable>

          {store.preferences.showQuickAmounts ? (
            <View style={{ flexDirection: 'row', gap: 7 }}>
              {QUICK_AMOUNTS.map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => quickSave(amount)}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 42,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.surfaceMuted,
                    opacity: pressed ? 0.65 : 1,
                  })}>
                  <Text style={{ color: colors.primaryDark, fontWeight: '900' }}>+{amount}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Card>
      ) : (
        <Pressable onPress={() => router.push('/add-goal')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
              <Symbol name="target" size={18} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.text, fontWeight: '900' }}>Erstes Sparziel anlegen</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Danach kannst du mit einem Tap sparen.</Text>
            </View>
            <Symbol name="chevron.right" size={14} color={colors.textMuted} />
          </Card>
        </Pressable>
      )}

      {dueRule ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.text, fontWeight: '900' }}>{dueRule.title}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{formatMoney(dueRule.amount)} heute fällig</Text>
          </View>
          <Pressable
            onPress={() => void run(() => store.applyRule(dueRule.id))}
            style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primarySoft, opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ color: colors.primaryDark, fontWeight: '900' }}>Sparen</Text>
          </Pressable>
        </Card>
      ) : null}

      {store.preferences.showGamification ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 2 }}>
          <Text selectable style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>🔥 {store.streak} Tage</Text>
          <Text style={{ color: colors.border }}>•</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>Level {store.level}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
