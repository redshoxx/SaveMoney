import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { NeonCard, NeonProgress } from '@/components/neon-ui';
import { EmptyState, Symbol } from '@/components/ui';
import { accents, colors } from '@/constants/theme';
import { challengeTemplates, useAppStore } from '@/store/app-store';
import type { Challenge, ChallengeCell, ChallengeTemplate } from '@/types/models';
import { formatMoney, progress } from '@/utils/money';

type ViewMode = 'active' | 'templates' | 'completed';

function cellAmount(amount: number) {
  if (Number.isInteger(amount)) return String(amount);
  return amount.toLocaleString('de-AT', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function ChallengeGrid({ cells, accent, onComplete, onUndo }: { cells: ChallengeCell[]; accent: string; onComplete: (index: number) => void; onUndo: (index: number) => void }) {
  const columns = Math.max(5, Math.min(8, cells[0]?.gridColumns ?? 7));
  const width = `${Math.max(10, 100 / columns - 2)}%` as `${number}%`;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
      {cells.map((cell) => (
        <Pressable
          key={cell.id}
          accessibilityLabel={`${cellAmount(cell.amount)} Euro ${cell.completed ? 'erledigt' : 'sparen'}`}
          onPress={() => cell.completed ? undefined : onComplete(cell.index)}
          onLongPress={() => cell.completed ? onUndo(cell.index) : undefined}
          style={({ pressed }) => ({
            width,
            aspectRatio: 1,
            minHeight: 31,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: cell.completed ? accent : colors.background,
            borderWidth: 1,
            borderColor: cell.completed ? accent : colors.border,
            opacity: pressed ? 0.68 : 1,
          })}
        >
          {cell.completed
            ? <Symbol name="checkmark" size={12} color="#FFFFFF" />
            : <Text style={{ color: colors.textMuted, fontSize: cell.amount >= 100 ? 7.5 : 9.5, fontWeight: '800' }}>{cellAmount(cell.amount)}€</Text>}
        </Pressable>
      ))}
    </View>
  );
}

function TemplatePreview({ template, accent }: { template: ChallengeTemplate; accent: string }) {
  const values = template.cellValues?.slice(0, 10) ?? [];
  if (!values.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
      {values.map((amount, index) => (
        <View key={`${template.id}-${index}`} style={{ width: '16%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: index < 3 ? accent : colors.textMuted, fontSize: 8.5, fontWeight: '800' }}>{cellAmount(amount)}€</Text>
        </View>
      ))}
    </View>
  );
}

function SegmentedTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, minHeight: 36, borderBottomWidth: active ? 2 : 0, borderBottomColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.65 : 1 })}>
      <Text style={{ color: active ? colors.text : colors.textMuted, fontSize: 10.5, fontWeight: active ? '800' : '600' }}>{label}</Text>
    </Pressable>
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
    try {
      await store.completeChallengeCell(challengeId, index);
    } catch (error) {
      Alert.alert('SparFlow', error instanceof Error ? error.message : 'Feld konnte nicht gespeichert werden.');
    }
  };

  const undoCell = (challengeId: string, index: number, amount: number) => {
    Alert.alert('Feld zurücksetzen?', `${formatMoney(amount)} werden wieder entfernt.`, [
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

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 12, paddingBottom: 108, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text selectable style={{ flex: 1, color: colors.text, fontSize: 23, fontWeight: '800', letterSpacing: -0.6 }}>Challenges</Text>
        <Pressable onPress={() => router.push('/add-challenge')} style={({ pressed }) => ({ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.55 : 1 })}>
          <Symbol name="crown.fill" size={17} color="#E5B83D" />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <SegmentedTab label="Aktiv" active={view === 'active'} onPress={() => setView('active')} />
        <SegmentedTab label="Vorlagen" active={view === 'templates'} onPress={() => setView('templates')} />
        <SegmentedTab label="Abgeschlossen" active={view === 'completed'} onPress={() => setView('completed')} />
      </View>

      {view === 'active' ? (
        active.length === 0 ? <EmptyState icon="trophy.fill" title="Noch keine Challenge aktiv" body="Starte eine Vorlage oder erstelle deine eigene Challenge." /> : (
          <View style={{ gap: 12 }}>
            {active.map((challenge, challengeIndex) => {
              const cells = store.challengeCells[challenge.id] ?? [];
              const percentage = progress(challenge.savedAmount, challenge.targetAmount);
              const accent = accents[challengeIndex % accents.length] ?? colors.primary;
              return (
                <NeonCard key={challenge.id} style={{ padding: 14, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 14.5, fontWeight: '800' }}>{challenge.title}</Text>
                      <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 10 }}>{challenge.subtitle}</Text>
                    </View>
                    <Pressable onPress={() => remove(challenge)} hitSlop={8} style={({ pressed }) => ({ width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.55 : 1 })}>
                      <Symbol name="ellipsis" size={13} color={colors.textMuted} />
                    </Pressable>
                  </View>

                  {cells.length ? (
                    <ChallengeGrid
                      cells={cells}
                      accent={accent}
                      onComplete={(index) => void completeCell(challenge.id, index)}
                      onUndo={(index) => {
                        const cell = cells.find((item) => item.index === index);
                        if (cell) undoCell(challenge.id, index, cell.amount);
                      }}
                    />
                  ) : (
                    <Pressable onPress={() => void completeStep(challenge.id, challenge.mode === 'random')} style={({ pressed }) => ({ minHeight: 44, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.72 : 1 })}>
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 11.5 }}>{challenge.mode === 'random' ? 'Zufallsbetrag auslosen & sparen' : `Schritt erledigt · +${formatMoney(challenge.stepAmount)}`}</Text>
                    </Pressable>
                  )}

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{challenge.completedSteps} / {challenge.totalSteps}</Text>
                    <Text selectable style={{ color: colors.text, fontSize: 10.5, fontWeight: '800' }}>{formatMoney(challenge.savedAmount)} / {formatMoney(challenge.targetAmount)}</Text>
                  </View>
                  <NeonProgress value={percentage} color={accent} height={4} />
                </NeonCard>
              );
            })}
          </View>
        )
      ) : null}

      {view === 'templates' ? (
        <View style={{ gap: 10 }}>
          <Pressable onPress={() => router.push('/add-challenge')} style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: pressed ? 0.75 : 1 })}>
            <Symbol name="plus" size={14} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12.5 }}>Eigene Challenge</Text>
          </Pressable>

          {challengeTemplates.map((template, index) => {
            const isActive = active.some((challenge) => challenge.templateId === template.id);
            const accent = accents[index % accents.length] ?? colors.primary;
            return (
              <Pressable key={template.id} disabled={isActive} onPress={() => void start(template)} style={({ pressed }) => ({ opacity: isActive ? 0.45 : pressed ? 0.72 : 1 })}>
                <NeonCard style={{ padding: 13, gap: 9 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
                      <Symbol name={template.icon} size={16} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '800' }}>{template.title}</Text>
                      <Text numberOfLines={2} style={{ color: colors.textMuted, fontSize: 10.5, lineHeight: 14 }}>{template.subtitle}</Text>
                    </View>
                    <Text style={{ color: accent, fontSize: 10.5, fontWeight: '800' }}>{isActive ? 'Aktiv' : formatMoney(template.targetAmount)}</Text>
                  </View>
                  <TemplatePreview template={template} accent={accent} />
                </NeonCard>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {view === 'completed' ? (
        completed.length === 0 ? <EmptyState icon="trophy.fill" title="Noch nichts abgeschlossen" body="Fertige Challenges bleiben hier als Erfolg sichtbar." /> : (
          <View style={{ gap: 9 }}>
            {completed.map((challenge) => (
              <NeonCard key={challenge.id} style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }}><Symbol name="checkmark" size={15} color="#FFFFFF" /></View>
                  <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: '800' }}>{challenge.title}</Text><Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{formatMoney(challenge.targetAmount)} geschafft</Text></View>
                  <Symbol name="trophy.fill" size={16} color="#E5B83D" />
                </View>
              </NeonCard>
            ))}
          </View>
        )
      ) : null}
    </ScrollView>
  );
}
