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
    if (!goalId) return Alert.alert('SparFlow', 'Bitte lege zuerst einen Sparbereich an.');
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
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 60, gap: 16 }}>
      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>BETRAG</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {quickAmounts.map((value) => <QuickAmount key={value} amount={value} selected={amount === value} onPress={() => setAmountText(String(value))} />)}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 15, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14 }}>
          <Text style={{ color: colors.textMuted, fontWeight: '900', fontSize: 19 }}>€</Text>
          <TextInput value={amountText} onChangeText={setAmountText} keyboardType="decimal-pad" placeholder="Eigener Betrag" placeholderTextColor={colors.textMuted} style={{ flex: 1, minHeight: 52, fontSize: 21, fontWeight: '900', color: colors.text }} />
        </View>
      </Card>

      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>WOHIN?</Text>
        {store.goals.length === 0 ? (
          <Pressable onPress={() => router.replace('/add-goal')} style={({ pressed }) => ({ minHeight: 52, borderRadius: 15, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.7 : 1 })}>
            <Symbol name="plus" size={16} color={colors.primaryDark} />
            <Text style={{ flex: 1, color: colors.text, fontWeight: '900' }}>Sparbereich anlegen</Text>
          </Pressable>
        ) : store.goals.map((goal) => {
          const selected = goal.id === goalId;
          const recurring = goal.mode === 'recurring';
          return (
            <Pressable key={goal.id} onPress={() => setGoalId(goal.id)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: selected ? colors.primarySoft : colors.surface, borderWidth: 1.5, borderColor: selected ? colors.primary : colors.border, borderRadius: 15, padding: 12, opacity: pressed ? 0.72 : 1 })}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${goal.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={goal.icon} size={16} color={goal.color} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text selectable style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{goal.title}</Text>
                <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>
                  {recurring ? `${formatMoney(goal.recurringAmount ?? goal.targetAmount)} / Monat · gesamt ${formatMoney(goal.savedAmount)}` : `${formatMoney(goal.savedAmount)} / ${formatMoney(goal.targetAmount)}`}
                </Text>
              </View>
              {selected ? <Symbol name="checkmark.circle.fill" size={20} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>

      <TextInput value={note} onChangeText={setNote} placeholder="Notiz · optional" placeholderTextColor={colors.textMuted} style={{ minHeight: 46, borderRadius: 14, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14, color: colors.text, fontSize: 14 }} />

      <PrimaryButton title={Number.isFinite(amount) && amount > 0 ? `${formatMoney(amount)} sparen` : 'Sparen'} icon="plus.circle.fill" loading={saving} disabled={!goalId || !Number.isFinite(amount) || amount <= 0} onPress={() => void submit()} />
    </ScrollView>
  );
}
