import { router } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';

import { MenuRow } from '@/components/savings-ui';
import { Card, SectionHeading } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

export default function SettingsScreen() {
  const store = useAppStore();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 18 }}>
      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>SPARFLOW</Text>
        <Text selectable style={{ color: colors.text, fontSize: 25, fontWeight: '900' }}>{formatMoney(store.totalSaved)}</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>Level {store.level} · 🔥 {store.streak} Tage</Text>
      </Card>

      <View style={{ gap: 9 }}>
        <SectionHeading title="Sparen" />
        <Card style={{ gap: 0 }}>
          <MenuRow icon="sparkles" title="Sparideen" subtitle="Aktionen, Roulette und No-Spend" onPress={() => router.push('/play')} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <MenuRow icon="clock.badge.checkmark.fill" title="Sparregeln" subtitle="Wiederkehrende Sparbeträge" onPress={() => router.push('/rules')} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <MenuRow icon="function" title="Was wäre wenn?" subtitle="Kleine Beträge hochrechnen" onPress={() => router.push('/what-if')} />
        </Card>
      </View>

      <View style={{ gap: 9 }}>
        <SectionHeading title="Übersicht" />
        <Card style={{ gap: 0 }}>
          <MenuRow icon="trophy.fill" title="Erfolge" subtitle={`${store.achievements.filter((item) => item.unlocked).length} freigeschaltet`} onPress={() => router.push('/achievements')} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <MenuRow icon="chart.bar.fill" title="Statistiken" subtitle="Woche, Monate und Prognose" onPress={() => router.push('/statistics')} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <MenuRow icon="clock.arrow.circlepath" title="Verlauf" subtitle={`${store.contributions.length} Buchungen`} onPress={() => router.push('/history')} />
        </Card>
      </View>

      <View style={{ gap: 9 }}>
        <SectionHeading title="iPhone" />
        <Card style={{ gap: 0 }}>
          <MenuRow
            icon="rectangle.3.group.fill"
            title="Widget"
            subtitle="Bei SideStore: App-Erweiterungen behalten"
            onPress={() => router.push('/widget-preview')}
          />
        </Card>
      </View>

      <View style={{ gap: 9 }}>
        <SectionHeading title="Daten" />
        <Card style={{ gap: 0 }}>
          <MenuRow
            icon="trash.fill"
            title="Lokale Daten löschen"
            subtitle="SparFlow vollständig zurücksetzen"
            destructive
            onPress={() => Alert.alert(
              'Alles zurücksetzen?',
              'Sparziele, Challenges, Sparregeln und Verlauf werden dauerhaft gelöscht.',
              [
                { text: 'Abbrechen', style: 'cancel' },
                { text: 'Alles löschen', style: 'destructive', onPress: () => void store.resetAll() },
              ],
            )}
          />
        </Card>
      </View>

      <Text selectable style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>Lokal gespeichert · keine Anmeldung</Text>
    </ScrollView>
  );
}
