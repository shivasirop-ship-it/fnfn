import { FormEvent, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Award,
  Bell,
  Castle,
  CheckCircle2,
  Clock,
  Compass,
  Eye,
  Fingerprint,
  LineChart,
  MessageSquare,
  Send,
  ShieldCheck,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ChallengeClaimRequest,
  ConfidenceLevel,
  DqrUser,
  DuelConfig,
  DuelMatch,
  DuelParticipantProgress,
  DuelQuestion,
  QuizRecord,
  RankDef,
  RivalRecord,
  SystemChallenge,
  SystemConfig,
  SystemGuidanceItem,
  SystemMessage,
  SystemPrediction,
  SystemPredictionCategory,
  SystemSubTab,
  Territory,
  VerdictRecord,
} from '../types';
import { RivalPanel } from './RivalPanel';
import { DuelSystemPanel } from './DuelSystemPanel';

interface SystemPageProps {
  currentUser: DqrUser;
  users: DqrUser[];
  ranks: RankDef[];
  config: SystemConfig;
  messages: SystemMessage[];
  predictions: SystemPrediction[];
  guidance: SystemGuidanceItem[];
  challenges: SystemChallenge[];
  challengeClaims: ChallengeClaimRequest[];
  verdict: VerdictRecord | undefined;
  quizzes: QuizRecord[];
  territories: Territory[];
  rivalries: RivalRecord[];
  onSendMessage: (userId: string, text: string) => void;
  onMarkMessagesRead: (userId: string) => void;
  onClaimChallenge: (challengeId: string, userId: string, note?: string) => void;
  onSendRivalRequest: (requesterId: string, recipientId: string) => string | null;
  onRespondRivalRequest: (rivalryId: string, accept: boolean) => void;
  onCancelRivalRequest: (rivalryId: string) => void;
  onEndRivalry: (rivalryId: string, endedByUserId: string) => void;
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

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getCategoryStyle(category: SystemPredictionCategory) {
  switch (category) {
    case 'Rank Projection':
      return { color: '#3988FF', icon: TrendingUp };
    case 'Leaderboard Forecast':
      return { color: '#A78BFA', icon: Trophy };
    case 'Territorial Forecast':
      return { color: '#EF4444', icon: Castle };
    case 'Performance Prediction':
      return { color: '#83B9FF', icon: LineChart };
    case 'Competition Forecast':
      return { color: '#F59E0B', icon: Swords };
    case 'Special Prediction':
      return { color: '#C0C7D4', icon: Eye };
  }
}

function getConfidenceWidth(conf: ConfidenceLevel): string {
  if (conf === 'HIGH CONFIDENCE') return '90%';
  if (conf === 'MODERATE CONFIDENCE') return '60%';
  return '32%';
}

export function SystemPage({
  currentUser,
  users,
  ranks,
  config,
  messages,
  predictions,
  guidance,
  challenges,
  challengeClaims,
  verdict,
  quizzes,
  territories,
  rivalries,
  onSendMessage,
  onMarkMessagesRead,
  onClaimChallenge,
  onSendRivalRequest,
  onRespondRivalRequest,
  onCancelRivalRequest,
  onEndRivalry,
  duelConfig,
  duelQuestions,
  duelMatches,
  onSendDuelRequest,
  onRespondDuelRequest,
  onCancelDuelRequest,
  onUpdateDuelProgress,
  onFlagDuelQuestion,
}: SystemPageProps) {
  const [subTab, setSubTab] = useState<SystemSubTab>('overview');
  const [messageInput, setMessageInput] = useState('');
  const [selectedPrediction, setSelectedPrediction] =
    useState<SystemPrediction | null>(null);
  const [selectedChallenge, setSelectedChallenge] =
    useState<SystemChallenge | null>(null);
  const [claimNoteInput, setClaimNoteInput] = useState('');
  const [challengeFilter, setChallengeFilter] = useState<
    'all' | 'open' | 'pending' | 'verified'
  >('all');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter private + global records for currentUser
  const userMessages = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    return messages
      .filter((m) => m.userId === currentUser.id && m.createdAt >= cutoff)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [messages, currentUser.id]);

  const unreadCount = useMemo(
    () =>
      userMessages.filter((m) => m.sender === 'system' && !m.readByUser).length,
    [userMessages]
  );

  const incomingRivalRequestCount = useMemo(
    () =>
      rivalries.filter(
        (r) => r.status === 'pending' && r.recipientId === currentUser.id
      ).length,
    [rivalries, currentUser.id]
  );

  const incomingDuelRequestCount = useMemo(
    () =>
      duelMatches.filter(
        (m) =>
          m.status === 'pending' &&
          m.opponentId === currentUser.id &&
          m.expiresAt > Date.now()
      ).length,
    [duelMatches, currentUser.id]
  );

