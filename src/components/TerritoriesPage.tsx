import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  BookOpen,
  Castle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Lock,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { DqrUser, Territory } from '../types';
import {
  DethroneAlert,
  getFastestTerritoryRecord,
} from '../utils/territoryHelpers';

interface TerritoriesPageProps {
  currentUser: DqrUser;
  users: DqrUser[];
  territories: Territory[];
  dethroneAlerts?: DethroneAlert[];
  onDismissDethroneAlert?: (eventId: string) => void;
  onSubmitAttempt: (
    territoryId: string,
    userId: string,
    score: number,
    completionSeconds?: number
  ) => {
    tookOver: boolean;
    message: string;
    submittedAtLabel?: string;
    completionSeconds?: number;
  };
}

function TerritoryIcon({
  territory,
  className = 'h-12 w-12',
}: {
  territory: Territory;
  className?: string;
}) {
  if (territory.customIconUrl) {
    return (
      <img
        src={territory.customIconUrl}
        alt={territory.name}
        className={`${className} rounded-xl object-cover border border-[#d4af37]/40`}
      />
    );
  }
  const Icon =
    territory.iconType === 'observatory'
      ? Sparkles
      : territory.iconType === 'sanctum'
        ? Crown
        : territory.iconType === 'spire'
          ? Flame
          : Castle;
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-[#d4af37]/40 bg-[#1a1409] text-[#f5dc82] ${className}`}
    >
      <Icon className="h-6 w-6" />
    </div>
  );
}

