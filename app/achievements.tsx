import { ScrollView, Text, View } from 'react-native';

import { IconBubble } from '@/components/savings-ui';
import { Card, ProgressBar, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';

export default function AchievementsScreen() {
  const store = useAppStore();
  const unlocked = store.achievements.filter((item) => item.unlocked);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 36, gap: 14 }}>
      <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primary, padding: 13 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}><Symbol name="trophy.fill" size={20} color={colors.primaryDark} /></View><View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>{unlocked.length} von {store.achievements.length} Erfolgen</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9.5, lineHeight: 14 }}>Badges entstehen aus deinem echten lokalen Sparfortschritt.</Text></View></View></Card>
      <SectionHeading title="Erfolge" />
      <View style={{ gap: 8 }}>{store.achievements.map((achievement) => <Card key={achievement.id} style={{ opacity: achievement.unlocked ? 1 : 0.7, padding: 12, gap: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><IconBubble icon={achievement.icon} color={achievement.unlocked ? colors.primaryDark : colors.textMuted} background={achievement.unlocked ? colors.primarySoft : colors.surfaceMuted} size={40} /><View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>{achievement.title}</Text><Text selectable numberOfLines={2} style={{ color: colors.textMuted, fontSize: 9.5, lineHeight: 13 }}>{achievement.subtitle}</Text></View><Symbol name={achievement.unlocked ? 'checkmark.seal.fill' : 'lock.fill'} size={17} color={achievement.unlocked ? colors.primaryDark : colors.textMuted} /></View><ProgressBar value={achievement.progress} color={achievement.unlocked ? colors.primary : colors.disabled} height={5} /><Text selectable style={{ color: achievement.unlocked ? colors.primaryDark : colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>{achievement.unlocked ? 'Freigeschaltet' : `${Math.round(achievement.progress * 100)} % geschafft`}</Text></Card>)}</View>
    </ScrollView>
  );
}
