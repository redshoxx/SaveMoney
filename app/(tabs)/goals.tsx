import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { IconBubble } from '@/components/savings-ui';
import { Card, EmptyState, ProgressBar, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { forecastGoal } from '@/utils/insights';
import { formatMoney, progress } from '@/utils/money';

const quick = [5, 10, 20];

export default function GoalsScreen() {
  const store = useAppStore();

  const save = async (goalId: string, amount: number) => {
    try { await store.saveToGoal(goalId, amount); }
    catch (error) { Alert.alert('SparFlow', error instanceof Error ? error.message : 'Sparen fehlgeschlagen.'); }
  };

  const remove = (id: string, title: string) => {
    Alert.alert('Sparziel löschen?', `„${title}“ und die zugehörigen Buchungen werden entfernt.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteGoal(id) },
    ]);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 18 }}>
      <View style={{ gap: 5 }}>
        <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 }}>Deine Ziele</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>Klare Ziele, sichtbarer Fortschritt und kleine Meilensteine statt komplizierter Budgets.</Text>
      </View>

      <Pressable onPress={() => router.push('/add-goal')} style={({ pressed }) => ({ minHeight: 54, borderRadius: 18, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.78 : 1 })}>
        <Symbol name="plus" size={17} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>Neues Sparziel</Text>
      </Pressable>

      <SectionHeading title={`Meine Ziele · ${store.goals.length}`} />

      {store.goals.length === 0 ? (
        <EmptyState icon="target" title="Noch kein Sparziel" body="Lege zum Beispiel Urlaub, Notgroschen, Auto oder Technik als Ziel an." />
      ) : (
        <View style={{ gap: 14 }}>
          {store.goals.map((goal) => {
            const percentage = progress(goal.savedAmount, goal.targetAmount);
            const complete = percentage >= 1;
            const forecast = forecastGoal(goal, store.contributions);
            const milestone = percentage >= 1 ? '100 %' : percentage >= 0.75 ? '75 %' : percentage >= 0.5 ? '50 %' : percentage >= 0.25 ? '25 %' : null;
            return (
              <Card key={goal.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <IconBubble icon={complete ? 'checkmark.circle.fill' : goal.icon} color={goal.color} background={`${goal.color}18`} size={50} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>{goal.title}</Text>
                    <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>{complete ? 'Ziel erreicht' : `Noch ${formatMoney(goal.targetAmount - goal.savedAmount)}`}</Text>
                  </View>
                  <Pressable onPress={() => remove(goal.id, goal.title)} hitSlop={10}><Symbol name="ellipsis" size={19} color={colors.textMuted} /></Pressable>
                </View>

                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
                    <Text selectable style={{ color: colors.text, fontSize: 25, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(goal.savedAmount)}</Text>
                    <Text selectable style={{ color: goal.color, fontSize: 17, fontWeight: '900' }}>{Math.round(percentage * 100)} %</Text>
                  </View>
                  <ProgressBar value={percentage} color={goal.color} height={11} />
                  <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>von {formatMoney(goal.targetAmount)}</Text>
                </View>

                {milestone ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${goal.color}12`, borderRadius: 14, padding: 11 }}>
                    <Symbol name="sparkles" size={16} color={goal.color} />
                    <Text selectable style={{ flex: 1, color: goal.color, fontWeight: '800', fontSize: 13 }}>{complete ? 'Ziel geschafft – starker Abschluss.' : `${milestone}-Meilenstein erreicht.`}</Text>
                  </View>
                ) : null}

                {!complete ? (
                  <>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {quick.map((amount) => (
                        <Pressable key={amount} onPress={() => void save(goal.id, amount)} style={({ pressed }) => ({ flex: 1, minHeight: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.7 : 1 })}>
                          <Text style={{ color: colors.text, fontWeight: '900' }}>+{amount} €</Text>
                        </Pressable>
                      ))}
                      <Pressable onPress={() => router.push('/save')} style={({ pressed }) => ({ width: 44, minHeight: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, opacity: pressed ? 0.7 : 1 })}><Symbol name="plus" size={16} color={colors.primaryDark} /></Pressable>
                    </View>
                    {forecast ? <Text selectable style={{ color: colors.primaryDark, fontSize: 12.5, fontWeight: '800' }}>Bei deinem aktuellen Tempo ungefähr am {forecast.date.toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' })} erreicht.</Text> : <Text selectable style={{ color: colors.textMuted, fontSize: 12.5 }}>Spare ein paar Tage regelmäßig, dann berechnet SparFlow eine Ziel-Prognose.</Text>}
                  </>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
