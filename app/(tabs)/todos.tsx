import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { createTodo, deleteTodo, loadTodos, setTodoCompleted, setTodoNotification, type TodoItem } from '@/db/todos';
import { useAppStore } from '@/store/app-store';
import type { Challenge, Goal } from '@/types/models';
import {
  cancelRemindersForSource,
  cancelScheduledReminder,
  listScheduledSparFlowReminders,
  notificationPermissionGranted,
  requestNotificationPermission,
  scheduleLocalReminder,
  type ReminderKind,
  type ScheduledSparFlowReminder,
} from '@/utils/local-notifications';
import { formatMoney } from '@/utils/money';

type PageMode = 'todos' | 'goals' | 'challenges';

type ReminderTarget = {
  kind: 'goal' | 'challenge';
  id: string;
  title: string;
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

function parseDateTime(dateValue: string, timeValue: string) {
  const dateMatch = dateValue.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  const timeMatch = timeValue.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;
  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const result = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) return null;
  return result;
}

function futureDate(days: number, hour: number, minute = 0) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  value.setHours(hour, minute, 0, 0);
  if (value.getTime() <= Date.now() + 60_000) value.setDate(value.getDate() + 1);
  return value;
}

function formatDue(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function reminderDateLabel(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
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

function Progress({ value, color = colors.primary }: { value: number; color?: string }) {
  const width = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as `${number}%`;
  return (
    <View style={{ height: 5, borderRadius: 999, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
      <View style={{ height: '100%', width, borderRadius: 999, backgroundColor: color }} />
    </View>
  );
}

function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 39,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? colors.primarySoft : 'transparent',
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <Text style={{ color: selected ? colors.primaryDark : colors.textMuted, fontSize: 10.5, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

function PresetButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ minHeight: 36, paddingHorizontal: 10, borderRadius: 11, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}>
      <Text style={{ color: colors.text, fontSize: 10, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function TodoRow({ item, onToggle, onDelete }: { item: TodoItem; onToggle: () => void; onDelete: () => void }) {
  const overdue = !item.completedAt && new Date(item.dueAt).getTime() < Date.now();
  return (
    <View style={{ minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      <Pressable accessibilityLabel={item.completedAt ? 'Aufgabe wieder öffnen' : 'Aufgabe erledigen'} onPress={onToggle} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: item.completedAt ? colors.success : colors.border, backgroundColor: item.completedAt ? `${colors.success}18` : colors.background, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
        {item.completedAt ? <Symbol name="checkmark" size={15} color={colors.success} /> : null}
      </Pressable>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text selectable numberOfLines={1} style={{ color: item.completedAt ? colors.textMuted : colors.text, fontSize: 13, fontWeight: '800', textDecorationLine: item.completedAt ? 'line-through' : 'none' }}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Symbol name={item.notificationId ? 'bell.fill' : 'clock'} size={10} color={overdue ? colors.danger : item.notificationId ? colors.primaryDark : colors.textMuted} />
          <Text style={{ color: overdue ? colors.danger : colors.textMuted, fontSize: 10, fontWeight: overdue ? '800' : '600' }}>{overdue ? 'Überfällig · ' : ''}{formatDue(item.dueAt)}</Text>
        </View>
        {item.notes ? <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 9.5 }}>{item.notes}</Text> : null}
      </View>
      <Pressable accessibilityLabel="Aufgabe löschen" onPress={onDelete} style={({ pressed }) => ({ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.55 : 1 })}>
        <Symbol name="trash" size={13} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

function ReminderModal({
  target,
  existing,
  onClose,
  onSaved,
}: {
  target: ReminderTarget | null;
  existing: ScheduledSparFlowReminder | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const base = existing ? new Date(existing.scheduledFor) : target?.suggestedDate ?? futureDate(1, 9);
  const [dateText, setDateText] = useState(dateInput(base));
  const [timeText, setTimeText] = useState(timeInput(base));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = existing ? new Date(existing.scheduledFor) : target?.suggestedDate ?? futureDate(1, 9);
    setDateText(dateInput(next));
    setTimeText(timeInput(next));
  }, [existing, target]);

  if (!target) return null;

  const setDate = (date: Date) => {
    setDateText(dateInput(date));
    setTimeText(timeInput(date));
  };

  const save = async () => {
    const date = parseDateTime(dateText, timeText);
    if (!date || date.getTime() <= Date.now() + 3_000) {
      return Alert.alert('Erinnerung', 'Bitte gib ein gültiges Datum und eine Uhrzeit in der Zukunft ein.');
    }
    setSaving(true);
    try {
      await scheduleLocalReminder({
        kind: target.kind,
        sourceId: target.id,
        title: target.kind === 'goal' ? `Sparziel: ${target.title}` : `Challenge: ${target.title}`,
        body: target.kind === 'goal' ? 'Zeit, dein Sparziel weiterzubringen.' : 'Deine Challenge wartet auf den nächsten Schritt.',
        date,
        url: target.kind === 'goal' ? '/(tabs)/goals' : '/(tabs)/challenges',
      });
      await onSaved();
      onClose();
    } catch (error) {
      Alert.alert('Benachrichtigung', error instanceof Error ? error.message : 'Erinnerung konnte nicht geplant werden.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await cancelRemindersForSource(target.kind, target.id);
      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 }}>
        <View style={{ borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Symbol name="bell.fill" size={16} color={colors.primaryDark} /></View>
            <View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Erinnerung</Text><Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 10.5 }}>{target.title}</Text></View>
            <Pressable onPress={onClose} style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}><Symbol name="xmark" size={13} color={colors.textMuted} /></Pressable>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            <PresetButton label="Morgen 09:00" onPress={() => setDate(futureDate(1, 9))} />
            <PresetButton label="In 3 Tagen" onPress={() => setDate(futureDate(3, 9))} />
            <PresetButton label="In 7 Tagen" onPress={() => setDate(futureDate(7, 9))} />
            {target.suggestedDate ? <PresetButton label="Fälligkeit" onPress={() => setDate(target.suggestedDate as Date)} /> : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '700' }}>DATUM</Text><TextInput value={dateText} onChangeText={setDateText} placeholder="TT.MM.JJJJ" placeholderTextColor={colors.textMuted} style={{ minHeight: 46, borderRadius: 12, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text, fontSize: 15 }} /></View>
            <View style={{ width: 94, gap: 5 }}><Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '700' }}>UHRZEIT</Text><TextInput value={timeText} onChangeText={setTimeText} placeholder="09:00" placeholderTextColor={colors.textMuted} style={{ minHeight: 46, borderRadius: 12, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text, fontSize: 15 }} /></View>
          </View>

          {existing ? <Text style={{ color: colors.primaryDark, fontSize: 10.5 }}>Aktuell: {reminderDateLabel(existing.scheduledFor)}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {existing ? <Pressable disabled={saving} onPress={() => void remove()} style={({ pressed }) => ({ flex: 1, minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center', opacity: saving || pressed ? 0.55 : 1 })}><Text style={{ color: colors.danger, fontWeight: '800' }}>Entfernen</Text></Pressable> : null}
            <Pressable disabled={saving} onPress={() => void save()} style={({ pressed }) => ({ flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: saving || pressed ? 0.65 : 1 })}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{saving ? 'Speichert …' : 'Erinnern'}</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TodosScreen() {
  const store = useAppStore();
  const [mode, setMode] = useState<PageMode>('todos');
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledSparFlowReminder[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const initialDue = useMemo(() => futureDate(1, 9), []);
  const [dateText, setDateText] = useState(dateInput(initialDue));
  const [timeText, setTimeText] = useState(timeInput(initialDue));
  const [remind, setRemind] = useState(true);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<ReminderTarget | null>(null);

  const reloadTodos = useCallback(async () => setTodos(await loadTodos()), []);
  const reloadScheduled = useCallback(async () => setScheduled(await listScheduledSparFlowReminders()), []);

  useEffect(() => {
    void reloadTodos();
    void reloadScheduled();
    void notificationPermissionGranted().then(setPermission);
  }, [reloadScheduled, reloadTodos]);

  const setPreset = (date: Date) => {
    setDateText(dateInput(date));
    setTimeText(timeInput(date));
  };

  const addTodo = async () => {
    if (!title.trim()) return Alert.alert('To Do', 'Bitte gib der Aufgabe einen Namen.');
    const due = parseDateTime(dateText, timeText);
    if (!due || due.getTime() <= Date.now() + 3_000) return Alert.alert('To Do', 'Bitte gib ein gültiges Fälligkeitsdatum in der Zukunft ein.');

    setSaving(true);
    try {
      const id = await createTodo({ title, notes, dueAt: due.toISOString() });
      if (remind) {
        try {
          const notificationId = await scheduleLocalReminder({
            kind: 'todo',
            sourceId: id,
            title: `To Do: ${title.trim()}`,
            body: notes.trim() || 'Diese Aufgabe ist jetzt fällig.',
            date: due,
            url: '/(tabs)/todos',
          });
          await setTodoNotification(id, notificationId);
          setPermission(true);
        } catch (error) {
          Alert.alert('Aufgabe gespeichert', error instanceof Error ? `${error.message}\n\nDie Aufgabe wurde trotzdem angelegt.` : 'Die Aufgabe wurde ohne Benachrichtigung gespeichert.');
          setPermission(false);
        }
      }
      setTitle('');
      setNotes('');
      setPreset(futureDate(1, 9));
      await Promise.all([reloadTodos(), reloadScheduled()]);
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = async (item: TodoItem) => {
    const completing = !item.completedAt;
    if (completing) await cancelScheduledReminder(item.notificationId);
    await setTodoCompleted(item.id, completing);
    await Promise.all([reloadTodos(), reloadScheduled()]);
  };

  const removeTodo = (item: TodoItem) => {
    Alert.alert('Aufgabe löschen?', item.title, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => void (async () => {
          await cancelScheduledReminder(item.notificationId);
          await cancelRemindersForSource('todo', item.id);
          await deleteTodo(item.id);
          await Promise.all([reloadTodos(), reloadScheduled()]);
        })(),
      },
    ]);
  };

  const requestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted);
    if (!granted) {
      Alert.alert('Benachrichtigungen deaktiviert', 'Aktiviere Benachrichtigungen in den iPhone-Einstellungen, damit SparFlow dich erinnern kann.', [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Einstellungen öffnen', onPress: () => void Linking.openSettings() },
      ]);
    }
  };

  const activeTodos = todos.filter((item) => !item.completedAt);
  const doneTodos = todos.filter((item) => Boolean(item.completedAt));

  const existingFor = (kind: ReminderKind, id: string) => scheduled.find((item) => item.kind === kind && item.sourceId === id) ?? null;
  const activeGoals = store.goals.filter((goal) => goal.mode === 'recurring' || goal.savedAmount < goal.targetAmount);
  const activeChallenges = store.challenges.filter((challenge) => !challenge.completedAt);
  const modalExisting = reminderTarget ? existingFor(reminderTarget.kind, reminderTarget.id) : null;

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 12, paddingBottom: 112, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text selectable style={{ color: colors.text, fontSize: 23, fontWeight: '800', letterSpacing: -0.5 }}>To Do</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Aufgaben und Erinnerungen für deinen SparFlow.</Text>
          </View>
          <Pressable onPress={() => void requestPermission()} style={({ pressed }) => ({ minHeight: 36, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: permission ? `${colors.success}18` : colors.surface, borderWidth: 1, borderColor: permission ? `${colors.success}55` : colors.border, opacity: pressed ? 0.65 : 1 })}>
            <Symbol name={permission ? 'bell.fill' : 'bell'} size={13} color={permission ? colors.success : colors.textMuted} />
            <Text style={{ color: permission ? colors.success : colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>{permission ? 'Aktiv' : 'Benachr.'}</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <Segment label="Aufgaben" selected={mode === 'todos'} onPress={() => setMode('todos')} />
          <Segment label="Sparziele" selected={mode === 'goals'} onPress={() => setMode('goals')} />
          <Segment label="Challenges" selected={mode === 'challenges'} onPress={() => setMode('challenges')} />
        </View>

        {mode === 'todos' ? (
          <>
            <View style={{ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 11 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Neue Aufgabe</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Was möchtest du erledigen?" placeholderTextColor={colors.textMuted} style={{ minHeight: 48, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 13, color: colors.text, fontSize: 15 }} />
              <TextInput value={notes} onChangeText={setNotes} placeholder="Notiz · optional" placeholderTextColor={colors.textMuted} style={{ minHeight: 44, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 13, color: colors.text, fontSize: 13 }} />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                <PresetButton label="Heute 18:00" onPress={() => setPreset(futureDate(0, 18))} />
                <PresetButton label="Morgen 09:00" onPress={() => setPreset(futureDate(1, 9))} />
                <PresetButton label="+3 Tage" onPress={() => setPreset(futureDate(3, 9))} />
                <PresetButton label="+7 Tage" onPress={() => setPreset(futureDate(7, 9))} />
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '700' }}>FÄLLIG AM</Text><TextInput value={dateText} onChangeText={setDateText} placeholder="TT.MM.JJJJ" placeholderTextColor={colors.textMuted} style={{ minHeight: 46, borderRadius: 12, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text, fontSize: 15 }} /></View>
                <View style={{ width: 94, gap: 5 }}><Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '700' }}>UHRZEIT</Text><TextInput value={timeText} onChangeText={setTimeText} placeholder="09:00" placeholderTextColor={colors.textMuted} style={{ minHeight: 46, borderRadius: 12, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text, fontSize: 15 }} /></View>
              </View>

              <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Symbol name="bell.fill" size={14} color={colors.primaryDark} /></View>
                <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Bei Fälligkeit erinnern</Text><Text style={{ color: colors.textMuted, fontSize: 9.5 }}>Lokale iPhone-Benachrichtigung</Text></View>
                <Switch value={remind} onValueChange={setRemind} trackColor={{ false: colors.disabled, true: colors.primary }} />
              </View>

              <Pressable disabled={saving} onPress={() => void addTodo()} style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: saving || pressed ? 0.65 : 1 })}>
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>{saving ? 'Speichert …' : 'Aufgabe hinzufügen'}</Text>
              </Pressable>
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: '800' }}>Offen</Text><Text style={{ color: colors.textMuted, fontSize: 10 }}>{activeTodos.length}</Text></View>
              <View style={{ borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
                {activeTodos.length ? activeTodos.map((item, index) => <View key={item.id}>{index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 46 }} /> : null}<TodoRow item={item} onToggle={() => void toggleTodo(item)} onDelete={() => removeTodo(item)} /></View>) : <Text style={{ color: colors.textMuted, fontSize: 11.5, paddingVertical: 18, textAlign: 'center' }}>Keine offenen Aufgaben.</Text>}
              </View>
            </View>

            {doneTodos.length ? (
              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Erledigt</Text>
                <View style={{ borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
                  {doneTodos.slice(0, 20).map((item, index) => <View key={item.id}>{index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 46 }} /> : null}<TodoRow item={item} onToggle={() => void toggleTodo(item)} onDelete={() => removeTodo(item)} /></View>)}
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {mode === 'goals' ? (
          <View style={{ gap: 9 }}>
            <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Lege pro Sparziel eine lokale Erinnerung fest. Bei Zielen mit Termin oder monatlicher Rücklage schlägt SparFlow die passende Fälligkeit vor.</Text>
            {activeGoals.length ? activeGoals.map((goal) => {
              const recurringTarget = goal.recurringAmount ?? goal.targetAmount;
              const current = goal.savedAmount;
              const target = goal.mode === 'recurring' ? Math.max(1, recurringTarget) : Math.max(1, goal.targetAmount);
              const reminder = existingFor('goal', goal.id);
              return (
                <View key={goal.id} style={{ borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 13, gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${goal.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={goal.icon} size={16} color={goal.color} /></View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text numberOfLines={1} style={{ color: colors.text, fontSize: 13.5, fontWeight: '800' }}>{goal.title}</Text><Text style={{ color: colors.textMuted, fontSize: 10 }}>{goal.mode === 'recurring' ? `${formatMoney(recurringTarget)} monatlich` : `${formatMoney(current)} von ${formatMoney(goal.targetAmount)}`}</Text></View>
                    <Pressable onPress={() => setReminderTarget({ kind: 'goal', id: goal.id, title: goal.title, suggestedDate: goalSuggestedDate(goal) })} style={({ pressed }) => ({ minHeight: 38, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: reminder ? colors.primarySoft : colors.surfaceMuted, opacity: pressed ? 0.65 : 1 })}><Symbol name={reminder ? 'bell.fill' : 'bell'} size={12} color={reminder ? colors.primaryDark : colors.textMuted} /><Text style={{ color: reminder ? colors.primaryDark : colors.textMuted, fontSize: 10, fontWeight: '800' }}>{reminder ? 'Ändern' : 'Erinnern'}</Text></Pressable>
                  </View>
                  <Progress value={Math.min(1, current / target)} color={goal.color} />
                  {reminder ? <Text style={{ color: colors.primaryDark, fontSize: 9.5 }}>Erinnerung: {reminderDateLabel(reminder.scheduledFor)}</Text> : null}
                </View>
              );
            }) : <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>Keine aktiven Sparziele.</Text>}
          </View>
        ) : null}

        {mode === 'challenges' ? (
          <View style={{ gap: 9 }}>
            <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Erinnere dich gezielt an laufende Challenges. SparFlow öffnet beim Antippen der Benachrichtigung direkt deine Challenges.</Text>
            {activeChallenges.length ? activeChallenges.map((challenge) => {
              const reminder = existingFor('challenge', challenge.id);
              const ratio = Math.min(1, challenge.savedAmount / Math.max(1, challenge.targetAmount));
              return (
                <View key={challenge.id} style={{ borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 13, gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${challenge.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={challenge.icon} size={16} color={challenge.color} /></View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text numberOfLines={1} style={{ color: colors.text, fontSize: 13.5, fontWeight: '800' }}>{challenge.title}</Text><Text style={{ color: colors.textMuted, fontSize: 10 }}>{challenge.completedSteps} / {challenge.totalSteps} Schritte · {formatMoney(challenge.savedAmount)}</Text></View>
                    <Pressable onPress={() => setReminderTarget({ kind: 'challenge', id: challenge.id, title: challenge.title, suggestedDate: challengeSuggestedDate(challenge) })} style={({ pressed }) => ({ minHeight: 38, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: reminder ? colors.primarySoft : colors.surfaceMuted, opacity: pressed ? 0.65 : 1 })}><Symbol name={reminder ? 'bell.fill' : 'bell'} size={12} color={reminder ? colors.primaryDark : colors.textMuted} /><Text style={{ color: reminder ? colors.primaryDark : colors.textMuted, fontSize: 10, fontWeight: '800' }}>{reminder ? 'Ändern' : 'Erinnern'}</Text></Pressable>
                  </View>
                  <Progress value={ratio} color={challenge.color} />
                  {reminder ? <Text style={{ color: colors.primaryDark, fontSize: 9.5 }}>Erinnerung: {reminderDateLabel(reminder.scheduledFor)}</Text> : null}
                </View>
              );
            }) : <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>Keine laufenden Challenges.</Text>}
          </View>
        ) : null}
      </ScrollView>

      <ReminderModal target={reminderTarget} existing={modalExisting} onClose={() => setReminderTarget(null)} onSaved={reloadScheduled} />
    </>
  );
}
