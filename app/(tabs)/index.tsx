import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { HeaderIconButton } from '@/components/neon-ui';
import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { loadTodos, type TodoItem } from '@/db/todos';
import { useAppStore } from '@/store/app-store';
import type { Goal } from '@/types/models';
import { formatEntityNumber } from '@/utils/entity-number';
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
  return <View style={{ height: 6, borderRadius: 999, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}><Animated.View layout={LinearTransition.duration(180)} style={{ height: '100%', width, borderRadius: 999, backgroundColor: colors.primary }} /></View>;
}

function MenuRow({ icon, title, body, value, onPress, index }: { icon: string; title: string; body: string; value?: string; onPress: () => void; index: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(180).delay(index * 30)}>
      <Pressable onPress={onPress} style={({ pressed }) => ({ minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.7 : 1 })}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Symbol name={icon} size={16} color={colors.primaryDark} /></View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>{title}</Text><Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 9.5 }}>{body}</Text></View>
        {value ? <Text selectable style={{ color: colors.primaryDark, fontSize: 10.5, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{value}</Text> : null}
        <Symbol name="chevron.right" size={10} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const store = useAppStore();
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    void loadTodos().then((items) => { if (mounted) setTodos(items); });
    return () => { mounted = false; };
  }, []));

  const monthlyRows = useMemo(() => store.goals
    .filter((goal) => goal.mode === 'recurring')
    .map((goal) => {
      const planned = Math.max(0, goal.recurringAmount ?? goal.targetAmount);
      const saved = savedThisMonth(store.contributions, goal.id);
      return { goal, planned, saved, remaining: Math.max(0, planned - Math.min(planned, saved)) };
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
  let nextNumber: number | null = null;
  let nextPress = () => router.push('/(tabs)/goals');

  if (store.goals.length === 0) {
    nextTitle = 'Lege dein erstes Sparziel an';
    nextBody = 'Danach zeigt SparPilot dir immer den nächsten sinnvollen Schritt.';
    nextLabel = 'Ziel anlegen';
    nextIcon = 'target';
    nextColor = colors.primary;
    nextPress = () => router.push('/add-goal');
  } else if (overdueTodo) {
    nextTitle = overdueTodo.title;
    nextBody = `Diese Aufgabe ist fällig: ${formatShortDue(overdueTodo.dueAt)}.`;
    nextLabel = 'To Do öffnen';
    nextIcon = 'checklist';
    nextColor = colors.danger;
    nextPress = () => router.push('/(tabs)/todos');
  } else if (nextGoal) {
    const recurringRow = monthlyRows.find((row) => row.goal.id === nextGoal.id);
    const remaining = recurringRow ? recurringRow.remaining : Math.max(0, nextGoal.targetAmount - nextGoal.savedAmount);
    nextTitle = nextGoal.title;
    nextBody = remaining > 0 ? `Noch ${formatMoney(remaining)} bis zum nächsten Zielstand.` : 'Ein kleiner Betrag hält deinen Sparplan in Bewegung.';
    nextLabel = 'Jetzt einzahlen';
    nextIcon = 'eurosign.circle.fill';
    nextColor = nextGoal.color;
    nextNumber = nextGoal.displayNumber;
    nextPress = () => router.push({ pathname: '/save', params: { goalId: nextGoal.id, mode: 'save' } });
  } else if (activeChallenge) {
    nextTitle = activeChallenge.title;
    nextBody = 'Ein Schritt reicht. Du musst nicht alles auf einmal schaffen.';
    nextLabel = 'Challenge öffnen';
    nextIcon = 'trophy.fill';
    nextColor = activeChallenge.color;
    nextNumber = activeChallenge.displayNumber;
    nextPress = () => router.push('/(tabs)/challenges');
  } else if (nextTodo) {
    nextTitle = nextTodo.title;
    nextBody = `Deine nächste Aufgabe: ${formatShortDue(nextTodo.dueAt)}.`;
    nextLabel = 'To Do öffnen';
    nextIcon = 'checklist';
    nextColor = colors.primary;
    nextPress = () => router.push('/(tabs)/todos');
  }

  if (store.loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 9, paddingBottom: 104, gap: 14 }}>
      <Animated.View entering={FadeIn.duration(180)} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable style={{ color: colors.text, fontSize: 23, fontWeight: '900', letterSpacing: -0.6 }}>Heute</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Nur das, was jetzt wichtig ist.</Text>
        </View>
        <HeaderIconButton name="bell" onPress={() => router.push('/reminders')} />
        <HeaderIconButton name="gearshape.fill" onPress={() => router.push('/settings')} />
      </Animated.View>

      {store.error ? (
        <Pressable onPress={() => void store.reload()} style={({ pressed }) => ({ minHeight: 44, borderRadius: 13, backgroundColor: colors.dangerSoft, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.72 : 1 })}>
          <Symbol name="exclamationmark.triangle.fill" size={14} color={colors.danger} />
          <Text selectable style={{ flex: 1, color: colors.danger, fontSize: 10.5, fontWeight: '800' }}>Daten nicht vollständig geladen · erneut versuchen</Text>
        </Pressable>
      ) : null}

      <Animated.View entering={FadeInDown.duration(210)} style={{ borderRadius: 19, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 15, gap: 12, boxShadow: '0 5px 16px rgba(0,0,0,0.12)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 43, height: 43, borderRadius: 14, backgroundColor: `${nextColor}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={nextIcon} size={19} color={nextColor} /></View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text selectable style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '900' }}>DEIN NÄCHSTER SCHRITT</Text>
            <Text selectable numberOfLines={2} style={{ color: colors.text, fontSize: 14.5, fontWeight: '900', lineHeight: 19 }}>{nextTitle}</Text>
            {nextNumber ? <Text selectable style={{ color: colors.primaryDark, fontSize: 9.5, fontWeight: '900' }}>{formatEntityNumber(nextNumber)}</Text> : null}
          </View>
        </View>
        <Text selectable style={{ color: colors.textMuted, fontSize: 11, lineHeight: 16 }}>{nextBody}</Text>
        <Pressable onPress={nextPress} style={({ pressed }) => ({ minHeight: 49, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
          <Text selectable style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '900' }}>{nextLabel}</Text><Symbol name="arrow.right" size={12} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      <View style={{ flexDirection: 'row', gap: 9 }}>
        <Animated.View entering={FadeInDown.duration(190).delay(35)} style={{ flex: 1, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 3 }}>
          <Text selectable style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '800' }}>GESAMT GESPART</Text>
          <Text selectable numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.text, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(store.totalSaved)}</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(190).delay(65)} style={{ flex: 1, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 3 }}>
          <Text selectable style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '800' }}>OFFENE TO DOS</Text>
          <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{activeTodos.length}</Text>
        </Animated.View>
      </View>

      {monthPlanned > 0 ? (
        <Animated.View entering={FadeInDown.duration(190).delay(90)}>
          <Pressable onPress={() => router.push('/month-details')} style={({ pressed }) => ({ borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 13, gap: 9, opacity: pressed ? 0.74 : 1 })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Monatsplan</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>{formatMoney(monthSaved)} von {formatMoney(monthPlanned)}</Text></View>
              <Text selectable style={{ color: monthRemaining > 0 ? colors.text : colors.success, fontSize: 10, fontWeight: '800' }}>{monthRemaining > 0 ? `Noch ${formatMoney(monthRemaining)}` : 'Geschafft'}</Text><Symbol name="chevron.right" size={9} color={colors.textMuted} />
            </View>
            <ProgressBar value={monthProgress} />
          </Pressable>
        </Animated.View>
      ) : null}

      <View style={{ gap: 7 }}>
        <Text selectable style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Übersicht</Text>
        <View style={{ borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
          <MenuRow index={0} icon="target" title="Ziele" body="Sparziele und monatliche Rücklagen" value={String(store.goals.filter((goal) => goal.mode === 'target' && goal.savedAmount < goal.targetAmount).length)} onPress={() => router.push('/(tabs)/goals')} />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 48 }} />
          <MenuRow index={1} icon="checklist" title="To Do" body="Offene Aufgaben und Fälligkeiten" value={String(activeTodos.length)} onPress={() => router.push('/(tabs)/todos')} />
          <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 48 }} />
          <MenuRow index={2} icon="trophy.fill" title="Challenges" body="Kleine Schritte, die dich dranhalten" value={String(store.challenges.filter((item) => !item.completedAt).length)} onPress={() => router.push('/(tabs)/challenges')} />
        </View>
      </View>
    </ScrollView>
  );
}
