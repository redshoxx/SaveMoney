import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

export default function HomeScreen() {
  const store = useAppStore();
  const goal = store.primaryGoal;
  const dueRule = store.dueRules[0];

  const applyDueRule = async () => {
    if (!dueRule) return;
    try {
      await store.applyRule(dueRule.id);
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Aktion fehlgeschlagen.');
    }
  };

  if (store.loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const goalProgress = goal ? progress(goal.savedAmount, goal.targetAmount) : 0;
  const meta: string[] = [];
  if (store.preferences.showMonthly) meta.push(`${formatMoney(store.periodMetrics.month)} im Monat`);
  if (store.preferences.showGamification) meta.push(`🔥 ${store.streak} · Level ${store.level}`);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 18, paddingBottom: 105, gap: 14 }}>
      {store.error ? (
        <Pressable onPress={() => void store.reload()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>Daten konnten nicht geladen werden · erneut versuchen</Text>
        </Pressable>
      ) : null}

      <View style={{ paddingTop: 12, paddingBottom: 8, gap: 3 }}>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.7 }}>GESPART</Text>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 48, fontWeight: '900', letterSpacing: -2, fontVariant: ['tabular-nums'] }}>
          {formatMoney(store.totalSaved)}
        </Text>
        {meta.length > 0 ? (
          <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>{meta.join('  •  ')}</Text>
        ) : null}
      </View>

      {goal ? (
        <Pressable
          onPress={() => router.push('/(tabs)/goals')}
          style={({ pressed }) => ({
            borderRadius: 16,
            padding: 14,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 9,
            opacity: pressed ? 0.72 : 1,
          })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>{goal.title}</Text>
              <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>
                {formatMoney(goal.savedAmount)} / {formatMoney(goal.targetAmount)}
              </Text>
            </View>
            <Text selectable style={{ color: goal.color, fontSize: 14, fontWeight: '900' }}>{Math.round(goalProgress * 100)} %</Text>
            <Symbol name="chevron.right" size={13} color={colors.textMuted} />
          </View>
          <ProgressBar value={goalProgress} color={goal.color} height={6} />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push('/add-goal')}
          style={({ pressed }) => ({
            minHeight: 52,
            borderRadius: 15,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.72 : 1,
          })}>
          <Symbol name="target" size={17} color={colors.primaryDark} />
          <Text style={{ flex: 1, color: colors.text, fontWeight: '900' }}>Sparziel anlegen</Text>
          <Symbol name="chevron.right" size={13} color={colors.textMuted} />
        </Pressable>
      )}

      {dueRule ? (
        <Pressable
          onPress={() => void applyDueRule()}
          style={({ pressed }) => ({
            minHeight: 48,
            borderRadius: 14,
            paddingHorizontal: 13,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            backgroundColor: colors.primarySoft,
            opacity: pressed ? 0.7 : 1,
          })}>
          <Symbol name="clock.badge.checkmark.fill" size={16} color={colors.primaryDark} />
          <Text numberOfLines={1} style={{ flex: 1, color: colors.primaryDark, fontSize: 12, fontWeight: '800' }}>{dueRule.title}</Text>
          <Text style={{ color: colors.primaryDark, fontSize: 12, fontWeight: '900' }}>{formatMoney(dueRule.amount)}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
