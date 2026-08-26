import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { GoalMode } from '@/types/models';

const targetPresets = [
  { title: 'Urlaub', amount: 2000, icon: 'airplane', color: '#4D83C7' },
  { title: 'Notgroschen', amount: 3000, icon: 'shield.fill', color: '#2D9A5B' },
  { title: 'Auto', amount: 5000, icon: 'car.fill', color: '#C8752B' },
];

const recurringPresets = [
  { title: 'Betriebskosten', amount: 50, icon: 'house.fill', color: '#C8752B' },
  { title: 'Versicherung', amount: 40, icon: 'shield.fill', color: '#4D83C7' },
  { title: 'Auto-Rücklage', amount: 75, icon: 'car.fill', color: '#2D9A5B' },
];

function parseAmount(value: string) {
  return Number(value.replace(',', '.').replace(/[^0-9.]/g, ''));
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function targetDateAfterMonths(months: number | null) {
  if (months == null) return null;
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return dateKey(date);
}

export default function AddGoalScreen() {
  const store = useAppStore();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { width } = useWindowDimensions();
  const compact = width <= 390;
  const initialMode: GoalMode = params.mode === 'recurring' ? 'recurring' : 'target';
  const [mode, setMode] = useState<GoalMode>(initialMode);
  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [icon, setIcon] = useState(initialMode === 'recurring' ? 'arrow.triangle.2.circlepath' : 'target');
  const [color, setColor] = useState('#2D9A5B');
  const [months, setMonths] = useState<number | null>(null);
  const [recurringDay, setRecurringDay] = useState(1);
  const [saving, setSaving] = useState(false);

  const amount = parseAmount(amountText);
  const valid = title.trim().length >= 2 && Number.isFinite(amount) && amount > 0;
  const presets = mode === 'target' ? targetPresets : recurringPresets;

  const chooseMode = (nextMode: GoalMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setTitle('');
    setAmountText('');
    setMonths(null);
    setRecurringDay(1);
    setIcon(nextMode === 'recurring' ? 'arrow.triangle.2.circlepath' : 'target');
    setColor('#2D9A5B');
  };

  const applyPreset = (preset: (typeof targetPresets)[number]) => {
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
      Alert.alert('SparPilot', error instanceof Error ? error.message : 'Das Ziel konnte nicht erstellt werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={72}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: compact ? 14 : 18, paddingTop: 8, paddingBottom: 54, gap: compact ? 14 : 18 }}
      >
        <View style={{ borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.primarySoft, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Symbol name="number" size={15} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>Eindeutig zugeordnet</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>SparPilot vergibt nach dem Erstellen automatisch eine eigene #Nummer.</Text>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>Was möchtest du anlegen?</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([
              ['target', 'Sparziel', 'target', 'Ein Betrag, den du erreichen möchtest.'],
              ['recurring', 'Monatlich', 'arrow.triangle.2.circlepath', 'Ein fixer Betrag für jeden Monat.'],
            ] as const).map(([value, label, symbol, subtitle]) => {
              const active = mode === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => chooseMode(value)}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: compact ? 94 : 88,
                    borderRadius: 16,
                    borderCurve: 'continuous',
                    padding: 12,
                    gap: 7,
                    backgroundColor: active ? colors.primarySoft : colors.surface,
                    borderWidth: 1.5,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Symbol name={symbol} size={17} color={active ? colors.primaryDark : colors.textMuted} />
                    {active ? <Symbol name="checkmark.circle.fill" size={16} color={colors.primary} /> : null}
                  </View>
                  <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>{label}</Text>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, lineHeight: 13 }}>{subtitle}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 7 }}>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>SCHNELL STARTEN · OPTIONAL</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingRight: 4 }}>
            {presets.map((preset) => (
              <Pressable key={preset.title} onPress={() => applyPreset(preset)} style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 11, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}>
                <Symbol name={preset.icon} size={13} color={preset.color} />
                <Text selectable style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>{preset.title} · {preset.amount} €</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>1 · Name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            maxLength={48}
            placeholder={mode === 'recurring' ? 'z. B. Versicherungen' : 'z. B. Urlaub'}
            placeholderTextColor={colors.textMuted}
            style={{ minHeight: 50, borderRadius: 14, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 13, color: colors.text, fontSize: 16, fontWeight: '700' }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>2 · Betrag</Text>
          <View style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 13 }}>
            <Text selectable style={{ fontSize: 18, fontWeight: '900', color: colors.primaryDark }}>€</Text>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              placeholder={mode === 'recurring' ? 'Betrag pro Monat' : 'Zielbetrag'}
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, minHeight: 52, color: colors.text, fontSize: 20, fontWeight: '900', paddingHorizontal: 10, fontVariant: ['tabular-nums'] }}
            />
            <Text selectable style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '700' }}>{mode === 'recurring' ? '/ Monat' : 'Ziel'}</Text>
          </View>
        </View>

        {mode === 'recurring' ? (
          <View style={{ gap: 8 }}>
            <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>3 · Tag im Monat</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {[1, 5, 10, 15, 20, 25].map((day) => (
                <Pressable key={day} onPress={() => setRecurringDay(day)} style={({ pressed }) => ({ width: '31.5%', minHeight: 43, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: recurringDay === day ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}>
                  <Text selectable style={{ color: recurringDay === day ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '900' }}>{day}.</Text>
                </Pressable>
              ))}
            </View>
            <Text selectable style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>Der Tag strukturiert deinen Monatsplan. Erinnerungen stellst du über die Glocke ein.</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>3 · Zeitraum · optional</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {([{ label: 'Ohne Datum', value: null }, { label: '3 Monate', value: 3 }, { label: '6 Monate', value: 6 }, { label: '1 Jahr', value: 12 }] as const).map((item) => (
                <Pressable key={item.label} onPress={() => setMonths(item.value)} style={({ pressed }) => ({ width: '48.5%', minHeight: 43, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: months === item.value ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}>
                  <Text selectable style={{ color: months === item.value ? '#FFFFFF' : colors.text, fontSize: 11, fontWeight: '800' }}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <PrimaryButton title={mode === 'recurring' ? 'Monatliche Rücklage erstellen' : 'Sparziel erstellen'} icon="checkmark" onPress={() => void submit()} disabled={!valid} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
