import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Card, EmptyState, Pill, ProgressBar, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

const quickAmounts = [5, 10, 20, 50];

export default function HomeScreen() {
  const store = useAppStore();
  const activeGoal = store.goals.find((goal) => goal.savedAmount < goal.targetAmount) ?? store.goals[0];
  const activeChallenge = store.challenges.find((challenge) => !challenge.completedAt);

  if (store.loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 18 }}
    >
      {store.error ? (
        <View style={{ backgroundColor: '#FDECEC', borderRadius: 16, padding: 12 }}>
          <Text selectable style={{ color: colors.danger, fontWeight: '700' }}>{store.error}</Text>
        </View>
      ) : null}

      <Card
        style={{
          backgroundColor: colors.primaryDark,
          borderColor: colors.primaryDark,
          padding: 22,
          gap: 18,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ gap: 5, flex: 1 }}>
            <Text style={{ color: '#BDE0C9', fontWeight: '700', fontSize: 13 }}>GESAMT GESPART</Text>
            <Text
              selectable
              style={{ color: '#FFFFFF', fontSize: 38, fontWeight: '900', letterSpacing: -1.2, fontVariant: ['tabular-nums'] }}
            >
              {formatMoney(store.totalSaved)}
            </Text>
          </View>
          <View style={{ backgroundColor: '#FFFFFF1A', borderRadius: 18, padding: 12 }}>
            <Symbol name="leaf.fill" size={23} color="#FFFFFF" />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF12', borderRadius: 16, padding: 12, gap: 4 }}>
            <Text style={{ color: '#BDE0C9', fontSize: 12, fontWeight: '700' }}>LEVEL</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900' }}>{store.level}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF12', borderRadius: 16, padding: 12, gap: 4 }}>
            <Text style={{ color: '#BDE0C9', fontSize: 12, fontWeight: '700' }}>SERIE</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900' }}>{store.streak} Tage</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF12', borderRadius: 16, padding: 12, gap: 4 }}>
            <Text style={{ color: '#BDE0C9', fontSize: 12, fontWeight: '700' }}>XP</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900' }}>{store.xpInLevel}/100</Text>
          </View>
        </View>
      </Card>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Schnell sparen" />
        {activeGoal ? (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>IN „{activeGoal.title.toUpperCase()}“</Text>
                <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
                  {formatMoney(activeGoal.savedAmount)} von {formatMoney(activeGoal.targetAmount)}
                </Text>
              </View>
              <Pill>{Math.round(progress(activeGoal.savedAmount, activeGoal.targetAmount) * 100)}%</Pill>
            </View>
            <ProgressBar value={progress(activeGoal.savedAmount, activeGoal.targetAmount)} color={activeGoal.color} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {quickAmounts.map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => void store.saveToGoal(activeGoal.id, amount)}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 46,
                    borderRadius: 15,
                    borderCurve: 'continuous',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primarySoft,
                    opacity: pressed ? 0.72 : 1,
                  })}
                >
                  <Text style={{ color: colors.primaryDark, fontWeight: '900', fontVariant: ['tabular-nums'] }}>+{amount} €</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : (
          <Pressable onPress={() => router.push('/add-goal')}>
            <EmptyState
              icon="plus.circle.fill"
              title="Erstes Sparziel anlegen"
              body="Danach kannst du mit einem Fingertipp 5 €, 10 €, 20 € oder 50 € sparen."
            />
          </Pressable>
        )}
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading
          title="Aktive Challenge"
          action={
            <Pressable onPress={() => router.push('/(tabs)/challenges')}>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>Alle</Text>
            </Pressable>
          }
        />
        {activeChallenge ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  backgroundColor: `${activeChallenge.color}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Symbol name={activeChallenge.icon} size={21} color={activeChallenge.color} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text selectable style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{activeChallenge.title}</Text>
                <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
                  {activeChallenge.completedSteps}/{activeChallenge.totalSteps} Schritte
                </Text>
              </View>
              <Text style={{ color: colors.text, fontWeight: '900' }}>{formatMoney(activeChallenge.savedAmount)}</Text>
            </View>
            <ProgressBar value={progress(activeChallenge.savedAmount, activeChallenge.targetAmount)} color={activeChallenge.color} />
            <Pressable
              onPress={() => void store.completeChallengeStep(activeChallenge.id)}
              style={({ pressed }) => ({
                minHeight: 48,
                borderRadius: 15,
                backgroundColor: activeChallenge.color,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>+ {formatMoney(activeChallenge.stepAmount)} Schritt erledigt</Text>
            </Pressable>
          </Card>
        ) : (
          <Pressable onPress={() => router.push('/(tabs)/challenges')}>
            <EmptyState
              icon="flag.fill"
              title="Challenge auswählen"
              body="Starte eine Vorlage oder erstelle deine eigene Challenge."
            />
          </Pressable>
        )}
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Letzte Erfolge" />
        {store.contributions.length ? (
          <Card style={{ paddingVertical: 6, gap: 0 }}>
            {store.contributions.slice(0, 5).map((item, index) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 13,
                  borderBottomWidth: index === Math.min(4, store.contributions.length - 1) ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Symbol name="plus" size={15} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={{ color: colors.text, fontWeight: '700' }}>{item.note ?? 'Gespart'}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleDateString('de-AT', { day: '2-digit', month: 'short' })}
                  </Text>
                </View>
                <Text selectable style={{ color: colors.primary, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                  +{formatMoney(item.amount)}
                </Text>
              </View>
            ))}
          </Card>
        ) : (
          <Text selectable style={{ color: colors.textMuted, lineHeight: 20 }}>Deine ersten Einzahlungen erscheinen hier.</Text>
        )}
      </View>
    </ScrollView>
  );
}
