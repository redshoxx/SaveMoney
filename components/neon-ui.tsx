import { router } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useEffect, useMemo, useRef } from 'react';

import { colors } from '@/constants/theme';
import { Symbol } from '@/components/ui';

export function NeonCard({
  children,
  accent = colors.primary,
  glow = false,
  style,
}: PropsWithChildren<{ accent?: string; glow?: boolean; style?: object }>) {
  return (
    <View
      style={[
        {
          borderRadius: 18,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: glow ? `${accent}55` : colors.border,
          backgroundColor: colors.surface,
          padding: 14,
          gap: 11,
          boxShadow: glow ? `0 8px 24px ${accent}18` : '0 5px 16px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function GlowIcon({ name, color = colors.primary, size = 18 }: { name: string; color?: string; size?: number }) {
  const box = Math.max(34, size + 20);
  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: 11,
        borderCurve: 'continuous',
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name={name} size={size} color="#FFFFFF" />
    </View>
  );
}

export function NeonProgress({ value, color = colors.primary, height = 5 }: { value: number; color?: string; height?: number }) {
  const percent = `${Math.max(0, Math.min(1, value)) * 100}%` as `${number}%`;
  return (
    <View style={{ height, borderRadius: 999, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
      <View style={{ width: percent, height: '100%', borderRadius: 999, backgroundColor: color }} />
    </View>
  );
}

export function PulseOrb({ color = colors.primary, size = 8 }: { color?: string; size?: number }) {
  const pulse = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.65, duration: 1100, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: pulse,
        transform: [{ scale: pulse }],
      }}
    />
  );
}

export function HeaderIconButton({ name, onPress, color = colors.text }: { name: string; onPress: () => void; color?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.55 : 1,
      })}
    >
      <Symbol name={name} size={18} color={color} />
    </Pressable>
  );
}

export function ProfileButton() {
  return <HeaderIconButton name="person" onPress={() => router.push('/(tabs)/settings')} />;
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        {eyebrow ? <Text style={{ color: colors.primaryDark, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>{eyebrow}</Text> : null}
        <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.7 }}>{title}</Text>
        {subtitle ? <Text selectable numberOfLines={2} style={{ color: colors.textMuted, fontSize: 12, lineHeight: 17 }}>{subtitle}</Text> : null}
      </View>
      {right ?? <ProfileButton />}
    </View>
  );
}

export function NeonAction({
  icon,
  label,
  onPress,
  color = colors.primary,
  muted = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
  muted?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 38,
        paddingHorizontal: 13,
        borderRadius: 12,
        borderWidth: muted ? 1 : 0,
        borderColor: colors.border,
        backgroundColor: muted ? colors.surfaceMuted : color,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Symbol name={icon} size={12} color={muted ? colors.textMuted : '#FFFFFF'} />
      <Text style={{ color: muted ? colors.text : '#FFFFFF', fontSize: 11.5, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

export function ProgressRing({ value, color = colors.primary, size = 70 }: { value: number; color?: string; size?: number }) {
  const percentage = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 6,
        borderColor: color,
        backgroundColor: colors.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text selectable style={{ color: colors.text, fontSize: size * 0.23, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{percentage}%</Text>
    </View>
  );
}

export function MiniTrend({ values, color = colors.primary, height = 54 }: { values: number[]; color?: string; height?: number }) {
  const normalized = useMemo(() => {
    const source = values.length ? values : [0, 0, 0, 0, 0, 0];
    const max = Math.max(1, ...source.map((value) => Math.abs(value)));
    return source.slice(-12).map((value) => Math.max(4, (Math.abs(value) / max) * height));
  }, [height, values]);

  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
      {normalized.map((barHeight, index) => (
        <View
          key={`${index}-${barHeight}`}
          style={{
            flex: 1,
            minWidth: 2,
            maxWidth: 5,
            height: barHeight,
            borderRadius: 999,
            backgroundColor: color,
            opacity: 0.45 + ((index + 1) / normalized.length) * 0.55,
          }}
        />
      ))}
    </View>
  );
}
