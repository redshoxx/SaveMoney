import { router } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

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
          borderRadius: 20,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: glow ? `${accent}80` : colors.border,
          backgroundColor: colors.surface,
          padding: 14,
          gap: 12,
          boxShadow: glow ? `0 0 24px ${accent}35` : '0 8px 20px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {glow ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 130,
            height: 130,
            borderRadius: 65,
            right: -58,
            top: -66,
            backgroundColor: `${accent}16`,
          }}
        />
      ) : null}
      {children}
    </View>
  );
}

export function GlowIcon({ name, color = colors.primary, size = 18 }: { name: string; color?: string; size?: number }) {
  return (
    <View
      style={{
        width: size + 24,
        height: size + 24,
        borderRadius: 15,
        backgroundColor: `${color}1F`,
        borderWidth: 1,
        borderColor: `${color}45`,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 18px ${color}35`,
      }}
    >
      <Symbol name={name} size={size} color={color} />
    </View>
  );
}

export function NeonProgress({ value, color = colors.primary, height = 6 }: { value: number; color?: string; height?: number }) {
  const percent = `${Math.max(0, Math.min(1, value)) * 100}%` as `${number}%`;
  return (
    <View style={{ height, borderRadius: 999, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}>
      <View
        style={{
          width: percent,
          height: '100%',
          borderRadius: 999,
          backgroundColor: color,
          boxShadow: `0 0 14px ${color}`,
        }}
      />
    </View>
  );
}

export function PulseOrb({ color = colors.primary, size = 9 }: { color?: string; size?: number }) {
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 1100, useNativeDriver: true }),
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
        boxShadow: `0 0 12px ${color}`,
      }}
    />
  );
}

export function ProfileButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profil und Einstellungen öffnen"
      onPress={() => router.push('/settings')}
      style={({ pressed }) => ({
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: `${colors.primary}70`,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.72 : 1,
        boxShadow: `0 0 16px ${colors.glow}`,
      })}
    >
      <Symbol name="person.crop.circle.fill" size={22} color={colors.primaryDark} />
    </Pressable>
  );
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
        {eyebrow ? <Text style={{ color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>{eyebrow}</Text> : null}
        <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.8 }}>{title}</Text>
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
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: muted ? colors.border : `${color}70`,
        backgroundColor: muted ? colors.surfaceMuted : `${color}20`,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: pressed ? 0.68 : 1,
        boxShadow: muted ? undefined : `0 0 12px ${color}24`,
      })}
    >
      <Symbol name={icon} size={12} color={muted ? colors.textMuted : color} />
      <Text style={{ color: muted ? colors.textMuted : color, fontSize: 11.5, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}
