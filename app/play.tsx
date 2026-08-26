import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { IconBubble } from '@/components/savings-ui';
import { Card, SectionHeading } from '@/components/ui';
import { colors } from '@/constants/theme';
import { savingActions, useAppStore } from '@/store/app-store';
import { formatEntityNumber } from '@/utils/entity-number';
import { formatMoney } from '@/utils/money';

const rouletteValues = [1, 2, 3, 5, 7, 10, 15, 20];

export default function PlayScreen() {
  const store = useAppStore();
  const [roulette, setRoulette] = useState(7);
  const primaryGoal = store.primaryGoal;

  const run = async (action: () => Promise<void>) => {
    try { await action(); }
    catch (error) { Alert.alert('SparPilot', error instanceof Error ? error.message : 'Aktion fehlgeschlagen.'); }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Sparideen' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 36, gap: 16 }}>
        {primaryGoal ? <View style={{ borderRadius: 14, backgroundColor: colors.primarySoft, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}><IconBubble icon={primaryGoal.icon} color={primaryGoal.color} background={colors.surface} size={34} /><View style={{ flex: 1, minWidth: 0 }}><Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>Sparen für {primaryGoal.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 8.5 }}>{formatEntityNumber(primaryGoal.displayNumber)}</Text></View></View> : null}

        <View style={{ gap: 8 }}><SectionHeading title="Spar-Aktionen" /><View style={{ gap: 8 }}>{savingActions.map((action) => <Pressable key={action.id} disabled={!primaryGoal} onPress={() => primaryGoal ? void run(() => store.saveToGoal(primaryGoal.id, action.amount, action.title)) : undefined} style={({ pressed }) => ({ opacity: !primaryGoal ? 0.45 : pressed ? 0.72 : 1 })}><Card style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}><IconBubble icon={action.icon} color={action.color} background={`${action.color}18`} size={38} /><View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text selectable style={{ color: colors.text, fontWeight: '800', fontSize: 11.5 }}>{action.title}</Text><Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 9.5 }}>{action.subtitle}</Text></View><Text selectable style={{ color: action.color, fontWeight: '900', fontSize: 12 }}>+{formatMoney(action.amount)}</Text></Card></Pressable>)}</View></View>

        <View style={{ gap: 8 }}><SectionHeading title="Spar-Roulette" /><Card style={{ padding: 13 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}><IconBubble icon="die.face.5.fill" color={colors.purple} background={colors.surfaceMuted} size={42} /><View style={{ flex: 1 }}><Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>DEIN BETRAG</Text><Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>{formatMoney(roulette)}</Text></View></View><View style={{ flexDirection: 'row', gap: 8 }}><Pressable onPress={() => setRoulette(rouletteValues[Math.floor(Math.random() * rouletteValues.length)])} style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}><Text selectable style={{ color: colors.text, fontWeight: '800', fontSize: 11 }}>Neu drehen</Text></Pressable><Pressable disabled={!primaryGoal} onPress={() => primaryGoal ? void run(() => store.saveToGoal(primaryGoal.id, roulette, 'Spar-Roulette')) : undefined} style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, opacity: !primaryGoal ? 0.4 : pressed ? 0.76 : 1 })}><Text selectable style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 11 }}>Sparen</Text></Pressable></View></Card></View>

        <View style={{ gap: 8 }}><SectionHeading title="No-Spend-Day" /><Card style={{ padding: 13 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}><IconBubble icon={store.todayIsNoSpend ? 'checkmark.seal.fill' : 'hand.thumbsup.fill'} size={40} /><View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>{store.todayIsNoSpend ? 'Heute geschafft' : 'Heute nichts Unnötiges gekauft?'}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9.5, lineHeight: 14 }}>{store.todayIsNoSpend ? 'Der Tag ist gespeichert.' : 'Markiere den Tag oder spare zusätzlich 5 €.'}</Text></View></View>{!store.todayIsNoSpend ? <View style={{ flexDirection: 'row', gap: 8 }}><Pressable onPress={() => void run(() => store.markNoSpend())} style={({ pressed }) => ({ flex: 1, minHeight: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}><Text selectable style={{ color: colors.text, fontWeight: '800', fontSize: 10.5 }}>Markieren</Text></Pressable><Pressable disabled={!primaryGoal} onPress={() => primaryGoal ? void run(() => store.markNoSpend(primaryGoal.id, 5)) : undefined} style={({ pressed }) => ({ flex: 1, minHeight: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, opacity: !primaryGoal ? 0.45 : pressed ? 0.72 : 1 })}><Text selectable style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 10.5 }}>+5 € sparen</Text></Pressable></View> : null}</Card></View>
      </ScrollView>
    </>
  );
}
