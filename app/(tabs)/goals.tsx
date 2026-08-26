import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { GlowIcon, NeonAction, NeonCard, NeonProgress, ProfileButton, ScreenHeader } from '@/components/neon-ui';
import { EmptyState, Symbol } from '@/components/ui';
import { accents, colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { Goal } from '@/types/models';
import { formatMoney, progress } from '@/utils/money';

function savedThisMonth(contributions: ReturnType<typeof useAppStore>['contributions'], goalId: string) {
  const now = new Date();
  return Math.max(0, contributions.reduce((sum, item) => {
    if (item.sourceType !== 'goal' || item.sourceId !== goalId) return sum;
    const date = new Date(item.createdAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() ? sum + item.amount : sum;
  }, 0));
}

function AreaCard({ goal, monthSaved, accent, onDelete }: { goal: Goal; monthSaved: number; accent: string; onDelete: () => void }) {
  const recurring = goal.mode === 'recurring';
  const recurringAmount = goal.recurringAmount ?? goal.targetAmount;
  const completed = !recurring && goal.savedAmount >= goal.targetAmount;
  const current = recurring ? monthSaved : goal.savedAmount;
  const target = recurring ? recurringAmount : goal.targetAmount;
  const percentage = progress(current, target);
  const change = (mode: 'save' | 'withdraw') => router.push({ pathname: '/save', params: { goalId: goal.id, mode } });

  return (
    <NeonCard accent={accent} glow={percentage >= 0.95} style={{ padding: 13, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <GlowIcon name={completed ? 'checkmark.seal.fill' : goal.icon} color={accent} size={16} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 15.5, fontWeight: '900' }}>{goal.title}</Text>
          <Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 10.5 }}>
            {recurring
              ? `${formatMoney(current)} von ${formatMoney(target)} diesen Monat`
              : completed
                ? `${formatMoney(goal.targetAmount)} erreicht`
                : `${formatMoney(goal.savedAmount)} von ${formatMoney(goal.targetAmount)}`}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ color: accent, fontSize: 13, fontWeight: '900' }}>{Math.round(percentage * 100)}%</Text>
          <Text style={{ color: colors.textMuted, fontSize: 9 }}>{recurring ? 'Monat' : completed ? 'Fertig' : 'Ziel'}</Text>
        </View>
        <Pressable accessibilityLabel={`${goal.title} verwalten`} onPress={onDelete} hitSlop={10} style={{ width: 28, height: 34, alignItems: 'center', justifyContent: 'center' }}>
          <Symbol name="ellipsis" size={15} color={colors.textMuted} />
        </Pressable>
      </View>

      <NeonProgress value={percentage} color={accent} height={5} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 10.5 }}>
            {recurring
              ? `${formatMoney(recurringAmount)} monatlich · Tag ${goal.recurringDay ?? 1}`
              : completed
                ? `Gesamt ${formatMoney(goal.savedAmount)}`
                : `${formatMoney(Math.max(0, goal.targetAmount - goal.savedAmount))} offen`}
          </Text>
        </View>
        {!completed ? <NeonAction icon="plus" label="Sparen" onPress={() => change('save')} color={accent} /> : null}
        <NeonAction icon="minus" label={completed ? 'Korrigieren' : 'Abziehen'} onPress={() => change('withdraw')} muted />
      </View>
    </NeonCard>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ gap: 2 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export default function GoalsScreen() {
  const store = useAppStore();
  const recurringGoals = store.goals.filter((goal) => goal.mode === 'recurring');
  const activeTargets = store.goals.filter((goal) => goal.mode === 'target' && goal.savedAmount < goal.targetAmount);
  const completedTargets = store.goals.filter((goal) => goal.mode === 'target' && goal.savedAmount >= goal.targetAmount);
  const totalInAreas = Math.max(0, store.goals.reduce((sum, goal) => sum + goal.savedAmount, 0));
  const monthlyPlanned = recurringGoals.reduce((sum, goal) => sum + (goal.recurringAmount ?? goal.targetAmount), 0);

  const remove = (goal: Goal) => {
    Alert.alert('Sparbereich verwalten', goal.title, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteGoal(goal.id) },
    ]);
  };

  const card = (goal: Goal, index: number) => (
    <AreaCard
      key={goal.id}
      goal={goal}
      monthSaved={goal.mode === 'recurring' ? savedThisMonth(store.contributions, goal.id) : 0}
      accent={accents[index % accents.length] ?? colors.primary}
      onDelete={() => remove(goal)}
    />
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 14, paddingBottom: 104, gap: 15 }}>
      <ScreenHeader
        title="Meine Bereiche"
        subtitle="Rücklagen und Ziele – klar, schnell und lebendig."
        right={<ProfileButton />}
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <NeonCard accent={colors.blue} style={{ flex: 1, padding: 12, gap: 5 }}>
          <GlowIcon name="tray.full.fill" color={colors.blue} size={14} />
          <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '900' }}>IN BEREICHEN</Text>
          <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{formatMoney(totalInAreas)}</Text>
        </NeonCard>
        <NeonCard accent={colors.purple} style={{ flex: 1, padding: 12, gap: 5 }}>
          <GlowIcon name="calendar" color={colors.purple} size={14} />
          <Text style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '900' }}>MONAT GEPLANT</Text>
          <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{formatMoney(monthlyPlanned)}</Text>
        </NeonCard>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/add-goal')}
        style={({ pressed }) => ({
          minHeight: 48,
          borderRadius: 15,
          borderWidth: 1,
          borderColor: `${colors.primary}60`,
          backgroundColor: colors.primarySoft,
          paddingHorizontal: 13,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          opacity: pressed ? 0.72 : 1,
          boxShadow: `0 0 18px ${colors.glow}`,
        })}
      >
        <GlowIcon name="plus" color={colors.primaryDark} size={14} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>Neuen Sparbereich anlegen</Text>
          <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Zielbetrag oder monatliche Rücklage</Text>
        </View>
        <Symbol name="chevron.right" size={10} color={colors.primaryDark} />
      </Pressable>

      {store.goals.length === 0 ? (
        <EmptyState icon="target" title="Noch kein Sparbereich" body="Lege ein Ziel oder eine monatliche Rücklage an." />
      ) : (
        <>
          {recurringGoals.length ? <Section title="Monatliche Rücklagen" subtitle="Regelmäßig zurücklegen, ohne künstlichen Endbetrag.">{recurringGoals.map((goal, index) => card(goal, index))}</Section> : null}
          {activeTargets.length ? <Section title="Sparziele">{activeTargets.map((goal, index) => card(goal, index + recurringGoals.length))}</Section> : null}
          {completedTargets.length ? <Section title="Erreicht" subtitle="Deine abgeschlossenen Ziele bleiben als Erfolg sichtbar.">{completedTargets.map((goal, index) => card(goal, index + recurringGoals.length + activeTargets.length))}</Section> : null}
        </>
      )}
    </ScrollView>
  );
}
