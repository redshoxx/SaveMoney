import { ScrollView, Text, View } from 'react-native';

import { IconBubble } from '@/components/savings-ui';
import { Card, ProgressBar, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/app-store';

export default function AchievementsScreen() {
  const store = useAppStore();
  const unlocked = store.achievements.filter((item) => item.unlocked);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 70, gap: 20 }}>
      <Card style={{ backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: '#FFFFFF18', alignItems: 'center', justifyContent: 'center' }}><Symbol name="trophy.fill" size={26} color="#FFFFFF" /></View>
          <View style={{ flex: 1, gap: 3 }}><Text selectable style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900' }}>{unlocked.length} von {store.achievements.length} Erfolgen</Text><Text selectable style={{ color: '#D2E5D8', fontSize: 13 }}>Badges entstehen aus deinem echten lokalen Sparfortschritt.</Text></View>
        </View>
      </Card>

      <SectionHeading title="Erfolge" />
      <View style={{ gap: 12 }}>
        {store.achievements.map((achievement) => (
          <Card key={achievement.id} style={{ opacity: achievement.unlocked ? 1 : 0.72 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <IconBubble icon={achievement.icon} color={achievement.unlocked ? colors.primary : colors.textMuted} background={achievement.unlocked ? colors.primarySoft : colors.surfaceMuted} size={48} />
              <View style={{ flex: 1, gap: 3 }}><Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>{achievement.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 12.5, lineHeight: 18 }}>{achievement.subtitle}</Text></View>
              <Symbol name={achievement.unlocked ? 'checkmark.seal.fill' : 'lock.fill'} size={20} color={achievement.unlocked ? colors.primary : colors.textMuted} />
            </View>
            <ProgressBar value={achievement.progress} color={achievement.unlocked ? colors.primary : '#AEB6AF'} height={8} />
            <Text selectable style={{ color: achievement.unlocked ? colors.primaryDark : colors.textMuted, fontSize: 12, fontWeight: '800' }}>{achievement.unlocked ? 'Freigeschaltet' : `${Math.round(achievement.progress * 100)} % geschafft`}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
