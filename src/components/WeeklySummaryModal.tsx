import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  CalendarDays,
  Castle,
  Crown,
  Flame,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { DqrUser, RankDef, UserWeeklySummary, UserWeeklyTracker } from '../types';

interface WeeklySummaryModalProps {
  open: boolean;
  currentUser: DqrUser;
  currentRank: RankDef;
  tracker: UserWeeklyTracker;
  initialFocusWeekIso?: string | null;
  onClose: (acknowledgedWeekIso: string) => void;
}

function getWeeklyMessage(summary: UserWeeklySummary): string {
  const questionsDone = Math.max(
    0,
    summary.currentQuestions - summary.startQuestions
  );
  const streakDelta = summary.currentStreak - summary.startStreak;

  if (
    summary.xpEarned > 0 &&
    questionsDone > 0 &&
    summary.territoriesAcquired > 0
  ) {
    return 'Outstanding all-around week — strong XP momentum, steady questions studied, and new territory claimed.';
  }
  if (streakDelta > 0) {
    return `Consistent daily rhythm paid off with +${streakDelta} streak ${
      streakDelta === 1 ? 'day' : 'days'
    } added this week.`;
  }
  if (summary.xpEarned > 0 || questionsDone > 0 || summary.territoriesAcquired > 0) {
    return 'Small daily steps compounded into clear progress this week. Keep building smoothly.';
  }
  return 'A fresh weekly cycle is ready — a few focused minutes each day will set your pace.';
}

