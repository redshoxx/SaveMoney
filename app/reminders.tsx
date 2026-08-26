import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { Challenge, Goal } from '@/types/models';
import { formatEntityNumber } from '@/utils/entity-number';
import {
  cancelRemindersForSource,
  listScheduledSparFlowReminders,
  notificationPermissionGranted,
  requestNotificationPermission,
  scheduleLocalReminder,
  type ScheduledSparFlowReminder,
} from '@/utils/local-notifications';

type ReminderTarget = {
  kind: 'goal' | 'challenge';
  id: string;
  displayNumber: number;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  suggestedDate: Date | null;
};

function futureDate(days: number, hour = 9) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  value.setHours(hour, 0, 0, 0);
  if (value.getTime() <= Date.now() + 60_000) value.setDate(value.getDate() + 1);
  return value;
}

function mergeDatePart(current: Date, next: Date) {
  const value = new Date(current);
  value.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
  return value;
}

function mergeTimePart(current: Date, next: Date) {
  const value = new Date(current);
  value.setHours(next.getHours(), next.getMinutes(), 0, 0);
  return value;
}

function reminderLabel(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function goalSuggestedDate(goal: Goal) {
  if (goal.targetDate) {
    const normalized = goal.targetDate.slice(0, 10);
    const value = new Date(`${normalized}T09:00:00`);
    if (Number.isFinite(value.getTime()) && value.getTime() > Date.now()) return value;
  }
  if (goal.mode === 'recurring' && goal.recurringDay) {
    const now = new Date();
    const value = new Date(now.getFullYear(), now.getMonth(), goal.recurringDay, 9, 0, 0, 0);
    if (value.getTime() <= Date.now()) value.setMonth(value.getMonth() + 1);
    return value;
  }
  return null;
}

function challengeSuggestedDate(challenge: Challenge) {
  if (!challenge.durationDays) return null;
  const value = new Date(challenge.createdAt);
  value.setDate(value.getDate() + challenge.durationDays);
  value.setHours(9, 0, 0, 0);
  return value.getTime() > Date.now() ? value : null;
}

function ReminderEditor({ target, existing, onClose, onChanged }: { target: ReminderTarget | null; existing: ScheduledSparFlowReminder | null; onClose: () => void; onChanged: () => Promise<void> }) {
  const initial = existing ? new Date(existing.scheduledFor) : target?.suggestedDate ?? futureDate(1);
  const [selectedDate, setSelectedDate] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = existing ? new Date(existing.scheduledFor) : target?.suggestedDate ?? futureDate(1);
    setSelectedDate(next);
  }, [existing, target]);

  if (!target) return null;

  const setPreset = (value: Date) => setSelectedDate(new Date(value));

  const save = async () => {
    if (!Number.isFinite(selectedDate.getTime()) || selectedDate.getTime() <= Date.now() + 3_000) {
      Alert.alert('Erinnerung', 'Bitte wähle einen Zeitpunkt in der Zukunft.');
      return;
    }
    setSaving(true);
    try {
      await scheduleLocalReminder({
        kind: target.kind,
        sourceId: target.id,
        title: target.kind === 'goal' ? `Sparziel ${formatEntityNumber(target.displayNumber)}: ${target.title}` : `Challenge ${formatEntityNumber(target.displayNumber)}: ${target.title}`,
        body: target.kind === 'goal' ? 'Zeit für einen kleinen Schritt zu deinem Sparziel.' : 'Deine Challenge wartet auf den nächsten Schritt.',
        date: selectedDate,
        url: target.kind === 'goal' ? '/(tabs)/goals' : '/(tabs)/challenges',
      });
      await onChanged();
      onClose();
    } catch (error) {
      Alert.alert('Benachrichtigung', error instanceof Error ? error.message : 'Die Erinnerung konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await cancelRemindersForSource(target.kind, target.id);
      await onChanged();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 }}>
          <View style={{ width: 42, height: 5, borderRadius: 999, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 }} />
          <ScrollView contentContainerStyle={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: `${target.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={target.icon} size={17} color={target.color} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{target.title}</Text>
                <Text selectable style={{ color: colors.primaryDark, fontSize: 10.5, fontWeight: '800' }}>{formatEntityNumber(target.displayNumber)}</Text>
              </View>
              <Pressable accessibilityLabel="Erinnerung schließen" onPress={onClose} style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.62 : 1 })}><Symbol name="xmark" size={13} color={colors.textMuted} /></Pressable>
            </View>

            <View style={{ gap: 7 }}>
              <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Schnell wählen</Text>
              <View style={{ flexDirection: 'row', gap: 7 }}>
                {[
                  ['Morgen', futureDate(1)],
                  ['3 Tage', futureDate(3)],
                  ['1 Woche', futureDate(7)],
                ].map(([label, value]) => (
                  <Pressable key={String(label)} onPress={() => setPreset(value as Date)} style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
                    <Text selectable style={{ color: colors.text, fontSize: 10.5, fontWeight: '800' }}>{String(label)}</Text>
                  </Pressable>
                ))}
              </View>
              {target.suggestedDate ? (
                <Pressable onPress={() => setPreset(target.suggestedDate as Date)} style={({ pressed }) => ({ minHeight: 44, borderRadius: 12, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: pressed ? 0.7 : 1 })}>
                  <Symbol name="sparkles" size={12} color={colors.primaryDark} />
                  <Text selectable style={{ color: colors.primaryDark, fontSize: 11, fontWeight: '900' }}>Passenden Termin übernehmen</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={{ gap: 8 }}>
              <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Datum und Uhrzeit</Text>
              <View style={{ borderRadius: 16, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
                <View style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}><Symbol name="calendar" size={14} color={colors.primaryDark} /></View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Datum</Text>
                    <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Antippen und im Kalender auswählen</Text>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={process.env.EXPO_OS === 'ios' ? 'compact' : 'default'}
                    minimumDate={new Date()}
                    locale="de-AT"
                    accentColor={colors.primary}
                    onValueChange={(_, next) => {
                      if (next) setSelectedDate((current) => mergeDatePart(current, next));
                    }}
                    style={{ minWidth: 116 }}
                  />
                </View>
                <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 56 }} />
                <View style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}><Symbol name="clock.fill" size={14} color={colors.primaryDark} /></View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Uhrzeit</Text>
                    <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Antippen und Uhrzeit auswählen</Text>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="time"
                    display={process.env.EXPO_OS === 'ios' ? 'compact' : 'default'}
                    locale="de-AT"
                    accentColor={colors.primary}
                    onValueChange={(_, next) => {
                      if (next) setSelectedDate((current) => mergeTimePart(current, next));
                    }}
                    style={{ minWidth: 92 }}
                  />
                </View>
              </View>
              <View style={{ minHeight: 45, borderRadius: 13, backgroundColor: colors.primarySoft, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Symbol name="bell.fill" size={12} color={colors.primaryDark} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '800' }}>ERINNERUNG</Text>
                  <Text selectable style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>{reminderLabel(selectedDate.toISOString())}</Text>
                </View>
              </View>
            </View>

            {existing ? <Text selectable style={{ color: colors.textMuted, fontSize: 10 }}>Bisher: {reminderLabel(existing.scheduledFor)}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {existing ? (
                <Pressable disabled={saving} onPress={() => void remove()} style={({ pressed }) => ({ flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center', opacity: saving || pressed ? 0.58 : 1 })}>
                  <Text selectable style={{ color: colors.danger, fontWeight: '800', fontSize: 12.5 }}>Entfernen</Text>
                </Pressable>
              ) : null}
              <Pressable disabled={saving} onPress={() => void save()} style={({ pressed }) => ({ flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, opacity: saving || pressed ? 0.72 : 1 })}>
                <Text selectable numberOfLines={1} adjustsFontSizeToFit style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>{saving ? 'Speichert …' : existing ? 'Änderung speichern' : 'Erinnerung setzen'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ReminderRow({ target, reminder, onPress, index }: { target: ReminderTarget; reminder: ScheduledSparFlowReminder | null; onPress: () => void; index: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(180).delay(Math.min(index, 8) * 25)} layout={LinearTransition.duration(180)}>
      <Pressable onPress={onPress} style={({ pressed }) => ({ minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
        <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: `${target.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={target.icon} size={17} color={target.color} /></View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>{target.title}</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>{formatEntityNumber(target.displayNumber)} · {reminder ? reminderLabel(reminder.scheduledFor) : target.subtitle}</Text>
        </View>
        <View style={{ minWidth: 68, minHeight: 36, paddingHorizontal: 9, borderRadius: 11, backgroundColor: reminder ? colors.primarySoft : colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Symbol name={reminder ? 'bell.fill' : 'bell'} size={11} color={reminder ? colors.primaryDark : colors.textMuted} />
          <Text selectable style={{ color: reminder ? colors.primaryDark : colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>{reminder ? 'Ändern' : 'Setzen'}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function RemindersScreen() {
  const store = useAppStore();
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const [scheduled, setScheduled] = useState<ScheduledSparFlowReminder[]>([]);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [target, setTarget] = useState<ReminderTarget | null>(null);
  const [openedParamKey, setOpenedParamKey] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [items, granted] = await Promise.all([listScheduledSparFlowReminders(), notificationPermissionGranted()]);
    setScheduled(items);
    setPermission(granted);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const targets = useMemo<ReminderTarget[]>(() => [
    ...store.goals
      .filter((goal) => goal.mode === 'recurring' || goal.savedAmount < goal.targetAmount)
      .map((goal) => ({ kind: 'goal' as const, id: goal.id, displayNumber: goal.displayNumber, title: goal.title, subtitle: goal.mode === 'recurring' ? 'Monatliche Rücklage' : 'Sparziel', color: goal.color, icon: goal.icon, suggestedDate: goalSuggestedDate(goal) })),
    ...store.challenges
      .filter((challenge) => !challenge.completedAt)
      .map((challenge) => ({ kind: 'challenge' as const, id: challenge.id, displayNumber: challenge.displayNumber, title: challenge.title, subtitle: 'Aktive Challenge', color: challenge.color, icon: challenge.icon, suggestedDate: challengeSuggestedDate(challenge) })),
  ], [store.challenges, store.goals]);

  useEffect(() => {
    if (!params.id) return;
    const key = `${params.kind ?? 'goal'}:${params.id}`;
    if (openedParamKey === key) return;
    const match = targets.find((item) => item.id === params.id && item.kind === (params.kind === 'challenge' ? 'challenge' : 'goal'));
    if (match) {
      setTarget(match);
      setOpenedParamKey(key);
    }
  }, [openedParamKey, params.id, params.kind, targets]);

  const existingFor = (item: ReminderTarget) => scheduled.find((reminder) => reminder.kind === item.kind && reminder.sourceId === item.id) ?? null;

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted);
    if (!granted) {
      Alert.alert('Benachrichtigungen sind aus', 'Aktiviere sie in den iPhone-Einstellungen für SparPilot.', [
        { text: 'Später', style: 'cancel' },
        { text: 'Einstellungen öffnen', onPress: () => void Linking.openSettings() },
      ]);
    }
  };

  const goals = targets.filter((item) => item.kind === 'goal');
  const challenges = targets.filter((item) => item.kind === 'challenge');

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 12, paddingBottom: 36, gap: 16 }}>
        <View style={{ gap: 3 }}>
          <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>Erinnerungen</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>Nur das einstellen, woran du wirklich erinnert werden möchtest.</Text>
        </View>

        {permission === false ? (
          <Pressable onPress={() => void enableNotifications()} style={({ pressed }) => ({ borderRadius: 14, backgroundColor: colors.primarySoft, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9, opacity: pressed ? 0.72 : 1 })}>
            <Symbol name="bell.slash" size={14} color={colors.warning} />
            <View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>Benachrichtigungen aktivieren</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Für Ziel- und Challenge-Erinnerungen erforderlich.</Text></View>
            <Symbol name="chevron.right" size={10} color={colors.textMuted} />
          </Pressable>
        ) : null}

        {targets.length === 0 ? (
          <View style={{ borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 18, alignItems: 'center', gap: 7 }}>
            <Symbol name="bell" size={21} color={colors.textMuted} />
            <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Noch nichts zum Erinnern</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 10.5, textAlign: 'center' }}>Lege zuerst ein Ziel an oder starte eine Challenge.</Text>
          </View>
        ) : null}

        {goals.length ? (
          <View style={{ gap: 7 }}>
            <Text selectable style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Sparziele</Text>
            <View style={{ borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
              {goals.map((item, index) => <ReminderRow key={item.id} target={item} reminder={existingFor(item)} index={index} onPress={() => setTarget(item)} />)}
            </View>
          </View>
        ) : null}

        {challenges.length ? (
          <View style={{ gap: 7 }}>
            <Text selectable style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Challenges</Text>
            <View style={{ borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
              {challenges.map((item, index) => <ReminderRow key={item.id} target={item} reminder={existingFor(item)} index={goals.length + index} onPress={() => setTarget(item)} />)}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <ReminderEditor target={target} existing={target ? existingFor(target) : null} onClose={() => setTarget(null)} onChanged={reload} />
    </>
  );
}