  const visiblePredictions = useMemo(
    () =>
      predictions.filter(
        (p) =>
          p.published &&
          (p.targetUserId === 'all' || p.targetUserId === currentUser.id)
      ),
    [predictions, currentUser.id]
  );

  const activePredictions = visiblePredictions.filter(
    (p) => !p.expiresAt || p.expiresAt >= todayStr
  );
  const expiredPredictions = visiblePredictions.filter(
    (p) => p.expiresAt && p.expiresAt < todayStr
  );

  const userGuidanceProfile = config.perUserGuidance?.[currentUser.id] || {
    strategicAdvice:
      'Maintain daily preparation discipline and expand your territorial standing.',
    nextObjective:
      'Complete your next active System challenge and maintain your streak.',
  };

  const visibleGuidance = useMemo(
    () => guidance.filter((g) => g.targetUserId === currentUser.id),
    [guidance, currentUser.id]
  );

  const visibleChallenges = useMemo(
    () =>
      challenges.filter(
        (c) => c.targetUserId === 'all' || c.targetUserId === currentUser.id
      ),
    [challenges, currentUser.id]
  );

  const userClaimMap = useMemo(() => {
    const map = new Map<string, ChallengeClaimRequest>();
    const sorted = [...challengeClaims]
      .filter((cl) => cl.userId === currentUser.id)
      .sort((a, b) => b.submittedAt - a.submittedAt);
    for (const cl of sorted) {
      if (!map.has(cl.challengeId)) {
        map.set(cl.challengeId, cl);
      }
    }
    return map;
  }, [challengeClaims, currentUser.id]);

  const userPendingClaimCount = useMemo(
    () =>
      visibleChallenges.filter(
        (c) =>
          !c.completedByUserIds.includes(currentUser.id) &&
          userClaimMap.get(c.id)?.status === 'pending'
      ).length,
    [visibleChallenges, userClaimMap, currentUser.id]
  );

  const filteredChallenges = useMemo(() => {
    return visibleChallenges.filter((chl) => {
      const completed = chl.completedByUserIds.includes(currentUser.id);
      const claimStatus = userClaimMap.get(chl.id)?.status;
      if (challengeFilter === 'verified') return completed;
      if (challengeFilter === 'pending')
        return !completed && claimStatus === 'pending';
      if (challengeFilter === 'open')
        return !completed && claimStatus !== 'pending' && chl.status !== 'EXPIRED';
      return true;
    });
  }, [visibleChallenges, challengeFilter, currentUser.id, userClaimMap]);

  // Real user performance calculations for Guidance & Challenge verification
  const userStats = useMemo(() => {
    const playerQuizzes = quizzes.filter((q) =>
      q.players.some(
        (p) => p.toLowerCase() === currentUser.fullName.toLowerCase()
      )
    );
    const goldWins = playerQuizzes.filter((q) => q.position === '1st').length;
    const heldTerritories = territories.filter(
      (t) => t.currentHolderUserId === currentUser.id
    );
    return {
      quizCount: playerQuizzes.length,
      goldWins,
      heldTerritoriesCount: heldTerritories.length,
      heldTerritoryNames: heldTerritories.map((t) => t.name),
    };
  }, [quizzes, territories, currentUser]);

  const handleOpenSubTab = (tab: SystemSubTab) => {
    setSubTab(tab);
    if (tab === 'communication' && unreadCount > 0) {
      onMarkMessagesRead(currentUser.id);
    }
  };

  const handleSendChat = (e: FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    onSendMessage(currentUser.id, messageInput.trim());
    setMessageInput('');
  };

  const navCards: {
    id: SystemSubTab;
    label: string;
    desc: string;
    icon: typeof MessageSquare;
  }[] = [
    {
      id: 'communication',
      label: 'Communication',
      desc: 'Talk from the System · Submit inquiries',
      icon: MessageSquare,
    },
    {
      id: 'predictions',
      label: 'Predictions',
      desc: 'What lies ahead? · System forecasts',
      icon: Eye,
    },
    {
      id: 'guidance',
      label: 'Guidance',
      desc: 'Your next direction · Strengths & focus',
      icon: Compass,
    },
    {
      id: 'challenges',
      label: 'Challenges',
      desc: 'Prove your potential · Submit claims for XP verification',
      icon: Target,
    },
    {
      id: 'verdict',
      label: 'System Verdict',
      desc: 'Your current competitive identity',
      icon: Fingerprint,
    },
    {
      id: 'rival',
      label: 'Rival',
      desc: 'Friendly competition · Compare stats & timeline',
      icon: Swords,
    },
    {
      id: 'duel',
      label: '1v1',
      desc: 'Topic-wise live quiz duels (1,000 XP) · Head-to-Head',
      icon: Zap,
    },
  ];

