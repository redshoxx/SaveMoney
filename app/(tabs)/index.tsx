import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { HeroCard, IconBubble } from '@/components/savings-ui';
import { Card, ProgressBar, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

const quickAmounts = [5, 10, 20, 50];

export default function HomeScreen() {
  const store = useAppStore();
  const primaryGoal = store.primaryGoal;
  const activeChallenge = store.challenges.find((challenge) => !challenge.completedAt);
  const dueRule = store.dueRules[0];

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Aktion fehlgeschlagen.');
    }
  };

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
      contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 18 }}>
      {store.error ? (
        <View style={{ backgroundColor: '#FDECEC', borderRadius: 16, padding: 12 }}>
          <Text selectable style={{ color: colors.danger, fontWeight: '700' }}>{store.error}</Text>
        </View>
      ) : null}

      <HeroCard>
        <View style={{ gap: 5 }}>
          <Text style={{ color: '#BFD7C8', fontSize: 12, fontWeight: '800' }}>GESPART</Text>
          <Text selectable style={{ color: '#FFFFFF', fontSize: 40, fontWeight: '900', letterSpacing: -1.3, fontVariant: ['tabular-nums'] }}>
            {formatMoney(store.totalSaved)}
          </Text>
          <Text selectable style={{ color: '#D7E7DC', fontSize: 13 }}>
            {formatMoney(store.periodMetrics.month)} diesen Monat
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/save')}
          style={({ pressed }) => ({
            minHeight: 52,
            borderRadius: 16,
            backgroundColor: '#FFFFFF',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: pressed ? 0.82 : 1,
          })}>
          <Symbol name="plus" size={18} color={colors.primaryDark} />
          <Text style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 16 }}>Geld sparen</Text>
        </Pressable>
      </HeroCard>

      {primaryGoal ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconBubble icon={primaryGoal.icon} color={primaryGoal.color} background={`${primaryGoal.color}18`} size={46} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text selectable style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>{primaryGoal.title}</Text>
              <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
                {formatMoney(primaryGoal.savedAmount)} von {formatMoney(primaryGoal.targetAmount)}
              </Text>
            </View>
            <Text selectable style={{ fontSize: 16, fontWeight: '900', color: primaryGoal.color }}>
              {Math.round(progress(primaryGoal.savedAmount, primaryGoal.targetAmount) * 100)} %
            </Text>
          </View>
          <ProgressBar value={progress(primaryGoal.savedAmount, primaryGoal.targetAmount)} color={primaryGoal.color} height={9} />
          <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
            Noch {formatMoney(Math.max(0, primaryGoal.targetAmount - primaryGoal.savedAmount))}
          </Text>
        </Card>
      ) : (
        <Card>
          <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Dein erstes Sparziel</Text>
          <Text selectable style={{ color: colors.textMuted, lineHeight: 19 }}>Lege ein Ziel an und starte direkt mit dem Sparen.</Text>
          <Pressable onPress={() => router.push('/add-goal')}>
            <Text style={{ color: colors.primary, fontWeight: '900' }}>Ziel erstellen</Text>
          </Pressable>
        </Card>
      )}

      {primaryGoal ? (
        <View style={{ gap: 9 }}>
          <SectionHeading title="Schnell sparen" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {quickAmounts.map((amount) => (
              <Pressable
                key={amount}
                onPress={() => void run(() => store.saveToGoal(primaryGoal.id, amount, 'Schnell sparen'))}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 46,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                })}>
                <Text style={{ color: colors.primaryDark, fontWeight: '900' }}>+{amount} €</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>SERIE</Text>
          <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>🔥 {store.streak} Tage</Text>
        </Card>
        <Card style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>LEVEL</Text>
          <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{store.level}</Text>
        </Card>
      </View>

      {dueRule || activeChallenge ? (
        <View style={{ gap: 9 }}>
          <SectionHeading title="Heute" />
          {dueRule ? (
            <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconBubble icon="clock.fill" size={42} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text selectable style={{ color: colors.text, fontWeight: '800' }}>{dueRule.title}</Text>
                <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>{formatMoney(dueRule.amount)}</Text>
              </View>
              <Pressable
                onPress={() => void run(() => store.applyRule(dueRule.id))}
                style={({ pressed }) => ({ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.primarySoft, opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ color: colors.primaryDark, fontWeight: '900' }}>Sparen</Text>
              </Pressable>
            </Card>
          ) : null}

          {activeChallenge ? (
            <Pressable onPress={() => router.push('/(tabs)/challenges')}>
              <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconBubble icon={activeChallenge.icon} color={activeChallenge.color} background={`${activeChallenge.color}18`} size={42} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={{ color: colors.text, fontWeight: '800' }}>{activeChallenge.title}</Text>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>
                    {formatMoney(activeChallenge.savedAmount)} von {formatMoney(activeChallenge.targetAmount)}
                  </Text>
                </View>
                <Symbol name="chevron.right" size={14} color={colors.textMuted} />
              </Card>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Pressable onPress={() => router.push('/play')} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}>
        <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconBubble icon="sparkles" size={42} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text selectable style={{ color: colors.text, fontWeight: '800' }}>Mehr Sparideen</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>Aktionen, Roulette und No-Spend</Text>
          </View>
          <Symbol name="chevron.right" size={14} color={colors.textMuted} />
        </Card>
      </Pressable>
    </ScrollView>
  );
}
