import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Castle,
  Check,
  Clock,
  Crown,
  Flame,
  History,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Swords,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import {
  DqrUser,
  RankDef,
  RivalHistoryEvent,
  RivalHistoryEventType,
  RivalRecord,
  SystemChallenge,
  Territory,
} from '../types';
import {
  countUserTerritories,
  formatRivalDate,
  formatRivalTimestamp,
  getOverallEncouragement,
  parseQuestionsCount,
  resolveRank,
} from '../utils/rivalHelpers';

interface RivalPanelProps {
  currentUser: DqrUser;
  users: DqrUser[];
  ranks: RankDef[];
  territories: Territory[];
  challenges: SystemChallenge[];
  rivalries: RivalRecord[];
  onSendRivalRequest: (requesterId: string, recipientId: string) => string | null;
  onRespondRivalRequest: (rivalryId: string, accept: boolean) => void;
  onCancelRivalRequest: (rivalryId: string) => void;
  onEndRivalry: (rivalryId: string, endedByUserId: string) => void;
}

type TimelineFilter = 'all' | 'stats' | 'challenges' | 'ranks';

function UserAvatar({
  user,
  accentColor,
  size = 'md',
}: {
  user: DqrUser;
  accentColor: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dims =
    size === 'lg'
      ? 'h-16 w-16 text-xl'
      : size === 'sm'
        ? 'h-10 w-10 text-sm'
        : 'h-12 w-12 text-base';

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
        style={{ borderColor: `${accentColor}88` }}
        className={`${dims} shrink-0 rounded-xl border object-cover bg-[#090B12]`}
      />
    );
  }

  return (
    <div
      style={{
        borderColor: `${accentColor}66`,
        color: accentColor,
      }}
      className={`${dims} flex shrink-0 items-center justify-center rounded-xl border bg-[#090B12] font-mono font-bold`}
    >
      {initials || user.username.slice(0, 2).toUpperCase()}
    </div>
  );
}

function getEventVisual(type: RivalHistoryEventType) {
  switch (type) {
    case 'started':
      return { icon: Swords, label: 'RIVALRY BEGAN', color: '#3988FF' };
    case 'xp':
      return { icon: Zap, label: 'XP EARNED', color: '#83B9FF' };
    case 'territory':
      return { icon: Castle, label: 'TERRITORIES', color: '#F59E0B' };
    case 'streak':
      return { icon: Flame, label: 'STREAK', color: '#FB923C' };
    case 'questions':
      return { icon: BookOpen, label: 'QUESTIONS', color: '#10B981' };
    case 'challenge':
      return { icon: Award, label: 'CHALLENGE', color: '#A78BFA' };
    case 'rank':
      return { icon: Crown, label: 'RANK CHANGE', color: '#FDE047' };
    case 'ended':
      return { icon: FlagIconProxy, label: 'CONCLUDED', color: '#929CAF' };
  }
}

function FlagIconProxy({ className }: { className?: string }) {
  return <History className={className} />;
}

