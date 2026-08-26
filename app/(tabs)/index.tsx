import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { HeaderIconButton } from '@/components/neon-ui';
import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { loadTodos, type TodoItem } from '@/db/todos';
import { useAppStore } from '@/store/app-store';
import type { Goal } from '@/types/models';
import { formatMoney } from '@/utils/money';

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function savedThisMonth(contributions: ReturnType<typeof useAppStore>['contributions'], goalId: string) {
  return Math.max(0, contributions.reduce((sum, item) => {
    if (item.sourceType !== 'goal' || item.sourceId !== goalId || !isCurrentMonth(item.createdAt)) return sum;
    return sum + item.amount;
  }, 0));
}

function formatShortDue(value: string) {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const time = new Intl.DateTimeFormat('de-AT', { hour: '2-digit', minute: '2-digit' }).format(date);
  if (sameDay(date, today)) return `Heute · ${time}`;
  if (sameDay(date, tomorrow)) return `Morgen · ${time}`;
  return new Intl.DateTimeFormat('de-AT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
}

function ProgressBar({ value }: { value: number }) {
  const width = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as `${number}%`;
  return (
    <View style={{ height: 7, borderRadius: 999, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
      <View style={{ height: '100%', width, borderRadius: 999, backgroundColor: colors.primary }} />
    </View>
  );
}

function QuickLink({ icon, title, body, onPress }: { icon: string; title: string; body: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, minHeight: 92, borderRadius: 17, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 7, opacity: pressed ? 0.68 : 1 })}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Symbol name={icon} size={14} color={colors.text} />
      </View>
      <View style={{ gap: 2 }}>
        <Text selectable style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>{title}</Text>
        <Text selectable numberOfLines={2} style={{ color: colors.textMuted, fontSize: 9.5, lineHeight: 13 }}>{body}</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const store = useAppStore();
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    void loadTodos().then((items) => {
      if (mounted) setTodos(items);
    });
    return () => {
      mounted = false;
    };
  }, []));

  const monthlyRows = useMemo(() => store.goals
    .filter((goal) => goal.mode === 'recurring')
    .map((goal) => {
      const planned = Math.max(0, goal.recurringAmount ?? goal.targetAmount);
      const saved = savedThisMonth(store.contributions, goal.id);
      return {
        goal,
        planned,
        saved,
        remaining: Math.max(0, planned - Math.min(planned, saved)),
      };
    }), [store.contributions, store.goals]);

  const monthPlanned = monthlyRows.reduce((sum, row) => sum + row.planned, 0);
  const monthSaved = monthlyRows.reduce((sum, row) => sum + Math.min(row.saved, row.planned), 0);
  const monthRemaining = Math.max(0, monthPlanned - monthSaved);
  const monthProgress = monthPlanned > 0 ? Math.min(1, monthSaved / monthPlanned) : 0;

  const activeTodos = todos.filter((item) => !item.completedAt);
  const overdueTodo = activeTodos.find((item) => new Date(item.dueAt).getTime() <= Date.now());
  const nextTodo = overdueTodo ?? activeTodos[0] ?? null;
  const monthlyGoal = monthlyRows.find((row) => row.remaining > 0)?.goal ?? null;
  const targetGoal = store.goals.find((goal) => goal.mode === 'target' && goal.savedAmount < goal.targetAmount) ?? null;
  const nextGoal: Goal | null = monthlyGoal ?? targetGoal;
  const activeChallenge = store.challenges.find((challenge) => !challenge.completedAt) ?? null;

  let nextTitle = 'Für heute ist alles im Plan';
  let nextBody = 'Du musst gerade nichts erledigen. Schau später wieder vorbei.';
  let nextLabel = 'Ziele ansehen';
  let nextIcon = 'checkmark.circle.fill';
  let nextColor = colors.success;
  let nextPress = () => router.push('/(tabs)/goals');

  if (store.goals.length === 0) {
    nextTitle = 'Lege zuerst ein Sparziel an';
    nextBody = 'Dann weiß SparPilot, wofür du sparen möchtest und kann dir den nächsten Schritt zeigen.';
    nextLabel = 'Erstes Ziel anlegen';
    nextIcon = 'target';
    nextColor = colors.primary;
    nextPress = () => router.push('/add-goal');
  } else if (overdueTodo) {
    nextTitle = overdueTodo.title;
    nextBody = `Diese Aufgabe ist fällig: ${formatShortDue(overdueTodo.dueAt)}.`;
    nextLabel = 'Aufgabe öffnen';
    nextIcon = 'checklist';
    nextColor = colors.danger;
    nextPress = () => router.push('/(tabs)/todos');
  } else if (nextGoal) {
    const recurringRow = monthlyRows.find((row) => row.goal.id === nextGoal.id);
    const remaining = recurringRow ? recurringRow.remaining : Math.max(0, nextGoal.targetAmount - nextGoal.savedAmount);
    nextTitle = `Weiter für „${nextGoal.title}“ sparen`;
    nextBody = remaining > 0 ? `Noch ${formatMoney(remaining)} bis zum nächsten Zielstand.` : 'Ein kleiner Betrag hält deinen Sparplan in Bewegung.';
    nextLabel = 'Jetzt einzahlen';
    nextIcon = 'eurosign.circle.fill';
    nextColor = nextGoal.color;
    nextPress = () => router.push({ pathname: '/save', params: { goalId: nextGoal.id, mode: 'save' } });
  } else if (activeChallenge) {
    nextTitle = `Challenge fortsetzen: ${activeChallenge.title}`;
    nextBody = 'Ein Schritt reicht. Du musst nicht alles auf einmal schaffen.';
    nextLabel = 'Challenge öffnen';
    nextIcon = 'trophy.fill';
    nextColor = activeChallenge.color;
    nextPress = () => router.push('/(tabs)/challenges');
  } else if (nextTodo) {
    nextTitle = nextTodo.title;
    nextBody = `Deine nächste Aufgabe: ${formatShortDue(nextTodo.dueAt)}.`;
    nextLabel = 'Aufgaben ansehen';
    nextIcon = 'checklist';
    nextColor = colors.primary;
    nextPress = () => router.push('/(tabs)/todos');
  }

  if (store.loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 10, paddingBottom: 112, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.7 }}>Heute</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>SparPilot zeigt dir nur, was jetzt wichtig ist.</Text>
        </View>
        <HeaderIconButton name="bell" onPress={() => router.push('/reminders')} />
        <HeaderIconButton name="gearshape.fill" onPress={() => router.push('/settings')} />
      </View>

      {store.error ? (
        <Pressable onPress={() => void store.reload()} style={({ pressed }) => ({ minHeight: 44, borderRadius: 14, backgroundColor: colors.dangerSoft, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.68 : 1 })}>
          <Symbol name="exclamationmark.triangle.fill" size={14} color={colors.danger} />
          <Text selectable style={{ flex: 1, color: colors.danger, fontSize: 11.5, fontWeight: '800' }}>Daten konnten nicht vollständig geladen werden · erneut versuchen</Text>
        </Pressable>
      ) : null}

      <View style={{ borderRadius: 20, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 13 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${nextColor}18`, alignItems: 'center', justifyContent: 'center' }}>
            <Symbol name={nextIcon} size={19} color={nextColor} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>DEIN NÄCHSTER SCHRITT</Text>
            <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900', lineHeight: 20 }}>{nextTitle}</Text>
          </View>
        </View>
        <Text selectable style={{ color: colors.textMuted, fontSize: 11.5, lineHeight: 17 }}>{nextBody}</Text>
        <Pressable onPress={nextPress} style={({ pressed }) => ({ minHeight: 50, borderRadius: 15, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: pressed ? 0.72 : 1 })}>
          <Text selectable style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>{nextLabel}</Text>
          <Symbol name="arrow.right" size={12} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, borderRadius: 17, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 13, gap: 4 }}>
          <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '700' }}>GESAMT GESPART</Text>
          <Text selectable style={{ color: colors.text, fontSize: 21, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(store.totalSaved)}</Text>
        </View>
        <View style={{ flex: 1, borderRadius: 17, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 13, gap: 4 }}>
          <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '700' }}>OFFENE AUFGABEN</Text>
          <Text selectable style={{ color: colors.text, fontSize: 21, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{activeTodos.length}</Text>
        </View>
      </View>

      {monthPlanned > 0 ? (
        <Pressable onPress={() => router.push('/month-details')} style={({ pressed }) => ({ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10, opacity: pressed ? 0.72 : 1 })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text selectable style={{ color: colors.text, fontSize: 13.5, fontWeight: '800' }}>Dein Monatsplan</Text>
              <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>{formatMoney(monthSaved)} von {formatMoney(monthPlanned)} erledigt</Text>
            </View>
            <Text selectable style={{ color: monthRemaining > 0 ? colors.text : colors.success, fontSize: 11, fontWeight: '800' }}>{monthRemaining > 0 ? `Noch ${formatMoney(monthRemaining)}` : 'Geschafft'}</Text>
            <Symbol name="chevron.right" size={10} color={colors.textMuted} />
          </View>
          <ProgressBar value={monthProgress} />
        </Pressable>
      ) : null}

      <View style={{ gap: 8 }}>
        <Text selectable style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Direkt öffnen</Text>
        <View style={{ flexDirection: 'row', gap: 9 }}>
          <QuickLink icon="target" title="Ziele" body="Sieh, wofür du sparst." onPress={() => router.push('/(tabs)/goals')} />
          <QuickLink icon="checklist" title="Aufgaben" body="Was noch zu erledigen ist." onPress={() => router.push('/(tabs)/todos')} />
          <QuickLink icon="trophy.fill" title="Challenge" body="Einen Schritt weitermachen." onPress={() => router.push('/(tabs)/challenges')} />
        </View>
      </View>
    </ScrollView>
  );
}
