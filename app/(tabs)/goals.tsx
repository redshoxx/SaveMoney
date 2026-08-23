import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Card, EmptyState, ProgressBar, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

export default function GoalsScreen() {
  const store = useAppStore();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 18 }}>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
          Wenige, klare Ziele funktionieren besser als komplizierte Budgets. Lege ein Ziel fest und buche kleine Beträge hinein.
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/add-goal')}
        style={({ pressed }) => ({
          minHeight: 54,
          borderRadius: 18,
          borderCurve: 'continuous',
          backgroundColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Symbol name="plus" size={16} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>Neues Sparziel</Text>
      </Pressable>

      <SectionHeading title={`Meine Ziele · ${store.goals.length}`} />

      {store.goals.length === 0 ? (
        <EmptyState icon="target" title="Noch kein Sparziel" body="Zum Beispiel Notgroschen, Urlaub oder ein neues Gerät." />
      ) : (
        <View style={{ gap: 14 }}>
          {store.goals.map((goal) => {
            const percentage = progress(goal.savedAmount, goal.targetAmount);
            const complete = percentage >= 1;
            return (
              <Card key={goal.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      backgroundColor: `${goal.color}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Symbol name={complete ? 'checkmark.circle.fill' : goal.icon} size={22} color={goal.color} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{goal.title}</Text>
                    <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
                      {complete ? 'Ziel erreicht' : `${formatMoney(goal.targetAmount - goal.savedAmount)} fehlen noch`}
                    </Text>
                  </View>
                  <Text selectable style={{ color: goal.color, fontWeight: '900', fontSize: 16 }}>
                    {Math.round(percentage * 100)}%
                  </Text>
                </View>

                <ProgressBar value={percentage} color={goal.color} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <Text selectable style={{ color: colors.text, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                    {formatMoney(goal.savedAmount)}
                  </Text>
                  <Text selectable style={{ color: colors.textMuted, fontVariant: ['tabular-nums'] }}>
                    von {formatMoney(goal.targetAmount)}
                  </Text>
                </View>

                {!complete ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[10, 25, 50].map((amount) => (
                      <Pressable
                        key={amount}
                        onPress={() => void store.saveToGoal(goal.id, amount)}
                        style={({ pressed }) => ({
                          flex: 1,
                          minHeight: 44,
                          borderRadius: 14,
                          backgroundColor: colors.primarySoft,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: pressed ? 0.72 : 1,
                        })}
                      >
                        <Text style={{ color: colors.primaryDark, fontWeight: '900' }}>+{amount} €</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <Pressable
                  onPress={() =>
                    Alert.alert('Sparziel löschen?', 'Alle Einzahlungen dieses Ziels werden ebenfalls entfernt.', [
                      { text: 'Abbrechen', style: 'cancel' },
                      { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteGoal(goal.id) },
                    ])
                  }
                  style={{ alignSelf: 'flex-start', paddingVertical: 4 }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>Ziel löschen</Text>
                </Pressable>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
