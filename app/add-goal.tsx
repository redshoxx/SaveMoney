import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { GoalMode } from '@/types/models';

const targetPresets = [
  { title: 'Urlaub', amount: 2000, icon: 'airplane', color: '#3976B8' },
  { title: 'Notgroschen', amount: 3000, icon: 'shield.fill', color: '#1D7A46' },
  { title: 'Auto', amount: 5000, icon: 'car.fill', color: '#B43E3E' },
];

const recurringPresets = [
  { title: 'Betriebskosten', amount: 50, icon: 'house.fill', color: '#B66A15' },
  { title: 'Versicherungen', amount: 40, icon: 'shield.fill', color: '#3976B8' },
  { title: 'Auto-Rücklage', amount: 75, icon: 'car.fill', color: '#B43E3E' },
  { title: 'Jahreskosten', amount: 100, icon: 'banknote.fill', color: '#1D7A46' },
];

function parseAmount(value: string) {
  return Number(value.replace(',', '.').replace(/[^0-9.]/g, ''));
}

function targetDateAfterMonths(months: number | null) {
  if (months == null) return null;
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

export default function AddGoalScreen() {
  const store = useAppStore();
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode: GoalMode = params.mode === 'recurring' ? 'recurring' : 'target';
  const [mode, setMode] = useState<GoalMode>(initialMode);
  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [icon, setIcon] = useState(initialMode === 'recurring' ? 'arrow.triangle.2.circlepath' : 'target');
  const [color, setColor] = useState('#1D7A46');
  const [months, setMonths] = useState<number | null>(null);
  const [recurringDay, setRecurringDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const amount = parseAmount(amountText);
  const valid = title.trim().length >= 2 && Number.isFinite(amount) && amount > 0;
  const presets = mode === 'target' ? targetPresets : recurringPresets;

  const chooseMode = (nextMode: GoalMode) => {
    setMode(nextMode);
    setTitle('');
    setAmountText('');
    setMonths(null);
    setRecurringDay(1);
    setIcon(nextMode === 'recurring' ? 'arrow.triangle.2.circlepath' : 'target');
    setColor('#1D7A46');
  };

  const applyPreset = (preset: (typeof recurringPresets)[number]) => {
    setTitle(preset.title);
    setAmountText(String(preset.amount));
    setIcon(preset.icon);
    setColor(preset.color);
  };

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await store.createGoal({
        title,
        mode,
        targetAmount: amount,
        recurringAmount: mode === 'recurring' ? amount : null,
        recurringDay: mode === 'recurring' ? recurringDay : null,
        color,
        icon,
        targetDate: mode === 'target' ? targetDateAfterMonths(months) : null,
      });
      router.back();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Sparbereich konnte nicht erstellt werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 70, gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {([
            ['target', 'Zielbetrag', 'target', 'z. B. 2.000 € für Urlaub'],
            ['recurring', 'Monatlich', 'arrow.triangle.2.circlepath', 'z. B. 50 € für Betriebskosten'],
          ] as const).map(([value, label, symbol, subtitle]) => {
            const active = mode === value;
            return (
              <Pressable key={value} onPress={() => chooseMode(value)} style={({ pressed }) => ({ flex: 1, minHeight: 88, borderRadius: 17, padding: 13, gap: 7, backgroundColor: active ? colors.primarySoft : colors.surface, borderWidth: 1.5, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 })}>
                <Symbol name={symbol} size={18} color={active ? colors.primaryDark : colors.textMuted} />
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{label}</Text>
                <Text numberOfLines={2} style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 14 }}>{subtitle}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {presets.map((preset) => (
            <Pressable key={preset.title} onPress={() => applyPreset(preset)} style={({ pressed }) => ({ paddingHorizontal: 12, minHeight: 38, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.7 : 1 })}>
              <Symbol name={preset.icon} size={13} color={preset.color} />
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{preset.title} · {preset.amount} €</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ gap: 10 }}>
          <TextInput value={title} onChangeText={setTitle} placeholder={mode === 'recurring' ? 'Wofür? z. B. Betriebskosten' : 'Wofür? z. B. Urlaub'} placeholderTextColor="#9AA39B" style={{ minHeight: 52, borderRadius: 15, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14, color: colors.text, fontSize: 16, fontWeight: '700' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 15, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 19, fontWeight: '900', color: colors.textMuted }}>€</Text>
            <TextInput value={amountText} onChangeText={setAmountText} keyboardType="decimal-pad" placeholder={mode === 'recurring' ? 'Betrag pro Monat' : 'Zielbetrag'} placeholderTextColor="#9AA39B" style={{ flex: 1, minHeight: 54, color: colors.text, fontSize: 20, fontWeight: '900', paddingHorizontal: 10, fontVariant: ['tabular-nums'] }} />
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>{mode === 'recurring' ? '/ Monat' : 'Ziel'}</Text>
          </View>
        </View>

        {mode === 'recurring' ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>FÄLLIG AB</Text>
            <View style={{ flexDirection: 'row', gap: 7 }}>
              {[1, 5, 10, 15, 20, 25].map((day) => (
                <Pressable key={day} onPress={() => setRecurringDay(day)} style={({ pressed }) => ({ flex: 1, minHeight: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: recurringDay === day ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.7 : 1 })}>
                  <Text style={{ color: recurringDay === day ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '900' }}>{day}.</Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11, lineHeight: 16 }}>SparFlow erinnert ab diesem Tag jeden Monat. Es wird kein Geld automatisch abgebucht.</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {([{ label: 'Ohne Datum', value: null }, { label: '3 Mon.', value: 3 }, { label: '6 Mon.', value: 6 }, { label: '1 Jahr', value: 12 }] as const).map((item) => (
              <Pressable key={item.label} onPress={() => setMonths(item.value)} style={({ pressed }) => ({ flex: 1, minHeight: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: months === item.value ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ color: months === item.value ? '#FFFFFF' : colors.text, fontSize: 11, fontWeight: '800' }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <PrimaryButton title={mode === 'recurring' ? 'Monatliche Rücklage anlegen' : 'Sparziel anlegen'} icon={mode === 'recurring' ? 'arrow.triangle.2.circlepath' : 'target'} onPress={() => void submit()} disabled={!valid} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
