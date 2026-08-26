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
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, minHeight: 56, borderRadius: 13, borderCurve: 'continuous', backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.62 : 1 })}>
      {icon ? <Symbol name={icon} size={17} color={colors.text} /> : <Text selectable style={{ color: colors.text, fontSize: 21, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{label}</Text>}
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
    : (store.primaryGoal ?? selectableGoals[0]);

  const [goalId, setGoalId] = useState(initialGoal?.id ?? '');
  const [amountText, setAmountText] = useState('');
  const [saving, setSaving] = useState(false);
  const amount = useMemo(() => Number(amountText.replace(',', '.')), [amountText]);
  const selectedGoal = selectableGoals.find((goal) => goal.id === goalId) ?? null;

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

  const backspace = () => setAmountText((current) => current.length <= 1 ? '' : current.slice(0, -1));

  const submit = async () => {
    if (!goalId) {
      Alert.alert('Sparen', action === 'withdraw' ? 'Es gibt noch keinen Betrag, den du entnehmen kannst.' : 'Lege zuerst ein Sparziel an.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Betrag', 'Wähle einen Betrag oder gib ihn über das Zahlenfeld ein.');
      return;
    }
    if (action === 'withdraw' && selectedGoal && amount > selectedGoal.savedAmount) {
      Alert.alert('Zu hoher Betrag', `In „${selectedGoal.title}“ sind aktuell ${formatMoney(selectedGoal.savedAmount)} verfügbar.`);
      return;
    }

    setSaving(true);
    try {
      if (action === 'withdraw') await store.withdrawFromGoal(goalId, amount);
      else await store.saveToGoal(goalId, amount);
      router.back();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Der Betrag konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  if (!selectableGoals.length) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 14 }}>
        <View style={{ borderRadius: 20, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 12, alignItems: 'center' }}>
          <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Symbol name="target" size={21} color={colors.primary} /></View>
          <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'center' }}>{action === 'withdraw' ? 'Noch nichts zum Entnehmen vorhanden' : 'Du brauchst zuerst ein Ziel'}</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 11, lineHeight: 16, textAlign: 'center' }}>{action === 'withdraw' ? 'Sobald du Geld in einem Ziel gespeichert hast, kannst du es hier wieder entnehmen.' : 'Damit SparFlow weiß, wohin dein Geld gehört.'}</Text>
          {action === 'save' ? (
            <Pressable onPress={() => router.replace('/add-goal')} style={({ pressed }) => ({ minHeight: 48, alignSelf: 'stretch', borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
              <Text selectable style={{ color: '#FFFFFF', fontWeight: '900' }}>Erstes Ziel anlegen</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 8, paddingBottom: 34, gap: 18 }}>
      <View style={{ gap: 3 }}>
        <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>{action === 'withdraw' ? 'Geld entnehmen' : 'Geld zurücklegen'}</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>{action === 'withdraw' ? 'Wähle Ziel und Betrag.' : 'Drei einfache Schritte.'}</Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text selectable style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>1. {action === 'withdraw' ? 'Woher möchtest du Geld nehmen?' : 'Wofür möchtest du sparen?'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {selectableGoals.map((goal) => {
            const selected = goal.id === goalId;
            return (
              <Pressable key={goal.id} onPress={() => setGoalId(goal.id)} style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1.5, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface, flexDirection: 'row', alignItems: 'center', gap: 7, opacity: pressed ? 0.68 : 1 })}>
                <Symbol name={selected ? 'checkmark.circle.fill' : goal.icon} size={14} color={selected ? colors.primary : goal.color} />
                <Text selectable numberOfLines={1} style={{ color: selected ? colors.primaryDark : colors.text, fontSize: 11.5, fontWeight: '800', maxWidth: 150 }}>{goal.title}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {selectedGoal ? <Text selectable style={{ color: colors.textMuted, fontSize: 10 }}>Aktuell in diesem Ziel: {formatMoney(selectedGoal.savedAmount)}</Text> : null}
      </View>

      <View style={{ gap: 9 }}>
        <Text selectable style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>2. Betrag wählen</Text>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {quickAmounts.map((value) => {
            const selected = amount === value;
            return (
              <Pressable key={value} onPress={() => setAmountText(String(value))} style={({ pressed }) => ({ flex: 1, minHeight: 42, borderRadius: 12, backgroundColor: selected ? colors.primarySoft : colors.surfaceMuted, borderWidth: selected ? 1.5 : 0, borderColor: selected ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.62 : 1 })}>
                <Text selectable style={{ color: selected ? colors.primaryDark : colors.text, fontSize: 11.5, fontWeight: '900' }}>{value} €</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 3, gap: 3 }}>
          <Text selectable style={{ color: colors.text, fontSize: 38, lineHeight: 45, fontWeight: '900', letterSpacing: -1.2, fontVariant: ['tabular-nums'] }}>€ {amountText || '0'}</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Oder eigenen Betrag eingeben</Text>
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
      </View>

      <View style={{ gap: 7 }}>
        <Text selectable style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>3. Bestätigen</Text>
        <PrimaryButton
          title={Number.isFinite(amount) && amount > 0 && selectedGoal ? `${formatMoney(amount)} ${action === 'withdraw' ? 'aus ' : 'in '}${selectedGoal.title} ${action === 'withdraw' ? 'entnehmen' : 'einzahlen'}` : (action === 'withdraw' ? 'Betrag entnehmen' : 'Betrag einzahlen')}
          icon={action === 'withdraw' ? 'minus' : 'plus'}
          tone={action === 'withdraw' ? 'danger' : 'primary'}
          loading={saving}
          disabled={!goalId || !Number.isFinite(amount) || amount <= 0}
          onPress={() => void submit()}
        />
      </View>
    </ScrollView>
  );
}
