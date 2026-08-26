import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { HeaderIconButton, MiniTrend, NeonAction, NeonCard, ProgressRing } from '@/components/neon-ui';
import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { Goal } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { buildSavingCoach } from '@/utils/saving-coach';

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function monthName() {
  const value = new Intl.DateTimeFormat('de-AT', { month: 'long' }).format(new Date());
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Guten Morgen';
  if (hour < 17) return 'Guten Tag';
  return 'Guten Abend';
}

type MonthlyRow = {
  goal: Goal;
  planned: number;
  saved: number;
  covered: number;
  remaining: number;
};

function SmallGoalIcon({ goal }: { goal: Goal }) {
  return (
    <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
      <Symbol name={goal.icon} size={13} color={goal.color} />
    </View>
  );
}

export default function HomeScreen() {
  const store = useAppStore();
  const goal = store.primaryGoal;
  const coach = goal ? buildSavingCoach(goal, store.contributions, store.streak) : null;
  const [saving, setSaving] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<number | null>(null);

  const monthlyRows = useMemo<MonthlyRow[]>(() => {
    return store.goals
      .filter((item) => item.mode === 'recurring')
      .map((item) => {
        const planned = Math.max(0, item.recurringAmount ?? item.targetAmount);
        const saved = Math.max(0, store.contributions.reduce((sum, contribution) => {
          if (contribution.sourceType !== 'goal' || contribution.sourceId !== item.id || !isCurrentMonth(contribution.createdAt)) return sum;
          return sum + contribution.amount;
        }, 0));
        const covered = Math.min(planned, saved);
        return { goal: item, planned, saved, covered, remaining: Math.max(0, planned - covered) };
      });
  }, [store.contributions, store.goals]);

  const monthPlanned = monthlyRows.reduce((sum, row) => sum + row.planned, 0);
  const monthCovered = monthlyRows.reduce((sum, row) => sum + row.covered, 0);
  const monthRemaining = monthlyRows.reduce((sum, row) => sum + row.remaining, 0);
  const monthProgress = monthPlanned > 0 ? Math.min(1, monthCovered / monthPlanned) : 0;
  const openRows = monthlyRows.filter((row) => row.remaining > 0).sort((a, b) => b.remaining - a.remaining);
  const monthLabel = monthName();
  const changeVsPrevious = store.periodMetrics.previousMonth > 0
    ? ((store.periodMetrics.month - store.periodMetrics.previousMonth) / store.periodMetrics.previousMonth) * 100
    : store.periodMetrics.month > 0 ? 100 : 0;

  const smartSave = async () => {
    if (!goal || !coach || coach.suggestedAmount <= 0 || saving) return;
    setSaving(true);
    try {
      await store.saveToGoal(goal.id, coach.suggestedAmount, 'SparFlow Empfehlung');
      setLastSuccess(coach.suggestedAmount);
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Betrag konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  if (store.loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 8, paddingBottom: 106, gap: 13 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <HeaderIconButton name="line.3.horizontal" onPress={() => router.push('/actions')} />
        <HeaderIconButton name="bell" onPress={() => Alert.alert('Benachrichtigungen', 'SparFlow erinnert dich nur mit den von dir aktivierten lokalen Funktionen.')} />
      </View>

      <View style={{ gap: 2, paddingHorizontal: 1 }}>
        <Text selectable style={{ color: colors.text, fontSize: 23, fontWeight: '800', letterSpacing: -0.6 }}>{greeting()}! 👋</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>Schön, dass du heute hier bist.</Text>
      </View>

      {store.error ? (
        <Pressable onPress={() => void store.reload()} style={({ pressed }) => ({ minHeight: 42, borderRadius: 13, paddingHorizontal: 12, backgroundColor: colors.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.72 : 1 })}>
          <Symbol name="exclamationmark.triangle.fill" size={14} color={colors.danger} />
          <Text style={{ flex: 1, color: colors.danger, fontSize: 12, fontWeight: '800' }}>Daten neu laden</Text>
        </Pressable>
      ) : null}

      {lastSuccess != null ? (
        <Pressable onPress={() => setLastSuccess(null)} style={({ pressed }) => ({ borderRadius: 15, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: `${colors.success}18`, flexDirection: 'row', alignItems: 'center', gap: 9, opacity: pressed ? 0.72 : 1 })}>
          <Symbol name="checkmark.circle.fill" size={17} color={colors.success} />
          <Text style={{ color: colors.success, fontSize: 12.5, fontWeight: '800' }}>+{formatMoney(lastSuccess)} gespeichert</Text>
        </Pressable>
      ) : null}

      <NeonCard style={{ padding: 16, minHeight: 145 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>Gesamt gespart</Text>
            <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.9, fontVariant: ['tabular-nums'] }}>{formatMoney(store.totalSaved)}</Text>
            <Text style={{ color: changeVsPrevious >= 0 ? colors.success : colors.danger, fontSize: 10.5, fontWeight: '700' }}>{changeVsPrevious >= 0 ? '+' : ''}{Math.round(changeVsPrevious)} % diesen Monat</Text>
          </View>
          <View style={{ width: 94, paddingTop: 8 }}>
            <MiniTrend values={store.monthlyData.map((item) => item.value)} color={colors.primary} height={58} />
          </View>
        </View>
      </NeonCard>

      <Pressable onPress={() => router.push('/month-details')} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
        <NeonCard style={{ padding: 15 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <ProgressRing value={monthProgress} color={colors.primary} size={68} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{monthLabel} Überblick</Text>
              <Text selectable style={{ color: colors.text, fontSize: 23, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(monthCovered)}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>von {formatMoney(monthPlanned)} geplant</Text>
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>Noch {formatMoney(monthRemaining)} diesen Monat</Text>
            </View>
            <Symbol name="chevron.right" size={11} color={colors.textMuted} />
          </View>
        </NeonCard>
      </Pressable>

      {monthPlanned > 0 ? (
        <NeonCard style={{ padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Was fehlt noch?</Text>
              <Text style={{ color: monthRemaining > 0 ? colors.warning : colors.success, fontSize: 11, fontWeight: '700' }}>{monthRemaining > 0 ? `Noch ${formatMoney(monthRemaining)} diesen Monat` : 'Alles für diesen Monat geschafft'}</Text>
            </View>
            <Symbol name="arrow.up.right" size={11} color={colors.textMuted} />
          </View>

          <View style={{ gap: 3 }}>
            {openRows.slice(0, 3).map((row) => (
              <Pressable
                key={row.goal.id}
                onPress={() => router.push({ pathname: '/save', params: { goalId: row.goal.id, mode: 'save' } })}
                style={({ pressed }) => ({ minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, opacity: pressed ? 0.65 : 1 })}
              >
                <SmallGoalIcon goal={row.goal} />
                <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 11.5, fontWeight: '700' }}>{row.goal.title}</Text>
                <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>{formatMoney(row.remaining)}</Text>
                <Symbol name="chevron.right" size={9} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </NeonCard>
      ) : null}

      {goal && coach && coach.suggestedAmount > 0 ? (
        <NeonCard style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>Heute empfohlen</Text>
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>Spare heute</Text>
              <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(coach.suggestedAmount)}</Text>
              <Text numberOfLines={1} style={{ color: colors.cyan, fontSize: 10 }}>Für {goal.title}</Text>
            </View>
            <NeonAction icon="plus" label={saving ? 'Speichert …' : 'Jetzt sparen'} onPress={() => void smartSave()} color={colors.primary} />
          </View>
        </NeonCard>
      ) : null}

      <Pressable onPress={() => router.push('/(tabs)/goals')} style={({ pressed }) => ({ alignSelf: 'center', opacity: pressed ? 0.55 : 1, paddingVertical: 4 })}>
        <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>Alle Ziele anzeigen</Text>
      </Pressable>
    </ScrollView>
  );
}
