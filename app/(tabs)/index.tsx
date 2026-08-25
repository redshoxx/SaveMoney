import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { buildSavingCoach } from '@/utils/saving-coach';
import { formatMoney } from '@/utils/money';

export default function HomeScreen() {
  const store = useAppStore();
  const goal = store.primaryGoal;
  const coach = goal ? buildSavingCoach(goal, store.contributions, store.streak) : null;
  const dueRule = store.dueRules[0];
  const [saving, setSaving] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<number | null>(null);

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

  const applyDueRule = async () => {
    if (!dueRule) return;
    try {
      await store.applyRule(dueRule.id);
      setLastSuccess(dueRule.amount);
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Sparregel konnte nicht angewendet werden.');
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
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 96, gap: 12 }}
    >
      {store.error ? (
        <Pressable accessibilityRole="button" onPress={() => void store.reload()} style={({ pressed }) => ({ minHeight: 44, borderRadius: 13, paddingHorizontal: 13, backgroundColor: colors.dangerSoft, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.72 : 1 })}>
          <Symbol name="exclamationmark.triangle.fill" size={15} color={colors.danger} />
          <Text style={{ flex: 1, color: colors.danger, fontSize: 12, fontWeight: '800' }}>Daten konnten nicht geladen werden · erneut versuchen</Text>
        </Pressable>
      ) : null}

      {lastSuccess != null ? (
        <Pressable onPress={() => setLastSuccess(null)} style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, paddingHorizontal: 13, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.8 : 1 })}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Symbol name="checkmark" size={14} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.primaryDark, fontSize: 13, fontWeight: '900' }}>+{formatMoney(lastSuccess)} geschafft</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Gespeichert · antippen zum Ausblenden</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={{ borderRadius: 24, padding: 19, backgroundColor: '#173E2B', gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text style={{ color: '#B9DCC7', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }}>DEIN SPARSTAND</Text>
          <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 10.5, fontWeight: '800' }}>Level {store.level}</Text>
          </View>
        </View>
        <Text selectable style={{ color: '#FFFFFF', fontSize: 40, lineHeight: 44, fontWeight: '900', letterSpacing: -1.6, fontVariant: ['tabular-nums'] }}>
          {formatMoney(store.totalSaved)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 18 }}>
          <View style={{ gap: 2 }}>
            <Text style={{ color: '#9EC5AD', fontSize: 10, fontWeight: '800' }}>DIESEN MONAT</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{formatMoney(store.periodMetrics.month)}</Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text style={{ color: '#9EC5AD', fontSize: 10, fontWeight: '800' }}>SERIE</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{store.streak} Tage</Text>
          </View>
        </View>
      </View>

      {goal && coach ? (
        <View style={{ borderRadius: 20, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 13 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Symbol name="sparkles" size={18} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.5 }}>HEUTE EMPFOHLEN</Text>
              <Text style={{ color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.6 }}>{coach.suggestedAmount > 0 ? formatMoney(coach.suggestedAmount) : 'Geschafft'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text style={{ color: colors.primaryDark, fontSize: 13, fontWeight: '900' }}>{coach.momentum}%</Text>
              <Text style={{ color: colors.textMuted, fontSize: 9.5 }}>Momentum</Text>
            </View>
          </View>

          <View style={{ gap: 7 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: '900' }}>{goal.title}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>{Math.round(coach.progress * 100)}%</Text>
            </View>
            <ProgressBar value={coach.progress} color={goal.color} height={7} />
            <Text style={{ color: colors.textMuted, fontSize: 11, lineHeight: 16 }}>{coach.message}</Text>
          </View>

          {coach.suggestedAmount > 0 ? (
            <View style={{ gap: 8 }}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={() => void smartSave()} style={({ pressed }) => ({ minHeight: 50, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.55 : pressed ? 0.76 : 1 })}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Symbol name="plus.circle.fill" size={17} color="#FFFFFF" />}
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>{saving ? 'Speichern …' : `${formatMoney(coach.suggestedAmount)} sparen`}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/save', params: { goalId: goal.id, mode: 'save' } })} style={({ pressed }) => ({ minHeight: 42, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
                <Text style={{ color: colors.primaryDark, fontSize: 12.5, fontWeight: '800' }}>Anderen Betrag wählen</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => router.push('/add-goal')} style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.72 : 1 })}>
              <Text style={{ color: colors.primaryDark, fontWeight: '900' }}>Nächstes Ziel anlegen</Text>
            </Pressable>
          )}

          {coach.nextMilestoneAmount > 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 10.5, textAlign: 'center' }}>Noch {formatMoney(coach.nextMilestoneAmount)} bis {coach.nextMilestonePercent}% · {coach.paceLabel}</Text>
          ) : null}
        </View>
      ) : (
        <View style={{ borderRadius: 20, padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
          <Symbol name="target" size={22} color={colors.primary} />
          <Text style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>Ein Ziel reicht für den Start.</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>Lege einen Sparbereich an. SparFlow berechnet danach automatisch einen passenden nächsten Schritt.</Text>
          <Pressable onPress={() => router.push('/add-goal')} style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, marginTop: 3, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.76 : 1 })}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Sparbereich anlegen</Text>
          </Pressable>
        </View>
      )}

      {dueRule ? (
        <Pressable accessibilityRole="button" onPress={() => void applyDueRule()} style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, paddingHorizontal: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 9, opacity: pressed ? 0.7 : 1 })}>
          <Symbol name="clock.badge.checkmark.fill" size={16} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>{dueRule.title}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Heute fällig · kein automatischer Bankeinzug</Text>
          </View>
          <Text style={{ color: colors.primaryDark, fontSize: 12.5, fontWeight: '900' }}>{formatMoney(dueRule.amount)}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
