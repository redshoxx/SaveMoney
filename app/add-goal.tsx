import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';

const goalColors = ['#1D7A46', '#3976B8', '#7652B7', '#B66A15', '#B43E3E'];
const goalIcons = ['target', 'airplane', 'car.fill', 'house.fill', 'laptopcomputer'];

function parseAmount(value: string) {
  return Number(value.replace(',', '.').replace(/[^0-9.]/g, ''));
}

export default function AddGoalScreen() {
  const store = useAppStore();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [color, setColor] = useState(goalColors[0]);
  const [icon, setIcon] = useState(goalIcons[0]);
  const [saving, setSaving] = useState(false);
  const amount = parseAmount(target);
  const valid = title.trim().length >= 2 && Number.isFinite(amount) && amount > 0;

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await store.createGoal({ title, targetAmount: amount, color, icon });
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
        contentContainerStyle={{ padding: 18, paddingBottom: 80, gap: 22 }}
      >
        <View style={{ gap: 7 }}>
          <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
            Wofür möchtest du sparen?
          </Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 15, lineHeight: 21 }}>
            Ein klares Ziel macht kleine Einzahlungen sichtbar und motivierender.
          </Text>
        </View>

        <View style={{ gap: 9 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="z. B. Urlaub, Notgroschen, neues Handy"
            placeholderTextColor="#9AA39B"
            returnKeyType="next"
            autoFocus
            style={{
              minHeight: 54,
              borderRadius: 16,
              borderCurve: 'continuous',
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

        <View style={{ gap: 9 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Zielbetrag</Text>
          <View
            style={{
              minHeight: 58,
              borderRadius: 16,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 20, fontWeight: '800' }}>€</Text>
            <TextInput
              value={target}
              onChangeText={setTarget}
              placeholder="1000"
              placeholderTextColor="#9AA39B"
              keyboardType="decimal-pad"
              style={{ flex: 1, color: colors.text, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}
            />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Symbol</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {goalIcons.map((item) => {
              const selected = item === icon;
              return (
                <Pressable
                  key={item}
                  onPress={() => setIcon(item)}
                  style={({ pressed }) => ({
                    width: 52,
                    height: 52,
                    borderRadius: 17,
                    backgroundColor: selected ? colors.primarySoft : colors.surface,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Symbol name={item} size={22} color={selected ? colors.primary : colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Farbe</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {goalColors.map((item) => {
              const selected = item === color;
              return (
                <Pressable
                  key={item}
                  accessibilityLabel={`Zielfarbe ${item}`}
                  onPress={() => setColor(item)}
                  style={({ pressed }) => ({
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: item,
                    borderWidth: selected ? 4 : 0,
                    borderColor: '#FFFFFF',
                    boxShadow: selected ? `0 0 0 2px ${item}` : 'none',
                    opacity: pressed ? 0.75 : 1,
                  })}
                />
              );
            })}
          </View>
        </View>

        <PrimaryButton title="Sparziel erstellen" icon="plus" loading={saving} disabled={!valid} onPress={() => void submit()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
