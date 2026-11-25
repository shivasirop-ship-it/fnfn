import {
  DqrUser,
  QuizRecord,
  RankDef,
  Territory,
} from '../types';

export interface YearlyUserRecord {
  year: number;
  startRankId: string;
  startLevel: number;
  fallsCount: number;
  comebacksCount: number;
  lastStreak: number;
  lastRankId: string;
  pendingComeback: boolean;
}

export interface YearEndLetterData {
  year: number;
  fullName: string;
  quizzesPlayed: number;
  startRankName: string;
  endRankName: string;
  rankChanged: boolean;
  startLevel: number;
  endLevel: number;
  territoriesWon: number;
  fallsCount: number;
  comebacksCount: number;
  streakDays: number;
}

export function getLocalDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isDecember31(date: Date = new Date()): boolean {
  return date.getMonth() === 11 && date.getDate() === 31;
}

export interface TimeOfDayGreeting {
  greeting: string;
  emoji: string;
  timeLabel: string;
  message: string;
}

export function buildTimeOfDayGreeting(
  user: DqrUser,
  date: Date = new Date()
): TimeOfDayGreeting {
  const firstName = user.fullName.trim().split(/\s+/)[0] || user.username;
  const hour = date.getHours();

  let greeting = 'Good morning';
  let emoji = '☀️';
  let timeLabel = 'Morning Check-In';

  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning';
    emoji = '☀️';
    timeLabel = 'Morning Check-In';
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
    emoji = '🌤️';
    timeLabel = 'Afternoon Check-In';
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Good evening';
    emoji = '🌆';
    timeLabel = 'Evening Check-In';
  } else {
    greeting = 'Good night';
    emoji = '🌙';
    timeLabel = 'Night Watch';
  }

  return {
    greeting,
    emoji,
    timeLabel,
    message: `${greeting}, ${firstName}. The territories await.`,
  };
}

function userMatchesPlayerName(user: DqrUser, playerName: string): boolean {
  const p = playerName.trim().toLowerCase();
  if (!p) return false;
  const full = user.fullName.trim().toLowerCase();
  const uname = user.username.trim().toLowerCase();
  const first = full.split(/\s+/)[0] || '';
  return p === full || p === uname || (first.length >= 3 && p === first);
}

export function buildYearEndLetterData(
  user: DqrUser,
  quizzes: QuizRecord[],
  territories: Territory[],
  ranks: RankDef[],
  bsYears: string[],
  yearlyRecords: Record<string, YearlyUserRecord>,
  now: Date = new Date()
): YearEndLetterData {
  const year = now.getFullYear();
  const startOfYearMs = new Date(year, 0, 1).getTime();
  const record = yearlyRecords[`${year}:${user.id}`];

  // Determine active BS season year (highest numeric BS year available)
  const sortedBs = [...bsYears].sort((a, b) => Number(b) - Number(a));
  const latestBsYear = sortedBs[0] || '';

  const quizzesPlayed = quizzes.filter((q) => {
    if (!q.players.some((p) => userMatchesPlayerName(user, p))) return false;
    if (latestBsYear && q.yearBS === latestBsYear) return true;
    return q.createdAt >= startOfYearMs && !q.yearBS;
  }).length;

  const currentRank =
    ranks.find((r) => r.id === user.rankId) || ranks[ranks.length - 1];
  const startRank =
    (record && ranks.find((r) => r.id === record.startRankId)) || currentRank;

  // Territories won this year (history captures this year + current holdings not yet in history)
  const wonTerritoryIds = new Set<string>();
  let territoryCaptureCount = 0;
  let territoryDefeatCount = 0;
  let hasCaptureAfterDefeat = false;

  for (const t of territories) {
    let userHadCaptureInThisTerritory = false;
    let userWasDefeatedInThisTerritory = false;

    for (const h of t.history) {
      const inCurrentYear =
        !h.submittedAt || h.submittedAt >= startOfYearMs;
      if (h.holderUserId === user.id && inCurrentYear) {
        territoryCaptureCount += 1;
        wonTerritoryIds.add(t.id);
        userHadCaptureInThisTerritory = true;
        if (h.result === 'Defeated') {
          territoryDefeatCount += 1;
          userWasDefeatedInThisTerritory = true;
        }
      }
    }

    if (
      t.currentHolderUserId === user.id &&
      !userHadCaptureInThisTerritory
    ) {
      territoryCaptureCount += 1;
      wonTerritoryIds.add(t.id);
    }

    if (userWasDefeatedInThisTerritory && t.currentHolderUserId === user.id) {
      hasCaptureAfterDefeat = true;
    }
  }

  const territoriesWon = Math.max(territoryCaptureCount, wonTerritoryIds.size);
  const trackedFalls = record?.fallsCount ?? 0;
  const fallsCount = Math.max(trackedFalls, territoryDefeatCount);
  const trackedComebacks = record?.comebacksCount ?? 0;
  const comebacksCount = Math.max(
    trackedComebacks,
    hasCaptureAfterDefeat ? Math.min(fallsCount, territoryDefeatCount) : 0
  );

  return {
    year,
    fullName: user.fullName,
    quizzesPlayed,
    startRankName: startRank?.name || currentRank?.name || 'Grade 4',
    endRankName: currentRank?.name || 'Grade 4',
    rankChanged: Boolean(startRank && currentRank && startRank.id !== currentRank.id),
    startLevel: record?.startLevel ?? user.level,
    endLevel: user.level,
    territoriesWon,
    fallsCount,
    comebacksCount,
    streakDays: user.streak,
  };
}
