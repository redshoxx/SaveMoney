import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { IconBubble } from '@/components/savings-ui';
import { EmptyState, Pill, ProgressBar, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { challengeTemplates, useAppStore } from '@/store/app-store';
import type { Challenge, ChallengeCell, ChallengeTemplate } from '@/types/models';
import { formatMoney, progress } from '@/utils/money';

type ViewMode = 'active' | 'templates' | 'completed';

function cellAmount(amount: number) {
  if (Number.isInteger(amount)) return String(amount);
  return amount.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ChallengeGrid({
  challenge,
  cells,
  onComplete,
  onUndo,
}: {
  challenge: Challenge;
  cells: ChallengeCell[];
  onComplete: (index: number) => void;
  onUndo: (index: number) => void;
}) {
  const columns = cells[0]?.gridColumns ?? 5;
  const width = `${Math.max(10, 100 / columns - 2)}%` as `${number}%`;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
      {cells.map((cell) => {
        const circle = cell.shape === 'circle';
        return (
          <Pressable
            key={cell.id}
            accessibilityLabel={`${cellAmount(cell.amount)} Euro ${cell.completed ? 'erledigt' : 'sparen'}`}
            onPress={() => cell.completed ? null : onComplete(cell.index)}
            onLongPress={() => cell.completed ? onUndo(cell.index) : null}
            style={({ pressed }) => ({
              width,
              aspectRatio: 1,
              minHeight: 42,
              borderRadius: circle ? 999 : 13,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: cell.completed ? challenge.color : `${challenge.color}18`,
              borderWidth: 1,
              borderColor: cell.completed ? challenge.color : `${challenge.color}38`,
              opacity: pressed ? 0.72 : 1,
            })}>
            {cell.completed ? (
              <Symbol name="checkmark" size={15} color="#FFFFFF" />
            ) : (
              <Text style={{ color: challenge.color, fontSize: cell.amount < 1 ? 10 : 12, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{cellAmount(cell.amount)}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function TemplatePreview({ template }: { template: ChallengeTemplate }) {
  const values = template.cellValues?.slice(0, 15) ?? [];
  if (!values.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {values.map((amount, index) => (
        <View
          key={`${template.id}-${index}`}
          style={{
            width: '17%',
            aspectRatio: 1,
            borderRadius: template.cellShape === 'circle' ? 999 : 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${template.color}18`,
          }}>
          <Text style={{ color: template.color, fontSize: 8.5, fontWeight: '900' }}>{cellAmount(amount)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ChallengesScreen() {
  const store = useAppStore();
  const active = store.challenges.filter((challenge) => !challenge.completedAt);
  const completed = store.challenges.filter((challenge) => Boolean(challenge.completedAt));
  const [view, setView] = useState<ViewMode>(active.length ? 'active' : 'templates');

  const completeStep = async (challengeId: string, random: boolean) => {
    try {
      const amount = random ? [1, 2, 3, 5, 7, 10][Math.floor(Math.random() * 6)] : undefined;
      await store.completeChallengeStep(challengeId, amount);
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Challenge konnte nicht aktualisiert werden.');
    }
  };

  const completeCell = async (challengeId: string, index: number) => {
    try { await store.completeChallengeCell(challengeId, index); }
    catch (error) { Alert.alert('SparFlow', error instanceof Error ? error.message : 'Feld konnte nicht gespeichert werden.'); }
  };

  const undoCell = (challengeId: string, index: number, amount: number) => {
    Alert.alert('Feld zurücksetzen?', `${formatMoney(amount)} werden aus dem Challenge-Fortschritt wieder entfernt.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Zurücksetzen', style: 'destructive', onPress: () => void store.undoChallengeCell(challengeId, index) },
    ]);
  };

  const start = async (template: ChallengeTemplate) => {
    try {
      await store.startTemplate(template);
      setView('active');
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Challenge konnte nicht gestartet werden.');
    }
  };

  const remove = (challenge: Challenge) => {
    Alert.alert('Challenge löschen?', 'Fortschritt und zugehörige Einzahlungen werden entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteChallenge(challenge.id) },
    ]);
  };

  const tabs: { value: ViewMode; label: string; count?: number }[] = [
    { value: 'active', label: 'Aktiv', count: active.length },
    { value: 'templates', label: 'Vorlagen' },
    { value: 'completed', label: 'Fertig', count: completed.length },
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 15, paddingBottom: 110, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text selectable style={{ color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.7 }}>Challenges</Text>
          <Text selectable style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>Felder antippen, Betrag sparen und Fortschritt direkt sehen.</Text>
        </View>
        <Pressable onPress={() => router.push('/add-challenge')} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 })}>
          <Symbol name="plus" size={19} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: colors.surfaceMuted }}>
        {tabs.map((tab) => {
          const selected = view === tab.value;
          return (
            <Pressable key={tab.value} onPress={() => setView(tab.value)} style={({ pressed }) => ({ flex: 1, minHeight: 39, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.surface : 'transparent', opacity: pressed ? 0.72 : 1 })}>
              <Text style={{ color: selected ? colors.text : colors.textMuted, fontSize: 12, fontWeight: '900' }}>{tab.label}{tab.count ? ` ${tab.count}` : ''}</Text>
            </Pressable>
          );
        })}
      </View>

      {view === 'active' ? (
        active.length === 0 ? (
          <EmptyState icon="flag.fill" title="Noch keine Challenge aktiv" body="Unter Vorlagen findest du klassische 5-€-, Kleingeld- und weitere Spar-Challenges." />
        ) : (
          <View style={{ gap: 12 }}>
            {active.map((challenge) => {
              const cells = store.challengeCells[challenge.id] ?? [];
              const percentage = progress(challenge.savedAmount, challenge.targetAmount);
              return (
                <View key={challenge.id} style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 15, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <IconBubble icon={challenge.icon} color={challenge.color} background={`${challenge.color}18`} size={44} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>{challenge.title}</Text>
                      <Text selectable style={{ color: colors.textMuted, fontSize: 11.5 }}>{challenge.completedSteps} / {challenge.totalSteps} Felder · {formatMoney(challenge.savedAmount)} von {formatMoney(challenge.targetAmount)}</Text>
                    </View>
                    <Pill background={`${challenge.color}18`} color={challenge.color}>{Math.round(percentage * 100)}%</Pill>
                  </View>

                  <ProgressBar value={percentage} color={challenge.color} height={7} />

                  {cells.length ? (
                    <>
                      <ChallengeGrid
                        challenge={challenge}
                        cells={cells}
                        onComplete={(index) => void completeCell(challenge.id, index)}
                        onUndo={(index) => {
                          const cell = cells.find((item) => item.index === index);
                          if (cell) undoCell(challenge.id, index, cell.amount);
                        }}
                      />
                      <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Tippen = sparen · erledigtes Feld lange drücken = zurücksetzen</Text>
                    </>
                  ) : (
                    <Pressable onPress={() => void completeStep(challenge.id, challenge.mode === 'random')} style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, backgroundColor: challenge.color, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.78 : 1 })}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>{challenge.mode === 'random' ? 'Zufallsbetrag auslosen & sparen' : challenge.mode === 'action' ? `Aktion geschafft · +${formatMoney(challenge.stepAmount)}` : `Schritt erledigt · +${formatMoney(challenge.stepAmount)}`}</Text>
                    </Pressable>
                  )}

                  <Pressable onPress={() => remove(challenge)} style={{ alignSelf: 'flex-end', paddingVertical: 2, paddingHorizontal: 4 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '800' }}>Löschen</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )
      ) : null}

      {view === 'templates' ? (
        <View style={{ gap: 12 }}>
          <Pressable onPress={() => router.push('/add-challenge')} style={({ pressed }) => ({ minHeight: 52, borderRadius: 16, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.75 : 1 })}>
            <Symbol name="wand.and.stars" size={16} color={colors.primaryDark} />
            <Text style={{ color: colors.primaryDark, fontSize: 14, fontWeight: '900' }}>Eigene Challenge bauen</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 9 }}>
            {challengeTemplates.map((template) => {
              const isActive = active.some((challenge) => challenge.templateId === template.id);
              return (
                <Pressable
                  key={template.id}
                  disabled={isActive}
                  onPress={() => void start(template)}
                  style={({ pressed }) => ({
                    width: '48.5%',
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    padding: 13,
                    gap: 9,
                    opacity: isActive ? 0.55 : pressed ? 0.72 : 1,
                  })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 }}>
                    <IconBubble icon={template.icon} color={template.color} background={`${template.color}18`} size={36} />
                    <Text style={{ color: template.color, fontSize: 10, fontWeight: '900' }}>{template.difficulty}</Text>
                  </View>
                  <View style={{ gap: 3 }}>
                    <Text selectable numberOfLines={2} style={{ color: colors.text, fontSize: 14.5, fontWeight: '900' }}>{template.title}</Text>
                    <Text selectable numberOfLines={3} style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 14.5 }}>{template.subtitle}</Text>
                  </View>
                  <TemplatePreview template={template} />
                  <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
                    <Text style={{ color: template.color, fontSize: 12, fontWeight: '900' }}>{formatMoney(template.targetAmount)}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 10 }}>{template.totalSteps} Felder</Text>
                  </View>
                  <Text style={{ color: isActive ? colors.textMuted : template.color, fontSize: 11, fontWeight: '900' }}>{isActive ? 'Läuft bereits' : 'Starten'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {view === 'completed' ? (
        completed.length === 0 ? (
          <EmptyState icon="trophy.fill" title="Noch nichts abgeschlossen" body="Fertige Challenges bleiben hier als Erfolg sichtbar." />
        ) : (
          <View style={{ gap: 9 }}>
            {completed.map((challenge) => (
              <View key={challenge.id} style={{ minHeight: 66, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <IconBubble icon="checkmark.seal.fill" color={challenge.color} background={`${challenge.color}18`} size={38} />
                <View style={{ flex: 1, gap: 2 }}><Text style={{ color: colors.text, fontWeight: '900' }}>{challenge.title}</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>{formatMoney(challenge.targetAmount)} geschafft</Text></View>
                <Symbol name="trophy.fill" size={17} color={challenge.color} />
              </View>
            ))}
          </View>
        )
      ) : null}
    </ScrollView>
  );
}
