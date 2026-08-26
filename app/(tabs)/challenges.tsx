import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { challengeTemplates, useAppStore } from '@/store/app-store';
import type { Challenge, ChallengeCell, ChallengeTemplate } from '@/types/models';
import { formatEntityNumber } from '@/utils/entity-number';
import { formatMoney, progress } from '@/utils/money';

function nextChallengeStep(challenge: Challenge, cells: ChallengeCell[]) {
  const nextCell = cells.find((cell) => !cell.completed) ?? null;
  if (nextCell) return `${formatMoney(nextCell.amount)} sparen`;
  if (challenge.mode === 'random') return 'Einen Zufallsbetrag sparen';
  return `${formatMoney(challenge.stepAmount)} sparen`;
}

function ActiveChallengeCard({ challenge, cells, index, onContinue, onManage }: { challenge: Challenge; cells: ChallengeCell[]; index: number; onContinue: () => void; onManage: () => void }) {
  const percentage = progress(challenge.savedAmount, challenge.targetAmount);
  const remaining = Math.max(0, challenge.targetAmount - challenge.savedAmount);

  return (
    <Animated.View entering={FadeInDown.duration(190).delay(Math.min(index, 8) * 28)} layout={LinearTransition.duration(180)} style={{ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 13, gap: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: `${challenge.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={challenge.icon} size={18} color={challenge.color} /></View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>{challenge.title}</Text>
          <Text selectable style={{ color: colors.primaryDark, fontSize: 9.5, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatEntityNumber(challenge.displayNumber)}</Text>
        </View>
        <Pressable accessibilityLabel="Challenge verwalten" onPress={onManage} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.62 : 1 })}><Symbol name="ellipsis" size={14} color={colors.textMuted} /></Pressable>
      </View>

      <View style={{ gap: 7 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text selectable style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(challenge.savedAmount)}</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10 }}>von {formatMoney(challenge.targetAmount)}</Text>
        </View>
        <ProgressBar value={percentage} color={challenge.color} height={6} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text selectable style={{ flex: 1, color: colors.textMuted, fontSize: 10 }}>{challenge.completedSteps} / {challenge.totalSteps} Schritte</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10 }}>Noch {formatMoney(remaining)}</Text>
        </View>
      </View>

      <View style={{ borderRadius: 13, backgroundColor: colors.primarySoft, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}><Symbol name="arrow.right" size={12} color={colors.primaryDark} /></View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text selectable style={{ color: colors.textMuted, fontSize: 8.5, fontWeight: '800' }}>ALS NÄCHSTES</Text>
          <Text selectable style={{ color: colors.text, fontSize: 11.5, fontWeight: '900' }}>{nextChallengeStep(challenge, cells)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={onContinue} style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
          <Symbol name="checkmark" size={13} color="#FFFFFF" />
          <Text selectable style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '900' }}>Schritt sparen</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/reminders', params: { kind: 'challenge', id: challenge.id } })} style={({ pressed }) => ({ minWidth: 104, minHeight: 48, borderRadius: 14, backgroundColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}>
          <Symbol name="bell" size={13} color={colors.textMuted} />
          <Text selectable style={{ color: colors.text, fontSize: 10.5, fontWeight: '800' }}>Erinnern</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function TemplateRow({ template, active, onStart }: { template: ChallengeTemplate; active: boolean; onStart: () => void }) {
  return (
    <View style={{ minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${template.color}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name={template.icon} size={16} color={template.color} /></View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{template.title}</Text>
        <Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 9.5 }}>{formatMoney(template.targetAmount)} · {template.difficulty}</Text>
      </View>
      <Pressable disabled={active} onPress={onStart} style={({ pressed }) => ({ minWidth: 70, minHeight: 38, paddingHorizontal: 9, borderRadius: 11, backgroundColor: active ? colors.surfaceMuted : colors.primarySoft, alignItems: 'center', justifyContent: 'center', opacity: active ? 0.55 : pressed ? 0.7 : 1 })}>
        <Text selectable style={{ color: active ? colors.textMuted : colors.primaryDark, fontSize: 10, fontWeight: '900' }}>{active ? 'Aktiv' : 'Starten'}</Text>
      </Pressable>
    </View>
  );
}

export default function ChallengesScreen() {
  const store = useAppStore();
  const active = store.challenges.filter((challenge) => !challenge.completedAt);
  const completed = store.challenges.filter((challenge) => Boolean(challenge.completedAt));

  const continueChallenge = async (challenge: Challenge) => {
    try {
      const cells = store.challengeCells[challenge.id] ?? [];
      const nextCell = cells.find((cell) => !cell.completed);
      if (nextCell) {
        await store.completeChallengeCell(challenge.id, nextCell.index);
        return;
      }
      const randomAmount = challenge.mode === 'random' ? [1, 2, 3, 5, 7, 10][Math.floor(Math.random() * 6)] : undefined;
      await store.completeChallengeStep(challenge.id, randomAmount);
    } catch (error) {
      Alert.alert('Challenge', error instanceof Error ? error.message : 'Der Schritt konnte nicht gespeichert werden.');
    }
  };

  const start = async (template: ChallengeTemplate) => {
    try {
      await store.startTemplate(template);
    } catch (error) {
      Alert.alert('Challenge', error instanceof Error ? error.message : 'Die Challenge konnte nicht gestartet werden.');
    }
  };

  const manage = (challenge: Challenge) => {
    Alert.alert(`${formatEntityNumber(challenge.displayNumber)} · ${challenge.title}`, 'Was möchtest du tun?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Erinnerung', onPress: () => router.push({ pathname: '/reminders', params: { kind: 'challenge', id: challenge.id } }) },
      { text: 'Challenge löschen', style: 'destructive', onPress: () => void store.deleteChallenge(challenge.id) },
    ]);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 104, gap: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable style={{ color: colors.text, fontSize: 23, fontWeight: '900', letterSpacing: -0.5 }}>Challenges</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Ein kleiner Schritt nach dem anderen.</Text>
        </View>
        <Pressable onPress={() => router.push('/add-challenge')} style={({ pressed }) => ({ minHeight: 42, paddingHorizontal: 12, borderRadius: 13, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.76 : 1 })}>
          <Symbol name="plus" size={13} color="#FFFFFF" />
          <Text selectable style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>Eigene</Text>
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 14.5, fontWeight: '900' }}>Aktiv</Text><Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Du brauchst nur den nächsten Schritt.</Text></View>
        {active.length ? (
          <View style={{ gap: 9 }}>{active.map((challenge, index) => <ActiveChallengeCard key={challenge.id} challenge={challenge} cells={store.challengeCells[challenge.id] ?? []} index={index} onContinue={() => void continueChallenge(challenge)} onManage={() => manage(challenge)} />)}</View>
        ) : (
          <Animated.View entering={FadeInDown.duration(190)} style={{ borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 15, gap: 4 }}>
            <Text selectable style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>Keine Challenge aktiv</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>Starte unten eine Vorlage. SparPilot zeigt dir danach den nächsten Schritt.</Text>
          </Animated.View>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ gap: 2 }}><Text selectable style={{ color: colors.text, fontSize: 14.5, fontWeight: '900' }}>Neue Challenge</Text><Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Eine Vorlage reicht zum Start.</Text></View>
        <View style={{ borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
          {challengeTemplates.map((template, index) => {
            const isActive = active.some((challenge) => challenge.templateId === template.id);
            return <View key={template.id}>{index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 48 }} /> : null}<TemplateRow template={template} active={isActive} onStart={() => void start(template)} /></View>;
          })}
        </View>
      </View>

      {completed.length ? (
        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.text, fontSize: 14.5, fontWeight: '900' }}>Geschafft</Text>
          <View style={{ borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
            {completed.slice(0, 6).map((challenge, index) => (
              <View key={challenge.id}>
                {index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 46 }} /> : null}
                <View style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${colors.success}18`, alignItems: 'center', justifyContent: 'center' }}><Symbol name="checkmark" size={14} color={colors.success} /></View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 11.5, fontWeight: '800' }}>{challenge.title}</Text><Text selectable style={{ color: colors.textMuted, fontSize: 9 }}>{formatEntityNumber(challenge.displayNumber)}</Text></View>
                  <Text selectable style={{ color: colors.success, fontSize: 10.5, fontWeight: '800' }}>{formatMoney(challenge.targetAmount)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
