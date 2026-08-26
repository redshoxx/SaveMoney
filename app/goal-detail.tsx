import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { MiniTrend, NeonCard, ProgressRing } from '@/components/neon-ui';
import { PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-AT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function GoalDetailScreen() {
  const store = useAppStore();
  const params = useLocalSearchParams<{ goalId?: string }>();
  const goal = store.goals.find((item) => item.id === params.goalId);

  if (!goal) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Sparziel nicht gefunden</Text>
        <PrimaryButton title="Zurück" onPress={() => router.back()} tone="soft" />
      </View>
    );
  }

  const contributions = store.contributions
    .filter((item) => item.sourceType === 'goal' && item.sourceId === goal.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const now = new Date();
  const currentMonthSaved = contributions.reduce((sum, item) => {
    const date = new Date(item.createdAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() ? sum + item.amount : sum;
  }, 0);
  const target = goal.mode === 'recurring' ? (goal.recurringAmount ?? goal.targetAmount) : goal.targetAmount;
  const current = goal.mode === 'recurring' ? Math.max(0, currentMonthSaved) : goal.savedAmount;
  const percentage = progress(current, target);
  const trendValues = contributions.slice(0, 12).reverse().map((item) => item.amount);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 8, paddingBottom: 38, gap: 14 }}>
      <View style={{ alignItems: 'center', gap: 5, paddingTop: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Symbol name={goal.icon} size={15} color={goal.color} />
          <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{goal.title}</Text>
        </View>
      </View>

      <NeonCard style={{ padding: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, fontVariant: ['tabular-nums'] }}>{formatMoney(current)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>von {formatMoney(target)}{goal.mode === 'recurring' ? ' diesen Monat' : ''}</Text>
          </View>
          <ProgressRing value={percentage} color={colors.primary} size={72} />
        </View>

        <MiniTrend values={trendValues} color={colors.primary} height={72} />
      </NeonCard>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><PrimaryButton title="Einzahlen" icon="plus" onPress={() => router.push({ pathname: '/save', params: { goalId: goal.id, mode: 'save' } })} /></View>
        <View style={{ flex: 1 }}><PrimaryButton title="Abziehen" icon="minus" tone="danger" disabled={goal.savedAmount <= 0} onPress={() => router.push({ pathname: '/save', params: { goalId: goal.id, mode: 'withdraw' } })} /></View>
      </View>

      <View style={{ gap: 9 }}>
        <Text selectable style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Verlauf</Text>
        <NeonCard style={{ paddingHorizontal: 12, paddingVertical: 2, gap: 0 }}>
          {contributions.length ? contributions.slice(0, 12).map((item, index) => (
            <View key={item.id}>
              <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Symbol name={item.amount >= 0 ? 'arrow.down.left' : 'arrow.up.right'} size={12} color={item.amount >= 0 ? colors.cyan : colors.danger} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '700' }}>{item.amount >= 0 ? 'Einzahlen' : 'Abziehen'}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 9.5 }}>{formatDate(item.createdAt)}{item.note ? ` · ${item.note}` : ''}</Text>
                </View>
                <Text selectable style={{ color: item.amount >= 0 ? colors.cyan : colors.danger, fontSize: 11.5, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{item.amount >= 0 ? '+' : '−'} {formatMoney(Math.abs(item.amount))}</Text>
              </View>
              {index < Math.min(11, contributions.length - 1) ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 40 }} /> : null}
            </View>
          )) : (
            <View style={{ minHeight: 76, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>Noch keine Buchungen für dieses Ziel.</Text>
            </View>
          )}
        </NeonCard>
      </View>

      <Pressable onPress={() => router.push({ pathname: '/save', params: { goalId: goal.id, mode: 'save' } })} style={({ pressed }) => ({ alignSelf: 'center', opacity: pressed ? 0.6 : 1, paddingVertical: 2 })}>
        <Text style={{ color: colors.textMuted, fontSize: 10 }}>Fortschritt wird nach jeder Buchung automatisch aktualisiert.</Text>
      </Pressable>
    </ScrollView>
  );
}
