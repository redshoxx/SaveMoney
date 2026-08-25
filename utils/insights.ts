import type { Achievement, Challenge, Contribution, Goal, NoSpendDay } from '@/types/models';

export function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function sumSince(contributions: Contribution[], from: Date, to = new Date()) {
  const start = from.getTime();
  const end = to.getTime();
  return contributions.reduce((sum, item) => {
    const time = new Date(item.createdAt).getTime();
    return time >= start && time <= end ? sum + item.amount : sum;
  }, 0);
}

export function calculateStreak(contributions: Contribution[]) {
  if (contributions.length === 0) return 0;
  const uniqueDays = Array.from(new Set(contributions.map((item) => localDayKey(new Date(item.createdAt))))).sort().reverse();
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const latest = new Date(`${uniqueDays[0]}T00:00:00`);
  if (latest.getTime() < yesterday.getTime()) return 0;

  let streak = 1;
  let cursor = latest;
  for (let index = 1; index < uniqueDays.length; index += 1) {
    const expected = new Date(cursor);
    expected.setDate(cursor.getDate() - 1);
    const candidate = new Date(`${uniqueDays[index]}T00:00:00`);
    if (candidate.getTime() !== expected.getTime()) break;
    streak += 1;
    cursor = candidate;
  }
  return streak;
}

export function levelInfo(totalXp: number) {
  const level = Math.floor(totalXp / 250) + 1;
  const xpInLevel = totalXp % 250;
  const names = ['Starter', 'Anfänger', 'Geldretter', 'Sparfuchs', 'Sparprofi', 'Money Master', 'Finanzheld', 'Sparlegende'];
  return {
    level,
    xpInLevel,
    xpTarget: 250,
    name: names[Math.min(names.length - 1, level - 1)] ?? 'Sparlegende',
  };
}

export function getPeriodMetrics(contributions: Contribution[]) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfDay(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(weekStart.getDate() - 7);
  const previousWeekEnd = new Date(weekStart.getTime() - 1);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(monthStart.getTime() - 1);

  return {
    today: sumSince(contributions, todayStart, now),
    week: sumSince(contributions, weekStart, now),
    previousWeek: sumSince(contributions, previousWeekStart, previousWeekEnd),
    month: sumSince(contributions, monthStart, now),
    previousMonth: sumSince(contributions, previousMonthStart, previousMonthEnd),
  };
}

export function weeklyBuckets(contributions: Contribution[]) {
  const now = new Date();
  const weekStart = startOfDay(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  return labels.map((label, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    return { label, value: sumSince(contributions, day, new Date(next.getTime() - 1)) };
  });
}

export function monthlyBuckets(contributions: Contribution[], count = 6) {
  const now = new Date();
  return Array.from({ length: count }, (_, reverseIndex) => {
    const offset = count - 1 - reverseIndex;
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
    const label = start.toLocaleDateString('de-AT', { month: 'short' }).replace('.', '');
    return { label, value: sumSince(contributions, start, new Date(end.getTime() - 1)) };
  });
}

export function forecastGoal(goal: Goal | undefined, contributions: Contribution[]) {
  if (!goal || goal.mode !== 'target' || goal.savedAmount >= goal.targetAmount) return null;
  const thirtyDaysAgo = startOfDay(new Date());
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const savedLast30 = sumSince(contributions, thirtyDaysAgo);
  const dailyAverage = savedLast30 / 30;
  if (dailyAverage <= 0.01) return null;
  const remaining = goal.targetAmount - goal.savedAmount;
  const days = Math.max(1, Math.ceil(remaining / dailyAverage));
  const date = new Date();
  date.setDate(date.getDate() + days);
  return { days, date, dailyAverage };
}

export function buildAchievements(input: {
  totalSaved: number;
  streak: number;
  goals: Goal[];
  challenges: Challenge[];
  noSpendDays: NoSpendDay[];
}) : Achievement[] {
  const completedGoals = input.goals.filter((goal) => goal.mode === 'target' && goal.savedAmount >= goal.targetAmount).length;
  const completedChallenges = input.challenges.filter((challenge) => Boolean(challenge.completedAt)).length;
  const thresholds = [
    { id: 'first10', title: 'Erste 10 €', subtitle: 'Die ersten 10 € sind geschafft.', icon: 'sparkles', value: 10 },
    { id: 'saved100', title: '100 € gespart', subtitle: 'Der erste dreistellige Meilenstein.', icon: 'banknote.fill', value: 100 },
    { id: 'saved500', title: '500 € gespart', subtitle: 'Ein halber Tausender ist geschafft.', icon: 'eurosign.circle.fill', value: 500 },
    { id: 'saved1000', title: '1.000 € gespart', subtitle: 'Vierstellig gespart.', icon: 'building.columns.fill', value: 1000 },
  ].map((item) => ({ ...item, unlocked: input.totalSaved >= item.value, progress: Math.min(1, input.totalSaved / item.value) }));

  return [
    ...thresholds,
    { id: 'streak7', title: '7 Tage Serie', subtitle: 'Eine ganze Woche konsequent gespart.', icon: 'flame.fill', unlocked: input.streak >= 7, progress: Math.min(1, input.streak / 7) },
    { id: 'streak30', title: '30 Tage Serie', subtitle: 'Ein kompletter Monat Sparroutine.', icon: 'bolt.fill', unlocked: input.streak >= 30, progress: Math.min(1, input.streak / 30) },
    { id: 'goal1', title: 'Ziel erreicht', subtitle: 'Das erste Sparziel vollständig geschafft.', icon: 'target', unlocked: completedGoals >= 1, progress: Math.min(1, completedGoals) },
    { id: 'challenge5', title: 'Challenge-Profi', subtitle: 'Fünf Challenges abgeschlossen.', icon: 'trophy.fill', unlocked: completedChallenges >= 5, progress: Math.min(1, completedChallenges / 5) },
    { id: 'nospend10', title: '10 No-Spend-Days', subtitle: 'Zehn Tage ohne unnötige Ausgaben.', icon: 'hand.thumbsup.fill', unlocked: input.noSpendDays.length >= 10, progress: Math.min(1, input.noSpendDays.length / 10) },
  ];
}

export function percentChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
