import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BarChart, ComparisonBadge, IconBubble, StatTile } from '@/components/savings-ui';
import { Card, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { percentChange } from '@/utils/insights';
import { formatMoney } from '@/utils/money';

export default function StatisticsScreen() {
  const store = useAppStore();
  const weekChange = percentChange(store.periodMetrics.week, store.periodMetrics.previousWeek);
  const monthChange = percentChange(store.periodMetrics.month, store.periodMetrics.previousMonth);
  const topContribution = [...store.contributions].sort((a, b) => b.amount - a.amount)[0];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 70, gap: 20 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <StatTile icon="calendar" label="DIESE WOCHE" value={formatMoney(store.periodMetrics.week)} caption={`${weekChange >= 0 ? '+' : ''}${Math.round(weekChange)} % zur Vorwoche`} />
        <StatTile icon="calendar.circle.fill" label="DIESER MONAT" value={formatMoney(store.periodMetrics.month)} caption={`${monthChange >= 0 ? '+' : ''}${Math.round(monthChange)} % zum Vormonat`} />
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeading title="Wochenrückblick" />
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ gap: 4 }}><Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>GESPART</Text><Text selectable style={{ color: colors.text, fontSize: 30, fontWeight: '900' }}>{formatMoney(store.periodMetrics.week)}</Text></View>
            <ComparisonBadge value={weekChange} />
          </View>
          <BarChart data={store.weeklyData} height={120} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 15, padding: 12, gap: 3 }}><Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>SPARAKTIONEN</Text><Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>{store.contributions.filter((item) => new Date(item.createdAt).getTime() >= Date.now() - 7 * 86_400_000).length}</Text></View>
            <View style={{ flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 15, padding: 12, gap: 3 }}><Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>NO-SPEND</Text><Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>{store.noSpendDays.filter((item) => new Date(`${item.date}T00:00:00`).getTime() >= Date.now() - 7 * 86_400_000).length}</Text></View>
          </View>
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeading title="Letzte 6 Monate" />
        <Card>
          <BarChart data={store.monthlyData} height={145} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><Symbol name={monthChange >= 0 ? 'arrow.up.right' : 'arrow.down.right'} size={15} color={monthChange >= 0 ? colors.success : colors.danger} /><Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>Aktueller Monat: {monthChange >= 0 ? '+' : ''}{Math.round(monthChange)} % gegenüber dem Vormonat.</Text></View>
        </Card>
      </View>

      {store.primaryGoal ? (
        <View style={{ gap: 10 }}>
          <SectionHeading title="Ziel-Prognose" />
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}><IconBubble icon="chart.line.uptrend.xyaxis" /><View style={{ flex: 1, gap: 3 }}><Text selectable style={{ color: colors.text, fontWeight: '900', fontSize: 17 }}>{store.primaryGoal.title}</Text>{store.forecast ? <Text selectable style={{ color: colors.textMuted, lineHeight: 19 }}>Bei deinem aktuellen Tempo ungefähr am {store.forecast.date.toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })}. Ø {formatMoney(store.forecast.dailyAverage)} pro Tag.</Text> : <Text selectable style={{ color: colors.textMuted, lineHeight: 19 }}>Noch nicht genug Verlauf für eine zuverlässige Prognose.</Text>}</View></View>
          </Card>
        </View>
      ) : null}

      {topContribution ? (
        <Card>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>GRÖSSTE EINZELERSPARNIS</Text>
          <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>{formatMoney(topContribution.amount)}</Text>
          <Text selectable style={{ color: colors.textMuted }}>{topContribution.note ?? 'Sparbuchung'}</Text>
        </Card>
      ) : null}

      <Pressable onPress={() => router.push('/what-if')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, backgroundColor: colors.primarySoft, padding: 15, opacity: pressed ? 0.72 : 1 })}>
        <IconBubble icon="function" size={40} />
        <View style={{ flex: 1, gap: 2 }}><Text style={{ color: colors.primaryDark, fontWeight: '900' }}>Was-wäre-wenn-Rechner</Text><Text selectable style={{ color: colors.textMuted, fontSize: 12.5 }}>Sieh, was kleine tägliche Beträge im Jahr ausmachen.</Text></View>
        <Symbol name="chevron.right" size={14} color={colors.primaryDark} />
      </Pressable>
    </ScrollView>
  );
}
