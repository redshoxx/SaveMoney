import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { createTodo, deleteTodo, loadTodos, setTodoCompleted, setTodoNotification, type TodoItem } from '@/db/todos';
import {
  cancelRemindersForSource,
  cancelScheduledReminder,
  notificationPermissionGranted,
  requestNotificationPermission,
  scheduleLocalReminder,
} from '@/utils/local-notifications';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateInput(date: Date) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function timeInput(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function futureDate(days: number, hour: number) {
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

function dueLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const time = new Intl.DateTimeFormat('de-AT', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (sameDay(date, today)) return `Heute · ${time}`;
  if (sameDay(date, tomorrow)) return `Morgen · ${time}`;
  return new Intl.DateTimeFormat('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
}

function TodoRow({ item, onToggle, onDelete }: { item: TodoItem; onToggle: () => void; onDelete: () => void }) {
  const overdue = !item.completedAt && new Date(item.dueAt).getTime() < Date.now();
  return (
    <View style={{ minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8 }}>
      <Pressable accessibilityLabel={item.completedAt ? 'Aufgabe wieder öffnen' : 'Aufgabe erledigen'} onPress={onToggle} style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: item.completedAt ? colors.success : colors.border, backgroundColor: item.completedAt ? `${colors.success}18` : colors.background, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
        {item.completedAt ? <Symbol name="checkmark" size={15} color={colors.success} /> : null}
      </Pressable>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text selectable numberOfLines={1} style={{ color: item.completedAt ? colors.textMuted : colors.text, fontSize: 13, fontWeight: '800', textDecorationLine: item.completedAt ? 'line-through' : 'none' }}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Symbol name={item.notificationId ? 'bell.fill' : 'clock'} size={10} color={overdue ? colors.danger : item.notificationId ? colors.primary : colors.textMuted} />
          <Text selectable style={{ color: overdue ? colors.danger : colors.textMuted, fontSize: 10.5, fontWeight: overdue ? '800' : '600' }}>{overdue ? 'Überfällig · ' : ''}{dueLabel(item.dueAt)}</Text>
        </View>
        {item.notes ? <Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 9.5 }}>{item.notes}</Text> : null}
      </View>
      <Pressable accessibilityLabel="Aufgabe löschen" onPress={onDelete} style={({ pressed }) => ({ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.55 : 1 })}>
        <Symbol name="trash" size={13} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

function AddTodoModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => Promise<void> }) {
  const initial = useMemo(() => futureDate(1, 9), [visible]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dateText, setDateText] = useState(dateInput(initial));
  const [timeText, setTimeText] = useState(timeInput(initial));
  const [remind, setRemind] = useState(true);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    const next = futureDate(1, 9);
    setTitle('');
    setNotes('');
    setDateText(dateInput(next));
    setTimeText(timeInput(next));
    setRemind(true);
  };

  const close = () => {
    reset();
    onClose();
  };

  const preset = (value: Date) => {
    setDateText(dateInput(value));
    setTimeText(timeInput(value));
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Aufgabe', 'Schreib kurz auf, was du erledigen möchtest.');
      return;
    }
    const due = parseDateTime(dateText, timeText);
    if (!due || due.getTime() <= Date.now() + 3_000) {
      Alert.alert('Aufgabe', 'Bitte wähle einen Zeitpunkt in der Zukunft.');
      return;
    }

    setSaving(true);
    try {
      const id = await createTodo({ title, notes, dueAt: due.toISOString() });
      if (remind) {
        try {
          const notificationId = await scheduleLocalReminder({
            kind: 'todo',
            sourceId: id,
            title: `Aufgabe: ${title.trim()}`,
            body: notes.trim() || 'Diese Aufgabe ist jetzt fällig.',
            date: due,
            url: '/(tabs)/todos',
          });
          await setTodoNotification(id, notificationId);
        } catch (error) {
          Alert.alert('Aufgabe gespeichert', error instanceof Error ? `${error.message}\n\nDie Aufgabe wurde trotzdem gespeichert.` : 'Die Aufgabe wurde ohne Erinnerung gespeichert.');
        }
      }
      await onCreated();
      close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'center', padding: 20 }}>
        <View style={{ borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Neue Aufgabe</Text>
              <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Was soll SparFlow für dich im Blick behalten?</Text>
            </View>
            <Pressable onPress={close} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}><Symbol name="xmark" size={13} color={colors.textMuted} /></Pressable>
          </View>

          <TextInput autoFocus value={title} onChangeText={setTitle} placeholder="Zum Beispiel: Versicherung überweisen" placeholderTextColor={colors.textMuted} style={{ minHeight: 50, borderRadius: 14, backgroundColor: colors.surfaceMuted, paddingHorizontal: 13, color: colors.text, fontSize: 16 }} />
          <TextInput value={notes} onChangeText={setNotes} placeholder="Notiz · optional" placeholderTextColor={colors.textMuted} style={{ minHeight: 46, borderRadius: 14, backgroundColor: colors.surfaceMuted, paddingHorizontal: 13, color: colors.text, fontSize: 15 }} />

          <View style={{ gap: 7 }}>
            <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Wann ist sie fällig?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              <Pressable onPress={() => preset(futureDate(0, 18))} style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}><Text selectable style={{ color: colors.text, fontSize: 10.5, fontWeight: '700' }}>Heute Abend</Text></Pressable>
              <Pressable onPress={() => preset(futureDate(1, 9))} style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}><Text selectable style={{ color: colors.primaryDark, fontSize: 10.5, fontWeight: '800' }}>Morgen</Text></Pressable>
              <Pressable onPress={() => preset(futureDate(3, 9))} style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}><Text selectable style={{ color: colors.text, fontSize: 10.5, fontWeight: '700' }}>In 3 Tagen</Text></Pressable>
              <Pressable onPress={() => preset(futureDate(7, 9))} style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}><Text selectable style={{ color: colors.text, fontSize: 10.5, fontWeight: '700' }}>In 1 Woche</Text></Pressable>
            </View>
          </View>

          <View style={{ gap: 7 }}>
            <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '700' }}>ODER GENAU</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={dateText} onChangeText={setDateText} placeholder="TT.MM.JJJJ" placeholderTextColor={colors.textMuted} style={{ flex: 1, minHeight: 48, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text, fontSize: 16 }} />
              <TextInput value={timeText} onChangeText={setTimeText} placeholder="09:00" placeholderTextColor={colors.textMuted} style={{ width: 100, minHeight: 48, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text, fontSize: 16 }} />
            </View>
          </View>

          <View style={{ minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Symbol name="bell.fill" size={14} color={colors.primaryDark} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Mich erinnern</Text>
              <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Benachrichtigung genau zur Fälligkeit</Text>
            </View>
            <Switch value={remind} onValueChange={setRemind} trackColor={{ false: colors.disabled, true: colors.primary }} />
          </View>

          <Pressable disabled={saving} onPress={() => void save()} style={({ pressed }) => ({ minHeight: 50, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: saving || pressed ? 0.68 : 1 })}>
            <Text selectable style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>{saving ? 'Speichert …' : 'Aufgabe speichern'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function TodosScreen() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [permission, setPermission] = useState<boolean | null>(null);

  const reload = useCallback(async () => {
    const [items, granted] = await Promise.all([loadTodos(), notificationPermissionGranted()]);
    setTodos(items);
    setPermission(granted);
  }, []);

  useFocusEffect(useCallback(() => {
    void reload();
  }, [reload]));

  const active = todos.filter((item) => !item.completedAt);
  const completed = todos.filter((item) => Boolean(item.completedAt));

  const toggle = async (item: TodoItem) => {
    const completing = !item.completedAt;
    if (completing) await cancelScheduledReminder(item.notificationId);
    await setTodoCompleted(item.id, completing);
    await reload();
  };

  const remove = (item: TodoItem) => {
    Alert.alert('Aufgabe löschen?', item.title, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () => void (async () => {
          await cancelScheduledReminder(item.notificationId);
          await cancelRemindersForSource('todo', item.id);
          await deleteTodo(item.id);
          await reload();
        })(),
      },
    ]);
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted);
    if (!granted) {
      Alert.alert('Benachrichtigungen sind aus', 'Aufgaben funktionieren trotzdem. Für Erinnerungen kannst du Benachrichtigungen in den iPhone-Einstellungen aktivieren.', [
        { text: 'Später', style: 'cancel' },
        { text: 'Einstellungen öffnen', onPress: () => void Linking.openSettings() },
      ]);
    }
  };

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 12, paddingBottom: 112, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>Aufgaben</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>Was du noch erledigen möchtest.</Text>
          </View>
          <Pressable onPress={() => setCreateOpen(true)} style={({ pressed }) => ({ minHeight: 42, paddingHorizontal: 12, borderRadius: 13, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}>
            <Symbol name="plus" size={13} color="#FFFFFF" />
            <Text selectable style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>Neue Aufgabe</Text>
          </Pressable>
        </View>

        {permission === false ? (
          <Pressable onPress={() => void enableNotifications()} style={({ pressed }) => ({ borderRadius: 15, borderCurve: 'continuous', backgroundColor: colors.surfaceMuted, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9, opacity: pressed ? 0.68 : 1 })}>
            <Symbol name="bell.slash" size={14} color={colors.warning} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text selectable style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>Erinnerungen sind aus</Text>
              <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Tippen, um Benachrichtigungen zu aktivieren.</Text>
            </View>
            <Symbol name="chevron.right" size={10} color={colors.textMuted} />
          </Pressable>
        ) : null}

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text selectable style={{ flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' }}>Offen</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>{active.length}</Text>
          </View>
          <View style={{ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
            {active.length ? active.map((item, index) => (
              <View key={item.id}>
                {index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 49 }} /> : null}
                <TodoRow item={item} onToggle={() => void toggle(item)} onDelete={() => remove(item)} />
              </View>
            )) : (
              <View style={{ paddingVertical: 22, alignItems: 'center', gap: 7 }}>
                <Symbol name="checkmark.circle.fill" size={22} color={colors.success} />
                <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Keine offenen Aufgaben</Text>
                <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Du bist hier fertig.</Text>
              </View>
            )}
          </View>
        </View>

        {completed.length ? (
          <View style={{ gap: 8 }}>
            <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>Erledigt</Text>
            <View style={{ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
              {completed.slice(0, 8).map((item, index) => (
                <View key={item.id}>
                  {index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 49 }} /> : null}
                  <TodoRow item={item} onToggle={() => void toggle(item)} onDelete={() => remove(item)} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <AddTodoModal visible={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
    </>
  );
}
