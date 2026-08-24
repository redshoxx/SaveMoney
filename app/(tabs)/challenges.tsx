import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { IconBubble } from '@/components/savings-ui';
import { Card, EmptyState, Pill, ProgressBar, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { challengeTemplates, useAppStore } from '@/store/app-store';
import type { ChallengeTemplate } from '@/types/models';
import { formatMoney, progress } from '@/utils/money';

const categories: ChallengeTemplate['category'][] = ['Einfach', 'Verzicht', 'Gamification', 'Zufall'];

export default function ChallengesScreen() {
  const store = useAppStore();
  const active = store.challenges.filter((challenge) => !challenge.completedAt);
  const completed = store.challenges.filter((challenge) => Boolean(challenge.completedAt));

  const complete = async (challengeId: string, random: boolean) => {
    try {
      const amount = random ? [1, 2, 3, 5, 7, 10][Math.floor(Math.random() * 6)] : undefined;
      await store.completeChallengeStep(challengeId, amount);
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Challenge konnte nicht aktualisiert werden.');
    }
  };

  const start = async (template: ChallengeTemplate) => {
    try { await store.startTemplate(template); }
    catch (error) { Alert.alert('SparFlow', error instanceof Error ? error.message : 'Challenge konnte nicht gestartet werden.'); }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 22 }}>
      <View style={{ gap: 5 }}>
        <Text selectable style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 }}>Challenges</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>Kleine Missionen machen Sparen greifbar. Starte mit einer Vorlage oder baue deine eigene Regel.</Text>
      </View>

      <Pressable onPress={() => router.push('/add-challenge')} style={({ pressed }) => ({ minHeight: 54, borderRadius: 18, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.78 : 1 })}>
        <Symbol name="wand.and.stars" size={17} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>Eigene Challenge erstellen</Text>
      </Pressable>

      <View style={{ gap: 12 }}>
        <SectionHeading title={`Aktiv · ${active.length}`} />
        {active.length === 0 ? (
          <EmptyState icon="flag.fill" title="Keine aktive Challenge" body="Wähle unten eine Challenge aus und starte direkt." />
        ) : (
          <View style={{ gap: 14 }}>
            {active.map((challenge) => {
              const percentage = progress(challenge.savedAmount, challenge.targetAmount);
              return (
                <Card key={challenge.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <IconBubble icon={challenge.icon} color={challenge.color} background={`${challenge.color}18`} size={50} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{challenge.title}</Text>
                      <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>{challenge.completedSteps} von {challenge.totalSteps} Schritten · {challenge.mode === 'random' ? 'Zufall' : challenge.mode === 'action' ? 'Aktion' : challenge.mode === 'daily' ? 'Täglich' : challenge.mode === 'weekly' ? 'Wöchentlich' : 'Etappen'}</Text>
                    </View>
                    <Pill background={`${challenge.color}18`} color={challenge.color}>{Math.round(percentage * 100)}%</Pill>
                  </View>
                  <Text selectable style={{ color: colors.textMuted, lineHeight: 20 }}>{challenge.subtitle}</Text>
                  <ProgressBar value={percentage} color={challenge.color} height={10} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Text selectable style={{ color: colors.text, fontWeight: '900' }}>{formatMoney(challenge.savedAmount)}</Text><Text selectable style={{ color: colors.textMuted }}>Ziel {formatMoney(challenge.targetAmount)}</Text></View>
                  <Pressable onPress={() => void complete(challenge.id, challenge.mode === 'random')} style={({ pressed }) => ({ minHeight: 50, borderRadius: 16, backgroundColor: challenge.color, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.78 : 1 })}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>{challenge.mode === 'random' ? 'Zufallsbetrag auslosen & sparen' : challenge.mode === 'action' ? `Aktion geschafft · +${formatMoney(challenge.stepAmount)}` : `Schritt erledigt · +${formatMoney(challenge.stepAmount)}`}</Text>
                  </Pressable>
                  <Pressable onPress={() => Alert.alert('Challenge löschen?', 'Fortschritt und zugehörige Einzahlungen werden entfernt.', [{ text: 'Abbrechen', style: 'cancel' }, { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteChallenge(challenge.id) }])} style={{ alignSelf: 'flex-start', paddingVertical: 2 }}><Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>Challenge löschen</Text></Pressable>
                </Card>
              );
            })}
          </View>
        )}
      </View>

      {categories.map((category) => {
        const templates = challengeTemplates.filter((template) => template.category === category);
        return (
          <View key={category} style={{ gap: 11 }}>
            <SectionHeading title={category} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {templates.map((template) => {
                const isActive = store.challenges.some((challenge) => challenge.templateId === template.id && !challenge.completedAt);
                return (
                  <Pressable key={template.id} disabled={isActive} onPress={() => void start(template)} style={({ pressed }) => ({ width: 250, borderRadius: 22, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 17, gap: 12, opacity: isActive ? 0.55 : pressed ? 0.72 : 1 })}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><IconBubble icon={template.icon} color={template.color} background={`${template.color}18`} /><Pill background={`${template.color}12`} color={template.color}>{template.difficulty}</Pill></View>
                    <View style={{ gap: 5 }}><Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{template.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>{template.subtitle}</Text></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}><Text selectable style={{ color: template.color, fontWeight: '900' }}>{formatMoney(template.targetAmount)}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>{template.totalSteps} Schritte</Text></View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Symbol name={isActive ? 'checkmark.circle.fill' : 'play.fill'} size={14} color={template.color} /><Text style={{ color: template.color, fontWeight: '800' }}>{isActive ? 'Läuft bereits' : 'Challenge starten'}</Text></View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        );
      })}

      {completed.length > 0 ? (
        <View style={{ gap: 12 }}><SectionHeading title={`Abgeschlossen · ${completed.length}`} />{completed.slice(0, 5).map((challenge) => <Card key={challenge.id} style={{ flexDirection: 'row', alignItems: 'center' }}><IconBubble icon="checkmark.seal.fill" color={challenge.color} background={`${challenge.color}18`} /><View style={{ flex: 1, gap: 2 }}><Text selectable style={{ color: colors.text, fontWeight: '800' }}>{challenge.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 12 }}>{formatMoney(challenge.targetAmount)} geschafft</Text></View><Symbol name="trophy.fill" size={18} color={challenge.color} /></Card>)}</View>
      ) : null}
    </ScrollView>
  );
}
