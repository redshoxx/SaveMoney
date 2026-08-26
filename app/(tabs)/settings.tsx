import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import type { ThemeMode } from '@/db/preferences';
import { useAppStore } from '@/store/app-store';

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return <View style={{ gap: 6 }}>{title ? <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800', paddingLeft: 2 }}>{title.toUpperCase()}</Text> : null}<View style={{ borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, overflow: 'hidden' }}>{children}</View></View>;
}
function Divider() { return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 39 }} />; }

function Row({ icon, title, value, onPress, destructive = false }: { icon: string; title: string; value?: string; onPress?: () => void; destructive?: boolean }) {
  return <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => ({ minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.64 : 1 })}><View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: destructive ? colors.dangerSoft : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Symbol name={icon} size={13} color={destructive ? colors.danger : colors.primaryDark} /></View><Text selectable style={{ flex: 1, color: destructive ? colors.danger : colors.text, fontSize: 11.5, fontWeight: '700' }}>{title}</Text>{value ? <Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>{value}</Text> : null}{onPress ? <Symbol name="chevron.right" size={9} color={colors.textMuted} /> : null}</Pressable>;
}

function SwitchRow({ icon, title, value, onValueChange }: { icon: string; title: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Symbol name={icon} size={13} color={colors.primaryDark} /></View><Text selectable style={{ flex: 1, color: colors.text, fontSize: 11.5, fontWeight: '700' }}>{title}</Text><Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.disabled, true: colors.primary }} /></View>;
}

function themeLabel(value: ThemeMode) { if (value === 'dark') return 'Dunkel'; if (value === 'light') return 'Hell'; return 'System'; }

export default function SettingsScreen() {
  const store = useAppStore();
  const version = Constants.expoConfig?.version ?? '4.4.2';
  const chooseTheme = () => Alert.alert('Design', 'Wähle das Farbschema für SparPilot.', [
    { text: 'System', onPress: () => void store.setPreference('themeMode', 'system') },
    { text: 'Hell', onPress: () => void store.setPreference('themeMode', 'light') },
    { text: 'Dunkel', onPress: () => void store.setPreference('themeMode', 'dark') },
    { text: 'Abbrechen', style: 'cancel' },
  ]);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 34, gap: 13 }}>
      <View style={{ alignItems: 'center', gap: 3, paddingBottom: 2 }}><Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>Einstellungen</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9.5 }}>SparPilot {version}</Text></View>

      <Section title="App">
        <Row icon="circle.lefthalf.filled" title="Design" value={themeLabel(store.preferences.themeMode)} onPress={chooseTheme} />
        <Divider />
        <SwitchRow icon="iphone.radiowaves.left.and.right" title="Haptisches Feedback" value={store.preferences.haptics} onValueChange={(value) => void store.setPreference('haptics', value)} />
        <Divider />
        <SwitchRow icon="lock.fill" title="Schnell-Sparen bestätigen" value={store.preferences.confirmQuickSave} onValueChange={(value) => void store.setPreference('confirmQuickSave', value)} />
        <Divider />
        <Row icon="eurosign.circle" title="Währung" value="EUR (€)" />
      </Section>

      <Section title="Daten">
        <Row icon="externaldrive.fill" title="Lokale Daten" value="SQLite" onPress={() => Alert.alert('Lokale Daten', 'Ziele, Challenges, To Dos und Buchungen liegen lokal auf diesem iPhone. Es ist kein Benutzerkonto nötig.', [{ text: 'Daten neu laden', onPress: () => void store.reload() }, { text: 'OK', style: 'cancel' }])} />
        <Divider />
        <Row icon="number" title="Individuelle #Nummern" onPress={() => Alert.alert('Individuelle #Nummern', 'Sparziele und Challenges erhalten automatisch eine eindeutige Nummer wie #0001. Die Nummer bleibt dem Eintrag fest zugeordnet.')} />
      </Section>

      <Section title="Info">
        <Row icon="questionmark.circle" title="Hilfe & Support" onPress={() => Alert.alert('Hilfe & Support', 'Bei einem Darstellungsproblem kannst du zuerst „Daten neu laden“ verwenden. Deine lokalen Daten werden dabei nicht gelöscht.')} />
        <Divider />
        <Row icon="info.circle" title="Über SparPilot" value={version} onPress={() => Alert.alert('Über SparPilot', `SparPilot ${version}\nLokale Spar-App mit Zielen, Challenges, To Dos und Erinnerungen.`)} />
      </Section>

      <Section>
        <Row icon="arrow.counterclockwise" title="Einstellungen zurücksetzen" onPress={() => Alert.alert('Einstellungen zurücksetzen?', 'Deine Sparziele und Buchungen bleiben erhalten.', [{ text: 'Abbrechen', style: 'cancel' }, { text: 'Zurücksetzen', onPress: () => void store.restorePreferenceDefaults() }])} />
        <Divider />
        <Row destructive icon="trash.fill" title="Alle lokalen Daten löschen" onPress={() => Alert.alert('Alle lokalen Daten löschen?', 'Ziele, Challenges, Buchungen, To Dos und geplante SparPilot-Erinnerungen werden entfernt. Diese Aktion kann nicht rückgängig gemacht werden.', [{ text: 'Abbrechen', style: 'cancel' }, { text: 'Endgültig löschen', style: 'destructive', onPress: () => void store.resetAll() }])} />
      </Section>

      <View style={{ borderRadius: 15, backgroundColor: colors.primarySoft, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }}><Symbol name="lock.shield.fill" size={15} color={colors.primaryDark} /><Text selectable style={{ flex: 1, color: colors.textMuted, fontSize: 9.5, lineHeight: 14 }}>100% lokal für die Kernfunktionen · kein Account · keine Cloud erforderlich.</Text></View>
      {store.error ? <Text selectable style={{ color: colors.danger, fontSize: 10, textAlign: 'center' }}>{store.error}</Text> : null}
    </ScrollView>
  );
}
