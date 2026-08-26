import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { GlowIcon, NeonCard } from '@/components/neon-ui';
import { Symbol } from '@/components/ui';
import { accents, colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

const QUICK = [5, 10, 20, 50];

function Tool({ icon, title, subtitle, color, onPress }: { icon: string; title: string; subtitle: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ width: '48.5%', opacity: pressed ? 0.68 : 1 })}>
      <NeonCard accent={color} style={{ minHeight: 100, padding: 12, gap: 8 }}>
        <GlowIcon name={icon} color={color} size={15} />
        <Text numberOfLines={2} style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>{title}</Text>
        <Text numberOfLines={2} style={{ color: colors.textMuted, fontSize: 9.5, lineHeight: 13 }}>{subtitle}</Text>
      </NeonCard>
    </Pressable>
  );
}

export default function ActionsScreen() {
  const store = useAppStore();
  const goal = store.primaryGoal;

  const saveNow = async (amount: number) => {
    if (!goal) { router.replace('/add-goal'); return; }
    try { await store.saveToGoal(goal.id, amount, 'Schnell sparen'); router.back(); }
    catch (error) { Alert.alert('SparFlow', error instanceof Error ? error.message : 'Sparen fehlgeschlagen.'); }
  };

  const quickSave = (amount: number) => {
    if (!goal || !store.preferences.confirmQuickSave) { void saveNow(amount); return; }
    Alert.alert(`${formatMoney(amount)} sparen?`, `Direkt zu „${goal.title}“ hinzufügen.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Sparen', onPress: () => void saveNow(amount) },
    ]);
  };

  const tools = [
    { icon: 'banknote.fill', title: 'Betrag sparen', subtitle: 'Eigener Betrag', color: colors.blue, onPress: () => router.replace('/save') },
    { icon: 'minus.circle.fill', title: 'Betrag abziehen', subtitle: 'Entnahme buchen', color: colors.danger, onPress: () => router.replace({ pathname: '/save', params: { mode: 'withdraw' } }) },
    { icon: 'target', title: 'Neues Ziel', subtitle: 'Mit Zielbetrag', color: colors.purple, onPress: () => router.replace({ pathname: '/add-goal', params: { mode: 'target' } }) },
    { icon: 'arrow.triangle.2.circlepath', title: 'Neue Rücklage', subtitle: 'Monatlich sparen', color: colors.cyan, onPress: () => router.replace({ pathname: '/add-goal', params: { mode: 'recurring' } }) },
    { icon: 'flag.fill', title: 'Challenge', subtitle: 'Sparspiel starten', color: colors.magenta, onPress: () => router.replace('/(tabs)/challenges') },
    { icon: 'clock.badge.checkmark.fill', title: 'Sparregeln', subtitle: 'Routine planen', color: colors.orange, onPress: () => router.replace('/rules') },
    { icon: 'clock.arrow.circlepath', title: 'Verlauf', subtitle: 'Buchungen prüfen', color: accents[1], onPress: () => router.replace('/history') },
    { icon: 'chart.bar.fill', title: 'Statistik', subtitle: 'Fortschritt sehen', color: accents[0], onPress: () => router.replace('/statistics') },
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 15, paddingBottom: 38, gap: 15 }}>
      <View style={{ gap: 3 }}><Text style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>Was möchtest du tun?</Text><Text style={{ color: colors.textMuted, fontSize: 11.5 }}>Die wichtigsten Aktionen in maximal zwei Schritten.</Text></View>

      {goal && store.preferences.showQuickAmounts ? (
        <NeonCard accent={colors.primary} glow>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><GlowIcon name="bolt.fill" color={colors.primaryDark} size={15} /><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>Schnell zu {goal.title}</Text><Text style={{ color: colors.textMuted, fontSize: 10 }}>Ein Tap genügt</Text></View></View>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {QUICK.map((amount, index) => {
              const accent = accents[index % accents.length] ?? colors.primary;
              return (
                <Pressable key={amount} onPress={() => quickSave(amount)} style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: `${accent}25`, borderWidth: 1, borderColor: `${accent}75`, opacity: pressed ? 0.7 : 1, boxShadow: `0 0 12px ${accent}2E` })}>
                  <Text style={{ color: accent, fontSize: 13, fontWeight: '900' }}>+{amount}</Text>
                </Pressable>
              );
            })}
          </View>
        </NeonCard>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
        {tools.map((tool) => <Tool key={tool.title} {...tool} />)}
      </View>

      <Pressable onPress={() => router.replace('/achievements')} style={({ pressed }) => ({ minHeight: 48, borderRadius: 15, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: `${colors.primary}60`, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 10, opacity: pressed ? 0.72 : 1 })}>
        <GlowIcon name="trophy.fill" color={colors.warning} size={14} />
        <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>Erfolge ansehen</Text><Text style={{ color: colors.textMuted, fontSize: 10 }}>Meilensteine und Serien</Text></View>
        <Symbol name="chevron.right" size={10} color={colors.textMuted} />
      </Pressable>
    </ScrollView>
  );
}
