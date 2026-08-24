import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Symbol } from '@/components/ui';
import { colors, radius, shadow } from '@/constants/theme';
import { formatMoney } from '@/utils/money';

export function HeroCard({ children }: { children: ReactNode }) {
  return (
    <View style={{ backgroundColor: '#173E2B', borderRadius: radius.xl, borderCurve: 'continuous', padding: 22, gap: 18, boxShadow: '0 14px 36px rgba(23,62,43,0.18)' }}>
      {children}
    </View>
  );
}

export function IconBubble({ icon, color = colors.primary, background = colors.primarySoft, size = 42 }: { icon: string; color?: string; background?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size * 0.34), borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: background }}>
      <Symbol name={icon} size={Math.round(size * 0.48)} color={color} />
    </View>
  );
}

export function StatTile({ icon, label, value, caption }: { icon: string; label: string; value: string; caption?: string }) {
  return (
    <View style={{ flex: 1, minWidth: 145, backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border, padding: 15, gap: 9, boxShadow: shadow }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text selectable style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
        <Symbol name={icon} size={16} color={colors.primary} />
      </View>
      <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, fontVariant: ['tabular-nums'] }}>{value}</Text>
      {caption ? <Text selectable style={{ color: colors.textMuted, fontSize: 12, lineHeight: 17 }}>{caption}</Text> : null}
    </View>
  );
}

export function QuickAmount({ amount, selected, onPress }: { amount: number; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ minHeight: 46, paddingHorizontal: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.primary : colors.surfaceMuted, opacity: pressed ? 0.75 : 1 })}>
      <Text style={{ fontWeight: '850', fontSize: 15, color: selected ? '#FFFFFF' : colors.text }}>{formatMoney(amount)}</Text>
    </Pressable>
  );
}

export function BarChart({ data, height = 130 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <View style={{ height: height + 28, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
      {data.map((item) => {
        const barHeight = Math.max(4, (item.value / max) * height);
        return (
          <View key={item.label} style={{ flex: 1, gap: 7, alignItems: 'center', justifyContent: 'flex-end' }}>
            <View style={{ width: '100%', maxWidth: 34, height: barHeight, borderRadius: 9, borderCurve: 'continuous', backgroundColor: item.value > 0 ? colors.primary : colors.surfaceMuted }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted }}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function MenuRow({ icon, title, subtitle, onPress, destructive }: { icon: string; title: string; subtitle?: string; onPress: () => void; destructive?: boolean }) {
  const foreground = destructive ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, opacity: pressed ? 0.6 : 1 })}>
      <IconBubble icon={icon} size={38} color={destructive ? colors.danger : colors.primary} background={destructive ? '#FDE8E8' : colors.primarySoft} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text selectable style={{ fontSize: 16, fontWeight: '800', color: foreground }}>{title}</Text>
        {subtitle ? <Text selectable style={{ fontSize: 12.5, lineHeight: 18, color: colors.textMuted }}>{subtitle}</Text> : null}
      </View>
      <Symbol name="chevron.right" size={14} color={colors.textMuted} />
    </Pressable>
  );
}

export function ComparisonBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <View style={{ alignSelf: 'flex-start', borderRadius: 999, backgroundColor: positive ? colors.primarySoft : '#FDE8E8', paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ fontSize: 12, fontWeight: '850', color: positive ? colors.primaryDark : colors.danger }}>{positive ? '+' : ''}{Math.round(value)} %</Text>
    </View>
  );
}
