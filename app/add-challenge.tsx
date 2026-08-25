import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import type { ChallengeMode } from '@/types/models';
import { formatMoney } from '@/utils/money';

type BuilderType = 'fixed-grid' | 'mixed-grid' | 'daily' | 'weekly' | 'action' | 'random';

function parseAmount(value: string) {
  return Number(value.replace(',', '.').replace(/[^0-9.]/g, ''));
}

function parseCount(value: string) {
  const number = Number(value.replace(/[^0-9]/g, ''));
  return Number.isFinite(number) ? Math.max(1, Math.min(120, Math.round(number))) : 1;
}

function amountLabel(amount: number) {
  return Number.isInteger(amount) ? `${amount}` : amount.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const builders: { value: BuilderType; title: string; subtitle: string; icon: string }[] = [
  { value: 'fixed-grid', title: 'Feste Felder', subtitle: 'z. B. 40 × 5 €', icon: 'square.grid.3x3.fill' },
  { value: 'mixed-grid', title: 'Kleingeld', subtitle: '0,50 € / 1 € / 2 € mischen', icon: 'eurosign.circle.fill' },
  { value: 'daily', title: 'Täglich', subtitle: 'Jeden Tag ein Betrag', icon: 'calendar' },
  { value: 'weekly', title: 'Wöchentlich', subtitle: 'Einmal pro Woche', icon: 'calendar.badge.checkmark' },
  { value: 'action', title: 'Bei Aktion', subtitle: 'Wenn du etwas geschafft hast', icon: 'hand.tap.fill' },
  { value: 'random', title: 'Zufall', subtitle: 'Betrag auslosen', icon: 'die.face.5.fill' },
];

export default function AddChallengeScreen() {
  const store = useAppStore();
  const [title, setTitle] = useState('');
  const [builder, setBuilder] = useState<BuilderType>('fixed-grid');
  const [fieldCount, setFieldCount] = useState('40');
  const [fieldAmount, setFieldAmount] = useState('5');
  const [mixedAmounts, setMixedAmounts] = useState<number[]>([0.5, 1, 2]);
  const [target, setTarget] = useState('300');
  const [step, setStep] = useState('10');
  const [gridColumns, setGridColumns] = useState(5);
  const [durationDays, setDurationDays] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const count = parseCount(fieldCount);
  const fixedAmount = parseAmount(fieldAmount);
  const normalTarget = parseAmount(target);
  const normalStep = parseAmount(step);
  const isGrid = builder === 'fixed-grid' || builder === 'mixed-grid';

  const cellValues = useMemo(() => {
    if (builder === 'fixed-grid') {
      if (!Number.isFinite(fixedAmount) || fixedAmount <= 0) return [];
      return Array.from({ length: count }, () => fixedAmount);
    }
    if (builder === 'mixed-grid') {
      const choices = mixedAmounts.filter((amount) => amount > 0).sort((a, b) => a - b);
      if (!choices.length) return [];
      return Array.from({ length: count }, (_, index) => choices[index % choices.length]);
    }
    return [];
  }, [builder, count, fixedAmount, mixedAmounts]);

  const targetAmount = isGrid ? cellValues.reduce((sum, amount) => sum + amount, 0) : normalTarget;
  const mode: ChallengeMode = builder === 'daily' ? 'daily' : builder === 'weekly' ? 'weekly' : builder === 'action' ? 'action' : builder === 'random' ? 'random' : 'fixed';
  const stepAmount = isGrid
    ? (cellValues.length ? cellValues.reduce((sum, amount) => sum + amount, 0) / cellValues.length : 0)
    : builder === 'random' ? 5.5 : normalStep;
  const normalSteps = normalTarget > 0 && stepAmount > 0 ? Math.max(1, Math.ceil(normalTarget / stepAmount)) : 0;
  const valid = title.trim().length >= 2 && targetAmount > 0 && stepAmount > 0 && (!isGrid || cellValues.length > 0);

  const toggleMixed = (amount: number) => {
    setMixedAmounts((current) => current.includes(amount) ? current.filter((item) => item !== amount) : [...current, amount]);
  };

  const applyFivePreset = () => {
    setBuilder('fixed-grid');
    setTitle((current) => current || '5 € Challenge');
    setFieldCount('40');
    setFieldAmount('5');
    setGridColumns(5);
  };

  const applyCoinPreset = () => {
    setBuilder('mixed-grid');
    setTitle((current) => current || 'Kleingeldchallenge');
    setFieldCount('80');
    setMixedAmounts([0.5, 1, 2]);
    setGridColumns(5);
  };

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await store.createCustomChallenge({
        title,
        targetAmount,
        stepAmount,
        mode,
        durationDays,
        cellValues: isGrid ? cellValues : undefined,
        gridColumns: isGrid ? gridColumns : undefined,
        cellShape: builder === 'mixed-grid' ? 'circle' : 'rounded',
      });
      router.back();
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Challenge konnte nicht erstellt werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 18 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>Eigene Challenge</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>Baue ein Sparblatt mit Feldern oder nutze eine klassische Zeit-/Aktionschallenge.</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={applyFivePreset} style={({ pressed }) => ({ flex: 1, minHeight: 42, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.72 : 1 })}><Text style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 12 }}>5 € · 200 €</Text></Pressable>
          <Pressable onPress={applyCoinPreset} style={({ pressed }) => ({ flex: 1, minHeight: 42, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.72 : 1 })}><Text style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 12 }}>Kleingeld</Text></Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '900' }}>NAME</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="z. B. Urlaubskasse" placeholderTextColor={colors.textMuted} style={{ minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.text, fontSize: 16, fontWeight: '700' }} />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '900' }}>ART</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
            {builders.map((item) => {
              const selected = builder === item.value;
              return (
                <Pressable key={item.value} onPress={() => setBuilder(item.value)} style={({ pressed }) => ({ width: '48.5%', minHeight: 67, borderRadius: 15, borderWidth: 1.5, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface, padding: 11, flexDirection: 'row', gap: 9, alignItems: 'center', opacity: pressed ? 0.72 : 1 })}>
                  <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: selected ? colors.surface : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Symbol name={item.icon} size={15} color={selected ? colors.primary : colors.textMuted} /></View>
                  <View style={{ flex: 1, gap: 2 }}><Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>{item.title}</Text><Text numberOfLines={2} style={{ color: colors.textMuted, fontSize: 9.5, lineHeight: 12 }}>{item.subtitle}</Text></View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isGrid ? (
          <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 13 }}>
            <Text style={{ color: colors.text, fontWeight: '900' }}>Sparfelder</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}><Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>ANZAHL FELDER</Text><TextInput value={fieldCount} onChangeText={setFieldCount} keyboardType="number-pad" style={{ minHeight: 47, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text, fontSize: 18, fontWeight: '900' }} /></View>
              {builder === 'fixed-grid' ? <View style={{ flex: 1, gap: 6 }}><Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>PRO FELD</Text><View style={{ minHeight: 47, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: colors.textMuted, fontWeight: '900' }}>€</Text><TextInput value={fieldAmount} onChangeText={setFieldAmount} keyboardType="decimal-pad" style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '900' }} /></View></View> : null}
            </View>

            {builder === 'mixed-grid' ? (
              <View style={{ gap: 7 }}>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>BETRÄGE MISCHEN</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {[0.5, 1, 2, 5, 10].map((amount) => {
                    const selected = mixedAmounts.includes(amount);
                    return <Pressable key={amount} onPress={() => toggleMixed(amount)} style={({ pressed }) => ({ minWidth: 58, paddingHorizontal: 11, minHeight: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}><Text style={{ color: selected ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '900' }}>{amountLabel(amount)} €</Text></Pressable>;
                  })}
                </View>
              </View>
            ) : null}

            <View style={{ gap: 7 }}>
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>SPALTEN</Text>
              <View style={{ flexDirection: 'row', gap: 7 }}>
                {[4, 5, 6].map((columns) => <Pressable key={columns} onPress={() => setGridColumns(columns)} style={({ pressed }) => ({ flex: 1, minHeight: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: gridColumns === columns ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}><Text style={{ color: gridColumns === columns ? '#FFFFFF' : colors.text, fontWeight: '900' }}>{columns}</Text></Pressable>)}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}><Text style={{ color: colors.textMuted }}>Automatisches Ziel</Text><Text style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>{targetAmount > 0 ? formatMoney(targetAmount) : '—'}</Text></View>
          </View>
        ) : (
          <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}><Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>ZIEL</Text><View style={{ minHeight: 47, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: colors.textMuted, fontWeight: '900' }}>€</Text><TextInput value={target} onChangeText={setTarget} keyboardType="decimal-pad" style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '900' }} /></View></View>
              <View style={{ flex: 1, gap: 6 }}><Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>{builder === 'action' ? 'PRO AKTION' : builder === 'random' ? 'Ø BETRAG' : 'PRO SCHRITT'}</Text><View style={{ minHeight: 47, borderRadius: 13, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}><Text style={{ color: colors.textMuted, fontWeight: '900' }}>€</Text>{builder === 'random' ? <Text style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '900' }}>5,50</Text> : <TextInput value={step} onChangeText={setStep} keyboardType="decimal-pad" style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '900' }} />}</View></View>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>{normalSteps || '—'} erwartete Schritte</Text>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '900' }}>ZEITRAUM</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {[{ label: 'Offen', value: null }, { label: '7 Tage', value: 7 }, { label: '30 Tage', value: 30 }, { label: '90 Tage', value: 90 }].map((item) => <Pressable key={item.label} onPress={() => setDurationDays(item.value)} style={({ pressed }) => ({ paddingHorizontal: 12, minHeight: 39, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: durationDays === item.value ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.7 : 1 })}><Text style={{ color: durationDays === item.value ? '#FFFFFF' : colors.text, fontSize: 11.5, fontWeight: '900' }}>{item.label}</Text></Pressable>)}
          </View>
        </View>

        {isGrid && cellValues.length ? (
          <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.text, fontWeight: '900' }}>Vorschau</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>{cellValues.length} Felder</Text></View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {cellValues.slice(0, 25).map((amount, index) => <View key={index} style={{ width: '17%', aspectRatio: 1, borderRadius: builder === 'mixed-grid' ? 999 : 10, backgroundColor: builder === 'mixed-grid' ? '#C9828622' : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: builder === 'mixed-grid' ? '#C98286' : colors.primaryDark, fontSize: amount < 1 ? 8.5 : 10.5, fontWeight: '900' }}>{amountLabel(amount)}</Text></View>)}
              {cellValues.length > 25 ? <View style={{ width: '17%', aspectRatio: 1, borderRadius: 10, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '900' }}>+{cellValues.length - 25}</Text></View> : null}
            </View>
          </View>
        ) : null}

        <PrimaryButton title={`Challenge erstellen${targetAmount > 0 ? ` · ${formatMoney(targetAmount)}` : ''}`} icon="wand.and.stars" onPress={() => void submit()} disabled={!valid} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
