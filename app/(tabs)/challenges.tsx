import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { NeonProgress } from '@/components/neon-ui';
import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { challengeTemplates, useAppStore } from '@/store/app-store';
import type { Challenge, ChallengeCell, ChallengeTemplate } from '@/types/models';
import { formatMoney, progress } from '@/utils/money';

function nextChallengeStep(challenge: Challenge, cells: ChallengeCell[]) {
  const nextCell = cells.find((cell) => !cell.completed) ?? null;
  if (nextCell) return { label: `${formatMoney(nextCell.amount)} sparen`, amount: nextCell.amount, cellIndex: nextCell.index };
  if (challenge.mode === 'random') return { label: 'Zufallsbetrag sparen', amount: null, cellIndex: null };
  return { label: `${formatMoney(challenge.stepAmount)} sparen`, amount: challenge.stepAmount, cellIndex: null };
}

function ActiveChallengeCard({ challenge, cells, onContinue, onDelete }: { challenge: Challenge; cells: ChallengeCell[]; onContinue: () => void; onDelete: () => void }) {
  const percentage = progress(challenge.savedAmount, challenge.targetAmount);
  const next = nextChallengeStep(challenge, cells);
  const remaining = Math.max(0, challenge.targetAmount - challenge.savedAmount);

  return (
    <View style={{ borderRadius: 19, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: `${challenge.color}18`, alignItems: 'center', justifyContent: 'center' }}>
          <Symbol name={challenge.icon} size={18} color={challenge.color} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{challenge.title}</Text>
          <Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 10.5 }}>{challenge.subtitle || 'Aktive Challenge'}</Text>
        </View>
        <Pressable accessibilityLabel="Erinnerung einstellen" onPress={() => router.push({ pathname: '/reminders', params: { kind: 'challenge', id: challenge.id } })} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 11, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <Symbol name="bell" size={14} color={colors.textMuted} />
        </Pressable>
        <Pressable accessibilityLabel="Challenge verwalten" onPress={onDelete} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.55 : 1 })}>
          <Symbol name="ellipsis" size={14} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={{ gap: 7 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text selectable style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{formatMoney(challenge.savedAmount)}</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>von {formatMoney(challenge.targetAmount)}</Text>
        </View>
        <NeonProgress value={percentage} color={challenge.color} height={6} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text selectable style={{ flex: 1, color: colors.textMuted, fontSize: 10.5 }}>{challenge.completedSteps} von {challenge.totalSteps} Schritten</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Noch {formatMoney(remaining)}</Text>
        </View>
      </View>

      <View style={{ borderRadius: 14, backgroundColor: colors.surfaceMuted, padding: 11, gap: 3 }}>
        <Text selectable style={{ color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>DEIN NÄCHSTER SCHRITT</Text>
        <Text selectable style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>{next.label}</Text>
      </View>

      <Pressable onPress={onContinue} style={({ pressed }) => ({ minHeight: 49, borderRadius: 15, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: pressed ? 0.7 : 1 })}>
        <Symbol name="checkmark" size={13} color="#FFFFFF" />
        <Text selectable style={{ color: '#FFFFFF', fontSize: 12.5, fontWeight: '900' }}>Nächsten Schritt sparen</Text>
      </Pressable>
    </View>
  );
}

function TemplateRow({ template, active, onStart }: { template: ChallengeTemplate; active: boolean; onStart: () => void }) {
  return (
    <View style={{ minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: `${template.color}18`, alignItems: 'center', justifyContent: 'center' }}>
        <Symbol name={template.icon} size={17} color={template.color} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 12.5, fontWeight: '800' }}>{template.title}</Text>
        <Text selectable numberOfLines={1} style={{ color: colors.textMuted, fontSize: 9.5 }}>{formatMoney(template.targetAmount)} Ziel</Text>
      </View>
      <Pressable disabled={active} onPress={onStart} style={({ pressed }) => ({ minWidth: 74, minHeight: 38, paddingHorizontal: 10, borderRadius: 12, backgroundColor: active ? colors.surfaceMuted : colors.primarySoft, alignItems: 'center', justifyContent: 'center', opacity: active ? 0.55 : pressed ? 0.65 : 1 })}>
        <Text selectable style={{ color: active ? colors.textMuted : colors.primaryDark, fontSize: 10.5, fontWeight: '900' }}>{active ? 'Aktiv' : 'Starten'}</Text>
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
      const randomAmount = challenge.mode === 'random'
        ? [1, 2, 3, 5, 7, 10][Math.floor(Math.random() * 6)]
        : undefined;
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
    Alert.alert(challenge.title, 'Was möchtest du tun?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Challenge löschen', style: 'destructive', onPress: () => void store.deleteChallenge(challenge.id) },
    ]);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 12, paddingBottom: 112, gap: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>Challenges</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 11 }}>Ein kleiner Schritt nach dem anderen.</Text>
        </View>
        <Pressable onPress={() => router.push('/add-challenge')} style={({ pressed }) => ({ minHeight: 42, paddingHorizontal: 12, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.65 : 1 })}>
          <Symbol name="plus" size={12} color={colors.text} />
          <Text selectable style={{ color: colors.text, fontSize: 10.5, fontWeight: '800' }}>Eigene</Text>
        </Pressable>
      </View>

      <View style={{ borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.surfaceMuted, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9 }}>
        <Symbol name="lightbulb.fill" size={14} color={colors.warning} />
        <Text selectable style={{ flex: 1, color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>Du musst nicht mehrere Challenges gleichzeitig machen. Eine aktive Challenge reicht völlig.</Text>
      </View>

      <View style={{ gap: 9 }}>
        <View style={{ gap: 2 }}>
          <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>Aktiv</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Tippe nur auf „Nächsten Schritt sparen“.</Text>
        </View>
        {active.length ? (
          <View style={{ gap: 10 }}>
            {active.map((challenge) => (
              <ActiveChallengeCard
                key={challenge.id}
                challenge={challenge}
                cells={store.challengeCells[challenge.id] ?? []}
                onContinue={() => void continueChallenge(challenge)}
                onDelete={() => manage(challenge)}
              />
            ))}
          </View>
        ) : (
          <View style={{ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 5 }}>
            <Text selectable style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Keine Challenge aktiv</Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 15 }}>Wähle unten eine Vorlage. Danach zeigt dir SparFlow immer genau den nächsten Schritt.</Text>
          </View>
        )}
      </View>

      <View style={{ gap: 9 }}>
        <View style={{ gap: 2 }}>
          <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>Neue Challenge starten</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 10.5 }}>Wähle eine, die zu deinem Alltag passt.</Text>
        </View>
        <View style={{ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
          {challengeTemplates.map((template, index) => {
            const isActive = active.some((challenge) => challenge.templateId === template.id);
            return (
              <View key={template.id}>
                {index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 50 }} /> : null}
                <TemplateRow template={template} active={isActive} onStart={() => void start(template)} />
              </View>
            );
          })}
        </View>
      </View>

      {completed.length ? (
        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>Geschafft</Text>
          <View style={{ borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
            {completed.slice(0, 5).map((challenge, index) => (
              <View key={challenge.id}>
                {index ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 46 }} /> : null}
                <View style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${colors.success}18`, alignItems: 'center', justifyContent: 'center' }}>
                    <Symbol name="checkmark" size={14} color={colors.success} />
                  </View>
                  <Text selectable numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 11.5, fontWeight: '800' }}>{challenge.title}</Text>
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