export function TerritoriesPage({
  currentUser,
  users,
  territories,
  dethroneAlerts = [],
  onDismissDethroneAlert,
  onSubmitAttempt,
}: TerritoriesPageProps) {
  const [subTab, setSubTab] = useState<'arena' | 'leaderboard'>('arena');
  const [inspectTerritory, setInspectTerritory] = useState<Territory | null>(
    null
  );

  // Active Quiz Session state
  const [activeQuizTerritory, setActiveQuizTerritory] =
    useState<Territory | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [resultBanner, setResultBanner] = useState<{
    territoryName: string;
    score: number;
    total: number;
    tookOver: boolean;
    message: string;
    submittedAtLabel?: string;
    completionSeconds?: number;
  } | null>(null);
  const [practiceReview, setPracticeReview] = useState<{
    territory: Territory;
    answers: Record<number, number>;
    score: number;
    total: number;
    completionSeconds: number;
  } | null>(null);

  const finishAndSubmitQuiz = (
    ter: Territory,
    currentAnswers: Record<number, number>,
    practice = isPracticeMode
  ) => {
    const total = ter.questions.length;
    let score = 0;
    ter.questions.forEach((q, idx) => {
      if (currentAnswers[idx] === q.correctIndex) score += 1;
    });

    const totalDurationSec = Math.max(60, ter.durationMinutes * 60);
    const completionSeconds = Math.max(1, totalDurationSec - secondsLeft);

    if (practice) {
      setActiveQuizTerritory(null);
      setIsPracticeMode(false);
      setInspectTerritory(null);
      setPracticeReview({
        territory: ter,
        answers: { ...currentAnswers },
        score,
        total,
        completionSeconds,
      });
      return;
    }

    const outcome = onSubmitAttempt(
      ter.id,
      currentUser.id,
      score,
      completionSeconds
    );
    setActiveQuizTerritory(null);
    setIsPracticeMode(false);
    setInspectTerritory(null);
    setResultBanner({
      territoryName: ter.name,
      score,
      total,
      tookOver: outcome.tookOver,
      message: outcome.message,
      submittedAtLabel: outcome.submittedAtLabel,
      completionSeconds: outcome.completionSeconds ?? completionSeconds,
    });
  };

  // Countdown tick while inside quiz
  useEffect(() => {
    if (!activeQuizTerritory) return;
    if (secondsLeft <= 0) {
      finishAndSubmitQuiz(activeQuizTerritory, answers, isPracticeMode);
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [activeQuizTerritory, secondsLeft, isPracticeMode]);

  const startQuiz = (ter: Territory, practice = false) => {
    setInspectTerritory(null);
    setResultBanner(null);
    setPracticeReview(null);
    setIsPracticeMode(practice);
    setQuestionIndex(0);
    setAnswers({});
    setSecondsLeft(Math.max(60, ter.durationMinutes * 60));
    setActiveQuizTerritory(ter);
  };

  // Power Leaderboard: 100 Power per held territory
  const powerLeaderboard = useMemo(() => {
    const counts = new Map<
      string,
      { userId: string; name: string; held: string[]; power: number }
    >();

    for (const u of users) {
      counts.set(u.id, {
        userId: u.id,
        name: u.fullName,
        held: [],
        power: 0,
      });
    }

    for (const ter of territories) {
      if (ter.currentHolderUserId) {
        const entry = counts.get(ter.currentHolderUserId);
        if (entry) {
          entry.held.push(ter.name);
          entry.power += 100;
        } else {
          counts.set(ter.currentHolderUserId, {
            userId: ter.currentHolderUserId,
            name: ter.currentHolderName || 'Unknown',
            held: [ter.name],
            power: 100,
          });
        }
      }
    }

    return Array.from(counts.values()).sort((a, b) => b.power - a.power);
  }, [users, territories]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-[#f4f1ea]">
      {/* Header */}
      <div className="border-b border-[#d4af37]/25 bg-gradient-to-b from-[#130d0b] via-[#0b0e18] to-[#07090f] px-5 pt-10 pb-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs tracking-[0.22em] text-[#d4af37] uppercase">
                King of the Hill · 100 Power Per Territory
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-5xl">
                The Territories
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-neutral-300">
                Challenge 10-question gauntlets to seize control. Only a
                strictly higher score dethrones the reigning holder.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-[#d4af37]/35 bg-[#10121c] p-1.5">
              <button
                type="button"
                onClick={() => setSubTab('arena')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer sm:text-sm ${
                  subTab === 'arena'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#f0cb65] text-[#08080a]'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                Territories ({territories.length})
              </button>
              <button
                type="button"
                onClick={() => setSubTab('leaderboard')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer sm:text-sm ${
                  subTab === 'leaderboard'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#f0cb65] text-[#08080a]'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                Power Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {/* Quiz Outcome Banner */}
        <AnimatePresence>
          {resultBanner && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-8 flex flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${
                resultBanner.tookOver
                  ? 'border-[#d4af37] bg-gradient-to-r from-[#241b08] to-[#111827]'
                  : 'border-white/20 bg-[#111827]'
              }`}
            >
              <div>
                <p className="font-mono text-xs font-bold text-[#f5dc82] uppercase">
                  {resultBanner.tookOver
                    ? 'Territory Captured!'
                    : 'Attempt Recorded'}
                </p>
                <h3 className="mt-1 font-display text-xl font-bold text-white">
                  {resultBanner.territoryName} — Scored {resultBanner.score}/
                  {resultBanner.total}
                </h3>
                <p className="mt-1 text-xs text-neutral-300">
                  {resultBanner.message}
                </p>
                {(resultBanner.submittedAtLabel ||
                  resultBanner.completionSeconds !== undefined) && (
                  <p className="mt-1.5 font-mono text-[11px] text-[#f5dc82]">
                    {resultBanner.submittedAtLabel
                      ? `Submitted: ${resultBanner.submittedAtLabel}`
                      : ''}
                    {resultBanner.submittedAtLabel &&
                    resultBanner.completionSeconds !== undefined
                      ? ' · '
                      : ''}
                    {resultBanner.completionSeconds !== undefined
                      ? `Time Taken: ${formatTime(resultBanner.completionSeconds)}`
                      : ''}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setResultBanner(null)}
                className="self-start rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/75 hover:bg-white/10 cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dethrone Alerts */}
        <AnimatePresence>
          {dethroneAlerts.length > 0 && (
            <div className="mb-7 space-y-3">
              {dethroneAlerts.map((alert) => {
                const matchedTer = territories.find(
                  (t) => t.id === alert.territoryId
                );
                return (
                  <motion.div
                    key={alert.eventId}
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-rose-500/45 bg-gradient-to-r from-[#2c0b16] via-[#1c0f19] to-[#111524] p-4 shadow-[0_12px_36px_rgba(244,63,94,0.16)] sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/15 text-rose-300">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-mono text-[11px] font-bold tracking-wider text-rose-300 uppercase">
                          Territory Dethroned · {alert.territoryCode}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-white">
                          <span className="text-[#fde68a]">
                            {alert.dethronedBy}
                          </span>{' '}
                          captured {alert.territoryName} with{' '}
                          <span className="font-mono text-rose-200">
                            {alert.newScore}/{alert.totalQuestions}
                          </span>{' '}
                          ({alert.dateLabel}).
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {matchedTer && (
                        <button
                          type="button"
                          onClick={() => setInspectTerritory(matchedTer)}
                          className="rounded-xl bg-gradient-to-r from-[#c79a26] to-[#f0cb65] px-3.5 py-2 text-xs font-bold text-[#08080a] cursor-pointer"
                        >
                          Inspect
                        </button>
                      )}
                      {onDismissDethroneAlert && (
                        <button
                          type="button"
                          onClick={() => onDismissDethroneAlert(alert.eventId)}
                          className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/75 hover:bg-white/10 cursor-pointer"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* ================= TERRITORIES GRID ================= */}
        {subTab === 'arena' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {territories.map((ter, idx) => {
              const controlled = Boolean(ter.currentHolderName);
              const attempted = ter.attemptedUserIds.includes(currentUser.id);
              const isHolder = ter.currentHolderUserId === currentUser.id;
              const fastest = getFastestTerritoryRecord(ter);

              return (
                <motion.div
                  key={ter.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(idx * 0.05, 0.25),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  onClick={() => setInspectTerritory(ter)}
                  className={`sheen-hover group relative flex cursor-pointer flex-col justify-between rounded-3xl border p-6 transition-all ${
                    controlled
                      ? 'border-[#d4af37]/45 bg-gradient-to-b from-[#131726] to-[#0a0c14] shadow-[0_18px_45px_rgba(0,0,0,0.5)] hover:border-[#f5dc82] hover:shadow-[0_24px_60px_rgba(212,175,55,0.16)]'
                      : 'border-white/15 bg-gradient-to-b from-[#111622] to-[#090b12] hover:border-[#3988ff]/60 hover:shadow-[0_24px_60px_rgba(57,136,255,0.14)]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`font-mono text-[11px] font-bold tracking-widest uppercase ${
                            controlled ? 'text-[#f5dc82]' : 'text-[#83b9ff]'
                          }`}
                        >
                          {controlled ? 'CONTROLLED' : 'UNCLAIMED'}
                        </span>
                        <p className="font-mono text-xs text-neutral-400">
                          {ter.code}
                        </p>
                      </div>
                      <TerritoryIcon territory={ter} className="h-12 w-12" />
                    </div>

                    <h2 className="mt-4 font-display text-2xl font-bold text-white group-hover:text-[#f8e6a0]">
                      {ter.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-400">
                      {ter.description}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/35 p-3.5 text-xs">
                      <div>
                        <span className="text-[11px] text-neutral-400">
                          Current Holder
                        </span>
                        <p className="mt-0.5 truncate font-semibold text-white">
                          {ter.currentHolderName || 'Unclaimed'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-neutral-400">
                          Highest Score
                        </span>
                        <p className="mt-0.5 font-mono font-bold text-[#fde68a]">
                          {ter.highestScore}/{ter.questions.length}
                        </p>
                      </div>
                      <div className="col-span-2 border-t border-white/10 pt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-neutral-400">
                          Won: {ter.wonOn || '—'}
                        </span>
                        <span className="font-mono text-neutral-300">
                          {ter.history[0]?.completionSeconds !== undefined
                            ? `In ${formatTime(ter.history[0].completionSeconds)}`
                            : `${ter.durationMinutes} min`}
                        </span>
                      </div>
                      {fastest && (
                        <div className="col-span-2 border-t border-white/10 pt-2 flex items-center justify-between gap-2 text-[11px]">
                          <span className="inline-flex items-center gap-1 font-mono text-cyan-300">
                            <Zap className="h-3 w-3" />
                            Speed Record: {formatTime(fastest.completionSeconds)}
                          </span>
                          <span className="truncate text-neutral-300">
                            {fastest.holderName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    {isHolder ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/15 py-2.5 text-xs font-bold text-[#fde68a]">
                        <Shield className="h-4 w-4" />
                        <span>You Hold This Territory</span>
                      </div>
                    ) : attempted ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-medium text-neutral-400">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Attempt Used (Cooldown Active)</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c79a26] to-[#d4af37] py-2.5 text-xs font-bold text-[#08080a] group-hover:from-[#d4af37] group-hover:to-[#fde047]">
                        <Swords className="h-4 w-4" />
                        <span>Challenge Territory</span>
                      </div>
                    )}

                    {(isHolder || attempted) && ter.questions.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startQuiz(ter, true);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/35 bg-indigo-500/15 py-2 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/25 cursor-pointer"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Practice & Review (Unranked)</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ================= POWER LEADERBOARD ================= */}
        {subTab === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-[#d4af37]/35 bg-[#0c0e17] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="font-mono text-xs text-[#d4af37] uppercase">
                  Territorial Domination Rankings
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-white">
                  Power Leaderboard (100 Power / Territory)
                </h2>
              </div>
              <Trophy className="h-7 w-7 text-[#d4af37]" />
            </div>

            <div className="mt-6 space-y-3">
              {powerLeaderboard.map((entry, idx) => (
                <div
                  key={entry.userId}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-[#121625] p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="font-mono text-sm font-bold text-[#d4af37]">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-display text-base font-bold text-white">
                        {entry.name}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {entry.held.length > 0
                          ? `Controls: ${entry.held.join(', ')}`
                          : 'No territories controlled'}
                      </p>
                    </div>
                  </div>
                  <div className="font-mono text-lg font-bold text-[#fde68a]">
                    {entry.power} Power
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ================= TERRITORY DETAIL & HISTORY MODAL ================= */}
      <AnimatePresence>
        {inspectTerritory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInspectTerritory(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#d4af37]/45 bg-[#0e121e] p-6 text-white shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-4">
                  <TerritoryIcon territory={inspectTerritory} />
                  <div>
                    <p className="font-mono text-xs text-[#f5dc82]">
                      {inspectTerritory.code} ·{' '}
                      {inspectTerritory.currentHolderName
                        ? 'CONTROLLED'
                        : 'UNCLAIMED'}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-bold">
                      {inspectTerritory.name}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectTerritory(null)}
                  className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-4 text-sm text-neutral-300">
                {inspectTerritory.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-center sm:grid-cols-4">
                <div>
                  <p className="text-[11px] text-neutral-400">Current Holder</p>
                  <p className="mt-1 font-semibold text-white">
                    {inspectTerritory.currentHolderName || 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400">Highest Score</p>
                  <p className="mt-1 font-mono font-bold text-[#fde68a]">
                    {inspectTerritory.highestScore}/
                    {inspectTerritory.questions.length}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400">Submission Time</p>
                  <p className="mt-1 font-mono text-xs font-semibold text-[#f8e6a0]">
                    {inspectTerritory.wonOn || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400">
                    {inspectTerritory.history[0]?.completionSeconds !== undefined
                      ? 'Time Taken'
                      : 'Quiz Timer'}
                  </p>
                  <p className="mt-1 font-mono font-semibold text-white">
                    {inspectTerritory.history[0]?.completionSeconds !== undefined
                      ? formatTime(inspectTerritory.history[0].completionSeconds)
                      : `${inspectTerritory.durationMinutes} min`}
                  </p>
                </div>
              </div>

              {(() => {
                const fastest = getFastestTerritoryRecord(inspectTerritory);
                if (!fastest) return null;
                return (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-cyan-200">
                      <Zap className="h-4 w-4 text-cyan-300" />
                      Fastest Speed Record: {formatTime(fastest.completionSeconds)}
                    </span>
                    <span className="text-neutral-200">
                      Set by{' '}
                      <strong className="text-white">{fastest.holderName}</strong> (
                      {fastest.score}/{fastest.totalQuestions} · {fastest.dateLabel})
                    </span>
                  </div>
                );
              })()}

              {/* Latest 10 Ownership History */}
              <div className="mt-6">
                <h4 className="font-mono text-xs font-bold tracking-wider text-[#d4af37] uppercase">
                  Ownership History (Latest 10)
                </h4>
                {inspectTerritory.history.length === 0 ? (
                  <p className="mt-2 text-xs text-neutral-400">
                    No challengers have captured this territory yet.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {inspectTerritory.history.slice(0, 10).map((h) => (
                      <div
                        key={h.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#151a2b] px-4 py-2.5 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">
                            {h.holderName}
                          </span>
                          <span className="ml-2 text-neutral-400">
                            · {h.dateLabel}
                          </span>
                          {h.completionSeconds !== undefined && (
                            <span className="ml-2 font-mono text-[11px] text-[#f5dc82]">
                              ({formatTime(h.completionSeconds)})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-[#fde68a]">
                            {h.score}/{h.totalQuestions}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              h.result === 'Current'
                                ? 'bg-[#d4af37]/25 text-[#fde68a]'
                                : 'bg-white/10 text-neutral-400'
                            }`}
                          >
                            {h.result}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
                {inspectTerritory.currentHolderUserId === currentUser.id ? (
                  <>
                    <span className="rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/15 px-4 py-2.5 text-xs font-bold text-[#fde68a]">
                      You currently hold this territory
                    </span>
                    {inspectTerritory.questions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => startQuiz(inspectTerritory, true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-5 py-2.5 text-xs font-bold text-indigo-100 hover:bg-indigo-500/30 cursor-pointer"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Practice & Review (Unranked)</span>
                      </button>
                    )}
                  </>
                ) : inspectTerritory.attemptedUserIds.includes(
                    currentUser.id
                  ) ? (
                  <>
                    <span className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-neutral-400">
                      Attempt already used (ask Admin to reset cooldown)
                    </span>
                    {inspectTerritory.questions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => startQuiz(inspectTerritory, true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-5 py-2.5 text-xs font-bold text-indigo-100 hover:bg-indigo-500/30 cursor-pointer"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Practice & Review (Unranked)</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startQuiz(inspectTerritory, false)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c79a26] to-[#f0cb65] px-6 py-3 text-xs font-bold text-[#08080a] shadow-lg cursor-pointer"
                  >
                    <Swords className="h-4 w-4" />
                    <span>
                      Enter {inspectTerritory.questions.length}-Question Quiz
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= ACTIVE TIMED 10-QUESTION QUIZ RUNNER ================= */}
      <AnimatePresence>
        {activeQuizTerritory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#05070c]/95 p-4 backdrop-blur-md"
          >
            <div className="w-full max-w-2xl rounded-3xl border border-[#d4af37]/50 bg-[#0d111c] p-6 text-white shadow-2xl sm:p-8">
              {/* Top Quiz Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs text-[#d4af37]">
                      {activeQuizTerritory.code} · {activeQuizTerritory.name}
                    </p>
                    {isPracticeMode && (
                      <span className="rounded-md border border-indigo-400/50 bg-indigo-500/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-indigo-200 uppercase">
                        PRACTICE MODE · UNRANKED
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-neutral-400">
                    Question {questionIndex + 1} of{' '}
                    {activeQuizTerritory.questions.length} ·{' '}
                    {isPracticeMode
                      ? 'Official holder, score & cooldown will not change'
                      : `Score to Beat: ${activeQuizTerritory.highestScore}`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 font-mono text-sm font-bold text-amber-300">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(secondsLeft)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      finishAndSubmitQuiz(
                        activeQuizTerritory,
                        answers,
                        isPracticeMode
                      )
                    }
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      isPracticeMode
                        ? 'border-indigo-400/45 bg-indigo-500/20 text-indigo-100 hover:bg-indigo-500/30'
                        : 'border-red-400/40 bg-red-500/15 text-red-200 hover:bg-red-500/25'
                    }`}
                  >
                    {isPracticeMode ? 'Finish & Review' : 'Exit (Auto-Submit)'}
                  </button>
                </div>
              </div>

              {/* Progress Dots */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {activeQuizTerritory.questions.map((q, idx) => {
                  const answered = answers[idx] !== undefined;
                  const active = idx === questionIndex;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuestionIndex(idx)}
                      className={`h-2.5 flex-1 rounded-full transition-all cursor-pointer ${
                        active
                          ? 'bg-[#fde047]'
                          : answered
                            ? 'bg-[#d4af37]/60'
                            : 'bg-white/15'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Current Question */}
              {(() => {
                const q = activeQuizTerritory.questions[questionIndex];
                if (!q) return null;
                return (
                  <div className="mt-6">
                    <h3 className="font-display text-xl font-bold leading-snug text-white sm:text-2xl">
                      {q.question}
                    </h3>

                    <div className="mt-5 space-y-3">
                      {q.options.map((opt, optIdx) => {
                        const selected = answers[questionIndex] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [questionIndex]: optIdx,
                              }))
                            }
                            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all cursor-pointer ${
                              selected
                                ? 'border-[#fde047] bg-[#d4af37]/20 text-white shadow-md'
                                : 'border-white/15 bg-[#13192b] text-neutral-200 hover:border-white/35'
                            }`}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/20 font-mono text-xs font-bold">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Prev / Next / Submit Controls */}
              <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                <button
                  type="button"
                  disabled={questionIndex === 0}
                  onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                {questionIndex < activeQuizTerritory.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setQuestionIndex((i) => i + 1)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#d4af37] px-5 py-2 text-xs font-bold text-[#08080a] cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      finishAndSubmitQuiz(
                        activeQuizTerritory,
                        answers,
                        isPracticeMode
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-xs font-bold shadow-lg cursor-pointer ${
                      isPracticeMode
                        ? 'bg-gradient-to-r from-indigo-400 to-violet-300 text-[#08080a]'
                        : 'bg-gradient-to-r from-[#d4af37] to-[#fde047] text-[#08080a]'
                    }`}
                  >
                    <span>
                      {isPracticeMode
                        ? 'Finish & View Answer Breakdown'
                        : 'Submit Attempt'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= PRACTICE ANSWER REVIEW MODAL ================= */}
      <AnimatePresence>
        {practiceReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPracticeReview(null)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-indigo-400/45 bg-[#0c101d] p-6 text-white shadow-2xl sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="font-mono text-xs font-bold tracking-widest text-indigo-300 uppercase">
                    Unranked Practice · Answer Breakdown
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold text-white">
                    {practiceReview.territory.name} — {practiceReview.score}/
                    {practiceReview.total}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-neutral-300">
                    Accuracy:{' '}
                    {Math.round(
                      (practiceReview.score /
                        Math.max(1, practiceReview.total)) *
                        100
                    )}
                    % · Time Taken: {formatTime(practiceReview.completionSeconds)}{' '}
                    · Unranked (official records unchanged)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPracticeReview(null)}
                  className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {practiceReview.territory.questions.map((q, idx) => {
                  const chosen = practiceReview.answers[idx];
                  const isCorrect = chosen === q.correctIndex;
                  const chosenLabel =
                    chosen !== undefined ? q.options[chosen] : 'No answer selected';
                  const correctLabel = q.options[q.correctIndex];

                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl border p-4 ${
                        isCorrect
                          ? 'border-emerald-500/35 bg-emerald-500/10'
                          : 'border-rose-500/35 bg-rose-500/10'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {isCorrect ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-bold text-white sm:text-base">
                            {idx + 1}. {q.question}
                          </p>
                          <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                            <p
                              className={
                                isCorrect
                                  ? 'text-emerald-200'
                                  : 'text-rose-200'
                              }
                            >
                              Your Answer:{' '}
                              <span className="font-semibold">
                                {chosenLabel}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p className="text-emerald-300">
                                Correct Answer:{' '}
                                <span className="font-semibold">
                                  {correctLabel}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={() => startQuiz(practiceReview.territory, true)}
                  className="rounded-xl border border-indigo-400/45 bg-indigo-500/20 px-4 py-2.5 text-xs font-bold text-indigo-100 hover:bg-indigo-500/30 cursor-pointer"
                >
                  Practice Again
                </button>
                <button
                  type="button"
                  onClick={() => setPracticeReview(null)}
                  className="rounded-xl bg-[#d4af37] px-5 py-2.5 text-xs font-bold text-[#08080a] cursor-pointer"
                >
                  Close Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
