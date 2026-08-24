import { ScrollView, Text, View } from 'react-native';

import { Card, ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

export default function WidgetPreviewScreen() {
  const store = useAppStore();
  const goal = store.primaryGoal;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, paddingBottom: 70, gap: 20 }}>
      <View style={{ gap: 5 }}>
        <Text selectable style={{ color: colors.text, fontSize: 25, fontWeight: '900' }}>SparFlow Widget</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>Dein Sparfortschritt bleibt direkt auf dem iPhone-Homescreen sichtbar und wird nach Änderungen in SparFlow aktualisiert.</Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>KLEIN</Text>
        <View style={{ width: 170, minHeight: 170, borderRadius: 32, borderCurve: 'continuous', backgroundColor: '#173E2B', padding: 18, gap: 10, boxShadow: '0 12px 28px rgba(23,62,43,0.18)' }}>
          <Text style={{ color: '#BFD7C8', fontSize: 11, fontWeight: '900' }}>SPARFLOW</Text>
          <Text selectable style={{ color: '#FFFFFF', fontSize: 25, fontWeight: '900' }}>{formatMoney(store.totalSaved)}</Text>
          <View style={{ flex: 1 }} />
          {goal ? <><Text selectable style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>{goal.title}</Text><ProgressBar value={progress(goal.savedAmount, goal.targetAmount)} color="#7BE0A7" height={7} /><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text selectable style={{ color: '#D7E7DC', fontSize: 11 }}>{Math.round(progress(goal.savedAmount, goal.targetAmount) * 100)} %</Text><Text selectable style={{ color: '#D7E7DC', fontSize: 11 }}>🔥 {store.streak}</Text></View></> : <Text selectable style={{ color: '#FFFFFF', fontWeight: '800' }}>Noch kein Ziel</Text>}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>MITTEL</Text>
        <View style={{ minHeight: 170, borderRadius: 32, borderCurve: 'continuous', backgroundColor: '#173E2B', padding: 18, gap: 15 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}><View style={{ gap: 2 }}><Text style={{ color: '#BFD7C8', fontSize: 11, fontWeight: '800' }}>INSGESAMT GESPART</Text><Text selectable style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900' }}>{formatMoney(store.totalSaved)}</Text></View><View style={{ alignItems: 'flex-end', gap: 3 }}><Text selectable style={{ color: '#BFD7C8', fontSize: 11, fontWeight: '800' }}>LEVEL {store.level}</Text><Text selectable style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>🔥 {store.streak} Tage</Text></View></View>
          {goal ? <><View style={{ flex: 1 }} /><View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}><View style={{ gap: 2 }}><Text selectable style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>{goal.title}</Text><Text selectable style={{ color: '#D7E7DC', fontSize: 11 }}>Noch {formatMoney(Math.max(0, goal.targetAmount - goal.savedAmount))}</Text></View><Text selectable style={{ color: '#7BE0A7', fontSize: 18, fontWeight: '900' }}>{Math.round(progress(goal.savedAmount, goal.targetAmount) * 100)} %</Text></View><ProgressBar value={progress(goal.savedAmount, goal.targetAmount)} color="#7BE0A7" height={8} /></> : null}
        </View>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}><Symbol name="iphone" size={20} color={colors.primary} /><View style={{ flex: 1, gap: 5 }}><Text selectable style={{ color: colors.text, fontWeight: '900' }}>Zum Homescreen hinzufügen</Text><Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>Homescreen lange gedrückt halten → Bearbeiten bzw. „+“ → Widgets → SparFlow → Klein oder Mittel auswählen → Widget hinzufügen.</Text></View></View>
      </Card>

      <Card>
        <Text selectable style={{ color: colors.text, fontWeight: '900' }}>Aktualisierung</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>Nach Sparen, Challenge-Schritten, Zieländerungen oder einem Daten-Reload schreibt SparFlow automatisch einen neuen Widget-Snapshot. iOS entscheidet anschließend, wann WidgetKit die Darstellung tatsächlich neu zeichnet.</Text>
      </Card>
    </ScrollView>
  );
}
