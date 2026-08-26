import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatEntityNumber } from '@/utils/entity-number';
import { formatMoney } from '@/utils/money';

const QUICK = [5, 10, 20, 50];

function ToolRow({ icon, title, subtitle, onPress, index }: { icon: string; title: string; subtitle: string; onPress: () => void; index: number }) {
  return <Animated.View entering={FadeInDown.duration(170).delay(Math.min(index, 8) * 22)}><Pressable onPress={onPress} style={({ pressed }) => ({ minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.7 : 1 })}><View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Symbol name={icon} size={16} color={colors.primaryDark} /></View><View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>{title}</Text><Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 9.5 }}>{subtitle}</Text></View><Symbol name="chevron.right" size={10} color={colors.textMuted} /></Pressable></Animated.View>;
}

export default function ActionsScreen() {
  const store = useAppStore();
  const goal = store.primaryGoal;

  const saveNow = async (amount: number) => {
    if (!goal) { router.replace('/add-goal'); return; }
    try { await store.saveToGoal(goal.id, amount, 'Schnell sparen'); router.back(); }
    catch (error) { Alert.alert('SparPilot', error instanceof Error ? error.message : 'Sparen fehlgeschlagen.'); }
  };

  const quickSave = (amount: number) => {
    if (!goal || !store.preferences.confirmQuickSave) { void saveNow(amount); return; }
    Alert.alert(`${formatMoney(amount)} sparen?`, `Direkt zu „${goal.title}“ hinzufügen.`, [{ text: 'Abbrechen', style: 'cancel' }, { text: 'Sparen', onPress: () => void saveNow(amount) }]);
  };

  const tools = [
    { icon: 'banknote.fill', title: 'Betrag sparen', subtitle: 'Einen eigenen Betrag einzahlen', onPress: () => router.replace('/save') },
    { icon: 'minus.circle.fill', title: 'Betrag abziehen', subtitle: 'Eine Entnahme buchen', onPress: () => router.replace({ pathname: '/save', params: { mode: 'withdraw' } }) },
    { icon: 'target', title: 'Neues Sparziel', subtitle: 'Ein Ziel mit Wunschbetrag anlegen', onPress: () => router.replace({ pathname: '/add-goal', params: { mode: 'target' } }) },
    { icon: 'arrow.triangle.2.circlepath', title: 'Neue Rücklage', subtitle: 'Einen monatlichen Betrag planen', onPress: () => router.replace({ pathname: '/add-goal', params: { mode: 'recurring' } }) },
    { icon: 'trophy.fill', title: 'Challenge', subtitle: 'Eine Spar-Challenge starten', onPress: () => router.replace('/(tabs)/challenges') },
    { icon: 'clock.badge.checkmark.fill', title: 'Sparregeln', subtitle: 'Eine wiederkehrende Routine anlegen', onPress: () => router.replace('/rules') },
    { icon: 'clock.arrow.circlepath', title: 'Verlauf', subtitle: 'Buchungen ansehen', onPress: () => router.replace('/history') },
    { icon: 'chart.bar.fill', title: 'Statistik', subtitle: 'Fortschritt auswerten', onPress: () => router.replace('/statistics') },
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 34, gap: 14 }}>
      <View style={{ gap: 3 }}><Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>Weitere Funktionen</Text><Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Alles Weitere an einem Ort.</Text></View>

      {goal && store.preferences.showQuickAmounts ? <View style={{ borderRadius: 17, backgroundColor: colors.primarySoft, padding: 12, gap: 10 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}><Symbol name="bolt.fill" size={15} color={colors.primaryDark} /></View><View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>Schnell zu {goal.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9 }}>{formatEntityNumber(goal.displayNumber)}</Text></View></View><View style={{ flexDirection: 'row', gap: 6 }}>{QUICK.map((amount) => <Pressable key={amount} onPress={() => quickSave(amount)} style={({ pressed }) => ({ flex: 1, minHeight: 41, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, opacity: pressed ? 0.72 : 1 })}><Text selectable style={{ color: colors.primaryDark, fontSize: 11.5, fontWeight: '900' }}>+{amount} €</Text></Pressable>)}</View></View> : null}

      <View style={{ borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>{tools.map((tool, index) => <View key={tool.title}>{index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 48 }} /> : null}<ToolRow {...tool} index={index} /></View>)}</View>

      <Pressable onPress={() => router.replace('/achievements')} style={({ pressed }) => ({ minHeight: 50, borderRadius: 14, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 9, opacity: pressed ? 0.72 : 1 })}><Symbol name="trophy.fill" size={15} color={colors.warning} /><View style={{ flex: 1 }}><Text selectable style={{ color: colors.text, fontSize: 11.5, fontWeight: '900' }}>Erfolge</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>Meilensteine und Serien ansehen</Text></View><Symbol name="chevron.right" size={10} color={colors.textMuted} /></Pressable>
    </ScrollView>
  );
}
