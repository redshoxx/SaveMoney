import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, TextInput, View } from 'react-native';

import { Card, PrimaryButton, ProgressBar } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

function parseAmount(value: string) {
  return Number(value.replace(',', '.').replace(/[^0-9.]/g, ''));
}

export default function AddChallengeScreen() {
  const store = useAppStore();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('300');
  const [step, setStep] = useState('10');
  const [saving, setSaving] = useState(false);

  const targetAmount = parseAmount(target);
  const stepAmount = parseAmount(step);
  const steps = useMemo(() => {
    if (!targetAmount || !stepAmount || stepAmount <= 0) return 0;
    return Math.ceil(targetAmount / stepAmount);
  }, [stepAmount, targetAmount]);
  const valid = title.trim().length >= 2 && targetAmount > 0 && stepAmount > 0 && stepAmount <= targetAmount;

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await store.createCustomChallenge({ title, targetAmount, stepAmount });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 18, paddingBottom: 80, gap: 20 }}
      >
        <View style={{ gap: 7 }}>
          <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
            Deine Regeln, dein Tempo.
          </Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 15, lineHeight: 21 }}>
            Lege Zielbetrag und Schrittgröße fest. Jeder erledigte Schritt wird als echte lokale Sparbuchung gespeichert.
          </Text>
        </View>

        <View style={{ gap: 9 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Challenge-Name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="z. B. 30-Tage-Sparmission"
            placeholderTextColor="#9AA39B"
            autoFocus
            style={{
              minHeight: 54,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              paddingHorizontal: 16,
              color: colors.text,
              fontSize: 16,
              fontWeight: '600',
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 9 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>Ziel</Text>
            <View style={{ minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: colors.textMuted, fontWeight: '800' }}>€</Text>
              <TextInput
                value={target}
                onChangeText={setTarget}
                keyboardType="decimal-pad"
                style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] }}
              />
            </View>
          </View>

          <View style={{ flex: 1, gap: 9 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>Pro Schritt</Text>
            <View style={{ minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: colors.textMuted, fontWeight: '800' }}>€</Text>
              <TextInput
                value={step}
                onChangeText={setStep}
                keyboardType="decimal-pad"
                style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] }}
              />
            </View>
          </View>
        </View>

        <Card style={{ backgroundColor: '#F8FAF7', boxShadow: 'none' }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>VORSCHAU</Text>
          <Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>{title.trim() || 'Deine Challenge'}</Text>
          <ProgressBar value={0.28} color="#7652B7" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text selectable style={{ color: colors.textMuted }}>{steps || '—'} Schritte</Text>
            <Text selectable style={{ color: colors.text, fontWeight: '900' }}>{targetAmount > 0 ? formatMoney(targetAmount) : '—'}</Text>
          </View>
        </Card>

        {!valid && (target.length > 0 || step.length > 0) ? (
          <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>
            Der Schrittbetrag muss größer als 0 und darf nicht höher als der Zielbetrag sein.
          </Text>
        ) : null}

        <PrimaryButton
          title="Challenge erstellen"
          icon="wand.and.stars"
          disabled={!valid}
          loading={saving}
          onPress={() => void submit()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