export function RivalPanel({
  currentUser,
  users,
  ranks,
  territories,
  challenges,
  rivalries,
  onSendRivalRequest,
  onRespondRivalRequest,
  onCancelRivalRequest,
  onEndRivalry,
}: RivalPanelProps) {
  const [viewMode, setViewMode] = useState<'current' | 'archive'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChangeSearch, setShowChangeSearch] = useState(false);
  const [confirmEndId, setConfirmEndId] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  const [feedback, setFeedback] = useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);

  const userById = useMemo(() => {
    const map = new Map<string, DqrUser>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const activeRivalry = useMemo(
    () =>
      rivalries.find(
        (r) =>
          r.status === 'active' &&
          (r.requesterId === currentUser.id || r.recipientId === currentUser.id)
      ) || null,
    [rivalries, currentUser.id]
  );

  const incomingRequests = useMemo(
    () =>
      rivalries
        .filter(
          (r) => r.status === 'pending' && r.recipientId === currentUser.id
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    [rivalries, currentUser.id]
  );

  const outgoingRequests = useMemo(
    () =>
      rivalries
        .filter(
          (r) => r.status === 'pending' && r.requesterId === currentUser.id
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    [rivalries, currentUser.id]
  );

  const pastRivalries = useMemo(
    () =>
      rivalries
        .filter(
          (r) =>
            r.status === 'ended' &&
            (r.requesterId === currentUser.id ||
              r.recipientId === currentUser.id)
        )
        .sort((a, b) => (b.endedAt || b.createdAt) - (a.endedAt || a.createdAt)),
    [rivalries, currentUser.id]
  );

  const rivalUser = useMemo(() => {
    if (!activeRivalry) return null;
    const otherId =
      activeRivalry.requesterId === currentUser.id
        ? activeRivalry.recipientId
        : activeRivalry.requesterId;
    return userById.get(otherId) || null;
  }, [activeRivalry, currentUser.id, userById]);

  const myEarnedXp = useMemo(() => {
    if (!activeRivalry) return 0;
    return activeRivalry.requesterId === currentUser.id
      ? activeRivalry.requesterEarnedXp
      : activeRivalry.recipientEarnedXp;
  }, [activeRivalry, currentUser.id]);

  const rivalEarnedXp = useMemo(() => {
    if (!activeRivalry) return 0;
    return activeRivalry.requesterId === currentUser.id
      ? activeRivalry.recipientEarnedXp
      : activeRivalry.requesterEarnedXp;
  }, [activeRivalry, currentUser.id]);

  const myStats = useMemo(
    () => ({
      territories: countUserTerritories(currentUser.id, territories),
      xpEarned: myEarnedXp,
      streak: currentUser.streak,
      questions: parseQuestionsCount(
        currentUser.reportCard?.totalQuestionsStudied
      ),
    }),
    [currentUser, territories, myEarnedXp]
  );

  const rivalStats = useMemo(() => {
    if (!rivalUser) {
      return { territories: 0, xpEarned: 0, streak: 0, questions: 0 };
    }
    return {
      territories: countUserTerritories(rivalUser.id, territories),
      xpEarned: rivalEarnedXp,
      streak: rivalUser.streak,
      questions: parseQuestionsCount(
        rivalUser.reportCard?.totalQuestionsStudied
      ),
    };
  }, [rivalUser, territories, rivalEarnedXp]);

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().replace(/^@/, '').toLowerCase();
    const others = users.filter((u) => u.id !== currentUser.id);
    if (!q) return others;
    return others
      .filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aExact = a.username.toLowerCase().startsWith(q) ? 0 : 1;
        const bExact = b.username.toLowerCase().startsWith(q) ? 0 : 1;
        return aExact - bExact || a.username.localeCompare(b.username);
      });
  }, [users, currentUser.id, searchQuery]);

  const filteredHistory = useMemo(() => {
    if (!activeRivalry) return [];
    return activeRivalry.history.filter((ev) => {
      if (timelineFilter === 'all') return true;
      if (timelineFilter === 'challenges') return ev.type === 'challenge';
      if (timelineFilter === 'ranks') return ev.type === 'rank';
      return (
        ev.type === 'xp' ||
        ev.type === 'territory' ||
        ev.type === 'streak' ||
        ev.type === 'questions'
      );
    });
  }, [activeRivalry, timelineFilter]);

  const myRank = resolveRank(ranks, currentUser.rankId);
  const rivalRank = rivalUser ? resolveRank(ranks, rivalUser.rankId) : undefined;

  const handleSendClick = (target: DqrUser) => {
    const err = onSendRivalRequest(currentUser.id, target.id);
    if (err) {
      setFeedback({ kind: 'err', text: err });
      return;
    }
    setFeedback({
      kind: 'ok',
      text: `Rival request sent to @${target.username}. Your rivalry will start once they accept.`,
    });
    setShowChangeSearch(false);
  };

  const handleAcceptClick = (rivalry: RivalRecord) => {
    const sender = userById.get(rivalry.requesterId);
    onRespondRivalRequest(rivalry.id, true);
    setConfirmEndId(null);
    setShowChangeSearch(false);
    setFeedback({
      kind: 'ok',
      text: sender
        ? `Rivalry active with @${sender.username}! Both XP earned counters begin at 0 XP today.`
        : 'Rivalry accepted and active!',
    });
  };

  const handleDeclineClick = (rivalry: RivalRecord) => {
    const sender = userById.get(rivalry.requesterId);
    onRespondRivalRequest(rivalry.id, false);
    setFeedback({
      kind: 'ok',
      text: sender
        ? `Declined rival request from @${sender.username}.`
        : 'Rival request declined.',
    });
  };

  const handleCancelOutgoing = (rivalry: RivalRecord) => {
    const target = userById.get(rivalry.recipientId);
    onCancelRivalRequest(rivalry.id);
    setFeedback({
      kind: 'ok',
      text: target
        ? `Cancelled outgoing request to @${target.username}.`
        : 'Outgoing request cancelled.',
    });
  };

  const handleConfirmEnd = (rivalry: RivalRecord) => {
    onEndRivalry(rivalry.id, currentUser.id);
    setConfirmEndId(null);
    setShowChangeSearch(false);
    setFeedback({
      kind: 'ok',
      text: 'Rivalry concluded. Your full progression timeline has been saved to Past Rivalries.',
    });
  };

  const statRows = [
    {
      key: 'territories',
      label: 'Total Territories Acquired',
      sub: 'Territories currently held in DQR',
      icon: Castle,
      youVal: myStats.territories,
      rivalVal: rivalStats.territories,
      format: (n: number) => `${n.toLocaleString()}`,
      unit: (n: number) => (n === 1 ? 'territory' : 'territories'),
    },
    {
      key: 'xpEarned',
      label: 'Total XP Earned',
      sub: 'Earned after rivalry started · Both began at 0 XP',
      icon: Zap,
      youVal: myStats.xpEarned,
      rivalVal: rivalStats.xpEarned,
      format: (n: number) => `${n.toLocaleString()} XP`,
      unit: () => 'since start',
    },
    {
      key: 'streak',
      label: 'Current Streak',
      sub: 'Consecutive days of active preparation',
      icon: Flame,
      youVal: myStats.streak,
      rivalVal: rivalStats.streak,
      format: (n: number) => `${n.toLocaleString()}`,
      unit: (n: number) => (n === 1 ? 'day' : 'days'),
    },
    {
      key: 'questions',
      label: 'Total Questions Completed',
      sub: 'Official cumulative figure from Report Card',
      icon: BookOpen,
      youVal: myStats.questions,
      rivalVal: rivalStats.questions,
      format: (n: number) => `${n.toLocaleString()}`,
      unit: () => 'questions',
    },
  ];

  // Baseline snapshot helper for active rivalry comparison
  const myBaseline = activeRivalry?.baselineStats
    ? activeRivalry.requesterId === currentUser.id
      ? activeRivalry.baselineStats.requester
      : activeRivalry.baselineStats.recipient
    : null;
  const rivalBaseline = activeRivalry?.baselineStats
    ? activeRivalry.requesterId === currentUser.id
      ? activeRivalry.baselineStats.recipient
      : activeRivalry.baselineStats.requester
    : null;

  const completedChallengeCounts = useMemo(() => {
    if (!activeRivalry || !rivalUser) return { mine: 0, theirs: 0 };
    const startTs = activeRivalry.startedAt || 0;
    const mineEvents = activeRivalry.history.filter(
      (h) =>
        h.type === 'challenge' &&
        h.actorUserId === currentUser.id &&
        h.timestamp >= startTs
    ).length;
    const theirEvents = activeRivalry.history.filter(
      (h) =>
        h.type === 'challenge' &&
        h.actorUserId === rivalUser.id &&
        h.timestamp >= startTs
    ).length;
    return {
      mine: mineEvents,
      theirs: theirEvents,
      totalCatalogMine: challenges.filter((c) =>
        c.completedByUserIds.includes(currentUser.id)
      ).length,
      totalCatalogTheirs: challenges.filter((c) =>
        c.completedByUserIds.includes(rivalUser.id)
      ).length,
    };
  }, [activeRivalry, rivalUser, challenges, currentUser.id]);

  const showFinder = !activeRivalry || showChangeSearch;

  return (
    <motion.div
      key="rival"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-7"
    >
      {/* SECTION HEADER & VIEW CONTROLS */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-mono text-2xl font-bold text-[#83B9FF]">
            FRIENDLY RIVALRY
          </h2>
          <p className="mt-1 text-xs text-[#929CAF]">
            Challenge a peer in friendly competition. Track steady progress side-by-side.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-white/10 bg-[#111827] p-1">
            <button
              type="button"
              onClick={() => setViewMode('current')}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'current'
                  ? 'bg-[#3988FF]/20 text-[#83B9FF]'
                  : 'text-[#929CAF] hover:text-white'
              }`}
            >
              Overview & Requests
              {incomingRequests.length > 0
                ? ` (${incomingRequests.length})`
                : ''}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('archive')}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'archive'
                  ? 'bg-[#3988FF]/20 text-[#83B9FF]'
                  : 'text-[#929CAF] hover:text-white'
              }`}
            >
              Past Rivalries ({pastRivalries.length})
            </button>
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs ${
            feedback.kind === 'ok'
              ? 'border-[#3988FF]/45 bg-[#151D2C] text-[#E5E7EB]'
              : 'border-[#F59E0B]/50 bg-[#23190d] text-[#FDE68A]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 shrink-0 text-[#83B9FF]" />
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
            className="rounded p-1 text-[#929CAF] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {viewMode === 'current' ? (
        <div className="space-y-7">
          {/* PENDING REQUESTS (INCOMING + OUTGOING) */}
          {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Incoming Requests */}
              {incomingRequests.length > 0 && (
                <div className="rounded-2xl border border-[#3988FF]/40 bg-[#111827] p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-[#83B9FF]" />
                      <h3 className="font-mono text-xs font-bold tracking-wider text-[#83B9FF] uppercase">
                        Incoming Rival Requests · {incomingRequests.length}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 divide-y divide-white/10">
                    {incomingRequests.map((req) => {
                      const sender = userById.get(req.requesterId);
                      if (!sender) return null;
                      const senderRank = resolveRank(ranks, sender.rankId);
                      return (
                        <div
                          key={req.id}
                          className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              user={sender}
                              accentColor={senderRank?.color || '#83B9FF'}
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {sender.fullName}{' '}
                                <span className="font-mono text-xs text-[#83B9FF]">
                                  @{sender.username}
                                </span>
                              </p>
                              <p className="font-mono text-[11px] text-[#929CAF]">
                                <span style={{ color: senderRank?.color }}>
                                  {senderRank?.emblem} {senderRank?.name || 'Ranked'}
                                </span>{' '}
                                · Level {sender.level} · Sent{' '}
                                {formatRivalDate(req.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAcceptClick(req)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#3988FF] px-3.5 py-1.5 font-mono text-xs font-bold text-white hover:bg-[#83B9FF] hover:text-[#090B12] cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeclineClick(req)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#151D2C] px-3 py-1.5 font-mono text-xs font-semibold text-[#929CAF] hover:border-white/30 hover:text-white cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {activeRivalry && (
                    <p className="mt-3 border-t border-white/10 pt-2.5 text-[11px] text-[#929CAF]">
                      Accepting a new request concludes your current rivalry cleanly and keeps its full timeline in Past Rivalries.
                    </p>
                  )}
                </div>
              )}

              {/* Outgoing Requests */}
              {outgoingRequests.length > 0 && (
                <div className="rounded-2xl border border-[#A78BFA]/35 bg-[#111827] p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#A78BFA]" />
                      <h3 className="font-mono text-xs font-bold tracking-wider text-[#A78BFA] uppercase">
                        Outgoing Requests · {outgoingRequests.length}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 divide-y divide-white/10">
                    {outgoingRequests.map((req) => {
                      const target = userById.get(req.recipientId);
                      if (!target) return null;
                      const targetRank = resolveRank(ranks, target.rankId);
                      return (
                        <div
                          key={req.id}
                          className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              user={target}
                              accentColor={targetRank?.color || '#A78BFA'}
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {target.fullName}{' '}
                                <span className="font-mono text-xs text-[#A78BFA]">
                                  @{target.username}
                                </span>
                              </p>
                              <p className="font-mono text-[11px] text-[#929CAF]">
                                Waiting for @{target.username} to accept ·{' '}
                                {formatRivalDate(req.createdAt)}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCancelOutgoing(req)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#151D2C] px-3 py-1.5 font-mono text-xs font-semibold text-[#929CAF] hover:border-white/35 hover:text-white shrink-0 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Cancel Request</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE RIVALRY SECTION */}
          {activeRivalry && rivalUser && (
            <div className="space-y-6">
              {/* Encouraging Banner & Rivalry Controls */}
              <div className="rounded-2xl border border-[#3988FF]/40 bg-gradient-to-br from-[#111827] via-[#151D2C] to-[#0c1220] p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="space-y-1.5">
                    <p className="font-mono text-[11px] font-bold tracking-wider text-[#83B9FF] uppercase">
                      ACTIVE FRIENDLY RIVALRY · SINCE{' '}
                      {formatRivalDate(
                        activeRivalry.startedAt || activeRivalry.createdAt
                      )}
                    </p>
                    <p className="text-sm leading-relaxed text-[#E5E7EB]">
                      {getOverallEncouragement(
                        myStats,
                        rivalStats,
                        rivalUser.username
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowChangeSearch((v) => !v)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#3988FF]/45 bg-[#111827] px-3.5 py-2 font-mono text-xs font-semibold text-[#83B9FF] hover:border-[#83B9FF] cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>
                        {showChangeSearch ? 'Close Search' : 'Change Rival'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmEndId((prev) =>
                          prev === activeRivalry.id ? null : activeRivalry.id
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#111827] px-3.5 py-2 font-mono text-xs font-semibold text-[#929CAF] hover:border-white/35 hover:text-white cursor-pointer"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      <span>End Rivalry</span>
                    </button>
                  </div>
                </div>

                {/* Inline Confirmation for End Rivalry */}
                {confirmEndId === activeRivalry.id && (
                  <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-[#F59E0B]/40 bg-[#090B12]/80 p-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-[#E5E7EB]">
                      Conclude your active rivalry with{' '}
                      <span className="font-mono font-bold text-white">
                        @{rivalUser.username}
                      </span>
                      ? Your full stats snapshot and timeline will stay saved in Past Rivalries.
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleConfirmEnd(activeRivalry)}
                        className="rounded-lg bg-[#3988FF] px-3.5 py-1.5 font-mono text-xs font-bold text-white hover:bg-[#83B9FF] hover:text-[#090B12] cursor-pointer"
                      >
                        Yes, Conclude Rivalry
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmEndId(null)}
                        className="rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-[#929CAF] hover:text-white cursor-pointer"
                      >
                        Keep Going
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SIDE-BY-SIDE COMPETITOR PROFILE COMPARISON */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* YOU */}
                <div className="flex items-center gap-4 rounded-2xl border border-[#3988FF]/45 bg-[#151D2C] p-5">
                  <UserAvatar
                    user={currentUser}
                    accentColor={myRank?.color || '#3988FF'}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] font-bold tracking-wider text-[#3988FF] uppercase">
                      YOU · CHALLENGER
                    </p>
                    <h3 className="truncate font-display text-xl font-bold text-white">
                      {currentUser.fullName}
                    </h3>
                    <p className="font-mono text-xs text-[#83B9FF]">
                      @{currentUser.username}
                    </p>
                    <p className="mt-1.5 font-mono text-xs text-[#E5E7EB]">
                      <span style={{ color: myRank?.color || '#83B9FF' }}>
                        {myRank?.emblem} {myRank?.name || 'Ranked'}
                      </span>{' '}
                      <span className="text-[#929CAF]">·</span>{' '}
                      <span className="tabular-nums font-bold">
                        Level {currentUser.level}
                      </span>
                    </p>
                  </div>
                </div>

                {/* YOUR RIVAL */}
                <div className="flex items-center gap-4 rounded-2xl border border-[#A78BFA]/45 bg-[#151D2C] p-5">
                  <UserAvatar
                    user={rivalUser}
                    accentColor={rivalRank?.color || '#A78BFA'}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] font-bold tracking-wider text-[#A78BFA] uppercase">
                      PERSONAL RIVAL
                    </p>
                    <h3 className="truncate font-display text-xl font-bold text-white">
                      {rivalUser.fullName}
                    </h3>
                    <p className="font-mono text-xs text-[#A78BFA]">
                      @{rivalUser.username}
                    </p>
                    <p className="mt-1.5 font-mono text-xs text-[#E5E7EB]">
                      <span style={{ color: rivalRank?.color || '#A78BFA' }}>
                        {rivalRank?.emblem} {rivalRank?.name || 'Ranked'}
                      </span>{' '}
                      <span className="text-[#929CAF]">·</span>{' '}
                      <span className="tabular-nums font-bold">
                        Level {rivalUser.level}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* FOUR CORE STATISTICS SIDE-BY-SIDE */}
              <div className="rounded-2xl border border-white/10 bg-[#111827] overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#151D2C] px-6 py-4">
                  <div>
                    <h3 className="font-mono text-sm font-bold tracking-wider text-white uppercase">
                      Head-to-Head Progress Comparison
                    </h3>
                    <p className="text-xs text-[#929CAF]">
                      Same measurement & time scope applied equally to both rivals.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-xs">
                    <span className="flex items-center gap-1.5 text-[#83B9FF]">
                      <span className="h-2 w-2 rounded-xs bg-[#3988FF]" />
                      @{currentUser.username}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#A78BFA]">
                      <span className="h-2 w-2 rounded-xs bg-[#A78BFA]" />
                      @{rivalUser.username}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-white/10">
                  {statRows.map((stat) => {
                    const Icon = stat.icon;
                    const maxVal = Math.max(stat.youVal, stat.rivalVal, 1);
                    const youPct = Math.round((stat.youVal / maxVal) * 100);
                    const rivalPct = Math.round((stat.rivalVal / maxVal) * 100);
                    const diff = Math.abs(stat.youVal - stat.rivalVal);
                    const status: 'you' | 'rival' | 'tie' =
                      stat.youVal > stat.rivalVal
                        ? 'you'
                        : stat.rivalVal > stat.youVal
                          ? 'rival'
                          : 'tie';

                    const formattedDiff =
                      stat.key === 'xpEarned'
                        ? `${diff.toLocaleString()} XP`
                        : `${diff.toLocaleString()} ${stat.unit(diff)}`;

                    return (
                      <div key={stat.key} className="px-6 py-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#151D2C] text-[#83B9FF]">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-display text-base font-bold text-white">
                                {stat.label}
                              </h4>
                              <p className="text-xs text-[#929CAF]">
                                {stat.sub}
                              </p>
                            </div>
                          </div>

                          {/* Friendly Ahead Indicator */}
                          <div className="font-mono text-xs font-semibold">
                            {status === 'you' && (
                              <span className="inline-flex items-center gap-1 text-[#83B9FF]">
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                You are ahead by +{formattedDiff}
                              </span>
                            )}
                            {status === 'rival' && (
                              <span className="inline-flex items-center gap-1 text-[#A78BFA]">
                                <TrendingUp className="h-3.5 w-3.5" />
                                @{rivalUser.username} ahead by +{formattedDiff} · Closing the gap
                              </span>
                            )}
                            {status === 'tie' && (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Tied · Even pace
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dual Comparison Bars */}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {/* Your Bar */}
                          <div className="rounded-xl border border-white/5 bg-[#090B12]/70 p-3">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-mono text-[11px] text-[#929CAF]">
                                @{currentUser.username}
                              </span>
                              <span
                                className={`font-mono text-lg font-bold tabular-nums ${
                                  status === 'you'
                                    ? 'text-[#83B9FF]'
                                    : 'text-white'
                                }`}
                              >
                                {stat.format(stat.youVal)}{' '}
                                {stat.key !== 'xpEarned' && (
                                  <span className="text-xs font-normal text-[#929CAF]">
                                    {stat.unit(stat.youVal)}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                style={{ width: `${youPct}%` }}
                                className="h-full rounded-full bg-[#3988FF] transition-all duration-500"
                              />
                            </div>
                          </div>

                          {/* Rival Bar */}
                          <div className="rounded-xl border border-white/5 bg-[#090B12]/70 p-3">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-mono text-[11px] text-[#929CAF]">
                                @{rivalUser.username}
                              </span>
                              <span
                                className={`font-mono text-lg font-bold tabular-nums ${
                                  status === 'rival'
                                    ? 'text-[#A78BFA]'
                                    : 'text-white'
                                }`}
                              >
                                {stat.format(stat.rivalVal)}{' '}
                                {stat.key !== 'xpEarned' && (
                                  <span className="text-xs font-normal text-[#929CAF]">
                                    {stat.unit(stat.rivalVal)}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                style={{ width: `${rivalPct}%` }}
                                className="h-full rounded-full bg-[#A78BFA] transition-all duration-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIVAL HISTORY TIMELINE */}
              <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
                <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-mono text-sm font-bold tracking-wider text-white uppercase">
                      Rivalry Progression Timeline
                    </h3>
                    <p className="mt-0.5 text-xs text-[#929CAF]">
                      Changes in the four metrics, completed System challenges, and rank progressions over time.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'All Events' },
                        { id: 'stats', label: 'Stat Updates' },
                        { id: 'challenges', label: 'Challenges' },
                        { id: 'ranks', label: 'Rank Changes' },
                      ] as { id: TimelineFilter; label: string }[]
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setTimelineFilter(f.id)}
                        className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold cursor-pointer ${
                          timelineFilter === f.id
                            ? 'border-[#3988FF] bg-[#3988FF]/15 text-[#83B9FF]'
                            : 'border-white/10 bg-[#151D2C] text-[#929CAF] hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start vs Now Summary */}
                {myBaseline && rivalBaseline && (
                  <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-[#090B12]/70 p-4 text-xs sm:grid-cols-3">
                    <div>
                      <p className="font-mono text-[10px] font-bold text-[#929CAF] uppercase">
                        At Rivalry Start
                      </p>
                      <p className="mt-1 font-mono text-[#E5E7EB] tabular-nums">
                        @{currentUser.username}: {myBaseline.territories}T · 0 XP ·{' '}
                        {myBaseline.streak}d · {myBaseline.questions.toLocaleString()}Q
                      </p>
                      <p className="mt-0.5 font-mono text-[#E5E7EB] tabular-nums">
                        @{rivalUser.username}: {rivalBaseline.territories}T · 0 XP ·{' '}
                        {rivalBaseline.streak}d ·{' '}
                        {rivalBaseline.questions.toLocaleString()}Q
                      </p>
                    </div>

                    <div>
                      <p className="font-mono text-[10px] font-bold text-[#929CAF] uppercase">
                        Challenges Completed (Since Start)
                      </p>
                      <p className="mt-1 font-mono text-[#83B9FF] tabular-nums">
                        @{currentUser.username}: {completedChallengeCounts.mine}{' '}
                        since start ({completedChallengeCounts.totalCatalogMine} total)
                      </p>
                      <p className="mt-0.5 font-mono text-[#A78BFA] tabular-nums">
                        @{rivalUser.username}: {completedChallengeCounts.theirs}{' '}
                        since start ({completedChallengeCounts.totalCatalogTheirs} total)
                      </p>
                    </div>

                    <div>
                      <p className="font-mono text-[10px] font-bold text-[#929CAF] uppercase">
                        Current Standing
                      </p>
                      <p className="mt-1 font-mono text-[#E5E7EB] tabular-nums">
                        @{currentUser.username}: {myStats.territories}T ·{' '}
                        {myStats.xpEarned.toLocaleString()} XP · {myStats.streak}d ·{' '}
                        {myStats.questions.toLocaleString()}Q
                      </p>
                      <p className="mt-0.5 font-mono text-[#E5E7EB] tabular-nums">
                        @{rivalUser.username}: {rivalStats.territories}T ·{' '}
                        {rivalStats.xpEarned.toLocaleString()} XP ·{' '}
                        {rivalStats.streak}d ·{' '}
                        {rivalStats.questions.toLocaleString()}Q
                      </p>
                    </div>
                  </div>
                )}

                {/* Chronological Event List */}
                <div className="mt-5 space-y-3">
                  {filteredHistory.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-[#090B12]/50 p-6 text-center text-xs text-[#929CAF]">
                      No events match this filter yet. Complete challenges, earn XP, or climb streaks to populate this timeline.
                    </div>
                  ) : (
                    filteredHistory.map((ev: RivalHistoryEvent) => {
                      const vis = getEventVisual(ev.type);
                      const EvIcon = vis.icon;
                      return (
                        <div
                          key={ev.id}
                          className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-[#151D2C]/70 p-4"
                        >
                          <div
                            style={{
                              borderColor: `${vis.color}55`,
                              color: vis.color,
                            }}
                            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-[#090B12]"
                          >
                            <EvIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                              <span
                                style={{ color: vis.color }}
                                className="font-bold uppercase"
                              >
                                {vis.label}
                              </span>
                              <span className="text-[#929CAF] tabular-nums">
                                {formatRivalTimestamp(ev.timestamp)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {ev.title}
                            </p>
                            <p className="mt-0.5 text-xs text-[#929CAF]">
                              {ev.detail}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* EMPTY STATE + USERNAME SEARCH PANEL */}
          {showFinder && (
            <div className="rounded-2xl border border-[#3988FF]/35 bg-[#111827] p-6">
              <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-mono text-base font-bold text-white">
                    {activeRivalry
                      ? 'CHANGE YOUR CURRENT RIVAL'
                      : 'CHOOSE A PERSONAL RIVAL'}
                  </h3>
                  <p className="mt-1 text-xs text-[#929CAF]">
                    {activeRivalry
                      ? 'Search by username to invite a new rival. Once accepted, your current rivalry wraps up smoothly and this new matchup starts at 0 XP earned.'
                      : 'Search for another DQR member by username and send a friendly rival request. The rivalry begins once they accept.'}
                  </p>
                </div>

                {activeRivalry && (
                  <button
                    type="button"
                    onClick={() => setShowChangeSearch(false)}
                    className="self-start rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-[#929CAF] hover:text-white cursor-pointer"
                  >
                    Cancel Search
                  </button>
                )}
              </div>

              {/* Search Input */}
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#929CAF]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by @username (e.g., aarav, sujata, dijan)..."
                  className="w-full rounded-xl border border-[#3988FF]/30 bg-[#090B12] py-2.5 pr-4 pl-10 text-sm text-white placeholder-[#929CAF] focus:border-[#3988FF] focus:outline-none"
                />
              </div>

              {/* Candidate Directory */}
              <div className="mt-4 divide-y divide-white/10">
                {filteredCandidates.length === 0 ? (
                  <p className="py-8 text-center text-xs text-[#929CAF]">
                    No users matched “{searchQuery}”. Try searching another username.
                  </p>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const candRank = resolveRank(ranks, candidate.rankId);
                    const isCurrentRival = rivalUser?.id === candidate.id;
                    const outgoingPending = outgoingRequests.find(
                      (r) => r.recipientId === candidate.id
                    );
                    const incomingPending = incomingRequests.find(
                      (r) => r.requesterId === candidate.id
                    );

                    return (
                      <div
                        key={candidate.id}
                        className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-3.5">
                          <UserAvatar
                            user={candidate}
                            accentColor={candRank?.color || '#83B9FF'}
                            size="md"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-display text-base font-bold text-white">
                                {candidate.fullName}
                              </span>
                              <span className="font-mono text-xs text-[#83B9FF]">
                                @{candidate.username}
                              </span>
                            </div>
                            <p className="mt-0.5 font-mono text-xs text-[#929CAF]">
                              <span style={{ color: candRank?.color }}>
                                {candRank?.emblem}{' '}
                                {candRank?.name || 'Ranked'}
                              </span>{' '}
                              · Level {candidate.level} · {candidate.streak}d streak
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCurrentRival ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#3988FF]/40 bg-[#3988FF]/10 px-3 py-1.5 font-mono text-xs font-semibold text-[#83B9FF]">
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Current Rival</span>
                            </span>
                          ) : incomingPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAcceptClick(incomingPending)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#3988FF] px-3.5 py-1.5 font-mono text-xs font-bold text-white hover:bg-[#83B9FF] hover:text-[#090B12] cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Accept Their Request</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeclineClick(incomingPending)
                                }
                                className="rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-[#929CAF] hover:text-white cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          ) : outgoingPending ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-[#A78BFA]">
                                Request Sent
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCancelOutgoing(outgoingPending)
                                }
                                className="rounded-lg border border-white/15 bg-[#151D2C] px-3 py-1.5 font-mono text-xs text-[#929CAF] hover:text-white cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendClick(candidate)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#3988FF] px-4 py-2 font-mono text-xs font-bold text-white hover:bg-[#83B9FF] hover:text-[#090B12] cursor-pointer"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>Send Rival Request</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= PAST RIVALRIES ARCHIVE ================= */
        <div className="space-y-5">
          {pastRivalries.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-12 text-center">
              <p className="font-mono text-sm font-semibold text-white">
                No Past Rivalries Yet
              </p>
              <p className="mt-1.5 text-xs text-[#929CAF]">
                Completed or concluded rivalries and their full timelines will appear here.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('current')}
                className="mt-4 rounded-xl bg-[#3988FF] px-4 py-2 font-mono text-xs font-bold text-white hover:bg-[#83B9FF] hover:text-[#090B12] cursor-pointer"
              >
                Back to Active Rivalry
              </button>
            </div>
          ) : (
            pastRivalries.map((past) => {
              const otherId =
                past.requesterId === currentUser.id
                  ? past.recipientId
                  : past.requesterId;
              const pastOther = userById.get(otherId);
              const pastOtherRank = pastOther
                ? resolveRank(ranks, pastOther.rankId)
                : undefined;
              const isReq = past.requesterId === currentUser.id;
              const mySnap = past.finalStats
                ? isReq
                  ? past.finalStats.requester
                  : past.finalStats.recipient
                : null;
              const theirSnap = past.finalStats
                ? isReq
                  ? past.finalStats.recipient
                  : past.finalStats.requester
                : null;

              return (
                <div
                  key={past.id}
                  className="rounded-2xl border border-white/10 bg-[#111827] p-6"
                >
                  <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      {pastOther ? (
                        <UserAvatar
                          user={pastOther}
                          accentColor={pastOtherRank?.color || '#A78BFA'}
                          size="sm"
                        />
                      ) : null}
                      <div>
                        <p className="font-display text-lg font-bold text-white">
                          vs {pastOther?.fullName || 'Former Competitor'}{' '}
                          {pastOther && (
                            <span className="font-mono text-xs text-[#A78BFA]">
                              @{pastOther.username}
                            </span>
                          )}
                        </p>
                        <p className="font-mono text-[11px] text-[#929CAF]">
                          {formatRivalDate(past.startedAt || past.createdAt)} →{' '}
                          {formatRivalDate(past.endedAt || past.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#929CAF]">
                      CONCLUDED · {past.history.length} EVENTS
                    </span>
                  </div>

                  {mySnap && theirSnap && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      {[
                        {
                          label: 'Territories',
                          a: mySnap.territories,
                          b: theirSnap.territories,
                        },
                        {
                          label: 'XP Earned',
                          a: mySnap.xpEarned,
                          b: theirSnap.xpEarned,
                          suffix: ' XP',
                        },
                        {
                          label: 'Streak',
                          a: mySnap.streak,
                          b: theirSnap.streak,
                          suffix: 'd',
                        },
                        {
                          label: 'Questions',
                          a: mySnap.questions,
                          b: theirSnap.questions,
                        },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className="rounded-xl border border-white/5 bg-[#090B12]/70 p-3"
                        >
                          <p className="font-mono text-[10px] text-[#929CAF] uppercase">
                            {m.label}
                          </p>
                          <p className="mt-1 font-mono text-sm font-bold text-white tabular-nums">
                            <span className="text-[#83B9FF]">
                              {m.a.toLocaleString()}
                              {m.suffix || ''}
                            </span>{' '}
                            <span className="text-[#929CAF]">vs</span>{' '}
                            <span className="text-[#A78BFA]">
                              {m.b.toLocaleString()}
                              {m.suffix || ''}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {past.history.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {past.history.slice(0, 8).map((ev) => {
                        const vis = getEventVisual(ev.type);
                        return (
                          <div
                            key={ev.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#151D2C]/60 px-3.5 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                style={{ color: vis.color }}
                                className="font-mono text-[10px] font-bold uppercase"
                              >
                                {vis.label}
                              </span>
                              <span className="font-medium text-white">
                                {ev.title}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-[#929CAF] tabular-nums">
                              {formatRivalTimestamp(ev.timestamp)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </motion.div>
  );
}
