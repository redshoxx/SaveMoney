import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Card, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { formatMoney } from '@/utils/money';

export default function WhatIfScreen() {
  const [daily, setDaily] = useState('5');
  const amount = useMemo(() => Number(daily.replace(',', '.')), [daily]);
  const safe = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const examples = [3, 5, 10];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 36, gap: 14 }}>
        <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primary, gap: 11 }}>
          <Text selectable style={{ color: colors.primaryDark, fontSize: 10, fontWeight: '900' }}>WENN DU JEDEN TAG SPARST</Text>
          <View style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', borderRadius: 13, backgroundColor: colors.surface, paddingHorizontal: 12 }}><Text selectable style={{ color: colors.primaryDark, fontSize: 19, fontWeight: '900' }}>€</Text><TextInput value={daily} onChangeText={setDaily} keyboardType="decimal-pad" style={{ flex: 1, minHeight: 52, paddingHorizontal: 9, color: colors.text, fontSize: 25, fontWeight: '900', fontVariant: ['tabular-nums'] }} /></View>
          <View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1, borderRadius: 12, backgroundColor: colors.surface, padding: 10, gap: 2 }}><Text selectable style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '800' }}>PRO MONAT</Text><Text selectable numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{formatMoney(safe * 30)}</Text></View><View style={{ flex: 1, borderRadius: 12, backgroundColor: colors.surface, padding: 10, gap: 2 }}><Text selectable style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '800' }}>PRO JAHR</Text><Text selectable numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{formatMoney(safe * 365)}</Text></View></View>
        </Card>

        <View style={{ gap: 7 }}><Text selectable style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Schnelle Beispiele</Text>{examples.map((value) => <Pressable key={value} onPress={() => setDaily(String(value))} style={({ pressed }) => ({ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: daily === String(value) ? colors.primarySoft : colors.surface, paddingHorizontal: 12, opacity: pressed ? 0.72 : 1 })}><View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}><Symbol name="eurosign.circle.fill" size={17} color={colors.primaryDark} /></View><View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.text, fontWeight: '900', fontSize: 11.5 }}>{value} € pro Tag</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>{formatMoney(value * 365)} pro Jahr</Text></View><Symbol name="chevron.right" size={10} color={colors.textMuted} /></Pressable>)}</View>

        <View style={{ gap: 7 }}><Text selectable style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Alltagskosten</Text><Card style={{ paddingVertical: 2, gap: 0 }}>{([['Coffee-to-go', 4, 5], ['Lieferdienst', 15, 2], ['Energy Drink', 3, 5]] as const).map(([label, price, times], index) => { const yearly = price * times * 52; return <View key={label} style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: index === 2 ? 0 : 1, borderBottomColor: colors.border }}><View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text selectable style={{ color: colors.text, fontWeight: '800', fontSize: 11.5 }}>{label}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>{times}× / Woche · {formatMoney(price)}</Text></View><Text selectable style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 10.5 }}>{formatMoney(yearly)} / Jahr</Text></View>; })}</Card></View>
        <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, lineHeight: 14 }}>Einfache Hochrechnungen zur Orientierung, keine Finanzberatung.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
