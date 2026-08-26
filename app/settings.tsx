import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { GlowIcon, NeonCard, ScreenHeader } from '@/components/neon-ui';
import { MenuRow } from '@/components/savings-ui';
import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import type { ThemeMode } from '@/db/preferences';
import { useAppStore } from '@/store/app-store';

function ThemeSelector({ value, onChange }: { value: ThemeMode; onChange: (value: ThemeMode) => void }) {
  const options: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'system', label: 'System', icon: 'iphone' },
    { value: 'light', label: 'Hell', icon: 'sun.max.fill' },
    { value: 'dark', label: 'Dunkel', icon: 'moon.fill' },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 7 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)} style={({ pressed }) => ({ flex: 1, minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: active ? `${colors.primary}90` : colors.border, backgroundColor: active ? colors.primarySoft : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, opacity: pressed ? 0.72 : 1, boxShadow: active ? `0 0 14px ${colors.glow}` : undefined })}>
            <Symbol name={option.icon} size={14} color={active ? colors.primaryDark : colors.textMuted} />
            <Text style={{ color: active ? colors.primaryDark : colors.text, fontSize: 11.5, fontWeight: '900' }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingSwitch({ icon, title, subtitle, value, onValueChange }: { icon: string; title: string; subtitle: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={{ minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <GlowIcon name={icon} color={colors.blue} size={15} />
      <View style={{ flex: 1, gap: 2 }}><Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>{title}</Text><Text style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>{subtitle}</Text></View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.disabled, true: colors.primarySoft }} thumbColor={value ? colors.primary : colors.surface} />
    </View>
  );
}

function Section({ title, children, accent = colors.primary }: { title: string; children: ReactNode; accent?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.65 }}>{title}</Text>
      <NeonCard accent={accent} style={{ paddingHorizontal: 13, paddingVertical: 2, gap: 0 }}>{children}</NeonCard>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 48 }} />;
}

export default function SettingsScreen() {
  const store = useAppStore();
  const version = Constants.expoConfig?.version ?? '3.3.0';

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 10, paddingBottom: 60, gap: 16 }}>
      <ScreenHeader title="Profil & Einstellungen" subtitle="Deine App. Deine Regeln. Alles lokal auf diesem iPhone." right={<GlowIcon name="person.crop.circle.fill" color={colors.purple} size={20} />} />

      <NeonCard accent={colors.purple} glow style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <GlowIcon name="sparkles" color={colors.magenta} size={18} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>SparFlow {version}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Lokal gespeichert · kein Benutzerkonto nötig</Text>
          </View>
          <View style={{ borderRadius: 999, backgroundColor: `${colors.success}18`, paddingHorizontal: 8, paddingVertical: 5 }}><Text style={{ color: colors.success, fontSize: 9.5, fontWeight: '900' }}>PRIVAT</Text></View>
        </View>
      </NeonCard>

      <Section title="DARSTELLUNG" accent={colors.purple}>
        <View style={{ paddingVertical: 13, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><GlowIcon name="circle.lefthalf.filled" color={colors.purple} size={14} /><View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Farbschema</Text><Text style={{ color: colors.textMuted, fontSize: 10.5 }}>System, Hell oder Neon-Dunkel</Text></View></View>
          <ThemeSelector value={store.preferences.themeMode} onChange={(value) => void store.setPreference('themeMode', value)} />
        </View>
      </Section>

      <Section title="BEDIENUNG" accent={colors.blue}>
        <SettingSwitch icon="iphone.radiowaves.left.and.right" title="Haptisches Feedback" subtitle="Kurze Rückmeldung bei erfolgreichen Aktionen." value={store.preferences.haptics} onValueChange={(value) => void store.setPreference('haptics', value)} />
        <Divider />
        <SettingSwitch icon="checkmark.shield.fill" title="Schnell-Sparen bestätigen" subtitle="Zusätzliche Bestätigung vor schnellen Buchungen." value={store.preferences.confirmQuickSave} onValueChange={(value) => void store.setPreference('confirmQuickSave', value)} />
      </Section>

      <Section title="DATEN & SICHERHEIT" accent={colors.cyan}>
        <View style={{ paddingVertical: 13, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <GlowIcon name="lock.shield.fill" color={colors.cyan} size={16} />
          <View style={{ flex: 1, gap: 2 }}><Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Nur auf diesem iPhone</Text><Text style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>Ziele, Buchungen und Challenges liegen in der lokalen SQLite-Datenbank.</Text></View>
        </View>
        <Divider />
        <MenuRow icon="arrow.clockwise" title="Daten neu laden" subtitle="Lokale Datenbank erneut einlesen" onPress={() => void store.reload()} />
        <Divider />
        <MenuRow icon="slider.horizontal.3" title="Einstellungen zurücksetzen" subtitle="Spar-Daten bleiben erhalten" onPress={() => Alert.alert('Einstellungen zurücksetzen?', 'Deine Sparziele und Buchungen bleiben erhalten.', [{ text: 'Abbrechen', style: 'cancel' }, { text: 'Zurücksetzen', onPress: () => void store.restorePreferenceDefaults() }])} />
        <Divider />
        <MenuRow icon="trash.fill" title="Alle Spar-Daten löschen" subtitle="Ziele, Rücklagen, Challenges, Regeln und Verlauf" destructive onPress={() => Alert.alert('Alle Spar-Daten löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden.', [{ text: 'Abbrechen', style: 'cancel' }, { text: 'Endgültig löschen', style: 'destructive', onPress: () => void store.resetAll() }])} />
      </Section>

      {store.error ? <Text style={{ color: colors.danger, fontSize: 11, textAlign: 'center' }}>{store.error}</Text> : null}
    </ScrollView>
  );
}
