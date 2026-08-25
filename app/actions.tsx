import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

const QUICK = [5, 10, 20, 50];

function Tool({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '48.5%',
        minHeight: 66,
        borderRadius: 15,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.68 : 1,
      })}>
      <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
        <Symbol name={icon} size={15} color={colors.primaryDark} />
      </View>
      <Text numberOfLines={2} style={{ flex: 1, color: colors.text, fontSize: 13, fontWeight: '900' }}>{title}</Text>
    </Pressable>
  );
}

export default function ActionsScreen() {
  const store = useAppStore();
  const goal = store.primaryGoal;

  const saveNow = async (amount: number) => {
    if (!goal) {
      router.replace('/add-goal');
      return;
    }
    try {
      await store.saveToGoal(goal.id, amount, 'Schnell sparen');
      router.back();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Sparen fehlgeschlagen.');
    }
  };

  const quickSave = (amount: number) => {
    if (!goal || !store.preferences.confirmQuickSave) {
      void saveNow(amount);
      return;
    }
    Alert.alert(`${formatMoney(amount)} sparen?`, `Direkt zu „${goal.title}“ hinzufügen.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Sparen', onPress: () => void saveNow(amount) },
    ]);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 36, gap: 16 }}>
      {goal ? (
        <View style={{ gap: 8 }}>
          <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>{goal.title}</Text>
          {store.preferences.showQuickAmounts ? (
            <View style={{ flexDirection: 'row', gap: 7 }}>
              {QUICK.map((amount) => (
                <Pressable key={amount} onPress={() => quickSave(amount)} style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 })}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>+{amount}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
        <Tool icon="banknote.fill" title="Betrag sparen" onPress={() => router.replace('/save')} />
        <Tool icon="minus.circle.fill" title="Betrag abziehen" onPress={() => router.replace({ pathname: '/save', params: { mode: 'withdraw' } })} />
        <Tool icon="target" title="Zielbetrag anlegen" onPress={() => router.replace({ pathname: '/add-goal', params: { mode: 'target' } })} />
        <Tool icon="arrow.triangle.2.circlepath" title="Monatliche Rücklage" onPress={() => router.replace({ pathname: '/add-goal', params: { mode: 'recurring' } })} />
        <Tool icon="tray.full.fill" title="Sparbereiche" onPress={() => router.replace('/(tabs)/goals')} />
        <Tool icon="flag.fill" title="Challenges" onPress={() => router.replace('/(tabs)/challenges')} />
        <Tool icon="clock.badge.checkmark.fill" title="Sparregeln" onPress={() => router.replace('/rules')} />
        <Tool icon="sparkles" title="Sparideen" onPress={() => router.replace('/play')} />
        <Tool icon="clock.arrow.circlepath" title="Verlauf" onPress={() => router.replace('/history')} />
        <Tool icon="chart.bar.fill" title="Statistiken" onPress={() => router.replace('/statistics')} />
        <Tool icon="trophy.fill" title="Erfolge" onPress={() => router.replace('/achievements')} />
        <Tool icon="function" title="Was wäre wenn?" onPress={() => router.replace('/what-if')} />
      </View>
    </ScrollView>
  );
}
