import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Flag,
  Flame,
  Lock,
  RotateCcw,
  Send,
  ShieldAlert,
  Swords,
  Timer,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import {
  DqrUser,
  DuelConfig,
  DuelMatch,
  DuelParticipantProgress,
  DuelQuestion,
  RankDef,
} from '../types';
import {
  computeAllDuelElos,
  computeExpectedWinProb,
  computeHeadToHeadStats,
  DUEL_ELO_TIERS,
  DUEL_REQUIRED_XP,
  DuelEloMatchDelta,
  formatDuelDuration,
  getDuelKFactor,
  getTopicReadiness,
  STARTING_DUEL_ELO,
} from '../utils/duelHelpers';
import { resolveRank } from '../utils/rivalHelpers';

interface DuelSystemPanelProps {
  currentUser: DqrUser;
  users: DqrUser[];
  ranks: RankDef[];
  duelConfig: DuelConfig;
  duelQuestions: DuelQuestion[];
  duelMatches: DuelMatch[];
  onSendDuelRequest: (opponentId: string, topic: string) => string | null;
  onRespondDuelRequest: (matchId: string, accept: boolean) => void;
  onCancelDuelRequest: (matchId: string) => void;
  onUpdateDuelProgress: (
    matchId: string,
    userId: string,
    progress: DuelParticipantProgress
  ) => void;
  onFlagDuelQuestion: (questionId: string, reason: string) => void;
}

type DuelSubSubTab = 'arena' | 'head-to-head' | 'elo-ladder';

function QuestionProgressDots({
  questionIds,
  currentIndex,
  answeredMap,
  submitted,
  accent,
}: {
  questionIds: string[];
  currentIndex: number;
  answeredMap: Record<string, number>;
  submitted: boolean;
  accent: 'blue' | 'amber';
}) {
  const doneBg =
    accent === 'blue'
      ? 'border-[#3988FF]/60 bg-[#3988FF]/25 text-[#83B9FF]'
      : 'border-amber-400/60 bg-amber-400/25 text-amber-200';
  const activeBg =
    accent === 'blue'
      ? 'border-[#83B9FF] bg-[#3988FF] text-white'
      : 'border-amber-300 bg-amber-400 text-[#120d02]';

  return (
    <div
      className="mt-2.5 grid gap-1"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, questionIds.length)}, minmax(0, 1fr))`,
      }}
    >
      {questionIds.map((qid, idx) => {
        const isDone =
          submitted ||
          idx < currentIndex ||
          (answeredMap && answeredMap[qid] !== undefined);
        const isCurrent = !submitted && !isDone && idx === currentIndex;
        return (
          <div
            key={qid || idx}
            title={`Q${idx + 1}: ${
              isDone ? 'Answered' : isCurrent ? 'In Progress' : 'Upcoming'
            }`}
            className={`flex h-5 items-center justify-center rounded border font-mono text-[10px] font-bold tabular-nums transition-colors ${
              isCurrent
                ? activeBg
                : isDone
                  ? doneBg
                  : 'border-white/10 bg-[#090B12] text-neutral-500'
            }`}
          >
            {idx + 1}
          </div>
        );
      })}
    </div>
  );
}

function DuelEloProgressionChart({
  userAName,
  userBName,
  historyA,
  historyB,
}: {
  userAName: string;
  userBName: string;
  historyA: DuelEloMatchDelta[];
  historyB: DuelEloMatchDelta[];
}) {
  const seriesA = useMemo(
    () => [STARTING_DUEL_ELO, ...historyA.map((h) => h.postElo)],
    [historyA]
  );
  const seriesB = useMemo(
    () => [STARTING_DUEL_ELO, ...historyB.map((h) => h.postElo)],
    [historyB]
  );

  const maxSteps = Math.max(seriesA.length, seriesB.length);
  if (maxSteps <= 1) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-[#090B12] p-8 text-center">
        <TrendingUp className="mx-auto h-7 w-7 text-[#83B9FF]/60" />
        <p className="mt-2 font-display text-sm font-semibold text-white">
          Elo Trajectory Chart Unlocks After First Completed 1v1 Duel
        </p>
        <p className="mt-1 text-xs text-[#929CAF]">
          Both duelists currently sit at the {STARTING_DUEL_ELO} starting Elo
          baseline.
        </p>
      </div>
    );
  }

  const allValues = [...seriesA, ...seriesB, STARTING_DUEL_ELO];
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const minVal = Math.floor((rawMin - 40) / 25) * 25;
  const maxVal = Math.ceil((rawMax + 40) / 25) * 25;
  const span = Math.max(50, maxVal - minVal);

  const W = 720;
  const H = 210;
  const padL = 48;
  const padR = 20;
  const padT = 18;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const toX = (idx: number, total: number) =>
    total <= 1 ? padL : padL + (idx / (maxSteps - 1)) * plotW;
  const toY = (val: number) => padT + ((maxVal - val) / span) * plotH;

  const pointsFor = (arr: number[]) =>
    arr
      .map((v, idx) => `${toX(idx, arr.length).toFixed(1)},${toY(v).toFixed(1)}`)
      .join(' ');

  const gridLevels = [
    maxVal,
    Math.round((maxVal + minVal) / 2),
    minVal,
  ];
  const baseLineY = toY(STARTING_DUEL_ELO);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-bold text-white">
            1v1 Overall Elo Progression Trajectory
          </h3>
          <p className="text-xs text-[#929CAF]">
            Chronological rating path from {STARTING_DUEL_ELO} baseline across
            completed 1v1 duels
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 font-mono text-xs tabular-nums">
          <span className="inline-flex items-center gap-1.5 text-[#83B9FF]">
            <span className="h-2 w-4 rounded-sm bg-[#3988FF]" />
            {userAName}: {seriesA[seriesA.length - 1]}
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-300">
            <span className="h-2 w-4 rounded-sm bg-amber-400" />
            {userBName}: {seriesB[seriesB.length - 1]}
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-52 w-full min-w-[460px]"
          role="img"
          aria-label="1v1 Elo progression chart"
        >
          {gridLevels.map((lvl, idx) => {
            const y = toY(lvl);
            return (
              <g key={idx}>
                <line
                  x1={padL}
                  y1={y}
                  x2={W - padR}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#929CAF"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {lvl}
                </text>
              </g>
            );
          })}

          {baseLineY >= padT && baseLineY <= H - padB && (
            <line
              x1={padL}
              y1={baseLineY}
              x2={W - padR}
              y2={baseLineY}
              stroke="rgba(255,255,255,0.22)"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          )}

          {seriesA.length > 1 && (
            <polyline
              fill="none"
              stroke="#3988FF"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={pointsFor(seriesA)}
            />
          )}
          {seriesB.length > 1 && (
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={pointsFor(seriesB)}
            />
          )}

          {seriesA.map((val, idx) => (
            <circle
              key={`a-${idx}`}
              cx={toX(idx, seriesA.length)}
              cy={toY(val)}
              r={idx === seriesA.length - 1 ? 4.5 : 3}
              fill="#3988FF"
              stroke="#090B12"
              strokeWidth="1.5"
            >
              <title>{`${userAName} · Match #${idx}: ${val} Elo`}</title>
            </circle>
          ))}

          {seriesB.map((val, idx) => (
            <circle
              key={`b-${idx}`}
              cx={toX(idx, seriesB.length)}
              cy={toY(val)}
              r={idx === seriesB.length - 1 ? 4.5 : 3}
              fill="#F59E0B"
              stroke="#090B12"
              strokeWidth="1.5"
            >
              <title>{`${userBName} · Match #${idx}: ${val} Elo`}</title>
            </circle>
          ))}

          <text
            x={padL}
            y={H - 8}
            fill="#929CAF"
            fontSize="10"
            fontFamily="monospace"
          >
            Start ({STARTING_DUEL_ELO})
          </text>
          <text
            x={W - padR}
            y={H - 8}
            textAnchor="end"
            fill="#929CAF"
            fontSize="10"
            fontFamily="monospace"
          >
            Duel #{maxSteps - 1}
          </text>
        </svg>
      </div>
    </div>
  );
}

