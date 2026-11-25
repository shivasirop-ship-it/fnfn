import { Territory } from '../types';

export interface DethroneAlert {
  eventId: string;
  territoryId: string;
  territoryCode: string;
  territoryName: string;
  dethronedBy: string;
  newScore: number;
  totalQuestions: number;
  dateLabel: string;
}

export interface FastestTerritoryRecord {
  holderName: string;
  completionSeconds: number;
  score: number;
  totalQuestions: number;
  dateLabel: string;
}

export function formatDurationCompact(sec: number): string {
  const safe = Math.max(0, Math.round(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function computeUserDethroneAlerts(
  userId: string,
  territories: Territory[],
  dismissedIds: string[]
): DethroneAlert[] {
  const alerts: DethroneAlert[] = [];
  for (const ter of territories) {
    if (ter.currentHolderUserId === userId) continue;
    const latest = ter.history[0];
    if (!latest || latest.result !== 'Current') continue;
    const wasPreviousHolder = ter.history
      .slice(1)
      .some((h) => h.holderUserId === userId);
    if (!wasPreviousHolder) continue;

    const eventId = `${userId}::${ter.id}::${latest.id}`;
    if (dismissedIds.includes(eventId)) continue;

    alerts.push({
      eventId,
      territoryId: ter.id,
      territoryCode: ter.code,
      territoryName: ter.name,
      dethronedBy: latest.holderName || ter.currentHolderName || 'A challenger',
      newScore: latest.score,
      totalQuestions: latest.totalQuestions,
      dateLabel: latest.dateLabel,
    });
  }
  return alerts;
}

export function getFastestTerritoryRecord(
  territory: Territory
): FastestTerritoryRecord | null {
  const timed = territory.history.filter(
    (h) => typeof h.completionSeconds === 'number' && h.completionSeconds > 0
  );
  if (timed.length === 0) return null;

  const best = [...timed].sort((a, b) => {
    const aSec = a.completionSeconds ?? Number.MAX_SAFE_INTEGER;
    const bSec = b.completionSeconds ?? Number.MAX_SAFE_INTEGER;
    if (aSec !== bSec) return aSec - bSec;
    return b.score - a.score;
  })[0];

  if (typeof best.completionSeconds !== 'number') return null;

  return {
    holderName: best.holderName,
    completionSeconds: best.completionSeconds,
    score: best.score,
    totalQuestions: best.totalQuestions,
    dateLabel: best.dateLabel,
  };
}
