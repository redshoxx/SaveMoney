import { Alert, ScrollView, Text, View } from 'react-native';

import { Card, Pill, PrimaryButton, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney } from '@/utils/money';

export default function SettingsScreen() {
  const store = useAppStore();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 20 }}>
      <Card style={{ backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 50, height: 50, borderRadius: 17, backgroundColor: '#FFFFFF18', alignItems: 'center', justifyContent: 'center' }}>
            <Symbol name="lock.shield.fill" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text selectable style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>Lokal & privat</Text>
            <Text selectable style={{ color: '#C8E3D1', lineHeight: 19 }}>
              Deine Spar-Daten bleiben in der SQLite-Datenbank auf diesem iPhone.
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Übersicht" />
        <Card style={{ gap: 0 }}>
          {[
            ['Gesamt gespart', formatMoney(store.totalSaved)],
            ['Sparziele', String(store.goals.length)],
            ['Challenges', String(store.challenges.length)],
            ['Level', String(store.level)],
          ].map(([label, value], index) => (
            <View
              key={label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 13,
                borderBottomWidth: index === 3 ? 0 : 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text selectable style={{ color: colors.textMuted, fontWeight: '700' }}>{label}</Text>
              <Text selectable style={{ color: colors.text, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{value}</Text>
            </View>
          ))}
        </Card>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Installation" />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Symbol name="iphone" size={25} color={colors.primary} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text selectable style={{ color: colors.text, fontWeight: '900' }}>SideStore-ready</Text>
              <Text selectable style={{ color: colors.textMuted, lineHeight: 19 }}>
                Das Repository enthält einen GitHub-Workflow für eine unsigned iOS-IPA, die SideStore beim Installieren neu signieren kann.
              </Text>
            </View>
            <Pill>iPhone</Pill>
          </View>
        </Card>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Daten" />
        <PrimaryButton
          title="Alle lokalen Daten löschen"
          tone="danger"
          icon="trash.fill"
          onPress={() =>
            Alert.alert('Alles zurücksetzen?', 'Sparziele, Challenges und alle Einzahlungen werden dauerhaft von diesem Gerät gelöscht.', [
              { text: 'Abbrechen', style: 'cancel' },
              { text: 'Alles löschen', style: 'destructive', onPress: () => void store.resetAll() },
            ])
          }
        />
      </View>

      <Text selectable style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
        SparFlow 1.0 · Local-first · Keine Cloud-Anmeldung erforderlich
      </Text>
    </ScrollView>
  );
}