export function WeeklySummaryModal({
  open,
  currentUser,
  currentRank,
  tracker,
  initialFocusWeekIso,
  onClose,
}: WeeklySummaryModalProps) {
  const lastCompleted = tracker.completedWeeks[0] || null;
  const [selectedIso, setSelectedIso] = useState<string>(
    initialFocusWeekIso || tracker.activeWeek.weekStartIso
  );

  useEffect(() => {
    if (open) {
      setSelectedIso(initialFocusWeekIso || tracker.activeWeek.weekStartIso);
    }
  }, [open, initialFocusWeekIso, tracker.activeWeek.weekStartIso]);

  const summary: UserWeeklySummary =
    lastCompleted && selectedIso === lastCompleted.weekStartIso
      ? lastCompleted
      : tracker.activeWeek;

  const isCompletedView =
    lastCompleted !== null && summary.weekStartIso === lastCompleted.weekStartIso;

  const questionsCompleted = Math.max(
    0,
    summary.currentQuestions - summary.startQuestions
  );
  const streakDelta = summary.currentStreak - summary.startStreak;
  const streakDisplay =
    streakDelta > 0
      ? `+${streakDelta} ${streakDelta === 1 ? 'day' : 'days'}`
      : streakDelta < 0
        ? `${streakDelta} ${Math.abs(streakDelta) === 1 ? 'day' : 'days'}`
        : `Steady · ${summary.currentStreak}d`;

  const firstName = currentUser.fullName.split(' ')[0] || currentUser.username;

  const metrics = [
    {
      key: 'xp',
      label: 'XP Earned',
      value: `+${summary.xpEarned.toLocaleString()} XP`,
      sub: `Balance: ${currentUser.xp.toLocaleString()} XP`,
      icon: Zap,
      accent: '#FDE047',
      border: 'rgba(212, 175, 55, 0.35)',
      glow: 'rgba(212, 175, 55, 0.12)',
    },
    {
      key: 'questions',
      label: 'Questions Completed',
      value: `+${questionsCompleted.toLocaleString()}`,
      sub: `Report Card: ${summary.currentQuestions.toLocaleString()} total`,
      icon: BookOpen,
      accent: '#34D399',
      border: 'rgba(52, 211, 153, 0.32)',
      glow: 'rgba(52, 211, 153, 0.10)',
    },
    {
      key: 'streak',
      label: 'Streak Change',
      value: streakDisplay,
      sub: `${summary.startStreak}d → ${summary.currentStreak}d streak`,
      icon: Flame,
      accent: '#FB923C',
      border: 'rgba(251, 146, 60, 0.35)',
      glow: 'rgba(251, 146, 60, 0.11)',
    },
    {
      key: 'territories',
      label: 'Territories Acquired',
      value: `+${summary.territoriesAcquired.toLocaleString()}`,
      sub: `${summary.currentTerritories} ${
        summary.currentTerritories === 1 ? 'territory' : 'territories'
      } held`,
      icon: Castle,
      accent: '#C084FC',
      border: 'rgba(192, 132, 252, 0.35)',
      glow: 'rgba(168, 85, 247, 0.12)',
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onClose(summary.weekStartIso)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#d4af37]/45 bg-gradient-to-b from-[#160d2a] via-[#10091e] to-[#0b0714] text-[#f4effa] shadow-[0_28px_90px_rgba(88,28,135,0.45)]"
          >
            {/* Top Metallic Accent Line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

            {/* Soft Ambient Radial Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 h-52 w-80 -translate-x-1/2 rounded-full bg-[#9333ea]/25 blur-3xl"
            />

            <div className="relative z-10 p-6 sm:p-7">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d4af37]/50 bg-gradient-to-br from-[#2b1548] to-[#140a24] text-[#fde047] shadow-[0_0_24px_rgba(212,175,55,0.22)]">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#d4af37] uppercase">
                      {isCompletedView ? 'Completed Week' : 'End-of-Week Recap'} ·{' '}
                      {summary.weekLabel}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
                      Weekly Summary, {firstName}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onClose(summary.weekStartIso)}
                  aria-label="Close weekly summary"
                  className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-white/65 transition-colors hover:border-white/25 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Optional Switcher if Last Week exists */}
              {lastCompleted && (
                <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-black/35 p-1">
                  <button
                    type="button"
                    onClick={() => setSelectedIso(tracker.activeWeek.weekStartIso)}
                    className={`rounded-lg px-3 py-1 font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                      !isCompletedView
                        ? 'bg-[#9333ea]/30 text-[#f5d0fe]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    This Week ({tracker.activeWeek.weekLabel})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIso(lastCompleted.weekStartIso)}
                    className={`rounded-lg px-3 py-1 font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                      isCompletedView
                        ? 'bg-[#d4af37]/25 text-[#fde68a]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Last Week ({lastCompleted.weekLabel})
                  </button>
                </div>
              )}

              {/* Encouraging Summary Line */}
              <p className="mt-4 text-xs leading-relaxed text-[#d8ccf0]">
                {getWeeklyMessage(summary)}
              </p>

              {/* Compact 2x2 Metrics Grid */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {metrics.map((m, idx) => {
                  const Icon = m.icon;
                  return (
                    <motion.div
                      key={m.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * idx, duration: 0.25 }}
                      style={{
                        borderColor: m.border,
                        background: `linear-gradient(145deg, ${m.glow}, rgba(11, 7, 20, 0.85))`,
                      }}
                      className="rounded-2xl border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold tracking-wider text-white/65 uppercase">
                          {m.label}
                        </span>
                        <Icon
                          style={{ color: m.accent }}
                          className="h-4 w-4 shrink-0"
                        />
                      </div>
                      <p
                        style={{ color: m.accent }}
                        className="mt-2 font-mono text-2xl font-extrabold tracking-tight tabular-nums"
                      >
                        {m.value}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-white/65 tabular-nums">
                        {m.sub}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer Rank Line & Primary CTA */}
              <div className="mt-6 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 font-mono text-xs text-[#cfc5e3]">
                  <CalendarDays className="h-3.5 w-3.5 text-[#d4af37]" />
                  <span>
                    <span style={{ color: currentRank.color }}>
                      {currentRank.emblem} {currentRank.name}
                    </span>{' '}
                    · Level {currentUser.level}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onClose(summary.weekStartIso)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c79a26] via-[#d4af37] to-[#fde047] px-5 py-2.5 text-xs font-bold text-[#0b0714] shadow-[0_8px_24px_rgba(212,175,55,0.3)] transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Continue Ascension</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
