export type GoalMode = 'target' | 'recurring';

export type Goal = {
  id: string;
  displayNumber: number;
  title: string;
  mode: GoalMode;
  targetAmount: number;
  savedAmount: number;
  recurringAmount: number | null;
  recurringDay: number | null;
  icon: string;
  color: string;
  targetDate: string | null;
  createdAt: string;
};

export type ChallengeMode = 'fixed' | 'daily' | 'weekly' | 'action' | 'random';
export type ChallengeCellShape = 'rounded' | 'circle';

export type Challenge = {
  id: string;
  displayNumber: number;
  templateId: string | null;
  title: string;
  subtitle: string;
  targetAmount: number;
  savedAmount: number;
  stepAmount: number;
  totalSteps: number;
  completedSteps: number;
  mode: ChallengeMode;
  durationDays: number | null;
  icon: string;
  color: string;
  createdAt: string;
  completedAt: string | null;
};

export type ChallengeCell = {
  id: string;
  challengeId: string;
  index: number;
  amount: number;
  completed: boolean;
  completedAt: string | null;
  contributionId: string | null;
  gridColumns: number;
  shape: ChallengeCellShape;
};

export type Contribution = {
  id: string;
  sourceType: 'goal' | 'challenge';
  sourceId: string;
  amount: number;
  note: string | null;
  createdAt: string;
};

export type ChallengeTemplate = {
  id: string;
  title: string;
  subtitle: string;
  category: 'Einfach' | 'Verzicht' | 'Gamification' | 'Zufall';
  targetAmount: number;
  stepAmount: number;
  totalSteps: number;
  mode: ChallengeMode;
  durationDays?: number;
  icon: string;
  color: string;
  difficulty: 'Leicht' | 'Mittel' | 'Intensiv';
  cellValues?: number[];
  gridColumns?: number;
  cellShape?: ChallengeCellShape;
};

export type SavingAction = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  icon: string;
  color: string;
};

export type SavingRuleFrequency = 'daily' | 'weekly' | 'monthly';

export type SavingRule = {
  id: string;
  title: string;
  goalId: string;
  amount: number;
  frequency: SavingRuleFrequency;
  weekday: number | null;
  dayOfMonth: number | null;
  enabled: boolean;
  lastAppliedAt: string | null;
  createdAt: string;
};

export type NoSpendDay = {
  id: string;
  date: string;
  savedAmount: number;
  createdAt: string;
};

export type Achievement = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  unlocked: boolean;
  progress: number;
};

export type AppSnapshot = {
  goals: Goal[];
  challenges: Challenge[];
  contributions: Contribution[];
  savingRules: SavingRule[];
  noSpendDays: NoSpendDay[];
};
