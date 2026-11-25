import {
  DqrUser,
  DuelDifficulty,
  DuelMatch,
  DuelQuestion,
} from '../types';

export const STARTING_DUEL_ELO = 1200;
export const PROVISIONAL_DUEL_THRESHOLD = 5;

export const DUEL_EASY_COUNT = 3;
export const DUEL_MEDIUM_COUNT = 4;
export const DUEL_HARD_COUNT = 3;
export const DUEL_TOTAL_QUESTIONS = 10;
export const DUEL_ACCEPT_WINDOW_MS = 60_000;
export const DUEL_REQUIRED_XP = 1000;

export interface TopicReadinessSummary {
  topic: string;
  totalApproved: number;
  easy: number;
  medium: number;
  hard: number;
  fullDistributionReady: boolean;
  playable: boolean;
}

export function getTopicReadiness(
  questions: DuelQuestion[],
  topic: string
): TopicReadinessSummary {
  const norm = topic.trim().toLowerCase();
  const approved = questions.filter(
    (q) =>
      q.status === 'approved' &&
      q.isActive &&
      q.topic.trim().toLowerCase() === norm
  );
  const easy = approved.filter((q) => q.difficulty === 'easy').length;
  const medium = approved.filter((q) => q.difficulty === 'medium').length;
  const hard = approved.filter((q) => q.difficulty === 'hard').length;

  return {
    topic,
    totalApproved: approved.length,
    easy,
    medium,
    hard,
    fullDistributionReady:
      easy >= DUEL_EASY_COUNT &&
      medium >= DUEL_MEDIUM_COUNT &&
      hard >= DUEL_HARD_COUNT,
    playable: approved.length > 0,
  };
}

/**
 * Selects up to 10 approved active questions strictly from the requested topic,
 * enforcing the 3 Easy / 4 Medium / 3 Hard distribution while prioritizing
 * questions neither player has recently seen and least-recently used items.
 */
export function selectDuelQuestions(
  bank: DuelQuestion[],
  topic: string,
  challengerId: string,
  opponentId: string
): DuelQuestion[] {
  const normTopic = topic.trim().toLowerCase();
  const topicPool = bank.filter(
    (q) =>
      q.status === 'approved' &&
      q.isActive &&
      q.topic.trim().toLowerCase() === normTopic
  );

  if (topicPool.length === 0) return [];

  const scoreForSort = (q: DuelQuestion) => {
    const seenByChallenger = q.recentlySeenBy.includes(challengerId) ? 1 : 0;
    const seenByOpponent = q.recentlySeenBy.includes(opponentId) ? 1 : 0;
    const seenPenalty = seenByChallenger + seenByOpponent;
    const lastUsed = q.lastUsedAt ?? 0;
    return { seenPenalty, lastUsed, timesUsed: q.timesUsed };
  };

  const sortBucket = (items: DuelQuestion[]): DuelQuestion[] => {
    // Shuffle lightly first so zero-tie buckets rotate unpredictably
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.sort((a, b) => {
      const sa = scoreForSort(a);
      const sb = scoreForSort(b);
      if (sa.seenPenalty !== sb.seenPenalty) return sa.seenPenalty - sb.seenPenalty;
      if (sa.timesUsed !== sb.timesUsed) return sa.timesUsed - sb.timesUsed;
      if (sa.lastUsed !== sb.lastUsed) return sa.lastUsed - sb.lastUsed;
      return 0;
    });
  };

  const easyBucket = sortBucket(
    topicPool.filter((q) => q.difficulty === 'easy')
  );
  const mediumBucket = sortBucket(
    topicPool.filter((q) => q.difficulty === 'medium')
  );
  const hardBucket = sortBucket(
    topicPool.filter((q) => q.difficulty === 'hard')
  );

  const chosen: DuelQuestion[] = [
    ...easyBucket.slice(0, DUEL_EASY_COUNT),
    ...mediumBucket.slice(0, DUEL_MEDIUM_COUNT),
    ...hardBucket.slice(0, DUEL_HARD_COUNT),
  ];

  // If any difficulty bucket had fewer than 3/4/3, gracefully fill from remaining approved questions in the same topic
  if (chosen.length < DUEL_TOTAL_QUESTIONS) {
    const chosenIds = new Set(chosen.map((q) => q.id));
    const remaining = sortBucket(
      topicPool.filter((q) => !chosenIds.has(q.id))
    );
    chosen.push(
      ...remaining.slice(0, DUEL_TOTAL_QUESTIONS - chosen.length)
    );
  }

  return chosen;
}

