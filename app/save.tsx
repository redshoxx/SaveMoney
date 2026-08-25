import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { QuickAmount } from '@/components/savings-ui';
import { Card, PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

const quickAmounts = [5, 10, 20, 50];
type ActionMode = 'save' | 'withdraw';

export default function SaveScreen() {
  const store = useAppStore();
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: ActionMode = params.mode === 'withdraw' ? 'withdraw' : 'save';
  const initialGoal = initialMode === 'withdraw'
    ? store.goals.find((goal) => goal.savedAmount > 0)
    : (store.primaryGoal ?? store.goals[0]);
  const [action, setAction] = useState<ActionMode>(initialMode);
  const [goalId, setGoalId] = useState(initialGoal?.id ?? '');
  const [amountText, setAmountText] = useState('10');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const amount = useMemo(() => Number(amountText.replace(',', '.')), [amountText]);
  const selectableGoals = action === 'withdraw' ? store.goals.filter((goal) => goal.savedAmount > 0) : store.goals;
  const selectedGoal = store.goals.find((goal) => goal.id === goalId);

  const chooseAction = (next: ActionMode) => {
    setAction(next);
    const candidates = next === 'withdraw' ? store.goals.filter((goal) => goal.savedAmount > 0) : store.goals;
    if (!candidates.some((goal) => goal.id === goalId)) {
      setGoalId((next === 'save' ? (store.primaryGoal ?? candidates[0]) : candidates[0])?.id ?? '');
    }
  };

  const submit = async () => {
    if (!goalId) {
      return Alert.alert('SparFlow', action === 'withdraw' ? 'Es gibt noch keinen angesparten Betrag zum Abziehen.' : 'Bitte lege zuerst einen Sparbereich an.');
    }
    if (!Number.isFinite(amount) || amount <= 0) return Alert.alert('SparFlow', 'Bitte gib einen gültigen Betrag ein.');
    if (action === 'withdraw' && selectedGoal && amount > selectedGoal.savedAmount) {
      return Alert.alert('SparFlow', `In „${selectedGoal.title}“ sind aktuell ${formatMoney(selectedGoal.savedAmount)} verfügbar.`);
    }

    setSaving(true);
    try {
      if (action === 'withdraw') await store.withdrawFromGoal(goalId, amount, note || undefined);
      else await store.saveToGoal(goalId, amount, note || undefined);
      router.back();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Der Betrag konnte nicht geändert werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 60, gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 7 }}>
        {([
          ['save', 'Sparen', 'plus.circle.fill'],
          ['withdraw', 'Abziehen', 'minus.circle.fill'],
        ] as const).map(([value, label, icon]) => {
          const active = action === value;
          return (
            <Pressable
              key={value}
              onPress={() => chooseAction(value)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 44,
                borderRadius: 13,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                borderWidth: 1,
                borderColor: active ? (value === 'withdraw' ? colors.danger : colors.primary) : colors.border,
                backgroundColor: active ? (value === 'withdraw' ? colors.dangerSoft : colors.primarySoft) : colors.surface,
                opacity: pressed ? 0.72 : 1,
              })}>
              <Symbol name={icon} size={15} color={active ? (value === 'withdraw' ? colors.danger : colors.primaryDark) : colors.textMuted} />
              <Text style={{ color: active ? (value === 'withdraw' ? colors.danger : colors.primaryDark) : colors.text, fontWeight: '900', fontSize: 13 }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

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
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>{action === 'withdraw' ? 'WOHER?' : 'WOHIN?'}</Text>
        {selectableGoals.length === 0 ? (
          <Pressable
            onPress={() => action === 'save' ? router.replace('/add-goal') : null}
            style={({ pressed }) => ({ minHeight: 52, borderRadius: 15, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed && action === 'save' ? 0.7 : 1 })}>
            <Symbol name={action === 'withdraw' ? 'tray' : 'plus'} size={16} color={action === 'withdraw' ? colors.textMuted : colors.primaryDark} />
            <Text style={{ flex: 1, color: colors.text, fontWeight: '900' }}>{action === 'withdraw' ? 'Noch kein angesparter Betrag vorhanden' : 'Sparbereich anlegen'}</Text>
          </Pressable>
        ) : selectableGoals.map((goal) => {
          const selected = goal.id === goalId;
          const recurring = goal.mode === 'recurring';
          return (
            <Pressable key={goal.id} onPress={() => setGoalId(goal.id)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: selected ? colors.primarySoft : colors.surface, borderWidth: 1.5, borderColor: selected ? colors.primary : colors.border, borderRadius: 15, padding: 12, opacity: pressed ? 0.72 : 1 })}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${goal.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={goal.icon} size={16} color={goal.color} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text selectable style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{goal.title}</Text>
                <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>
                  {action === 'withdraw'
                    ? `${formatMoney(goal.savedAmount)} verfügbar`
                    : recurring
                      ? `${formatMoney(goal.recurringAmount ?? goal.targetAmount)} / Monat · gesamt ${formatMoney(goal.savedAmount)}`
                      : `${formatMoney(goal.savedAmount)} / ${formatMoney(goal.targetAmount)}`}
                </Text>
              </View>
              {selected ? <Symbol name="checkmark.circle.fill" size={20} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={action === 'withdraw' ? 'Grund · optional' : 'Notiz · optional'}
        placeholderTextColor={colors.textMuted}
        style={{ minHeight: 46, borderRadius: 14, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14, color: colors.text, fontSize: 14 }}
      />

      <PrimaryButton
        title={Number.isFinite(amount) && amount > 0 ? `${formatMoney(amount)} ${action === 'withdraw' ? 'abziehen' : 'sparen'}` : (action === 'withdraw' ? 'Abziehen' : 'Sparen')}
        icon={action === 'withdraw' ? 'minus.circle.fill' : 'plus.circle.fill'}
        tone={action === 'withdraw' ? 'danger' : 'primary'}
        loading={saving}
        disabled={!goalId || !Number.isFinite(amount) || amount <= 0}
        onPress={() => void submit()}
      />
    </ScrollView>
  );
}