  return (
    <div className="min-h-screen bg-[#090B12] text-[#E5E7EB]">
      {/* SYSTEM HEADER BAR */}
      <div className="border-b border-[#3988FF]/25 bg-[#0c101b] px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#3988FF]/50 bg-[#111827] text-[#3988FF] shadow-[0_0_20px_rgba(57,136,255,0.22)]">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-mono text-lg font-bold tracking-[0.2em] text-[#83B9FF]">
                    SYSTEM
                  </h1>
                  <span className="font-mono text-[11px] text-emerald-400">
                    {config.online ? 'ONLINE' : 'STANDBY'}
                  </span>
                </div>
                <p className="text-xs text-[#929CAF]">
                  YOUR PERSONAL INTELLIGENCE INTERFACE · ID:{' '}
                  <span className="text-[#E5E7EB]">{currentUser.fullName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs text-[#929CAF]">
              <span>DATE: {todayStr}</span>
              <button
                type="button"
                onClick={() => handleOpenSubTab('communication')}
                className="relative flex items-center gap-1.5 rounded-lg border border-[#3988FF]/30 bg-[#111827] px-3 py-1.5 text-[#83B9FF] hover:border-[#3988FF] cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>{unreadCount} Unread</span>
              </button>
            </div>
          </div>

          {/* Sub-tab Strip */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleOpenSubTab('overview')}
              className={`relative rounded-lg border px-3.5 py-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'overview'
                  ? 'border-[#3988FF] bg-[#3988FF]/15 text-[#83B9FF] shadow-[0_0_16px_rgba(57,136,255,0.18)]'
                  : 'border-white/10 bg-[#111827] text-[#929CAF] hover:border-[#3988FF]/40 hover:text-white'
              }`}
            >
              Overview
            </button>
            {navCards.map((c) => {
              const Icon = c.icon;
              const active = subTab === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleOpenSubTab(c.id)}
                  className={`relative inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'border-[#3988FF] bg-[#3988FF]/15 text-[#83B9FF] shadow-[0_0_16px_rgba(57,136,255,0.18)]'
                      : 'border-white/10 bg-[#111827] text-[#929CAF] hover:border-[#3988FF]/40 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{c.label}</span>
                  {c.id === 'challenges' && userPendingClaimCount > 0 && (
                    <span className="rounded bg-amber-400/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300 tabular-nums">
                      {userPendingClaimCount} Pending
                    </span>
                  )}
                  {c.id === 'rival' && incomingRivalRequestCount > 0 && (
                    <span className="font-mono text-[11px] font-bold text-[#A78BFA] tabular-nums">
                      ({incomingRivalRequestCount})
                    </span>
                  )}
                  {c.id === 'duel' && incomingDuelRequestCount > 0 && (
                    <span className="font-mono text-[11px] font-bold text-amber-300 tabular-nums">
                      ({incomingDuelRequestCount})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
        <AnimatePresence mode="wait">
          {/* ================= OVERVIEW LANDING ================= */}
          {subTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {/* Welcome Panel */}
              <div className="rounded-2xl border border-[#3988FF]/45 bg-gradient-to-br from-[#111827] via-[#151D2C] to-[#0c1220] p-7 shadow-[0_0_40px_rgba(57,136,255,0.10)]">
                <p className="font-mono text-xs tracking-[0.22em] text-[#3988FF] uppercase">
                  IDENTIFICATION CONFIRMED
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                  Welcome back, {currentUser.fullName}.
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#929CAF]">
                  {config.welcomeTemplate}
                </p>

                <div className="mt-5 rounded-xl border border-[#83B9FF]/25 bg-[#090B12]/70 p-4">
                  <p className="font-mono text-[11px] font-bold text-[#83B9FF] uppercase">
                    Latest System Directive
                  </p>
                  <p className="mt-1 text-sm text-[#E5E7EB]">
                    {config.globalAnnouncement}
                  </p>
                </div>
              </div>

              {/* 6 Sub-Tab Interactive Navigation Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {navCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <motion.button
                      key={card.id}
                      type="button"
                      whileHover={{ y: -4 }}
                      onClick={() => handleOpenSubTab(card.id)}
                      className="group flex items-start gap-4 rounded-2xl border border-[#3988FF]/25 bg-[#151D2C] p-5 text-left transition-colors hover:border-[#3988FF]/70 cursor-pointer"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#3988FF]/35 bg-[#111827] text-[#3988FF] group-hover:text-[#83B9FF]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-mono text-sm font-bold text-white group-hover:text-[#83B9FF]">
                          {card.label}
                        </h3>
                        <p className="mt-1 text-xs text-[#929CAF]">
                          {card.desc}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Overview Summary Cards (4 Modules) */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#A78BFA]/30 bg-[#111827] p-5">
                  <p className="font-mono text-[11px] font-bold text-[#A78BFA] uppercase">
                    Latest Prediction
                  </p>
                  <p className="mt-2 font-semibold text-white">
                    {activePredictions[0]?.title || 'No active projections.'}
                  </p>
                  <p className="mt-1 text-xs text-[#929CAF]">
                    {activePredictions[0]?.preview ||
                      'Awaiting administrative forecast.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#3988FF]/30 bg-[#111827] p-5">
                  <p className="font-mono text-[11px] font-bold text-[#83B9FF] uppercase">
                    Recommended Guidance
                  </p>
                  <p className="mt-2 font-semibold text-white">
                    {visibleGuidance[0]?.title || 'Maintain current discipline.'}
                  </p>
                  <p className="mt-1 text-xs text-[#929CAF]">
                    {visibleGuidance[0]?.recommendedAction ||
                      userGuidanceProfile.nextObjective}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#111827] p-5">
                  <p className="font-mono text-[11px] font-bold text-[#F59E0B] uppercase">
                    Active Challenge
                  </p>
                  <p className="mt-2 font-semibold text-white">
                    {visibleChallenges[0]?.title || 'No active test assigned.'}
                  </p>
                  <p className="mt-1 text-xs text-[#929CAF]">
                    {visibleChallenges[0]?.requirementText ||
                      'Check Challenges tab for updates.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#3988FF]/30 bg-[#111827] p-5">
                  <p className="font-mono text-[11px] font-bold text-[#3988FF] uppercase">
                    System Verdict &amp; Claims
                  </p>
                  <p className="mt-2 font-semibold text-white">
                    {verdict?.classification || 'Unassigned Competitive Verdict'}
                  </p>
                  <p className="mt-1 text-xs text-[#929CAF]">
                    {userPendingClaimCount > 0
                      ? `${userPendingClaimCount} challenge XP claim${userPendingClaimCount === 1 ? '' : 's'} awaiting Admin verification.`
                      : verdict?.description ||
                        'Open System Verdict or submit Challenge XP claims for verification.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= 1. COMMUNICATION (ASK THE SYSTEM) ================= */}
          {subTab === 'communication' && (
            <motion.div
              key="comm"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-[#3988FF]/35 bg-[#111827] overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#151D2C] px-6 py-4">
                <div>
                  <h2 className="font-mono text-base font-bold tracking-wider text-[#83B9FF]">
                    SYSTEM COMMUNICATION
                  </h2>
                  <p className="text-xs text-[#929CAF]">
                    Submit your inquiry. The System awaits. (7-day message
                    retention active)
                  </p>
                </div>
                <span className="font-mono text-xs text-emerald-400">
                  TERMINAL: {config.online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              {/* Conversation History */}
              <div className="max-h-[420px] space-y-4 overflow-y-auto p-6">
                {/* Initial default greeting if empty */}
                {userMessages.length === 0 && (
                  <div className="max-w-lg rounded-2xl border border-[#3988FF]/35 bg-[#151D2C] p-4">
                    <p className="font-mono text-[10px] font-bold text-[#3988FF] uppercase">
                      SYSTEM
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-line text-[#E5E7EB]">
                      IDENTIFICATION CONFIRMED.{'\n'}What would you like to know,
                      Hunter? Submit your inquiry. The System awaits.
                    </p>
                  </div>
                )}

                {userMessages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-lg rounded-2xl border p-4 ${
                          isUser
                            ? 'border-[#A78BFA]/40 bg-[#1e1b33] text-white'
                            : 'border-[#3988FF]/40 bg-[#151D2C] text-[#E5E7EB]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 font-mono text-[10px]">
                          <span
                            className={
                              isUser ? 'text-[#A78BFA]' : 'text-[#3988FF]'
                            }
                          >
                            {isUser ? currentUser.fullName.toUpperCase() : 'SYSTEM'}
                          </span>
                          <span className="text-[#929CAF]">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line">
                          {msg.text}
                        </p>
                        {isUser && (
                          <p className="mt-1 text-right font-mono text-[10px] text-[#929CAF]">
                            {msg.readByAdmin ? 'Read by Admin' : 'Delivered'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSendChat}
                className="flex gap-3 border-t border-white/10 bg-[#0d121f] p-4"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Ask about ranks, quizzes, territories, or your progression..."
                  className="flex-1 rounded-xl border border-[#3988FF]/30 bg-[#090B12] px-4 py-2.5 text-sm text-white placeholder-[#929CAF] focus:border-[#3988FF] focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#3988FF] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#83B9FF] hover:text-[#090B12] cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Transmit</span>
                </button>
              </form>
            </motion.div>
          )}

          {/* ================= 2. PREDICTIONS ================= */}
          {subTab === 'predictions' && (
            <motion.div
              key="pred"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h2 className="font-mono text-2xl font-bold text-[#83B9FF]">
                  SYSTEM PREDICTIONS
                </h2>
                <p className="mt-1 text-xs text-[#929CAF]">
                  The future is uncertain. The System has its projections.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {activePredictions.map((pred) => {
                  const style = getCategoryStyle(pred.category);
                  const Icon = style.icon;
                  return (
                    <motion.button
                      key={pred.id}
                      type="button"
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedPrediction(pred)}
                      style={{ borderColor: `${style.color}55` }}
                      className="flex flex-col justify-between rounded-2xl border bg-[#151D2C] p-5 text-left transition-all hover:bg-[#192336] cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span
                            style={{ color: style.color }}
                            className="font-mono text-[11px] font-bold uppercase"
                          >
                            {pred.category}
                          </span>
                          <Icon
                            style={{ color: style.color }}
                            className="h-4 w-4"
                          />
                        </div>
                        <h3 className="mt-2.5 font-display text-lg font-bold text-white">
                          {pred.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-[#929CAF]">
                          {pred.preview}
                        </p>
                      </div>

                      <div className="mt-5">
                        <div className="flex justify-between font-mono text-[10px] text-[#E5E7EB]">
                          <span>{pred.confidence}</span>
                          <span>{pred.publishedAt}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                          <div
                            style={{
                              width: getConfidenceWidth(pred.confidence),
                              backgroundColor: style.color,
                            }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {expiredPredictions.length > 0 && (
                <div className="border-t border-white/10 pt-6">
                  <h3 className="font-mono text-xs font-bold tracking-wider text-[#929CAF] uppercase">
                    Prediction Archive ({expiredPredictions.length})
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {expiredPredictions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPrediction(p)}
                        className="rounded-xl border border-white/10 bg-[#111827] p-4 text-left opacity-75 hover:opacity-100 cursor-pointer"
                      >
                        <p className="font-mono text-[10px] text-[#929CAF]">
                          {p.category} · Expired {p.expiresAt}
                        </p>
                        <p className="mt-1 font-semibold text-white">
                          {p.title}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ================= 3. GUIDANCE ================= */}
          {subTab === 'guidance' && (
            <motion.div
              key="guidance"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h2 className="font-mono text-2xl font-bold text-[#83B9FF]">
                  STRATEGIC GUIDANCE
                </h2>
                <p className="mt-1 text-xs text-[#929CAF]">
                  Identify your weaknesses. Refine your approach.
                </p>
              </div>

              {/* Real Data Strengths & Attention */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-[#3988FF]/35 bg-[#151D2C] p-6">
                  <p className="font-mono text-xs font-bold text-[#83B9FF] uppercase">
                    A. Demonstrated Strengths
                  </p>
                  <ul className="mt-4 space-y-2.5 text-sm text-[#E5E7EB]">
                    <li>
                      • Favourite Subject Focus:{' '}
                      <span className="font-semibold text-white">
                        {currentUser.favouriteTopic}
                      </span>
                    </li>
                    <li>
                      • District Quiz Appearances:{' '}
                      <span className="font-mono font-bold text-[#83B9FF]">
                        {userStats.quizCount}
                      </span>{' '}
                      ({userStats.goldWins} Gold finishes)
                    </li>
                    <li>
                      • Active Territories Held:{' '}
                      <span className="font-mono font-bold text-[#83B9FF]">
                        {userStats.heldTerritoriesCount}
                      </span>
                      {userStats.heldTerritoryNames.length > 0
                        ? ` (${userStats.heldTerritoryNames.join(', ')})`
                        : ''}
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#F59E0B]/35 bg-[#151D2C] p-6">
                  <p className="font-mono text-xs font-bold text-[#F59E0B] uppercase">
                    B. Areas Requiring Attention
                  </p>
                  <ul className="mt-4 space-y-2.5 text-sm text-[#E5E7EB]">
                    <li>
                      • Daily Streak Status:{' '}
                      <span className="font-mono font-bold text-[#F59E0B]">
                        {currentUser.streak} days
                      </span>{' '}
                      (Protect continuity daily)
                    </li>
                    <li>
                      • Territory Expansion:{' '}
                      {userStats.heldTerritoriesCount === 0
                        ? 'Zero territories held. Enter Territory #03 to establish footing.'
                        : 'Defend current holdings against challengers preparing higher scores.'}
                    </li>
                    <li>
                      • Cross-Category Coverage: Strengthen weaker non-primary
                      rounds to avoid narrow tie-breaker losses.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Admin Per-User Strategic Advice & Next Objective */}
              <div className="grid gap-5 md:grid-cols-12">
                <div className="rounded-2xl border border-[#A78BFA]/40 bg-[#111827] p-6 md:col-span-7">
                  <p className="font-mono text-xs font-bold text-[#A78BFA] uppercase">
                    D. Personal Strategic Advice · {currentUser.fullName}
                  </p>
                  <p className="mt-3 font-display text-xl italic leading-relaxed text-white">
                    “{userGuidanceProfile.strategicAdvice}”
                  </p>
                </div>
                <div className="rounded-2xl border border-[#3988FF]/45 bg-[#151D2C] p-6 md:col-span-5">
                  <p className="font-mono text-xs font-bold text-[#3988FF] uppercase">
                    E. Next Objective
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#E5E7EB]">
                    {userGuidanceProfile.nextObjective}
                  </p>
                </div>
              </div>

              {/* Recommended Actions (Strictly Personal) */}
              {visibleGuidance.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-8 text-center text-xs text-[#929CAF]">
                  No individual guidance cards issued for {currentUser.fullName}{' '}
                  yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleGuidance.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-2xl border border-white/10 bg-[#111827] p-5"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-[#83B9FF]">{g.category}</span>
                        <span
                          className={
                            g.priority === 'HIGH'
                              ? 'text-[#EF4444]'
                              : g.priority === 'MEDIUM'
                                ? 'text-[#F59E0B]'
                                : 'text-[#929CAF]'
                          }
                        >
                          PRIORITY: {g.priority}
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-lg font-bold text-white">
                        {g.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-[#929CAF]">
                        {g.explanation}
                      </p>
                      <p className="mt-3 rounded-lg bg-[#151D2C] p-3 text-xs font-medium text-[#E5E7EB]">
                        Action: {g.recommendedAction}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= 4. CHALLENGES ================= */}
          {subTab === 'challenges' && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-7"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-mono text-2xl font-bold text-[#83B9FF]">
                    YOUR NEXT TEST
                  </h2>
                  <p className="mt-1 text-xs text-[#929CAF]">
                    Potential means nothing without proof. Submitted XP claims
                    enter Admin verification before XP is granted.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-[#111827] p-1">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'open', label: 'Open' },
                      {
                        id: 'pending',
                        label: `Pending (${userPendingClaimCount})`,
                      },
                      { id: 'verified', label: 'Verified' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setChallengeFilter(f.id)}
                      className={`rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                        challengeFilter === f.id
                          ? 'bg-[#3988FF] text-white shadow-sm'
                          : 'text-[#929CAF] hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredChallenges.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-10 text-center text-sm text-[#929CAF]">
                  No challenges match this filter right now.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filteredChallenges.map((chl) => {
                    const completedByUser = chl.completedByUserIds.includes(
                      currentUser.id
                    );
                    const latestClaim = userClaimMap.get(chl.id);
                    const isPending =
                      !completedByUser && latestClaim?.status === 'pending';
                    const isRejected =
                      !completedByUser && latestClaim?.status === 'rejected';

                    const statusBadge = completedByUser
                      ? {
                          label: 'VERIFIED · COMPLETED',
                          cls: 'text-emerald-300 border-emerald-400/35 bg-emerald-500/10',
                        }
                      : isPending
                        ? {
                            label: 'PENDING ADMIN VERIFICATION',
                            cls: 'text-amber-300 border-amber-400/35 bg-amber-500/10',
                          }
                        : isRejected
                          ? {
                              label: 'REJECTED · RETRY',
                              cls: 'text-rose-300 border-rose-400/35 bg-rose-500/10',
                            }
                          : chl.status === 'EXPIRED'
                            ? {
                                label: 'EXPIRED',
                                cls: 'text-[#EF4444] border-[#EF4444]/35 bg-[#EF4444]/10',
                              }
                            : {
                                label: chl.status,
                                cls: 'text-[#83B9FF] border-[#3988FF]/35 bg-[#3988FF]/10',
                              };

                    return (
                      <motion.div
                        key={chl.id}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => {
                          setClaimNoteInput('');
                          setSelectedChallenge(chl);
                        }}
                        className={`flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-colors ${
                          isPending
                            ? 'border-amber-400/45 bg-[#151D2C] hover:border-amber-300'
                            : completedByUser
                              ? 'border-emerald-400/35 bg-[#111e1d] hover:border-emerald-300'
                              : 'border-[#3988FF]/30 bg-[#151D2C] hover:border-[#83B9FF]'
                        }`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                            <span className="text-[#A78BFA]">
                              {chl.category} · {chl.difficulty}
                            </span>
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusBadge.cls}`}
                            >
                              {statusBadge.label}
                            </span>
                          </div>
                          <h3 className="mt-2.5 font-display text-lg font-bold text-white">
                            {chl.title}
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-[#929CAF]">
                            {chl.description}
                          </p>
                          {isRejected && latestClaim?.adminNote && (
                            <p className="mt-2.5 rounded-lg border border-rose-400/25 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-200">
                              Admin Note: {latestClaim.adminNote}
                            </p>
                          )}
                        </div>

                        <div className="mt-5 border-t border-white/10 pt-3 font-mono text-xs">
                          <div className="flex items-center justify-between text-[#83B9FF]">
                            <span>Reward: +{chl.rewardXp} XP</span>
                            <span>Due: {chl.deadline}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= 5. SYSTEM VERDICT ================= */}
          {subTab === 'verdict' && (
            <motion.div
              key="verdict"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-mono text-2xl font-bold text-[#83B9FF]">
                  COMPETITIVE IDENTITY
                </h2>
                <p className="mt-1 text-xs text-[#929CAF]">
                  Your performance defines your standing. Separate from official
                  DQR Grades.
                </p>
              </div>

              {!verdict ? (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-10 text-center text-sm text-[#929CAF]">
                  No System Verdict has been assigned to your profile yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Main Classification Panel */}
                  <div className="rounded-3xl border border-[#3988FF]/50 bg-gradient-to-br from-[#111827] via-[#151D2C] to-[#0c1220] p-8 shadow-[0_0_50px_rgba(57,136,255,0.14)]">
                    <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                      <span className="text-[#83B9FF]">
                        STATUS: {verdict.status}
                      </span>
                      <span className="text-[#929CAF]">
                        ASSIGNED: {verdict.assignedDate}
                      </span>
                    </div>

                    <h3 className="mt-4 font-mono text-3xl font-extrabold tracking-widest text-white sm:text-5xl">
                      {verdict.classification}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#E5E7EB]">
                      {verdict.description}
                    </p>
                  </div>

                  {/* A–D Details */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      {
                        label: 'A. Performance Characteristics',
                        val: verdict.performanceCharacteristics,
                        accent: '#3988FF',
                      },
                      {
                        label: 'B. Strongest Attribute',
                        val: verdict.strongestAttribute,
                        accent: '#83B9FF',
                      },
                      {
                        label: 'C. Biggest Weakness',
                        val: verdict.biggestWeakness,
                        accent: '#F59E0B',
                      },
                      {
                        label: 'D. Competitive Tendencies',
                        val: verdict.competitiveTendencies,
                        accent: '#A78BFA',
                      },
                    ].map((block) => (
                      <div
                        key={block.label}
                        className="rounded-2xl border border-white/10 bg-[#111827] p-5"
                      >
                        <p
                          style={{ color: block.accent }}
                          className="font-mono text-xs font-bold uppercase"
                        >
                          {block.label}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[#E5E7EB]">
                          {block.val}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* E. Previous Classifications */}
                  <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
                    <p className="font-mono text-xs font-bold text-[#929CAF] uppercase">
                      E. Classification History
                    </p>
                    <div className="mt-3 space-y-2">
                      {verdict.history.map((h, i) => (
                        <div
                          key={`${h.classification}-${i}`}
                          className="flex justify-between rounded-lg bg-[#151D2C] px-4 py-2.5 font-mono text-xs"
                        >
                          <span className="font-bold text-white">
                            {h.classification}
                          </span>
                          <span className="text-[#929CAF]">
                            {h.assignedDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {/* ================= 7. RIVAL ================= */}
          {subTab === 'rival' && (
            <RivalPanel
              currentUser={currentUser}
              users={users}
              ranks={ranks}
              territories={territories}
              challenges={challenges}
              rivalries={rivalries}
              onSendRivalRequest={onSendRivalRequest}
              onRespondRivalRequest={onRespondRivalRequest}
              onCancelRivalRequest={onCancelRivalRequest}
              onEndRivalry={onEndRivalry}
            />
          )}
          {/* ================= 8. 1V1 DUEL ================= */}
          {subTab === 'duel' && (
            <DuelSystemPanel
              currentUser={currentUser}
              users={users}
              ranks={ranks}
              duelConfig={duelConfig}
              duelQuestions={duelQuestions}
              duelMatches={duelMatches}
              onSendDuelRequest={onSendDuelRequest}
              onRespondDuelRequest={onRespondDuelRequest}
              onCancelDuelRequest={onCancelDuelRequest}
              onUpdateDuelProgress={onUpdateDuelProgress}
              onFlagDuelQuestion={onFlagDuelQuestion}
            />
          )}
        </AnimatePresence>

        {/* System Closing Motto */}
        <p className="mt-14 border-t border-white/10 pt-6 text-center font-mono text-xs tracking-[0.22em] text-[#929CAF]">
          THE SYSTEM OBSERVES. THE SYSTEM EVALUATES. THE USER PROVES.
        </p>
      </div>

      {/* PREDICTION DETAIL MODAL */}
      <AnimatePresence>
        {selectedPrediction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPrediction(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-[#3988FF]/50 bg-[#111827] p-6 text-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-bold text-[#83B9FF]">
                    {selectedPrediction.category} ·{' '}
                    {selectedPrediction.confidence}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold">
                    {selectedPrediction.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPrediction(null)}
                  className="rounded-lg p-1 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#E5E7EB]">
                {selectedPrediction.fullText}
              </p>
              <p className="mt-4 font-mono text-xs text-[#929CAF]">
                Published: {selectedPrediction.publishedAt}
                {selectedPrediction.expiresAt
                  ? ` · Expires: ${selectedPrediction.expiresAt}`
                  : ''}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHALLENGE DETAIL MODAL */}
      <AnimatePresence>
        {selectedChallenge && (() => {
          const isCompleted = selectedChallenge.completedByUserIds.includes(
            currentUser.id
          );
          const latestClaim = userClaimMap.get(selectedChallenge.id);
          const isPending = !isCompleted && latestClaim?.status === 'pending';
          const isRejected = !isCompleted && latestClaim?.status === 'rejected';

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setSelectedChallenge(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-[#3988FF]/50 bg-[#111827] p-6 text-white shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs font-bold text-[#A78BFA]">
                      {selectedChallenge.category} ·{' '}
                      {selectedChallenge.difficulty}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-bold">
                      {selectedChallenge.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedChallenge(null)}
                    className="rounded-lg p-1 text-white/60 hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="mt-3 text-sm text-[#E5E7EB]">
                  {selectedChallenge.description}
                </p>

                <div className="mt-4 space-y-2 rounded-xl bg-[#090B12] p-4 font-mono text-xs">
                  <p>Requirement: {selectedChallenge.requirementText}</p>
                  <p className="text-[#83B9FF]">
                    Reward: +{selectedChallenge.rewardXp} XP
                  </p>
                  <p className="text-[#929CAF]">
                    Deadline: {selectedChallenge.deadline}
                  </p>
                </div>

                {isCompleted && (
                  <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                    <span>
                      Verified by Admin · +{selectedChallenge.rewardXp} XP has
                      been credited to your account.
                    </span>
                  </div>
                )}

                {isPending && latestClaim && (
                  <div className="mt-5 space-y-1.5 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-xs text-amber-100">
                    <div className="flex items-center gap-2 font-mono font-bold text-amber-300">
                      <Clock className="h-4 w-4" />
                      <span>PENDING ADMIN VERIFICATION</span>
                    </div>
                    <p className="text-amber-100/80">
                      Submitted {new Date(latestClaim.submittedAt).toLocaleString()}.
                      XP will be awarded once an Administrator verifies your claim.
                    </p>
                    {latestClaim.note && (
                      <p className="rounded-lg bg-black/30 px-2.5 py-1.5 text-[11px] text-amber-100">
                        Your note: {latestClaim.note}
                      </p>
                    )}
                  </div>
                )}

                {!isCompleted &&
                  !isPending &&
                  selectedChallenge.status !== 'EXPIRED' && (
                    <div className="mt-5 space-y-3">
                      {isRejected && latestClaim && (
                        <div className="flex items-start gap-2 rounded-xl border border-rose-400/35 bg-rose-500/10 p-3 text-xs text-rose-200">
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                          <div>
                            <p className="font-mono font-bold">
                              Previous Claim Not Approved
                            </p>
                            {latestClaim.adminNote && (
                              <p className="mt-0.5 text-rose-100/90">
                                {latestClaim.adminNote}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="mb-1 block font-mono text-[11px] text-[#929CAF]">
                          Verification Note / Proof (optional)
                        </label>
                        <input
                          type="text"
                          value={claimNoteInput}
                          onChange={(e) => setClaimNoteInput(e.target.value)}
                          placeholder="e.g. Held Shadow Citadel today / reached 14-day streak..."
                          className="w-full rounded-xl border border-[#3988FF]/30 bg-[#090B12] px-3.5 py-2 text-xs text-white placeholder-[#929CAF]/70 focus:border-[#3988FF] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClaimChallenge(
                            selectedChallenge.id,
                            currentUser.id,
                            claimNoteInput
                          );
                          setClaimNoteInput('');
                          setSelectedChallenge(null);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3988FF] py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#83B9FF] hover:text-[#090B12] cursor-pointer"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>
                          {isRejected
                            ? 'Resubmit Claim for Verification'
                            : 'Claim XP (Submit for Admin Verification)'}
                        </span>
                      </button>
                    </div>
                  )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
