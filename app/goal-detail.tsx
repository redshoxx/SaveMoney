import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { MiniTrend, ProgressRing } from '@/components/neon-ui';
import { Card, PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatEntityNumber } from '@/utils/entity-number';
import { formatMoney, progress } from '@/utils/money';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-AT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function GoalDetailScreen() {
  const store = useAppStore();
  const { width } = useWindowDimensions();
  const compact = width <= 390;
  const params = useLocalSearchParams<{ goalId?: string }>();
  const goal = store.goals.find((item) => item.id === params.goalId);

  if (!goal) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Sparziel nicht gefunden</Text>
        <PrimaryButton title="Zurück" onPress={() => router.back()} tone="soft" />
      </ScrollView>
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
  const trendValues = contributions.slice(0, 12).reverse().map((item) => Math.max(0, item.amount));
  const remaining = Math.max(0, target - Math.min(current, target));

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: compact ? 14 : 16, paddingTop: 6, paddingBottom: 34, gap: 12 }}>
      <Animated.View entering={FadeInDown.duration(180)} style={{ alignItems: 'center', gap: 4 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${goal.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={goal.icon} size={19} color={goal.color} /></View>
        <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>{goal.title}</Text>
        <Text selectable style={{ color: colors.primaryDark, fontSize: 10.5, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatEntityNumber(goal.displayNumber)}</Text>
      </Animated.View>

      <Card style={{ padding: compact ? 13 : 15, gap: 13 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text selectable numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.text, fontSize: compact ? 25 : 28, fontWeight: '900', letterSpacing: -0.7, fontVariant: ['tabular-nums'] }}>{formatMoney(current)}</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>von {formatMoney(target)}{goal.mode === 'recurring' ? ' diesen Monat' : ''}</Text>
            <Text selectable style={{ color: remaining > 0 ? colors.textMuted : colors.success, fontSize: 10, fontWeight: remaining > 0 ? '600' : '800' }}>{remaining > 0 ? `Noch ${formatMoney(remaining)}` : 'Ziel erreicht'}</Text>
          </View>
          <ProgressRing value={percentage} color={colors.primary} size={compact ? 66 : 72} />
        </View>
        {trendValues.length > 1 ? <MiniTrend values={trendValues} color={colors.primary} height={compact ? 52 : 64} /> : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><PrimaryButton title="Einzahlen" icon="plus" onPress={() => router.push({ pathname: '/save', params: { goalId: goal.id, mode: 'save' } })} /></View>
        <View style={{ flex: 1 }}><PrimaryButton title="Abziehen" icon="minus" tone="danger" disabled={goal.savedAmount <= 0} onPress={() => router.push({ pathname: '/save', params: { goalId: goal.id, mode: 'withdraw' } })} /></View>
      </View>

      <Pressable onPress={() => router.push({ pathname: '/reminders', params: { kind: 'goal', id: goal.id } })} style={({ pressed }) => ({ minHeight: 46, borderRadius: 13, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: pressed ? 0.72 : 1 })}>
        <Symbol name="bell" size={13} color={colors.primaryDark} /><Text selectable style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>Erinnerung einstellen</Text>
      </Pressable>

      <View style={{ gap: 8 }}>
        <Text selectable style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Verlauf</Text>
        <Card style={{ paddingHorizontal: 11, paddingVertical: 2, gap: 0 }}>
          {contributions.length ? contributions.slice(0, compact ? 8 : 12).map((item, index) => (
            <View key={item.id}>
              <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Symbol name={item.amount >= 0 ? 'arrow.down.left' : 'arrow.up.right'} size={12} color={item.amount >= 0 ? colors.success : colors.danger} /></View>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{item.amount >= 0 ? 'Einzahlung' : 'Entnahme'}</Text><Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 9 }}>{formatDate(item.createdAt)}{item.note ? ` · ${item.note}` : ''}</Text></View>
                <Text selectable style={{ color: item.amount >= 0 ? colors.success : colors.danger, fontSize: 11, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{item.amount >= 0 ? '+' : '−'} {formatMoney(Math.abs(item.amount))}</Text>
              </View>
              {index < Math.min((compact ? 7 : 11), contributions.length - 1) ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 39 }} /> : null}
            </View>
          )) : <View style={{ minHeight: 74, alignItems: 'center', justifyContent: 'center' }}><Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Noch keine Buchungen.</Text></View>}
        </Card>
      </View>
    </ScrollView>
  );
}
