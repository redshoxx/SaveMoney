import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';

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
  return Number.isInteger(amount) ? String(amount) : amount.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const builders: { value: BuilderType; title: string; subtitle: string; icon: string }[] = [
  { value: 'fixed-grid', title: 'Feste Felder', subtitle: 'z. B. 40 × 5 €', icon: 'square.grid.3x3.fill' },
  { value: 'mixed-grid', title: 'Kleingeld', subtitle: 'Beträge mischen', icon: 'eurosign.circle.fill' },
  { value: 'daily', title: 'Täglich', subtitle: 'Jeden Tag sparen', icon: 'calendar' },
  { value: 'weekly', title: 'Wöchentlich', subtitle: 'Einmal pro Woche', icon: 'calendar.badge.checkmark' },
  { value: 'action', title: 'Bei Aktion', subtitle: 'Nach einem Ereignis', icon: 'hand.tap.fill' },
  { value: 'random', title: 'Zufall', subtitle: 'Betrag auslosen', icon: 'die.face.5.fill' },
];

export default function AddChallengeScreen() {
  const store = useAppStore();
  const { width } = useWindowDimensions();
  const compact = width <= 390;
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
  const steps = isGrid ? cellValues.length : targetAmount > 0 && stepAmount > 0 ? Math.max(1, Math.ceil(targetAmount / stepAmount)) : 0;
  const valid = title.trim().length >= 2 && targetAmount > 0 && stepAmount > 0 && steps > 0;

  const toggleMixed = (amount: number) => {
    setMixedAmounts((current) => current.includes(amount) ? current.filter((item) => item !== amount) : [...current, amount]);
  };

  const presetFive = () => {
    setBuilder('fixed-grid');
    setTitle('5 € Challenge');
    setFieldCount('40');
    setFieldAmount('5');
    setGridColumns(5);
  };

  const presetCoin = () => {
    setBuilder('mixed-grid');
    setTitle('Kleingeldchallenge');
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
      Alert.alert('SparPilot', error instanceof Error ? error.message : 'Challenge konnte nicht erstellt werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={72}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: compact ? 14 : 18, paddingTop: 8, paddingBottom: 56, gap: compact ? 14 : 18 }}>
        <View style={{ borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.primarySoft, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Symbol name="number" size={16} color={colors.primaryDark} />
          <Text selectable style={{ flex: 1, color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>Jede neue Challenge bekommt automatisch eine eindeutige #Nummer.</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={presetFive} style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 })}>
            <Text selectable style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 11.5 }}>5 € · 200 €</Text>
          </Pressable>
          <Pressable onPress={presetCoin} style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 13, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 })}>
            <Text selectable style={{ color: colors.text, fontWeight: '900', fontSize: 11.5 }}>Kleingeld</Text>
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>1 · Name</Text>
          <TextInput value={title} onChangeText={setTitle} maxLength={48} placeholder="z. B. Urlaubskasse" placeholderTextColor={colors.textMuted} style={{ minHeight: 50, borderRadius: 14, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 13, color: colors.text, fontSize: 16, fontWeight: '700' }} />
        </View>

        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>2 · So möchtest du sparen</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {builders.map((item) => {
              const selected = builder === item.value;
              return (
                <Pressable key={item.value} onPress={() => setBuilder(item.value)} style={({ pressed }) => ({ flexBasis: compact ? '48%' : '31%', flexGrow: 1, minHeight: 70, borderRadius: 14, borderWidth: 1.5, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface, padding: 10, gap: 6, opacity: pressed ? 0.76 : 1 })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Symbol name={item.icon} size={15} color={selected ? colors.primaryDark : colors.textMuted} />
                    {selected ? <Symbol name="checkmark.circle.fill" size={14} color={colors.primary} /> : null}
                  </View>
                  <Text selectable style={{ color: colors.text, fontSize: 11.5, fontWeight: '900' }}>{item.title}</Text>
                  <Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 9.5 }}>{item.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isGrid ? (
          <View style={{ borderRadius: 16, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 13, gap: 12 }}>
            <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>3 · Sparfelder</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>ANZAHL</Text>
                <TextInput value={fieldCount} onChangeText={setFieldCount} keyboardType="number-pad" style={{ minHeight: 48, borderRadius: 12, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, color: colors.text, fontSize: 18, fontWeight: '900' }} />
              </View>
              {builder === 'fixed-grid' ? (
                <View style={{ flex: 1, gap: 6 }}>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>PRO FELD</Text>
                  <View style={{ minHeight: 48, borderRadius: 12, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}>
                    <Text selectable style={{ color: colors.primaryDark, fontWeight: '900' }}>€</Text>
                    <TextInput value={fieldAmount} onChangeText={setFieldAmount} keyboardType="decimal-pad" style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '900', paddingLeft: 7 }} />
                  </View>
                </View>
              ) : null}
            </View>

            {builder === 'mixed-grid' ? (
              <View style={{ gap: 7 }}>
                <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>BETRÄGE</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {[0.5, 1, 2, 5, 10].map((amount) => {
                    const selected = mixedAmounts.includes(amount);
                    return (
                      <Pressable key={amount} onPress={() => toggleMixed(amount)} style={({ pressed }) => ({ minWidth: 58, minHeight: 40, paddingHorizontal: 10, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}>
                        <Text selectable style={{ color: selected ? '#FFFFFF' : colors.text, fontSize: 11.5, fontWeight: '900' }}>{amountLabel(amount)} €</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 7 }}>
              {[4, 5, 6].map((columns) => (
                <Pressable key={columns} onPress={() => setGridColumns(columns)} style={({ pressed }) => ({ flex: 1, minHeight: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: gridColumns === columns ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}>
                  <Text selectable style={{ color: gridColumns === columns ? '#FFFFFF' : colors.text, fontWeight: '900' }}>{columns} Spalten</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ borderRadius: 16, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 13, gap: 12 }}>
            <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '900' }}>3 · Beträge</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>ZIEL</Text>
                <View style={{ minHeight: 48, borderRadius: 12, backgroundColor: colors.surfaceMuted, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center' }}>
                  <Text selectable style={{ color: colors.primaryDark, fontWeight: '900' }}>€</Text>
                  <TextInput value={target} onChangeText={setTarget} keyboardType="decimal-pad" style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '900', paddingLeft: 7 }} />
                </View>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>{builder === 'action' ? 'PRO AKTION' : builder === 'random' ? 'Ø BETRAG' : 'PRO SCHRITT'}</Text>
                <View style={{ minHeight: 48, borderRadius: 12, backgroundColor: colors.surfaceMuted, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center' }}>
                  <Text selectable style={{ color: colors.primaryDark, fontWeight: '900' }}>€</Text>
                  {builder === 'random'
                    ? <Text selectable style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '900', paddingLeft: 7 }}>5,50</Text>
                    : <TextInput value={step} onChangeText={setStep} keyboardType="decimal-pad" style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '900', paddingLeft: 7 }} />}
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>4 · Zeitraum · optional</Text>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {[{ label: 'Offen', value: null }, { label: '7 Tage', value: 7 }, { label: '30 Tage', value: 30 }, { label: '90 Tage', value: 90 }].map((item) => (
              <Pressable key={item.label} onPress={() => setDurationDays(item.value)} style={({ pressed }) => ({ flex: 1, minHeight: 41, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: durationDays === item.value ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.72 : 1 })}>
                <Text selectable style={{ color: durationDays === item.value ? '#FFFFFF' : colors.text, fontSize: 10.5, fontWeight: '800' }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.surfaceMuted, padding: 12, gap: 7 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text selectable style={{ flex: 1, color: colors.textMuted, fontSize: 10.5 }}>Ziel</Text>
            <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{targetAmount > 0 ? formatMoney(targetAmount) : '—'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text selectable style={{ flex: 1, color: colors.textMuted, fontSize: 10.5 }}>Schritte</Text>
            <Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{steps || '—'}</Text>
          </View>
        </View>

        <PrimaryButton title="Challenge erstellen" icon="checkmark" onPress={() => void submit()} disabled={!valid} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
