import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Card, EmptyState, Pill, ProgressBar, SectionHeading, Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';
import { challengeTemplates, useAppStore } from '@/store/app-store';
import { formatMoney, progress } from '@/utils/money';

export default function ChallengesScreen() {
  const store = useAppStore();
  const active = store.challenges.filter((challenge) => !challenge.completedAt);
  const completed = store.challenges.filter((challenge) => Boolean(challenge.completedAt));

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 22 }}>
      <Pressable
        onPress={() => router.push('/add-challenge')}
        style={({ pressed }) => ({
          minHeight: 54,
          borderRadius: 18,
          backgroundColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Symbol name="wand.and.stars" size={17} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>Eigene Challenge erstellen</Text>
      </Pressable>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Aktiv" />
        {active.length === 0 ? (
          <EmptyState icon="flag.fill" title="Keine aktive Challenge" body="Wähle unten eine Vorlage oder erstelle deine eigene." />
        ) : (
          <View style={{ gap: 14 }}>
            {active.map((challenge) => (
              <Card key={challenge.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 17,
                      backgroundColor: `${challenge.color}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Symbol name={challenge.icon} size={23} color={challenge.color} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{challenge.title}</Text>
                    <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
                      {challenge.completedSteps} von {challenge.totalSteps} Schritten
                    </Text>
                  </View>
                  <Pill background={`${challenge.color}18`} color={challenge.color}>
                    {Math.round(progress(challenge.savedAmount, challenge.targetAmount) * 100)}%
                  </Pill>
                </View>

                <Text selectable style={{ color: colors.textMuted, lineHeight: 20 }}>{challenge.subtitle}</Text>
                <ProgressBar value={progress(challenge.savedAmount, challenge.targetAmount)} color={challenge.color} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text selectable style={{ color: colors.text, fontWeight: '900' }}>{formatMoney(challenge.savedAmount)}</Text>
                  <Text selectable style={{ color: colors.textMuted }}>Ziel {formatMoney(challenge.targetAmount)}</Text>
                </View>

                <Pressable
                  onPress={() => void store.completeChallengeStep(challenge.id)}
                  style={({ pressed }) => ({
                    minHeight: 50,
                    borderRadius: 16,
                    backgroundColor: challenge.color,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.78 : 1,
                  })}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>
                    Schritt erledigt · +{formatMoney(challenge.stepAmount)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    Alert.alert('Challenge löschen?', 'Der Fortschritt und die zugehörigen Einzahlungen werden entfernt.', [
                      { text: 'Abbrechen', style: 'cancel' },
                      { text: 'Löschen', style: 'destructive', onPress: () => void store.deleteChallenge(challenge.id) },
                    ])
                  }
                  style={{ alignSelf: 'flex-start', paddingVertical: 3 }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>Challenge löschen</Text>
                </Pressable>
              </Card>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Vorlagen" />
        <Text selectable style={{ color: colors.textMuted, lineHeight: 20 }}>
          Fertige Challenges mit kleinen, überschaubaren Schritten. Du kannst mehrere gleichzeitig starten.
        </Text>
        <View style={{ gap: 12 }}>
          {challengeTemplates.map((template) => {
            const running = active.some((challenge) => challenge.templateId === template.id);
            return (
              <Card key={template.id} style={{ boxShadow: 'none' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 16,
                      backgroundColor: `${template.color}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Symbol name={template.icon} size={21} color={template.color} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>{template.title}</Text>
                    <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>
                      {template.totalSteps} × {formatMoney(template.stepAmount)}
                    </Text>
                  </View>
                  <Pill>{template.difficulty}</Pill>
                </View>
                <Text selectable style={{ color: colors.textMuted, lineHeight: 20 }}>{template.subtitle}</Text>
                <Pressable
                  disabled={running}
                  onPress={() => void store.startTemplate(template)}
                  style={({ pressed }) => ({
                    minHeight: 46,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: running ? colors.surfaceMuted : `${template.color}18`,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Text style={{ color: running ? colors.textMuted : template.color, fontWeight: '900' }}>
                    {running ? 'Läuft bereits' : `Starten · ${formatMoney(template.targetAmount)}`}
                  </Text>
                </Pressable>
              </Card>
            );
          })}
        </View>
      </View>

      {completed.length ? (
        <View style={{ gap: 12 }}>
          <SectionHeading title={`Geschafft · ${completed.length}`} />
          {completed.slice(0, 5).map((challenge) => (
            <Card key={challenge.id} style={{ boxShadow: 'none' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Symbol name="checkmark.seal.fill" size={24} color={colors.primary} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text selectable style={{ color: colors.text, fontWeight: '900' }}>{challenge.title}</Text>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 13 }}>{formatMoney(challenge.savedAmount)} geschafft</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
