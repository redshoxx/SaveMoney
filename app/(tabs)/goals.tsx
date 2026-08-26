import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { NeonProgress } from '@/components/neon-ui';
import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { Goal } from '@/types/models';
import { formatMoney, progress } from '@/utils/money';

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

function GoalCard({ goal, monthSaved, onDelete }: { goal: Goal; monthSaved: number; onDelete: () => void }) {
  const recurring = goal.mode === 'recurring';
  const target = recurring ? Math.max(0, goal.recurringAmount ?? goal.targetAmount) : Math.max(0, goal.targetAmount);
  const current = recurring ? monthSaved : Math.max(0, goal.savedAmount);
  const percentage = progress(current, target);
  const remaining = Math.max(0, target - Math.min(current, target));
  const completed = !recurring && remaining <= 0;

  return (
    <View style={{ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: `${goal.color}18`, alignItems: 'center', justifyContent: 'center' }}>
          <Symbol name={goal.icon} size={18} color={goal.color} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{goal.title}</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>{recurring ? 'Monatliche Rücklage' : completed ? 'Ziel erreicht' : 'Sparziel'}</Text>
        </View>
        {!completed ? (
          <Pressable accessibilityLabel="Erinnerung einstellen" onPress={() => router.push({ pathname: '/reminders', params: { kind: 'goal', id: goal.id } })} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 11, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
            <Symbol name="bell" size={14} color={colors.textMuted} />
          </Pressable>
        ) : null}
        <Pressable accessibilityLabel="Ziel verwalten" onPress={onDelete} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.55 : 1 })}>
          <Symbol name="ellipsis" size={14} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={{ gap: 7 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <Text selectable style={{ flex: 1, color: colors.text, fontSize: 19, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(current)}</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>von {formatMoney(target)}</Text>
        </View>
        <NeonProgress value={percentage} color={completed ? colors.success : goal.color} height={6} />
        <Text selectable style={{ color: completed ? colors.success : colors.textMuted, fontSize: 10.5, fontWeight: completed ? '800' : '600' }}>
          {completed ? 'Geschafft' : recurring ? `${formatMoney(remaining)} fehlen diesen Monat` : `${formatMoney(remaining)} fehlen noch`}
        </Text>
      </View>

      {!completed ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => router.push({ pathname: '/save', params: { goalId: goal.id, mode: 'save' } })} style={({ pressed }) => ({ flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: pressed ? 0.7 : 1 })}>
            <Symbol name="plus" size={13} color="#FFFFFF" />
            <Text selectable style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>Einzahlen</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/goal-detail', params: { goalId: goal.id } })} style={({ pressed }) => ({ minWidth: 92, minHeight: 46, borderRadius: 14, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}>
            <Text selectable style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>Details</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => router.push({ pathname: '/goal-detail', params: { goalId: goal.id } })} style={({ pressed }) => ({ minHeight: 44, borderRadius: 13, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}>
          <Text selectable style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>Ziel ansehen</Text>
        </Pressable>
      )}
    </View>
  );
}

function SectionHeader({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>{title}</Text>
      <Text selectable style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>{body}</Text>
    </View>
  );
}

export default function GoalsScreen() {
  const store = useAppStore();
  const recurringGoals = store.goals.filter((goal) => goal.mode === 'recurring');
  const activeTargets = store.goals.filter((goal) => goal.mode === 'target' && goal.savedAmount < goal.targetAmount);
  const completedTargets = store.goals.filter((goal) => goal.mode === 'target' && goal.savedAmount >= goal.targetAmount);

  const manage = (goal: Goal) => {
    Alert.alert(goal.title, 'Was möchtest du tun?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Details öffnen', onPress: () => router.push({ pathname: '/goal-detail', params: { goalId: goal.id } }) },
      { text: 'Ziel löschen', style: 'destructive', onPress: () => void store.deleteGoal(goal.id) },
    ]);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 12, paddingBottom: 112, gap: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>Ziele</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>Hier siehst du, wofür du sparst.</Text>
        </View>
        <Pressable onPress={() => router.push('/add-goal')} style={({ pressed }) => ({ minHeight: 42, paddingHorizontal: 12, borderRadius: 13, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}>
          <Symbol name="plus" size={13} color="#FFFFFF" />
          <Text selectable style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>Neues Ziel</Text>
        </Pressable>
      </View>

      {store.goals.length === 0 ? (
        <View style={{ borderRadius: 20, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 12, alignItems: 'center' }}>
          <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Symbol name="target" size={22} color={colors.primary} />
          </View>
          <View style={{ gap: 4, alignItems: 'center' }}>
            <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>Starte mit einem Ziel</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 11, lineHeight: 16, textAlign: 'center' }}>Zum Beispiel Urlaub, Notgroschen oder eine monatliche Rücklage.</Text>
          </View>
          <Pressable onPress={() => router.push('/add-goal')} style={({ pressed }) => ({ minHeight: 48, alignSelf: 'stretch', borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
            <Text selectable style={{ color: '#FFFFFF', fontWeight: '900' }}>Erstes Ziel anlegen</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {recurringGoals.length ? (
            <View style={{ gap: 9 }}>
              <SectionHeader title="Jeden Monat zurücklegen" body="Für Fixkosten, Rücklagen oder Beträge, die jeden Monat wiederkommen." />
              <View style={{ gap: 9 }}>
                {recurringGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} monthSaved={savedThisMonth(store.contributions, goal.id)} onDelete={() => manage(goal)} />
                ))}
              </View>
            </View>
          ) : null}

          {activeTargets.length ? (
            <View style={{ gap: 9 }}>
              <SectionHeader title="Für etwas sparen" body="Ein Zielbetrag, den du Schritt für Schritt erreichen möchtest." />
              <View style={{ gap: 9 }}>
                {activeTargets.map((goal) => <GoalCard key={goal.id} goal={goal} monthSaved={0} onDelete={() => manage(goal)} />)}
              </View>
            </View>
          ) : null}

          {completedTargets.length ? (
            <View style={{ gap: 9 }}>
              <SectionHeader title="Geschafft" body="Diese Ziele hast du bereits erreicht." />
              <View style={{ gap: 9 }}>
                {completedTargets.map((goal) => <GoalCard key={goal.id} goal={goal} monthSaved={0} onDelete={() => manage(goal)} />)}
              </View>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