export interface HeadToHeadTopicBreakdown {
  topic: string;
  totalDuels: number;
  playerAWins: number;
  playerBWins: number;
  draws: number;
  playerAWinRate: number;
  playerBWinRate: number;
}

export interface HeadToHeadSummary {
  totalDuels: number;
  playerAWins: number;
  playerBWins: number;
  draws: number;
  playerAWinRate: number;
  playerBWinRate: number;
  playerAAvgMarks: number;
  playerBAvgMarks: number;
  playerAAvgTimeSec: number;
  playerBAvgTimeSec: number;
  playerANetXp: number;
  topicBreakdown: HeadToHeadTopicBreakdown[];
  matches: DuelMatch[];
}

export function computeHeadToHeadStats(
  matches: DuelMatch[],
  playerAId: string,
  playerBId: string,
  topicFilter: string = 'all'
): HeadToHeadSummary {
  const pairMatches = matches
    .filter(
      (m) =>
        m.status === 'completed' &&
        ((m.challengerId === playerAId && m.opponentId === playerBId) ||
          (m.challengerId === playerBId && m.opponentId === playerAId))
    )
    .sort((a, b) => (b.settledAt || b.createdAt) - (a.settledAt || a.createdAt));

  // Always build full topic breakdown across all duels between A and B
  const topicMap = new Map<
    string,
    { total: number; aWins: number; bWins: number; draws: number }
  >();
  for (const m of pairMatches) {
    const entry = topicMap.get(m.topic) || {
      total: 0,
      aWins: 0,
      bWins: 0,
      draws: 0,
    };
    entry.total += 1;
    if (m.winnerId === playerAId) entry.aWins += 1;
    else if (m.winnerId === playerBId) entry.bWins += 1;
    else entry.draws += 1;
    topicMap.set(m.topic, entry);
  }

  const topicBreakdown: HeadToHeadTopicBreakdown[] = Array.from(
    topicMap.entries()
  )
    .map(([topic, d]) => ({
      topic,
      totalDuels: d.total,
      playerAWins: d.aWins,
      playerBWins: d.bWins,
      draws: d.draws,
      playerAWinRate: d.total > 0 ? Math.round((d.aWins / d.total) * 100) : 0,
      playerBWinRate: d.total > 0 ? Math.round((d.bWins / d.total) * 100) : 0,
    }))
    .sort((a, b) => b.totalDuels - a.totalDuels);

  const filteredMatches =
    topicFilter === 'all'
      ? pairMatches
      : pairMatches.filter(
          (m) => m.topic.toLowerCase() === topicFilter.toLowerCase()
        );

  let aWins = 0;
  let bWins = 0;
  let draws = 0;
  let aMarksSum = 0;
  let bMarksSum = 0;
  let aTimeSumMs = 0;
  let bTimeSumMs = 0;
  let aNetXp = 0;

  for (const m of filteredMatches) {
    const aProg =
      m.challengerId === playerAId ? m.challengerProgress : m.opponentProgress;
    const bProg =
      m.challengerId === playerBId ? m.challengerProgress : m.opponentProgress;

    aMarksSum += aProg.correctCount;
    bMarksSum += bProg.correctCount;
    aTimeSumMs += aProg.totalTimeMs;
    bTimeSumMs += bProg.totalTimeMs;

    if (m.winnerId === playerAId) {
      aWins += 1;
      aNetXp += m.xpTransferred;
    } else if (m.winnerId === playerBId) {
      bWins += 1;
      aNetXp -= m.xpTransferred;
    } else {
      draws += 1;
    }
  }

  const total = filteredMatches.length;

  return {
    totalDuels: total,
    playerAWins: aWins,
    playerBWins: bWins,
    draws,
    playerAWinRate: total > 0 ? Math.round((aWins / total) * 100) : 0,
    playerBWinRate: total > 0 ? Math.round((bWins / total) * 100) : 0,
    playerAAvgMarks:
      total > 0 ? Math.round((aMarksSum / total) * 10) / 10 : 0,
    playerBAvgMarks:
      total > 0 ? Math.round((bMarksSum / total) * 10) / 10 : 0,
    playerAAvgTimeSec:
      total > 0 ? Math.round((aTimeSumMs / total / 1000) * 10) / 10 : 0,
    playerBAvgTimeSec:
      total > 0 ? Math.round((bTimeSumMs / total / 1000) * 10) / 10 : 0,
    playerANetXp: aNetXp,
    topicBreakdown,
    matches: filteredMatches,
  };
}

