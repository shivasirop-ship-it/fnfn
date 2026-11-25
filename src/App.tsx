import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Lock, LogOut, Menu, X } from 'lucide-react';
import {
  AchievementDef,
  AnonQuestionCategory,
  AnonymousQuestion,
  ArchivedNewspaperEdition,
  AuctionItem,
  CertificateRecord,
  ChallengeClaimRequest,
  DailyUserQuote,
  DqrUser,
  DuelConfig,
  DuelMatch,
  DuelParticipantProgress,
  DuelQuestion,
  GalleryPhoto,
  IntroSettings,
  LevelRange,
  MainTab,
  NewspaperEdition,
  PastWinnerRecord,
  QuizRecord,
  RankDef,
  RivalHistoryEvent,
  RivalRecord,
  StreakBand,
  SystemChallenge,
  SystemConfig,
  SystemGuidanceItem,
  SystemMessage,
  SystemPrediction,
  Territory,
  TitleItem,
  UserQuoteReactionKey,
  UserQuoteTag,
  UserWeeklyTracker,
  VerdictRecord,
} from './types';
import {
  buildUserSnapshot,
  countUserTerritories,
  formatRivalDate,
  parseQuestionsCount,
  resolveRank,
} from './utils/rivalHelpers';
import {
  createFreshWeeklySummary,
  createInitialWeeklyTracker,
  getWeekStartIso,
} from './utils/weeklyHelpers';
import { computeUserDethroneAlerts } from './utils/territoryHelpers';
import {
  buildTimeOfDayGreeting,
  buildYearEndLetterData,
  getLocalDayKey,
  isDecember31,
  TimeOfDayGreeting,
  YearlyUserRecord,
  YearEndLetterData,
} from './utils/yearEndHelpers';
import {
  DUEL_ACCEPT_WINDOW_MS,
  DUEL_REQUIRED_XP,
  selectDuelQuestions,
} from './utils/duelHelpers';
import {
  INITIAL_DUEL_CONFIG,
  INITIAL_DUEL_QUESTIONS,
} from './data/duelBankSeed';
import {
  INITIAL_AUCTIONS,
  INITIAL_BS_YEARS,
  INITIAL_CHALLENGES,
  INITIAL_GALLERY,
  INITIAL_GUIDANCE,
  INITIAL_INTRO_SETTINGS,
  INITIAL_NEWSPAPER,
  INITIAL_PAST_WINNERS,
  INITIAL_PREDICTIONS,
  INITIAL_QUIZZES,
  INITIAL_SYSTEM_CONFIG,
  INITIAL_SYSTEM_MESSAGES,
  INITIAL_TERRITORIES,
  INITIAL_USERS,
  INITIAL_VERDICTS,
} from './data/initialData';
import {
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_LEVEL_RANGES,
  DEFAULT_RANKS,
  DEFAULT_STREAK_BANDS,
  FIFTY_TITLE_PRESETS,
  getXpCostForNextLevel,
} from './data/presets';
import { IntroductionPage } from './components/IntroductionPage';
import { HallOfFame } from './components/HallOfFame';
import { AscensionPath } from './components/AscensionPath';
import { TerritoriesPage } from './components/TerritoriesPage';
import { NewspaperPage } from './components/NewspaperPage';
import { SystemPage } from './components/SystemPage';
import { ExtraEnjoyPage, ExtraEnjoySubTab } from './components/ExtraEnjoyPage';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ToastHost, ToastItem, ToastTone } from './components/ToastHost';
import { YearEndLetterModal } from './components/YearEndLetterModal';
import {
  deleteQuizFromSupabaseTable,
  deleteUserFromSupabaseTable,
  loadAllStoreFromSupabase,
  loadQuizzesFromSupabaseTable,
  loadSystemMessagesFromSupabaseTable,
  loadTerritoriesFromSupabaseTable,
  loadUsersFromSupabaseTable,
  mapSupabaseRowToQuiz,
  mapSupabaseRowToSystemMessage,
  mapSupabaseRowToTerritory,
  mapSupabaseRowToUser,
  saveStoreToSupabase,
  supabase,
  syncQuizzesToSupabaseTable,
  syncSystemMessagesToSupabaseTable,
  syncTerritoriesToSupabaseTable,
  syncUsersToSupabaseTable,
  upsertQuizToSupabaseTable,
  upsertSystemMessageToSupabaseTable,
  upsertTerritoryToSupabaseTable,
  upsertUserToSupabaseTable,
} from './lib/supabase';

const FALLBACK_TERRITORY_ICONS: Record<
  string,
  { iconType: Territory['iconType']; customIconUrl: string | null }
> = Object.fromEntries(
  INITIAL_TERRITORIES.map((t) => [
    t.id,
    { iconType: t.iconType, customIconUrl: t.customIconUrl },
  ])
);

