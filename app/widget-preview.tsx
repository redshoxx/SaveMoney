import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card, ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

export default function WidgetPreviewScreen() {
  const store = useAppStore();
  const goal = store.primaryGoal;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, paddingBottom: 70, gap: 18 }}>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ color: colors.text, fontSize: 25, fontWeight: '900' }}>Widget</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>Gesamtbetrag und Hauptziel direkt auf dem Homescreen.</Text>
      </View>

      <View style={{ width: 170, minHeight: 170, borderRadius: 32, borderCurve: 'continuous', backgroundColor: '#173E2B', padding: 18, gap: 10 }}>
        <Text style={{ color: '#BFD7C8', fontSize: 11, fontWeight: '900' }}>SPARFLOW</Text>
        <Text selectable style={{ color: '#FFFFFF', fontSize: 25, fontWeight: '900' }}>{formatMoney(store.totalSaved)}</Text>
        <View style={{ flex: 1 }} />
        {goal ? (
          <>
            <Text selectable style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>{goal.title}</Text>
            <ProgressBar value={progress(goal.savedAmount, goal.targetAmount)} color="#7BE0A7" height={7} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text selectable style={{ color: '#D7E7DC', fontSize: 11 }}>{Math.round(progress(goal.savedAmount, goal.targetAmount) * 100)} %</Text>
              <Text selectable style={{ color: '#D7E7DC', fontSize: 11 }}>🔥 {store.streak}</Text>
            </View>
          </>
        ) : (
          <Text selectable style={{ color: '#FFFFFF', fontWeight: '800' }}>Noch kein Ziel</Text>
        )}
      </View>

      <Card>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <Symbol name="iphone" size={20} color={colors.primary} />
          <View style={{ flex: 1, gap: 5 }}>
            <Text selectable style={{ color: colors.text, fontWeight: '900' }}>Widget hinzufügen</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>
              Homescreen lange drücken → Bearbeiten → Widget hinzufügen → SparFlow → Klein oder Mittel.
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text selectable style={{ color: colors.text, fontWeight: '900' }}>Wichtig bei SideStore</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>
          Beim Installieren oder Aktualisieren „App-Erweiterungen behalten“ auswählen. Wird die Widget-Extension entfernt, kann SparFlow nicht in der iOS-Widget-Auswahl erscheinen. Ein kostenloser Apple-Account benötigt für die Extension einen zusätzlichen App-ID-Slot.
        </Text>
      </Card>

      <Pressable
        onPress={() => void store.reload()}
        style={({ pressed }) => ({
          minHeight: 50,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          opacity: pressed ? 0.75 : 1,
        })}>
        <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Widget aktualisieren</Text>
      </Pressable>

      <Text selectable style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18 }}>
        SideStore hat derzeit einen offenen Fehler bei App-Group-Entitlements von Widgets. Die Widget-Extension selbst wird von SparFlow korrekt eingebettet; falls Live-Daten trotz vorhandener Widget-Kachel fehlen, liegt das aktuell an der SideStore-Signierung.
      </Text>
    </ScrollView>
  );
}