function DuelAvatar({
  user,
  accent,
  size = 'md',
}: {
  user: DqrUser;
  accent: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dims =
    size === 'lg'
      ? 'h-16 w-16 text-lg'
      : size === 'sm'
        ? 'h-9 w-9 text-xs'
        : 'h-12 w-12 text-sm';

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  if (user.photoUrl) {
    return (
      <img
        src={user.photoUrl}
        alt={user.fullName}
        referrerPolicy="no-referrer"
        style={{ borderColor: `${accent}88` }}
        className={`${dims} shrink-0 rounded-xl border object-cover bg-[#090B12]`}
      />
    );
  }

  return (
    <div
      style={{ borderColor: `${accent}66`, color: accent }}
      className={`${dims} flex shrink-0 items-center justify-center rounded-xl border bg-[#090B12] font-mono font-bold`}
    >
      {initials || user.username.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function DuelSystemPanel({
  currentUser,
  users,
  ranks,
  duelConfig,
  duelQuestions,
  duelMatches,
  onSendDuelRequest,
  onRespondDuelRequest,
  onCancelDuelRequest,
  onUpdateDuelProgress,
  onFlagDuelQuestion,
}: DuelSystemPanelProps) {
  const [subSubTab, setSubSubTab] = useState<DuelSubSubTab>('arena');
  const [now, setNow] = useState(() => Date.now());

  // Challenge builder state
  const playableTopics = useMemo(() => {
    const set = new Set<string>(duelConfig.topics);
    for (const q of duelQuestions) {
      if (q.status === 'approved' && q.isActive) set.add(q.topic);
    }
    return Array.from(set).map((t) => getTopicReadiness(duelQuestions, t));
  }, [duelConfig.topics, duelQuestions]);

  const [selectedTopic, setSelectedTopic] = useState<string>(
    () =>
      playableTopics.find((t) => t.playable)?.topic ||
      playableTopics[0]?.topic ||
      'Mathematics'
  );
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>(
    () => users.find((u) => u.id !== currentUser.id)?.id || ''
  );
  const [formFeedback, setFormFeedback] = useState<string | null>(null);
  const [rematchFeedback, setRematchFeedback] = useState<string | null>(null);
  const [ladderTopicFilter, setLadderTopicFilter] = useState<string>('overall');
  const [showEloMathIds, setShowEloMathIds] = useState<Record<string, boolean>>(
    {}
  );

  // Selected review match
  const [reviewMatchId, setReviewMatchId] = useState<string | null>(null);
  const [flaggedIdsLocal, setFlaggedIdsLocal] = useState<string[]>([]);

  // Head-to-Head selectors
  const [h2hPlayerA, setH2hPlayerA] = useState<string>(currentUser.id);
  const [h2hPlayerB, setH2hPlayerB] = useState<string>(
    () => users.find((u) => u.id !== currentUser.id)?.id || currentUser.id
  );
  const [h2hTopic, setH2hTopic] = useState<string>('all');

  const eloLedger = useMemo(
    () => computeAllDuelElos(duelMatches, users),
    [duelMatches, users]
  );
  const myEloProfile = eloLedger.profiles[currentUser.id];

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const minRequiredXp = duelConfig.wagerXp || DUEL_REQUIRED_XP;
  const userHasEnoughXp = currentUser.xp >= minRequiredXp;

  // Match lookups for currentUser
  const incomingPending = useMemo(
    () =>
      duelMatches.filter(
        (m) =>
          m.status === 'pending' &&
          m.opponentId === currentUser.id &&
          m.expiresAt > now
      ),
    [duelMatches, currentUser.id, now]
  );

  const outgoingPending = useMemo(
    () =>
      duelMatches.filter(
        (m) =>
          m.status === 'pending' &&
          m.challengerId === currentUser.id &&
          m.expiresAt > now
      ),
    [duelMatches, currentUser.id, now]
  );

  const activeMatch = useMemo(
    () =>
      duelMatches.find(
        (m) =>
          m.status === 'active' &&
          (m.challengerId === currentUser.id || m.opponentId === currentUser.id)
      ) || null,
    [duelMatches, currentUser.id]
  );

  const recentMatches = useMemo(
    () =>
      duelMatches
        .filter(
          (m) =>
            m.status === 'completed' &&
            (m.challengerId === currentUser.id ||
              m.opponentId === currentUser.id)
        )
        .sort(
          (a, b) => (b.settledAt || b.createdAt) - (a.settledAt || a.createdAt)
        ),
    [duelMatches, currentUser.id]
  );

  const reviewMatch = useMemo(() => {
    if (reviewMatchId) {
      return duelMatches.find((m) => m.id === reviewMatchId) || null;
    }
    return recentMatches[0] || null;
  }, [duelMatches, reviewMatchId, recentMatches]);

  // =================== LIVE BATTLE STATE & ANTI-CHEAT ===================
  const activeQuestions = useMemo(() => {
    if (!activeMatch) return [];
    const qMap = new Map(duelQuestions.map((q) => [q.id, q]));
    return activeMatch.questionIds
      .map((id) => qMap.get(id))
      .filter((q): q is DuelQuestion => Boolean(q));
  }, [activeMatch, duelQuestions]);

  const myActiveProgress = useMemo(() => {
    if (!activeMatch) return null;
    return activeMatch.challengerId === currentUser.id
      ? activeMatch.challengerProgress
      : activeMatch.opponentProgress;
  }, [activeMatch, currentUser.id]);

  const oppActiveProgress = useMemo(() => {
    if (!activeMatch) return null;
    return activeMatch.challengerId === currentUser.id
      ? activeMatch.opponentProgress
      : activeMatch.challengerProgress;
  }, [activeMatch, currentUser.id]);

  const oppActiveUser = useMemo(() => {
    if (!activeMatch) return null;
    const oppId =
      activeMatch.challengerId === currentUser.id
        ? activeMatch.opponentId
        : activeMatch.challengerId;
    return users.find((u) => u.id === oppId) || null;
  }, [activeMatch, currentUser.id, users]);

  // Local instant state during battle so advancing from Q1->Q2 is immediate (0ms)
  const [localIndex, setLocalIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, number>>({});
  const [localTimesMs, setLocalTimesMs] = useState<Record<string, number>>({});
  const questionStartRef = useRef<number>(Date.now());
  const battleEnteredAtRef = useRef<number>(Date.now());
  const clockOffsetMsRef = useRef<number>(0);
  const activeBattleMatchIdRef = useRef<string | null>(null);
  const submittedRef = useRef<boolean>(false);

  // Sync local battle state cleanly when a new active match starts
  useEffect(() => {
    if (!activeMatch) {
      activeBattleMatchIdRef.current = null;
      submittedRef.current = false;
      clockOffsetMsRef.current = 0;
      return;
    }
    if (activeBattleMatchIdRef.current !== activeMatch.id) {
      activeBattleMatchIdRef.current = activeMatch.id;
      const nowClient = Date.now();
      battleEnteredAtRef.current = nowClient;
      questionStartRef.current = nowClient;
      const p =
        activeMatch.challengerId === currentUser.id
          ? activeMatch.challengerProgress
          : activeMatch.opponentProgress;
      setLocalIndex(p.currentIndex);
      setLocalAnswers(p.answers || {});
      setLocalTimesMs(p.questionTimesMs || {});
      submittedRef.current = p.submitted;

      // Guard against device clock skew when challenger & acceptor have different system clocks
      if (activeMatch.startedAt) {
        const rawDiff = nowClient - activeMatch.startedAt;
        clockOffsetMsRef.current =
          Math.abs(rawDiff) > 5000 ? rawDiff : 0;
      } else {
        clockOffsetMsRef.current = 0;
      }
    } else if (myActiveProgress?.submitted) {
      submittedRef.current = true;
    }
  }, [activeMatch, currentUser.id, myActiveProgress?.submitted]);

  const localAnswersRef = useRef(localAnswers);
  localAnswersRef.current = localAnswers;
  const localTimesRef = useRef(localTimesMs);
  localTimesRef.current = localTimesMs;
  const localIndexRef = useRef(localIndex);
  localIndexRef.current = localIndex;

  const finalizeMyDuel = useCallback(
    (
      reason: 'completed' | 'timeout' | 'tab-switch' | 'window-blur' | 'exit',
      overrideAnswers?: Record<string, number>,
      overrideTimes?: Record<string, number>
    ) => {
      if (!activeMatch || submittedRef.current) return;
      submittedRef.current = true;

      const answersToScore = overrideAnswers || localAnswersRef.current;
      const timesToScore = overrideTimes || localTimesRef.current;

      let correctCount = 0;
      for (const q of activeQuestions) {
        if (answersToScore[q.id] === q.correctIndex) {
          correctCount += 1;
        }
      }

      const startedAt =
        (activeMatch.startedAt || battleEnteredAtRef.current) +
        clockOffsetMsRef.current;
      const finishedAt = Date.now();
      const totalTimeMs = Math.max(500, finishedAt - startedAt);

      onUpdateDuelProgress(activeMatch.id, currentUser.id, {
        userId: currentUser.id,
        currentIndex: activeQuestions.length,
        answers: answersToScore,
        questionTimesMs: timesToScore,
        correctCount,
        totalTimeMs,
        submitted: true,
        submittedAt: finishedAt,
        autoSubmittedReason: reason,
      });
    },
    [activeMatch, activeQuestions, currentUser.id, onUpdateDuelProgress]
  );

  // Per-question and shared-match clock timers
  const totalMatchMs =
    activeQuestions.length *
    (activeMatch?.secondsPerQuestion || duelConfig.secondsPerQuestion || 15) *
    1000;
  const effectiveStartedAt = activeMatch?.startedAt
    ? activeMatch.startedAt + clockOffsetMsRef.current
    : battleEnteredAtRef.current;
  const matchElapsedMs = activeMatch
    ? Math.max(0, now - effectiveStartedAt)
    : 0;
  const matchRemainingMs =
    activeQuestions.length > 0 ? Math.max(0, totalMatchMs - matchElapsedMs) : 0;

  const isBattleRunning =
    Boolean(activeMatch) &&
    Boolean(myActiveProgress && !myActiveProgress.submitted);

  const isBattleRunningRef = useRef(isBattleRunning);
  isBattleRunningRef.current = isBattleRunning;
  const finalizeMyDuelRef = useRef(finalizeMyDuel);
  finalizeMyDuelRef.current = finalizeMyDuel;

  // Auto-submit when global shared clock expires
  useEffect(() => {
    if (
      !isBattleRunning ||
      !activeMatch?.startedAt ||
      activeQuestions.length === 0 ||
      activeBattleMatchIdRef.current !== activeMatch.id
    ) {
      return;
    }
    if (
      matchRemainingMs <= 0 &&
      Date.now() - battleEnteredAtRef.current >= 1000
    ) {
      finalizeMyDuelRef.current('timeout');
    }
  }, [
    isBattleRunning,
    activeMatch?.id,
    activeMatch?.startedAt,
    activeQuestions.length,
    matchRemainingMs,
  ]);

  // Auto-advance question if player exceeds secondsPerQuestion on a single question
  useEffect(() => {
    if (
      !isBattleRunning ||
      !activeMatch ||
      activeQuestions.length === 0 ||
      activeBattleMatchIdRef.current !== activeMatch.id
    ) {
      return;
    }
    const secPerQ = activeMatch.secondsPerQuestion || 15;
    const elapsedOnQ = now - questionStartRef.current;
    if (elapsedOnQ >= secPerQ * 1000) {
      const currentQ = activeQuestions[localIndex];
      if (!currentQ) return;
      const nextTimes = {
        ...localTimesRef.current,
        [currentQ.id]: secPerQ * 1000,
      };
      setLocalTimesMs(nextTimes);
      if (localIndex + 1 >= activeQuestions.length) {
        finalizeMyDuelRef.current(
          'completed',
          localAnswersRef.current,
          nextTimes
        );
      } else {
        const nextIdx = localIndex + 1;
        questionStartRef.current = Date.now();
        setLocalIndex(nextIdx);
        onUpdateDuelProgress(activeMatch.id, currentUser.id, {
          userId: currentUser.id,
          currentIndex: nextIdx,
          answers: localAnswersRef.current,
          questionTimesMs: nextTimes,
          correctCount: 0,
          totalTimeMs: 0,
          submitted: false,
          submittedAt: null,
        });
      }
    }
  }, [
    isBattleRunning,
    activeMatch,
    now,
    localIndex,
    activeQuestions,
    currentUser.id,
    onUpdateDuelProgress,
  ]);

  // ANTI-CHEAT: Immediate Auto-Submit on Tab Switch, Window Blur, or Page Unload
  // (Depends ONLY on isBattleRunning so parent re-renders never trigger cleanup!)
  useEffect(() => {
    if (!isBattleRunning) return;

    const handleVisibility = () => {
      if (document.hidden && !submittedRef.current) {
        finalizeMyDuelRef.current('tab-switch');
      }
    };
    const handleBlur = () => {
      if (
        !submittedRef.current &&
        Date.now() - battleEnteredAtRef.current >= 800
      ) {
        finalizeMyDuelRef.current('window-blur');
      }
    };
    const handleBeforeUnload = () => {
      if (!submittedRef.current) {
        finalizeMyDuelRef.current('exit');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isBattleRunning]);

  // Auto-submit ONLY if the player navigates away / unmounts mid-battle
  useEffect(() => {
    return () => {
      if (isBattleRunningRef.current && !submittedRef.current) {
        finalizeMyDuelRef.current('exit');
      }
    };
  }, []);

  const handleSelectOption = (optionIndex: number) => {
    if (!activeMatch || !isBattleRunning || submittedRef.current) return;
    const currentQ = activeQuestions[localIndex];
    if (!currentQ) return;

    const qTimeMs = Math.max(200, Date.now() - questionStartRef.current);
    const nextAnswers = {
      ...localAnswers,
      [currentQ.id]: optionIndex,
    };
    const nextTimes = {
      ...localTimesMs,
      [currentQ.id]: qTimeMs,
    };

    setLocalAnswers(nextAnswers);
    setLocalTimesMs(nextTimes);

    if (localIndex + 1 >= activeQuestions.length) {
      finalizeMyDuel('completed', nextAnswers, nextTimes);
    } else {
      const nextIdx = localIndex + 1;
      questionStartRef.current = Date.now();
      setLocalIndex(nextIdx);
      onUpdateDuelProgress(activeMatch.id, currentUser.id, {
        userId: currentUser.id,
        currentIndex: nextIdx,
        answers: nextAnswers,
        questionTimesMs: nextTimes,
        correctCount: 0,
        totalTimeMs: 0,
        submitted: false,
        submittedAt: null,
      });
    }
  };

  // Head-to-Head Summary
  const h2hSummary = useMemo(
    () =>
      computeHeadToHeadStats(duelMatches, h2hPlayerA, h2hPlayerB, h2hTopic),
    [duelMatches, h2hPlayerA, h2hPlayerB, h2hTopic]
  );

  const h2hUserA = users.find((u) => u.id === h2hPlayerA) || currentUser;
  const h2hUserB =
    users.find((u) => u.id === h2hPlayerB) ||
    users.find((u) => u.id !== h2hPlayerA) ||
    currentUser;

  const opponentsList = users.filter((u) => u.id !== currentUser.id);
  const selectedTopicReadiness = playableTopics.find(
    (t) => t.topic === selectedTopic
  );

  // =================== FULL-FOCUS LIVE DUEL ARENA VIEW ===================
  if (activeMatch && myActiveProgress && !myActiveProgress.submitted) {
    const currentQ = activeQuestions[localIndex] || activeQuestions[0];
    const secPerQ = activeMatch.secondsPerQuestion || 15;
    const qElapsedSec =
      activeBattleMatchIdRef.current === activeMatch.id
        ? Math.max(0, (now - questionStartRef.current) / 1000)
        : 0;
    const qRemSec = Math.max(0, secPerQ - qElapsedSec);
    const qPct = Math.min(100, Math.max(0, (qRemSec / secPerQ) * 100));

    return (
      <div
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        className="select-none space-y-6 rounded-3xl border border-[#3988FF]/45 bg-gradient-to-b from-[#0f1628] via-[#0a0f1d] to-[#080b14] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-8"
      >
        {/* Top Battle HUD */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#83B9FF] uppercase">
              Live 1v1 Duel · {activeMatch.topic} · {activeMatch.wagerXp} XP Stake
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-white">
              Question {Math.min(localIndex + 1, activeQuestions.length)} of{' '}
              {activeQuestions.length}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-[#3988FF]/35 bg-[#090B12] px-3.5 py-2 text-right">
              <p className="font-mono text-[10px] text-[#929CAF] uppercase">
                Shared Match Clock
              </p>
              <p className="font-mono text-base font-bold text-[#83B9FF] tabular-nums">
                {Math.ceil(matchRemainingMs / 1000)}s left
              </p>
            </div>

            <button
              type="button"
              onClick={() => finalizeMyDuel('exit')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2 font-mono text-xs font-semibold text-rose-200 hover:bg-rose-500/25 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Exit &amp; Auto-Submit</span>
            </button>
          </div>
        </div>

        {/* Live Rival Progress Telemetry + Question-by-Question Progress Dots */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#3988FF]/30 bg-[#0c1220] p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                You ({currentUser.fullName})
              </span>
              <span className="font-mono text-[#83B9FF] tabular-nums">
                Q {Math.min(localIndex + 1, activeQuestions.length)} /{' '}
                {activeQuestions.length}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-[#3988FF] transition-[width] duration-200"
                style={{
                  width: `${
                    ((localIndex + 1) / Math.max(1, activeQuestions.length)) *
                    100
                  }%`,
                }}
              />
            </div>
            <QuestionProgressDots
              questionIds={activeMatch.questionIds}
              currentIndex={localIndex}
              answeredMap={localAnswers}
              submitted={false}
              accent="blue"
            />
          </div>

          <div className="rounded-2xl border border-amber-400/30 bg-[#12101a] p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                {oppActiveUser?.fullName || 'Opponent'}
              </span>
              <span className="font-mono text-amber-300 tabular-nums">
                {oppActiveProgress?.submitted
                  ? `Submitted (${formatDuelDuration(
                      oppActiveProgress.totalTimeMs
                    )})`
                  : `Q ${Math.min(
                      (oppActiveProgress?.currentIndex || 0) + 1,
                      activeQuestions.length
                    )} / ${activeQuestions.length}`}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-amber-400 transition-[width] duration-300"
                style={{
                  width: `${
                    oppActiveProgress?.submitted
                      ? 100
                      : (((oppActiveProgress?.currentIndex || 0) + 1) /
                          Math.max(1, activeQuestions.length)) *
                        100
                  }%`,
                }}
              />
            </div>
            <QuestionProgressDots
              questionIds={activeMatch.questionIds}
              currentIndex={oppActiveProgress?.currentIndex || 0}
              answeredMap={oppActiveProgress?.answers || {}}
              submitted={Boolean(oppActiveProgress?.submitted)}
              accent="amber"
            />
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="rounded-2xl border border-white/10 bg-[#090B12] p-6 sm:p-7">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-semibold text-[#929CAF] capitalize">
                {currentQ.topic} · {currentQ.difficulty} Difficulty
              </span>
              <span
                className={`inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums ${
                  qRemSec <= 4 ? 'text-rose-400' : 'text-[#83B9FF]'
                }`}
              >
                <Timer className="h-3.5 w-3.5" />
                {Math.ceil(qRemSec)}s
              </span>
            </div>

            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full transition-[width] duration-150 ${
                  qRemSec <= 4 ? 'bg-rose-400' : 'bg-[#3988FF]'
                }`}
                style={{ width: `${qPct}%` }}
              />
            </div>

            <h4 className="mt-6 font-display text-xl leading-relaxed font-bold text-white sm:text-2xl">
              {currentQ.question}
            </h4>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className="group flex items-center gap-3.5 rounded-xl border border-white/15 bg-[#111827] px-4 py-4 text-left text-sm font-medium text-neutral-100 transition-all hover:border-[#3988FF] hover:bg-[#162238] cursor-pointer"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-black/40 font-mono text-xs font-bold text-[#83B9FF] group-hover:border-[#3988FF] group-hover:bg-[#3988FF] group-hover:text-white">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            Anti-Cheat Active: Switching browser tabs, minimizing, or exiting
            this screen will immediately auto-submit your current answers.
          </span>
        </div>
      </div>
    );
  }

  // =================== WAITING FOR OPPONENT FINISH ===================
  if (activeMatch && myActiveProgress?.submitted) {
    return (
      <div className="rounded-3xl border border-[#3988FF]/40 bg-gradient-to-b from-[#0f1628] to-[#090B12] p-8 text-center">
        <Clock className="mx-auto h-10 w-10 text-[#83B9FF]" />
        <p className="mt-3 font-mono text-xs font-bold tracking-[0.2em] text-[#83B9FF] uppercase">
          Answers Locked · Waiting for Opponent
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold text-white">
          You finished {activeMatch.topic} in{' '}
          {formatDuelDuration(myActiveProgress.totalTimeMs)}
        </h3>
        <p className="mt-2 text-sm text-[#929CAF]">
          Your score:{' '}
          <span className="font-mono font-bold text-white tabular-nums">
            {myActiveProgress.correctCount}/{activeMatch.questionIds.length}
          </span>
          .{' '}
          {myActiveProgress.autoSubmittedReason &&
            myActiveProgress.autoSubmittedReason !== 'completed' && (
              <span className="text-amber-300">
                (Auto-submitted: {myActiveProgress.autoSubmittedReason})
              </span>
            )}
        </p>

        <div className="mx-auto mt-6 max-w-xl space-y-3 rounded-2xl border border-white/10 bg-[#0d1322] p-4 text-left">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#83B9FF]">
                You ({currentUser.fullName})
              </span>
              <span className="font-mono font-bold text-[#83B9FF] tabular-nums">
                Locked ({activeMatch.questionIds.length}/
                {activeMatch.questionIds.length})
              </span>
            </div>
            <QuestionProgressDots
              questionIds={activeMatch.questionIds}
              currentIndex={activeMatch.questionIds.length}
              answeredMap={myActiveProgress.answers || {}}
              submitted={true}
              accent="blue"
            />
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300">
                {oppActiveUser?.fullName || 'Opponent'} live progress
              </span>
              <span className="font-mono font-bold text-amber-300 tabular-nums">
                Q{' '}
                {Math.min(
                  (oppActiveProgress?.currentIndex || 0) + 1,
                  activeMatch.questionIds.length
                )}{' '}
                / {activeMatch.questionIds.length}
              </span>
            </div>
            <QuestionProgressDots
              questionIds={activeMatch.questionIds}
              currentIndex={oppActiveProgress?.currentIndex || 0}
              answeredMap={oppActiveProgress?.answers || {}}
              submitted={Boolean(oppActiveProgress?.submitted)}
              accent="amber"
            />
          </div>

          <p className="pt-1 text-center text-[11px] text-neutral-400">
            Result, {activeMatch.wagerXp} XP transfer, and Elo rating updates
            settle the moment both players finish or the shared clock (
            {Math.ceil(matchRemainingMs / 1000)}s) ends.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Sub-Tab Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#3988FF]/25 bg-[#0e1424] p-4 sm:p-5">
        <div>
          <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#83B9FF] uppercase">
            1v1 Competitive Arena
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-white">
            Topic Duels, Head-to-Head &amp; Elo Ladder
          </h2>
          <p className="mt-0.5 font-mono text-xs text-[#929CAF] tabular-nums">
            Your 1v1 Elo:{' '}
            <span className={`font-bold ${myEloProfile?.tier.textClass || 'text-white'}`}>
              {myEloProfile?.overallElo ?? STARTING_DUEL_ELO}
            </span>{' '}
            ({myEloProfile?.tier.name}
            {myEloProfile?.provisional ? ' · Provisional' : ''}) ·{' '}
            {myEloProfile?.kLabel.split(' ')[0]} ·{' '}
            {myEloProfile?.currentStreakCount
              ? `Streak ${myEloProfile.currentStreakCount}${myEloProfile.currentStreakType}`
              : 'No Streak'}{' '}
            · Stake {minRequiredXp} XP
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#090B12] p-1">
          <button
            type="button"
            onClick={() => setSubSubTab('arena')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-mono text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subSubTab === 'arena'
                ? 'bg-[#3988FF] text-white'
                : 'text-[#929CAF] hover:text-white'
            }`}
          >
            <Swords className="h-3.5 w-3.5" />
            <span>Duel Arena</span>
          </button>
          <button
            type="button"
            onClick={() => setSubSubTab('head-to-head')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-mono text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subSubTab === 'head-to-head'
                ? 'bg-[#3988FF] text-white'
                : 'text-[#929CAF] hover:text-white'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Head-to-Head</span>
          </button>
          <button
            type="button"
            onClick={() => setSubSubTab('elo-ladder')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-mono text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subSubTab === 'elo-ladder'
                ? 'bg-[#3988FF] text-white'
                : 'text-[#929CAF] hover:text-white'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Elo Ladder &amp; Math</span>
          </button>
        </div>
      </div>

      {/* ================= DUEL ARENA SUB-SUB-TAB ================= */}
      {subSubTab === 'arena' && (
        <div className="space-y-6">
          {/* 1,000 XP Eligibility Warning */}
          {!userHasEnoughXp && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
              <div>
                <p className="font-semibold text-white">
                  You cannot enter a 1v1 Duel yet
                </p>
                <p className="mt-0.5 text-xs text-rose-200/90">
                  A minimum of{' '}
                  <span className="font-mono font-bold">
                    {minRequiredXp.toLocaleString()} XP
                  </span>{' '}
                  is required to duel (you currently have{' '}
                  <span className="font-mono font-bold">
                    {currentUser.xp.toLocaleString()} XP
                  </span>
                  ). Earn more XP from Challenges, Quests, or Territories first.
                </p>
              </div>
            </div>
          )}

          {/* Incoming 1-Minute Challenge Requests */}
          {incomingPending.map((req) => {
            const challenger = users.find((u) => u.id === req.challengerId);
            const secsLeft = Math.max(
              0,
              Math.ceil((req.expiresAt - now) / 1000)
            );
            const pct = Math.min(100, (secsLeft / 60) * 100);
            if (!challenger) return null;

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#d4af37]/50 bg-gradient-to-r from-[#19140b] via-[#121521] to-[#111827] p-5 shadow-[0_14px_40px_rgba(212,175,55,0.14)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <DuelAvatar user={challenger} accent="#f5dc82" />
                    <div>
                      <p className="font-mono text-[10px] font-bold tracking-wider text-[#f5dc82] uppercase">
                        Incoming 1v1 Challenge · {secsLeft}s to Accept
                      </p>
                      <h3 className="mt-0.5 font-display text-lg font-bold text-white">
                        {challenger.fullName} challenges you in {req.topic}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-[#929CAF]">
                        {Math.min(
                          10,
                          getTopicReadiness(duelQuestions, req.topic)
                            .totalApproved || 10
                        )}{' '}
                        Questions (3E/4M/3H) · {req.secondsPerQuestion}s/Q ·{' '}
                        {req.wagerXp} XP to Winner
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!userHasEnoughXp}
                      onClick={() => onRespondDuelRequest(req.id, true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold text-[#05120d] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Accept &amp; Start Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRespondDuelRequest(req.id, false)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/35 bg-rose-500/15 px-3.5 py-2.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/25 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#d4af37] to-emerald-400 transition-[width] duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Outgoing Pending Challenge Requests */}
          {outgoingPending.map((req) => {
            const opponent = users.find((u) => u.id === req.opponentId);
            const secsLeft = Math.max(
              0,
              Math.ceil((req.expiresAt - now) / 1000)
            );
            const pct = Math.min(100, (secsLeft / 60) * 100);
            if (!opponent) return null;

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-[#3988FF]/40 bg-[#101828] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] font-bold tracking-wider text-[#83B9FF] uppercase">
                      Awaiting Opponent · Expires in {secsLeft}s
                    </p>
                    <h3 className="mt-0.5 font-display text-lg font-bold text-white">
                      Challenged {opponent.fullName} · {req.topic}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#929CAF]">
                      Match starts the instant {opponent.fullName} accepts
                      within 1 minute.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCancelDuelRequest(req.id)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
                  >
                    Cancel Request
                  </button>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-[#3988FF] transition-[width] duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Challenge Setup Grid */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Topic + Opponent Selection */}
            <div className="space-y-5 rounded-2xl border border-white/10 bg-[#111827]/90 p-6 lg:col-span-7">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  1. Choose Duel Topic
                </h3>
                <p className="mt-0.5 text-xs text-[#929CAF]">
                  Questions are pulled exclusively from your chosen topic (3
                  Easy · 4 Medium · 3 Hard).
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {playableTopics.map((t) => {
                    const active = selectedTopic === t.topic;
                    return (
                      <button
                        key={t.topic}
                        type="button"
                        disabled={!t.playable}
                        onClick={() => setSelectedTopic(t.topic)}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                          active
                            ? 'border-[#3988FF] bg-[#3988FF]/15 text-white'
                            : 'border-white/10 bg-[#090B12] text-neutral-300 hover:border-white/25'
                        } ${!t.playable ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold">
                            {t.topic}
                          </p>
                          <p className="font-mono text-[10px] text-[#929CAF] tabular-nums">
                            {t.totalApproved} Qs ({t.easy}E/{t.medium}M/{t.hard}
                            H)
                          </p>
                        </div>
                        {active && (
                          <Check className="h-4 w-4 shrink-0 text-[#83B9FF]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/10 pt-5">
                <h3 className="font-display text-lg font-bold text-white">
                  2. Select Opponent
                </h3>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {opponentsList.map((opp) => {
                    const oppRank = resolveRank(ranks, opp.rankId);
                    const oppEligible = opp.xp >= minRequiredXp;
                    const active = selectedOpponentId === opp.id;
                    const oppEloProf = eloLedger.profiles[opp.id];
                    const oppElo = oppEloProf?.overallElo ?? STARTING_DUEL_ELO;
                    const oppTopicElo =
                      oppEloProf?.topicElos[selectedTopic]?.elo ??
                      STARTING_DUEL_ELO;
                    const myWinPct = Math.round(
                      computeExpectedWinProb(
                        myEloProfile?.overallElo ?? STARTING_DUEL_ELO,
                        oppElo
                      ) * 100
                    );
                    return (
                      <button
                        key={opp.id}
                        type="button"
                        disabled={!oppEligible}
                        onClick={() => setSelectedOpponentId(opp.id)}
                        className={`flex items-center justify-between gap-2.5 rounded-xl border p-3 text-left transition-all ${
                          active
                            ? 'border-[#3988FF] bg-[#3988FF]/15'
                            : 'border-white/10 bg-[#090B12] hover:border-white/25'
                        } ${!oppEligible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <DuelAvatar
                            user={opp}
                            accent={oppRank?.color || '#83B9FF'}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-xs font-bold text-white">
                                {opp.fullName}
                              </p>
                              {oppEloProf?.currentStreakType === 'W' &&
                                oppEloProf.currentStreakCount >= 2 && (
                                  <span className="font-mono text-[10px] font-bold text-amber-300 tabular-nums">
                                    {oppEloProf.currentStreakCount}W
                                  </span>
                                )}
                            </div>
                            <p className="truncate font-mono text-[10px] text-[#929CAF] tabular-nums">
                              Elo {oppElo} · {selectedTopic} {oppTopicElo} ·{' '}
                              {oppEloProf?.tier.name.split(' ')[0]}
                            </p>
                            <p className="truncate font-mono text-[10px] text-neutral-400 tabular-nums">
                              {opp.xp.toLocaleString()} XP · Your Win Prob{' '}
                              <span className="text-[#83B9FF]">{myWinPct}%</span>
                            </p>
                          </div>
                        </div>
                        {!oppEligible && (
                          <span className="shrink-0 font-mono text-[10px] text-rose-300">
                            &lt;1K XP
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Duel Summary & Pre-Match Elo Stakes */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#3988FF]/30 bg-gradient-to-b from-[#131b2e] to-[#0b0f1b] p-6 lg:col-span-5">
              <div>
                <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#83B9FF] uppercase">
                  Match Specification &amp; Elo Stakes
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold text-white">
                  {selectedTopic} Duel
                </h3>

                <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#929CAF]">Question Set</span>
                    <span className="font-mono font-semibold text-white tabular-nums">
                      {Math.min(10, selectedTopicReadiness?.totalApproved || 10)}{' '}
                      Questions (3E · 4M · 3H)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#929CAF]">Per-Question Timer</span>
                    <span className="font-mono font-semibold text-white tabular-nums">
                      {duelConfig.secondsPerQuestion} seconds
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#929CAF]">Accept Window</span>
                    <span className="font-mono font-semibold text-amber-300">
                      60 seconds
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#929CAF]">Winner Reward</span>
                    <span className="font-mono font-bold text-emerald-300 tabular-nums">
                      +{minRequiredXp.toLocaleString()} XP from Loser
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#929CAF]">Tie Rule</span>
                    <span className="font-mono text-neutral-300">
                      Faster wins · Exact tie = Draw (0 XP)
                    </span>
                  </div>

                  {(() => {
                    const opp = users.find((u) => u.id === selectedOpponentId);
                    const oppProf = opp ? eloLedger.profiles[opp.id] : null;
                    if (!opp || !oppProf || !myEloProfile) return null;
                    const exp = computeExpectedWinProb(
                      myEloProfile.overallElo,
                      oppProf.overallElo
                    );
                    const k = myEloProfile.kFactor;
                    const winDelta = Math.round(k * (1 - exp));
                    const drawDelta = Math.round(k * (0.5 - exp));
                    const lossDelta = Math.round(k * (0 - exp));
                    const myTopicElo =
                      myEloProfile.topicElos[selectedTopic]?.elo ??
                      STARTING_DUEL_ELO;
                    const oppTopicElo =
                      oppProf.topicElos[selectedTopic]?.elo ??
                      STARTING_DUEL_ELO;
                    return (
                      <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-[#090B12] p-3">
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="text-[#929CAF]">
                            Expected Win Odds (K={k})
                          </span>
                          <span className="font-bold text-[#83B9FF] tabular-nums">
                            {Math.round(exp * 100)}% vs{' '}
                            {Math.round((1 - exp) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="text-[#929CAF]">
                            Projected Overall Elo
                          </span>
                          <span className="tabular-nums">
                            <span className="text-emerald-300">
                              +{winDelta} W
                            </span>{' '}
                            ·{' '}
                            <span className="text-neutral-300">
                              {drawDelta >= 0 ? `+${drawDelta}` : drawDelta} D
                            </span>{' '}
                            ·{' '}
                            <span className="text-rose-300">{lossDelta} L</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="text-[#929CAF]">
                            {selectedTopic} Elo
                          </span>
                          <span className="text-neutral-200 tabular-nums">
                            You {myTopicElo} vs {oppTopicElo}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {formFeedback && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formFeedback}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={
                    !userHasEnoughXp ||
                    !selectedOpponentId ||
                    !selectedTopicReadiness?.playable ||
                    outgoingPending.length > 0
                  }
                  onClick={() => {
                    const err = onSendDuelRequest(
                      selectedOpponentId,
                      selectedTopic
                    );
                    setFormFeedback(err);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3988FF] to-[#60A5FA] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(57,136,255,0.28)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Send 1v1 Request (1-Min Window)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Latest Match Result + Instant Rematch + Elo Delta + Question Review */}
          {reviewMatch && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0d121f] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="font-mono text-[11px] font-bold text-[#83B9FF] uppercase">
                    Match Report · {reviewMatch.topic}
                  </p>
                  <h3 className="mt-0.5 font-display text-xl font-bold text-white">
                    {reviewMatch.winnerId === 'draw'
                      ? 'Exact Draw — 0 XP Transferred'
                      : reviewMatch.winnerId === currentUser.id
                        ? `Victory! +${reviewMatch.xpTransferred} XP Claimed`
                        : `Defeat — ${reviewMatch.xpTransferred} XP Lost`}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const otherId =
                      reviewMatch.challengerId === currentUser.id
                        ? reviewMatch.opponentId
                        : reviewMatch.challengerId;
                    const otherUser = users.find((u) => u.id === otherId);
                    const canRematch =
                      Boolean(otherUser) &&
                      !activeMatch &&
                      outgoingPending.length === 0 &&
                      userHasEnoughXp &&
                      (otherUser?.xp || 0) >= minRequiredXp;
                    return (
                      <button
                        type="button"
                        disabled={!canRematch}
                        onClick={() => {
                          if (!otherUser) return;
                          const err = onSendDuelRequest(
                            otherUser.id,
                            reviewMatch.topic
                          );
                          setRematchFeedback(
                            err ||
                              `Instant rematch request sent to ${otherUser.fullName} for ${reviewMatch.topic}!`
                          );
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#3988FF]/50 bg-[#3988FF]/15 px-3.5 py-1.5 font-mono text-xs font-bold text-[#83B9FF] transition-colors hover:bg-[#3988FF]/25 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Instant Rematch ({reviewMatch.topic})</span>
                      </button>
                    );
                  })()}

                  {recentMatches.length > 1 && (
                    <select
                      value={reviewMatch.id}
                      onChange={(e) => {
                        setReviewMatchId(e.target.value);
                        setRematchFeedback(null);
                      }}
                      className="rounded-xl border border-white/15 bg-[#090B12] px-3 py-1.5 text-xs text-white"
                    >
                      {recentMatches.slice(0, 12).map((m) => {
                        const c = users.find((u) => u.id === m.challengerId);
                        const o = users.find((u) => u.id === m.opponentId);
                        return (
                          <option key={m.id} value={m.id}>
                            {m.topic} · {c?.username} vs {o?.username}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>

              {rematchFeedback && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[#3988FF]/40 bg-[#3988FF]/10 px-3.5 py-2 text-xs text-[#83B9FF]">
                  <span>{rematchFeedback}</span>
                  <button
                    type="button"
                    onClick={() => setRematchFeedback(null)}
                    className="text-white/70 hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {(() => {
                const pA = users.find((u) => u.id === reviewMatch.challengerId);
                const pB = users.find((u) => u.id === reviewMatch.opponentId);
                const deltaPair = eloLedger.matchDeltas[reviewMatch.id];
                return (
                  <div className="space-y-3">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        {
                          user: pA,
                          prog: reviewMatch.challengerProgress,
                          eloInfo: deltaPair?.challenger,
                        },
                        {
                          user: pB,
                          prog: reviewMatch.opponentProgress,
                          eloInfo: deltaPair?.opponent,
                        },
                      ].map(({ user, prog, eloInfo }, idx) => {
                        if (!user) return null;
                        const won = reviewMatch.winnerId === user.id;
                        return (
                          <div
                            key={user.id + idx}
                            className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${
                              won
                                ? 'border-emerald-400/40 bg-emerald-500/10'
                                : 'border-white/10 bg-[#090B12]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <DuelAvatar
                                user={user}
                                accent={won ? '#34d399' : '#83B9FF'}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate text-sm font-bold text-white">
                                    {user.fullName}
                                  </span>
                                  {won && (
                                    <Crown className="h-3.5 w-3.5 shrink-0 text-[#f5dc82]" />
                                  )}
                                </div>
                                <p className="font-mono text-[11px] text-[#929CAF] tabular-nums">
                                  Time: {formatDuelDuration(prog.totalTimeMs)}
                                  {prog.autoSubmittedReason &&
                                    prog.autoSubmittedReason !== 'completed' &&
                                    ` · ${prog.autoSubmittedReason}`}
                                </p>
                                {eloInfo && (
                                  <p className="mt-1 font-mono text-[11px] text-neutral-300 tabular-nums">
                                    Overall {eloInfo.preElo} →{' '}
                                    <span className="font-bold text-white">
                                      {eloInfo.postElo}
                                    </span>{' '}
                                    <span
                                      className={
                                        eloInfo.delta >= 0
                                          ? 'text-emerald-300'
                                          : 'text-rose-300'
                                      }
                                    >
                                      ({eloInfo.delta >= 0 ? `+${eloInfo.delta}` : eloInfo.delta})
                                    </span>
                                    {' · '}
                                    {reviewMatch.topic} {eloInfo.topicPostElo}{' '}
                                    <span
                                      className={
                                        eloInfo.topicDelta >= 0
                                          ? 'text-emerald-300'
                                          : 'text-rose-300'
                                      }
                                    >
                                      (
                                      {eloInfo.topicDelta >= 0
                                        ? `+${eloInfo.topicDelta}`
                                        : eloInfo.topicDelta}
                                      )
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="font-mono text-xl font-bold text-white tabular-nums">
                                {prog.correctCount}/{reviewMatch.questionIds.length}
                              </p>
                              <p className="font-mono text-[10px] text-[#929CAF] uppercase">
                                Marks
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {deltaPair && (
                      <div className="rounded-xl border border-white/10 bg-[#090B12] px-4 py-3 font-mono text-[11px] text-[#929CAF] tabular-nums">
                        <span className="font-bold text-[#83B9FF]">
                          Elo Formula:
                        </span>{' '}
                        {pA?.username} (Exp {(deltaPair.challenger.expectedScore * 100).toFixed(1)}% ·
                        S={deltaPair.challenger.actualScore} · K={deltaPair.challenger.kFactor} →{' '}
                        {deltaPair.challenger.delta >= 0
                          ? `+${deltaPair.challenger.delta}`
                          : deltaPair.challenger.delta}
                        ) · {pB?.username} (Exp {(deltaPair.opponent.expectedScore * 100).toFixed(1)}% ·
                        S={deltaPair.opponent.actualScore} · K={deltaPair.opponent.kFactor} →{' '}
                        {deltaPair.opponent.delta >= 0
                          ? `+${deltaPair.opponent.delta}`
                          : deltaPair.opponent.delta}
                        )
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Question-by-Question Review with Flag Button */}
              <div className="space-y-2 pt-2">
                <p className="font-mono text-[11px] font-bold text-[#929CAF] uppercase">
                  Question Breakdown (Report errors to Admin if needed)
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {reviewMatch.questionIds.map((qid, i) => {
                    const q = duelQuestions.find((item) => item.id === qid);
                    if (!q) return null;
                    const myProg =
                      reviewMatch.challengerId === currentUser.id
                        ? reviewMatch.challengerProgress
                        : reviewMatch.opponentProgress;
                    const myChoice = myProg.answers[qid];
                    const isRight = myChoice === q.correctIndex;
                    const alreadyFlagged =
                      flaggedIdsLocal.includes(qid) ||
                      q.flaggedByUserIds?.includes(currentUser.id);

                    return (
                      <div
                        key={qid}
                        className="flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-[#090B12] p-3.5 text-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`font-mono text-[10px] font-bold ${
                                isRight ? 'text-emerald-300' : 'text-rose-300'
                              }`}
                            >
                              Q{i + 1} · {isRight ? 'CORRECT' : 'INCORRECT'}
                            </span>
                            <button
                              type="button"
                              disabled={alreadyFlagged}
                              onClick={() => {
                                onFlagDuelQuestion(
                                  qid,
                                  `Flagged by @${currentUser.username} after ${reviewMatch.topic} duel`
                                );
                                setFlaggedIdsLocal((p) => [...p, qid]);
                              }}
                              className={`inline-flex items-center gap-1 font-mono text-[10px] ${
                                alreadyFlagged
                                  ? 'text-amber-300/70'
                                  : 'text-neutral-400 hover:text-amber-300 cursor-pointer'
                              }`}
                            >
                              <Flag className="h-3 w-3" />
                              <span>
                                {alreadyFlagged ? 'Flagged' : 'Flag Question'}
                              </span>
                            </button>
                          </div>
                          <p className="mt-1 font-medium text-white">
                            {q.question}
                          </p>
                        </div>
                        <p className="font-mono text-[11px] text-emerald-300">
                          Ans: {q.options[q.correctIndex]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= HEAD-TO-HEAD SUB-SUB-TAB ================= */}
      {subSubTab === 'head-to-head' && (() => {
        const profA = eloLedger.profiles[h2hUserA.id];
        const profB = eloLedger.profiles[h2hUserB.id];
        const overallEloA = profA?.overallElo ?? STARTING_DUEL_ELO;
        const overallEloB = profB?.overallElo ?? STARTING_DUEL_ELO;
        const winProbA = Math.round(
          computeExpectedWinProb(overallEloA, overallEloB) * 100
        );
        const winProbB = 100 - winProbA;
        const topicEloA =
          h2hTopic !== 'all'
            ? profA?.topicElos[h2hTopic]?.elo ?? STARTING_DUEL_ELO
            : null;
        const topicEloB =
          h2hTopic !== 'all'
            ? profB?.topicElos[h2hTopic]?.elo ?? STARTING_DUEL_ELO
            : null;
        const topicProbA =
          topicEloA !== null && topicEloB !== null
            ? Math.round(computeExpectedWinProb(topicEloA, topicEloB) * 100)
            : null;

        return (
          <div className="space-y-6">
            {/* Player & Topic Selector */}
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#111827] p-5 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-bold text-[#83B9FF] uppercase">
                  Player A
                </label>
                <select
                  value={h2hPlayerA}
                  onChange={(e) => {
                    const nextA = e.target.value;
                    setH2hPlayerA(nextA);
                    if (nextA === h2hPlayerB) {
                      const alt = users.find((u) => u.id !== nextA)?.id || '';
                      if (alt) setH2hPlayerB(alt);
                    }
                  }}
                  className="w-full rounded-xl border border-white/15 bg-[#090B12] px-3 py-2.5 text-xs font-semibold text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (@{u.username}) · Elo{' '}
                      {eloLedger.profiles[u.id]?.overallElo ?? STARTING_DUEL_ELO}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-bold text-amber-300 uppercase">
                  Player B
                </label>
                <select
                  value={h2hPlayerB}
                  onChange={(e) => setH2hPlayerB(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#090B12] px-3 py-2.5 text-xs font-semibold text-white"
                >
                  {users
                    .filter((u) => u.id !== h2hPlayerA)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} (@{u.username}) · Elo{' '}
                        {eloLedger.profiles[u.id]?.overallElo ??
                          STARTING_DUEL_ELO}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-bold text-neutral-400 uppercase">
                  Filter Topic
                </label>
                <select
                  value={h2hTopic}
                  onChange={(e) => setH2hTopic(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#090B12] px-3 py-2.5 text-xs font-semibold text-white"
                >
                  <option value="all">All 1v1 Topics</option>
                  {playableTopics.map((t) => (
                    <option key={t.topic} value={t.topic}>
                      {t.topic}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Face-Off Scoreboard + Detailed Elo Metrics */}
            <div className="space-y-5 rounded-2xl border border-[#3988FF]/30 bg-gradient-to-b from-[#111827] to-[#090B12] p-6">
              <div className="grid items-center gap-6 md:grid-cols-3">
                {/* Player A */}
                <div className="flex items-center gap-3.5">
                  <DuelAvatar user={h2hUserA} accent="#3988FF" size="lg" />
                  <div>
                    <p className="font-display text-lg font-bold text-white">
                      {h2hUserA.fullName}
                    </p>
                    <p className="font-mono text-xs text-[#83B9FF] tabular-nums">
                      {h2hSummary.playerAWins}W · {h2hSummary.playerBWins}L ·{' '}
                      {h2hSummary.draws}D ·{' '}
                      <span className="font-bold">{overallEloA} Elo</span>
                    </p>
                    <p className="mt-1 font-mono text-xl font-extrabold text-white tabular-nums">
                      {h2hSummary.playerAWinRate}% H2H Win Rate
                    </p>
                  </div>
                </div>

                {/* Center Total Duels + Win Probability Predictor */}
                <div className="rounded-2xl border border-white/10 bg-[#090B12] p-4 text-center">
                  <p className="font-mono text-[10px] tracking-widest text-[#929CAF] uppercase">
                    Total Head-to-Head Duels
                  </p>
                  <p className="mt-1 font-mono text-3xl font-extrabold text-white tabular-nums">
                    {h2hSummary.totalDuels}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-neutral-400">
                    {h2hTopic === 'all' ? 'All Topics' : h2hTopic} ·{' '}
                    {h2hSummary.draws} Exact Draws
                  </p>
                  <div className="mt-3 border-t border-white/10 pt-2.5">
                    <div className="flex justify-between font-mono text-[10px] tabular-nums">
                      <span className="text-[#83B9FF]">
                        Elo Win Odds {winProbA}%
                      </span>
                      <span className="text-amber-300">{winProbB}%</span>
                    </div>
                    <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="bg-[#3988FF]"
                        style={{ width: `${winProbA}%` }}
                      />
                      <div
                        className="bg-amber-400"
                        style={{ width: `${winProbB}%` }}
                      />
                    </div>
                    {topicProbA !== null && (
                      <p className="mt-1 font-mono text-[10px] text-neutral-400 tabular-nums">
                        {h2hTopic} Elo Odds: {topicProbA}% vs {100 - topicProbA}%
                      </p>
                    )}
                  </div>
                </div>

                {/* Player B */}
                <div className="flex items-center justify-end gap-3.5 text-right">
                  <div>
                    <p className="font-display text-lg font-bold text-white">
                      {h2hUserB.fullName}
                    </p>
                    <p className="font-mono text-xs text-amber-300 tabular-nums">
                      {h2hSummary.playerBWins}W · {h2hSummary.playerAWins}L ·{' '}
                      {h2hSummary.draws}D ·{' '}
                      <span className="font-bold">{overallEloB} Elo</span>
                    </p>
                    <p className="mt-1 font-mono text-xl font-extrabold text-white tabular-nums">
                      {h2hSummary.playerBWinRate}% H2H Win Rate
                    </p>
                  </div>
                  <DuelAvatar user={h2hUserB} accent="#F59E0B" size="lg" />
                </div>
              </div>

              {/* Expanded Elo Telemetry Comparison Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    label: 'Player A',
                    user: h2hUserA,
                    prof: profA,
                    topicElo: topicEloA,
                    accentText: 'text-[#83B9FF]',
                    borderCls: 'border-[#3988FF]/25',
                  },
                  {
                    label: 'Player B',
                    user: h2hUserB,
                    prof: profB,
                    topicElo: topicEloB,
                    accentText: 'text-amber-300',
                    borderCls: 'border-amber-400/25',
                  },
                ].map(({ label, user, prof, topicElo, accentText, borderCls }) => {
                  if (!prof) return null;
                  return (
                    <div
                      key={user.id + label}
                      className={`rounded-xl border ${borderCls} bg-[#090B12] p-4`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <div>
                          <span className="font-mono text-[10px] text-[#929CAF] uppercase">
                            {label} · {prof.tier.name}
                            {prof.provisional ? ' (Provisional <5)' : ''}
                          </span>
                          <p className={`font-display text-base font-bold ${accentText}`}>
                            {user.fullName}
                          </p>
                        </div>
                        <div className="text-right font-mono tabular-nums">
                          <span className="text-xl font-extrabold text-white">
                            {prof.overallElo}
                          </span>
                          <p className="text-[10px] text-[#929CAF]">
                            {prof.kLabel}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px] tabular-nums">
                        <div>
                          <span className="text-[#929CAF]">Peak / Low</span>
                          <p className="font-bold text-white">
                            {prof.peakElo} / {prof.lowestElo}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#929CAF]">Perf (TPR)</span>
                          <p className="font-bold text-emerald-300">
                            {prof.performanceRating}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#929CAF]">
                            {topicElo !== null ? `${h2hTopic} Elo` : 'Net Δ'}
                          </span>
                          <p className="font-bold text-white">
                            {topicElo !== null
                              ? topicElo
                              : prof.netChange >= 0
                                ? `+${prof.netChange}`
                                : prof.netChange}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#929CAF]">Cur Streak</span>
                          <p className="font-bold text-white">
                            {prof.currentStreakCount > 0
                              ? `${prof.currentStreakCount}${prof.currentStreakType}`
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#929CAF]">Best Streak</span>
                          <p className="font-bold text-amber-300">
                            {prof.bestWinStreak}W
                          </p>
                        </div>
                        <div>
                          <span className="text-[#929CAF]">Top Topic Streak</span>
                          <p className="truncate font-bold text-white">
                            {prof.bestTopicStreak
                              ? `${prof.bestTopicStreak.count}W ${prof.bestTopicStreak.topic}`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Win Rate Proportion Bar */}
              {h2hSummary.totalDuels > 0 && (
                <div>
                  <div className="flex justify-between font-mono text-[11px] text-[#929CAF] tabular-nums">
                    <span>
                      Avg Score: {h2hSummary.playerAAvgMarks}/10 · Avg Time:{' '}
                      {h2hSummary.playerAAvgTimeSec}s
                    </span>
                    <span>
                      Avg Score: {h2hSummary.playerBAvgMarks}/10 · Avg Time:{' '}
                      {h2hSummary.playerBAvgTimeSec}s
                    </span>
                  </div>
                  <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="bg-[#3988FF]"
                      style={{ width: `${h2hSummary.playerAWinRate}%` }}
                    />
                    <div
                      className="bg-neutral-500"
                      style={{
                        width: `${Math.max(
                          0,
                          100 -
                            h2hSummary.playerAWinRate -
                            h2hSummary.playerBWinRate
                        )}%`,
                      }}
                    />
                    <div
                      className="bg-amber-400"
                      style={{ width: `${h2hSummary.playerBWinRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dual-Line Overall Elo Trajectory Chart */}
            <DuelEloProgressionChart
              userAName={h2hUserA.fullName}
              userBName={h2hUserB.fullName}
              historyA={profA?.history || []}
              historyB={profB?.history || []}
            />

            {/* Topic-Wise Breakdown (with Topic Elo & Streaks) */}
            {h2hSummary.topicBreakdown.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
                <h3 className="font-display text-lg font-bold text-white">
                  Topic-Wise Head-to-Head Record &amp; Topic Elo
                </h3>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 font-mono text-[11px] text-[#929CAF] uppercase">
                        <th className="py-2.5 pr-4">Topic</th>
                        <th className="py-2.5 px-3 text-right">Duels</th>
                        <th className="py-2.5 px-3 text-right">
                          {h2hUserA.fullName} W (Elo / Streak)
                        </th>
                        <th className="py-2.5 px-3 text-right">
                          {h2hUserB.fullName} W (Elo / Streak)
                        </th>
                        <th className="py-2.5 px-3 text-right">Draws</th>
                        <th className="py-2.5 pl-3 text-right">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono tabular-nums">
                      {h2hSummary.topicBreakdown.map((row) => {
                        const aTopic = profA?.topicElos[row.topic];
                        const bTopic = profB?.topicElos[row.topic];
                        return (
                          <tr key={row.topic} className="hover:bg-white/[0.02]">
                            <td className="py-3 pr-4 font-sans font-semibold text-white">
                              {row.topic}
                            </td>
                            <td className="py-3 px-3 text-right text-neutral-300">
                              {row.totalDuels}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="font-bold text-[#83B9FF]">
                                {row.playerAWins}W
                              </span>{' '}
                              <span className="text-[11px] text-neutral-400">
                                ({aTopic?.elo ?? STARTING_DUEL_ELO} ·{' '}
                                {aTopic?.currentWinStreak || 0}W streak)
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="font-bold text-amber-300">
                                {row.playerBWins}W
                              </span>{' '}
                              <span className="text-[11px] text-neutral-400">
                                ({bTopic?.elo ?? STARTING_DUEL_ELO} ·{' '}
                                {bTopic?.currentWinStreak || 0}W streak)
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-neutral-400">
                              {row.draws}
                            </td>
                            <td className="py-3 pl-3 text-right text-neutral-200">
                              {row.playerAWinRate}% / {row.playerBWinRate}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-[#0e1422] p-12 text-center">
                <Trophy className="mx-auto h-9 w-9 text-[#83B9FF]/60" />
                <p className="mt-3 font-display text-lg font-semibold text-white">
                  No completed 1v1 duels between {h2hUserA.fullName} and{' '}
                  {h2hUserB.fullName}
                  {h2hTopic !== 'all' ? ` in ${h2hTopic}` : ''}
                </p>
                <p className="mt-1 text-xs text-[#929CAF]">
                  Head-to-Head tracks strictly 1v1 battles (independent of Hall
                  of Fame). Challenge each other in the Duel Arena to start this
                  record!
                </p>
              </div>
            )}

            {/* Match Log with Per-Match Elo Math */}
            {h2hSummary.matches.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
                <h3 className="font-display text-base font-bold text-white">
                  Head-to-Head Match Log &amp; Per-Match Elo Breakdown
                </h3>
                <div className="mt-3 space-y-2.5">
                  {h2hSummary.matches.map((m) => {
                    const progA =
                      m.challengerId === h2hPlayerA
                        ? m.challengerProgress
                        : m.opponentProgress;
                    const progB =
                      m.challengerId === h2hPlayerB
                        ? m.challengerProgress
                        : m.opponentProgress;
                    const deltas = eloLedger.matchDeltas[m.id];
                    const deltaA =
                      deltas &&
                      (m.challengerId === h2hPlayerA
                        ? deltas.challenger
                        : deltas.opponent);
                    const deltaB =
                      deltas &&
                      (m.challengerId === h2hPlayerB
                        ? deltas.challenger
                        : deltas.opponent);
                    const winnerName =
                      m.winnerId === 'draw'
                        ? 'Draw (0 XP)'
                        : users.find((u) => u.id === m.winnerId)?.fullName +
                          ` (+${m.xpTransferred} XP)`;
                    const mathOpen = Boolean(showEloMathIds[m.id]);

                    return (
                      <div
                        key={m.id}
                        className="rounded-xl border border-white/10 bg-[#090B12] px-4 py-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-white">
                              {m.topic}
                            </span>
                            <span className="mx-2 text-neutral-500">·</span>
                            <span className="font-mono text-neutral-400">
                              {new Date(
                                m.settledAt || m.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
                            <span className="text-[#83B9FF]">
                              {progA.correctCount}/{m.questionIds.length || 10}{' '}
                              ({formatDuelDuration(progA.totalTimeMs)})
                              {deltaA && (
                                <span
                                  className={`ml-1.5 ${
                                    deltaA.delta >= 0
                                      ? 'text-emerald-300'
                                      : 'text-rose-300'
                                  }`}
                                >
                                  {deltaA.delta >= 0
                                    ? `+${deltaA.delta}`
                                    : deltaA.delta}{' '}
                                  Elo
                                </span>
                              )}
                            </span>
                            <span className="text-neutral-500">vs</span>
                            <span className="text-amber-300">
                              {progB.correctCount}/{m.questionIds.length || 10}{' '}
                              ({formatDuelDuration(progB.totalTimeMs)})
                              {deltaB && (
                                <span
                                  className={`ml-1.5 ${
                                    deltaB.delta >= 0
                                      ? 'text-emerald-300'
                                      : 'text-rose-300'
                                  }`}
                                >
                                  {deltaB.delta >= 0
                                    ? `+${deltaB.delta}`
                                    : deltaB.delta}{' '}
                                  Elo
                                </span>
                              )}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
                              <Zap className="h-3 w-3" />
                              {winnerName}
                            </span>
                            {deltaA && deltaB && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowEloMathIds((prev) => ({
                                    ...prev,
                                    [m.id]: !prev[m.id],
                                  }))
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-0.5 text-[10px] text-neutral-300 hover:text-white cursor-pointer"
                              >
                                <span>{mathOpen ? 'Hide Math' : 'Elo Math'}</span>
                                {mathOpen ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {mathOpen && deltaA && deltaB && (
                          <div className="mt-2.5 grid gap-2 border-t border-white/10 pt-2.5 font-mono text-[11px] text-[#929CAF] sm:grid-cols-2 tabular-nums">
                            <div>
                              <span className="text-[#83B9FF]">
                                {h2hUserA.fullName}:
                              </span>{' '}
                              Pre {deltaA.preElo} · Exp{' '}
                              {(deltaA.expectedScore * 100).toFixed(1)}% · Actual{' '}
                              {deltaA.actualScore} · K={deltaA.kFactor} →{' '}
                              <span className="text-white">
                                {deltaA.delta >= 0
                                  ? `+${deltaA.delta}`
                                  : deltaA.delta}{' '}
                                = {deltaA.postElo}
                              </span>{' '}
                              ({m.topic} {deltaA.topicPreElo} →{' '}
                              {deltaA.topicPostElo})
                            </div>
                            <div>
                              <span className="text-amber-300">
                                {h2hUserB.fullName}:
                              </span>{' '}
                              Pre {deltaB.preElo} · Exp{' '}
                              {(deltaB.expectedScore * 100).toFixed(1)}% · Actual{' '}
                              {deltaB.actualScore} · K={deltaB.kFactor} →{' '}
                              <span className="text-white">
                                {deltaB.delta >= 0
                                  ? `+${deltaB.delta}`
                                  : deltaB.delta}{' '}
                                = {deltaB.postElo}
                              </span>{' '}
                              ({m.topic} {deltaB.topicPreElo} →{' '}
                              {deltaB.topicPostElo})
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ================= ELO LADDER & MATH SUB-SUB-TAB ================= */}
      {subSubTab === 'elo-ladder' && myEloProfile && (
        <div className="space-y-6">
          {/* Your Elo Profile & Next Tier Progress */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 rounded-2xl border border-[#3988FF]/30 bg-gradient-to-b from-[#111827] to-[#090B12] p-6 lg:col-span-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold tracking-widest text-[#83B9FF] uppercase">
                    Your 1v1 Elo Standing
                  </p>
                  <h3
                    className={`mt-1 font-display text-2xl font-bold ${myEloProfile.tier.textClass}`}
                  >
                    {myEloProfile.tier.name}
                  </h3>
                  <p className="font-mono text-xs text-[#929CAF]">
                    {myEloProfile.provisional
                      ? `Provisional (${myEloProfile.duelsPlayed}/5 calibration duels)`
                      : 'Established 1v1 Rating'}{' '}
                    · {myEloProfile.kLabel}
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <p className="text-3xl font-extrabold text-white">
                    {myEloProfile.overallElo}
                  </p>
                  <p
                    className={`text-xs font-bold ${
                      myEloProfile.netChange >= 0
                        ? 'text-emerald-300'
                        : 'text-rose-300'
                    }`}
                  >
                    {myEloProfile.netChange >= 0
                      ? `+${myEloProfile.netChange}`
                      : myEloProfile.netChange}{' '}
                    vs 1200
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-[11px] text-[#929CAF] tabular-nums">
                  <span>{myEloProfile.tier.minElo} Elo</span>
                  <span>
                    {myEloProfile.tier.nextTierName
                      ? `${Math.max(
                          0,
                          (myEloProfile.tier.nextTierMinElo || 0) -
                            myEloProfile.overallElo
                        )} Elo to ${myEloProfile.tier.nextTierName}`
                      : 'Highest Tier Reached'}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full transition-[width] duration-300"
                    style={{
                      width: `${myEloProfile.tier.progressPct}%`,
                      backgroundColor: myEloProfile.tier.accentHex,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4 font-mono text-xs tabular-nums sm:grid-cols-3">
                <div>
                  <span className="text-[10px] text-[#929CAF] uppercase">
                    Peak / Lowest
                  </span>
                  <p className="mt-0.5 font-bold text-white">
                    {myEloProfile.peakElo} / {myEloProfile.lowestElo}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#929CAF] uppercase">
                    Perf (TPR)
                  </span>
                  <p className="mt-0.5 font-bold text-emerald-300">
                    {myEloProfile.performanceRating}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#929CAF] uppercase">
                    Record
                  </span>
                  <p className="mt-0.5 font-bold text-white">
                    {myEloProfile.wins}W-{myEloProfile.losses}L-
                    {myEloProfile.draws}D
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#929CAF] uppercase">
                    Current Streak
                  </span>
                  <p className="mt-0.5 font-bold text-[#83B9FF]">
                    {myEloProfile.currentStreakCount > 0
                      ? `${myEloProfile.currentStreakCount}${myEloProfile.currentStreakType}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#929CAF] uppercase">
                    Best Win Streak
                  </span>
                  <p className="mt-0.5 font-bold text-amber-300">
                    {myEloProfile.bestWinStreak}W
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#929CAF] uppercase">
                    Top Topic Streak
                  </span>
                  <p className="mt-0.5 truncate font-bold text-white">
                    {myEloProfile.bestTopicStreak
                      ? `${myEloProfile.bestTopicStreak.count}W ${myEloProfile.bestTopicStreak.topic}`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Your Per-Topic Elo Matrix */}
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-6 lg:col-span-7">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Your Topic-Specific 1v1 Elo &amp; Streaks
                  </h3>
                  <p className="text-xs text-[#929CAF]">
                    Every duel updates both your Overall Elo and your dedicated
                    Topic Elo independently.
                  </p>
                </div>
                <Flame className="h-5 w-5 text-amber-300" />
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {playableTopics.map((t) => {
                  const ts = myEloProfile.topicElos[t.topic];
                  const tElo = ts?.elo ?? STARTING_DUEL_ELO;
                  const diff = tElo - STARTING_DUEL_ELO;
                  const tK = getDuelKFactor(tElo, ts?.duels || 0).k;
                  return (
                    <div
                      key={t.topic}
                      className="rounded-xl border border-white/10 bg-[#090B12] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-white">
                          {t.topic}
                        </span>
                        <span className="font-mono text-sm font-extrabold text-[#83B9FF] tabular-nums">
                          {tElo}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-[#929CAF] tabular-nums">
                        <span>
                          {ts
                            ? `${ts.wins}W-${ts.losses}L-${ts.draws}D`
                            : '0 duels'}
                        </span>
                        <span
                          className={
                            diff >= 0 ? 'text-emerald-300' : 'text-rose-300'
                          }
                        >
                          {diff >= 0 ? `+${diff}` : diff} · K={tK}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-neutral-400 tabular-nums">
                        <span>Peak {ts?.peakElo ?? STARTING_DUEL_ELO}</span>
                        <span>
                          Streak {ts?.currentWinStreak || 0}W (Best{' '}
                          {ts?.bestWinStreak || 0}W)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 1v1 Elo Standings Leaderboard */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  1v1 Competitive Elo Leaderboard
                </h3>
                <p className="text-xs text-[#929CAF]">
                  Strictly calculated from 1v1 Duels — completely separate from
                  Hall of Fame XP rankings.
                </p>
              </div>
              <select
                value={ladderTopicFilter}
                onChange={(e) => setLadderTopicFilter(e.target.value)}
                className="rounded-xl border border-white/15 bg-[#090B12] px-3 py-2 font-mono text-xs text-white"
              >
                <option value="overall">Overall 1v1 Elo</option>
                {playableTopics.map((t) => (
                  <option key={t.topic} value={t.topic}>
                    Topic: {t.topic} Elo
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[11px] text-[#929CAF] uppercase">
                    <th className="py-2.5 pr-3">Rank</th>
                    <th className="py-2.5 px-3">Duelist</th>
                    <th className="py-2.5 px-3">Tier</th>
                    <th className="py-2.5 px-3 text-right">
                      {ladderTopicFilter === 'overall'
                        ? 'Overall Elo'
                        : `${ladderTopicFilter} Elo`}
                    </th>
                    <th className="py-2.5 px-3 text-right">Peak</th>
                    <th className="py-2.5 px-3 text-right">TPR</th>
                    <th className="py-2.5 px-3 text-right">W-L-D</th>
                    <th className="py-2.5 px-3 text-right">Streak</th>
                    <th className="py-2.5 pl-3 text-right">K-Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono tabular-nums">
                  {[...eloLedger.leaderboard]
                    .sort((a, b) => {
                      if (ladderTopicFilter === 'overall') {
                        if (b.overallElo !== a.overallElo) {
                          return b.overallElo - a.overallElo;
                        }
                        return b.wins - a.wins;
                      }
                      const ea =
                        a.topicElos[ladderTopicFilter]?.elo ?? STARTING_DUEL_ELO;
                      const eb =
                        b.topicElos[ladderTopicFilter]?.elo ?? STARTING_DUEL_ELO;
                      if (eb !== ea) return eb - ea;
                      return (
                        (b.topicElos[ladderTopicFilter]?.wins || 0) -
                        (a.topicElos[ladderTopicFilter]?.wins || 0)
                      );
                    })
                    .map((prof, idx) => {
                      const u = users.find((item) => item.id === prof.userId);
                      if (!u) return null;
                      const tStats =
                        ladderTopicFilter === 'overall'
                          ? null
                          : prof.topicElos[ladderTopicFilter];
                      const displayElo = tStats
                        ? tStats.elo
                        : ladderTopicFilter === 'overall'
                          ? prof.overallElo
                          : STARTING_DUEL_ELO;
                      const displayPeak = tStats
                        ? tStats.peakElo
                        : ladderTopicFilter === 'overall'
                          ? prof.peakElo
                          : STARTING_DUEL_ELO;
                      const isMe = u.id === currentUser.id;
                      return (
                        <tr
                          key={u.id}
                          className={
                            isMe ? 'bg-[#3988FF]/10' : 'hover:bg-white/[0.02]'
                          }
                        >
                          <td className="py-3 pr-3 font-bold text-neutral-300">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <span className="font-bold text-white">
                              {u.fullName}
                            </span>
                            {isMe && (
                              <span className="ml-1.5 font-mono text-[10px] text-[#83B9FF]">
                                (You)
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-3 px-3 font-sans font-semibold ${prof.tier.textClass}`}
                          >
                            {prof.tier.name}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-white">
                            {displayElo}
                            {prof.provisional &&
                              ladderTopicFilter === 'overall' && (
                                <span className="ml-1 text-[10px] font-normal text-neutral-400">
                                  *
                                </span>
                              )}
                          </td>
                          <td className="py-3 px-3 text-right text-neutral-300">
                            {displayPeak}
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-300">
                            {prof.performanceRating}
                          </td>
                          <td className="py-3 px-3 text-right text-neutral-300">
                            {tStats
                              ? `${tStats.wins}-${tStats.losses}-${tStats.draws}`
                              : ladderTopicFilter === 'overall'
                                ? `${prof.wins}-${prof.losses}-${prof.draws}`
                                : '0-0-0'}
                          </td>
                          <td className="py-3 px-3 text-right text-amber-300">
                            {tStats
                              ? `${tStats.currentWinStreak}W`
                              : prof.currentStreakCount > 0
                                ? `${prof.currentStreakCount}${prof.currentStreakType}`
                                : '—'}
                          </td>
                          <td className="py-3 pl-3 text-right text-neutral-400">
                            K=
                            {tStats
                              ? getDuelKFactor(tStats.elo, tStats.duels).k
                              : prof.kFactor}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Elo Formula, K-Factor Rules & 7-Tier Reference Guide */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6 lg:col-span-6">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#83B9FF]" />
                <h3 className="font-display text-base font-bold text-white">
                  Elo Math &amp; Dynamic K-Factor Brackets
                </h3>
              </div>
              <div className="space-y-2 rounded-xl border border-white/10 bg-[#090B12] p-4 font-mono text-xs text-neutral-200">
                <p>
                  <span className="text-[#83B9FF]">Expected Win Prob:</span> E =
                  1 / (1 + 10^((R_opp − R_you) / 400))
                </p>
                <p>
                  <span className="text-emerald-300">Rating Update:</span> R&apos;
                  = R + K × (S − E), where S ∈ &#123;1 Win, 0.5 Draw, 0 Loss&#125;
                </p>
                <p>
                  <span className="text-amber-300">Perf Rating (TPR):</span>{' '}
                  Avg(Opp Elo) + 400 × (Wins − Losses) / Duels
                </p>
              </div>
              <div className="grid gap-2 font-mono text-xs sm:grid-cols-2">
                {[
                  {
                    k: 'K = 40',
                    desc: 'Provisional (<5 duels) — fast calibration',
                  },
                  {
                    k: 'K = 32',
                    desc: 'Standard (<1600 Elo) — normal swings',
                  },
                  {
                    k: 'K = 24',
                    desc: 'Master (1600–1999 Elo) — stabilized rating',
                  },
                  {
                    k: 'K = 16',
                    desc: 'Sovereign (2000+ Elo) — elite precision',
                  },
                ].map((item) => (
                  <div
                    key={item.k}
                    className="rounded-xl border border-white/10 bg-[#090B12] px-3 py-2.5"
                  >
                    <span className="font-bold text-[#83B9FF]">{item.k}</span>
                    <p className="mt-0.5 text-[11px] text-[#929CAF]">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#111827] p-6 lg:col-span-6">
              <h3 className="font-display text-base font-bold text-white">
                7 Competitive Elo Tiers (Starting Baseline: {STARTING_DUEL_ELO})
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {DUEL_ELO_TIERS.map((tier) => {
                  const isMine = myEloProfile.tier.id === tier.id;
                  return (
                    <div
                      key={tier.id}
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs ${
                        isMine
                          ? `${tier.borderClass} ${tier.bgClass}`
                          : 'border-white/10 bg-[#090B12]'
                      }`}
                    >
                      <span className={`font-bold ${tier.textClass}`}>
                        {tier.name}
                        {isMine ? ' (You)' : ''}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-300 tabular-nums">
                        {tier.maxElo === null
                          ? `${tier.minElo}+`
                          : `${tier.minElo}–${tier.maxElo}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
