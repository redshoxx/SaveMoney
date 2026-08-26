import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

const quickAmounts = [5, 10, 20, 50];
type ActionMode = 'save' | 'withdraw';

function KeyButton({ label, onPress, icon }: { label?: string; onPress: () => void; icon?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 58,
        borderRadius: 12,
        borderCurve: 'continuous',
        backgroundColor: colors.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.62 : 1,
      })}
    >
      {icon ? <Symbol name={icon} size={17} color={colors.text} /> : <Text style={{ color: colors.text, fontSize: 22, fontWeight: '500', fontVariant: ['tabular-nums'] }}>{label}</Text>}
    </Pressable>
  );
}

export default function SaveScreen() {
  const store = useAppStore();
  const params = useLocalSearchParams<{ mode?: string; goalId?: string }>();
  const action: ActionMode = params.mode === 'withdraw' ? 'withdraw' : 'save';
  const requestedGoal = params.goalId ? store.goals.find((goal) => goal.id === params.goalId) : undefined;
  const selectableGoals = action === 'withdraw' ? store.goals.filter((goal) => goal.savedAmount > 0) : store.goals;
  const initialGoal = requestedGoal && selectableGoals.some((goal) => goal.id === requestedGoal.id)
    ? requestedGoal
    : action === 'withdraw'
      ? selectableGoals[0]
      : (store.primaryGoal ?? selectableGoals[0]);

  const [goalId, setGoalId] = useState(initialGoal?.id ?? '');
  const [amountText, setAmountText] = useState('25');
  const [saving, setSaving] = useState(false);
  const amount = useMemo(() => Number(amountText.replace(',', '.')), [amountText]);
  const selectedGoal = store.goals.find((goal) => goal.id === goalId);

  const append = (value: string) => {
    setAmountText((current) => {
      if (value === ',') {
        if (current.includes(',')) return current;
        return `${current || '0'},`;
      }
      if (current === '0') return value;
      if (current.replace(',', '').length >= 7) return current;
      return `${current}${value}`;
    });
  };

  const backspace = () => setAmountText((current) => current.length <= 1 ? '0' : current.slice(0, -1));

  const addQuick = (value: number) => {
    const current = Number(amountText.replace(',', '.')) || 0;
    setAmountText(String(Math.round((current + value) * 100) / 100).replace('.', ','));
  };

  const submit = async () => {
    if (!goalId) return Alert.alert('SparFlow', action === 'withdraw' ? 'Es gibt noch keinen angesparten Betrag zum Abziehen.' : 'Bitte lege zuerst einen Sparbereich an.');
    if (!Number.isFinite(amount) || amount <= 0) return Alert.alert('SparFlow', 'Bitte gib einen gültigen Betrag ein.');
    if (action === 'withdraw' && selectedGoal && amount > selectedGoal.savedAmount) {
      return Alert.alert('SparFlow', `In „${selectedGoal.title}“ sind aktuell ${formatMoney(selectedGoal.savedAmount)} verfügbar.`);
    }

    setSaving(true);
    try {
      if (action === 'withdraw') await store.withdrawFromGoal(goalId, amount);
      else await store.saveToGoal(goalId, amount);
      router.back();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Der Betrag konnte nicht geändert werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 8, paddingBottom: 32, gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{action === 'withdraw' ? 'Abziehen' : 'Einzahlen'}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{action === 'withdraw' ? 'Betrag aus einem Sparziel entnehmen' : 'Schnell & einfach sparen'}</Text>
      </View>

      {selectableGoals.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {selectableGoals.map((goal) => {
            const selected = goal.id === goalId;
            return (
              <Pressable
                key={goal.id}
                onPress={() => setGoalId(goal.id)}
                style={({ pressed }) => ({
                  minHeight: 38,
                  paddingHorizontal: 11,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  opacity: pressed ? 0.68 : 1,
                })}
              >
                <Symbol name={goal.icon} size={13} color={selected ? colors.primaryDark : goal.color} />
                <Text numberOfLines={1} style={{ color: selected ? colors.primaryDark : colors.text, fontSize: 11, fontWeight: '800', maxWidth: 150 }}>{goal.title}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Pressable onPress={() => action === 'save' ? router.replace('/add-goal') : undefined} style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.72 : 1 })}>
          <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>{action === 'save' ? 'Sparziel anlegen' : 'Noch kein angesparter Betrag vorhanden'}</Text>
        </Pressable>
      )}

      <View style={{ alignItems: 'center', paddingVertical: 5, gap: 5 }}>
        <Text selectable style={{ color: colors.text, fontSize: 38, lineHeight: 45, fontWeight: '800', letterSpacing: -1.2, fontVariant: ['tabular-nums'] }}>€ {amountText || '0'}</Text>
        {selectedGoal ? <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{selectedGoal.title} · {formatMoney(selectedGoal.savedAmount)} aktuell</Text> : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 7 }}>
        {quickAmounts.map((value) => (
          <Pressable key={value} onPress={() => addQuick(value)} style={({ pressed }) => ({ flex: 1, minHeight: 34, borderRadius: 10, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.62 : 1 })}>
            <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '800' }}>+{value} €</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 7 }}>
        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row) => (
          <View key={row.join('')} style={{ flexDirection: 'row', gap: 7 }}>
            {row.map((digit) => <KeyButton key={digit} label={digit} onPress={() => append(digit)} />)}
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 7 }}>
          <KeyButton label="," onPress={() => append(',')} />
          <KeyButton label="0" onPress={() => append('0')} />
          <KeyButton icon="delete.left" onPress={backspace} />
        </View>
      </View>

      <PrimaryButton
        title={Number.isFinite(amount) && amount > 0 ? `${formatMoney(amount)} ${action === 'withdraw' ? 'abziehen' : 'einzahlen'}` : (action === 'withdraw' ? 'Abziehen' : 'Einzahlen')}
        icon={action === 'withdraw' ? 'minus' : 'plus'}
        tone={action === 'withdraw' ? 'danger' : 'primary'}
        loading={saving}
        disabled={!goalId || !Number.isFinite(amount) || amount <= 0}
        onPress={() => void submit()}
      />
    </ScrollView>
  );
}
