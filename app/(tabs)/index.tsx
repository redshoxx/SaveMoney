import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { BarChart, HeroCard, IconBubble, StatTile } from '@/components/savings-ui';
import { Card, ProgressBar, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

const rouletteValues = [1, 2, 3, 5, 7, 10, 15, 20];

export default function HomeScreen() {
  const store = useAppStore();
  const [roulette, setRoulette] = useState(7);

  const run = async (action: () => Promise<void>) => {
    try { await action(); } catch (error) { Alert.alert('SparFlow', error instanceof Error ? error.message : 'Aktion fehlgeschlagen.'); }
  };

  if (store.loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  }

  const monthDelta = store.periodMetrics.previousMonth > 0
    ? ((store.periodMetrics.month - store.periodMetrics.previousMonth) / store.periodMetrics.previousMonth) * 100
    : store.periodMetrics.month > 0 ? 100 : 0;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 20 }}>
      {store.error ? <View style={{ backgroundColor: '#FDECEC', borderRadius: 16, padding: 12 }}><Text selectable style={{ color: colors.danger, fontWeight: '700' }}>{store.error}</Text></View> : null}

      <HeroCard>
        <View style={{ gap: 5 }}>
          <Text style={{ color: '#BFD7C8', fontSize: 13, fontWeight: '700' }}>INSGESAMT GESPART</Text>
          <Text selectable style={{ color: '#FFFFFF', fontSize: 38, fontWeight: '900', letterSpacing: -1.2, fontVariant: ['tabular-nums'] }}>{formatMoney(store.totalSaved)}</Text>
          <Text selectable style={{ color: '#D7E7DC', fontSize: 13 }}>{monthDelta >= 0 ? '+' : ''}{Math.round(monthDelta)} % gegenüber letztem Monat</Text>
        </View>
        <Pressable onPress={() => router.push('/save')} style={({ pressed }) => ({ minHeight: 54, borderRadius: 17, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: pressed ? 0.82 : 1 })}>
          <Symbol name="plus.circle.fill" size={20} color={colors.primaryDark} />
          <Text style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 16 }}>Geld sparen</Text>
        </Pressable>
      </HeroCard>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <StatTile icon="flame.fill" label="SPARSERIE" value={`${store.streak} Tage`} caption={store.streak >= 7 ? 'Starke Routine' : 'Heute weitermachen'} />
        <StatTile icon="trophy.fill" label={`LEVEL ${store.level}`} value={store.levelName} caption={`${store.xpInLevel} / ${store.xpTarget} XP`} />
      </View>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>LEVEL-FORTSCHRITT</Text>
            <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '850' }}>Noch {store.xpTarget - store.xpInLevel} XP bis Level {store.level + 1}</Text>
          </View>
          <IconBubble icon="star.fill" size={40} />
        </View>
        <ProgressBar value={store.xpInLevel / store.xpTarget} height={10} />
      </Card>

      {store.primaryGoal ? (
        <View style={{ gap: 10 }}>
          <SectionHeading title="Dein nächstes Ziel" />
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconBubble icon={store.primaryGoal.icon} color={store.primaryGoal.color} background={`${store.primaryGoal.color}18`} size={48} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text selectable style={{ fontSize: 19, fontWeight: '900', color: colors.text }}>{store.primaryGoal.title}</Text>
                <Text selectable style={{ fontSize: 13, color: colors.textMuted }}>{formatMoney(store.primaryGoal.savedAmount)} von {formatMoney(store.primaryGoal.targetAmount)}</Text>
              </View>
              <Text selectable style={{ fontSize: 18, fontWeight: '900', color: store.primaryGoal.color }}>{Math.round(progress(store.primaryGoal.savedAmount, store.primaryGoal.targetAmount) * 100)} %</Text>
            </View>
            <ProgressBar value={progress(store.primaryGoal.savedAmount, store.primaryGoal.targetAmount)} color={store.primaryGoal.color} height={11} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>Noch {formatMoney(Math.max(0, store.primaryGoal.targetAmount - store.primaryGoal.savedAmount))}</Text>
              {store.forecast ? <Text selectable style={{ color: colors.primaryDark, fontSize: 13, fontWeight: '800' }}>ca. {store.forecast.date.toLocaleDateString('de-AT', { day: '2-digit', month: 'short' })}</Text> : null}
            </View>
          </Card>
        </View>
      ) : (
        <Card><Text selectable style={{ color: colors.text, fontWeight: '800' }}>Lege zuerst ein Sparziel an, damit Schnell-Sparen, Aktionen und Roulette verwendet werden können.</Text><Pressable onPress={() => router.push('/add-goal')}><Text style={{ color: colors.primary, fontWeight: '900' }}>Sparziel erstellen</Text></Pressable></Card>
      )}

      {store.dueRules.length > 0 ? (
        <View style={{ gap: 10 }}>
          <SectionHeading title="Heute fällig" />
          {store.dueRules.map((rule) => (
            <Card key={rule.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconBubble icon="clock.badge.checkmark.fill" />
              <View style={{ flex: 1, gap: 3 }}><Text selectable style={{ fontWeight: '850', fontSize: 16, color: colors.text }}>{rule.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>{formatMoney(rule.amount)} · {rule.frequency === 'daily' ? 'täglich' : rule.frequency === 'weekly' ? 'wöchentlich' : 'monatlich'}</Text></View>
              <Pressable onPress={() => void run(() => store.applyRule(rule.id))} style={({ pressed }) => ({ backgroundColor: colors.primarySoft, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, opacity: pressed ? 0.7 : 1 })}><Text style={{ color: colors.primaryDark, fontWeight: '900' }}>Sparen</Text></Pressable>
            </Card>
          ))}
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <SectionHeading title="Spar-Aktionen" action={<Pressable onPress={() => router.push('/save')}><Text style={{ color: colors.primary, fontWeight: '850' }}>Eigener Betrag</Text></Pressable>} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {store.savingActions.map((action) => (
            <Pressable key={action.id} disabled={!store.primaryGoal} onPress={() => store.primaryGoal ? void run(() => store.saveToGoal(store.primaryGoal!.id, action.amount, action.title)) : undefined} style={({ pressed }) => ({ width: 150, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, borderCurve: 'continuous', padding: 15, gap: 10, opacity: pressed ? 0.7 : store.primaryGoal ? 1 : 0.45 })}>
              <IconBubble icon={action.icon} color={action.color} background={`${action.color}18`} />
              <View style={{ gap: 3 }}><Text selectable style={{ color: colors.text, fontWeight: '850', fontSize: 15 }}>{action.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 11.5, lineHeight: 16 }}>{action.subtitle}</Text></View>
              <Text selectable style={{ color: action.color, fontWeight: '900', fontSize: 18 }}>+{formatMoney(action.amount)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeading title="Spar-Roulette" />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <IconBubble icon="die.face.5.fill" color={colors.purple} background="#EEE8FA" size={52} />
            <View style={{ flex: 1, gap: 2 }}><Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>HEUTIGER BETRAG</Text><Text selectable style={{ color: colors.text, fontSize: 30, fontWeight: '900' }}>{formatMoney(roulette)}</Text></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={() => setRoulette(rouletteValues[Math.floor(Math.random() * rouletteValues.length)])} style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEE8FA', opacity: pressed ? 0.7 : 1 })}><Text style={{ color: colors.purple, fontWeight: '900' }}>Neu drehen</Text></Pressable>
            <Pressable disabled={!store.primaryGoal} onPress={() => store.primaryGoal ? void run(() => store.saveToGoal(store.primaryGoal!.id, roulette, 'Spar-Roulette')) : undefined} style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.purple, opacity: !store.primaryGoal ? 0.4 : pressed ? 0.75 : 1 })}><Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Sparen</Text></Pressable>
          </View>
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeading title="No-Spend-Day" />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}><IconBubble icon={store.todayIsNoSpend ? 'checkmark.seal.fill' : 'hand.thumbsup.fill'} /><View style={{ flex: 1, gap: 3 }}><Text selectable style={{ fontSize: 17, fontWeight: '850', color: colors.text }}>{store.todayIsNoSpend ? 'Heute geschafft' : 'Heute nichts Unnötiges gekauft?'}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>{store.todayIsNoSpend ? 'Der Tag zählt für deine No-Spend-Erfolge.' : 'Markiere den Tag und sammle Fortschritt.'}</Text></View></View>
          {!store.todayIsNoSpend ? <Pressable onPress={() => void run(() => store.markNoSpend())} style={({ pressed }) => ({ minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, opacity: pressed ? 0.7 : 1 })}><Text style={{ color: colors.primaryDark, fontWeight: '900' }}>No-Spend-Day geschafft</Text></Pressable> : null}
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeading title="Diese Woche" action={<Pressable onPress={() => router.push('/statistics')}><Text style={{ color: colors.primary, fontWeight: '850' }}>Details</Text></Pressable>} />
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><View><Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>GESPART</Text><Text selectable style={{ color: colors.text, fontSize: 26, fontWeight: '900' }}>{formatMoney(store.periodMetrics.week)}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>AKTIONEN</Text><Text selectable style={{ color: colors.text, fontSize: 26, fontWeight: '900' }}>{store.contributions.filter((item) => new Date(item.createdAt).getTime() >= new Date().getTime() - 7 * 86_400_000).length}</Text></View></View>
          <BarChart data={store.weeklyData} height={90} />
        </Card>
      </View>
    </ScrollView>
  );
}
