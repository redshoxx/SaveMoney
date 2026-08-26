import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { GlowIcon, NeonCard, NeonProgress, ProfileButton, ScreenHeader } from '@/components/neon-ui';
import { EmptyState, Symbol } from '@/components/ui';
import { accents, colors } from '@/constants/theme';
import { challengeTemplates, useAppStore } from '@/store/app-store';
import type { Challenge, ChallengeCell, ChallengeTemplate } from '@/types/models';
import { formatMoney, progress } from '@/utils/money';

type ViewMode = 'active' | 'templates' | 'completed';

function cellAmount(amount: number) {
  if (Number.isInteger(amount)) return String(amount);
  return amount.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ChallengeGrid({ challenge, cells, accent, onComplete, onUndo }: { challenge: Challenge; cells: ChallengeCell[]; accent: string; onComplete: (index: number) => void; onUndo: (index: number) => void }) {
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
              minHeight: 40,
              borderRadius: circle ? 999 : 13,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: cell.completed ? accent : `${accent}12`,
              borderWidth: 1,
              borderColor: cell.completed ? accent : `${accent}55`,
              opacity: pressed ? 0.7 : 1,
              boxShadow: cell.completed ? `0 0 15px ${accent}` : undefined,
            })}
          >
            {cell.completed ? <Symbol name="checkmark" size={15} color="#FFFFFF" /> : <Text style={{ color: accent, fontSize: cell.amount < 1 ? 9.5 : 11.5, fontWeight: '900' }}>{cellAmount(cell.amount)}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

function TemplatePreview({ template, accent }: { template: ChallengeTemplate; accent: string }) {
  const values = template.cellValues?.slice(0, 12) ?? [];
  if (!values.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {values.map((amount, index) => (
        <View key={`${template.id}-${index}`} style={{ width: '18%', aspectRatio: 1, borderRadius: template.cellShape === 'circle' ? 999 : 8, alignItems: 'center', justifyContent: 'center', backgroundColor: `${accent}12`, borderWidth: 1, borderColor: `${accent}35` }}>
          <Text style={{ color: accent, fontSize: 8.5, fontWeight: '900' }}>{cellAmount(amount)}</Text>
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
    } catch (error) { Alert.alert('SparFlow', error instanceof Error ? error.message : 'Challenge konnte nicht aktualisiert werden.'); }
  };

  const completeCell = async (challengeId: string, index: number) => {
    try { await store.completeChallengeCell(challengeId, index); }
    catch (error) { Alert.alert('SparFlow', error instanceof Error ? error.message : 'Feld konnte nicht gespeichert werden.'); }
  };

  const undoCell = (challengeId: string, index: number, amount: number) => {
    Alert.alert('Feld zurücksetzen?', `${formatMoney(amount)} werden wieder entfernt.`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Zurücksetzen', style: 'destructive', onPress: () => void store.undoChallengeCell(challengeId, index) },
    ]);
  };

  const start = async (template: ChallengeTemplate) => {
    try { await store.startTemplate(template); setView('active'); }
    catch (error) { Alert.alert('SparFlow', error instanceof Error ? error.message : 'Challenge konnte nicht gestartet werden.'); }
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
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 14, paddingBottom: 108, gap: 15 }}>
      <ScreenHeader title="Deine Challenges" subtitle="Sparen soll sich nach Fortschritt anfühlen – nicht nach Verwaltung." right={<ProfileButton />} />

      <View style={{ flexDirection: 'row', padding: 4, borderRadius: 15, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border }}>
        {tabs.map((tab) => {
          const selected = view === tab.value;
          return (
            <Pressable key={tab.value} onPress={() => setView(tab.value)} style={({ pressed }) => ({ flex: 1, minHeight: 39, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.primarySoft : 'transparent', borderWidth: selected ? 1 : 0, borderColor: `${colors.primary}70`, opacity: pressed ? 0.72 : 1, boxShadow: selected ? `0 0 14px ${colors.glow}` : undefined })}>
              <Text style={{ color: selected ? colors.primaryDark : colors.textMuted, fontSize: 11.5, fontWeight: '900' }}>{tab.label}{tab.count ? ` ${tab.count}` : ''}</Text>
            </Pressable>
          );
        })}
      </View>

      {view === 'active' ? (
        active.length === 0 ? <EmptyState icon="trophy.fill" title="Noch keine Challenge aktiv" body="Starte eine Vorlage oder baue deine eigene Challenge." /> : (
          <View style={{ gap: 12 }}>
            {active.map((challenge, challengeIndex) => {
              const cells = store.challengeCells[challenge.id] ?? [];
              const percentage = progress(challenge.savedAmount, challenge.targetAmount);
              const accent = accents[challengeIndex % accents.length] ?? colors.primary;
              return (
                <NeonCard key={challenge.id} accent={accent} glow={percentage >= 0.5} style={{ padding: 14, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <GlowIcon name={challenge.icon} color={accent} size={17} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text selectable numberOfLines={1} style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>{challenge.title}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{challenge.completedSteps} / {challenge.totalSteps} Felder · {formatMoney(challenge.savedAmount)} von {formatMoney(challenge.targetAmount)}</Text>
                    </View>
                    <Text style={{ color: accent, fontSize: 14, fontWeight: '900' }}>{Math.round(percentage * 100)}%</Text>
                  </View>

                  <NeonProgress value={percentage} color={accent} height={6} />

                  {cells.length ? (
                    <>
                      <ChallengeGrid challenge={challenge} cells={cells} accent={accent} onComplete={(index) => void completeCell(challenge.id, index)} onUndo={(index) => {
                        const cell = cells.find((item) => item.index === index);
                        if (cell) undoCell(challenge.id, index, cell.amount);
                      }} />
                      <Text style={{ color: colors.textMuted, fontSize: 10 }}>Tippen = sparen · lange drücken = zurücksetzen</Text>
                    </>
                  ) : (
                    <Pressable onPress={() => void completeStep(challenge.id, challenge.mode === 'random')} style={({ pressed }) => ({ minHeight: 44, borderRadius: 13, backgroundColor: `${accent}25`, borderWidth: 1, borderColor: `${accent}80`, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1, boxShadow: `0 0 16px ${accent}35` })}>
                      <Text style={{ color: accent, fontWeight: '900', fontSize: 12.5 }}>{challenge.mode === 'random' ? 'Zufallsbetrag auslosen & sparen' : challenge.mode === 'action' ? `Aktion geschafft · +${formatMoney(challenge.stepAmount)}` : `Schritt erledigt · +${formatMoney(challenge.stepAmount)}`}</Text>
                    </Pressable>
                  )}

                  <Pressable onPress={() => remove(challenge)} style={{ alignSelf: 'flex-end', paddingVertical: 2 }}><Text style={{ color: colors.textMuted, fontSize: 10.5, fontWeight: '800' }}>Verwalten</Text></Pressable>
                </NeonCard>
              );
            })}
          </View>
        )
      ) : null}

      {view === 'templates' ? (
        <View style={{ gap: 11 }}>
          <Pressable onPress={() => router.push('/add-challenge')} style={({ pressed }) => ({ minHeight: 52, borderRadius: 16, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: `${colors.primary}70`, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 10, opacity: pressed ? 0.75 : 1, boxShadow: `0 0 18px ${colors.glow}` })}>
            <GlowIcon name="wand.and.stars" color={colors.primaryDark} size={15} />
            <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 13.5, fontWeight: '900' }}>Eigene Challenge bauen</Text><Text style={{ color: colors.textMuted, fontSize: 10.5 }}>Felder, Beträge und Raster selbst bestimmen</Text></View>
            <Symbol name="chevron.right" size={10} color={colors.primaryDark} />
          </Pressable>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 9 }}>
            {challengeTemplates.map((template, index) => {
              const isActive = active.some((challenge) => challenge.templateId === template.id);
              const accent = accents[index % accents.length] ?? colors.primary;
              return (
                <Pressable key={template.id} disabled={isActive} onPress={() => void start(template)} style={({ pressed }) => ({ width: '48.5%', opacity: isActive ? 0.5 : pressed ? 0.72 : 1 })}>
                  <NeonCard accent={accent} style={{ padding: 12, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><GlowIcon name={template.icon} color={accent} size={14} /><Text style={{ color: accent, fontSize: 9.5, fontWeight: '900' }}>{template.difficulty}</Text></View>
                    <Text numberOfLines={2} style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{template.title}</Text>
                    <Text numberOfLines={2} style={{ color: colors.textMuted, fontSize: 10, lineHeight: 14 }}>{template.subtitle}</Text>
                    <TemplatePreview template={template} accent={accent} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}><Text style={{ color: accent, fontSize: 11.5, fontWeight: '900' }}>{formatMoney(template.targetAmount)}</Text><Text style={{ color: colors.textMuted, fontSize: 9.5 }}>{template.totalSteps} Felder</Text></View>
                    <Text style={{ color: isActive ? colors.textMuted : accent, fontSize: 10.5, fontWeight: '900' }}>{isActive ? 'Läuft bereits' : 'Starten'}</Text>
                  </NeonCard>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {view === 'completed' ? (
        completed.length === 0 ? <EmptyState icon="trophy.fill" title="Noch nichts abgeschlossen" body="Fertige Challenges bleiben hier als Erfolg sichtbar." /> : (
          <View style={{ gap: 9 }}>
            {completed.map((challenge, index) => {
              const accent = accents[index % accents.length] ?? colors.success;
              return <NeonCard key={challenge.id} accent={accent} glow style={{ padding: 12 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><GlowIcon name="checkmark.seal.fill" color={accent} size={16} /><View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: '900' }}>{challenge.title}</Text><Text style={{ color: colors.textMuted, fontSize: 10.5 }}>{formatMoney(challenge.targetAmount)} geschafft</Text></View><Symbol name="trophy.fill" size={18} color={accent} /></View></NeonCard>;
            })}
          </View>
        )
      ) : null}
    </ScrollView>
  );
}
