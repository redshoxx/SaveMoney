import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { GlowIcon, NeonAction, NeonCard, NeonProgress, ProfileButton, PulseOrb, ScreenHeader } from '@/components/neon-ui';
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

type MonthlyRow = {
  goal: Goal;
  planned: number;
  saved: number;
  covered: number;
  remaining: number;
};

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
  const monthMax = Math.max(1, ...store.monthlyData.map((item) => Math.abs(item.value)));
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
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 14, paddingBottom: 104, gap: 13 }}>
      <ScreenHeader title="SparFlow" subtitle="Dein finanzieller Flow für heute." right={<ProfileButton />} />

      {store.error ? (
        <Pressable onPress={() => void store.reload()} style={({ pressed }) => ({ minHeight: 44, borderRadius: 13, paddingHorizontal: 12, backgroundColor: colors.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.72 : 1 })}>
          <Symbol name="exclamationmark.triangle.fill" size={15} color={colors.danger} />
          <Text style={{ flex: 1, color: colors.danger, fontSize: 12, fontWeight: '800' }}>Daten neu laden</Text>
        </Pressable>
      ) : null}

      {lastSuccess != null ? (
        <NeonCard accent={colors.success} glow style={{ paddingVertical: 11 }}>
          <Pressable onPress={() => setLastSuccess(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <GlowIcon name="checkmark" color={colors.success} size={14} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>+{formatMoney(lastSuccess)} geschafft</Text>
              <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Weiter so – dein Fortschritt wurde aktualisiert.</Text>
            </View>
          </Pressable>
        </NeonCard>
      ) : null}

      <NeonCard accent={colors.purple} glow style={{ padding: 16, gap: 13 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <PulseOrb color={colors.magenta} />
          <Text style={{ flex: 1, color: colors.textMuted, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.7 }}>GESAMTERSPARNIS</Text>
          <View style={{ borderRadius: 999, backgroundColor: `${colors.success}18`, paddingHorizontal: 8, paddingVertical: 5 }}>
            <Text style={{ color: colors.success, fontSize: 10, fontWeight: '900' }}>{changeVsPrevious >= 0 ? '+' : ''}{Math.round(changeVsPrevious)}% Monat</Text>
          </View>
        </View>
        <Text selectable style={{ color: colors.text, fontSize: 38, lineHeight: 42, fontWeight: '900', letterSpacing: -1.4, fontVariant: ['tabular-nums'] }}>{formatMoney(store.totalSaved)}</Text>
        <View style={{ height: 62, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
          {store.monthlyData.map((item, index) => {
            const height = Math.max(8, Math.min(58, (Math.abs(item.value) / monthMax) * 58));
            const accent = index === store.monthlyData.length - 1 ? colors.magenta : index >= store.monthlyData.length - 3 ? colors.blue : colors.primary;
            return (
              <View key={`${item.label}-${index}`} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View style={{ width: '72%', height, borderRadius: 999, backgroundColor: accent, opacity: 0.78, boxShadow: `0 0 10px ${accent}` }} />
                <Text style={{ color: colors.textMuted, fontSize: 8 }}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </NeonCard>

      <NeonCard accent={colors.blue}>
        <Pressable onPress={() => router.push('/(tabs)/goals')} style={({ pressed }) => ({ gap: 11, opacity: pressed ? 0.74 : 1 })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <GlowIcon name="calendar" color={colors.blue} size={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Monatsübersicht · {monthLabel}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{monthPlanned > 0 ? `${formatMoney(monthCovered)} von ${formatMoney(monthPlanned)} geplant` : 'Noch keine Monatsrücklage geplant'}</Text>
            </View>
            {monthPlanned > 0 ? <Text style={{ color: colors.blue, fontSize: 15, fontWeight: '900' }}>{Math.round(monthProgress * 100)}%</Text> : null}
            <Symbol name="chevron.right" size={11} color={colors.textMuted} />
          </View>
          {monthPlanned > 0 ? <NeonProgress value={monthProgress} color={colors.blue} height={5} /> : null}
        </Pressable>
      </NeonCard>

      {monthPlanned > 0 ? (
        <NeonCard accent={monthRemaining > 0 ? colors.purple : colors.success} glow={monthRemaining > 0}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <GlowIcon name={monthRemaining > 0 ? 'sparkles' : 'checkmark.circle.fill'} color={monthRemaining > 0 ? colors.purple : colors.success} size={16} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Was fehlt noch?</Text>
              <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Deine nächsten Schritte diesen Monat</Text>
            </View>
            {monthRemaining > 0 ? <Text style={{ color: colors.primaryDark, fontSize: 17, fontWeight: '900' }}>{formatMoney(monthRemaining)}</Text> : null}
          </View>
          {monthRemaining > 0 ? (
            <View style={{ gap: 6 }}>
              {openRows.slice(0, 3).map((row, index) => {
                const accent = [colors.purple, colors.cyan, colors.orange][index % 3];
                return (
                  <Pressable key={row.goal.id} onPress={() => router.push({ pathname: '/save', params: { goalId: row.goal.id, mode: 'save' } })} style={({ pressed }) => ({ minHeight: 40, borderRadius: 11, paddingHorizontal: 10, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.68 : 1 })}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: accent, boxShadow: `0 0 9px ${accent}` }} />
                    <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 12, fontWeight: '800' }}>{row.goal.title}</Text>
                    <Text style={{ color: accent, fontSize: 12, fontWeight: '900' }}>{formatMoney(row.remaining)}</Text>
                    <Symbol name="chevron.right" size={9} color={colors.textMuted} />
                  </Pressable>
                );
              })}
            </View>
          ) : <Text style={{ color: colors.success, fontSize: 13, fontWeight: '900' }}>Monat geschafft. Alle Rücklagen sind abgedeckt.</Text>}
        </NeonCard>
      ) : null}

      {goal && coach && coach.suggestedAmount > 0 ? (
        <NeonCard accent={colors.magenta} glow>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <GlowIcon name="sparkles" color={colors.magenta} size={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.5 }}>HEUTE EMPFOHLEN</Text>
              <Text numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{goal.title}</Text>
            </View>
            <Text style={{ color: colors.magenta, fontSize: 20, fontWeight: '900' }}>{formatMoney(coach.suggestedAmount)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            <NeonAction icon="plus" label={saving ? 'Speichert …' : 'Jetzt sparen'} onPress={() => void smartSave()} color={colors.magenta} />
            <NeonAction icon="slider.horizontal.3" label="Ändern" onPress={() => router.push({ pathname: '/save', params: { goalId: goal.id, mode: 'save' } })} muted />
          </View>
        </NeonCard>
      ) : null}
    </ScrollView>
  );
}
