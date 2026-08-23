export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  icon: string;
  color: string;
  createdAt: string;
};

export type Challenge = {
  id: string;
  templateId: string | null;
  title: string;
  subtitle: string;
  targetAmount: number;
  savedAmount: number;
  stepAmount: number;
  totalSteps: number;
  completedSteps: number;
  icon: string;
  color: string;
  createdAt: string;
  completedAt: string | null;
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
  targetAmount: number;
  stepAmount: number;
  totalSteps: number;
  icon: string;
  color: string;
  difficulty: 'Leicht' | 'Mittel' | 'Intensiv';
};

export type AppSnapshot = {
  goals: Goal[];
  challenges: Challenge[];
  contributions: Contribution[];
};
