import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { NeonCard, NeonProgress, ProgressRing } from '@/components/neon-ui';
import { Symbol } from '@/components/ui';
import { accents, colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
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
  const rows = store.goals
    .filter((goal) => goal.mode === 'recurring')
    .map((goal) => {
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
  const summaryRows: Array<[string, number, string]> = [
    ['Geplant', planned, colors.text],
    ['Gespart', saved, colors.text],
    ['Noch offen', open, open > 0 ? colors.warning : colors.success],
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 8, paddingBottom: 38, gap: 14 }}>
      <NeonCard style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{monthLabel()}</Text>
            <Text selectable style={{ color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.8, fontVariant: ['tabular-nums'] }}>{formatMoney(saved)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>von {formatMoney(planned)} geplant</Text>
          </View>
          <ProgressRing value={percentage} color={colors.primary} size={70} />
        </View>
      </NeonCard>

      <NeonCard style={{ paddingHorizontal: 13, paddingVertical: 5, gap: 0 }}>
        {summaryRows.map(([label, value, color], index) => (
          <View key={label}>
            <View style={{ minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{label}</Text>
              <Text selectable style={{ color, fontSize: 11.5, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{formatMoney(value)}</Text>
            </View>
            {index < 2 ? <View style={{ height: 1, backgroundColor: colors.border }} /> : null}
          </View>
        ))}
      </NeonCard>

      <View style={{ gap: 9 }}>
        <Text selectable style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Aufteilung</Text>
        {rows.length ? rows.map((row, index) => {
          const accent = accents[index % accents.length] ?? colors.primary;
          const rowProgress = progress(row.saved, row.planned);
          return (
            <Pressable key={row.goal.id} onPress={() => router.push({ pathname: '/save', params: { goalId: row.goal.id, mode: 'save' } })} style={({ pressed }) => ({ opacity: pressed ? 0.68 : 1 })}>
              <NeonCard style={{ padding: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}><Symbol name={row.goal.icon} size={14} color="#FFFFFF" /></View>
                  <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 11.5, fontWeight: '700' }}>{row.goal.title}</Text>
                  <Text selectable style={{ color: colors.text, fontSize: 10.5, fontWeight: '800' }}>{formatMoney(row.saved)} / {formatMoney(row.planned)}</Text>
                </View>
                <NeonProgress value={rowProgress} color={accent} height={4} />
              </NeonCard>
            </Pressable>
          );
        }) : (
          <NeonCard style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center' }}>Lege monatliche Rücklagen an, damit SparFlow hier deinen Monat aufteilt.</Text>
          </NeonCard>
        )}
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 10, lineHeight: 15, textAlign: 'center' }}>Überzahlungen bleiben deinem Sparziel gutgeschrieben. Die Monatsansicht begrenzt die Darstellung auf den geplanten Monatsbetrag.</Text>
    </ScrollView>
  );
}
