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
      <View style={{ gap: 5 }}><Text selectable style={{ color: colors.text, fontSize: 25, fontWeight: '900' }}>Widget-Vorschau</Text><Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>So ist die kompakte SparFlow-Ansicht für den iPhone-Homescreen vorbereitet.</Text></View>

      <View style={{ gap: 10 }}><Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>KLEIN</Text><View style={{ width: 170, minHeight: 170, borderRadius: 32, borderCurve: 'continuous', backgroundColor: '#173E2B', padding: 18, gap: 12, boxShadow: '0 12px 28px rgba(23,62,43,0.18)' }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: '#D7E7DC', fontSize: 12, fontWeight: '800' }}>SPARFLOW</Text><Symbol name="leaf.fill" size={15} color="#FFFFFF" /></View>{goal ? <><Text selectable style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>{goal.title}</Text><Text selectable style={{ color: '#FFFFFF', fontSize: 25, fontWeight: '900' }}>{Math.round(progress(goal.savedAmount, goal.targetAmount) * 100)} %</Text><ProgressBar value={progress(goal.savedAmount, goal.targetAmount)} color="#FFFFFF" height={7} /><Text selectable style={{ color: '#C9E1D1', fontSize: 11 }}>{formatMoney(goal.savedAmount)} / {formatMoney(goal.targetAmount)}</Text></> : <Text selectable style={{ color: '#FFFFFF', fontWeight: '800' }}>Noch kein Ziel</Text>}</View></View>

      <View style={{ gap: 10 }}><Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800' }}>MITTEL</Text><View style={{ minHeight: 170, borderRadius: 32, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 15 }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View style={{ gap: 2 }}><Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>HEUTE</Text><Text selectable style={{ color: colors.text, fontSize: 26, fontWeight: '900' }}>{formatMoney(store.periodMetrics.today)}</Text></View><View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}><Symbol name="flame.fill" size={21} color={colors.primary} /></View></View><View style={{ flexDirection: 'row', gap: 10 }}><Card style={{ flex: 1, padding: 12, boxShadow: 'none' }}><Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>SERIE</Text><Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>{store.streak} Tage</Text></Card><Card style={{ flex: 1, padding: 12, boxShadow: 'none' }}><Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>LEVEL</Text><Text selectable style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>{store.level}</Text></Card></View></View></View>

      <Card><Text selectable style={{ color: colors.text, fontWeight: '900' }}>Technischer Hinweis</Text><Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>Die V2-App stellt alle benötigten lokalen Werte bereits bereit. Eine echte iOS-Widget-Extension ist ein separates natives Target und wird bewusst nicht in den App-Prozess gemischt, solange der SideStore-IPA-Build noch stabilisiert wird.</Text></Card>
    </ScrollView>
  );
}
