import { useMemo } from 'react';
import {
  Award,
  Calendar,
  Castle,
  Compass,
  Flame,
  Shield,
  Swords,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import {
  DqrUser,
  DuelMatch,
  QuizRecord,
  RankDef,
  Territory,
} from '../types';
import { YearlyUserRecord } from '../utils/yearEndHelpers';

interface SeasonPassportSectionProps {
  currentUser: DqrUser;
  ranks: RankDef[];
  quizzes: QuizRecord[];
  territories: Territory[];
  bsYears: string[];
  duelMatches: DuelMatch[];
  yearlyRecords: Record<string, YearlyUserRecord>;
}

function userMatchesPlayer(user: DqrUser, playerName: string): boolean {
  const p = playerName.trim().toLowerCase();
  if (!p) return false;
  const full = user.fullName.trim().toLowerCase();
  const uname = user.username.trim().toLowerCase();
  const first = full.split(/\s+/)[0] || '';
  return p === full || p === uname || (first.length >= 3 && p === first);
}

export function SeasonPassportSection({
  currentUser,
  ranks,
  quizzes,
  territories,
  bsYears,
  duelMatches,
  yearlyRecords,
}: SeasonPassportSectionProps) {
  const currentRank =
    ranks.find((r) => r.id === currentUser.rankId) || ranks[ranks.length - 1];

  const stats = useMemo(() => {
    const myQuizzes = quizzes.filter((q) =>
      q.players.some((p) => userMatchesPlayer(currentUser, p))
    );
    const firstPlaces = myQuizzes.filter((q) => q.position === '1st').length;
    const podiums = myQuizzes.filter((q) =>
      ['1st', '2nd', '3rd'].includes(q.position)
    ).length;

    const myTerritoriesNow = territories.filter(
      (t) => t.currentHolderUserId === currentUser.id
    );
    let totalCaptures = 0;
    let totalDefeats = 0;
    for (const t of territories) {
      for (const h of t.history) {
        if (h.holderUserId === currentUser.id) {
          totalCaptures += 1;
          if (h.result === 'Defeated') totalDefeats += 1;
        }
      }
    }

    const myDuels = duelMatches.filter(
      (m) =>
        m.status === 'completed' &&
        (m.challengerId === currentUser.id || m.opponentId === currentUser.id)
    );
    const duelWins = myDuels.filter((m) => m.winnerId === currentUser.id).length;
    const duelDraws = myDuels.filter((m) => m.winnerId === 'draw').length;
    const duelLosses = myDuels.length - duelWins - duelDraws;
    const duelWinRate =
      myDuels.length > 0 ? Math.round((duelWins / myDuels.length) * 100) : 0;

    // Year-by-year B.S. breakdown
    const yearSet = new Set<string>(bsYears);
    for (const q of myQuizzes) {
      if (q.yearBS) yearSet.add(q.yearBS);
    }
    const orderedYears = Array.from(yearSet).sort(
      (a, b) => Number(b) - Number(a)
    );

    const seasonTimeline = orderedYears.map((yr) => {
      const yrQuizzes = myQuizzes.filter((q) => q.yearBS === yr);
      const wins = yrQuizzes.filter((q) => q.position === '1st').length;
      const top3 = yrQuizzes.filter((q) =>
        ['1st', '2nd', '3rd'].includes(q.position)
      ).length;
      const avgRating =
        yrQuizzes.length > 0
          ? (
              yrQuizzes.reduce(
                (acc, q) =>
                  acc +
                  (q.playerRatings?.[currentUser.fullName] ?? q.rating ?? 0),
                0
              ) / yrQuizzes.length
            ).toFixed(1)
          : '—';
      return {
        yearBS: yr,
        played: yrQuizzes.length,
        wins,
        top3,
        avgRating,
      };
    });

    const currentYear = new Date().getFullYear();
    const annualRec = yearlyRecords[`${currentYear}:${currentUser.id}`];
    const startRank =
      (annualRec && ranks.find((r) => r.id === annualRec.startRankId)) ||
      currentRank;

    return {
      totalQuizzes: myQuizzes.length,
      firstPlaces,
      podiums,
      heldTerritoriesCount: myTerritoriesNow.length,
      totalCaptures,
      totalDefeats,
      duelTotal: myDuels.length,
      duelWins,
      duelDraws,
      duelLosses,
      duelWinRate,
      seasonTimeline,
      startRankName: startRank?.name || currentRank?.name || 'Grade 4',
      startLevel: annualRec?.startLevel ?? currentUser.level,
      falls: annualRec?.fallsCount ?? totalDefeats,
      comebacks: annualRec?.comebacksCount ?? 0,
    };
  }, [
    bsYears,
    currentRank,
    currentUser,
    duelMatches,
    quizzes,
    ranks,
    territories,
    yearlyRecords,
  ]);

  return (
    <div className="space-y-7">
      {/* Passport Cover Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/35 bg-gradient-to-br from-[#181028] via-[#110c1c] to-[#1a130b] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.22em] text-[#d4af37] uppercase">
              Member Dossier · Season Passport
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
              {currentUser.fullName}&apos;s Growth Timeline
            </h2>
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-[#cfc5e3] sm:text-sm">
              Every quiz played, territory conquered, and 1v1 duel fought across
              your B.S. seasons—recorded in one permanent chronicle.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#d4af37]/35 bg-black/35 px-5 py-4 shrink-0">
            <span
              style={{ color: currentRank?.color || '#d4af37' }}
              className="text-3xl"
            >
              {currentRank?.emblem || '✦'}
            </span>
            <div>
              <p className="font-mono text-[10px] tracking-wider text-[#c4b5fd] uppercase">
                Current Standing
              </p>
              <p className="font-display text-lg font-bold text-[#fde68a]">
                {currentRank?.name}
              </p>
              <p className="font-mono text-[11px] text-white/75 tabular-nums">
                Level {currentUser.level} · {currentUser.xp.toLocaleString()} XP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Career Overview Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#8b5cf6]/30 bg-[#120b20] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-wider text-[#c4b5fd] uppercase">
              Quizzes Played
            </span>
            <Trophy className="h-4 w-4 text-[#d4af37]" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-white tabular-nums">
            {stats.totalQuizzes}
          </p>
          <p className="mt-1 font-mono text-xs text-neutral-400 tabular-nums">
            {stats.firstPlaces} Gold · {stats.podiums} Podiums
          </p>
        </div>

        <div className="rounded-2xl border border-[#8b5cf6]/30 bg-[#120b20] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-wider text-[#c4b5fd] uppercase">
              Territories Won
            </span>
            <Castle className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-white tabular-nums">
            {stats.totalCaptures}
          </p>
          <p className="mt-1 font-mono text-xs text-neutral-400 tabular-nums">
            {stats.heldTerritoriesCount} Currently Held
          </p>
        </div>

        <div className="rounded-2xl border border-[#8b5cf6]/30 bg-[#120b20] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-wider text-[#c4b5fd] uppercase">
              1v1 Duel Record
            </span>
            <Swords className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-white tabular-nums">
            {stats.duelWins}–{stats.duelLosses}
            {stats.duelDraws > 0 ? `–${stats.duelDraws}` : ''}
          </p>
          <p className="mt-1 font-mono text-xs text-neutral-400 tabular-nums">
            {stats.duelTotal} Duels · {stats.duelWinRate}% Win Rate
          </p>
        </div>

        <div className="rounded-2xl border border-[#8b5cf6]/30 bg-[#120b20] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-wider text-[#c4b5fd] uppercase">
              Streak &amp; Resilience
            </span>
            <Flame className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-amber-200 tabular-nums">
            {currentUser.streak}d
          </p>
          <p className="mt-1 font-mono text-xs text-neutral-400 tabular-nums">
            {stats.falls} Falls · {stats.comebacks} Comebacks
          </p>
        </div>
      </div>

      {/* Rank Journey & Annual Progress */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-[#8b5cf6]/30 bg-[#120b20] p-6 lg:col-span-5">
          <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-[#d4af37] uppercase">
            <TrendingUp className="h-4 w-4" />
            <span>Annual Progression</span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
                Rank Trajectory
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-neutral-300">
                  {stats.startRankName}
                </span>
                <span className="font-mono text-xs text-[#d4af37]">→</span>
                <span className="font-bold text-[#fde68a]">
                  {currentRank?.name}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
                Level Growth This Year
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 font-mono text-sm tabular-nums">
                <span className="text-neutral-300">Lv. {stats.startLevel}</span>
                <span className="text-xs text-[#d4af37]">→</span>
                <span className="font-bold text-emerald-300">
                  Lv. {currentUser.level}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
                Club Credentials
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3 font-mono text-xs tabular-nums">
                <div>
                  <span className="text-neutral-400">Achievements</span>
                  <p className="mt-0.5 font-bold text-white">
                    {currentUser.achievementIds.length} Unlocked
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400">Prestige Titles</span>
                  <p className="mt-0.5 font-bold text-white">
                    {currentUser.ownedTitleIds.length} Owned
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* B.S. Season Timeline */}
        <div className="rounded-3xl border border-[#8b5cf6]/30 bg-[#120b20] p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-[#d4af37] uppercase">
              <Calendar className="h-4 w-4" />
              <span>B.S. Season History</span>
            </div>
            <span className="font-mono text-[11px] text-neutral-400">
              {stats.seasonTimeline.length} Seasons Tracked
            </span>
          </div>

          {stats.seasonTimeline.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-black/25 p-10 text-center">
              <Compass className="mx-auto h-7 w-7 text-[#d4af37]/60" />
              <p className="mt-2 font-display text-base font-semibold text-white">
                No Season Quizzes Recorded Yet
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Your B.S. season milestones will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {stats.seasonTimeline.map((row) => (
                <div
                  key={row.yearBS}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#1c132d] font-mono text-xs font-bold text-[#fde68a] tabular-nums">
                      {row.yearBS}
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-white">
                        {row.yearBS} B.S. Season
                      </p>
                      <p className="font-mono text-[11px] text-neutral-400 tabular-nums">
                        {row.played} {row.played === 1 ? 'Quiz' : 'Quizzes'} Played
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 font-mono text-xs tabular-nums">
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500 uppercase">
                        1st Wins
                      </p>
                      <p className="font-bold text-[#fde68a]">{row.wins}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500 uppercase">
                        Podiums
                      </p>
                      <p className="font-bold text-emerald-300">{row.top3}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500 uppercase">
                        Avg Rating
                      </p>
                      <p className="font-bold text-sky-300">{row.avgRating}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Member Since Footer */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 font-mono text-[11px] text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[#8b5cf6]" />
              Member since {currentUser.createdAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-[#d4af37]" />
              Focus: {currentUser.favouriteTopic || 'General Knowledge'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
