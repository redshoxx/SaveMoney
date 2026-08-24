import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { IconBubble } from '@/components/savings-ui';
import { Card, SectionHeading } from '@/components/ui';
import { colors } from '@/constants/theme';
import { savingActions, useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

const rouletteValues = [1, 2, 3, 5, 7, 10, 15, 20];

export default function PlayScreen() {
  const store = useAppStore();
  const [roulette, setRoulette] = useState(7);
  const primaryGoal = store.primaryGoal;

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Aktion fehlgeschlagen.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Sparideen' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 20 }}>
        <View style={{ gap: 9 }}>
          <SectionHeading title="Spar-Aktionen" />
          <View style={{ gap: 9 }}>
            {savingActions.map((action) => (
              <Pressable
                key={action.id}
                disabled={!primaryGoal}
                onPress={() => primaryGoal ? void run(() => store.saveToGoal(primaryGoal.id, action.amount, action.title)) : undefined}
                style={({ pressed }) => ({ opacity: !primaryGoal ? 0.45 : pressed ? 0.7 : 1 })}>
                <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconBubble icon={action.icon} color={action.color} background={`${action.color}18`} size={42} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text selectable style={{ color: colors.text, fontWeight: '800' }}>{action.title}</Text>
                    <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>{action.subtitle}</Text>
                  </View>
                  <Text selectable style={{ color: action.color, fontWeight: '900', fontSize: 16 }}>+{formatMoney(action.amount)}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 9 }}>
          <SectionHeading title="Spar-Roulette" />
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconBubble icon="die.face.5.fill" color={colors.purple} background="#EEE8FA" size={46} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>HEUTE</Text>
                <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: '900' }}>{formatMoney(roulette)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <Pressable
                onPress={() => setRoulette(rouletteValues[Math.floor(Math.random() * rouletteValues.length)])}
                style={({ pressed }) => ({ flex: 1, minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEE8FA', opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ color: colors.purple, fontWeight: '900' }}>Neu drehen</Text>
              </Pressable>
              <Pressable
                disabled={!primaryGoal}
                onPress={() => primaryGoal ? void run(() => store.saveToGoal(primaryGoal.id, roulette, 'Spar-Roulette')) : undefined}
                style={({ pressed }) => ({ flex: 1, minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.purple, opacity: !primaryGoal ? 0.4 : pressed ? 0.75 : 1 })}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Sparen</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        <View style={{ gap: 9 }}>
          <SectionHeading title="No-Spend-Day" />
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconBubble icon={store.todayIsNoSpend ? 'checkmark.seal.fill' : 'hand.thumbsup.fill'} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
                  {store.todayIsNoSpend ? 'Heute geschafft' : 'Heute nichts Unnötiges gekauft?'}
                </Text>
                <Text selectable style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18 }}>
                  {store.todayIsNoSpend ? 'Der Tag ist gespeichert.' : 'Markiere den Tag oder spare zusätzlich 5 €.'}
                </Text>
              </View>
            </View>
            {!store.todayIsNoSpend ? (
              <View style={{ flexDirection: 'row', gap: 9 }}>
                <Pressable
                  onPress={() => void run(() => store.markNoSpend())}
                  style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.7 : 1 })}>
                  <Text style={{ color: colors.text, fontWeight: '800' }}>Markieren</Text>
                </Pressable>
                <Pressable
                  disabled={!primaryGoal}
                  onPress={() => primaryGoal ? void run(() => store.markNoSpend(primaryGoal.id, 5)) : undefined}
                  style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, opacity: !primaryGoal ? 0.45 : pressed ? 0.7 : 1 })}>
                  <Text style={{ color: colors.primaryDark, fontWeight: '900' }}>+5 €</Text>
                </Pressable>
              </View>
            ) : null}
          </Card>
        </View>
      </ScrollView>
    </>
  );
}
