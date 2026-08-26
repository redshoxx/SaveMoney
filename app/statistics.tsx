import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BarChart, ComparisonBadge, IconBubble, StatTile } from '@/components/savings-ui';
import { Card, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatEntityNumber } from '@/utils/entity-number';
import { percentChange } from '@/utils/insights';
import { formatMoney } from '@/utils/money';

export default function StatisticsScreen() {
  const store = useAppStore();
  const weekChange = percentChange(store.periodMetrics.week, store.periodMetrics.previousWeek);
  const monthChange = percentChange(store.periodMetrics.month, store.periodMetrics.previousMonth);
  const topContribution = [...store.contributions].filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount)[0];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 36, gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}><StatTile icon="calendar" label="DIESE WOCHE" value={formatMoney(store.periodMetrics.week)} caption={`${weekChange >= 0 ? '+' : ''}${Math.round(weekChange)} % zur Vorwoche`} /><StatTile icon="calendar.circle.fill" label="DIESER MONAT" value={formatMoney(store.periodMetrics.month)} caption={`${monthChange >= 0 ? '+' : ''}${Math.round(monthChange)} % zum Vormonat`} /></View>

      <View style={{ gap: 8 }}><SectionHeading title="Wochenrückblick" /><Card style={{ padding: 13 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}><View style={{ gap: 3 }}><Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>GESPART</Text><Text selectable style={{ color: colors.text, fontSize: 25, fontWeight: '900' }}>{formatMoney(store.periodMetrics.week)}</Text></View><ComparisonBadge value={weekChange} /></View><BarChart data={store.weeklyData} height={105} /><View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 13, padding: 10, gap: 2 }}><Text selectable style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '800' }}>SPARAKTIONEN</Text><Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{store.contributions.filter((item) => item.amount > 0 && new Date(item.createdAt).getTime() >= Date.now() - 7 * 86_400_000).length}</Text></View><View style={{ flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 13, padding: 10, gap: 2 }}><Text selectable style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '800' }}>NO-SPEND</Text><Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{store.noSpendDays.filter((item) => new Date(`${item.date}T00:00:00`).getTime() >= Date.now() - 7 * 86_400_000).length}</Text></View></View></Card></View>

      <View style={{ gap: 8 }}><SectionHeading title="Letzte 6 Monate" /><Card style={{ padding: 13 }}><BarChart data={store.monthlyData} height={120} /><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Symbol name={monthChange >= 0 ? 'arrow.up.right' : 'arrow.down.right'} size={14} color={monthChange >= 0 ? colors.success : colors.danger} /><Text selectable style={{ flex: 1, color: colors.textMuted, fontSize: 10.5 }}>Aktueller Monat: {monthChange >= 0 ? '+' : ''}{Math.round(monthChange)} % zum Vormonat.</Text></View></Card></View>

      {store.primaryGoal ? <View style={{ gap: 8 }}><SectionHeading title="Ziel-Prognose" /><Card style={{ padding: 13 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><IconBubble icon="chart.line.uptrend.xyaxis" size={40} /><View style={{ flex: 1, gap: 2 }}><Text selectable numberOfLines={1} style={{ color: colors.text, fontWeight: '900', fontSize: 12.5 }}>{store.primaryGoal.title}</Text><Text selectable style={{ color: colors.primaryDark, fontSize: 8.5, fontWeight: '900' }}>{formatEntityNumber(store.primaryGoal.displayNumber)}</Text>{store.forecast ? <Text selectable style={{ color: colors.textMuted, fontSize: 10, lineHeight: 15 }}>Bei deinem aktuellen Tempo ungefähr am {store.forecast.date.toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })}. Ø {formatMoney(store.forecast.dailyAverage)} pro Tag.</Text> : <Text selectable style={{ color: colors.textMuted, fontSize: 10, lineHeight: 15 }}>Noch nicht genug Verlauf für eine zuverlässige Prognose.</Text>}</View></View></Card></View> : null}

      {topContribution ? <Card style={{ padding: 13 }}><Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>GRÖSSTE EINZELERSPARNIS</Text><Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>{formatMoney(topContribution.amount)}</Text><Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 10 }}>{topContribution.note ?? 'Sparbuchung'}</Text></Card> : null}

      <Pressable onPress={() => router.push('/what-if')} style={({ pressed }) => ({ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: colors.primarySoft, paddingHorizontal: 12, opacity: pressed ? 0.72 : 1 })}><IconBubble icon="function" size={38} /><View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 11.5 }}>Was-wäre-wenn-Rechner</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Was kleine tägliche Beträge im Jahr ausmachen.</Text></View><Symbol name="chevron.right" size={11} color={colors.primaryDark} /></Pressable>
    </ScrollView>
  );
}
