import { Image } from 'expo-image';
import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { colors, radius, shadow } from '@/constants/theme';

export function Symbol({ name, size = 20, color = colors.text }: { name: string; size?: number; color?: string }) {
  if (process.env.EXPO_OS !== 'ios') return <Text style={{ fontSize: size * 0.78, color, fontWeight: '800' }}>•</Text>;
  return <Image source={`sf:${name}`} style={{ width: size, height: size }} tintColor={color} />;
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
          padding: 15,
          gap: 11,
          boxShadow: shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ProgressBar({ value, color = colors.primary, height = 8 }: { value: number; color?: string; height?: number }) {
  const percent = `${Math.max(0, Math.min(1, value)) * 100}%` as `${number}%`;
  return (
    <View style={{ height, borderRadius: 999, overflow: 'hidden', backgroundColor: colors.surfaceMuted }}>
      <View style={{ width: percent, height: '100%', borderRadius: 999, backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
    </View>
  );
}

export function PrimaryButton({ title, onPress, icon, disabled, loading, tone = 'primary' }: { title: string; onPress: () => void; icon?: string; disabled?: boolean; loading?: boolean; tone?: 'primary' | 'soft' | 'danger' }) {
  const background = tone === 'danger' ? colors.dangerSoft : tone === 'soft' ? colors.primarySoft : colors.primary;
  const foreground = tone === 'danger' ? colors.danger : tone === 'soft' ? colors.primaryDark : '#FFFFFF';
  const border = tone === 'danger' ? colors.danger : tone === 'soft' ? colors.primary : colors.primaryDark;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: 14,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: disabled ? colors.border : `${border}80`,
        paddingHorizontal: 17,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        backgroundColor: disabled ? colors.disabled : background,
        opacity: pressed ? 0.74 : 1,
        boxShadow: disabled || tone === 'danger' ? undefined : `0 0 18px ${colors.glow}`,
      })}
    >
      {loading ? <ActivityIndicator color={foreground} /> : icon ? <Symbol name={icon} size={16} color={foreground} /> : null}
      {!loading ? <Text style={{ color: foreground, fontWeight: '900', fontSize: 14 }}>{title}</Text> : null}
    </Pressable>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><Text selectable style={{ fontSize: 19, fontWeight: '900', color: colors.text, letterSpacing: -0.4 }}>{title}</Text>{action}</View>;
}

export function Pill({ children, background = colors.surfaceMuted, color = colors.textMuted }: PropsWithChildren<{ background?: string; color?: string }>) {
  return <View style={{ backgroundColor: background, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: `${color}25` }}><Text style={{ color, fontSize: 11, fontWeight: '900' }}>{children}</Text></View>;
}

export function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
      <View style={{ width: 50, height: 50, borderRadius: 17, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: `${colors.primary}65`, alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 18px ${colors.glow}` }}><Symbol name={icon} size={23} color={colors.primaryDark} /></View>
      <View style={{ alignItems: 'center', gap: 5 }}><Text selectable style={{ fontSize: 17, fontWeight: '900', color: colors.text }}>{title}</Text><Text selectable style={{ fontSize: 13, lineHeight: 19, textAlign: 'center', color: colors.textMuted }}>{body}</Text></View>
    </Card>
  );
}
