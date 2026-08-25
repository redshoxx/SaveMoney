import { ScrollView, Text, View } from 'react-native';

import { IconBubble } from '@/components/savings-ui';
import { Card, EmptyState, SectionHeading } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

export default function HistoryScreen() {
  const store = useAppStore();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 70, gap: 16 }}>
      <View style={{ gap: 4 }}><Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>Alle lokalen Sparbuchungen und Entnahmen in chronologischer Reihenfolge.</Text></View>
      <SectionHeading title={`${store.contributions.length} Buchungen`} />
      {store.contributions.length === 0 ? (
        <EmptyState icon="clock.arrow.circlepath" title="Noch kein Verlauf" body="Sobald du sparst oder Geld entnimmst, erscheinen deine Buchungen hier." />
      ) : (
        <View style={{ gap: 10 }}>
          {store.contributions.map((item) => {
            const withdrawal = item.amount < 0;
            const goal = item.sourceType === 'goal' ? store.goals.find((entry) => entry.id === item.sourceId) : null;
            const challenge = item.sourceType === 'challenge' ? store.challenges.find((entry) => entry.id === item.sourceId) : null;
            const baseColor = goal?.color ?? challenge?.color ?? colors.primary;
            const color = withdrawal ? colors.danger : baseColor;
            const icon = withdrawal ? 'minus.circle.fill' : (goal?.icon ?? challenge?.icon ?? 'eurosign.circle.fill');
            return (
              <Card key={item.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconBubble icon={icon} color={color} background={`${color}18`} />
                <View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{item.note ?? goal?.title ?? challenge?.title ?? (withdrawal ? 'Entnahme' : 'Sparbuchung')}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>{new Date(item.createdAt).toLocaleString('de-AT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text></View>
                <Text selectable style={{ color, fontWeight: '900', fontSize: 17, fontVariant: ['tabular-nums'] }}>{withdrawal ? '-' : '+'}{formatMoney(Math.abs(item.amount))}</Text>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
