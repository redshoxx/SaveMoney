import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Card, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { formatMoney } from '@/utils/money';

export default function WhatIfScreen() {
  const [daily, setDaily] = useState('5');
  const amount = useMemo(() => Number(daily.replace(',', '.')), [daily]);
  const safe = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const examples = [3, 5, 10];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 70, gap: 20 }}>
      <Card style={{ backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }}>
        <Text style={{ color: '#C9E1D1', fontSize: 12, fontWeight: '800' }}>WENN DU JEDEN TAG SPARST</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: '#FFFFFF12', paddingHorizontal: 14 }}><Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '900' }}>€</Text><TextInput value={daily} onChangeText={setDaily} keyboardType="decimal-pad" style={{ flex: 1, minHeight: 58, paddingHorizontal: 10, color: '#FFFFFF', fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] }} /></View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, gap: 3 }}><Text style={{ color: '#C9E1D1', fontSize: 11, fontWeight: '800' }}>PRO MONAT</Text><Text selectable style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '900' }}>{formatMoney(safe * 30)}</Text></View>
          <View style={{ flex: 1, gap: 3 }}><Text style={{ color: '#C9E1D1', fontSize: 11, fontWeight: '800' }}>PRO JAHR</Text><Text selectable style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '900' }}>{formatMoney(safe * 365)}</Text></View>
        </View>
      </Card>

      <SectionHeading title="Schnelle Beispiele" />
      <View style={{ gap: 10 }}>
        {examples.map((value) => <Pressable key={value} onPress={() => setDaily(String(value))} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: daily === String(value) ? colors.primarySoft : colors.surface, padding: 15, opacity: pressed ? 0.7 : 1 })}><View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}><Symbol name="eurosign.circle.fill" size={20} color={colors.primary} /></View><View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.text, fontWeight: '900' }}>{value} € pro Tag</Text><Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>{formatMoney(value * 365)} pro Jahr</Text></View><Symbol name="chevron.right" size={14} color={colors.textMuted} /></Pressable>)}
      </View>

      <SectionHeading title="Alltagskosten" />
      <Card>
        {[['Coffee-to-go', 4, 5], ['Lieferdienst', 15, 2], ['Energy Drink', 3, 5]].map(([label, price, times], index) => {
          const yearly = Number(price) * Number(times) * 52;
          return <View key={String(label)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: index === 2 ? 0 : 1, borderBottomColor: colors.border }}><View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.text, fontWeight: '800' }}>{String(label)}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>{String(times)}× pro Woche · {formatMoney(Number(price))}</Text></View><Text selectable style={{ color: colors.primaryDark, fontWeight: '900' }}>{formatMoney(yearly)} / Jahr</Text></View>;
        })}
      </Card>

      <Text selectable style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18 }}>Die Werte sind einfache Hochrechnungen und keine Finanzberatung. Sie sollen sichtbar machen, wie kleine wiederkehrende Ausgaben wirken.</Text>
    </ScrollView>
  );
}
