import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { ProgressBar, Symbol } from '@/components/ui';
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
        return {
          goal: item,
          planned,
          saved,
          covered,
          remaining: Math.max(0, planned - covered),
        };
      });
  }, [store.contributions, store.goals]);

  const monthPlanned = monthlyRows.reduce((sum, row) => sum + row.planned, 0);
  const monthCovered = monthlyRows.reduce((sum, row) => sum + row.covered, 0);
  const monthRemaining = monthlyRows.reduce((sum, row) => sum + row.remaining, 0);
  const monthProgress = monthPlanned > 0 ? Math.min(1, monthCovered / monthPlanned) : 0;
  const openRows = monthlyRows.filter((row) => row.remaining > 0).sort((a, b) => b.remaining - a.remaining);
  const monthLabel = monthName();

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
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 96, gap: 13 }}
    >
      {store.error ? (
        <Pressable accessibilityRole="button" onPress={() => void store.reload()} style={({ pressed }) => ({ minHeight: 44, borderRadius: 12, paddingHorizontal: 12, backgroundColor: colors.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.72 : 1 })}>
          <Symbol name="exclamationmark.triangle.fill" size={15} color={colors.danger} />
          <Text style={{ flex: 1, color: colors.danger, fontSize: 12, fontWeight: '800' }}>Daten konnten nicht geladen werden · erneut versuchen</Text>
        </Pressable>
      ) : null}

      {lastSuccess != null ? (
        <Pressable onPress={() => setLastSuccess(null)} style={({ pressed }) => ({ minHeight: 46, borderRadius: 12, paddingHorizontal: 12, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 9, opacity: pressed ? 0.8 : 1 })}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Symbol name="checkmark" size={13} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.primaryDark, fontSize: 12.5, fontWeight: '900' }}>+{formatMoney(lastSuccess)} gespeichert</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10 }}>Antippen zum Ausblenden</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={{ paddingVertical: 3, gap: 4 }}>
        <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.7 }}>GESAMT GESPART</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <Text selectable style={{ flex: 1, color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.2, fontVariant: ['tabular-nums'] }}>
            {formatMoney(store.totalSaved)}
          </Text>
          {store.streak > 0 ? (
            <View style={{ marginBottom: 3, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.surfaceMuted }}>
              <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '800' }}>{store.streak} Tage Serie</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Monatsübersicht öffnen"
        onPress={() => router.push('/(tabs)/goals')}
        style={({ pressed }) => ({
          borderRadius: 17,
          padding: 14,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 11,
          opacity: pressed ? 0.78 : 1,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
            <Symbol name="calendar" size={16} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '900' }}>Monatsübersicht · {monthLabel}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>
              {monthPlanned > 0 ? `${formatMoney(monthCovered)} von ${formatMoney(monthPlanned)} geplant` : 'Noch keine monatliche Rücklage geplant'}
            </Text>
          </View>
          {monthPlanned > 0 ? <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{Math.round(monthProgress * 100)}%</Text> : null}
          <Symbol name="chevron.right" size={12} color={colors.textMuted} />
        </View>
        {monthPlanned > 0 ? <ProgressBar value={monthProgress} color={colors.primary} height={5} /> : null}
      </Pressable>

      {monthPlanned > 0 ? (
        <View style={{ borderRadius: 17, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 11 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Symbol name={monthRemaining > 0 ? 'list.bullet.clipboard' : 'checkmark.circle.fill'} size={15} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Was fehlt noch?</Text>
              <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{monthLabel}</Text>
            </View>
          </View>

          {monthRemaining > 0 ? (
            <>
              <View style={{ gap: 2 }}>
                <Text selectable style={{ color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.5 }}>{formatMoney(monthRemaining)}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>noch diesen Monat</Text>
              </View>

              <View style={{ gap: 6 }}>
                {openRows.slice(0, 3).map((row) => (
                  <Pressable
                    key={row.goal.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${row.goal.title}: ${formatMoney(row.remaining)} fehlen`}
                    onPress={() => router.push({ pathname: '/save', params: { goalId: row.goal.id, mode: 'save' } })}
                    style={({ pressed }) => ({
                      minHeight: 42,
                      borderRadius: 11,
                      paddingHorizontal: 11,
                      backgroundColor: colors.surfaceMuted,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 9,
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <Symbol name={row.goal.icon} size={14} color={colors.textMuted} />
                    <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 12.5, fontWeight: '800' }}>{row.goal.title}</Text>
                    <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>{formatMoney(row.remaining)}</Text>
                    <Symbol name="chevron.right" size={10} color={colors.textMuted} />
                  </Pressable>
                ))}
                {openRows.length > 3 ? <Text style={{ color: colors.textMuted, fontSize: 10.5, textAlign: 'center' }}>+ {openRows.length - 3} weitere Rücklage{openRows.length - 3 === 1 ? '' : 'n'}</Text> : null}
              </View>

              <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Plan {formatMoney(monthPlanned)} · abgedeckt {formatMoney(monthCovered)}</Text>
            </>
          ) : (
            <View style={{ gap: 3 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>Monat geschafft</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11.5, lineHeight: 17 }}>Alle geplanten monatlichen Rücklagen sind für {monthLabel} abgedeckt.</Text>
            </View>
          )}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/add-goal', params: { mode: 'recurring' } })}
          style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, paddingHorizontal: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.72 : 1 })}
        >
          <Symbol name="calendar.badge.plus" size={16} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>Monatsplanung starten</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Lege deine erste monatliche Rücklage an.</Text>
          </View>
          <Symbol name="chevron.right" size={11} color={colors.textMuted} />
        </Pressable>
      )}

      {goal && coach && coach.suggestedAmount > 0 ? (
        <View style={{ borderRadius: 16, padding: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 }}>HEUTE EMPFOHLEN</Text>
              <Text numberOfLines={1} style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>{goal.title}</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{formatMoney(coach.suggestedAmount)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            <Pressable disabled={saving} onPress={() => void smartSave()} style={({ pressed }) => ({ flex: 1, minHeight: 42, borderRadius: 11, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: saving ? 0.55 : pressed ? 0.75 : 1 })}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Symbol name="plus" size={12} color="#FFFFFF" />}
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>{saving ? 'Speichern …' : 'Sparen'}</Text>
            </Pressable>
            <Pressable onPress={() => router.push({ pathname: '/save', params: { goalId: goal.id, mode: 'save' } })} style={({ pressed }) => ({ minWidth: 112, minHeight: 42, borderRadius: 11, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '800' }}>Anderer Betrag</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
