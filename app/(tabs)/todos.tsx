import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { createTodo, deleteTodo, loadTodos, setTodoCompleted, setTodoNotification, type TodoItem } from '@/db/todos';
import { cancelRemindersForSource, cancelScheduledReminder, notificationPermissionGranted, requestNotificationPermission, scheduleLocalReminder } from '@/utils/local-notifications';

function futureDate(days: number, hour: number) {
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

function fullDueLabel(value: Date) {
  return new Intl.DateTimeFormat('de-AT', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function TodoRow({ item, index, onToggle, onDelete }: { item: TodoItem; index: number; onToggle: () => void; onDelete: () => void }) {
  const overdue = !item.completedAt && new Date(item.dueAt).getTime() < Date.now();
  return (
    <Animated.View entering={FadeInDown.duration(170).delay(Math.min(index, 8) * 24)} layout={LinearTransition.duration(180)}>
      <View style={{ minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 }}>
        <Pressable accessibilityLabel={item.completedAt ? 'Aufgabe wieder öffnen' : 'Aufgabe erledigen'} onPress={onToggle} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: item.completedAt ? colors.success : colors.border, backgroundColor: item.completedAt ? `${colors.success}18` : colors.background, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.62 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] })}>
          {item.completedAt ? <Symbol name="checkmark" size={15} color={colors.success} /> : null}
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text selectable numberOfLines={1} style={{ color: item.completedAt ? colors.textMuted : colors.text, fontSize: 12.5, fontWeight: '800', textDecorationLine: item.completedAt ? 'line-through' : 'none' }}>{item.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Symbol name={item.notificationId ? 'bell.fill' : 'clock'} size={10} color={overdue ? colors.danger : item.notificationId ? colors.primaryDark : colors.textMuted} />
            <Text selectable numberOfLines={1} style={{ color: overdue ? colors.danger : colors.textMuted, fontSize: 9.5, fontWeight: overdue ? '800' : '600' }}>{overdue ? 'Überfällig · ' : ''}{dueLabel(item.dueAt)}</Text>
          </View>
          {item.notes ? <Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 9 }}>{item.notes}</Text> : null}
        </View>
        <Pressable accessibilityLabel="Aufgabe löschen" onPress={onDelete} style={({ pressed }) => ({ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.55 : 1 })}><Symbol name="trash" size={13} color={colors.textMuted} /></Pressable>
      </View>
    </Animated.View>
  );
}

function AddTodoModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(futureDate(1, 9));
  const [remind, setRemind] = useState(true);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setNotes('');
    setSelectedDate(futureDate(1, 9));
    setRemind(true);
  };

  const close = () => {
    reset();
    onClose();
  };

  const preset = (value: Date) => setSelectedDate(new Date(value));

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('To Do', 'Schreib kurz auf, was du erledigen möchtest.');
      return;
    }
    if (!Number.isFinite(selectedDate.getTime()) || selectedDate.getTime() <= Date.now() + 3_000) {
      Alert.alert('To Do', 'Bitte wähle einen Zeitpunkt in der Zukunft.');
      return;
    }
    setSaving(true);
    try {
      const id = await createTodo({ title, notes, dueAt: selectedDate.toISOString() });
      if (remind) {
        try {
          const notificationId = await scheduleLocalReminder({
            kind: 'todo',
            sourceId: id,
            title: `To Do: ${title.trim()}`,
            body: notes.trim() || 'Diese Aufgabe ist jetzt fällig.',
            date: selectedDate,
            url: '/(tabs)/todos',
          });
          await setTodoNotification(id, notificationId);
        } catch (error) {
          Alert.alert('To Do gespeichert', error instanceof Error ? `${error.message}\n\nDie Aufgabe wurde trotzdem gespeichert.` : 'Die Aufgabe wurde ohne Erinnerung gespeichert.');
        }
      }
      await onCreated();
      close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 }}>
            <View style={{ width: 42, height: 5, borderRadius: 999, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 }} />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 13 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Neues To Do</Text>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Aufgabe eintragen und Fälligkeit bequem auswählen.</Text>
                </View>
                <Pressable accessibilityLabel="To Do schließen" onPress={close} style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.62 : 1 })}><Symbol name="xmark" size={13} color={colors.textMuted} /></Pressable>
              </View>

              <TextInput autoFocus value={title} onChangeText={setTitle} maxLength={64} placeholder="Was möchtest du erledigen?" placeholderTextColor={colors.textMuted} style={{ minHeight: 50, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 13, color: colors.text, fontSize: 16, fontWeight: '700' }} />
              <TextInput value={notes} onChangeText={setNotes} maxLength={160} placeholder="Notiz · optional" placeholderTextColor={colors.textMuted} style={{ minHeight: 46, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 13, color: colors.text, fontSize: 14 }} />

              <View style={{ gap: 7 }}>
                <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Schnell wählen</Text>
                <View style={{ flexDirection: 'row', gap: 7 }}>
                  {[
                    ['Morgen', futureDate(1, 9)],
                    ['3 Tage', futureDate(3, 9)],
                    ['1 Woche', futureDate(7, 9)],
                  ].map(([label, value]) => (
                    <Pressable key={String(label)} onPress={() => preset(value as Date)} style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
                      <Text selectable style={{ color: colors.text, fontSize: 10.5, fontWeight: '800' }}>{String(label)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Datum und Uhrzeit</Text>
                <View style={{ borderRadius: 16, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
                  <View style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}><Symbol name="calendar" size={14} color={colors.primaryDark} /></View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Datum</Text>
                      <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Kalender öffnen</Text>
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
                    <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}><Symbol name="clock" size={14} color={colors.primaryDark} /></View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Uhrzeit</Text>
                      <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Uhrzeit auswählen</Text>
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
                      style={{ minWidth: 94 }}
                    />
                  </View>
                </View>
                <View style={{ minHeight: 42, borderRadius: 13, backgroundColor: colors.primarySoft, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Symbol name="checkmark.circle.fill" size={13} color={colors.primaryDark} />
                  <Text selectable style={{ flex: 1, color: colors.primaryDark, fontSize: 10.5, fontWeight: '800' }}>{fullDueLabel(selectedDate)}</Text>
                </View>
              </View>

              <View style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Symbol name="bell.fill" size={14} color={colors.primaryDark} /></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Bei Fälligkeit erinnern</Text>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Lokale Benachrichtigung auf diesem iPhone.</Text>
                </View>
                <Switch value={remind} onValueChange={setRemind} trackColor={{ false: colors.disabled, true: colors.primary }} />
              </View>

              <Pressable disabled={saving} onPress={() => void save()} style={({ pressed }) => ({ minHeight: 50, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: saving || pressed ? 0.75 : 1 })}>
                <Text selectable style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '900' }}>{saving ? 'Speichert …' : 'To Do speichern'}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
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

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const active = todos.filter((item) => !item.completedAt);
  const completed = todos.filter((item) => Boolean(item.completedAt));

  const toggle = async (item: TodoItem) => {
    const completing = !item.completedAt;
    if (completing) await cancelScheduledReminder(item.notificationId);
    await setTodoCompleted(item.id, completing);
    await reload();
  };

  const remove = (item: TodoItem) => Alert.alert('To Do löschen?', item.title, [
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

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted);
    if (!granted) {
      Alert.alert('Benachrichtigungen sind aus', 'To Dos funktionieren trotzdem. Erinnerungen kannst du in den iPhone-Einstellungen aktivieren.', [
        { text: 'Später', style: 'cancel' },
        { text: 'Einstellungen öffnen', onPress: () => void Linking.openSettings() },
      ]);
    }
  };

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 104, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text selectable style={{ color: colors.text, fontSize: 23, fontWeight: '900', letterSpacing: -0.5 }}>To Do</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Was noch erledigt werden soll.</Text>
          </View>
          <Pressable onPress={() => setCreateOpen(true)} style={({ pressed }) => ({ minHeight: 42, paddingHorizontal: 12, borderRadius: 13, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.76 : 1 })}>
            <Symbol name="plus" size={13} color="#FFFFFF" />
            <Text selectable style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>Neu</Text>
          </Pressable>
        </View>

        {permission === false ? (
          <Pressable onPress={() => void enableNotifications()} style={({ pressed }) => ({ borderRadius: 14, backgroundColor: colors.primarySoft, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9, opacity: pressed ? 0.72 : 1 })}>
            <Symbol name="bell.slash" size={14} color={colors.warning} />
            <View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>Erinnerungen aktivieren</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Damit SparPilot dich bei Fälligkeit benachrichtigen kann.</Text></View>
            <Symbol name="chevron.right" size={10} color={colors.textMuted} />
          </Pressable>
        ) : null}

        <View style={{ gap: 7 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text selectable style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: '900' }}>Offen</Text><Text selectable style={{ color: colors.primaryDark, fontSize: 10.5, fontWeight: '900' }}>{active.length}</Text></View>
          <View style={{ borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11 }}>
            {active.length ? active.map((item, index) => (
              <View key={item.id}>
                {index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 49 }} /> : null}
                <TodoRow item={item} index={index} onToggle={() => void toggle(item)} onDelete={() => remove(item)} />
              </View>
            )) : (
              <View style={{ paddingVertical: 22, alignItems: 'center', gap: 6 }}>
                <Symbol name="checkmark.circle.fill" size={21} color={colors.success} />
                <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>Nichts offen</Text>
                <Text selectable style={{ color: colors.textMuted, fontSize: 10 }}>Du bist hier fertig.</Text>
              </View>
            )}
          </View>
        </View>

        {completed.length ? (
          <View style={{ gap: 7 }}>
            <Text selectable style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Erledigt</Text>
            <View style={{ borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11 }}>
              {completed.slice(0, 8).map((item, index) => (
                <View key={item.id}>
                  {index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 49 }} /> : null}
                  <TodoRow item={item} index={active.length + index} onToggle={() => void toggle(item)} onDelete={() => remove(item)} />
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
