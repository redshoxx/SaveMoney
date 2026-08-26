import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { Challenge, Goal } from '@/types/models';
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
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  suggestedDate: Date | null;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateInput(date: Date) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function timeInput(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function futureDate(days: number, hour = 9) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  value.setHours(hour, 0, 0, 0);
  if (value.getTime() <= Date.now() + 60_000) value.setDate(value.getDate() + 1);
  return value;
}

function parseDateTime(dateValue: string, timeValue: string) {
  const dateMatch = dateValue.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  const timeMatch = timeValue.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;
  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const result = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) return null;
  return result;
}

function reminderLabel(value: string) {
  return new Intl.DateTimeFormat('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function goalSuggestedDate(goal: Goal) {
  if (goal.targetDate) {
    const value = new Date(`${goal.targetDate}T09:00:00`);
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

function ReminderEditor({
  target,
  existing,
  onClose,
  onChanged,
}: {
  target: ReminderTarget | null;
  existing: ScheduledSparFlowReminder | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const initial = existing ? new Date(existing.scheduledFor) : target?.suggestedDate ?? futureDate(1);
  const [dateText, setDateText] = useState(dateInput(initial));
  const [timeText, setTimeText] = useState(timeInput(initial));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = existing ? new Date(existing.scheduledFor) : target?.suggestedDate ?? futureDate(1);
    setDateText(dateInput(next));
    setTimeText(timeInput(next));
  }, [existing, target]);

  if (!target) return null;

  const setPreset = (value: Date) => {
    setDateText(dateInput(value));
    setTimeText(timeInput(value));
  };

  const save = async () => {
    const date = parseDateTime(dateText, timeText);
    if (!date || date.getTime() <= Date.now() + 3_000) {
      Alert.alert('Erinnerung', 'Bitte wähle einen Zeitpunkt in der Zukunft.');
      return;
    }

    setSaving(true);
    try {
      await scheduleLocalReminder({
        kind: target.kind,
        sourceId: target.id,
        title: target.kind === 'goal' ? `Sparziel: ${target.title}` : `Challenge: ${target.title}`,
        body: target.kind === 'goal' ? 'Zeit für einen kleinen Schritt zu deinem Sparziel.' : 'Deine Challenge wartet auf den nächsten Schritt.',
        date,
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
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'center', padding: 20 }}>
        <View style={{ borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: `${target.color}18`, alignItems: 'center', justifyContent: 'center' }}>
              <Symbol name={target.icon} size={17} color={target.color} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{target.title}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Wann soll SparFlow dich erinnern?</Text>
            </View>
            <Pressable onPress={onClose} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
              <Symbol name="xmark" size={13} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={{ gap: 7 }}>
            <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Schnell auswählen</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {[
                ['Morgen', futureDate(1)],
                ['In 3 Tagen', futureDate(3)],
                ['In 1 Woche', futureDate(7)],
              ].map(([label, value]) => (
                <Pressable key={String(label)} onPress={() => setPreset(value as Date)} style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}>
                  <Text style={{ color: colors.text, fontSize: 10.5, fontWeight: '700' }}>{String(label)}</Text>
                </Pressable>
              ))}
              {target.suggestedDate ? (
                <Pressable onPress={() => setPreset(target.suggestedDate as Date)} style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}>
                  <Text style={{ color: colors.primaryDark, fontSize: 10.5, fontWeight: '800' }}>Passender Termin</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={{ gap: 7 }}>
            <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Oder genau festlegen</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={dateText} onChangeText={setDateText} placeholder="TT.MM.JJJJ" placeholderTextColor={colors.textMuted} style={{ flex: 1, minHeight: 48, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text, fontSize: 16 }} />
              <TextInput value={timeText} onChangeText={setTimeText} placeholder="09:00" placeholderTextColor={colors.textMuted} style={{ width: 100, minHeight: 48, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text, fontSize: 16 }} />
            </View>
          </View>

          {existing ? <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Aktuell: {reminderLabel(existing.scheduledFor)}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {existing ? (
              <Pressable disabled={saving} onPress={() => void remove()} style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center', opacity: saving || pressed ? 0.55 : 1 })}>
                <Text selectable style={{ color: colors.danger, fontWeight: '800' }}>Entfernen</Text>
              </Pressable>
            ) : null}
            <Pressable disabled={saving} onPress={() => void save()} style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: saving || pressed ? 0.65 : 1 })}>
              <Text selectable style={{ color: '#FFFFFF', fontWeight: '800' }}>{saving ? 'Speichert …' : existing ? 'Änderung speichern' : 'Erinnerung setzen'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReminderRow({ target, reminder, onPress }: { target: ReminderTarget; reminder: ScheduledSparFlowReminder | null; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8, opacity: pressed ? 0.65 : 1 })}>
      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: `${target.color}18`, alignItems: 'center', justifyContent: 'center' }}>
        <Symbol name={target.icon} size={17} color={target.color} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>{target.title}</Text>
        <Text selectable numberOfLines={1} style={{ color: reminder ? colors.primaryDark : colors.textMuted, fontSize: 10.5 }}>
          {reminder ? `Erinnerung: ${reminderLabel(reminder.scheduledFor)}` : target.subtitle}
        </Text>
      </View>
      <View style={{ minWidth: 80, minHeight: 38, paddingHorizontal: 10, borderRadius: 12, backgroundColor: reminder ? colors.primarySoft : colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Symbol name={reminder ? 'bell.fill' : 'bell'} size={12} color={reminder ? colors.primaryDark : colors.textMuted} />
        <Text selectable style={{ color: reminder ? colors.primaryDark : colors.textMuted, fontSize: 10, fontWeight: '800' }}>{reminder ? 'Ändern' : 'Setzen'}</Text>
      </View>
    </Pressable>
  );
}

export default function RemindersScreen() {
  const store = useAppStore();
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const [scheduled, setScheduled] = useState<ScheduledSparFlowReminder[]>([]);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [target, setTarget] = useState<ReminderTarget | null>(null);
  const [openedParamId, setOpenedParamId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [items, granted] = await Promise.all([
      listScheduledSparFlowReminders(),
      notificationPermissionGranted(),
    ]);
    setScheduled(items);
    setPermission(granted);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const goalTargets: ReminderTarget[] = store.goals
    .filter((goal) => goal.mode === 'recurring' || goal.savedAmount < goal.targetAmount)
    .map((goal) => ({
      kind: 'goal',
      id: goal.id,
      title: goal.title,
      subtitle: goal.mode === 'recurring' ? 'Monatliche Rücklage' : 'Sparziel',
      color: goal.color,
      icon: goal.icon,
      suggestedDate: goalSuggestedDate(goal),
    }));

  const challengeTargets: ReminderTarget[] = store.challenges
    .filter((challenge) => !challenge.completedAt)
    .map((challenge) => ({
      kind: 'challenge',
      id: challenge.id,
      title: challenge.title,
      subtitle: 'Aktive Challenge',
      color: challenge.color,
      icon: challenge.icon,
      suggestedDate: challengeSuggestedDate(challenge),
    }));

  useEffect(() => {
    if (!params.id || openedParamId === params.id) return;
    const source = params.kind === 'challenge' ? challengeTargets : goalTargets;
    const match = source.find((item) => item.id === params.id);
    if (match) {
      setTarget(match);
      setOpenedParamId(params.id);
    }
  }, [challengeTargets, goalTargets, openedParamId, params.id, params.kind]);

  const existingFor = (kind: 'goal' | 'challenge', id: string) => scheduled.find((item) => item.kind === kind && item.sourceId === id) ?? null;

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted);
    if (!granted) {
      Alert.alert('Benachrichtigungen sind aus', 'Du kannst sie jederzeit in den iPhone-Einstellungen für SparFlow aktivieren.', [
        { text: 'Später', style: 'cancel' },
        { text: 'Einstellungen öffnen', onPress: () => void Linking.openSettings() },
      ]);
    }
  };

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 14, paddingBottom: 40, gap: 18 }}>
        <View style={{ gap: 5 }}>
          <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>Du entscheidest, wann SparFlow dich erinnert.</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 12, lineHeight: 17 }}>Erinnerungen sind optional. Setze nur dort eine Glocke, wo sie dir wirklich hilft.</Text>
        </View>

        {permission === false ? (
          <View style={{ borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 13, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <Symbol name="bell.slash" size={16} color={colors.warning} />
              <Text selectable style={{ flex: 1, color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Benachrichtigungen sind noch nicht aktiviert</Text>
            </View>
            <Pressable onPress={() => void enableNotifications()} style={({ pressed }) => ({ minHeight: 44, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.68 : 1 })}>
              <Text selectable style={{ color: '#FFFFFF', fontWeight: '800' }}>Benachrichtigungen aktivieren</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
          <View style={{ gap: 2 }}>
            <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Sparziele</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Zum Beispiel am Zahltag oder kurz vor deinem Zieltermin.</Text>
          </View>
          <View style={{ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
            {goalTargets.length ? goalTargets.map((item, index) => (
              <View key={item.id}>
                {index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 51 }} /> : null}
                <ReminderRow target={item} reminder={existingFor('goal', item.id)} onPress={() => setTarget(item)} />
              </View>
            )) : <Text selectable style={{ color: colors.textMuted, fontSize: 11.5, paddingVertical: 18, textAlign: 'center' }}>Keine offenen Sparziele.</Text>}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ gap: 2 }}>
            <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Challenges</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Eine Erinnerung reicht meistens, um im Rhythmus zu bleiben.</Text>
          </View>
          <View style={{ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
            {challengeTargets.length ? challengeTargets.map((item, index) => (
              <View key={item.id}>
                {index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 51 }} /> : null}
                <ReminderRow target={item} reminder={existingFor('challenge', item.id)} onPress={() => setTarget(item)} />
              </View>
            )) : <Text selectable style={{ color: colors.textMuted, fontSize: 11.5, paddingVertical: 18, textAlign: 'center' }}>Keine aktive Challenge.</Text>}
          </View>
        </View>
      </ScrollView>

      <ReminderEditor target={target} existing={target ? existingFor(target.kind, target.id) : null} onClose={() => setTarget(null)} onChanged={reload} />
    </>
  );
}
