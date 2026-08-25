import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

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
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              borderRadius: 13,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primarySoft : colors.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              opacity: pressed ? 0.72 : 1,
            })}
          >
            <Symbol name={option.icon} size={14} color={active ? colors.primaryDark : colors.textMuted} />
            <Text style={{ color: active ? colors.primaryDark : colors.text, fontSize: 12, fontWeight: '900' }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingSwitch({ icon, title, subtitle, value, onValueChange }: { icon: string; title: string; subtitle: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={{ minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Symbol name={icon} size={16} color={colors.primaryDark} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{title}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.disabled, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.6 }}>{title}</Text>
      <View style={{ borderRadius: 18, paddingHorizontal: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 46 }} />;
}

export default function SettingsScreen() {
  const store = useAppStore();
  const version = Constants.expoConfig?.version ?? '3.0.0';

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 96, gap: 16 }}>
      <View style={{ gap: 3 }}>
        <Text style={{ color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.5 }}>Einstellungen</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>Nur das, was du wirklich für die Bedienung brauchst.</Text>
      </View>

      <Section title="DARSTELLUNG">
        <View style={{ paddingVertical: 13, gap: 9 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Symbol name="circle.lefthalf.filled" size={16} color={colors.primaryDark} />
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Farbschema</Text>
          </View>
          <ThemeSelector value={store.preferences.themeMode} onChange={(value) => void store.setPreference('themeMode', value)} />
        </View>
      </Section>

      <Section title="BEDIENUNG">
        <SettingSwitch
          icon="iphone.radiowaves.left.and.right"
          title="Haptisches Feedback"
          subtitle="Kurze Rückmeldung bei erfolgreichen Aktionen."
          value={store.preferences.haptics}
          onValueChange={(value) => void store.setPreference('haptics', value)}
        />
        <Divider />
        <SettingSwitch
          icon="checkmark.shield.fill"
          title="Schnell-Sparen bestätigen"
          subtitle="Zusätzliche Bestätigung vor schnellen Buchungen."
          value={store.preferences.confirmQuickSave}
          onValueChange={(value) => void store.setPreference('confirmQuickSave', value)}
        />
      </Section>

      <Section title="DATENSCHUTZ & DATEN">
        <View style={{ paddingVertical: 13, flexDirection: 'row', gap: 11, alignItems: 'center' }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Symbol name="lock.shield.fill" size={17} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Lokal auf diesem iPhone</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>Sparziele, Buchungen und Challenges liegen in der lokalen SQLite-Datenbank. SparFlow benötigt dafür kein Benutzerkonto.</Text>
          </View>
        </View>
        <Divider />
        <MenuRow icon="arrow.clockwise" title="Daten neu laden" subtitle="Lokale Datenbank erneut einlesen" onPress={() => void store.reload()} />
        <Divider />
        <MenuRow
          icon="slider.horizontal.3"
          title="Einstellungen zurücksetzen"
          subtitle="Spar-Daten bleiben erhalten"
          onPress={() => Alert.alert('Einstellungen zurücksetzen?', 'Deine Sparziele und Buchungen bleiben erhalten.', [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Zurücksetzen', onPress: () => void store.restorePreferenceDefaults() },
          ])}
        />
        <Divider />
        <MenuRow
          icon="trash.fill"
          title="Alle Spar-Daten löschen"
          subtitle="Ziele, Rücklagen, Challenges, Regeln und Verlauf"
          destructive
          onPress={() => Alert.alert('Alle Spar-Daten löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden.', [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Endgültig löschen', style: 'destructive', onPress: () => void store.resetAll() },
          ])}
        />
      </Section>

      {store.error ? <Text style={{ color: colors.danger, fontSize: 11.5, textAlign: 'center' }}>{store.error}</Text> : null}
      <Text selectable style={{ alignSelf: 'center', color: colors.textMuted, fontSize: 10.5 }}>SparFlow {version} · lokal gespeichert</Text>
    </ScrollView>
  );
}
