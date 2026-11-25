import {
  DqrUser,
  Territory,
  UserWeeklySummary,
  UserWeeklyTracker,
} from '../types';
import { countUserTerritories, parseQuestionsCount } from './rivalHelpers';

export function getMondayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekStartIso(date: Date = new Date()): string {
  return toLocalIsoDate(getMondayOfWeek(date));
}

export function formatWeekRangeLabel(weekStartIso: string): string {
  const [y, m, d] = weekStartIso.split('-').map(Number);
  if (!y || !m || !d) return weekStartIso;
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

export function isEndOfWeek(date: Date = new Date()): boolean {
  // Sunday marks the end of the Mon–Sun cycle
  return date.getDay() === 0;
}

export function createFreshWeeklySummary(
  user: DqrUser,
  territories: Territory[],
  weekStartIso: string = getWeekStartIso(new Date())
): UserWeeklySummary {
  const q = parseQuestionsCount(user.reportCard?.totalQuestionsStudied);
  const terr = countUserTerritories(user.id, territories);
  return {
    weekStartIso,
    weekLabel: formatWeekRangeLabel(weekStartIso),
    xpEarned: 0,
    startQuestions: q,
    currentQuestions: q,
    startStreak: user.streak,
    currentStreak: user.streak,
    startTerritories: terr,
    territoriesAcquired: 0,
    currentTerritories: terr,
    dismissedEndOfWeek: false,
  };
}

export function createInitialWeeklyTracker(
  user: DqrUser,
  territories: Territory[],
  now: Date = new Date()
): UserWeeklyTracker {
  return {
    activeWeek: createFreshWeeklySummary(user, territories, getWeekStartIso(now)),
    completedWeeks: [],
  };
}
