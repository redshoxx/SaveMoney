import type { Contribution, Goal } from '@/types/models';

const DAY_MS = 86_400_000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundUsefulAmount(value: number) {
  if (value <= 2) return Math.ceil(value * 2) / 2;
  if (value <= 20) return Math.ceil(value);
  if (value <= 100) return Math.ceil(value / 5) * 5;
  return Math.ceil(value / 10) * 10;
}

function positiveGoalContributions(contributions: Contribution[], goalId: string) {
  return contributions.filter((item) => item.sourceType === 'goal' && item.sourceId === goalId && item.amount > 0);
}

function currentMonthSaved(contributions: Contribution[], goalId: string, now: Date) {
  return Math.max(0, contributions.reduce((sum, item) => {
    if (item.sourceType !== 'goal' || item.sourceId !== goalId) return sum;
    const date = new Date(item.createdAt);
    if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) return sum;
    return sum + item.amount;
  }, 0));
}

function activeDaysLast14(items: Contribution[], now: Date) {
  const cutoff = now.getTime() - 13 * DAY_MS;
  return new Set(
    items
      .filter((item) => new Date(item.createdAt).getTime() >= cutoff)
      .map((item) => new Date(item.createdAt).toISOString().slice(0, 10)),
  ).size;
}

function recentDailyAverage(items: Contribution[], now: Date) {
  const cutoff = now.getTime() - 29 * DAY_MS;
  const amount = items.reduce((sum, item) => new Date(item.createdAt).getTime() >= cutoff ? sum + item.amount : sum, 0);
  return amount / 30;
}

function averageAction(items: Contribution[]) {
  if (!items.length) return 0;
  const recent = items.slice(0, 12);
  return recent.reduce((sum, item) => sum + item.amount, 0) / recent.length;
}

export type SavingCoach = {
  suggestedAmount: number;
  savedForPeriod: number;
  targetForPeriod: number;
  remaining: number;
  progress: number;
  momentum: number;
  nextMilestonePercent: number;
  nextMilestoneAmount: number;
  message: string;
  paceLabel: string;
};

export function buildSavingCoach(goal: Goal, contributions: Contribution[], streak: number, now = new Date()): SavingCoach {
  const positives = positiveGoalContributions(contributions, goal.id);
  const monthSaved = currentMonthSaved(contributions, goal.id, now);
  const recurring = goal.mode === 'recurring';
  const targetForPeriod = recurring ? (goal.recurringAmount ?? goal.targetAmount) : goal.targetAmount;
  const savedForPeriod = recurring ? monthSaved : goal.savedAmount;
  const remaining = Math.max(0, targetForPeriod - savedForPeriod);
  const progress = targetForPeriod > 0 ? clamp(savedForPeriod / targetForPeriod, 0, 1) : 0;

  const recentDaily = recentDailyAverage(positives, now);
  const typicalAction = averageAction(positives);
  const activeDays = activeDaysLast14(positives, now);
  const consistency = activeDays / 14;

  let requiredDaily = 0;
  let paceLabel = 'Flexibel';

  if (remaining > 0 && recurring) {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = Math.max(1, endOfMonth.getDate() - now.getDate() + 1);
    requiredDaily = remaining / daysLeft;
    paceLabel = `${daysLeft} Tage im Monat übrig`;
  } else if (remaining > 0 && goal.targetDate) {
    const deadline = new Date(goal.targetDate);
    const daysLeft = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / DAY_MS));
    requiredDaily = remaining / daysLeft;
    paceLabel = deadline.getTime() < now.getTime() ? 'Zieltermin überschritten' : `${daysLeft} Tage bis zum Ziel`;
  }

  const fallback = Math.min(remaining, Math.max(2, targetForPeriod * 0.02));
  const blended = requiredDaily > 0
    ? Math.max(requiredDaily, recentDaily * 0.7, typicalAction * 0.35)
    : Math.max(recentDaily * 2.2, typicalAction * 0.65, fallback);
  const suggestedAmount = remaining <= 0 ? 0 : Math.min(remaining, Math.max(0.5, roundUsefulAmount(blended)));

  const paceScore = requiredDaily <= 0 ? Math.min(1, recentDaily / Math.max(1, targetForPeriod / 90)) : Math.min(1, recentDaily / requiredDaily);
  const momentum = Math.round(clamp((progress * 0.5 + consistency * 0.3 + paceScore * 0.2) * 100, 0, 100));

  const nextMilestonePercent = progress >= 1 ? 100 : Math.min(100, Math.max(10, (Math.floor(progress * 10) + 1) * 10));
  const nextMilestoneTarget = targetForPeriod * (nextMilestonePercent / 100);
  const nextMilestoneAmount = Math.max(0, nextMilestoneTarget - savedForPeriod);

  let message = 'Ein kleiner Schritt heute hält dein Ziel in Bewegung.';
  if (remaining <= 0) message = recurring ? 'Monatsziel geschafft. Dein Puffer ist aufgebaut.' : 'Ziel erreicht. Du kannst den nächsten Sparbereich starten.';
  else if (streak >= 7) message = `Starke Routine: ${streak} Tage Serie. Halte den Rhythmus mit einem überschaubaren Schritt.`;
  else if (requiredDaily > 0 && recentDaily + 0.01 < requiredDaily) message = 'Du liegst etwas unter dem nötigen Tempo. Der Vorschlag bringt dich wieder näher an den Plan.';
  else if (momentum >= 70) message = 'Du bist gut im Takt. Der heutige Vorschlag hält dein Momentum stabil.';

  return {
    suggestedAmount,
    savedForPeriod,
    targetForPeriod,
    remaining,
    progress,
    momentum,
    nextMilestonePercent,
    nextMilestoneAmount,
    message,
    paceLabel,
  };
}
