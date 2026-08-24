import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Card, PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';

const presets = [
  { title: 'Urlaub', icon: 'airplane', color: '#3976B8', amount: 2000 },
  { title: 'Notgroschen', icon: 'shield.fill', color: '#1D7A46', amount: 3000 },
  { title: 'Auto', icon: 'car.fill', color: '#B43E3E', amount: 5000 },
  { title: 'Technik', icon: 'laptopcomputer', color: '#7652B7', amount: 1200 },
  { title: 'Wohnung', icon: 'house.fill', color: '#B66A15', amount: 5000 },
];
const goalColors = ['#1D7A46', '#3976B8', '#7652B7', '#B66A15', '#B43E3E', '#2B7B86'];
const goalIcons = ['target', 'airplane', 'car.fill', 'house.fill', 'laptopcomputer', 'gift.fill'];

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
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [color, setColor] = useState(goalColors[0]);
  const [icon, setIcon] = useState(goalIcons[0]);
  const [months, setMonths] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const amount = parseAmount(target);
  const valid = title.trim().length >= 2 && Number.isFinite(amount) && amount > 0;

  const applyPreset = (preset: (typeof presets)[number]) => {
    setTitle(preset.title);
    setIcon(preset.icon);
    setColor(preset.color);
    setTarget(String(preset.amount));
  };

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await store.createGoal({ title, targetAmount: amount, color, icon, targetDate: targetDateAfterMonths(months) });
      router.back();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Sparziel konnte nicht erstellt werden.');
    } finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 80, gap: 22 }}>
        <View style={{ gap: 7 }}>
          <Text selectable style={{ color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.6 }}>Wofür möchtest du sparen?</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>Wähle eine Vorlage oder erstelle dein Ziel komplett selbst.</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9 }}>
          {presets.map((preset) => (
            <Pressable key={preset.title} onPress={() => applyPreset(preset)} style={({ pressed }) => ({ width: 116, borderRadius: 18, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 13, gap: 9, opacity: pressed ? 0.68 : 1 })}>
              <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: `${preset.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={preset.icon} size={18} color={preset.color} /></View>
              <Text style={{ color: colors.text, fontWeight: '800' }}>{preset.title}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{preset.amount.toLocaleString('de-AT')} €</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Card>
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>Name</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="z. B. Sommerurlaub" placeholderTextColor="#9AA39B" style={{ minHeight: 52, borderRadius: 15, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14, color: colors.text, fontSize: 16, fontWeight: '600' }} />
          </View>
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>Zielbetrag</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 15, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textMuted }}>€</Text>
              <TextInput value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9AA39B" style={{ flex: 1, minHeight: 54, color: colors.text, fontSize: 22, fontWeight: '900', paddingHorizontal: 10, fontVariant: ['tabular-nums'] }} />
            </View>
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Symbol</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {goalIcons.map((value) => <Pressable key={value} onPress={() => setIcon(value)} style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: icon === value ? colors.primarySoft : colors.surface, borderWidth: 1, borderColor: icon === value ? colors.primary : colors.border, opacity: pressed ? 0.7 : 1 })}><Symbol name={value} size={20} color={icon === value ? colors.primary : colors.textMuted} /></Pressable>)}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Farbe</Text>
          <View style={{ flexDirection: 'row', gap: 11 }}>
            {goalColors.map((value) => <Pressable key={value} onPress={() => setColor(value)} style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 14, backgroundColor: value, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>{color === value ? <Symbol name="checkmark" size={17} color="#FFFFFF" /> : null}</Pressable>)}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Wunsch-Zeitraum</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[{ label: 'Offen', value: null }, { label: '3 Monate', value: 3 }, { label: '6 Monate', value: 6 }, { label: '1 Jahr', value: 12 }].map((item) => (
              <Pressable key={item.label} onPress={() => setMonths(item.value)} style={({ pressed }) => ({ paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, backgroundColor: months === item.value ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.7 : 1 })}><Text style={{ color: months === item.value ? '#FFFFFF' : colors.text, fontWeight: '800' }}>{item.label}</Text></Pressable>
            ))}
          </View>
        </View>

        <PrimaryButton title="Sparziel erstellen" icon="target" onPress={() => void submit()} disabled={!valid} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
