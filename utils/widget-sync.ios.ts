import type { AppSnapshot } from '@/types/models';
import { calculateStreak, levelInfo } from '@/utils/insights';
import SparFlowWidget from '@/widgets/sparflow-widget';

export function syncSavingsWidget(snapshot: AppSnapshot) {
  const totalSaved = snapshot.contributions.reduce((sum, item) => sum + item.amount, 0);
  const primaryGoal = snapshot.goals.find((goal) => goal.savedAmount < goal.targetAmount) ?? snapshot.goals[0];
  const streak = calculateStreak(snapshot.contributions);
  const level = levelInfo(Math.floor(totalSaved));

  const goalTarget = primaryGoal?.targetAmount ?? 0;
  const goalSaved = primaryGoal?.savedAmount ?? 0;
  const progress = goalTarget > 0 ? Math.max(0, Math.min(1, goalSaved / goalTarget)) : 0;

  SparFlowWidget.updateSnapshot({
    totalSaved,
    goalTitle: primaryGoal?.title ?? 'Neues Sparziel',
    goalSaved,
    goalTarget,
    progress,
    streak,
    level: level.level,
  });
  SparFlowWidget.reload();
}
