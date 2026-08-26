import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { Card, EmptyState, PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { SavingRuleFrequency } from '@/types/models';
import { formatEntityNumber } from '@/utils/entity-number';
import { formatMoney } from '@/utils/money';

export default function RulesScreen() {
  const store = useAppStore();
  const { width } = useWindowDimensions();
  const compact = width <= 390;
  const [title, setTitle] = useState('Freitags sparen');
  const [amount, setAmount] = useState('10');
  const [frequency, setFrequency] = useState<SavingRuleFrequency>('weekly');
  const [goalId, setGoalId] = useState(store.primaryGoal?.id ?? store.goals[0]?.id ?? '');
  const numericAmount = Number(amount.replace(',', '.'));

  const create = async () => {
    if (!goalId || !Number.isFinite(numericAmount) || numericAmount <= 0) return;
    try {
      await store.createRule({ title, goalId, amount: numericAmount, frequency, weekday: frequency === 'weekly' ? 5 : null, dayOfMonth: frequency === 'monthly' ? 1 : null });
    } catch (error) { Alert.alert('SparPilot', error instanceof Error ? error.message : 'Regel konnte nicht erstellt werden.'); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={72}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: compact ? 14 : 16, paddingTop: 8, paddingBottom: 38, gap: 14 }}>
        <View style={{ gap: 3 }}><Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>Sparregeln</Text><Text selectable style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>Eine Regel erinnert dich an eine Sparroutine. Sie bucht niemals automatisch echtes Geld ab.</Text></View>

        <Card style={{ gap: 10 }}>
          <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>Neue Regel</Text>
          <TextInput value={title} onChangeText={setTitle} maxLength={48} placeholder="Name der Regel" placeholderTextColor={colors.textMuted} style={{ minHeight: 48, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text, fontSize: 15, fontWeight: '700' }} />
          <View style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12 }}><Text selectable style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 17 }}>€</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={{ flex: 1, minHeight: 48, paddingHorizontal: 9, color: colors.text, fontSize: 19, fontWeight: '900' }} /></View>
          <View style={{ flexDirection: 'row', gap: 7 }}>{([['daily', 'Täglich'], ['weekly', 'Freitag'], ['monthly', 'Monatlich']] as const).map(([value, label]) => <Pressable key={value} onPress={() => setFrequency(value)} style={({ pressed }) => ({ flex: 1, minHeight: 41, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: frequency === value ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}><Text selectable style={{ color: frequency === value ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 10.5 }}>{label}</Text></Pressable>)}</View>
          <View style={{ gap: 7 }}><Text selectable style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>Ziel auswählen</Text>{store.goals.map((goal) => <Pressable key={goal.id} onPress={() => setGoalId(goal.id)} style={({ pressed }) => ({ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, borderRadius: 12, backgroundColor: goalId === goal.id ? colors.primarySoft : colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}><Symbol name={goal.icon} size={15} color={goal.color} /><View style={{ flex: 1, minWidth: 0 }}><Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>{goal.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 8.5 }}>{formatEntityNumber(goal.displayNumber)}</Text></View>{goalId === goal.id ? <Symbol name="checkmark.circle.fill" size={16} color={colors.primary} /> : null}</Pressable>)}</View>
          <PrimaryButton title="Regel erstellen" icon="clock.badge.plus" onPress={() => void create()} disabled={!goalId || !Number.isFinite(numericAmount) || numericAmount <= 0 || title.trim().length < 2} />
        </Card>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text selectable style={{ flex: 1, color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Aktive Regeln</Text><Text selectable style={{ color: colors.primaryDark, fontSize: 10.5, fontWeight: '900' }}>{store.savingRules.length}</Text></View>
        {store.savingRules.length === 0 ? <EmptyState icon="clock.badge.checkmark" title="Noch keine Sparregel" body="Erstelle eine wiederkehrende Routine für kleine Sparbeträge." /> : <View style={{ gap: 9 }}>{store.savingRules.map((rule) => { const goal = store.goals.find((item) => item.id === rule.goalId); const due = store.dueRules.some((item) => item.id === rule.id); const frequencyLabel = rule.frequency === 'daily' ? 'täglich' : rule.frequency === 'weekly' ? 'jeden Freitag' : `ab ${rule.dayOfMonth ?? 1}. des Monats`; return <Card key={rule.id} style={{ gap: 9 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Symbol name="clock.fill" size={15} color={colors.primaryDark} /></View><View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text selectable numberOfLines={1} style={{ color: colors.text, fontWeight: '900', fontSize: 12.5 }}>{rule.title}</Text><Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 9.5 }}>{formatMoney(rule.amount)} · {frequencyLabel} · {goal?.title ?? 'Ziel'}</Text></View><Switch value={rule.enabled} onValueChange={(enabled) => void store.toggleRule(rule.id, enabled)} /></View>{due ? <Pressable onPress={() => void store.applyRule(rule.id)} style={({ pressed }) => ({ minHeight: 44, borderRadius: 12, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.72 : 1 })}><Symbol name="checkmark.circle.fill" size={15} color={colors.primaryDark} /><Text selectable style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 11 }}>Jetzt {formatMoney(rule.amount)} sparen</Text></Pressable> : <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Aktuell nicht fällig.</Text>}<Pressable onPress={() => Alert.alert('Regel löschen?', rule.title, [{ text: 'Abbrechen', style: 'cancel' }, { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteRule(rule.id) }])} style={({ pressed }) => ({ minHeight: 40, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}><Text selectable style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>Regel löschen</Text></Pressable></Card>; })}</View>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
