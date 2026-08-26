import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatEntityNumber } from '@/utils/entity-number';
import { formatMoney } from '@/utils/money';

const quickAmounts = [5, 10, 20, 50];
type ActionMode = 'save' | 'withdraw';

function KeyButton({ label, onPress, icon, compact }: { label?: string; onPress: () => void; icon?: string; compact: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, minHeight: compact ? 48 : 54, borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      {icon ? <Symbol name={icon} size={16} color={colors.text} /> : <Text selectable style={{ color: colors.text, fontSize: compact ? 19 : 21, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{label}</Text>}
    </Pressable>
  );
}

export default function SaveScreen() {
  const store = useAppStore();
  const { width } = useWindowDimensions();
  const compact = width <= 390;
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
      Alert.alert('SparPilot', error instanceof Error ? error.message : 'Der Betrag konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  if (!selectableGoals.length) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={{ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 12, alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Symbol name="target" size={20} color={colors.primaryDark} /></View>
          <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'center' }}>{action === 'withdraw' ? 'Noch nichts zum Entnehmen vorhanden' : 'Du brauchst zuerst ein Ziel'}</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 11, lineHeight: 16, textAlign: 'center' }}>{action === 'withdraw' ? 'Sobald Geld in einem Ziel liegt, kannst du es hier wieder entnehmen.' : 'Damit SparPilot weiß, wohin dein Geld gehört.'}</Text>
          {action === 'save' ? <PrimaryButton title="Erstes Ziel anlegen" icon="plus" onPress={() => router.replace('/add-goal')} /> : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: compact ? 14 : 16, paddingTop: 6, paddingBottom: 28, gap: compact ? 12 : 15 }}>
      <Animated.View entering={FadeInDown.duration(180)} style={{ gap: 4 }}>
        <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{action === 'withdraw' ? 'Geld entnehmen' : 'Geld zurücklegen'}</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Ziel wählen · Betrag wählen · bestätigen.</Text>
      </Animated.View>

      <View style={{ gap: 7 }}>
        <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>1 · Ziel</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingRight: 4 }}>
          {selectableGoals.map((goal) => {
            const selected = goal.id === goalId;
            return (
              <Pressable key={goal.id} onPress={() => setGoalId(goal.id)} style={({ pressed }) => ({ minHeight: 45, paddingHorizontal: 11, borderRadius: 13, borderWidth: 1.5, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface, flexDirection: 'row', alignItems: 'center', gap: 7, opacity: pressed ? 0.72 : 1 })}>
                <Symbol name={selected ? 'checkmark.circle.fill' : goal.icon} size={14} color={selected ? colors.primaryDark : goal.color} />
                <View style={{ gap: 1 }}>
                  <Text selectable numberOfLines={1} style={{ color: selected ? colors.primaryDark : colors.text, fontSize: 11, fontWeight: '800', maxWidth: 140 }}>{goal.title}</Text>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 8.5 }}>{formatEntityNumber(goal.displayNumber)}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        {selectedGoal ? <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>{formatEntityNumber(selectedGoal.displayNumber)} · verfügbar: {formatMoney(selectedGoal.savedAmount)}</Text> : null}
      </View>

      <View style={{ gap: 8 }}>
        <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>2 · Betrag</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {quickAmounts.map((value) => {
            const selected = amount === value;
            return (
              <Pressable key={value} onPress={() => setAmountText(String(value))} style={({ pressed }) => ({ flex: 1, minHeight: 40, borderRadius: 11, backgroundColor: selected ? colors.primary : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.74 : 1 })}>
                <Text selectable style={{ color: selected ? '#FFFFFF' : colors.text, fontSize: 11, fontWeight: '900' }}>{value} €</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ alignItems: 'center', paddingVertical: compact ? 0 : 3, gap: 2 }}>
          <Text selectable style={{ color: colors.text, fontSize: compact ? 34 : 38, lineHeight: compact ? 40 : 45, fontWeight: '900', letterSpacing: -1.1, fontVariant: ['tabular-nums'] }}>€ {amountText || '0'}</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 9 }}>Eigener Betrag über das Zahlenfeld</Text>
        </View>

        <View style={{ gap: 6 }}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row) => (
            <View key={row.join('')} style={{ flexDirection: 'row', gap: 6 }}>
              {row.map((digit) => <KeyButton key={digit} label={digit} compact={compact} onPress={() => append(digit)} />)}
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <KeyButton label="," compact={compact} onPress={() => append(',')} />
            <KeyButton label="0" compact={compact} onPress={() => append('0')} />
            <KeyButton icon="delete.left" compact={compact} onPress={backspace} />
          </View>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>3 · Bestätigen</Text>
        <PrimaryButton
          title={Number.isFinite(amount) && amount > 0 && selectedGoal ? `${formatMoney(amount)} ${action === 'withdraw' ? 'entnehmen' : 'einzahlen'}` : (action === 'withdraw' ? 'Betrag entnehmen' : 'Betrag einzahlen')}
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
