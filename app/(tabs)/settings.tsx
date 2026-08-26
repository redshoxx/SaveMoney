import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import type { ThemeMode } from '@/db/preferences';
import { useAppStore } from '@/store/app-store';

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 7 }}>
      {title ? <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>{title}</Text> : null}
      <View style={{ borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 39 }} />;
}

function Row({ icon, title, value, onPress, destructive = false }: { icon: string; title: string; value?: string; onPress?: () => void; destructive?: boolean }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.58 : 1 })}
    >
      <View style={{ width: 29, height: 29, borderRadius: 9, backgroundColor: destructive ? colors.dangerSoft : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Symbol name={icon} size={13} color={destructive ? colors.danger : colors.textMuted} />
      </View>
      <Text style={{ flex: 1, color: destructive ? colors.danger : colors.text, fontSize: 11.5, fontWeight: '700' }}>{title}</Text>
      {value ? <Text style={{ color: colors.textMuted, fontSize: 10 }}>{value}</Text> : null}
      {onPress ? <Symbol name="chevron.right" size={9} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

function SwitchRow({ icon, title, value, onValueChange }: { icon: string; title: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 29, height: 29, borderRadius: 9, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Symbol name={icon} size={13} color={colors.textMuted} />
      </View>
      <Text style={{ flex: 1, color: colors.text, fontSize: 11.5, fontWeight: '700' }}>{title}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.disabled, true: colors.primary }} />
    </View>
  );
}

function themeLabel(value: ThemeMode) {
  if (value === 'dark') return 'Dunkel';
  if (value === 'light') return 'Hell';
  return 'System';
}

export default function SettingsScreen() {
  const store = useAppStore();
  const version = Constants.expoConfig?.version ?? '3.3.0';

  const chooseTheme = () => {
    Alert.alert('Design', 'Wähle das Farbschema für SparFlow.', [
      { text: 'System', onPress: () => void store.setPreference('themeMode', 'system') },
      { text: 'Hell', onPress: () => void store.setPreference('themeMode', 'light') },
      { text: 'Dunkel', onPress: () => void store.setPreference('themeMode', 'dark') },
      { text: 'Abbrechen', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 12, paddingBottom: 106, gap: 14 }}>
      <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>Einstellungen</Text>

      <Section>
        <Row icon="person.crop.circle" title="Profil" value="Lokal" onPress={() => Alert.alert('Profil', 'SparFlow 3.3.0 verwendet kein Benutzerkonto. Deine Daten bleiben lokal auf diesem Gerät.')} />
        <Divider />
        <SwitchRow icon="lock.fill" title="Schnell-Sparen bestätigen" value={store.preferences.confirmQuickSave} onValueChange={(value) => void store.setPreference('confirmQuickSave', value)} />
        <Divider />
        <Row icon="externaldrive.fill" title="Daten & Backup" onPress={() => Alert.alert('Daten & Backup', 'Deine Spar-Daten liegen lokal in SQLite auf diesem iPhone.', [
          { text: 'Daten neu laden', onPress: () => void store.reload() },
          { text: 'OK', style: 'cancel' },
        ])} />
      </Section>

      <Section title="App">
        <Row icon="circle.lefthalf.filled" title="Design" value={themeLabel(store.preferences.themeMode)} onPress={chooseTheme} />
        <Divider />
        <SwitchRow icon="iphone.radiowaves.left.and.right" title="Haptisches Feedback" value={store.preferences.haptics} onValueChange={(value) => void store.setPreference('haptics', value)} />
        <Divider />
        <Row icon="eurosign.circle" title="Währung" value="EUR (€)" />
      </Section>

      <Section>
        <Row icon="questionmark.circle" title="Hilfe & Support" onPress={() => Alert.alert('Hilfe & Support', 'SparFlow ist vollständig lokal. Bei Problemen kannst du zuerst „Daten neu laden“ verwenden.')} />
        <Divider />
        <Row icon="info.circle" title="Über SparFlow" value={version} onPress={() => Alert.alert('Über SparFlow', `SparFlow ${version}\nLokale Spar-App mit Zielen, Challenges und Monatsplanung.`)} />
      </Section>

      <Section>
        <Row icon="arrow.counterclockwise" title="Einstellungen zurücksetzen" onPress={() => Alert.alert('Einstellungen zurücksetzen?', 'Deine Sparziele und Buchungen bleiben erhalten.', [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Zurücksetzen', onPress: () => void store.restorePreferenceDefaults() },
        ])} />
        <Divider />
        <Row destructive icon="trash.fill" title="Alle Spar-Daten löschen" onPress={() => Alert.alert('Alle Spar-Daten löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden.', [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Endgültig löschen', style: 'destructive', onPress: () => void store.resetAll() },
        ])} />
      </Section>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 6 }}>
        {[
          ['figure.walk', '100% Offline', 'Deine Daten bleiben bei dir.'],
          ['lock.fill', 'Sicher & Privat', 'Keine Cloud.'],
          ['hand.tap.fill', 'Einfach', 'Für jeden gemacht.'],
          ['trophy.fill', 'Motivierend', 'Erfolge feiern.'],
        ].map(([icon, title, subtitle]) => (
          <View key={title} style={{ width: '24%', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}><Symbol name={icon} size={14} color={colors.textMuted} /></View>
            <Text style={{ color: colors.text, fontSize: 8.5, fontWeight: '800', textAlign: 'center' }}>{title}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 7.5, lineHeight: 10, textAlign: 'center' }}>{subtitle}</Text>
          </View>
        ))}
      </View>

      {store.error ? <Text style={{ color: colors.danger, fontSize: 10.5, textAlign: 'center' }}>{store.error}</Text> : null}
    </ScrollView>
  );
}
