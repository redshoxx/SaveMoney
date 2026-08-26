import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ProgressRing } from '@/components/neon-ui';
import { Card, ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatEntityNumber } from '@/utils/entity-number';
import { formatMoney, progress } from '@/utils/money';

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function monthLabel() {
  const value = new Intl.DateTimeFormat('de-AT', { month: 'long', year: 'numeric' }).format(new Date());
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function MonthDetailsScreen() {
  const store = useAppStore();
  const rows = store.goals.filter((goal) => goal.mode === 'recurring').map((goal) => {
    const planned = Math.max(0, goal.recurringAmount ?? goal.targetAmount);
    const saved = Math.max(0, store.contributions.reduce((sum, item) => {
      if (item.sourceType !== 'goal' || item.sourceId !== goal.id || !isCurrentMonth(item.createdAt)) return sum;
      return sum + item.amount;
    }, 0));
    return { goal, planned, saved: Math.min(planned, saved) };
  });

  const planned = rows.reduce((sum, row) => sum + row.planned, 0);
  const saved = rows.reduce((sum, row) => sum + row.saved, 0);
  const open = Math.max(0, planned - saved);
  const percentage = progress(saved, planned);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: 34, gap: 12 }}>
      <Animated.View entering={FadeInDown.duration(190)}>
        <Card style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 3 }}><Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>{monthLabel()}</Text><Text selectable numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.7, fontVariant: ['tabular-nums'] }}>{formatMoney(saved)}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 10 }}>von {formatMoney(planned)} geplant</Text></View>
            <ProgressRing value={percentage} color={colors.primary} size={68} />
          </View>
        </Card>
      </Animated.View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[['Geplant', planned, colors.text], ['Gespart', saved, colors.success], ['Offen', open, open > 0 ? colors.warning : colors.success]].map(([label, value, color]) => <View key={String(label)} style={{ flex: 1, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 10, gap: 3 }}><Text selectable style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '800' }}>{String(label).toUpperCase()}</Text><Text selectable numberOfLines={1} adjustsFontSizeToFit style={{ color: String(color), fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(Number(value))}</Text></View>)}
      </View>

      <View style={{ gap: 7 }}>
        <Text selectable style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Aufteilung</Text>
        {rows.length ? rows.map((row, index) => {
          const rowProgress = progress(row.saved, row.planned);
          return <Animated.View key={row.goal.id} entering={FadeInDown.duration(180).delay(index * 28)}><Pressable onPress={() => router.push({ pathname: '/save', params: { goalId: row.goal.id, mode: 'save' } })} style={({ pressed }) => ({ borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8, opacity: pressed ? 0.72 : 1 })}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: `${row.goal.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={row.goal.icon} size={15} color={row.goal.color} /></View><View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>{row.goal.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 8.5 }}>{formatEntityNumber(row.goal.displayNumber)}</Text></View><Text selectable style={{ color: colors.text, fontSize: 10, fontWeight: '800' }}>{formatMoney(row.saved)} / {formatMoney(row.planned)}</Text><Symbol name="chevron.right" size={9} color={colors.textMuted} /></View><ProgressBar value={rowProgress} color={row.goal.color} height={5} /></Pressable></Animated.View>;
        }) : <Card style={{ alignItems: 'center', paddingVertical: 22 }}><Symbol name="calendar" size={20} color={colors.textMuted} /><Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Noch kein Monatsplan</Text><Text selectable style={{ color: colors.textMuted, fontSize: 10, textAlign: 'center' }}>Lege eine monatliche Rücklage an. SparPilot teilt deinen Monat dann automatisch auf.</Text></Card>}
      </View>

      <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, lineHeight: 14, textAlign: 'center' }}>Überzahlungen bleiben deinem Ziel gutgeschrieben. Im Monatsplan wird höchstens der geplante Monatsbetrag angezeigt.</Text>
    </ScrollView>
  );
}
