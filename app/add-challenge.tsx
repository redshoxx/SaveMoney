import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Card, PrimaryButton, ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { ChallengeMode } from '@/types/models';
import { formatMoney } from '@/utils/money';

function parseAmount(value: string) {
  return Number(value.replace(',', '.').replace(/[^0-9.]/g, ''));
}

const modes: { value: ChallengeMode; title: string; subtitle: string; icon: string }[] = [
  { value: 'fixed', title: 'Etappen', subtitle: 'Fester Betrag pro Schritt', icon: 'square.grid.2x2.fill' },
  { value: 'daily', title: 'Täglich', subtitle: 'Jeden Tag sparen', icon: 'calendar' },
  { value: 'weekly', title: 'Wöchentlich', subtitle: 'Einmal pro Woche', icon: 'calendar.badge.checkmark' },
  { value: 'action', title: 'Bei Aktion', subtitle: 'Wenn du etwas geschafft hast', icon: 'hand.tap.fill' },
  { value: 'random', title: 'Zufall', subtitle: 'Betrag spielerisch auslosen', icon: 'die.face.5.fill' },
];

export default function AddChallengeScreen() {
  const store = useAppStore();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('300');
  const [step, setStep] = useState('10');
  const [mode, setMode] = useState<ChallengeMode>('fixed');
  const [durationDays, setDurationDays] = useState<number | null>(30);
  const [saving, setSaving] = useState(false);

  const targetAmount = parseAmount(target);
  const stepAmount = mode === 'random' ? 5.5 : parseAmount(step);
  const steps = useMemo(() => {
    if (!targetAmount || !stepAmount || stepAmount <= 0) return 0;
    return Math.ceil(targetAmount / stepAmount);
  }, [stepAmount, targetAmount]);
  const valid = title.trim().length >= 2 && targetAmount > 0 && stepAmount > 0 && stepAmount <= targetAmount;

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await store.createCustomChallenge({ title, targetAmount, stepAmount, mode, durationDays });
      router.back();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Challenge konnte nicht erstellt werden.');
    } finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 80, gap: 20 }}>
        <View style={{ gap: 7 }}>
          <Text selectable style={{ color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.6 }}>Deine Regeln, dein Tempo.</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>Baue eine Challenge, die zu deinem Alltag passt – täglich, wöchentlich, bei einer Aktion oder per Zufall.</Text>
        </View>

        <View style={{ gap: 9 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Challenge-Name</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="z. B. Mittagessen mitnehmen" placeholderTextColor="#9AA39B" autoFocus style={{ minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, color: colors.text, fontSize: 16, fontWeight: '600' }} />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Wie wird gespart?</Text>
          <View style={{ gap: 9 }}>
            {modes.map((item) => {
              const selected = mode === item.value;
              return (
                <Pressable key={item.value} onPress={() => setMode(item.value)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 17, borderWidth: 1.5, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface, padding: 13, opacity: pressed ? 0.72 : 1 })}>
                  <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? '#FFFFFF' : colors.surfaceMuted }}><Symbol name={item.icon} size={19} color={selected ? colors.primary : colors.textMuted} /></View>
                  <View style={{ flex: 1, gap: 2 }}><Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{item.title}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.subtitle}</Text></View>
                  {selected ? <Symbol name="checkmark.circle.fill" size={21} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 9 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>Ziel</Text>
            <View style={{ minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={{ color: colors.textMuted, fontWeight: '800' }}>€</Text><TextInput value={target} onChangeText={setTarget} keyboardType="decimal-pad" style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] }} /></View>
          </View>
          <View style={{ flex: 1, gap: 9 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{mode === 'action' ? 'Pro Aktion' : mode === 'random' ? 'Ø Betrag' : 'Pro Schritt'}</Text>
            <View style={{ minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: mode === 'random' ? colors.surfaceMuted : colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={{ color: colors.textMuted, fontWeight: '800' }}>€</Text>{mode === 'random' ? <Text selectable style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: '900' }}>5,50</Text> : <TextInput value={step} onChangeText={setStep} keyboardType="decimal-pad" style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] }} />}</View>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Zeitraum</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[{ label: 'Offen', value: null }, { label: '7 Tage', value: 7 }, { label: '30 Tage', value: 30 }, { label: '90 Tage', value: 90 }].map((item) => <Pressable key={item.label} onPress={() => setDurationDays(item.value)} style={({ pressed }) => ({ paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, backgroundColor: durationDays === item.value ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.7 : 1 })}><Text style={{ color: durationDays === item.value ? '#FFFFFF' : colors.text, fontWeight: '800' }}>{item.label}</Text></Pressable>)}
          </View>
        </View>

        <Card style={{ backgroundColor: '#F8FAF7', boxShadow: 'none' }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>VORSCHAU</Text>
          <Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>{title.trim() || 'Deine Challenge'}</Text>
          <ProgressBar value={0.28} color="#7652B7" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Text selectable style={{ color: colors.textMuted }}>{steps || '—'} erwartete Schritte</Text><Text selectable style={{ color: colors.text, fontWeight: '900' }}>{targetAmount > 0 ? formatMoney(targetAmount) : '—'}</Text></View>
          <Text selectable style={{ color: colors.textMuted, fontSize: 12, lineHeight: 17 }}>{mode === 'random' ? 'Beim Ausführen wird jeweils ein Betrag zwischen 1 € und 10 € ausgelost.' : mode === 'action' ? 'Ein Schritt zählt immer dann, wenn du deine Aktion bewusst geschafft hast.' : 'Jeder Schritt wird als lokale Sparbuchung protokolliert.'}</Text>
        </Card>

        <PrimaryButton title="Challenge erstellen" icon="wand.and.stars" onPress={() => void submit()} disabled={!valid} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
