import { Image } from 'expo-image';
import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { ColorValue } from 'react-native';

import { colors, radius, shadow } from '@/constants/theme';

export function Symbol({
  name,
  size = 20,
  color = colors.text,
}: {
  name: string;
  size?: number;
  color?: ColorValue;
}) {
  if (process.env.EXPO_OS !== 'ios') {
    return <Text style={{ fontSize: size * 0.78, color, fontWeight: '800' }}>•</Text>;
  }

  // expo-image currently types tintColor as string | null, while React Native
  // navigation exposes ColorValue. Navigation tab colors are strings at runtime;
  // dynamic native colors fall back to the app text color for the SF Symbol.
  const tintColor = typeof color === 'string' ? color : colors.text;

  return <Image source={`sf:${name}`} style={{ width: size, height: size }} tintColor={tintColor} />;
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: colors.border,
          padding: 18,
          gap: 14,
          boxShadow: shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ProgressBar({ value, color = colors.primary, height = 9 }: { value: number; color?: string; height?: number }) {
  const percent = `${Math.max(0, Math.min(1, value)) * 100}%` as `${number}%`;
  return (
    <View style={{ height, borderRadius: 999, overflow: 'hidden', backgroundColor: colors.surfaceMuted }}>
      <View style={{ width: percent, height: '100%', borderRadius: 999, backgroundColor: color }} />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon,
  disabled,
  loading,
  tone = 'primary',
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'primary' | 'soft' | 'danger';
}) {
  const background = tone === 'danger' ? '#FDE8E8' : tone === 'soft' ? colors.primarySoft : colors.primary;
  const foreground = tone === 'danger' ? colors.danger : tone === 'soft' ? colors.primaryDark : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 50,
        borderRadius: 16,
        borderCurve: 'continuous',
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        backgroundColor: disabled ? '#D9DEDA' : background,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      {loading ? <ActivityIndicator color={foreground} /> : icon ? <Symbol name={icon} size={17} color={foreground} /> : null}
      {!loading ? <Text style={{ color: foreground, fontWeight: '800', fontSize: 16 }}>{title}</Text> : null}
    </Pressable>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text selectable style={{ fontSize: 21, fontWeight: '800', color: colors.text, letterSpacing: -0.4 }}>
        {title}
      </Text>
      {action}
    </View>
  );
}

export function Pill({ children, background = colors.surfaceMuted, color = colors.textMuted }: PropsWithChildren<{ background?: string; color?: string }>) {
  return (
    <View style={{ backgroundColor: background, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ color, fontSize: 12, fontWeight: '800' }}>{children}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 18,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name={icon} size={24} color={colors.primary} />
      </View>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text selectable style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{title}</Text>
        <Text selectable style={{ fontSize: 14, lineHeight: 20, textAlign: 'center', color: colors.textMuted }}>{body}</Text>
      </View>
    </Card>
  );
}
