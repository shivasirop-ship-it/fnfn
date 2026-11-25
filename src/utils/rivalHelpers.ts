import { DqrUser, RankDef, RivalStatsSnapshot, Territory } from '../types';

export function parseQuestionsCount(value?: string | null): number {
  if (!value) return 0;
  const digits = String(value).replace(/[^\d]/g, '');
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatRivalDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRivalTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function countUserTerritories(
  userId: string,
  territories: Territory[]
): number {
  return territories.filter((t) => t.currentHolderUserId === userId).length;
}

export function buildUserSnapshot(
  user: DqrUser,
  territories: Territory[],
  xpEarned: number
): RivalStatsSnapshot {
  return {
    territories: countUserTerritories(user.id, territories),
    xpEarned,
    streak: user.streak,
    questions: parseQuestionsCount(user.reportCard?.totalQuestionsStudied),
    rankId: user.rankId,
  };
}

export function resolveRank(ranks: RankDef[], rankId: string): RankDef | undefined {
  return ranks.find((r) => r.id === rankId);
}

export interface ComparisonNumbers {
  territories: number;
  xpEarned: number;
  streak: number;
  questions: number;
}

export function getOverallEncouragement(
  mine: ComparisonNumbers,
  theirs: ComparisonNumbers,
  rivalUsername: string
): string {
  let myLeads = 0;
  let theirLeads = 0;
  let ties = 0;

  const pairs: [number, number][] = [
    [mine.territories, theirs.territories],
    [mine.xpEarned, theirs.xpEarned],
    [mine.streak, theirs.streak],
    [mine.questions, theirs.questions],
  ];

  for (const [a, b] of pairs) {
    if (a > b) myLeads++;
    else if (b > a) theirLeads++;
    else ties++;
  }

  if (
    mine.territories === 0 &&
    theirs.territories === 0 &&
    mine.xpEarned === 0 &&
    theirs.xpEarned === 0
  ) {
    return `Rivalry active with @${rivalUsername}. Both rivals are starting fresh on XP earned — every challenge and quiz session moves the needle.`;
  }

  if (ties === 4 || (myLeads === theirLeads && myLeads > 0)) {
    return `Neck and neck with @${rivalUsername}. Both rivals are making steady progress across the board.`;
  }

  if (theirLeads > myLeads) {
    return `You're closing the gap against @${rivalUsername}. Consistent daily sessions will swing the momentum fast.`;
  }

  return `Great momentum alongside @${rivalUsername}. Both rivals are pushing each other forward every day.`;
}
