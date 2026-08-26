import { ScrollView, Text, View } from 'react-native';

import { IconBubble } from '@/components/savings-ui';
import { Card, EmptyState, SectionHeading } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatEntityNumber } from '@/utils/entity-number';
import { formatMoney } from '@/utils/money';

export default function HistoryScreen() {
  const store = useAppStore();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 36, gap: 14 }}>
      <Text selectable style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>Alle lokalen Sparbuchungen und Entnahmen in chronologischer Reihenfolge.</Text>
      <SectionHeading title={`${store.contributions.length} Buchungen`} />
      {store.contributions.length === 0 ? <EmptyState icon="clock.arrow.circlepath" title="Noch kein Verlauf" body="Sobald du sparst oder Geld entnimmst, erscheinen deine Buchungen hier." /> : <View style={{ gap: 8 }}>{store.contributions.map((item) => {
        const withdrawal = item.amount < 0;
        const goal = item.sourceType === 'goal' ? store.goals.find((entry) => entry.id === item.sourceId) : null;
        const challenge = item.sourceType === 'challenge' ? store.challenges.find((entry) => entry.id === item.sourceId) : null;
        const source = goal ?? challenge;
        const baseColor = source?.color ?? colors.primary;
        const color = withdrawal ? colors.danger : baseColor;
        const icon = withdrawal ? 'minus.circle.fill' : (source?.icon ?? 'eurosign.circle.fill');
        return <Card key={item.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 11, gap: 9 }}><IconBubble icon={icon} color={color} background={`${color}18`} size={36} /><View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text selectable numberOfLines={1} style={{ color: colors.text, fontWeight: '800', fontSize: 11.5 }}>{item.note ?? source?.title ?? (withdrawal ? 'Entnahme' : 'Sparbuchung')}</Text><Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 8.5 }}>{source ? `${formatEntityNumber(source.displayNumber)} · ` : ''}{new Date(item.createdAt).toLocaleString('de-AT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text></View><Text selectable style={{ color, fontWeight: '900', fontSize: 11.5, fontVariant: ['tabular-nums'] }}>{withdrawal ? '−' : '+'}{formatMoney(Math.abs(item.amount))}</Text></Card>;
      })}</View>}
    </ScrollView>
  );
}
