import { useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { MenuRow } from '@/components/savings-ui';
import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';

type GroupKey = 'display' | 'control' | 'data';

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 45 }} />;
}

function SettingSwitch({ icon, title, value, onValueChange }: { icon: string; title: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Symbol name={icon} size={15} color={colors.primaryDark} />
      </View>
      <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: '800' }}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D9DEDA', true: colors.primarySoft }}
        thumbColor={value ? colors.primary : '#FFFFFF'}
      />
    </View>
  );
}

function Group({ icon, title, open, onPress, children }: { icon: string; title: string; open: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <View style={{ borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ minHeight: 56, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.7 : 1 })}>
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Symbol name={icon} size={16} color={colors.primaryDark} />
        </View>
        <Text style={{ flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' }}>{title}</Text>
        <Symbol name={open ? 'chevron.down' : 'chevron.right'} size={13} color={colors.textMuted} />
      </Pressable>
      {open ? <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>{children}</View> : null}
    </View>
  );
}

export default function SettingsScreen() {
  const store = useAppStore();
  const [open, setOpen] = useState<GroupKey | null>(null);
  const toggle = (key: GroupKey) => setOpen((current) => current === key ? null : key);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 105, gap: 10 }}>
      <Group icon="eye.fill" title="Anzeige" open={open === 'display'} onPress={() => toggle('display')}>
        <SettingSwitch icon="bolt.fill" title="Schnellbeträge" value={store.preferences.showQuickAmounts} onValueChange={(value) => void store.setPreference('showQuickAmounts', value)} />
        <Divider />
        <SettingSwitch icon="calendar" title="Monatsbetrag" value={store.preferences.showMonthly} onValueChange={(value) => void store.setPreference('showMonthly', value)} />
        <Divider />
        <SettingSwitch icon="flame.fill" title="Serie & Level" value={store.preferences.showGamification} onValueChange={(value) => void store.setPreference('showGamification', value)} />
        <Divider />
        <SettingSwitch icon="checkmark.circle.fill" title="Erreichte Ziele" value={store.preferences.showCompletedGoals} onValueChange={(value) => void store.setPreference('showCompletedGoals', value)} />
      </Group>

      <Group icon="hand.tap.fill" title="Bedienung" open={open === 'control'} onPress={() => toggle('control')}>
        <SettingSwitch icon="iphone.radiowaves.left.and.right" title="Haptisches Feedback" value={store.preferences.haptics} onValueChange={(value) => void store.setPreference('haptics', value)} />
        <Divider />
        <SettingSwitch icon="checkmark.shield.fill" title="Schnell-Sparen bestätigen" value={store.preferences.confirmQuickSave} onValueChange={(value) => void store.setPreference('confirmQuickSave', value)} />
      </Group>

      <Group icon="externaldrive.fill" title="Daten & App" open={open === 'data'} onPress={() => toggle('data')}>
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
          subtitle="Ziele, Challenges, Regeln und Verlauf"
          destructive
          onPress={() => Alert.alert('Alles löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden.', [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Alles löschen', style: 'destructive', onPress: () => void store.resetAll() },
          ])}
        />
      </Group>

      <Text selectable style={{ alignSelf: 'center', marginTop: 5, color: colors.textMuted, fontSize: 11 }}>Nur lokal · SparFlow 2.2.0</Text>
    </ScrollView>
  );
}