export function generateSampleDuelCsv(): string {
  return [
    'topic,difficulty,question,option_a,option_b,option_c,option_d,correct_answer,subtopic',
    'Mathematics,easy,"What is 12 × 12?",124,132,144,156,C,Arithmetic',
    'Mathematics,medium,"What is the derivative of sin(x)?",cos(x),-cos(x),sin(x),tan(x),A,Calculus',
    'Science,hard,"What is the chemical formula of sulfuric acid?",HCl,H2SO4,HNO3,H2CO3,B,Chemistry',
    'History,medium,"In which year was the United Nations founded?",1942,1945,1948,1950,B,Modern History',
  ].join('\n');
}

function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && next === '\n') i++;
        row.push(cell.trim());
        if (row.some((c) => c.length > 0)) {
          rows.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
  }

  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) {
    rows.push(row);
  }
  return rows;
}

export interface CsvParseResult {
  questions: DuelQuestion[];
  errors: string[];
}

export function parseDuelCsv(
  rawCsv: string,
  defaultStatus: 'approved' | 'pending' = 'approved'
): CsvParseResult {
  const rows = splitCsvRows(rawCsv);
  if (rows.length === 0) {
    return { questions: [], errors: ['CSV is empty.'] };
  }

  const firstLower = rows[0].map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const hasHeader =
    firstLower.includes('question') ||
    firstLower.includes('topic') ||
    firstLower.includes('optiona');

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const colIdx = (names: string[], fallback: number) => {
    if (!hasHeader) return fallback;
    const found = firstLower.findIndex((h) => names.includes(h));
    return found >= 0 ? found : fallback;
  };

  const idxTopic = colIdx(['topic', 'subject', 'category'], 0);
  const idxDiff = colIdx(['difficulty', 'level'], 1);
  const idxQuestion = colIdx(['question', 'prompt', 'q'], 2);
  const idxA = colIdx(['optiona', 'a', 'opt1'], 3);
  const idxB = colIdx(['optionb', 'b', 'opt2'], 4);
  const idxC = colIdx(['optionc', 'c', 'opt3'], 5);
  const idxD = colIdx(['optiond', 'd', 'opt4'], 6);
  const idxCorrect = colIdx(
    ['correctanswer', 'correct', 'answer', 'correctoption'],
    7
  );
  const idxSubtopic = colIdx(['subtopic', 'tag'], 8);

  const questions: DuelQuestion[] = [];
  const errors: string[] = [];
  const now = Date.now();

  dataRows.forEach((cols, i) => {
    const rowNum = hasHeader ? i + 2 : i + 1;
    const topic = (cols[idxTopic] || '').trim();
    const diffRaw = (cols[idxDiff] || 'medium').trim().toLowerCase();
    const prompt = (cols[idxQuestion] || '').trim();
    const optA = (cols[idxA] || '').trim();
    const optB = (cols[idxB] || '').trim();
    const optC = (cols[idxC] || '').trim();
    const optD = (cols[idxD] || '').trim();
    const correctRaw = (cols[idxCorrect] || '').trim();
    const subtopic = (cols[idxSubtopic] || '').trim();

    if (!topic || !prompt || !optA || !optB || !optC || !optD) {
      errors.push(`Row ${rowNum}: missing topic, question, or one of options A-D.`);
      return;
    }

    let difficulty: DuelDifficulty = 'medium';
    if (diffRaw.startsWith('e')) difficulty = 'easy';
    else if (diffRaw.startsWith('h')) difficulty = 'hard';
    else if (diffRaw.startsWith('m')) difficulty = 'medium';

    let correctIndex: 0 | 1 | 2 | 3 = 0;
    const cUpper = correctRaw.toUpperCase();
    if (cUpper === 'A' || cUpper === '0' || cUpper === '1') correctIndex = 0;
    else if (cUpper === 'B' || cUpper === '2') correctIndex = 1;
    else if (cUpper === 'C' || cUpper === '3') correctIndex = 2;
    else if (cUpper === 'D' || cUpper === '4') correctIndex = 3;
    else {
      const optionsLower = [optA, optB, optC, optD].map((o) => o.toLowerCase());
      const matchIdx = optionsLower.indexOf(correctRaw.toLowerCase());
      if (matchIdx >= 0) {
        correctIndex = matchIdx as 0 | 1 | 2 | 3;
      } else {
        errors.push(`Row ${rowNum}: unrecognized correct answer "${correctRaw}".`);
        return;
      }
    }

    questions.push({
      id: `dq-csv-${now}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      topic,
      subtopic: subtopic || undefined,
      difficulty,
      question: prompt,
      options: [optA, optB, optC, optD],
      correctIndex,
      status: defaultStatus,
      isActive: true,
      timesUsed: 0,
      lastUsedAt: null,
      recentlySeenBy: [],
      flaggedCount: 0,
      flaggedReasons: [],
      flaggedByUserIds: [],
      createdAt: now + i,
    });
  });

  return { questions, errors };
}

export function formatDuelDuration(ms: number): string {
  const secs = Math.max(0, Math.round(ms / 100) / 10);
  if (secs < 60) return `${secs.toFixed(1)}s`;
  const m = Math.floor(secs / 60);
  const rem = (secs % 60).toFixed(1);
  return `${m}m ${rem}s`;
}

/* ================= DETAILED 1V1 ELO & STREAK ENGINE ================= */

export interface DuelEloTier {
  id: string;
  name: string;
  minElo: number;
  maxElo: number | null;
  textClass: string;
  borderClass: string;
  bgClass: string;
  accentHex: string;
  nextTierName: string | null;
  nextTierMinElo: number | null;
  progressPct: number;
}

export const DUEL_ELO_TIERS: {
  id: string;
  name: string;
  minElo: number;
  maxElo: number | null;
  textClass: string;
  borderClass: string;
  bgClass: string;
  accentHex: string;
}[] = [
  {
    id: 'iron',
    name: 'Iron Challenger',
    minElo: 0,
    maxElo: 1099,
    textClass: 'text-neutral-300',
    borderClass: 'border-neutral-500/40',
    bgClass: 'bg-neutral-500/10',
    accentHex: '#9ca3af',
  },
  {
    id: 'bronze',
    name: 'Bronze Tactician',
    minElo: 1100,
    maxElo: 1249,
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/10',
    accentHex: '#f59e0b',
  },
  {
    id: 'silver',
    name: 'Silver Duelist',
    minElo: 1250,
    maxElo: 1399,
    textClass: 'text-slate-200',
    borderClass: 'border-slate-300/45',
    bgClass: 'bg-slate-400/10',
    accentHex: '#cbd5e1',
  },
  {
    id: 'gold',
    name: 'Gold Strategist',
    minElo: 1400,
    maxElo: 1599,
    textClass: 'text-[#f8e6a0]',
    borderClass: 'border-[#d4af37]/50',
    bgClass: 'bg-[#d4af37]/12',
    accentHex: '#d4af37',
  },
  {
    id: 'platinum',
    name: 'Platinum Master',
    minElo: 1600,
    maxElo: 1799,
    textClass: 'text-cyan-200',
    borderClass: 'border-cyan-400/50',
    bgClass: 'bg-cyan-500/12',
    accentHex: '#22d3ee',
  },
  {
    id: 'diamond',
    name: 'Diamond Grandmaster',
    minElo: 1800,
    maxElo: 1999,
    textClass: 'text-[#83B9FF]',
    borderClass: 'border-[#3988FF]/55',
    bgClass: 'bg-[#3988FF]/15',
    accentHex: '#3988FF',
  },
  {
    id: 'mythic',
    name: 'Mythic Sovereign',
    minElo: 2000,
    maxElo: null,
    textClass: 'text-emerald-200',
    borderClass: 'border-emerald-400/55',
    bgClass: 'bg-emerald-500/15',
    accentHex: '#34d399',
  },
];

export function getDuelEloTier(elo: number): DuelEloTier {
  let idx = 0;
  for (let i = 0; i < DUEL_ELO_TIERS.length; i++) {
    const t = DUEL_ELO_TIERS[i];
    if (elo >= t.minElo && (t.maxElo === null || elo <= t.maxElo)) {
      idx = i;
      break;
    }
  }
  const current = DUEL_ELO_TIERS[idx];
  const next = DUEL_ELO_TIERS[idx + 1] || null;
  let progressPct = 100;
  if (next) {
    const span = Math.max(1, next.minElo - current.minElo);
    progressPct = Math.max(
      0,
      Math.min(100, Math.round(((elo - current.minElo) / span) * 100))
    );
  }
  return {
    ...current,
    nextTierName: next ? next.name : null,
    nextTierMinElo: next ? next.minElo : null,
    progressPct,
  };
}

export function getDuelKFactor(
  elo: number,
  duelsPlayed: number
): { k: number; label: string } {
  if (duelsPlayed < PROVISIONAL_DUEL_THRESHOLD) {
    return { k: 40, label: 'K=40 Provisional (<5 duels)' };
  }
  if (elo < 1600) {
    return { k: 32, label: 'K=32 Standard (<1600)' };
  }
  if (elo < 2000) {
    return { k: 24, label: 'K=24 Master (1600–1999)' };
  }
  return { k: 16, label: 'K=16 Sovereign (2000+)' };
}

export function computeExpectedWinProb(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

export interface DuelEloMatchDelta {
  matchId: string;
  topic: string;
  settledAt: number;
  opponentId: string;
  preElo: number;
  postElo: number;
  delta: number;
  expectedScore: number;
  actualScore: 1 | 0.5 | 0;
  kFactor: number;
  kLabel: string;
  topicPreElo: number;
  topicPostElo: number;
  topicDelta: number;
  myMarks: number;
  oppMarks: number;
  totalQuestions: number;
  myTimeMs: number;
  oppTimeMs: number;
}

export interface DuelTopicEloStats {
  topic: string;
  elo: number;
  peakElo: number;
  duels: number;
  wins: number;
  losses: number;
  draws: number;
  currentWinStreak: number;
  bestWinStreak: number;
}

export interface UserDuelEloProfile {
  userId: string;
  overallElo: number;
  peakElo: number;
  lowestElo: number;
  netChange: number;
  duelsPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  provisional: boolean;
  kFactor: number;
  kLabel: string;
  tier: DuelEloTier;
  currentStreakType: 'W' | 'L' | 'D' | null;
  currentStreakCount: number;
  bestWinStreak: number;
  bestTopicStreak: { topic: string; count: number } | null;
  performanceRating: number;
  topicElos: Record<string, DuelTopicEloStats>;
  history: DuelEloMatchDelta[];
}

export interface DuelEloLedger {
  profiles: Record<string, UserDuelEloProfile>;
  matchDeltas: Record<
    string,
    { challenger: DuelEloMatchDelta; opponent: DuelEloMatchDelta }
  >;
  leaderboard: UserDuelEloProfile[];
}

export function computeAllDuelElos(
  matches: DuelMatch[],
  users: DqrUser[]
): DuelEloLedger {
  interface MutableUserState {
    userId: string;
    overallElo: number;
    peakElo: number;
    lowestElo: number;
    duelsPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    currentStreakType: 'W' | 'L' | 'D' | null;
    currentStreakCount: number;
    bestWinStreak: number;
    oppEloSum: number;
    scoreSum: number;
    topicElos: Record<string, DuelTopicEloStats>;
    history: DuelEloMatchDelta[];
  }

  const stateMap = new Map<string, MutableUserState>();
  const ensureUser = (uid: string): MutableUserState => {
    let s = stateMap.get(uid);
    if (!s) {
      s = {
        userId: uid,
        overallElo: STARTING_DUEL_ELO,
        peakElo: STARTING_DUEL_ELO,
        lowestElo: STARTING_DUEL_ELO,
        duelsPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        currentStreakType: null,
        currentStreakCount: 0,
        bestWinStreak: 0,
        oppEloSum: 0,
        scoreSum: 0,
        topicElos: {},
        history: [],
      };
      stateMap.set(uid, s);
    }
    return s;
  };

  for (const u of users) {
    ensureUser(u.id);
  }

  const completed = matches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => (a.settledAt || a.createdAt) - (b.settledAt || b.createdAt));

  const matchDeltas: Record<
    string,
    { challenger: DuelEloMatchDelta; opponent: DuelEloMatchDelta }
  > = {};

  const ensureTopic = (
    st: MutableUserState,
    topic: string
  ): DuelTopicEloStats => {
    if (!st.topicElos[topic]) {
      st.topicElos[topic] = {
        topic,
        elo: STARTING_DUEL_ELO,
        peakElo: STARTING_DUEL_ELO,
        duels: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        currentWinStreak: 0,
        bestWinStreak: 0,
      };
    }
    return st.topicElos[topic];
  };

  for (const m of completed) {
    const cState = ensureUser(m.challengerId);
    const oState = ensureUser(m.opponentId);
    const cTopic = ensureTopic(cState, m.topic);
    const oTopic = ensureTopic(oState, m.topic);

    const cPre = cState.overallElo;
    const oPre = oState.overallElo;
    const cTopicPre = cTopic.elo;
    const oTopicPre = oTopic.elo;

    const cKInfo = getDuelKFactor(cPre, cState.duelsPlayed);
    const oKInfo = getDuelKFactor(oPre, oState.duelsPlayed);
    const cTopicK = getDuelKFactor(cTopicPre, cTopic.duels).k;
    const oTopicK = getDuelKFactor(oTopicPre, oTopic.duels).k;

    const cExp = computeExpectedWinProb(cPre, oPre);
    const oExp = 1 - cExp;

    const cTopicExp = computeExpectedWinProb(cTopicPre, oTopicPre);
    const oTopicExp = 1 - cTopicExp;

    const cActual: 1 | 0.5 | 0 =
      m.winnerId === m.challengerId ? 1 : m.winnerId === 'draw' ? 0.5 : 0;
    const oActual: 1 | 0.5 | 0 =
      m.winnerId === m.opponentId ? 1 : m.winnerId === 'draw' ? 0.5 : 0;

    const cDelta = Math.round(cKInfo.k * (cActual - cExp));
    const oDelta = Math.round(oKInfo.k * (oActual - oExp));
    const cTopicDelta = Math.round(cTopicK * (cActual - cTopicExp));
    const oTopicDelta = Math.round(oTopicK * (oActual - oTopicExp));

    const cPost = Math.max(400, cPre + cDelta);
    const oPost = Math.max(400, oPre + oDelta);
    const cTopicPost = Math.max(400, cTopicPre + cTopicDelta);
    const oTopicPost = Math.max(400, oTopicPre + oTopicDelta);

    // Update overall stats
    cState.overallElo = cPost;
    cState.peakElo = Math.max(cState.peakElo, cPost);
    cState.lowestElo = Math.min(cState.lowestElo, cPost);
    cState.duelsPlayed += 1;
    cState.oppEloSum += oPre;
    cState.scoreSum += cActual;

    oState.overallElo = oPost;
    oState.peakElo = Math.max(oState.peakElo, oPost);
    oState.lowestElo = Math.min(oState.lowestElo, oPost);
    oState.duelsPlayed += 1;
    oState.oppEloSum += cPre;
    oState.scoreSum += oActual;

    const applyStreak = (
      st: MutableUserState,
      tStats: DuelTopicEloStats,
      outcome: 1 | 0.5 | 0
    ) => {
      const code: 'W' | 'L' | 'D' =
        outcome === 1 ? 'W' : outcome === 0 ? 'L' : 'D';
      if (st.currentStreakType === code) {
        st.currentStreakCount += 1;
      } else {
        st.currentStreakType = code;
        st.currentStreakCount = 1;
      }
      if (outcome === 1) {
        st.wins += 1;
        st.bestWinStreak = Math.max(st.bestWinStreak, st.currentStreakCount);
        tStats.wins += 1;
        tStats.currentWinStreak += 1;
        tStats.bestWinStreak = Math.max(
          tStats.bestWinStreak,
          tStats.currentWinStreak
        );
      } else if (outcome === 0) {
        st.losses += 1;
        tStats.losses += 1;
        tStats.currentWinStreak = 0;
      } else {
        st.draws += 1;
        tStats.draws += 1;
        tStats.currentWinStreak = 0;
      }
    };

    cTopic.duels += 1;
    cTopic.elo = cTopicPost;
    cTopic.peakElo = Math.max(cTopic.peakElo, cTopicPost);
    applyStreak(cState, cTopic, cActual);

    oTopic.duels += 1;
    oTopic.elo = oTopicPost;
    oTopic.peakElo = Math.max(oTopic.peakElo, oTopicPost);
    applyStreak(oState, oTopic, oActual);

    const settledAt = m.settledAt || m.createdAt;
    const totalQuestions = m.questionIds.length || 10;

    const cDeltaRecord: DuelEloMatchDelta = {
      matchId: m.id,
      topic: m.topic,
      settledAt,
      opponentId: m.opponentId,
      preElo: cPre,
      postElo: cPost,
      delta: cDelta,
      expectedScore: cExp,
      actualScore: cActual,
      kFactor: cKInfo.k,
      kLabel: cKInfo.label,
      topicPreElo: cTopicPre,
      topicPostElo: cTopicPost,
      topicDelta: cTopicDelta,
      myMarks: m.challengerProgress.correctCount,
      oppMarks: m.opponentProgress.correctCount,
      totalQuestions,
      myTimeMs: m.challengerProgress.totalTimeMs,
      oppTimeMs: m.opponentProgress.totalTimeMs,
    };

    const oDeltaRecord: DuelEloMatchDelta = {
      matchId: m.id,
      topic: m.topic,
      settledAt,
      opponentId: m.challengerId,
      preElo: oPre,
      postElo: oPost,
      delta: oDelta,
      expectedScore: oExp,
      actualScore: oActual,
      kFactor: oKInfo.k,
      kLabel: oKInfo.label,
      topicPreElo: oTopicPre,
      topicPostElo: oTopicPost,
      topicDelta: oTopicDelta,
      myMarks: m.opponentProgress.correctCount,
      oppMarks: m.challengerProgress.correctCount,
      totalQuestions,
      myTimeMs: m.opponentProgress.totalTimeMs,
      oppTimeMs: m.challengerProgress.totalTimeMs,
    };

    cState.history.push(cDeltaRecord);
    oState.history.push(oDeltaRecord);
    matchDeltas[m.id] = {
      challenger: cDeltaRecord,
      opponent: oDeltaRecord,
    };
  }

  const profiles: Record<string, UserDuelEloProfile> = {};
  for (const [uid, s] of stateMap.entries()) {
    // FIDE Performance Rating approximation: avgOppElo + 400 * (W - L) / N
    const performanceRating =
      s.duelsPlayed > 0
        ? Math.round(
            s.oppEloSum / s.duelsPlayed +
              (400 * (s.wins - s.losses)) / s.duelsPlayed
          )
        : STARTING_DUEL_ELO;

    let bestTopicStreak: { topic: string; count: number } | null = null;
    for (const ts of Object.values(s.topicElos)) {
      if (
        ts.currentWinStreak > 0 &&
        (!bestTopicStreak || ts.currentWinStreak > bestTopicStreak.count)
      ) {
        bestTopicStreak = { topic: ts.topic, count: ts.currentWinStreak };
      }
    }

    const kNow = getDuelKFactor(s.overallElo, s.duelsPlayed);
    profiles[uid] = {
      userId: uid,
      overallElo: s.overallElo,
      peakElo: s.peakElo,
      lowestElo: s.lowestElo,
      netChange: s.overallElo - STARTING_DUEL_ELO,
      duelsPlayed: s.duelsPlayed,
      wins: s.wins,
      losses: s.losses,
      draws: s.draws,
      provisional: s.duelsPlayed < PROVISIONAL_DUEL_THRESHOLD,
      kFactor: kNow.k,
      kLabel: kNow.label,
      tier: getDuelEloTier(s.overallElo),
      currentStreakType: s.currentStreakType,
      currentStreakCount: s.currentStreakCount,
      bestWinStreak: s.bestWinStreak,
      bestTopicStreak,
      performanceRating,
      topicElos: s.topicElos,
      history: s.history,
    };
  }

  const leaderboard = Object.values(profiles).sort((a, b) => {
    if (b.overallElo !== a.overallElo) return b.overallElo - a.overallElo;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.duelsPlayed - a.duelsPlayed;
  });

  return { profiles, matchDeltas, leaderboard };
}

/* ================= QUESTION BANK DUPLICATE DETECTOR ================= */

export function normalizeQuestionPrompt(text: string): string {
  return text
    .toLowerCase()
    .replace(/['"`“”‘’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenOverlapRatio(normA: string, normB: string): number {
  const wordsA = new Set(normA.split(' ').filter((w) => w.length > 2));
  const wordsB = new Set(normB.split(' ').filter((w) => w.length > 2));
  if (wordsA.size < 4 || wordsB.size < 4) return 0;
  let shared = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) shared += 1;
  }
  const denom = Math.max(wordsA.size, wordsB.size);
  return denom > 0 ? shared / denom : 0;
}

export function findPotentialDuplicate(
  questions: DuelQuestion[],
  candidatePrompt: string,
  excludeId?: string | null
): { question: DuelQuestion; matchType: 'exact' | 'similar' } | null {
  const norm = normalizeQuestionPrompt(candidatePrompt);
  if (norm.length < 6) return null;

  for (const q of questions) {
    if (excludeId && q.id === excludeId) continue;
    const qNorm = normalizeQuestionPrompt(q.question);
    if (!qNorm) continue;
    if (qNorm === norm) {
      return { question: q, matchType: 'exact' };
    }
  }

  for (const q of questions) {
    if (excludeId && q.id === excludeId) continue;
    const qNorm = normalizeQuestionPrompt(q.question);
    if (!qNorm) continue;
    if (tokenOverlapRatio(norm, qNorm) >= 0.85) {
      return { question: q, matchType: 'similar' };
    }
  }

  return null;
}

export function findDuplicateQuestionGroups(
  questions: DuelQuestion[]
): DuelQuestion[][] {
  const map = new Map<string, DuelQuestion[]>();
  for (const q of questions) {
    const norm = normalizeQuestionPrompt(q.question);
    if (!norm) continue;
    const list = map.get(norm) || [];
    list.push(q);
    map.set(norm, list);
  }
  return Array.from(map.values()).filter((group) => group.length > 1);
}
