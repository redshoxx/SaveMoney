import { router } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';

import { MenuRow } from '@/components/savings-ui';
import { Card, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

export default function SettingsScreen() {
  const store = useAppStore();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 20 }}>
      <Card style={{ backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: '#FFFFFF18', alignItems: 'center', justifyContent: 'center' }}><Symbol name="person.crop.circle.fill" size={27} color="#FFFFFF" /></View>
          <View style={{ flex: 1, gap: 3 }}><Text selectable style={{ color: '#FFFFFF', fontSize: 19, fontWeight: '900' }}>Level {store.level} · {store.levelName}</Text><Text selectable style={{ color: '#CFE4D6', fontSize: 13 }}>{formatMoney(store.totalSaved)} gespart · {store.streak} Tage Serie</Text></View>
        </View>
      </Card>

      <View style={{ gap: 9 }}>
        <SectionHeading title="Fortschritt" />
        <Card style={{ gap: 0 }}>
          <MenuRow icon="trophy.fill" title="Erfolge" subtitle={`${store.achievements.filter((item) => item.unlocked).length} Badges freigeschaltet`} onPress={() => router.push('/achievements')} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <MenuRow icon="chart.bar.fill" title="Statistiken" subtitle="Wochenrückblick, Monate und Prognosen" onPress={() => router.push('/statistics')} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <MenuRow icon="clock.arrow.circlepath" title="Sparverlauf" subtitle={`${store.contributions.length} lokale Buchungen`} onPress={() => router.push('/history')} />
        </Card>
      </View>

      <View style={{ gap: 9 }}>
        <SectionHeading title="Sparen automatisieren" />
        <Card style={{ gap: 0 }}>
          <MenuRow icon="clock.badge.checkmark.fill" title="Sparregeln" subtitle="Täglich, freitags oder monatlich erinnern" onPress={() => router.push('/rules')} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <MenuRow icon="function" title="Was wäre wenn?" subtitle="Kleine Beträge auf Monat und Jahr hochrechnen" onPress={() => router.push('/what-if')} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <MenuRow icon="rectangle.3.group.fill" title="Widget-Vorschau" subtitle="Kompakte Ziel- und Serienansicht für den Homescreen" onPress={() => router.push('/widget-preview')} />
        </Card>
      </View>

      <View style={{ gap: 9 }}>
        <SectionHeading title="Datenschutz & Daten" />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Symbol name="lock.shield.fill" size={22} color={colors.primary} /></View><View style={{ flex: 1, gap: 3 }}><Text selectable style={{ color: colors.text, fontWeight: '900' }}>Lokal & privat</Text><Text selectable style={{ color: colors.textMuted, fontSize: 12.5, lineHeight: 18 }}>Sparziele, Challenges, Regeln und Verlauf bleiben in SQLite auf dem Gerät. Keine Cloud-Anmeldung erforderlich.</Text></View></View>
          <MenuRow icon="trash.fill" title="Alle lokalen Daten löschen" subtitle="SparFlow vollständig zurücksetzen" destructive onPress={() => Alert.alert('Alles zurücksetzen?', 'Sparziele, Challenges, Sparregeln und Verlauf werden dauerhaft gelöscht.', [{ text: 'Abbrechen', style: 'cancel' }, { text: 'Alles löschen', style: 'destructive', onPress: () => void store.resetAll() }])} />
        </Card>
      </View>

      <Text selectable style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>SparFlow V2 · Local-first · SideStore-ready</Text>
    </ScrollView>
  );
}
