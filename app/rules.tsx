import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { IconBubble } from '@/components/savings-ui';
import { Card, EmptyState, PrimaryButton, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { SavingRuleFrequency } from '@/types/models';
import { formatMoney } from '@/utils/money';

export default function RulesScreen() {
  const store = useAppStore();
  const [title, setTitle] = useState('Freitags sparen');
  const [amount, setAmount] = useState('10');
  const [frequency, setFrequency] = useState<SavingRuleFrequency>('weekly');
  const [goalId, setGoalId] = useState(store.primaryGoal?.id ?? store.goals[0]?.id ?? '');
  const numericAmount = Number(amount.replace(',', '.'));

  const create = async () => {
    if (!goalId || !Number.isFinite(numericAmount) || numericAmount <= 0) return;
    try {
      await store.createRule({
        title,
        goalId,
        amount: numericAmount,
        frequency,
        weekday: frequency === 'weekly' ? 5 : null,
        dayOfMonth: frequency === 'monthly' ? 1 : null,
      });
    } catch (error) { Alert.alert('SparFlow', error instanceof Error ? error.message : 'Regel konnte nicht erstellt werden.'); }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 70, gap: 20 }}>
      <View style={{ gap: 5 }}><Text selectable style={{ color: colors.text, fontSize: 25, fontWeight: '900' }}>Sparregeln</Text><Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>Fällige Regeln erscheinen in SparFlow und lassen sich mit einem Tap als Sparbuchung bestätigen. Es wird kein echtes Geld automatisch abgebucht.</Text></View>

      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>NEUE REGEL</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Name der Regel" placeholderTextColor={colors.textMuted} style={{ minHeight: 50, borderRadius: 15, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14, color: colors.text, fontSize: 15, fontWeight: '700' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 15, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14 }}><Text style={{ color: colors.textMuted, fontWeight: '900', fontSize: 18 }}>€</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={{ flex: 1, minHeight: 52, paddingHorizontal: 10, color: colors.text, fontSize: 20, fontWeight: '900' }} /></View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {([['daily', 'Täglich'], ['weekly', 'Freitag'], ['monthly', 'Monatlich']] as const).map(([value, label]) => <Pressable key={value} onPress={() => setFrequency(value)} style={({ pressed }) => ({ flex: 1, minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: frequency === value ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.7 : 1 })}><Text style={{ color: frequency === value ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 12 }}>{label}</Text></Pressable>)}
        </View>

        <View style={{ gap: 8 }}><Text style={{ color: colors.text, fontWeight: '800' }}>Sparbereich</Text>{store.goals.map((goal) => <Pressable key={goal.id} onPress={() => setGoalId(goal.id)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 14, backgroundColor: goalId === goal.id ? colors.primarySoft : colors.surfaceMuted, opacity: pressed ? 0.7 : 1 })}><Symbol name={goal.icon} size={17} color={goal.color} /><Text style={{ flex: 1, color: colors.text, fontWeight: '800' }}>{goal.title}</Text>{goalId === goal.id ? <Symbol name="checkmark.circle.fill" size={18} color={colors.primary} /> : null}</Pressable>)}</View>
        <PrimaryButton title="Regel erstellen" icon="clock.badge.plus" onPress={() => void create()} disabled={!goalId || !Number.isFinite(numericAmount) || numericAmount <= 0 || title.trim().length < 2} />
      </Card>

      <SectionHeading title={`Aktive Regeln · ${store.savingRules.length}`} />
      {store.savingRules.length === 0 ? <EmptyState icon="clock.badge.checkmark" title="Noch keine Sparregel" body="Erstelle eine wiederkehrende Erinnerung für kleine Sparbeträge." /> : (
        <View style={{ gap: 11 }}>
          {store.savingRules.map((rule) => {
            const goal = store.goals.find((item) => item.id === rule.goalId);
            const due = store.dueRules.some((item) => item.id === rule.id);
            const frequencyLabel = rule.frequency === 'daily' ? 'täglich' : rule.frequency === 'weekly' ? 'jeden Freitag' : `ab ${rule.dayOfMonth ?? 1}. des Monats`;
            return (
              <Card key={rule.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><IconBubble icon="clock.fill" /><View style={{ flex: 1, gap: 3 }}><Text selectable style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>{rule.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 12.5 }}>{formatMoney(rule.amount)} · {frequencyLabel} · {goal?.title ?? 'Sparbereich'}</Text></View><Switch value={rule.enabled} onValueChange={(enabled) => void store.toggleRule(rule.id, enabled)} /></View>
                {due ? <Pressable onPress={() => void store.applyRule(rule.id)} style={({ pressed }) => ({ minHeight: 45, borderRadius: 14, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: pressed ? 0.7 : 1 })}><Symbol name="checkmark.circle.fill" size={17} color={colors.primaryDark} /><Text style={{ color: colors.primaryDark, fontWeight: '900' }}>Jetzt {formatMoney(rule.amount)} sparen</Text></Pressable> : <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>Aktuell nicht fällig.</Text>}
                <Pressable onPress={() => Alert.alert('Regel löschen?', rule.title, [{ text: 'Abbrechen', style: 'cancel' }, { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteRule(rule.id) }])}><Text style={{ color: colors.textMuted, fontSize: 12.5, fontWeight: '700' }}>Regel löschen</Text></Pressable>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
