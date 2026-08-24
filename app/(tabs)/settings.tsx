import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { MenuRow } from '@/components/savings-ui';
import { Card, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

function SettingSwitch({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Symbol name={icon} size={17} color={colors.primaryDark} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 17 }}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D9DEDA', true: colors.primarySoft }}
        thumbColor={value ? colors.primary : '#FFFFFF'}
      />
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 47 }} />;
}

export default function SettingsScreen() {
  const store = useAppStore();
  const unlocked = store.achievements.filter((item) => item.unlocked).length;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 18 }}>
      <Card style={{ gap: 5 }}>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>SPARFLOW</Text>
        <Text selectable style={{ color: colors.text, fontSize: 26, fontWeight: '900' }}>{formatMoney(store.totalSaved)}</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>
          {store.goals.length} Ziele · {store.challenges.filter((item) => !item.completedAt).length} aktive Challenges
        </Text>
      </Card>

      <View style={{ gap: 9 }}>
        <SectionHeading title="Startseite" />
        <Card style={{ gap: 0, paddingVertical: 2 }}>
          <SettingSwitch
            icon="bolt.fill"
            title="Schnellbeträge anzeigen"
            subtitle="5, 10, 20 und 50 € direkt beim Hauptziel"
            value={store.preferences.showQuickAmounts}
            onValueChange={(value) => void store.setPreference('showQuickAmounts', value)}
          />
          <Divider />
          <SettingSwitch
            icon="calendar"
            title="Monatsbetrag anzeigen"
            subtitle="Zeigt auf Heute zusätzlich den aktuellen Monat"
            value={store.preferences.showMonthly}
            onValueChange={(value) => void store.setPreference('showMonthly', value)}
          />
          <Divider />
          <SettingSwitch
            icon="flame.fill"
            title="Serie & Level anzeigen"
            subtitle="Gamification auf der Startseite ein- oder ausblenden"
            value={store.preferences.showGamification}
            onValueChange={(value) => void store.setPreference('showGamification', value)}
          />
          <Divider />
          <SettingSwitch
            icon="checkmark.circle.fill"
            title="Erreichte Ziele anzeigen"
            subtitle="Abgeschlossene Sparziele im Bereich Sparen sichtbar lassen"
            value={store.preferences.showCompletedGoals}
            onValueChange={(value) => void store.setPreference('showCompletedGoals', value)}
          />
        </Card>
      </View>

      <View style={{ gap: 9 }}>
        <SectionHeading title="Bedienung" />
        <Card style={{ gap: 0, paddingVertical: 2 }}>
          <SettingSwitch
            icon="iphone.radiowaves.left.and.right"
            title="Haptisches Feedback"
            subtitle="Kurzes iPhone-Feedback nach Sparaktionen"
            value={store.preferences.haptics}
            onValueChange={(value) => void store.setPreference('haptics', value)}
          />
          <Divider />
          <SettingSwitch
            icon="checkmark.shield.fill"
            title="Schnell-Sparen bestätigen"
            subtitle="Vor Schnellbeträgen noch einmal nachfragen"
            value={store.preferences.confirmQuickSave}
            onValueChange={(value) => void store.setPreference('confirmQuickSave', value)}
          />
        </Card>
      </View>

      <View style={{ gap: 9 }}>
        <SectionHeading title="Werkzeuge" />
        <Card style={{ gap: 0 }}>
          <MenuRow icon="clock.badge.checkmark.fill" title="Sparregeln" subtitle="Wiederkehrende Sparbeträge verwalten" onPress={() => router.push('/rules')} />
          <Divider />
          <MenuRow icon="clock.arrow.circlepath" title="Verlauf" subtitle={`${store.contributions.length} Buchungen`} onPress={() => router.push('/history')} />
          <Divider />
          <MenuRow icon="chart.bar.fill" title="Statistiken" subtitle="Woche, Monate und Ziel-Prognose" onPress={() => router.push('/statistics')} />
          <Divider />
          <MenuRow icon="trophy.fill" title="Erfolge" subtitle={`${unlocked} freigeschaltet`} onPress={() => router.push('/achievements')} />
          <Divider />
          <MenuRow icon="function" title="Was wäre wenn?" subtitle="Kleine Beträge langfristig hochrechnen" onPress={() => router.push('/what-if')} />
          <Divider />
          <MenuRow icon="sparkles" title="Sparideen" subtitle="Aktionen, Roulette und No-Spend" onPress={() => router.push('/play')} />
        </Card>
      </View>

      <View style={{ gap: 9 }}>
        <SectionHeading title="Daten & App" />
        <Card style={{ gap: 0 }}>
          <MenuRow
            icon="arrow.clockwise"
            title="Daten neu laden"
            subtitle="Lokale Datenbank erneut einlesen"
            onPress={() => void store.reload()}
          />
          <Divider />
          <MenuRow
            icon="slider.horizontal.3"
            title="Einstellungen zurücksetzen"
            subtitle="Nur App-Optionen auf Standard setzen"
            onPress={() => Alert.alert(
              'Einstellungen zurücksetzen?',
              'Deine Sparziele und Buchungen bleiben erhalten.',
              [
                { text: 'Abbrechen', style: 'cancel' },
                { text: 'Zurücksetzen', onPress: () => void store.restorePreferenceDefaults() },
              ],
            )}
          />
          <Divider />
          <MenuRow
            icon="trash.fill"
            title="Alle Spar-Daten löschen"
            subtitle="Ziele, Challenges, Regeln und Verlauf entfernen"
            destructive
            onPress={() => Alert.alert(
              'Alles löschen?',
              'Diese Aktion kann nicht rückgängig gemacht werden.',
              [
                { text: 'Abbrechen', style: 'cancel' },
                { text: 'Alles löschen', style: 'destructive', onPress: () => void store.resetAll() },
              ],
            )}
          />
        </Card>
      </View>

      <Pressable onPress={() => router.push('/(tabs)/goals')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 4 }}>
          <Symbol name="lock.fill" size={12} color={colors.textMuted} />
          <Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>Nur lokal gespeichert · keine Anmeldung · Version 2.1.0</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}