const STORAGE_KEYS = {
  intro: 'dqr_v2_intro',
  years: 'dqr_v2_years',
  quizzes: 'dqr_v2_quizzes',
  gallery: 'dqr_v2_gallery',
  users: 'dqr_v2_users',
  session: 'dqr_v2_session',
  ranks: 'dqr_v2_ranks',
  levels: 'dqr_v2_levels',
  streaks: 'dqr_v2_streaks',
  titles: 'dqr_v2_titles',
  auctions: 'dqr_v2_auctions',
  pastWinners: 'dqr_v2_past_winners',
  certificates: 'dqr_v2_certificates',
  territories: 'dqr_v2_territories',
  newspaper: 'dqr_v2_newspaper',
  newspaperArchive: 'dqr_v2_newspaper_archive',
  dismissedDethrones: 'dqr_v2_dismissed_dethrones',
  sysConfig: 'dqr_v2_sys_config',
  sysMsgs: 'dqr_v2_sys_msgs',
  predictions: 'dqr_v2_predictions',
  guidance: 'dqr_v2_guidance',
  challenges: 'dqr_v2_challenges',
  challengeClaims: 'dqr_v2_challenge_claims',
  verdicts: 'dqr_v2_verdicts',
  rivalries: 'dqr_v2_rivalries',
  weeklyTrackers: 'dqr_v2_weekly_trackers',
  anonQuestions: 'dqr_v2_anon_questions',
  userQuotes: 'dqr_v2_user_quotes',
  userMoods: 'dqr_v2_user_moods',
  yearlyRecords: 'dqr_v2_yearly_records',
  dailyCheckins: 'dqr_v2_daily_checkins',
  yearEndSeen: 'dqr_v2_yearend_seen',
  duelQuestions: 'dqr_v2_duel_questions',
  duelConfig: 'dqr_v2_duel_config',
  duelMatches: 'dqr_v2_duel_matches',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [pendingTab, setPendingTab] = useState<MainTab | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const pushToast = (message: string, tone: ToastTone = 'gold') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  };

  const [introSettings, setIntroSettings] = useState<IntroSettings>(() =>
    loadStored(STORAGE_KEYS.intro, INITIAL_INTRO_SETTINGS)
  );
  const [bsYears, setBsYears] = useState<string[]>(() =>
    loadStored(STORAGE_KEYS.years, INITIAL_BS_YEARS)
  );
  const [quizzes, setQuizzes] = useState<QuizRecord[]>(() =>
    loadStored(STORAGE_KEYS.quizzes, INITIAL_QUIZZES)
  );
  const [gallery, setGallery] = useState<GalleryPhoto[]>(() =>
    loadStored(STORAGE_KEYS.gallery, INITIAL_GALLERY)
  );
  const [users, setUsers] = useState<DqrUser[]>(() =>
    loadStored(STORAGE_KEYS.users, INITIAL_USERS)
  );
  // Logged out by default unless a verified session was stored
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    loadStored<string | null>(STORAGE_KEYS.session, null)
  );

  const [ranks, setRanks] = useState<RankDef[]>(() =>
    loadStored(STORAGE_KEYS.ranks, DEFAULT_RANKS)
  );
  const [levelRanges, setLevelRanges] = useState<LevelRange[]>(() =>
    loadStored(STORAGE_KEYS.levels, DEFAULT_LEVEL_RANGES)
  );
  const [streakBands, setStreakBands] = useState<StreakBand[]>(() =>
    loadStored(STORAGE_KEYS.streaks, DEFAULT_STREAK_BANDS)
  );
  const [titles, setTitles] = useState<TitleItem[]>(() =>
    loadStored(STORAGE_KEYS.titles, FIFTY_TITLE_PRESETS)
  );
  const [achievements] = useState<AchievementDef[]>(DEFAULT_ACHIEVEMENTS);
  const [auctions, setAuctions] = useState<AuctionItem[]>(() =>
    loadStored(STORAGE_KEYS.auctions, INITIAL_AUCTIONS)
  );
  const [pastWinners, setPastWinners] = useState<PastWinnerRecord[]>(() =>
    loadStored(STORAGE_KEYS.pastWinners, INITIAL_PAST_WINNERS)
  );
  const [certificates, setCertificates] = useState<CertificateRecord[]>(() =>
    loadStored(STORAGE_KEYS.certificates, [])
  );
  const [territories, setTerritories] = useState<Territory[]>(() =>
    loadStored(STORAGE_KEYS.territories, INITIAL_TERRITORIES)
  );
  const [newspaper, setNewspaper] = useState<NewspaperEdition>(() =>
    loadStored(STORAGE_KEYS.newspaper, INITIAL_NEWSPAPER)
  );
  const [newspaperArchive, setNewspaperArchive] = useState<
    ArchivedNewspaperEdition[]
  >(() => loadStored(STORAGE_KEYS.newspaperArchive, []));
  const [dismissedDethroneIds, setDismissedDethroneIds] = useState<string[]>(
    () => loadStored(STORAGE_KEYS.dismissedDethrones, [])
  );
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() =>
    loadStored(STORAGE_KEYS.sysConfig, INITIAL_SYSTEM_CONFIG)
  );
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>(() =>
    loadStored(STORAGE_KEYS.sysMsgs, INITIAL_SYSTEM_MESSAGES)
  );
  const [predictions, setPredictions] = useState<SystemPrediction[]>(() =>
    loadStored(STORAGE_KEYS.predictions, INITIAL_PREDICTIONS)
  );
  const [guidance, setGuidance] = useState<SystemGuidanceItem[]>(() =>
    loadStored(STORAGE_KEYS.guidance, INITIAL_GUIDANCE)
  );
  const [challenges, setChallenges] = useState<SystemChallenge[]>(() =>
    loadStored(STORAGE_KEYS.challenges, INITIAL_CHALLENGES)
  );
  const [challengeClaims, setChallengeClaims] = useState<ChallengeClaimRequest[]>(
    () => loadStored(STORAGE_KEYS.challengeClaims, [])
  );
  const [verdicts, setVerdicts] = useState<VerdictRecord[]>(() =>
    loadStored(STORAGE_KEYS.verdicts, INITIAL_VERDICTS)
  );
  const [rivalries, setRivalries] = useState<RivalRecord[]>(() =>
    loadStored(STORAGE_KEYS.rivalries, [])
  );
  const [weeklyTrackers, setWeeklyTrackers] = useState<
    Record<string, UserWeeklyTracker>
  >(() => loadStored(STORAGE_KEYS.weeklyTrackers, {}));
  const [anonQuestions, setAnonQuestions] = useState<AnonymousQuestion[]>(() =>
    loadStored(STORAGE_KEYS.anonQuestions, [])
  );
  const [userQuotes, setUserQuotes] = useState<DailyUserQuote[]>(() =>
    loadStored(STORAGE_KEYS.userQuotes, [])
  );
  const [yearlyRecords, setYearlyRecords] = useState<
    Record<string, YearlyUserRecord>
  >(() => loadStored(STORAGE_KEYS.yearlyRecords, {}));
  const [duelQuestions, setDuelQuestions] = useState<DuelQuestion[]>(() =>
    loadStored(STORAGE_KEYS.duelQuestions, INITIAL_DUEL_QUESTIONS)
  );
  const [duelConfig, setDuelConfig] = useState<DuelConfig>(() =>
    loadStored(STORAGE_KEYS.duelConfig, INITIAL_DUEL_CONFIG)
  );
  const [duelMatches, setDuelMatches] = useState<DuelMatch[]>(() =>
    loadStored(STORAGE_KEYS.duelMatches, [])
  );
  const [dailyGreeting, setDailyGreeting] = useState<{
    userId: string;
    greeting: TimeOfDayGreeting;
  } | null>(null);
  const [yearEndLetterData, setYearEndLetterData] =
    useState<YearEndLetterData | null>(null);
  const [yearEndLetterOpen, setYearEndLetterOpen] = useState(false);
  const [extraSubTab, setExtraSubTab] =
    useState<ExtraEnjoySubTab>('question-form');
  const [goodbyeUsername, setGoodbyeUsername] = useState<string | null>(null);
  const goodbyeTimerRef = useRef<number | null>(null);

  const [supabaseReady, setSupabaseReady] = useState(false);
  const supabaseReadyRef = useRef(false);
  const supabaseHydratedRef = useRef(false);
  const usersRef = useRef(users);
  usersRef.current = users;
  const duelQuestionsRef = useRef(duelQuestions);
  duelQuestionsRef.current = duelQuestions;
  const duelConfigRef = useRef(duelConfig);
  duelConfigRef.current = duelConfig;
  const duelMatchesRef = useRef(duelMatches);
  duelMatchesRef.current = duelMatches;
  const duelBroadcastRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userMoodsRef = useRef<Record<string, string | null>>(
    loadStored<Record<string, string | null>>(STORAGE_KEYS.userMoods, {})
  );
  const quizzesRef = useRef(quizzes);
  quizzesRef.current = quizzes;
  const lastSyncedJsonRef = useRef<Record<string, string>>({});
  const lastSyncedUsersJsonRef = useRef<string>('');
  const lastSyncedQuizzesJsonRef = useRef<string>('');
  const lastSyncedTerritoriesJsonRef = useRef<string>('');
  const lastSyncedMessagesJsonRef = useRef<string>('');
  const skipNextRivalDiffRef = useRef(false);
  const prevRivalSnapshotRef = useRef<{
    users: Record<
      string,
      { xp: number; rankId: string; streak: number; questions: number }
    >;
    territoryCounts: Record<string, number>;
    challengeCompletions: Record<string, string[]>;
  } | null>(null);

  const applyRemoteStore = useCallback((remote: Record<string, unknown>) => {
    let anyDiff = false;
    const isChanged = (key: string): boolean => {
      if (!(key in remote) || remote[key] === undefined || remote[key] === null)
        return false;
      const serialized = JSON.stringify(remote[key]);
      if (lastSyncedJsonRef.current[key] === serialized) return false;
      lastSyncedJsonRef.current[key] = serialized;
      anyDiff = true;
      return true;
    };

    if (
      remote[STORAGE_KEYS.users] ||
      remote[STORAGE_KEYS.territories] ||
      remote[STORAGE_KEYS.challenges]
    ) {
      skipNextRivalDiffRef.current = true;
    }

    if (isChanged(STORAGE_KEYS.intro))
      setIntroSettings(remote[STORAGE_KEYS.intro] as IntroSettings);
    if (isChanged(STORAGE_KEYS.years))
      setBsYears(remote[STORAGE_KEYS.years] as string[]);
    if (isChanged(STORAGE_KEYS.quizzes)) {
      const nextQuizzes = remote[STORAGE_KEYS.quizzes] as QuizRecord[];
      lastSyncedQuizzesJsonRef.current =
        lastSyncedJsonRef.current[STORAGE_KEYS.quizzes];
      quizzesRef.current = nextQuizzes;
      setQuizzes(nextQuizzes);
    }
    if (isChanged(STORAGE_KEYS.gallery))
      setGallery(remote[STORAGE_KEYS.gallery] as GalleryPhoto[]);
    if (isChanged(STORAGE_KEYS.userMoods)) {
      const incomingMoods = remote[STORAGE_KEYS.userMoods] as Record<
        string,
        string | null
      >;
      userMoodsRef.current = { ...userMoodsRef.current, ...incomingMoods };
      try {
        localStorage.setItem(
          STORAGE_KEYS.userMoods,
          JSON.stringify(userMoodsRef.current)
        );
      } catch {
        // Ignore quota errors
      }
      if (!remote[STORAGE_KEYS.users]) {
        const patchedUsers = usersRef.current.map((u) =>
          u.id in incomingMoods ? { ...u, mood: incomingMoods[u.id] } : u
        );
        usersRef.current = patchedUsers;
        setUsers(patchedUsers);
      }
    }
    if (isChanged(STORAGE_KEYS.users)) {
      const nextUsers = (remote[STORAGE_KEYS.users] as DqrUser[]).map((u) => {
        if (u.mood !== undefined) return u;
        if (u.id in userMoodsRef.current) {
          return { ...u, mood: userMoodsRef.current[u.id] };
        }
        return u;
      });
      lastSyncedUsersJsonRef.current =
        lastSyncedJsonRef.current[STORAGE_KEYS.users];
      usersRef.current = nextUsers;
      setUsers(nextUsers);
    }
    if (isChanged(STORAGE_KEYS.ranks))
      setRanks(remote[STORAGE_KEYS.ranks] as RankDef[]);
    if (isChanged(STORAGE_KEYS.levels))
      setLevelRanges(remote[STORAGE_KEYS.levels] as LevelRange[]);
    if (isChanged(STORAGE_KEYS.streaks))
      setStreakBands(remote[STORAGE_KEYS.streaks] as StreakBand[]);
    if (isChanged(STORAGE_KEYS.titles))
      setTitles(remote[STORAGE_KEYS.titles] as TitleItem[]);
    if (isChanged(STORAGE_KEYS.auctions))
      setAuctions(remote[STORAGE_KEYS.auctions] as AuctionItem[]);
    if (isChanged(STORAGE_KEYS.pastWinners))
      setPastWinners(remote[STORAGE_KEYS.pastWinners] as PastWinnerRecord[]);
    if (isChanged(STORAGE_KEYS.certificates))
      setCertificates(remote[STORAGE_KEYS.certificates] as CertificateRecord[]);
    if (isChanged(STORAGE_KEYS.territories)) {
      lastSyncedTerritoriesJsonRef.current =
        lastSyncedJsonRef.current[STORAGE_KEYS.territories];
      setTerritories(remote[STORAGE_KEYS.territories] as Territory[]);
    }
    if (isChanged(STORAGE_KEYS.newspaper))
      setNewspaper(remote[STORAGE_KEYS.newspaper] as NewspaperEdition);
    if (isChanged(STORAGE_KEYS.newspaperArchive))
      setNewspaperArchive(
        remote[STORAGE_KEYS.newspaperArchive] as ArchivedNewspaperEdition[]
      );
    if (isChanged(STORAGE_KEYS.sysConfig))
      setSystemConfig(remote[STORAGE_KEYS.sysConfig] as SystemConfig);
    if (isChanged(STORAGE_KEYS.sysMsgs)) {
      lastSyncedMessagesJsonRef.current =
        lastSyncedJsonRef.current[STORAGE_KEYS.sysMsgs];
      setSystemMessages(remote[STORAGE_KEYS.sysMsgs] as SystemMessage[]);
    }
    if (isChanged(STORAGE_KEYS.predictions))
      setPredictions(remote[STORAGE_KEYS.predictions] as SystemPrediction[]);
    if (isChanged(STORAGE_KEYS.guidance))
      setGuidance(remote[STORAGE_KEYS.guidance] as SystemGuidanceItem[]);
    if (isChanged(STORAGE_KEYS.challenges))
      setChallenges(remote[STORAGE_KEYS.challenges] as SystemChallenge[]);
    if (isChanged(STORAGE_KEYS.challengeClaims))
      setChallengeClaims(
        remote[STORAGE_KEYS.challengeClaims] as ChallengeClaimRequest[]
      );
    if (isChanged(STORAGE_KEYS.verdicts))
      setVerdicts(remote[STORAGE_KEYS.verdicts] as VerdictRecord[]);
    if (isChanged(STORAGE_KEYS.rivalries))
      setRivalries(remote[STORAGE_KEYS.rivalries] as RivalRecord[]);
    if (isChanged(STORAGE_KEYS.weeklyTrackers))
      setWeeklyTrackers(
        remote[STORAGE_KEYS.weeklyTrackers] as Record<string, UserWeeklyTracker>
      );
    if (isChanged(STORAGE_KEYS.anonQuestions))
      setAnonQuestions(
        remote[STORAGE_KEYS.anonQuestions] as AnonymousQuestion[]
      );
    if (isChanged(STORAGE_KEYS.userQuotes))
      setUserQuotes(remote[STORAGE_KEYS.userQuotes] as DailyUserQuote[]);
    if (isChanged(STORAGE_KEYS.yearlyRecords))
      setYearlyRecords(
        remote[STORAGE_KEYS.yearlyRecords] as Record<string, YearlyUserRecord>
      );
    if (isChanged(STORAGE_KEYS.duelQuestions)) {
      const nextBank = remote[STORAGE_KEYS.duelQuestions] as DuelQuestion[];
      duelQuestionsRef.current = nextBank;
      setDuelQuestions(nextBank);
    }
    if (isChanged(STORAGE_KEYS.duelConfig)) {
      const nextCfg = remote[STORAGE_KEYS.duelConfig] as DuelConfig;
      duelConfigRef.current = nextCfg;
      setDuelConfig(nextCfg);
    }
    if (isChanged(STORAGE_KEYS.duelMatches)) {
      const nextMatches = remote[STORAGE_KEYS.duelMatches] as DuelMatch[];
      duelMatchesRef.current = nextMatches;
      setDuelMatches(nextMatches);
    }

    if (!anyDiff) {
      skipNextRivalDiffRef.current = false;
    }
  }, []);

  const hydrateFromSupabase = useCallback(async () => {
    const [remote, tableUsers, tableQuizzes, tableTerritories, tableMessages] =
      await Promise.all([
        loadAllStoreFromSupabase(),
        loadUsersFromSupabaseTable(),
        loadQuizzesFromSupabaseTable(),
        loadTerritoriesFromSupabaseTable(FALLBACK_TERRITORY_ICONS),
        loadSystemMessagesFromSupabaseTable(),
      ]);

    const merged: Record<string, unknown> = { ...remote };
    if (tableUsers && tableUsers.length > 0) {
      const moodById = new Map<string, string | null>(
        Object.entries(userMoodsRef.current)
      );
      for (const u of usersRef.current) {
        if (u.mood !== undefined) {
          moodById.set(u.id, u.mood ?? null);
        }
      }
      if (Array.isArray(remote[STORAGE_KEYS.users])) {
        for (const u of remote[STORAGE_KEYS.users] as DqrUser[]) {
          if (u.mood !== undefined) {
            moodById.set(u.id, u.mood ?? null);
          }
        }
      }
      const remoteMoods = remote[STORAGE_KEYS.userMoods] as
        | Record<string, string | null>
        | undefined;
      if (remoteMoods && typeof remoteMoods === 'object') {
        for (const [uid, moodVal] of Object.entries(remoteMoods)) {
          moodById.set(uid, moodVal ?? null);
        }
      }
      merged[STORAGE_KEYS.users] = tableUsers.map((u) =>
        moodById.has(u.id) ? { ...u, mood: moodById.get(u.id) ?? null } : u
      );
    }
    if (tableQuizzes && tableQuizzes.length > 0) {
      const storeQuizzes = Array.isArray(remote[STORAGE_KEYS.quizzes])
        ? (remote[STORAGE_KEYS.quizzes] as QuizRecord[])
        : [];
      const ratingsById = new Map<string, Record<string, number>>();
      for (const q of quizzesRef.current) {
        if (q.playerRatings && Object.keys(q.playerRatings).length > 0) {
          ratingsById.set(q.id, q.playerRatings);
        }
      }
      for (const q of storeQuizzes) {
        if (q.playerRatings && Object.keys(q.playerRatings).length > 0) {
          ratingsById.set(q.id, q.playerRatings);
        }
      }
      merged[STORAGE_KEYS.quizzes] = tableQuizzes.map((q) => {
        const preservedRatings = ratingsById.get(q.id);
        return preservedRatings ? { ...q, playerRatings: preservedRatings } : q;
      });
    }
    if (tableTerritories && tableTerritories.length > 0) {
      merged[STORAGE_KEYS.territories] = tableTerritories;
    }
    if (tableMessages && tableMessages.length > 0) {
      merged[STORAGE_KEYS.sysMsgs] = tableMessages;
    }

    if (Object.keys(merged).length > 0) {
      applyRemoteStore(merged);
    }
  }, [applyRemoteStore]);

  const refreshUsersFromSupabase = useCallback(async (): Promise<DqrUser[]> => {
    const tableUsers = await loadUsersFromSupabaseTable();
    if (tableUsers && tableUsers.length > 0) {
      const withMoods = tableUsers.map((u) => {
        const existing = usersRef.current.find((x) => x.id === u.id);
        const mood =
          u.id in userMoodsRef.current
            ? userMoodsRef.current[u.id]
            : existing?.mood;
        return mood !== undefined ? { ...u, mood } : u;
      });
      applyRemoteStore({ [STORAGE_KEYS.users]: withMoods });
      return withMoods;
    }
    return usersRef.current;
  }, [applyRemoteStore]);

  const flushUsersNow = useCallback(
    async (nextUsers: DqrUser[], changedUser?: DqrUser) => {
      const serialized = JSON.stringify(nextUsers);
      lastSyncedJsonRef.current[STORAGE_KEYS.users] = serialized;
      lastSyncedUsersJsonRef.current = serialized;
      try {
        localStorage.setItem(STORAGE_KEYS.users, serialized);
      } catch {
        // Ignore quota errors
      }
      if (!supabaseReadyRef.current) return;
      await Promise.all([
        changedUser
          ? upsertUserToSupabaseTable(changedUser)
          : syncUsersToSupabaseTable(nextUsers),
        saveStoreToSupabase(STORAGE_KEYS.users, nextUsers),
      ]);
    },
    []
  );

  // Hydrate shared state directly from Supabase tables + foreground/focus/poll + Realtime
  useEffect(() => {
    let active = true;
    (async () => {
      await hydrateFromSupabase();
      if (!active) return;
      supabaseHydratedRef.current = true;
      supabaseReadyRef.current = true;
      setSupabaseReady(true);
    })();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void hydrateFromSupabase();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void hydrateFromSupabase();
      }
    }, 6000);

    const realtimeChannel = supabase
      .channel('dqr-live-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dqr_app_store' },
        (payload) => {
          const row = payload.new as
            | { store_key?: string; payload?: unknown }
            | undefined;
          if (!row?.store_key || row.payload === undefined) return;
          // Dedicated tables stay authoritative over monolithic JSON copies,
          // except quizzes playerRatings which live in dqr_app_store until table schema includes them
          if (row.store_key === STORAGE_KEYS.quizzes && Array.isArray(row.payload)) {
            const incoming = row.payload as QuizRecord[];
            const ratingsById = new Map<string, Record<string, number>>();
            for (const item of incoming) {
              if (item.playerRatings && Object.keys(item.playerRatings).length > 0) {
                ratingsById.set(item.id, item.playerRatings);
              }
            }
            if (ratingsById.size > 0) {
              const patched = quizzesRef.current.map((q) => {
                const r = ratingsById.get(q.id);
                return r ? { ...q, playerRatings: r } : q;
              });
              applyRemoteStore({ [STORAGE_KEYS.quizzes]: patched });
            }
            return;
          }
          if (
            row.store_key === STORAGE_KEYS.users ||
            row.store_key === STORAGE_KEYS.quizzes ||
            row.store_key === STORAGE_KEYS.territories ||
            row.store_key === STORAGE_KEYS.sysMsgs
          ) {
            return;
          }
          applyRemoteStore({ [row.store_key]: row.payload });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dqr_users' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as { id?: string } | undefined;
            if (!oldRow?.id) return;
            const filtered = usersRef.current.filter((u) => u.id !== oldRow.id);
            applyRemoteStore({ [STORAGE_KEYS.users]: filtered });
            return;
          }
          const newRow = payload.new as Record<string, unknown> | undefined;
          if (!newRow?.id) return;
          const mappedRaw = mapSupabaseRowToUser(newRow);
          const existingUser = usersRef.current.find((u) => u.id === mappedRaw.id);
          const preservedMood =
            mappedRaw.id in userMoodsRef.current
              ? userMoodsRef.current[mappedRaw.id]
              : existingUser?.mood;
          const mapped =
            preservedMood !== undefined
              ? { ...mappedRaw, mood: preservedMood }
              : mappedRaw;
          const nextUsers = existingUser
            ? usersRef.current.map((u) => (u.id === mapped.id ? mapped : u))
            : [...usersRef.current, mapped];
          applyRemoteStore({ [STORAGE_KEYS.users]: nextUsers });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dqr_quizzes' },
        () => {
          void loadQuizzesFromSupabaseTable().then((list) => {
            if (list && list.length > 0) {
              const ratingsById = new Map<string, Record<string, number>>();
              for (const q of quizzesRef.current) {
                if (q.playerRatings && Object.keys(q.playerRatings).length > 0) {
                  ratingsById.set(q.id, q.playerRatings);
                }
              }
              const mergedList = list.map((q) => {
                const preserved = ratingsById.get(q.id);
                return preserved ? { ...q, playerRatings: preserved } : q;
              });
              applyRemoteStore({ [STORAGE_KEYS.quizzes]: mergedList });
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dqr_territories' },
        (payload) => {
          const newRow = payload.new as Record<string, unknown> | undefined;
          if (!newRow?.id) return;
          const mapped = mapSupabaseRowToTerritory(
            newRow,
            FALLBACK_TERRITORY_ICONS
          );
          setTerritories((prev) => {
            const exists = prev.some((t) => t.id === mapped.id);
            const next = exists
              ? prev.map((t) => (t.id === mapped.id ? mapped : t))
              : [...prev, mapped];
            const ser = JSON.stringify(next);
            lastSyncedJsonRef.current[STORAGE_KEYS.territories] = ser;
            lastSyncedTerritoriesJsonRef.current = ser;
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dqr_system_messages' },
        (payload) => {
          const newRow = payload.new as Record<string, unknown> | undefined;
          if (!newRow?.id) return;
          const mapped = mapSupabaseRowToSystemMessage(newRow);
          setSystemMessages((prev) => {
            const exists = prev.some((m) => m.id === mapped.id);
            const next = exists
              ? prev.map((m) => (m.id === mapped.id ? mapped : m))
              : [...prev, mapped];
            const ser = JSON.stringify(next);
            lastSyncedJsonRef.current[STORAGE_KEYS.sysMsgs] = ser;
            lastSyncedMessagesJsonRef.current = ser;
            return next;
          });
        }
      )
      .subscribe();

    const duelLiveChannel = supabase
      .channel('dqr-duel-live')
      .on('broadcast', { event: 'duel_sync' }, ({ payload }) => {
        if (!payload || typeof payload !== 'object') return;
        const p = payload as {
          duelMatches?: DuelMatch[];
          duelQuestions?: DuelQuestion[];
          duelConfig?: DuelConfig;
        };
        const patch: Record<string, unknown> = {};
        if (Array.isArray(p.duelMatches)) {
          patch[STORAGE_KEYS.duelMatches] = p.duelMatches;
        }
        if (Array.isArray(p.duelQuestions)) {
          patch[STORAGE_KEYS.duelQuestions] = p.duelQuestions;
        }
        if (p.duelConfig) {
          patch[STORAGE_KEYS.duelConfig] = p.duelConfig;
        }
        if (Object.keys(patch).length > 0) {
          applyRemoteStore(patch);
        }
      })
      .subscribe();
    duelBroadcastRef.current = duelLiveChannel;

    return () => {
      active = false;
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.clearInterval(pollInterval);
      duelBroadcastRef.current = null;
      void supabase.removeChannel(realtimeChannel);
      void supabase.removeChannel(duelLiveChannel);
    };
  }, [applyRemoteStore, hydrateFromSupabase]);

  // Refresh latest users right when login dialog opens
  useEffect(() => {
    if (loginOpen) {
      void refreshUsersFromSupabase();
    }
  }, [loginOpen, refreshUsersFromSupabase]);

  // Persist to localStorage & sync changed slices to Supabase dqr_app_store
  useEffect(() => {
    const entries: [string, unknown][] = [
      [STORAGE_KEYS.intro, introSettings],
      [STORAGE_KEYS.years, bsYears],
      [STORAGE_KEYS.quizzes, quizzes],
      [STORAGE_KEYS.gallery, gallery],
      [STORAGE_KEYS.users, users],
      [STORAGE_KEYS.ranks, ranks],
      [STORAGE_KEYS.levels, levelRanges],
      [STORAGE_KEYS.streaks, streakBands],
      [STORAGE_KEYS.titles, titles],
      [STORAGE_KEYS.auctions, auctions],
      [STORAGE_KEYS.pastWinners, pastWinners],
      [STORAGE_KEYS.certificates, certificates],
      [STORAGE_KEYS.territories, territories],
      [STORAGE_KEYS.newspaper, newspaper],
      [STORAGE_KEYS.newspaperArchive, newspaperArchive],
      [STORAGE_KEYS.sysConfig, systemConfig],
      [STORAGE_KEYS.sysMsgs, systemMessages],
      [STORAGE_KEYS.predictions, predictions],
      [STORAGE_KEYS.guidance, guidance],
      [STORAGE_KEYS.challenges, challenges],
      [STORAGE_KEYS.challengeClaims, challengeClaims],
      [STORAGE_KEYS.verdicts, verdicts],
      [STORAGE_KEYS.rivalries, rivalries],
      [STORAGE_KEYS.weeklyTrackers, weeklyTrackers],
      [STORAGE_KEYS.anonQuestions, anonQuestions],
      [STORAGE_KEYS.userQuotes, userQuotes],
      [STORAGE_KEYS.yearlyRecords, yearlyRecords],
      [STORAGE_KEYS.duelQuestions, duelQuestions],
      [STORAGE_KEYS.duelConfig, duelConfig],
      [STORAGE_KEYS.duelMatches, duelMatches],
    ];

    try {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(currentUserId));
      localStorage.setItem(
        STORAGE_KEYS.dismissedDethrones,
        JSON.stringify(dismissedDethroneIds)
      );
      for (const [k, val] of entries) {
        localStorage.setItem(k, JSON.stringify(val));
      }
    } catch {
      // Ignore quota exceeded on large fallback assets
    }

    if (!supabaseReady || !supabaseHydratedRef.current) return;

    const timer = setTimeout(() => {
      for (const [k, val] of entries) {
        const serialized = JSON.stringify(val);
        if (lastSyncedJsonRef.current[k] !== serialized) {
          lastSyncedJsonRef.current[k] = serialized;
          void saveStoreToSupabase(k, val);
        }
      }

      const serializedUsers = JSON.stringify(users);
      if (lastSyncedUsersJsonRef.current !== serializedUsers) {
        lastSyncedUsersJsonRef.current = serializedUsers;
        void syncUsersToSupabaseTable(users);
      }

      const serializedQuizzes = JSON.stringify(quizzes);
      if (lastSyncedQuizzesJsonRef.current !== serializedQuizzes) {
        lastSyncedQuizzesJsonRef.current = serializedQuizzes;
        void syncQuizzesToSupabaseTable(quizzes);
      }

      const serializedTerritories = JSON.stringify(territories);
      if (lastSyncedTerritoriesJsonRef.current !== serializedTerritories) {
        lastSyncedTerritoriesJsonRef.current = serializedTerritories;
        void syncTerritoriesToSupabaseTable(territories);
      }

      const serializedMessages = JSON.stringify(systemMessages);
      if (lastSyncedMessagesJsonRef.current !== serializedMessages) {
        lastSyncedMessagesJsonRef.current = serializedMessages;
        void syncSystemMessagesToSupabaseTable(systemMessages);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [
    supabaseReady,
    introSettings,
    bsYears,
    quizzes,
    gallery,
    users,
    currentUserId,
    ranks,
    levelRanges,
    streakBands,
    titles,
    auctions,
    pastWinners,
    certificates,
    territories,
    newspaper,
    newspaperArchive,
    dismissedDethroneIds,
    systemConfig,
    systemMessages,
    predictions,
    guidance,
    challenges,
    challengeClaims,
    verdicts,
    rivalries,
    weeklyTrackers,
    anonQuestions,
    userQuotes,
    yearlyRecords,
    duelQuestions,
    duelConfig,
    duelMatches,
  ]);

  // Track changes in XP earned (gains only), territories, streak, questions, rank, and completed challenges for active rivalries
  useEffect(() => {
    const nextUsersSnap: Record<
      string,
      { xp: number; rankId: string; streak: number; questions: number }
    > = {};
    const nextTerrCounts: Record<string, number> = {};
    for (const u of users) {
      nextUsersSnap[u.id] = {
        xp: u.xp,
        rankId: u.rankId,
        streak: u.streak,
        questions: parseQuestionsCount(u.reportCard?.totalQuestionsStudied),
      };
      nextTerrCounts[u.id] = countUserTerritories(u.id, territories);
    }

    const nextChalSnap: Record<string, string[]> = {};
    for (const c of challenges) {
      nextChalSnap[c.id] = [...c.completedByUserIds];
    }

    const currentSnap = {
      users: nextUsersSnap,
      territoryCounts: nextTerrCounts,
      challengeCompletions: nextChalSnap,
    };

    const isInitialOrHydration =
      !prevRivalSnapshotRef.current || skipNextRivalDiffRef.current;
    const prevSnap = prevRivalSnapshotRef.current;
    prevRivalSnapshotRef.current = currentSnap;
    if (skipNextRivalDiffRef.current) {
      skipNextRivalDiffRef.current = false;
    }

    // Update weekly trackers (ensure baseline, handle week rollover, and accumulate weekly gains)
    const currentWeekIso = getWeekStartIso(new Date());
    setWeeklyTrackers((prevTrackers) => {
      let changed = false;
      const nextTrackers: Record<string, UserWeeklyTracker> = { ...prevTrackers };

      for (const u of users) {
        const nextU = nextUsersSnap[u.id];
        const nextTerr = nextTerrCounts[u.id] ?? 0;
        const existing = nextTrackers[u.id];

        if (!existing) {
          nextTrackers[u.id] = createInitialWeeklyTracker(u, territories);
          changed = true;
          continue;
        }

        if (existing.activeWeek.weekStartIso !== currentWeekIso) {
          const archivedWeek = {
            ...existing.activeWeek,
            dismissedEndOfWeek: false,
          };
          nextTrackers[u.id] = {
            activeWeek: createFreshWeeklySummary(u, territories, currentWeekIso),
            completedWeeks: [archivedWeek, ...existing.completedWeeks].slice(0, 12),
          };
          changed = true;
          continue;
        }

        if (!isInitialOrHydration && prevSnap) {
          const prevU = prevSnap.users[u.id];
          const prevTerr = prevSnap.territoryCounts[u.id] ?? 0;
          const xpGain = prevU && nextU.xp > prevU.xp ? nextU.xp - prevU.xp : 0;
          const terrGain = nextTerr > prevTerr ? nextTerr - prevTerr : 0;

          if (
            xpGain > 0 ||
            terrGain > 0 ||
            existing.activeWeek.currentQuestions !== nextU.questions ||
            existing.activeWeek.currentStreak !== nextU.streak ||
            existing.activeWeek.currentTerritories !== nextTerr
          ) {
            nextTrackers[u.id] = {
              ...existing,
              activeWeek: {
                ...existing.activeWeek,
                xpEarned: existing.activeWeek.xpEarned + xpGain,
                currentQuestions: nextU.questions,
                currentStreak: nextU.streak,
                territoriesAcquired:
                  existing.activeWeek.territoriesAcquired + terrGain,
                currentTerritories: nextTerr,
              },
            };
            changed = true;
          }
        }
      }

      return changed ? nextTrackers : prevTrackers;
    });

    if (isInitialOrHydration || !prevSnap) {
      return;
    }

    const now = Date.now();
    const dateLabel = formatRivalDate(now);

    setRivalries((prevRivalries) => {
      let anyUpdated = false;
      const updated = prevRivalries.map((r) => {
        if (r.status !== 'active') return r;

        let nextReqEarned = r.requesterEarnedXp;
        let nextRecEarned = r.recipientEarnedXp;
        const newEvents: RivalHistoryEvent[] = [];

        const participants = [
          { id: r.requesterId, isRequester: true },
          { id: r.recipientId, isRequester: false },
        ];

        for (const part of participants) {
          const prevU = prevSnap.users[part.id];
          const nextU = nextUsersSnap[part.id];
          const userObj = users.find((u) => u.id === part.id);
          if (!prevU || !nextU || !userObj) continue;

          if (nextU.xp > prevU.xp) {
            const gained = nextU.xp - prevU.xp;
            if (part.isRequester) nextReqEarned += gained;
            else nextRecEarned += gained;
            newEvents.push({
              id: `rve-xp-${now}-${part.id}-${Math.random().toString(36).slice(2, 5)}`,
              timestamp: now,
              dateLabel,
              type: 'xp',
              actorUserId: part.id,
              title: `@${userObj.username} earned +${gained.toLocaleString()} XP`,
              detail: `${userObj.fullName} added +${gained.toLocaleString()} XP since the rivalry began.`,
            });
          }

          if (nextU.rankId !== prevU.rankId) {
            const oldRank = resolveRank(ranks, prevU.rankId)?.name || prevU.rankId;
            const newRank = resolveRank(ranks, nextU.rankId)?.name || nextU.rankId;
            newEvents.push({
              id: `rve-rk-${now}-${part.id}`,
              timestamp: now,
              dateLabel,
              type: 'rank',
              actorUserId: part.id,
              title: `@${userObj.username} rank updated to ${newRank}`,
              detail: `Progressed from ${oldRank} to ${newRank}.`,
            });
          }

          if (nextU.streak !== prevU.streak) {
            newEvents.push({
              id: `rve-st-${now}-${part.id}`,
              timestamp: now,
              dateLabel,
              type: 'streak',
              actorUserId: part.id,
              title: `@${userObj.username} streak reached ${nextU.streak} days`,
              detail:
                nextU.streak > prevU.streak
                  ? `Consistency climbed from ${prevU.streak} to ${nextU.streak} days.`
                  : `Streak adjusted from ${prevU.streak} to ${nextU.streak} days.`,
            });
          }

          if (nextU.questions !== prevU.questions) {
            newEvents.push({
              id: `rve-qs-${now}-${part.id}`,
              timestamp: now,
              dateLabel,
              type: 'questions',
              actorUserId: part.id,
              title: `@${userObj.username} updated Questions Completed`,
              detail: `Report Card count changed from ${prevU.questions.toLocaleString()} to ${nextU.questions.toLocaleString()} questions.`,
            });
          }

          const prevTerr = prevSnap.territoryCounts[part.id] ?? 0;
          const nextTerr = nextTerrCounts[part.id] ?? 0;
          if (nextTerr !== prevTerr) {
            newEvents.push({
              id: `rve-tr-${now}-${part.id}`,
              timestamp: now,
              dateLabel,
              type: 'territory',
              actorUserId: part.id,
              title:
                nextTerr > prevTerr
                  ? `@${userObj.username} acquired a Territory`
                  : `@${userObj.username} territory standing shifted`,
              detail: `Territories held moved from ${prevTerr} to ${nextTerr}.`,
            });
          }

          for (const chl of challenges) {
            const wasDone = (prevSnap.challengeCompletions[chl.id] || []).includes(
              part.id
            );
            const isDone = chl.completedByUserIds.includes(part.id);
            if (!wasDone && isDone) {
              newEvents.push({
                id: `rve-ch-${now}-${part.id}-${chl.id}`,
                timestamp: now,
                dateLabel,
                type: 'challenge',
                actorUserId: part.id,
                title: `@${userObj.username} completed “${chl.title}”`,
                detail: `Verified System Challenge (+${chl.rewardXp.toLocaleString()} XP reward).`,
              });
            }
          }
        }

        if (
          newEvents.length === 0 &&
          nextReqEarned === r.requesterEarnedXp &&
          nextRecEarned === r.recipientEarnedXp
        ) {
          return r;
        }

        anyUpdated = true;
        return {
          ...r,
          requesterEarnedXp: nextReqEarned,
          recipientEarnedXp: nextRecEarned,
          history: [...newEvents, ...r.history].slice(0, 100),
        };
      });

      return anyUpdated ? updated : prevRivalries;
    });
  }, [users, territories, challenges, ranks]);

  const currentUser = currentUserId
    ? users.find((u) => u.id === currentUserId) || null
    : null;
  const isLoggedIn = Boolean(currentUser);
  const isAdmin = currentUser?.role === 'admin';

  const dethroneAlerts = currentUser
    ? computeUserDethroneAlerts(
        currentUser.id,
        territories,
        dismissedDethroneIds
      )
    : [];

  const handleDismissDethroneAlert = (eventId: string) => {
    setDismissedDethroneIds((prev) =>
      prev.includes(eventId) ? prev : [...prev, eventId]
    );
  };

  const unreadSystemReplies = currentUser
    ? systemMessages.filter(
        (m) => m.userId === currentUser.id && m.sender === 'system' && !m.readByUser
      ).length
    : 0;
  const incomingRivalRequests = currentUser
    ? rivalries.filter(
        (r) => r.status === 'pending' && r.recipientId === currentUser.id
      ).length
    : 0;
  const pendingChallengeClaimsCount = challengeClaims.filter(
    (cl) => cl.status === 'pending'
  ).length;
  const unclaimedChallenges = currentUser
    ? challenges.filter(
        (c) =>
          (c.targetUserId === 'all' || c.targetUserId === currentUser.id) &&
          !c.completedByUserIds.includes(currentUser.id) &&
          !challengeClaims.some(
            (cl) =>
              cl.challengeId === c.id &&
              cl.userId === currentUser.id &&
              cl.status === 'pending'
          )
      ).length
    : 0;
  const incomingDuelRequests = currentUser
    ? duelMatches.filter(
        (m) =>
          m.status === 'pending' &&
          m.opponentId === currentUser.id &&
          Date.now() < m.expiresAt
      ).length
    : 0;
  const systemAlertCount =
    unreadSystemReplies +
    incomingRivalRequests +
    unclaimedChallenges +
    incomingDuelRequests;

  const canLevelUp = currentUser
    ? currentUser.xp >= getXpCostForNextLevel(currentUser.level, levelRanges)
    : false;

  // Track yearly rank/level/fall/comeback stats for the December 31 Year-End Letter
  useEffect(() => {
    const year = new Date().getFullYear();
    const rankOrderById = new Map(ranks.map((r) => [r.id, r.order]));
    setYearlyRecords((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const u of users) {
        const key = `${year}:${u.id}`;
        const existing = next[key];
        if (!existing) {
          next[key] = {
            year,
            startRankId: u.rankId,
            startLevel: u.level,
            fallsCount: 0,
            comebacksCount: 0,
            lastStreak: u.streak,
            lastRankId: u.rankId,
            pendingComeback: false,
          };
          changed = true;
          continue;
        }
        const prevOrder = rankOrderById.get(existing.lastRankId) ?? 99;
        const currOrder = rankOrderById.get(u.rankId) ?? 99;
        const rankDropped = currOrder > prevOrder;
        const streakDropped =
          existing.lastStreak >= 2 && u.streak < existing.lastStreak;
        const rankImproved = currOrder < prevOrder;
        const streakRecovered = u.streak > existing.lastStreak;

        let fallsCount = existing.fallsCount;
        let comebacksCount = existing.comebacksCount;
        let pendingComeback = existing.pendingComeback;

        if (rankDropped || streakDropped) {
          fallsCount += 1;
          pendingComeback = true;
        } else if (pendingComeback && (rankImproved || streakRecovered)) {
          comebacksCount += 1;
          pendingComeback = false;
        }

        if (
          fallsCount !== existing.fallsCount ||
          comebacksCount !== existing.comebacksCount ||
          pendingComeback !== existing.pendingComeback ||
          u.streak !== existing.lastStreak ||
          u.rankId !== existing.lastRankId
        ) {
          next[key] = {
            ...existing,
            fallsCount,
            comebacksCount,
            pendingComeback,
            lastStreak: u.streak,
            lastRankId: u.rankId,
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [users, ranks]);

  // Show Year-End Letter on December 31 if user refreshes while already signed in and hasn't dismissed today
  useEffect(() => {
    if (!currentUser || !isDecember31()) return;
    const yearKey = `${new Date().getFullYear()}:${currentUser.id}`;
    const seenMap = loadStored<Record<string, boolean>>(
      STORAGE_KEYS.yearEndSeen,
      {}
    );
    if (seenMap[yearKey]) return;
    setYearEndLetterData(
      buildYearEndLetterData(
        currentUser,
        quizzes,
        territories,
        ranks,
        bsYears,
        yearlyRecords
      )
    );
    setYearEndLetterOpen(true);
  }, [currentUser, quizzes, territories, ranks, bsYears, yearlyRecords]);

  // Ensure non-admins / logged-out users cannot remain on gated tabs
  useEffect(() => {
    const loginRequiredTabs: MainTab[] = [
      'ascension',
      'territories',
      'system',
      'extra-enjoy',
    ];
    if (!isLoggedIn && (loginRequiredTabs.includes(activeTab) || activeTab === 'admin')) {
      setActiveTab('home');
    } else if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('home');
    }
  }, [activeTab, isLoggedIn, isAdmin]);

  const navigateTo = (tab: MainTab) => {
    setMobileMenuOpen(false);
    const loginRequiredTabs: MainTab[] = [
      'ascension',
      'territories',
      'system',
      'extra-enjoy',
    ];
    if (loginRequiredTabs.includes(tab) && !isLoggedIn) {
      setPendingTab(tab);
      setLoginOpen(true);
      return;
    }
    if (tab === 'admin' && !isAdmin) {
      if (!isLoggedIn) {
        setPendingTab('admin');
        setLoginOpen(true);
      }
      return;
    }
    if (tab === 'extra-enjoy') {
      setExtraSubTab('question-form');
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    return () => {
      if (goodbyeTimerRef.current !== null) {
        window.clearTimeout(goodbyeTimerRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    const departingName = currentUser
      ? currentUser.username || currentUser.fullName
      : null;
    if (currentUser) {
      handleUpdateUserAny(currentUser.id, {
        isOnline: false,
        lastLoggedIn: new Date().toLocaleString(),
      });
    }
    setCurrentUserId(null);
    setPendingTab(null);
    setDailyGreeting(null);
    setYearEndLetterOpen(false);
    if (
      activeTab === 'ascension' ||
      activeTab === 'territories' ||
      activeTab === 'system' ||
      activeTab === 'extra-enjoy' ||
      activeTab === 'admin'
    ) {
      setActiveTab('home');
    }
    if (departingName) {
      setGoodbyeUsername(departingName);
      if (goodbyeTimerRef.current !== null) {
        window.clearTimeout(goodbyeTimerRef.current);
      }
      goodbyeTimerRef.current = window.setTimeout(() => {
        setGoodbyeUsername(null);
        goodbyeTimerRef.current = null;
      }, 5600);
    }
    pushToast('Signed out of DQR.', 'gold');
  };

  /* ---- HANDLERS ---- */
  const handleSaveQuiz = (quiz: QuizRecord) => {
    setQuizzes((prev) => {
      const exists = prev.some((q) => q.id === quiz.id);
      return exists
        ? prev.map((q) => (q.id === quiz.id ? quiz : q))
        : [quiz, ...prev];
    });
    if (supabaseReadyRef.current) {
      void upsertQuizToSupabaseTable(quiz);
    }
    pushToast('Quiz record saved & synced.', 'gold');
  };

  const handleRemovePlayerFromQuiz = (quizId: string, playerName: string) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id !== quizId) return q;
        const targetLower = playerName.trim().toLowerCase();
        const nextRatings = q.playerRatings ? { ...q.playerRatings } : undefined;
        if (nextRatings) {
          for (const key of Object.keys(nextRatings)) {
            if (key.trim().toLowerCase() === targetLower) {
              delete nextRatings[key];
            }
          }
        }
        return {
          ...q,
          players: q.players.filter((p) => p !== playerName),
          ...(nextRatings ? { playerRatings: nextRatings } : {}),
        };
      })
    );
  };

  const handleUpdateUserAny = (userId: string, patch: Partial<DqrUser>) => {
    if ('mood' in patch) {
      const nextMoods = {
        ...userMoodsRef.current,
        [userId]: patch.mood ?? null,
      };
      userMoodsRef.current = nextMoods;
      const serializedMoods = JSON.stringify(nextMoods);
      lastSyncedJsonRef.current[STORAGE_KEYS.userMoods] = serializedMoods;
      try {
        localStorage.setItem(STORAGE_KEYS.userMoods, serializedMoods);
      } catch {
        // Ignore quota errors
      }
      if (supabaseReadyRef.current) {
        void saveStoreToSupabase(STORAGE_KEYS.userMoods, nextMoods);
      }
    }
    let changedUser: DqrUser | undefined;
    const nextUsers = usersRef.current.map((u) => {
      if (u.id !== userId) return u;
      changedUser = { ...u, ...patch };
      return changedUser;
    });
    usersRef.current = nextUsers;
    setUsers(nextUsers);
    void flushUsersNow(nextUsers, changedUser);
  };

  const handleCreateUser = (
    newUser: Omit<DqrUser, 'id' | 'createdAt'>
  ): string | null => {
    if (
      usersRef.current.some(
        (u) => u.username.toLowerCase() === newUser.username.toLowerCase()
      )
    ) {
      return `Username "${newUser.username}" already exists.`;
    }
    const created: DqrUser = {
      ...newUser,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const nextUsers = [...usersRef.current, created];
    usersRef.current = nextUsers;
    setUsers(nextUsers);
    void flushUsersNow(nextUsers, created);
    pushToast(`Account @${created.username} created & synced.`, 'gold');
    return null;
  };

  const handleLevelUp = (userId: string, xpCost: number) => {
    const u = usersRef.current.find((x) => x.id === userId);
    if (!u || u.xp < xpCost) return;
    let updatedUser: DqrUser | undefined;
    const nextUsers = usersRef.current.map((item) => {
      if (item.id === userId && item.xp >= xpCost) {
        updatedUser = { ...item, xp: item.xp - xpCost, level: item.level + 1 };
        return updatedUser;
      }
      return item;
    });
    usersRef.current = nextUsers;
    setUsers(nextUsers);
    void flushUsersNow(nextUsers, updatedUser);
    pushToast(`Level up complete! Reached Level ${u.level + 1}.`, 'gold');
  };

  const handleBuyTitle = (userId: string, title: TitleItem): string | null => {
    const u = users.find((x) => x.id === userId);
    if (!u) return 'User not found.';
    if (u.ownedTitleIds.includes(title.id)) return 'Already owned.';
    if (u.xp < title.priceXp) return 'Not enough XP.';
    handleUpdateUserAny(userId, {
      xp: u.xp - title.priceXp,
      ownedTitleIds: [...u.ownedTitleIds, title.id],
      equippedTitleId: title.id,
    });
    pushToast(`Unlocked title: ${title.name}`, 'gold');
    return null;
  };

  const handleToggleEquipAchievement = (userId: string, achId: string) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;
    const exists = u.equippedAchievementIds.includes(achId);
    let next: string[];
    if (exists) {
      next = u.equippedAchievementIds.filter((id) => id !== achId);
    } else {
      next = [...u.equippedAchievementIds, achId].slice(-2); // max 2 equipped
    }
    handleUpdateUserAny(userId, { equippedAchievementIds: next });
  };

  const handlePlaceBid = (
    auctionId: string,
    userId: string,
    amount: number
  ): string | null => {
    const u = users.find((x) => x.id === userId);
    const auc = auctions.find((a) => a.id === auctionId);
    if (!u || !auc) return 'Auction unavailable.';
    if (auc.settled || auc.endsAt <= Date.now()) return 'Auction has ended.';
    const minReq =
      auc.highestBidderId === null ? auc.startingBid : auc.currentBid + 1;
    if (amount < minReq) return `Bid must be at least ${minReq} XP.`;
    if (u.xp < amount) return 'Insufficient XP balance.';

    setAuctions((prev) =>
      prev.map((a) =>
        a.id === auctionId
          ? {
              ...a,
              currentBid: amount,
              highestBidderId: u.id,
              highestBidderName: u.fullName,
              endsAt: a.endsAt + 10_000, // +10 seconds on every new bid
              bids: [
                ...a.bids,
                {
                  userId: u.id,
                  username: u.username,
                  fullName: u.fullName,
                  amount,
                  timestamp: Date.now(),
                },
              ],
            }
          : a
      )
    );
    pushToast(`Placed ${amount} XP bid!`, 'gold');
    return null;
  };

  const handleSettleAuction = (auctionId: string) => {
    const auc = auctions.find((a) => a.id === auctionId);
    if (!auc || auc.settled || !auc.highestBidderId) return;
    const winner = users.find((u) => u.id === auc.highestBidderId);
    if (!winner) return;

    // Add title to catalog if not already there
    if (!titles.some((t) => t.id === auc.title.id)) {
      setTitles((prev) => [auc.title, ...prev]);
    }
    handleUpdateUserAny(winner.id, {
      xp: Math.max(0, winner.xp - auc.currentBid),
      ownedTitleIds: Array.from(
        new Set([...winner.ownedTitleIds, auc.title.id])
      ),
      equippedTitleId: auc.title.id,
    });
    setAuctions((prev) =>
      prev.map((a) => (a.id === auctionId ? { ...a, settled: true } : a))
    );
  };

  const handleSubmitTerritoryAttempt = (
    territoryId: string,
    userId: string,
    score: number,
    completionSeconds?: number
  ): {
    tookOver: boolean;
    message: string;
    submittedAtLabel?: string;
    completionSeconds?: number;
  } => {
    const ter = territories.find((t) => t.id === territoryId);
    const challenger = users.find((u) => u.id === userId);
    if (!ter || !challenger) {
      return { tookOver: false, message: 'Territory unavailable.' };
    }

    const tookOver = score > ter.highestScore;
    const nowTs = Date.now();
    const nowDate = new Date(nowTs);
    const submittedAtLabel = `${nowDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    })}, ${nowDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const nextAttempted = Array.from(
      new Set([...ter.attemptedUserIds, userId])
    );
    const updatedTer: Territory = !tookOver
      ? { ...ter, attemptedUserIds: nextAttempted }
      : {
          ...ter,
          currentHolderUserId: challenger.id,
          currentHolderName: challenger.fullName,
          highestScore: score,
          wonOn: submittedAtLabel,
          attemptedUserIds: nextAttempted,
          history: [
            {
              id: `th-${nowTs}`,
              holderUserId: challenger.id,
              holderName: challenger.fullName,
              score,
              totalQuestions: ter.questions.length,
              dateLabel: submittedAtLabel,
              submittedAt: nowTs,
              completionSeconds,
              result: 'Current' as const,
            },
            ...ter.history.map((h) => ({
              ...h,
              result: 'Defeated' as const,
            })),
          ].slice(0, 10),
        };

    setTerritories((prev) =>
      prev.map((t) => (t.id === territoryId ? updatedTer : t))
    );

    if (supabaseReadyRef.current) {
      void upsertTerritoryToSupabaseTable(updatedTer);
    }

    if (tookOver) {
      pushToast(`Captured ${ter.name}!`, 'gold');
    } else {
      pushToast('Territory attempt recorded.', 'blue');
    }

    return tookOver
      ? {
          tookOver: true,
          message: `You defeated the previous score (${ter.highestScore}/${ter.questions.length}) and seized ${ter.name}! (+100 Power)`,
          submittedAtLabel,
          completionSeconds,
        }
      : {
          tookOver: false,
          message: `${ter.currentHolderName || 'The holder'} keeps control (${ter.highestScore}/${ter.questions.length}). Strictly higher score is required.`,
          submittedAtLabel,
          completionSeconds,
        };
  };

  const handleSendSystemMessage = (userId: string, text: string) => {
    const newMsg: SystemMessage = {
      id: `smsg-${Date.now()}`,
      userId,
      sender: 'user',
      text,
      createdAt: Date.now(),
      readByAdmin: false,
      readByUser: true,
    };
    setSystemMessages((prev) => [...prev, newMsg]);
    if (supabaseReadyRef.current) {
      void upsertSystemMessageToSupabaseTable(newMsg);
    }
    pushToast('Message transmitted to System.', 'blue');
  };

  const handleAdminReplyMessage = (userId: string, text: string) => {
    const replyMsg: SystemMessage = {
      id: `smsg-${Date.now()}`,
      userId,
      sender: 'system',
      text,
      createdAt: Date.now(),
      readByAdmin: true,
      readByUser: false,
    };
    setSystemMessages((prev) => [
      ...prev.map((m) =>
        m.userId === userId ? { ...m, readByAdmin: true } : m
      ),
      replyMsg,
    ]);
    if (supabaseReadyRef.current) {
      void upsertSystemMessageToSupabaseTable(replyMsg);
    }
  };

  const handleMarkMessagesRead = (userId: string) => {
    setSystemMessages((prev) =>
      prev.map((m) =>
        m.userId === userId && m.sender === 'system'
          ? { ...m, readByUser: true }
          : m
      )
    );
  };

  const handleClaimChallenge = (
    challengeId: string,
    userId: string,
    note?: string
  ) => {
    const chl = challenges.find((c) => c.id === challengeId);
    const u = usersRef.current.find((x) => x.id === userId);
    if (!chl || !u || chl.completedByUserIds.includes(userId)) return;

    const alreadyPending = challengeClaims.some(
      (cl) =>
        cl.challengeId === challengeId &&
        cl.userId === userId &&
        cl.status === 'pending'
    );
    if (alreadyPending) {
      pushToast('Claim is already pending Admin verification.', 'blue');
      return;
    }

    const request: ChallengeClaimRequest = {
      id: `claim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      challengeId,
      userId,
      submittedAt: Date.now(),
      note: note?.trim() || undefined,
      status: 'pending',
    };
    setChallengeClaims((prev) => [request, ...prev]);
    pushToast(
      `Claim submitted for “${chl.title}”. Awaiting Admin verification.`,
      'blue'
    );
  };

  const handleReviewChallengeClaim = (
    claimId: string,
    decision: 'approved' | 'rejected',
    adminNote?: string
  ) => {
    const targetClaim = challengeClaims.find((cl) => cl.id === claimId);
    if (!targetClaim || targetClaim.status !== 'pending') return;

    const chl = challenges.find((c) => c.id === targetClaim.challengeId);
    const targetUser = usersRef.current.find((u) => u.id === targetClaim.userId);

    setChallengeClaims((prev) =>
      prev.map((cl) =>
        cl.id === claimId
          ? {
              ...cl,
              status: decision,
              reviewedAt: Date.now(),
              reviewedByUserId: currentUser?.id,
              adminNote: adminNote?.trim() || undefined,
            }
          : cl
      )
    );

    if (decision === 'approved') {
      if (chl && !chl.completedByUserIds.includes(targetClaim.userId)) {
        setChallenges((prev) =>
          prev.map((c) =>
            c.id === chl.id
              ? {
                  ...c,
                  completedByUserIds: c.completedByUserIds.includes(
                    targetClaim.userId
                  )
                    ? c.completedByUserIds
                    : [...c.completedByUserIds, targetClaim.userId],
                }
              : c
          )
        );
      }
      if (targetUser && chl) {
        handleUpdateUserAny(targetUser.id, {
          xp: targetUser.xp + chl.rewardXp,
        });
        pushToast(
          `Verified ${targetUser.fullName} · Awarded +${chl.rewardXp} XP.`,
          'emerald'
        );
      } else {
        pushToast('Challenge claim approved.', 'emerald');
      }
    } else {
      pushToast(
        `Claim rejected${targetUser ? ` for ${targetUser.fullName}` : ''}.`,
        'gold'
      );
    }
  };

  /* ---- RIVAL HANDLERS ---- */
  const handleSendRivalRequest = (
    requesterId: string,
    recipientId: string
  ): string | null => {
    if (requesterId === recipientId) {
      return 'You cannot select yourself as a rival.';
    }
    const target = users.find((u) => u.id === recipientId);
    if (!target) return 'Selected user could not be found.';

    const existingActive = rivalries.find(
      (r) =>
        r.status === 'active' &&
        ((r.requesterId === requesterId && r.recipientId === recipientId) ||
          (r.requesterId === recipientId && r.recipientId === requesterId))
    );
    if (existingActive) {
      return `You already have an active rivalry with @${target.username}.`;
    }

    const existingPending = rivalries.find(
      (r) =>
        r.status === 'pending' &&
        ((r.requesterId === requesterId && r.recipientId === recipientId) ||
          (r.requesterId === recipientId && r.recipientId === requesterId))
    );
    if (existingPending) {
      return existingPending.requesterId === requesterId
        ? `A rival request to @${target.username} is already pending.`
        : `@${target.username} already sent you a pending request — accept it in Incoming Requests.`;
    }

    const created: RivalRecord = {
      id: `rv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      requesterId,
      recipientId,
      status: 'pending',
      createdAt: Date.now(),
      startedAt: null,
      endedAt: null,
      requesterEarnedXp: 0,
      recipientEarnedXp: 0,
      history: [],
    };
    setRivalries((prev) => [created, ...prev]);
    pushToast(`Rival request sent to @${target.username}.`, 'blue');
    return null;
  };

  const handleRespondRivalRequest = (rivalryId: string, accept: boolean) => {
    const targetRivalry = rivalries.find((r) => r.id === rivalryId);
    if (!targetRivalry || targetRivalry.status !== 'pending') return;

    const now = Date.now();
    const dateLabel = formatRivalDate(now);

    if (!accept) {
      setRivalries((prev) =>
        prev.map((r) =>
          r.id === rivalryId ? { ...r, status: 'declined', endedAt: now } : r
        )
      );
      pushToast('Rival request declined.', 'blue');
      return;
    }

    const reqUser = users.find((u) => u.id === targetRivalry.requesterId);
    const recUser = users.find((u) => u.id === targetRivalry.recipientId);
    if (!reqUser || !recUser) return;

    setRivalries((prev) =>
      prev.map((r) => {
        if (r.id === rivalryId) {
          return {
            ...r,
            status: 'active',
            startedAt: now,
            endedAt: null,
            requesterEarnedXp: 0,
            recipientEarnedXp: 0,
            baselineStats: {
              requester: buildUserSnapshot(reqUser, territories, 0),
              recipient: buildUserSnapshot(recUser, territories, 0),
            },
            history: [
              {
                id: `rve-start-${now}`,
                timestamp: now,
                dateLabel,
                type: 'started',
                title: `Friendly rivalry started: @${reqUser.username} vs @${recUser.username}`,
                detail:
                  'XP earned tracker starts at 0 XP for both competitors today. Both rivals are ready to grow.',
              },
            ],
          };
        }

        // Conclude any prior active rivalry involving either participant cleanly
        if (
          r.status === 'active' &&
          (r.requesterId === reqUser.id ||
            r.recipientId === reqUser.id ||
            r.requesterId === recUser.id ||
            r.recipientId === recUser.id)
        ) {
          const oldReq = users.find((u) => u.id === r.requesterId);
          const oldRec = users.find((u) => u.id === r.recipientId);
          return {
            ...r,
            status: 'ended',
            endedAt: now,
            finalStats:
              oldReq && oldRec
                ? {
                    requester: buildUserSnapshot(
                      oldReq,
                      territories,
                      r.requesterEarnedXp
                    ),
                    recipient: buildUserSnapshot(
                      oldRec,
                      territories,
                      r.recipientEarnedXp
                    ),
                  }
                : r.finalStats,
            history: [
              {
                id: `rve-end-${now}-${r.id}`,
                timestamp: now,
                dateLabel,
                type: 'ended',
                title: 'Rivalry concluded for a new matchup',
                detail:
                  'A new friendly rivalry was accepted. Both rivals carried strong progress forward.',
              },
              ...r.history,
            ],
          };
        }

        return r;
      })
    );
    pushToast('Friendly rivalry started!', 'emerald');
  };

  const handleCancelRivalRequest = (rivalryId: string) => {
    setRivalries((prev) =>
      prev.map((r) =>
        r.id === rivalryId && r.status === 'pending'
          ? { ...r, status: 'cancelled', endedAt: Date.now() }
          : r
      )
    );
    pushToast('Rival request cancelled.', 'blue');
  };

  const handleEndRivalry = (rivalryId: string, endedByUserId: string) => {
    const now = Date.now();
    const dateLabel = formatRivalDate(now);
    const actor = users.find((u) => u.id === endedByUserId);

    setRivalries((prev) =>
      prev.map((r) => {
        if (r.id !== rivalryId || r.status !== 'active') return r;
        const reqUser = users.find((u) => u.id === r.requesterId);
        const recUser = users.find((u) => u.id === r.recipientId);
        return {
          ...r,
          status: 'ended',
          endedAt: now,
          finalStats:
            reqUser && recUser
              ? {
                  requester: buildUserSnapshot(
                    reqUser,
                    territories,
                    r.requesterEarnedXp
                  ),
                  recipient: buildUserSnapshot(
                    recUser,
                    territories,
                    r.recipientEarnedXp
                  ),
                }
              : r.finalStats,
          history: [
            {
              id: `rve-end-${now}`,
              timestamp: now,
              dateLabel,
              type: 'ended',
              actorUserId: endedByUserId,
              title: actor
                ? `@${actor.username} concluded this rivalry`
                : 'Rivalry concluded',
              detail:
                'Full comparison stats and timeline remain saved in Past Rivalries.',
            },
            ...r.history,
          ],
        };
      })
    );
    pushToast('Rivalry concluded and saved to history.', 'blue');
  };

  /* ---- 1V1 DUEL ARENA HANDLERS ---- */
  const pushDuelSyncNow = useCallback(
    (
      nextMatches?: DuelMatch[],
      nextQuestions?: DuelQuestion[],
      nextConfig?: DuelConfig
    ) => {
      const payload: {
        duelMatches?: DuelMatch[];
        duelQuestions?: DuelQuestion[];
        duelConfig?: DuelConfig;
      } = {};
      if (nextMatches) {
        payload.duelMatches = nextMatches;
        const ser = JSON.stringify(nextMatches);
        lastSyncedJsonRef.current[STORAGE_KEYS.duelMatches] = ser;
        try {
          localStorage.setItem(STORAGE_KEYS.duelMatches, ser);
        } catch {
          // Ignore quota issues
        }
        if (supabaseReadyRef.current) {
          void saveStoreToSupabase(STORAGE_KEYS.duelMatches, nextMatches);
        }
      }
      if (nextQuestions) {
        payload.duelQuestions = nextQuestions;
        const serQ = JSON.stringify(nextQuestions);
        lastSyncedJsonRef.current[STORAGE_KEYS.duelQuestions] = serQ;
        try {
          localStorage.setItem(STORAGE_KEYS.duelQuestions, serQ);
        } catch {
          // Ignore quota issues
        }
        if (supabaseReadyRef.current) {
          void saveStoreToSupabase(STORAGE_KEYS.duelQuestions, nextQuestions);
        }
      }
      if (nextConfig) {
        payload.duelConfig = nextConfig;
      }
      if (duelBroadcastRef.current) {
        void duelBroadcastRef.current.send({
          type: 'broadcast',
          event: 'duel_sync',
          payload,
        });
      }
    },
    []
  );

  const settleCompletedDuelMatch = useCallback(
    (match: DuelMatch): DuelMatch => {
      if (match.status !== 'active' || match.winnerId !== null) return match;
      const now = Date.now();
      const maxMatchMs =
        match.questionIds.length * match.secondsPerQuestion * 1000;

      const cProg: DuelParticipantProgress = match.challengerProgress.submitted
        ? match.challengerProgress
        : {
            ...match.challengerProgress,
            submitted: true,
            submittedAt: now,
            totalTimeMs: Math.max(match.challengerProgress.totalTimeMs, maxMatchMs),
          };
      const oProg: DuelParticipantProgress = match.opponentProgress.submitted
        ? match.opponentProgress
        : {
            ...match.opponentProgress,
            submitted: true,
            submittedAt: now,
            totalTimeMs: Math.max(match.opponentProgress.totalTimeMs, maxMatchMs),
          };

      let winnerId: string | 'draw' = 'draw';
      if (cProg.correctCount !== oProg.correctCount) {
        winnerId =
          cProg.correctCount > oProg.correctCount
            ? match.challengerId
            : match.opponentId;
      } else if (cProg.totalTimeMs !== oProg.totalTimeMs) {
        winnerId =
          cProg.totalTimeMs < oProg.totalTimeMs
            ? match.challengerId
            : match.opponentId;
      } else {
        winnerId = 'draw';
      }

      const wager = match.wagerXp ?? duelConfigRef.current.wagerXp ?? 1000;
      const xpTransferred = winnerId === 'draw' ? 0 : wager;

      if (winnerId !== 'draw' && xpTransferred > 0) {
        const loserId =
          winnerId === match.challengerId
            ? match.opponentId
            : match.challengerId;
        const nextUsers = usersRef.current.map((u) => {
          if (u.id === winnerId) return { ...u, xp: u.xp + xpTransferred };
          if (u.id === loserId)
            return { ...u, xp: Math.max(0, u.xp - xpTransferred) };
          return u;
        });
        usersRef.current = nextUsers;
        setUsers(nextUsers);
        void flushUsersNow(nextUsers);
      }

      return {
        ...match,
        challengerProgress: cProg,
        opponentProgress: oProg,
        status: 'completed',
        winnerId,
        xpTransferred,
        settledAt: now,
      };
    },
    [flushUsersNow]
  );

  // Expire pending 1-minute duel requests & auto-settle abandoned/timed-out duels
  useEffect(() => {
    const hasOpen = duelMatches.some(
      (m) => m.status === 'pending' || m.status === 'active'
    );
    if (!hasOpen) return;

    const timer = window.setInterval(() => {
      const now = Date.now();
      let changed = false;
      const next = duelMatchesRef.current.map((m) => {
        if (m.status === 'pending' && now >= m.expiresAt) {
          changed = true;
          return { ...m, status: 'expired' as const };
        }
        if (m.status === 'active' && m.startedAt) {
          const deadline =
            m.startedAt +
            m.questionIds.length * m.secondsPerQuestion * 1000 +
            3500;
          const bothDone =
            m.challengerProgress.submitted && m.opponentProgress.submitted;
          const myId = currentUserId;
          const iAlreadySubmitted =
            (m.challengerId === myId && m.challengerProgress.submitted) ||
            (m.opponentId === myId && m.opponentProgress.submitted);
          const neitherSubmittedOwner =
            !m.challengerProgress.submitted &&
            !m.opponentProgress.submitted &&
            m.challengerId === myId;
          if (bothDone || (now >= deadline && (iAlreadySubmitted || neitherSubmittedOwner))) {
            changed = true;
            return settleCompletedDuelMatch(m);
          }
        }
        return m;
      });

      if (changed) {
        duelMatchesRef.current = next;
        setDuelMatches(next);
        pushDuelSyncNow(next);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [duelMatches, currentUserId, pushDuelSyncNow, settleCompletedDuelMatch]);

  const handleSendDuelRequest = (
    opponentId: string,
    topic: string
  ): string | null => {
    if (!currentUser) return 'You must be logged in to send a 1v1 challenge.';
    if (opponentId === currentUser.id) {
      return 'You cannot challenge yourself.';
    }
    const opponent = usersRef.current.find((u) => u.id === opponentId);
    if (!opponent) return 'Selected opponent could not be found.';

    if (currentUser.xp < DUEL_REQUIRED_XP) {
      return `You need at least ${DUEL_REQUIRED_XP.toLocaleString()} XP to enter a 1v1 Duel.`;
    }
    if (opponent.xp < DUEL_REQUIRED_XP) {
      return `@${opponent.username} currently has ${opponent.xp.toLocaleString()} XP and needs at least ${DUEL_REQUIRED_XP.toLocaleString()} XP to duel.`;
    }

    const now = Date.now();
    const busyMatch = duelMatchesRef.current.find(
      (m) =>
        (m.status === 'active' || (m.status === 'pending' && now < m.expiresAt)) &&
        (m.challengerId === currentUser.id ||
          m.opponentId === currentUser.id ||
          m.challengerId === opponentId ||
          m.opponentId === opponentId)
    );
    if (busyMatch) {
      return 'One of you already has an active or pending 1v1 challenge.';
    }

    const previewPool = selectDuelQuestions(
      duelQuestionsRef.current,
      topic,
      currentUser.id,
      opponent.id
    );
    if (previewPool.length === 0) {
      return `No approved active questions found in "${topic}" yet.`;
    }

    const emptyProgress = (uid: string): DuelParticipantProgress => ({
      userId: uid,
      currentIndex: 0,
      answers: {},
      questionTimesMs: {},
      correctCount: 0,
      totalTimeMs: 0,
      submitted: false,
      submittedAt: null,
    });

    const newMatch: DuelMatch = {
      id: `duel-${now}-${Math.random().toString(36).slice(2, 7)}`,
      topic,
      challengerId: currentUser.id,
      opponentId: opponent.id,
      status: 'pending',
      createdAt: now,
      expiresAt: now + DUEL_ACCEPT_WINDOW_MS,
      startedAt: null,
      secondsPerQuestion: duelConfigRef.current.secondsPerQuestion,
      wagerXp: duelConfigRef.current.wagerXp,
      questionIds: [],
      challengerProgress: emptyProgress(currentUser.id),
      opponentProgress: emptyProgress(opponent.id),
      winnerId: null,
      xpTransferred: 0,
      settledAt: null,
    };

    const nextMatches = [newMatch, ...duelMatchesRef.current];
    duelMatchesRef.current = nextMatches;
    setDuelMatches(nextMatches);
    pushDuelSyncNow(nextMatches);
    pushToast(
      `1v1 challenge sent to @${opponent.username} (${topic}). 60s to accept.`,
      'gold'
    );
    return null;
  };

  const handleRespondDuelRequest = (matchId: string, accept: boolean) => {
    const match = duelMatchesRef.current.find((m) => m.id === matchId);
    if (!match || match.status !== 'pending') return;

    const now = Date.now();
    if (now >= match.expiresAt) {
      const nextExpired = duelMatchesRef.current.map((m) =>
        m.id === matchId ? { ...m, status: 'expired' as const } : m
      );
      duelMatchesRef.current = nextExpired;
      setDuelMatches(nextExpired);
      pushDuelSyncNow(nextExpired);
      pushToast('This 1v1 challenge expired after 1 minute.', 'gold');
      return;
    }

    if (!accept) {
      const nextDeclined = duelMatchesRef.current.map((m) =>
        m.id === matchId ? { ...m, status: 'declined' as const } : m
      );
      duelMatchesRef.current = nextDeclined;
      setDuelMatches(nextDeclined);
      pushDuelSyncNow(nextDeclined);
      pushToast('1v1 challenge declined.', 'blue');
      return;
    }

    const challenger = usersRef.current.find((u) => u.id === match.challengerId);
    const opponent = usersRef.current.find((u) => u.id === match.opponentId);
    if (
      !challenger ||
      !opponent ||
      challenger.xp < DUEL_REQUIRED_XP ||
      opponent.xp < DUEL_REQUIRED_XP
    ) {
      const nextCancelled = duelMatchesRef.current.map((m) =>
        m.id === matchId ? { ...m, status: 'cancelled' as const } : m
      );
      duelMatchesRef.current = nextCancelled;
      setDuelMatches(nextCancelled);
      pushDuelSyncNow(nextCancelled);
      pushToast('Both challengers must hold at least 1,000 XP to start.', 'gold');
      return;
    }

    const selected = selectDuelQuestions(
      duelQuestionsRef.current,
      match.topic,
      match.challengerId,
      match.opponentId
    );
    if (selected.length === 0) {
      pushToast(`No approved questions available for ${match.topic}.`, 'gold');
      return;
    }

    const selectedIds = selected.map((q) => q.id);
    const selectedSet = new Set(selectedIds);
    const nextQuestions = duelQuestionsRef.current.map((q) => {
      if (!selectedSet.has(q.id)) return q;
      const mergedSeen = Array.from(
        new Set([...q.recentlySeenBy, match.challengerId, match.opponentId])
      ).slice(-12);
      return {
        ...q,
        timesUsed: q.timesUsed + 1,
        lastUsedAt: now,
        recentlySeenBy: mergedSeen,
      };
    });

    const resetProgress = (uid: string): DuelParticipantProgress => ({
      userId: uid,
      currentIndex: 0,
      answers: {},
      questionTimesMs: {},
      correctCount: 0,
      totalTimeMs: 0,
      submitted: false,
      submittedAt: null,
    });

    const nextMatches = duelMatchesRef.current.map((m) =>
      m.id === matchId
        ? {
            ...m,
            status: 'active' as const,
            startedAt: now,
            secondsPerQuestion: duelConfigRef.current.secondsPerQuestion,
            wagerXp: duelConfigRef.current.wagerXp,
            questionIds: selectedIds,
            challengerProgress: resetProgress(match.challengerId),
            opponentProgress: resetProgress(match.opponentId),
          }
        : m
    );

    duelQuestionsRef.current = nextQuestions;
    duelMatchesRef.current = nextMatches;
    setDuelQuestions(nextQuestions);
    setDuelMatches(nextMatches);
    pushDuelSyncNow(nextMatches, nextQuestions);
    pushToast(`1v1 Duel started! Topic: ${match.topic}`, 'emerald');
  };

  const handleCancelDuelRequest = (matchId: string) => {
    const nextMatches = duelMatchesRef.current.map((m) =>
      m.id === matchId && m.status === 'pending'
        ? { ...m, status: 'cancelled' as const }
        : m
    );
    duelMatchesRef.current = nextMatches;
    setDuelMatches(nextMatches);
    pushDuelSyncNow(nextMatches);
    pushToast('1v1 request cancelled.', 'blue');
  };

  const handleUpdateDuelProgress = (
    matchId: string,
    userId: string,
    progress: DuelParticipantProgress
  ) => {
    let settledMatch: DuelMatch | null = null;
    const nextMatches = duelMatchesRef.current.map((m) => {
      if (m.id !== matchId || m.status !== 'active') return m;
      const updated: DuelMatch =
        m.challengerId === userId
          ? { ...m, challengerProgress: progress }
          : m.opponentId === userId
            ? { ...m, opponentProgress: progress }
            : m;
      if (
        updated.challengerProgress.submitted &&
        updated.opponentProgress.submitted
      ) {
        settledMatch = settleCompletedDuelMatch(updated);
        return settledMatch;
      }
      return updated;
    });

    duelMatchesRef.current = nextMatches;
    setDuelMatches(nextMatches);
    pushDuelSyncNow(nextMatches);

    if (settledMatch) {
      const sm = settledMatch as DuelMatch;
      if (sm.winnerId === 'draw') {
        pushToast('1v1 Duel ended in a Draw! 0 XP transferred.', 'gold');
      } else if (sm.winnerId === currentUser?.id) {
        pushToast(
          `Victory in 1v1 Duel! +${sm.xpTransferred.toLocaleString()} XP claimed.`,
          'emerald'
        );
      } else if (
        sm.challengerId === currentUser?.id ||
        sm.opponentId === currentUser?.id
      ) {
        pushToast(
          `1v1 Duel settled. ${sm.xpTransferred.toLocaleString()} XP transferred.`,
          'blue'
        );
      }
    }
  };

  const handleFlagDuelQuestion = (questionId: string, reason: string) => {
    const trimmed = reason.trim() || 'Reported incorrect by player';
    const nextQuestions = duelQuestionsRef.current.map((q) => {
      if (q.id !== questionId) return q;
      const nextBy =
        currentUser?.id && !(q.flaggedByUserIds || []).includes(currentUser.id)
          ? [...(q.flaggedByUserIds || []), currentUser.id]
          : q.flaggedByUserIds || [];
      return {
        ...q,
        flaggedCount: q.flaggedCount + 1,
        flaggedReasons: [...(q.flaggedReasons || []), trimmed].slice(-10),
        flaggedByUserIds: nextBy,
      };
    });
    duelQuestionsRef.current = nextQuestions;
    setDuelQuestions(nextQuestions);
    pushDuelSyncNow(undefined, nextQuestions);
    pushToast('Question flagged for Admin review.', 'blue');
  };

  const handleAskAnonQuestion = (
    questionText: string,
    category: AnonQuestionCategory
  ) => {
    const entry: AnonymousQuestion = {
      id: `aq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      question: questionText,
      category,
      createdAt: Date.now(),
      adminReply: null,
      repliedAt: null,
      upvotes: 0,
      pinned: false,
    };
    setAnonQuestions((prev) => [entry, ...prev]);
    pushToast('Anonymous question posted to the public board.', 'gold');
  };

  const handleReplyAnonQuestion = (id: string, reply: string) => {
    if (!isAdmin) return;
    setAnonQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, adminReply: reply, repliedAt: Date.now() }
          : q
      )
    );
    pushToast('Admin reply published.', 'gold');
  };

  const handleTogglePinAnonQuestion = (id: string) => {
    if (!isAdmin) return;
    setAnonQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, pinned: !q.pinned } : q))
    );
  };

  const handleDeleteAnonQuestion = (id: string) => {
    if (!isAdmin) return;
    setAnonQuestions((prev) => prev.filter((q) => q.id !== id));
    pushToast('Question removed from board.', 'gold');
  };

  const handleToggleUpvoteAnonQuestion = (id: string, delta: 1 | -1) => {
    setAnonQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, upvotes: Math.max(0, q.upvotes + delta) } : q
      )
    );
  };

  const handleSubmitUserQuote = (
    text: string,
    tag: UserQuoteTag = 'General'
  ) => {
    const entry: DailyUserQuote = {
      id: `uq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      tag,
      createdAt: Date.now(),
      status: 'pending',
      featured: false,
      reactions: { needed: 0, inspiring: 0, wise: 0 },
      reactedBy: {},
    };
    setUserQuotes((prev) => [entry, ...prev]);
    pushToast('Anonymous quote sent for admin verification.', 'gold');
  };

  const handleReactUserQuote = (id: string, key: UserQuoteReactionKey) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    setUserQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const currentBy = q.reactedBy || {};
        const userList = currentBy[uid] || [];
        const hasReacted = userList.includes(key);
        const nextUserList = hasReacted
          ? userList.filter((k) => k !== key)
          : [...userList, key];
        const prevCounts = q.reactions || { needed: 0, inspiring: 0, wise: 0 };
        const nextCount = Math.max(
          0,
          (prevCounts[key] || 0) + (hasReacted ? -1 : 1)
        );
        return {
          ...q,
          reactions: {
            ...prevCounts,
            [key]: nextCount,
          },
          reactedBy: {
            ...currentBy,
            [uid]: nextUserList,
          },
        };
      })
    );
  };

  const handleVerifyUserQuote = (
    id: string,
    decision: 'approved' | 'rejected',
    featureToday?: boolean
  ) => {
    if (!isAdmin) return;
    setUserQuotes((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            status: decision,
            reviewedAt: Date.now(),
            featured: decision === 'approved' ? Boolean(featureToday) : false,
          };
        }
        return decision === 'approved' && featureToday
          ? { ...q, featured: false }
          : q;
      })
    );
    pushToast(
      decision === 'approved'
        ? featureToday
          ? 'Quote verified & featured on the Intro page.'
          : 'Quote verified and published.'
        : 'Quote marked as declined.',
      decision === 'approved' ? 'emerald' : 'gold'
    );
  };

  const handleToggleFeatureUserQuote = (id: string) => {
    if (!isAdmin) return;
    setUserQuotes((prev) => {
      const target = prev.find((q) => q.id === id);
      if (!target || target.status !== 'approved') return prev;
      const nextFeatured = !target.featured;
      return prev.map((q) =>
        q.id === id
          ? { ...q, featured: nextFeatured }
          : nextFeatured
            ? { ...q, featured: false }
            : q
      );
    });
    pushToast('Intro daily quote selection updated.', 'gold');
  };

  const handleDeleteUserQuote = (id: string) => {
    if (!isAdmin) return;
    setUserQuotes((prev) => prev.filter((q) => q.id !== id));
    pushToast('User quote deleted.', 'gold');
  };

  const unansweredAnonCount = anonQuestions.filter((q) => !q.adminReply).length;
  const pendingUserQuotesCount = userQuotes.filter(
    (q) => q.status === 'pending'
  ).length;
  const extraEnjoyAdminAlerts = unansweredAnonCount + pendingUserQuotesCount;

  const navItems: {
    id: MainTab;
    label: string;
    requiresAuth?: boolean;
    badgeCount?: number;
    pulseTone?: 'violet' | 'rose' | 'blue';
  }[] = [
    { id: 'home', label: 'Home' },
    { id: 'hall-of-fame', label: 'Hall of Fame' },
    {
      id: 'ascension',
      label: 'Ascension',
      requiresAuth: true,
      pulseTone: canLevelUp ? 'violet' : undefined,
    },
    {
      id: 'territories',
      label: 'Territories',
      requiresAuth: true,
      badgeCount: dethroneAlerts.length,
      pulseTone: dethroneAlerts.length > 0 ? 'rose' : undefined,
    },
    { id: 'newspaper', label: 'Newspaper' },
    {
      id: 'system',
      label: 'System',
      requiresAuth: true,
      badgeCount: systemAlertCount,
      pulseTone: systemAlertCount > 0 ? 'blue' : undefined,
    },
    {
      id: 'extra-enjoy',
      label: 'Community',
      requiresAuth: true,
      badgeCount: isAdmin ? extraEnjoyAdminAlerts : 0,
      pulseTone: isAdmin && extraEnjoyAdminAlerts > 0 ? 'blue' : undefined,
    },
    ...(isAdmin
      ? [
          {
            id: 'admin' as MainTab,
            label: 'Admin',
            badgeCount: pendingChallengeClaimsCount,
            pulseTone:
              pendingChallengeClaimsCount > 0 ? ('blue' as const) : undefined,
          },
        ]
      : []),
  ];

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#08080a] text-[#f5f2eb]">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 border-b border-[#d4af37]/25 bg-[#08080a]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          {/* Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="font-display text-2xl font-bold tracking-[0.14em] text-[#d4af37] hover:text-[#f5dc82] whitespace-nowrap shrink-0 cursor-pointer"
          >
            DQR
          </button>

          {/* Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-4 lg:flex xl:gap-5"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const locked = Boolean(item.requiresAuth && !isLoggedIn);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`relative inline-flex items-center gap-1.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer xl:text-sm ${
                    isActive
                      ? 'text-[#f8e6a0]'
                      : 'text-[#bfb7a6] hover:text-white'
                  }`}
                >
                  {locked && <Lock className="h-3 w-3 text-[#d4af37]/70" />}
                  <span>{item.label}</span>
                  {item.pulseTone && !locked && (
                    <span
                      className="relative flex h-2 w-2 items-center justify-center"
                      title={
                        item.id === 'ascension'
                          ? 'Ready to Level Up!'
                          : item.id === 'territories'
                            ? `${dethroneAlerts.length} Territory Alert(s)`
                            : `${systemAlertCount} System Notification(s)`
                      }
                    >
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                          item.pulseTone === 'rose'
                            ? 'bg-rose-400'
                            : item.pulseTone === 'violet'
                              ? 'bg-violet-400'
                              : 'bg-sky-400'
                        }`}
                      />
                      <span
                        className={`relative inline-flex h-2 w-2 rounded-full ${
                          item.pulseTone === 'rose'
                            ? 'bg-rose-400'
                            : item.pulseTone === 'violet'
                              ? 'bg-violet-300'
                              : 'bg-sky-400'
                        }`}
                      />
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="dqr-nav-underline"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-[#b8891f] via-[#f8e6a0] to-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.6)]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Auth Controls (Strict PIN Login — No Demo Switcher) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>
            {currentUser ? (
              <>
                <span className="hidden rounded-lg border border-[#d4af37]/30 bg-[#14120c] px-2.5 py-1.5 text-xs font-medium text-[#f8e6a0] sm:inline-block whitespace-nowrap">
                  {currentUser.fullName}
                  {currentUser.role === 'admin' ? ' · Admin' : ''}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/40 bg-[#14120c] px-3 py-1.5 text-xs font-semibold text-[#f8e6a0] hover:border-[#f0cb65] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPendingTab(null);
                  setLoginOpen(true);
                }}
                className="rounded-lg bg-gradient-to-r from-[#c79a26] to-[#d4af37] px-4 py-1.5 text-xs font-bold text-[#08080a] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Login
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="rounded-lg border border-white/15 p-1.5 text-[#f5dc82] lg:hidden cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-[#d4af37]/20 bg-[#0b0a08] px-4 py-3 lg:hidden">
            <nav className="grid grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const locked = Boolean(item.requiresAuth && !isLoggedIn);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`flex items-center justify-between gap-1.5 rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                      activeTab === item.id
                        ? 'bg-[#d4af37]/15 text-[#f8e6a0]'
                        : 'text-[#d4ccb8] hover:bg-white/5'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {locked && <Lock className="h-3 w-3 text-[#d4af37]/70" />}
                      <span>{item.label}</span>
                    </span>
                    {item.pulseTone && !locked && (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          item.pulseTone === 'rose'
                            ? 'bg-rose-400'
                            : item.pulseTone === 'violet'
                              ? 'bg-violet-300'
                              : 'bg-sky-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="mt-2.5 border-t border-white/10 pt-2.5 sm:hidden">
              <PWAInstallButton compact />
            </div>
          </div>
        )}
      </header>

      {/* ACTIVE PAGE */}
      <main>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
        {activeTab === 'home' && (
          <IntroductionPage
            settings={introSettings}
            isLoggedIn={isLoggedIn}
            onGetStarted={() => {
              if (isLoggedIn) navigateTo('hall-of-fame');
              else {
                setPendingTab('ascension');
                setLoginOpen(true);
              }
            }}
            onGoHallOfFame={() => navigateTo('hall-of-fame')}
          />
        )}

        {activeTab === 'hall-of-fame' && (
          <HallOfFame bsYears={bsYears} quizzes={quizzes} gallery={gallery} />
        )}

        {activeTab === 'ascension' && currentUser && (
          <AscensionPath
            currentUser={currentUser}
            users={users}
            ranks={ranks}
            levelRanges={levelRanges}
            streakBands={streakBands}
            titles={titles}
            achievements={achievements}
            auctions={auctions}
            pastWinners={pastWinners}
            certificates={certificates}
            weeklyTracker={
              weeklyTrackers[currentUser.id] ||
              createInitialWeeklyTracker(currentUser, territories)
            }
            onDismissWeeklySummary={(uid, weekStartIso) => {
              setWeeklyTrackers((prev) => {
                const existing = prev[uid];
                if (!existing) return prev;
                return {
                  ...prev,
                  [uid]: {
                    activeWeek:
                      existing.activeWeek.weekStartIso === weekStartIso
                        ? { ...existing.activeWeek, dismissedEndOfWeek: true }
                        : existing.activeWeek,
                    completedWeeks: existing.completedWeeks.map((cw) =>
                      cw.weekStartIso === weekStartIso
                        ? { ...cw, dismissedEndOfWeek: true }
                        : cw
                    ),
                  },
                };
              });
            }}
            onLevelUp={handleLevelUp}
            onAcknowledgeAnnouncement={(uid) =>
              handleUpdateUserAny(uid, { announcementChecked: true })
            }
            onBuyTitle={handleBuyTitle}
            onEquipTitle={(uid, tid) =>
              handleUpdateUserAny(uid, { equippedTitleId: tid })
            }
            onToggleEquipAchievement={handleToggleEquipAchievement}
            onUpdateProfile={(uid, patch) => handleUpdateUserAny(uid, patch)}
            onPlaceBid={handlePlaceBid}
            onSettleAuction={handleSettleAuction}
            dethroneAlerts={dethroneAlerts}
            onDismissDethroneAlert={handleDismissDethroneAlert}
            onOpenTerritories={() => navigateTo('territories')}
            dailyGreeting={
              dailyGreeting?.userId === currentUser.id
                ? dailyGreeting.greeting
                : null
            }
            onDismissDailyGreeting={() => setDailyGreeting(null)}
            quizzes={quizzes}
            territories={territories}
            bsYears={bsYears}
            duelMatches={duelMatches}
            yearlyRecords={yearlyRecords}
          />
        )}

        {activeTab === 'territories' && currentUser && (
          <TerritoriesPage
            currentUser={currentUser}
            users={users}
            territories={territories}
            dethroneAlerts={dethroneAlerts}
            onDismissDethroneAlert={handleDismissDethroneAlert}
            onSubmitAttempt={handleSubmitTerritoryAttempt}
          />
        )}

        {activeTab === 'newspaper' && (
          <NewspaperPage edition={newspaper} archive={newspaperArchive} />
        )}

        {activeTab === 'system' && currentUser && (
          <SystemPage
            currentUser={currentUser}
            users={users}
            ranks={ranks}
            config={systemConfig}
            messages={systemMessages}
            predictions={predictions}
            guidance={guidance}
            challenges={challenges}
            challengeClaims={challengeClaims}
            verdict={verdicts.find((v) => v.userId === currentUser.id)}
            quizzes={quizzes}
            territories={territories}
            rivalries={rivalries}
            onSendMessage={handleSendSystemMessage}
            onMarkMessagesRead={handleMarkMessagesRead}
            onClaimChallenge={handleClaimChallenge}
            onSendRivalRequest={handleSendRivalRequest}
            onRespondRivalRequest={handleRespondRivalRequest}
            onCancelRivalRequest={handleCancelRivalRequest}
            onEndRivalry={handleEndRivalry}
            duelConfig={duelConfig}
            duelQuestions={duelQuestions}
            duelMatches={duelMatches}
            onSendDuelRequest={handleSendDuelRequest}
            onRespondDuelRequest={handleRespondDuelRequest}
            onCancelDuelRequest={handleCancelDuelRequest}
            onUpdateDuelProgress={handleUpdateDuelProgress}
            onFlagDuelQuestion={handleFlagDuelQuestion}
          />
        )}

        {activeTab === 'extra-enjoy' && isLoggedIn && (
          <ExtraEnjoyPage
            questions={anonQuestions}
            userQuotes={userQuotes}
            isAdmin={isAdmin}
            currentUserId={currentUser?.id || ''}
            initialSubTab={extraSubTab}
            onAskQuestion={handleAskAnonQuestion}
            onReplyQuestion={handleReplyAnonQuestion}
            onTogglePinQuestion={handleTogglePinAnonQuestion}
            onDeleteQuestion={handleDeleteAnonQuestion}
            onToggleUpvoteQuestion={handleToggleUpvoteAnonQuestion}
            onSubmitUserQuote={handleSubmitUserQuote}
            onVerifyUserQuote={handleVerifyUserQuote}
            onToggleFeatureUserQuote={handleToggleFeatureUserQuote}
            onDeleteUserQuote={handleDeleteUserQuote}
            onReactUserQuote={handleReactUserQuote}
          />
        )}

        {activeTab === 'admin' && isAdmin && currentUser && (
          <AdminPanel
            currentUser={currentUser}
            introSettings={introSettings}
            onUpdateIntro={setIntroSettings}
            bsYears={bsYears}
            onAddBsYear={(y) => setBsYears((p) => [...p, y].sort())}
            onDeleteBsYear={(y) =>
              setBsYears((p) => p.filter((x) => x !== y))
            }
            quizzes={quizzes}
            onSaveQuiz={handleSaveQuiz}
            onDeleteQuiz={(id) => {
              setQuizzes((p) => p.filter((q) => q.id !== id));
              void deleteQuizFromSupabaseTable(id);
              pushToast('Quiz record deleted.', 'gold');
            }}
            onRemovePlayerFromQuiz={handleRemovePlayerFromQuiz}
            gallery={gallery}
            onAddGalleryPhoto={(ph) => setGallery((p) => [ph, ...p])}
            onDeleteGalleryPhoto={(id) =>
              setGallery((p) => p.filter((g) => g.id !== id))
            }
            users={users}
            onCreateUser={handleCreateUser}
            onUpdateUserAny={handleUpdateUserAny}
            onDeleteUser={(uid) => {
              const nextUsers = usersRef.current.filter((u) => u.id !== uid);
              usersRef.current = nextUsers;
              setUsers(nextUsers);
              void flushUsersNow(nextUsers);
              void deleteUserFromSupabaseTable(uid);
              pushToast('User account deleted.', 'gold');
            }}
            ranks={ranks}
            onSaveRanks={setRanks}
            levelRanges={levelRanges}
            onSaveLevelRanges={setLevelRanges}
            streakBands={streakBands}
            onSaveStreakBands={setStreakBands}
            titles={titles}
            onAddTitle={(t) => setTitles((p) => [t, ...p])}
            achievements={achievements}
            auctions={auctions}
            onCreateAuction={(a) => setAuctions((p) => [a, ...p])}
            onSettleAuction={handleSettleAuction}
            pastWinners={pastWinners}
            onAddPastWinner={(pw) => setPastWinners((p) => [pw, ...p])}
            onDeletePastWinner={(id) =>
              setPastWinners((p) => p.filter((x) => x.id !== id))
            }
            certificates={certificates}
            onSaveCertificates={setCertificates}
            territories={territories}
            onSaveTerritories={setTerritories}
            newspaper={newspaper}
            onSaveNewspaper={setNewspaper}
            newspaperArchive={newspaperArchive}
            onSaveNewspaperArchive={setNewspaperArchive}
            systemConfig={systemConfig}
            onSaveSystemConfig={setSystemConfig}
            systemMessages={systemMessages}
            onAdminReplyMessage={handleAdminReplyMessage}
            predictions={predictions}
            onSavePredictions={setPredictions}
            guidance={guidance}
            onSaveGuidance={setGuidance}
            challenges={challenges}
            onSaveChallenges={setChallenges}
            challengeClaims={challengeClaims}
            onReviewChallengeClaim={handleReviewChallengeClaim}
            verdicts={verdicts}
            onSaveVerdicts={setVerdicts}
            duelQuestions={duelQuestions}
            duelConfig={duelConfig}
            onSaveDuelQuestions={(next) => {
              duelQuestionsRef.current = next;
              setDuelQuestions(next);
              pushDuelSyncNow(undefined, next);
            }}
            onSaveDuelConfig={(next) => {
              duelConfigRef.current = next;
              setDuelConfig(next);
              pushDuelSyncNow(undefined, undefined, next);
            }}
          />
        )}
        </motion.div>
      </main>

      <LoginModal
        open={loginOpen}
        users={users}
        onRefreshUsers={refreshUsersFromSupabase}
        onSyncMatchedUser={(matchedUser) => {
          const exists = usersRef.current.some((u) => u.id === matchedUser.id);
          const nextUsers = exists
            ? usersRef.current.map((u) =>
                u.id === matchedUser.id ? matchedUser : u
              )
            : [...usersRef.current, matchedUser];
          usersRef.current = nextUsers;
          setUsers(nextUsers);
        }}
        onClose={() => {
          setLoginOpen(false);
          setPendingTab(null);
        }}
        onSuccess={(user) => {
          setCurrentUserId(user.id);
          handleUpdateUserAny(user.id, {
            isOnline: true,
            lastLoggedIn: 'Online now',
          });
          setLoginOpen(false);
          pushToast(`Welcome back, ${user.fullName}.`, 'gold');

          // First Login of the Day greeting (shown for 10s in Dashboard)
          const todayKey = getLocalDayKey();
          const checkins = loadStored<Record<string, string>>(
            STORAGE_KEYS.dailyCheckins,
            {}
          );
          if (checkins[user.id] !== todayKey) {
            try {
              localStorage.setItem(
                STORAGE_KEYS.dailyCheckins,
                JSON.stringify({ ...checkins, [user.id]: todayKey })
              );
            } catch {
              // Ignore storage quota issues
            }
            setDailyGreeting({
              userId: user.id,
              greeting: buildTimeOfDayGreeting(user),
            });
          }

          // December 31 Personalized Year-End Letter (shown upon login)
          if (isDecember31()) {
            setYearEndLetterData(
              buildYearEndLetterData(
                user,
                quizzes,
                territories,
                ranks,
                bsYears,
                yearlyRecords
              )
            );
            setYearEndLetterOpen(true);
          }

          if (pendingTab) {
            if (pendingTab === 'admin' && user.role !== 'admin') {
              setActiveTab('home');
            } else {
              setActiveTab(pendingTab);
            }
            setPendingTab(null);
          }
        }}
      />

      <YearEndLetterModal
        open={yearEndLetterOpen}
        data={yearEndLetterData}
        onClose={() => {
          setYearEndLetterOpen(false);
          if (currentUser && isDecember31()) {
            const yearKey = `${new Date().getFullYear()}:${currentUser.id}`;
            const seenMap = loadStored<Record<string, boolean>>(
              STORAGE_KEYS.yearEndSeen,
              {}
            );
            try {
              localStorage.setItem(
                STORAGE_KEYS.yearEndSeen,
                JSON.stringify({ ...seenMap, [yearKey]: true })
              );
            } catch {
              // Ignore storage errors
            }
          }
        }}
      />

      <AnimatePresence>
        {goodbyeUsername && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            onClick={() => setGoodbyeUsername(null)}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black px-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.48, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl text-center"
            >
              <div className="mb-5 flex items-center justify-center gap-3 text-2xl">
                <span>🌙</span>
                <span>✨</span>
                <span>🏰</span>
              </div>

              <p className="font-mono text-[11px] tracking-[0.3em] text-white/55 uppercase">
                Farewell · Dijan Quiz Rankings
              </p>

              <h2 className="mt-5 font-display text-3xl leading-snug font-semibold tracking-tight text-white sm:text-4xl">
                Rest well, {goodbyeUsername}.
              </h2>
              <p className="mt-2 font-display text-xl font-normal text-white/90 sm:text-2xl">
                The territories will still be here. ⚔️
              </p>

              <div className="mx-auto mt-7 h-px w-24 bg-white/25" />

              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.05, duration: 0.45 }}
                onClick={() => setGoodbyeUsername(null)}
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-2 text-xs font-medium tracking-wider text-white/85 uppercase transition-colors hover:border-white/60 hover:bg-white/15 hover:text-white cursor-pointer"
              >
                <span>Continue</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OfflineIndicator />
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
    </MotionConfig>
  );
}
