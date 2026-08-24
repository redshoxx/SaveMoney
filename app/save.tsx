import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { QuickAmount } from '@/components/savings-ui';
import { Card, PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

const quickAmounts = [5, 10, 20, 50];

export default function SaveScreen() {
  const store = useAppStore();
  const [goalId, setGoalId] = useState(store.primaryGoal?.id ?? store.goals[0]?.id ?? '');
  const [amountText, setAmountText] = useState('10');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const amount = useMemo(() => Number(amountText.replace(',', '.')), [amountText]);

  const submit = async () => {
    if (!goalId) return Alert.alert('SparFlow', 'Bitte lege zuerst ein Sparziel an.');
    if (!Number.isFinite(amount) || amount <= 0) return Alert.alert('SparFlow', 'Bitte gib einen gültigen Betrag ein.');
    setSaving(true);
    try {
      await store.saveToGoal(goalId, amount, note || undefined);
      router.back();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Der Betrag konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 60, gap: 20 }}>
      <View style={{ gap: 6 }}>
        <Text selectable style={{ color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.7 }}>In Sekunden sparen</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>Betrag wählen, Ziel antippen, fertig. Das Geld wird nur lokal in SparFlow protokolliert.</Text>
      </View>

      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>BETRAG</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
          {quickAmounts.map((value) => <QuickAmount key={value} amount={value} selected={amount === value} onPress={() => setAmountText(String(value))} />)}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14 }}>
          <Text style={{ color: colors.textMuted, fontWeight: '900', fontSize: 20 }}>€</Text>
          <TextInput value={amountText} onChangeText={setAmountText} keyboardType="decimal-pad" placeholder="Eigener Betrag" placeholderTextColor={colors.textMuted} style={{ flex: 1, minHeight: 54, fontSize: 22, fontWeight: '900', color: colors.text, fontVariant: ['tabular-nums'] }} />
        </View>
      </Card>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>SPARZIEL</Text>
        {store.goals.length === 0 ? (
          <Card><Text selectable style={{ color: colors.text, fontWeight: '800' }}>Noch kein Sparziel vorhanden.</Text><Pressable onPress={() => router.replace('/add-goal')}><Text style={{ color: colors.primary, fontWeight: '900' }}>Jetzt Sparziel erstellen</Text></Pressable></Card>
        ) : store.goals.map((goal) => {
          const selected = goal.id === goalId;
          return (
            <Pressable key={goal.id} onPress={() => setGoalId(goal.id)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: selected ? colors.primarySoft : colors.surface, borderWidth: 1.5, borderColor: selected ? colors.primary : colors.border, borderRadius: 18, borderCurve: 'continuous', padding: 14, opacity: pressed ? 0.72 : 1 })}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: `${goal.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={goal.icon} size={19} color={goal.color} /></View>
              <View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{goal.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>{formatMoney(goal.savedAmount)} / {formatMoney(goal.targetAmount)}</Text></View>
              {selected ? <Symbol name="checkmark.circle.fill" size={22} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>NOTIZ · OPTIONAL</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="z. B. Kaffee zuhause" placeholderTextColor={colors.textMuted} style={{ minHeight: 50, borderRadius: 15, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14, color: colors.text, fontSize: 15 }} />
      </Card>

      <PrimaryButton title={Number.isFinite(amount) && amount > 0 ? `${formatMoney(amount)} sparen` : 'Sparen'} icon="plus.circle.fill" loading={saving} disabled={!goalId || !Number.isFinite(amount) || amount <= 0} onPress={() => void submit()} />
    </ScrollView>
  );
}
