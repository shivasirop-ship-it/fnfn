import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Edit3,
  Gavel,
  ImagePlus,
  Plus,
  RotateCcw,
  Save,
  Send,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  XCircle,
} from 'lucide-react';
import {
  AchievementDef,
  AdminSubTab,
  ArchivedNewspaperEdition,
  AuctionItem,
  CertificateRecord,
  ChallengeClaimRequest,
  ConfidenceLevel,
  DqrUser,
  DuelConfig,
  DuelQuestion,
  GalleryPhoto,
  IntroSettings,
  LevelRange,
  NewspaperEdition,
  PastWinnerRecord,
  QuizPosition,
  QuizRecord,
  RankDef,
  StreakBand,
  SystemChallenge,
  SystemConfig,
  SystemGuidanceItem,
  SystemMessage,
  SystemPrediction,
  SystemPredictionCategory,
  Territory,
  TerritoryQuestion,
  TitleAnimationType,
  TitleItem,
  UserRole,
  VerdictClassification,
  VerdictRecord,
} from '../types';
import { POSITION_OPTIONS } from '../data/initialData';
import { COLOR_WHEEL_PRESETS, FIFTY_TITLE_PRESETS } from '../data/presets';
import { FounderGoldenSilhouette } from './Crowns';
import { TitleBadge } from './TitleBadge';
import { AdminCertificateStudio } from './AdminCertificateStudio';
import { AdminDuelQuestionManager } from './AdminDuelQuestionManager';
import { SUPABASE_URL, uploadDqrMedia } from '../lib/supabase';

interface AdminPanelProps {
  currentUser: DqrUser;
  introSettings: IntroSettings;
  onUpdateIntro: (next: IntroSettings) => void;
  bsYears: string[];
  onAddBsYear: (year: string) => void;
  onDeleteBsYear: (year: string) => void;
  quizzes: QuizRecord[];
  onSaveQuiz: (quiz: QuizRecord) => void;
  onDeleteQuiz: (id: string) => void;
  onRemovePlayerFromQuiz: (quizId: string, playerName: string) => void;
  gallery: GalleryPhoto[];
  onAddGalleryPhoto: (photo: GalleryPhoto) => void;
  onDeleteGalleryPhoto: (id: string) => void;
  users: DqrUser[];
  onCreateUser: (user: Omit<DqrUser, 'id' | 'createdAt'>) => string | null;
  onUpdateUserAny: (userId: string, patch: Partial<DqrUser>) => void;
  onDeleteUser: (userId: string) => void;
  ranks: RankDef[];
  onSaveRanks: (ranks: RankDef[]) => void;
  levelRanges: LevelRange[];
  onSaveLevelRanges: (ranges: LevelRange[]) => void;
  streakBands: StreakBand[];
  onSaveStreakBands: (bands: StreakBand[]) => void;
  titles: TitleItem[];
  onAddTitle: (title: TitleItem) => void;
  achievements: AchievementDef[];
  auctions: AuctionItem[];
  onCreateAuction: (auc: AuctionItem) => void;
  onSettleAuction: (aucId: string) => void;
  pastWinners: PastWinnerRecord[];
  onAddPastWinner: (pw: PastWinnerRecord) => void;
  onDeletePastWinner: (id: string) => void;
  certificates: CertificateRecord[];
  onSaveCertificates: (next: CertificateRecord[]) => void;
  territories: Territory[];
  onSaveTerritories: (next: Territory[]) => void;
  newspaper: NewspaperEdition;
  onSaveNewspaper: (next: NewspaperEdition) => void;
  newspaperArchive: ArchivedNewspaperEdition[];
  onSaveNewspaperArchive: (next: ArchivedNewspaperEdition[]) => void;
  systemConfig: SystemConfig;
  onSaveSystemConfig: (next: SystemConfig) => void;
  systemMessages: SystemMessage[];
  onAdminReplyMessage: (userId: string, text: string) => void;
  predictions: SystemPrediction[];
  onSavePredictions: (next: SystemPrediction[]) => void;
  guidance: SystemGuidanceItem[];
  onSaveGuidance: (next: SystemGuidanceItem[]) => void;
  challenges: SystemChallenge[];
  onSaveChallenges: (next: SystemChallenge[]) => void;
  challengeClaims: ChallengeClaimRequest[];
  onReviewChallengeClaim: (
    claimId: string,
    decision: 'approved' | 'rejected',
    adminNote?: string
  ) => void;
  verdicts: VerdictRecord[];
  onSaveVerdicts: (next: VerdictRecord[]) => void;
  duelQuestions: DuelQuestion[];
  duelConfig: DuelConfig;
  onSaveDuelQuestions: (next: DuelQuestion[]) => void;
  onSaveDuelConfig: (next: DuelConfig) => void;
}

export function AdminPanel(props: AdminPanelProps) {
  const {
    currentUser,
    introSettings,
    onUpdateIntro,
    bsYears,
    onAddBsYear,
    onDeleteBsYear,
    quizzes,
    onSaveQuiz,
    onDeleteQuiz,
    onRemovePlayerFromQuiz,
    gallery,
    onAddGalleryPhoto,
    onDeleteGalleryPhoto,
    users,
    onCreateUser,
    onUpdateUserAny,
    onDeleteUser,
    ranks,
    onSaveRanks,
    levelRanges,
    onSaveLevelRanges,
    streakBands,
    onSaveStreakBands,
    titles,
    onAddTitle,
    achievements,
    auctions,
    onCreateAuction,
    onSettleAuction,
    pastWinners,
    onAddPastWinner,
    onDeletePastWinner,
    certificates,
    onSaveCertificates,
    territories,
    onSaveTerritories,
    newspaper,
    onSaveNewspaper,
    newspaperArchive,
    onSaveNewspaperArchive,
    systemConfig,
    onSaveSystemConfig,
    systemMessages,
    onAdminReplyMessage,
    predictions,
    onSavePredictions,
    guidance,
    onSaveGuidance,
    challenges,
    onSaveChallenges,
    challengeClaims,
    onReviewChallengeClaim,
    verdicts,
    onSaveVerdicts,
    duelQuestions,
    duelConfig,
    onSaveDuelQuestions,
    onSaveDuelConfig,
  } = props;

  const [adminTab, setAdminTab] = useState<AdminSubTab>('hall-of-fame');
  const [toast, setToast] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showSupabaseHelp, setShowSupabaseHelp] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  /* ---- 1. INTRODUCTION STATE ---- */
  const [introForm, setIntroForm] = useState<IntroSettings>(introSettings);
  const introDirtyRef = useRef(false);
  useEffect(() => {
    if (!introDirtyRef.current) {
      setIntroForm(introSettings);
    }
  }, [introSettings]);

  const handleFounderFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingMedia(true);
    try {
      const url = await uploadDqrMedia(file, 'founder');
      const next = { ...introForm, founderPhotoUrl: url };
      introDirtyRef.current = false;
      setIntroForm(next);
      onUpdateIntro(next);
      showToast('Founder photo uploaded and saved immediately.');
    } catch {
      showToast('Failed to process founder photo. Try a JPG or PNG image.');
    } finally {
      setUploadingMedia(false);
    }
  };

  /* ---- 2. HALL OF FAME STATE ---- */
  const [hofAdminSub, setHofAdminSub] = useState<'quizzes' | 'years' | 'gallery'>('quizzes');
  const [newYear, setNewYear] = useState('');
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizName, setQuizName] = useState('');
  const [quizYear, setQuizYear] = useState(bsYears[bsYears.length - 1] || '2082');
  const [quizPosition, setQuizPosition] = useState<QuizPosition>('1st');
  const [quizHost, setQuizHost] = useState('');
  const [quizPlayersLines, setQuizPlayersLines] = useState(''); // LINE SEPARATED!
  const [quizTeams, setQuizTeams] = useState('20');
  const [quizRating, setQuizRating] = useState('9');
  const [quizPlayerRatings, setQuizPlayerRatings] = useState<Record<string, string>>({});
  const [quizNote, setQuizNote] = useState('');
  const [quizPhotoUrl, setQuizPhotoUrl] = useState('');
  const [quizPhotos, setQuizPhotos] = useState<string[]>([]);

  const [galQuizName, setGalQuizName] = useState('');
  const [galYear, setGalYear] = useState(bsYears[bsYears.length - 1] || '2082');
  const [galHost, setGalHost] = useState('');
  const [galCaption, setGalCaption] = useState('');
  const [galImageUrl, setGalImageUrl] = useState('');

  /* ---- 3. ASCENSION PATH STATE ---- */
  const [ascAdminSub, setAscAdminSub] = useState<
    'user-stats' | 'ranks' | 'levels' | 'streaks' | 'titles' | 'auctions' | 'certificates'
  >('user-stats');
  const [targetUserId, setTargetUserId] = useState(users[0]?.id || '');
  const targetUser = users.find((u) => u.id === targetUserId) || users[0];

  // Buffered User Stats & Report Card Draft (prevents 6s Supabase polling / keystroke overwrites)
  const [userStatsDraft, setUserStatsDraft] = useState({
    xp: String(targetUser?.xp ?? 0),
    level: String(targetUser?.level ?? 1),
    streak: String(targetUser?.streak ?? 0),
    rankId: targetUser?.rankId || '',
    tagline: targetUser?.tagline || '',
    announcement: targetUser?.announcement || '',
    grade: targetUser?.reportCard?.grade || '',
    presentation: targetUser?.reportCard?.presentation || '',
    totalQuestionsStudied: targetUser?.reportCard?.totalQuestionsStudied || '',
    remarks: targetUser?.reportCard?.remarks || '',
  });
  useEffect(() => {
    if (!targetUser) return;
    setUserStatsDraft({
      xp: String(targetUser.xp),
      level: String(targetUser.level),
      streak: String(targetUser.streak),
      rankId: targetUser.rankId,
      tagline: targetUser.tagline,
      announcement: targetUser.announcement,
      grade: targetUser.reportCard.grade,
      presentation: targetUser.reportCard.presentation,
      totalQuestionsStudied: targetUser.reportCard.totalQuestionsStudied,
      remarks: targetUser.reportCard.remarks,
    });
  }, [targetUser?.id]);

  // Buffered Streak Bands Draft
  const [streakBandsDraft, setStreakBandsDraft] = useState<StreakBand[]>(streakBands);
  const streakBandsDirtyRef = useRef(false);
  useEffect(() => {
    if (!streakBandsDirtyRef.current) {
      setStreakBandsDraft(streakBands);
    }
  }, [streakBands]);

  // Title studio state
  const [tName, setTName] = useState('Eclipse Sovereign');
  const [tBg, setTBg] = useState('#1E0B36');
  const [tText, setTText] = useState('#FDE68A');
  const [tBorder, setTBorder] = useState('#9333EA');
  const [tAnim, setTAnim] = useState<TitleAnimationType>('shimmer');
  const [tShop, setTShop] = useState(true);
  const [tPrice, setTPrice] = useState('500');
  const [tDesc, setTDesc] = useState('Forged in the Ascension Title Studio.');
  const [giftTitleId, setGiftTitleId] = useState(titles[0]?.id || '');

  // Auction creator state
  const [aucTitleName, setAucTitleName] = useState('Imperial Midnight Monarch');
  const [aucStartBid, setAucStartBid] = useState('500');
  const [aucHours, setAucHours] = useState('24');

  // Past winner creator state
  const [pwUserId, setPwUserId] = useState(users[0]?.id || '');
  const [pwWon, setPwWon] = useState('');
  const [pwPrize, setPwPrize] = useState('');
  const [pwReason, setPwReason] = useState('');

  // Level range creator state
  const [lrStart, setLrStart] = useState('1');
  const [lrEnd, setLrEnd] = useState('5');
  const [lrTag, setLrTag] = useState('Recruit');
  const [lrColor, setLrColor] = useState('#CBD5E1');
  const [lrBg, setLrBg] = useState('#1E293B');
  const [lrBase, setLrBase] = useState('500');
  const [lrGrowth, setLrGrowth] = useState('10');

  // Rank creator state
  const [rkName, setRkName] = useState('');
  const [rkEmblem, setRkEmblem] = useState('✦');
  const [rkColor, setRkColor] = useState('#C084FC');

  /* ---- 4. TERRITORIES STATE ---- */
  const [terAdminSub, setTerAdminSub] = useState<'manage' | 'questions' | 'cooldowns'>('manage');
  const [selectedTerId, setSelectedTerId] = useState(territories[0]?.id || '');
  const activeTer = territories.find((t) => t.id === selectedTerId) || territories[0];
  const [newTerName, setNewTerName] = useState('');
  const [newTerCode, setNewTerCode] = useState('TERRITORY #04');
  const [newTerDesc, setNewTerDesc] = useState('');
  const [newTerDuration, setNewTerDuration] = useState('10');

  // New question state
  const [qPrompt, setQPrompt] = useState('');
  const [qOpt0, setQOpt0] = useState('');
  const [qOpt1, setQOpt1] = useState('');
  const [qOpt2, setQOpt2] = useState('');
  const [qOpt3, setQOpt3] = useState('');
  const [qCorrect, setQCorrect] = useState('0');

  /* ---- 5. NEWSPAPER STATE ---- */
  const [newsForm, setNewsForm] = useState<NewspaperEdition>(newspaper);
  const newsDirtyRef = useRef(false);
  useEffect(() => {
    if (!newsDirtyRef.current) {
      setNewsForm(newspaper);
    }
  }, [newspaper]);

  /* ---- 6. SYSTEM STATE ---- */
  const [sysAdminSub, setSysAdminSub] = useState<
    'inbox' | 'predictions' | 'guidance' | 'challenges' | 'verifications' | 'verdict'
  >('inbox');
  const [chatUserId, setChatUserId] = useState(users[1]?.id || users[0]?.id || '');
  const [adminReply, setAdminReply] = useState('');
  const [claimAdminNotes, setClaimAdminNotes] = useState<Record<string, string>>({});

  // Prediction creator
  const [predTitle, setPredTitle] = useState('');
  const [predCat, setPredCat] = useState<SystemPredictionCategory>('Rank Projection');
  const [predConf, setPredConf] = useState<ConfidenceLevel>('MODERATE CONFIDENCE');
  const [predTarget, setPredTarget] = useState('all');
  const [predPreview, setPredPreview] = useState('');
  const [predFull, setPredFull] = useState('');
  const [predExpires, setPredExpires] = useState('');

  // Guidance creator (strictly unique per user) + buffered draft fields
  const [guiTitle, setGuiTitle] = useState('');
  const [guiAction, setGuiAction] = useState('');
  const [guiExplain, setGuiExplain] = useState('');
  const [guiPriority, setGuiPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [guiTarget, setGuiTarget] = useState(users[1]?.id || users[0]?.id || '');
  const [guiAdviceDraft, setGuiAdviceDraft] = useState(
    systemConfig.perUserGuidance?.[users[1]?.id || users[0]?.id || '']?.strategicAdvice || ''
  );
  const [guiObjectiveDraft, setGuiObjectiveDraft] = useState(
    systemConfig.perUserGuidance?.[users[1]?.id || users[0]?.id || '']?.nextObjective || ''
  );
  const [guiDirectiveDraft, setGuiDirectiveDraft] = useState(
    systemConfig.globalAnnouncement || ''
  );
  useEffect(() => {
    const prof = systemConfig.perUserGuidance?.[guiTarget];
    setGuiAdviceDraft(prof?.strategicAdvice || '');
    setGuiObjectiveDraft(prof?.nextObjective || '');
  }, [guiTarget]);
  useEffect(() => {
    setGuiDirectiveDraft(systemConfig.globalAnnouncement || '');
  }, [sysAdminSub]);

  // Challenge creator (user-based OR global)
  const [chlTitle, setChlTitle] = useState('');
  const [chlDesc, setChlDesc] = useState('');
  const [chlReq, setChlReq] = useState('');
  const [chlReward, setChlReward] = useState('300');
  const [chlDeadline, setChlDeadline] = useState('2026-12-31');
  const [chlTarget, setChlTarget] = useState<string>('all');
  const [chlCat, setChlCat] = useState<'Individual' | 'Competitive' | 'Territorial'>('Competitive');
  const [chlDiff, setChlDiff] = useState<'D-Rank' | 'B-Rank' | 'A-Rank' | 'S-Rank'>('A-Rank');

  // System Verdict state
  const [verdictTarget, setVerdictTarget] = useState(users[1]?.id || users[0]?.id || '');
  const [verdictClass, setVerdictClass] =
    useState<VerdictClassification>('THE CONTENDER');
  const [verdictDesc, setVerdictDesc] = useState('');
  const [verdictStrength, setVerdictStrength] = useState('');
  const [verdictWeakness, setVerdictWeakness] = useState('');
  const [verdictPerf, setVerdictPerf] = useState('');
  const [verdictTendency, setVerdictTendency] = useState('');

  /* ---- 7. USERS STATE ---- */
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [userError, setUserError] = useState('');

  /* ---- HANDLERS ---- */
  const parsedQuizPlayersList = quizPlayersLines
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const handleQuizSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedPlayers = parsedQuizPlayersList;

    if (!quizName.trim() || !quizHost.trim() || parsedPlayers.length === 0) {
      showToast('Quiz Name, Host, and at least 1 line-separated Player are required.');
      return;
    }

    const overallRating = Math.min(
      10,
      Math.max(1, Math.round((Number(quizRating) || 8) * 10) / 10)
    );

    const cleanedPlayerRatings: Record<string, number> = {};
    for (const player of parsedPlayers) {
      const rawVal = quizPlayerRatings[player];
      const numVal =
        rawVal !== undefined && rawVal.trim() !== ''
          ? Number(rawVal)
          : overallRating;
      const clamped = Math.min(
        10,
        Math.max(1, Math.round((Number.isFinite(numVal) ? numVal : overallRating) * 10) / 10)
      );
      cleanedPlayerRatings[player] = clamped;
    }

    onSaveQuiz({
      id: editingQuizId || `qz-${Date.now()}`,
      quizName: quizName.trim(),
      yearBS: quizYear,
      position: quizPosition,
      host: quizHost.trim(),
      players: parsedPlayers,
      teamCount: Math.max(1, Number(quizTeams) || 1),
      rating: overallRating,
      playerRatings: cleanedPlayerRatings,
      extraNote: quizNote.trim(),
      photos: quizPhotos,
      createdAt: editingQuizId
        ? quizzes.find((q) => q.id === editingQuizId)?.createdAt || Date.now()
        : Date.now(),
    });
    showToast(editingQuizId ? 'Quiz updated.' : 'Quiz published.');
    setEditingQuizId(null);
    setQuizName('');
    setQuizHost('');
    setQuizPlayersLines('');
    setQuizPlayerRatings({});
    setQuizRating('9');
    setQuizNote('');
    setQuizPhotos([]);
  };

  const startEditQuiz = (q: QuizRecord) => {
    setEditingQuizId(q.id);
    setQuizName(q.quizName);
    setQuizYear(q.yearBS);
    setQuizPosition(q.position);
    setQuizHost(q.host);
    setQuizPlayersLines(q.players.join('\n'));
    setQuizTeams(String(q.teamCount));
    setQuizRating(String(q.rating));
    const loadedRatings: Record<string, string> = {};
    for (const pl of q.players) {
      const exact = q.playerRatings?.[pl];
      if (typeof exact === 'number' && !Number.isNaN(exact)) {
        loadedRatings[pl] = String(exact);
      } else if (q.playerRatings) {
        const lowerKey = pl.trim().toLowerCase();
        const found = Object.entries(q.playerRatings).find(
          ([k]) => k.trim().toLowerCase() === lowerKey
        );
        loadedRatings[pl] = found ? String(found[1]) : String(q.rating);
      } else {
        loadedRatings[pl] = String(q.rating);
      }
    }
    setQuizPlayerRatings(loadedRatings);
    setQuizNote(q.extraNote);
    setQuizPhotos(q.photos);
  };

  const previewTitle: TitleItem = {
    id: 'preview',
    name: tName || 'Title Preview',
    bgColor: tBg,
    textColor: tText,
    borderColor: tBorder,
    animation: tAnim,
    isShopItem: tShop,
    priceXp: Number(tPrice) || 0,
    description: tDesc,
  };

  const pendingClaimsCount = challengeClaims.filter(
    (c) => c.status === 'pending'
  ).length;
  const duelAttentionCount = duelQuestions.filter(
    (q) => q.status === 'pending' || q.flaggedCount > 0
  ).length;

  const mainTabs: { id: AdminSubTab; label: string; badge?: number }[] = [
    { id: 'introduction', label: 'Introduction' },
    { id: 'hall-of-fame', label: 'Hall of Fame' },
    { id: 'ascension', label: 'Ascension Path' },
    { id: 'territories', label: 'Territories' },
    { id: 'newspaper', label: 'Newspaper' },
    { id: 'system', label: 'System', badge: pendingClaimsCount },
    { id: 'duel-bank', label: '1v1 Question Manager', badge: duelAttentionCount },
    { id: 'users', label: 'Users' },
  ];

  return (
    <div className="min-h-screen bg-[#08080a] px-5 py-10 text-[#f5f2eb] sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Admin Header & Tab Strip */}
        <div className="border-b border-[#d4af37]/25 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-[#d4af37] uppercase">
                Control Center · {currentUser.fullName}
              </p>
              <h1 className="mt-1.5 font-display text-3xl font-bold text-[#f8e6a0] sm:text-4xl">
                DQR Admin Studio
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setShowSupabaseHelp((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/35 bg-[#12100c] px-3.5 py-2 text-xs font-semibold text-[#f5dc82] hover:border-[#d4af37] cursor-pointer"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Supabase SQL & Bucket</span>
            </button>
          </div>

          {showSupabaseHelp && (
            <div className="mt-4 rounded-2xl border border-[#d4af37]/30 bg-[#11100c] p-4 text-xs text-neutral-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[#f8e6a0]">
                  Project: {SUPABASE_URL} · Bucket: <span className="text-white">dqr-media</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `-- Run /supabase/schema.sql in Supabase SQL Editor to create dqr_users, dqr_app_store, dqr_quizzes, dqr_territories, dqr_system_messages and the public dqr-media bucket.`
                    );
                    showToast('Instructions copied. Open /supabase/schema.sql to run in Supabase SQL Editor.');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/40 px-2.5 py-1 text-[11px] font-semibold text-[#f5dc82] cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy Note</span>
                </button>
              </div>
              <p className="mt-2 text-neutral-400">
                Execute <code className="text-[#f5dc82]">supabase/schema.sql</code> in your Supabase SQL Editor once to enable cross-device database sync and the <code className="text-[#f5dc82]">dqr-media</code> Storage bucket. Uploads also work offline via compressed local caching.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-[#d4af37]/30 bg-[#12100c] p-1.5">
            {mainTabs.map((t) => {
              const active = adminTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAdminTab(t.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer sm:text-sm ${
                    active
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#f0cb65] text-[#08080a] shadow-md'
                      : 'text-[#d4ccb8] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{t.label}</span>
                  {typeof t.badge === 'number' && t.badge > 0 && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${
                        active
                          ? 'bg-[#08080a]/15 text-[#08080a]'
                          : 'bg-[#3988FF]/25 text-[#83B9FF]'
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-center gap-2 rounded-xl border border-[#d4af37]/50 bg-[#181409] px-4 py-3 text-sm font-medium text-[#f8e6a0]"
          >
            <Check className="h-4 w-4 text-[#d4af37]" />
            <span>{toast}</span>
          </motion.div>
        )}

        {/* ================= 1. INTRODUCTION ADMIN ================= */}
        {adminTab === 'introduction' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              introDirtyRef.current = false;
              onUpdateIntro(introForm);
              showToast('Introduction updated.');
            }}
            className="mt-8 grid gap-7 lg:grid-cols-12"
          >
            <div className="rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-5">
              <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                Founder Portrait
              </h2>
              <div className="mt-4 aspect-[4/5] overflow-hidden rounded-xl border border-[#d4af37]/30 bg-[#08080a]">
                {introForm.founderPhotoUrl ? (
                  <img
                    src={introForm.founderPhotoUrl}
                    alt="Founder"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FounderGoldenSilhouette />
                )}
              </div>
              <div className="mt-4 space-y-2.5">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#1a160c] py-2.5 text-xs font-semibold text-[#f5dc82] hover:border-[#f0cb65]">
                  <Upload className="h-4 w-4" />
                  <span>
                    {uploadingMedia ? 'Uploading Photo...' : 'Upload Founder Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingMedia}
                    onChange={handleFounderFileUpload}
                    className="hidden"
                  />
                </label>
                {introForm.founderPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...introForm, founderPhotoUrl: null };
                      setIntroForm(next);
                      onUpdateIntro(next);
                      showToast('Reverted to Golden Silhouette.');
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-2 text-xs text-neutral-300 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Use Golden Silhouette</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-7">
              <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                Origin & Mission Copy
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={introForm.founderName}
                  onChange={(e) => {
                    introDirtyRef.current = true;
                    setIntroForm((p) => ({ ...p, founderName: e.target.value }));
                  }}
                  placeholder="Founder Name"
                  className="rounded-xl border border-white/15 bg-[#151410] px-3.5 py-2.5 text-sm text-white"
                />
                <input
                  value={introForm.establishedDate}
                  onChange={(e) => {
                    introDirtyRef.current = true;
                    setIntroForm((p) => ({
                      ...p,
                      establishedDate: e.target.value,
                    }));
                  }}
                  placeholder="Established Date"
                  className="rounded-xl border border-white/15 bg-[#151410] px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <input
                value={introForm.aboutHeadline}
                onChange={(e) => {
                  introDirtyRef.current = true;
                  setIntroForm((p) => ({ ...p, aboutHeadline: e.target.value }));
                }}
                placeholder="Headline"
                className="w-full rounded-xl border border-white/15 bg-[#151410] px-3.5 py-2.5 text-sm text-white"
              />
              <textarea
                rows={4}
                value={introForm.aboutText}
                onChange={(e) => {
                  introDirtyRef.current = true;
                  setIntroForm((p) => ({ ...p, aboutText: e.target.value }));
                }}
                className="w-full rounded-xl border border-white/15 bg-[#151410] px-3.5 py-2.5 text-sm text-white"
              />
              <input
                value={introForm.missionLine}
                onChange={(e) => {
                  introDirtyRef.current = true;
                  setIntroForm((p) => ({ ...p, missionLine: e.target.value }));
                }}
                className="w-full rounded-xl border border-white/15 bg-[#151410] px-3.5 py-2.5 text-sm text-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#d4af37] px-6 py-2.5 text-xs font-bold text-[#08080a] cursor-pointer"
              >
                Save Introduction
              </button>
            </div>
          </form>
        )}

        {/* ================= 2. HALL OF FAME ADMIN (INNER TABS) ================= */}
        {adminTab === 'hall-of-fame' && (
          <div className="mt-7 space-y-6">
            <div className="inline-flex rounded-xl border border-white/15 bg-[#12100c] p-1">
              {(
                [
                  { id: 'quizzes', label: 'Quizzes & Players' },
                  { id: 'years', label: 'B.S. Years' },
                  { id: 'gallery', label: 'Gallery Photos' },
                ] as const
              ).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setHofAdminSub(sub.id)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold cursor-pointer ${
                    hofAdminSub === sub.id
                      ? 'bg-[#d4af37] text-[#08080a]'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {hofAdminSub === 'quizzes' && (
              <div className="grid gap-7 lg:grid-cols-12">
                <form
                  onSubmit={handleQuizSubmit}
                  className="space-y-3.5 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-5"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                      {editingQuizId ? 'Edit Quiz' : 'Create Quiz Record'}
                    </h2>
                    {editingQuizId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuizId(null);
                          setQuizName('');
                          setQuizHost('');
                          setQuizPlayersLines('');
                          setQuizPlayerRatings({});
                          setQuizRating('9');
                          setQuizNote('');
                          setQuizPhotos([]);
                        }}
                        className="text-xs text-neutral-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <input
                    required
                    value={quizName}
                    onChange={(e) => setQuizName(e.target.value)}
                    placeholder="Quiz Name *"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3.5 py-2 text-sm text-white"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={quizYear}
                      onChange={(e) => setQuizYear(e.target.value)}
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                    >
                      {bsYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr} B.S.
                        </option>
                      ))}
                    </select>

                    <select
                      value={quizPosition}
                      onChange={(e) =>
                        setQuizPosition(e.target.value as QuizPosition)
                      }
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    >
                      {POSITION_OPTIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    required
                    value={quizHost}
                    onChange={(e) => setQuizHost(e.target.value)}
                    placeholder="Host / Organizer *"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3.5 py-2 text-sm text-white"
                  />

                  <div>
                    <label className="block text-xs font-medium text-[#f5dc82]">
                      Players (One per line — line separated) *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={quizPlayersLines}
                      onChange={(e) => setQuizPlayersLines(e.target.value)}
                      placeholder={'Dijan Bhattarai\nAarav Sharma\nSujata Adhikari'}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3.5 py-2 font-sans text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-neutral-300">
                        Total Teams
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={quizTeams}
                        onChange={(e) => setQuizTeams(e.target.value)}
                        placeholder="Teams"
                        className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-neutral-300">
                        Overall Quiz Rating (1–10)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        step="0.1"
                        value={quizRating}
                        onChange={(e) => setQuizRating(e.target.value)}
                        placeholder="Rating 1-10"
                        className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                      />
                    </div>
                  </div>

                  {parsedQuizPlayersList.length > 0 && (
                    <div className="rounded-xl border border-[#d4af37]/25 bg-[#15120b] p-3.5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#f5dc82]">
                          Individual Player Ratings (1–10)
                        </span>
                        <span className="font-mono text-[10px] text-neutral-400">
                          Defaults to {quizRating || '9'}/10
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {parsedQuizPlayersList.map((player) => (
                          <div
                            key={player}
                            className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-1.5"
                          >
                            <span className="truncate text-xs font-medium text-neutral-100">
                              {player}
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              step="0.1"
                              aria-label={`Rating for ${player}`}
                              value={quizPlayerRatings[player] ?? ''}
                              placeholder={quizRating || '9'}
                              onChange={(e) =>
                                setQuizPlayerRatings((prev) => ({
                                  ...prev,
                                  [player]: e.target.value,
                                }))
                              }
                              className="w-16 shrink-0 rounded-md border border-[#d4af37]/35 bg-[#16140f] px-2 py-1 text-right font-mono text-xs font-bold text-[#f8e6a0] focus:border-[#d4af37] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={quizNote}
                    onChange={(e) => setQuizNote(e.target.value)}
                    placeholder="Extra note..."
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3.5 py-2 text-sm text-white"
                  />

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={quizPhotoUrl}
                        onChange={(e) => setQuizPhotoUrl(e.target.value)}
                        placeholder="Attach photo URL..."
                        className="flex-1 rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (quizPhotoUrl.trim()) {
                            setQuizPhotos((p) => [...p, quizPhotoUrl.trim()]);
                            setQuizPhotoUrl('');
                          }
                        }}
                        className="rounded-xl border border-[#d4af37]/40 px-3 py-2 text-xs text-[#f5dc82] cursor-pointer"
                      >
                        Add URL
                      </button>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-[#d4af37]/40 bg-[#1a160c] px-3 py-2 text-xs text-[#f5dc82]">
                        <ImagePlus className="h-3.5 w-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (!f) return;
                            try {
                              const url = await uploadDqrMedia(f, 'quizzes');
                              setQuizPhotos((p) => [...p, url]);
                              showToast('Quiz photo attached.');
                            } catch {
                              showToast('Failed to process quiz image.');
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {quizPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {quizPhotos.map((src, idx) => (
                          <div
                            key={`${src}-${idx}`}
                            className="relative h-12 w-16 overflow-hidden rounded-lg border border-white/15"
                          >
                            <img
                              src={src}
                              alt="Quiz attachment"
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setQuizPhotos((p) =>
                                  p.filter((_, i) => i !== idx)
                                )
                              }
                              className="absolute right-0.5 top-0.5 rounded bg-black/75 px-1 text-[10px] text-red-300 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] py-2.5 text-xs font-bold text-[#08080a] cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{editingQuizId ? 'Update Quiz' : 'Publish Quiz'}</span>
                  </button>
                </form>

                {/* Quiz & Individual Player Removal List */}
                <div className="space-y-3 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-7">
                  <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                    Manage Quizzes & Players ({quizzes.length})
                  </h2>
                  <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
                    {quizzes.map((q) => (
                      <div
                        key={q.id}
                        className="rounded-xl border border-white/10 bg-[#16140f] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-mono text-[11px] text-[#d4af37]">
                              {q.yearBS} B.S. · {q.position} · {q.host}
                            </p>
                            <h3 className="font-display text-base font-bold text-white">
                              {q.quizName}
                            </h3>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEditQuiz(q)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/30 px-2.5 py-1 text-xs text-[#f5dc82] cursor-pointer"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteQuiz(q.id);
                                showToast('Quiz deleted.');
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-300 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete Quiz</span>
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {q.players.map((pl) => {
                            const pRate =
                              q.playerRatings?.[pl] ??
                              (q.playerRatings
                                ? Object.entries(q.playerRatings).find(
                                    ([k]) =>
                                      k.trim().toLowerCase() === pl.trim().toLowerCase()
                                  )?.[1]
                                : undefined) ??
                              q.rating;
                            return (
                              <span
                                key={pl}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 text-xs text-neutral-200"
                              >
                                <span>{pl}</span>
                                <span className="rounded bg-[#d4af37]/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#f5dc82]">
                                  {pRate}/10
                                </span>
                                <button
                                  type="button"
                                  title={`Remove ${pl}`}
                                  onClick={() => {
                                    onRemovePlayerFromQuiz(q.id, pl);
                                    showToast(`Removed ${pl} from ${q.quizName}`);
                                  }}
                                  className="text-red-300 hover:text-red-100 cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {hofAdminSub === 'years' && (
              <div className="rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6">
                <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                  Bikram Sambat Year Buttons
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Adding a year immediately generates a new year button in
                  External Wins.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!/^\d{4}$/.test(newYear)) {
                      showToast('Enter a 4-digit B.S. year.');
                      return;
                    }
                    if (!bsYears.includes(newYear)) {
                      onAddBsYear(newYear);
                      setNewYear('');
                      showToast(`Added ${newYear} B.S. button.`);
                    }
                  }}
                  className="mt-4 flex gap-2"
                >
                  <input
                    maxLength={4}
                    value={newYear}
                    onChange={(e) =>
                      setNewYear(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    placeholder="2083"
                    className="w-32 rounded-xl border border-[#d4af37]/35 bg-[#17150f] px-3 py-2 font-mono text-sm text-white"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#08080a] cursor-pointer"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    <span>Add Year Button</span>
                  </button>
                </form>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  {bsYears.map((yr) => (
                    <div
                      key={yr}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#17140d] px-3.5 py-2 font-mono text-sm text-[#f8e6a0]"
                    >
                      <span>{yr} B.S.</span>
                      <button
                        type="button"
                        onClick={() => onDeleteBsYear(yr)}
                        className="text-red-300 hover:text-red-100 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hofAdminSub === 'gallery' && (
              <div className="rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6">
                <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                  Gallery Manager
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!galQuizName || !galImageUrl) return;
                    onAddGalleryPhoto({
                      id: `gal-${Date.now()}`,
                      quizName: galQuizName,
                      yearBS: galYear,
                      host: galHost || 'District Organizer',
                      caption: galCaption || galQuizName,
                      imageUrl: galImageUrl,
                    });
                    setGalQuizName('');
                    setGalCaption('');
                    setGalImageUrl('');
                    showToast('Gallery photo added.');
                  }}
                  className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
                >
                  <input
                    required
                    value={galQuizName}
                    onChange={(e) => setGalQuizName(e.target.value)}
                    placeholder="Quiz Name *"
                    className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <select
                    value={galYear}
                    onChange={(e) => setGalYear(e.target.value)}
                    className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                  >
                    {bsYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr} B.S.
                      </option>
                    ))}
                  </select>
                  <input
                    value={galHost}
                    onChange={(e) => setGalHost(e.target.value)}
                    placeholder="Host"
                    className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    value={galCaption}
                    onChange={(e) => setGalCaption(e.target.value)}
                    placeholder="Caption"
                    className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white">
                      <ImagePlus className="h-3.5 w-3.5" />
                      <span>{galImageUrl ? 'Ready' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          e.target.value = '';
                          if (!f) return;
                          try {
                            const url = await uploadDqrMedia(f, 'gallery');
                            setGalImageUrl(url);
                            showToast('Gallery photo ready to add.');
                          } catch {
                            showToast('Failed to process gallery image.');
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#08080a] cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {gallery.map((g) => (
                    <div
                      key={g.id}
                      className="relative overflow-hidden rounded-xl border border-white/10 bg-[#16140f]"
                    >
                      <img
                        src={g.imageUrl}
                        alt={g.caption}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <div className="p-2.5 text-xs">
                        <p className="font-mono text-[10px] text-[#d4af37]">
                          {g.yearBS} B.S. · {g.quizName}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteGalleryPhoto(g.id)}
                        className="absolute right-2 top-2 rounded bg-black/75 p-1.5 text-red-300 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 3. ASCENSION PATH ADMIN (INNER TABS) ================= */}
        {adminTab === 'ascension' && (
          <div className="mt-7 space-y-6">
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/15 bg-[#12100c] p-1">
              {(
                [
                  { id: 'user-stats', label: 'User Stats & Report Card' },
                  { id: 'ranks', label: 'Ranks' },
                  { id: 'levels', label: 'Level Ranges' },
                  { id: 'streaks', label: 'Streak Bands' },
                  { id: 'titles', label: 'Title Studio & Gift' },
                  { id: 'auctions', label: 'Auctions & Past Winners' },
                  { id: 'certificates', label: 'Certificates & Seals' },
                ] as const
              ).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setAscAdminSub(sub.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                    ascAdminSub === sub.id
                      ? 'bg-[#9333ea] text-white'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* User Stats, Streak, Tagline, Announcement, Achievements & Report Card */}
            {ascAdminSub === 'user-stats' && targetUser && (
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-4 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                      Edit User Variables
                    </h2>
                    <select
                      value={targetUser.id}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="rounded-xl border border-[#d4af37]/40 bg-[#17150f] px-3 py-1.5 text-xs text-white"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} (@{u.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400">XP</label>
                      <input
                        type="number"
                        value={userStatsDraft.xp}
                        onChange={(e) =>
                          setUserStatsDraft((d) => ({
                            ...d,
                            xp: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400">
                        Level
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={userStatsDraft.level}
                        onChange={(e) =>
                          setUserStatsDraft((d) => ({
                            ...d,
                            level: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400">
                        Streak (Days)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={userStatsDraft.streak}
                        onChange={(e) =>
                          setUserStatsDraft((d) => ({
                            ...d,
                            streak: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400">Rank</label>
                    <select
                      value={userStatsDraft.rankId}
                      onChange={(e) =>
                        setUserStatsDraft((d) => ({
                          ...d,
                          rankId: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                    >
                      {ranks.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.emblem} {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400">
                      Custom Tagline
                    </label>
                    <input
                      value={userStatsDraft.tagline}
                      onChange={(e) =>
                        setUserStatsDraft((d) => ({
                          ...d,
                          tagline: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400">
                      Announcement (triggers unchecked alert)
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        value={userStatsDraft.announcement}
                        onChange={(e) =>
                          setUserStatsDraft((d) => ({
                            ...d,
                            announcement: e.target.value,
                          }))
                        }
                        className="flex-1 rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const announcementChanged =
                        userStatsDraft.announcement !== targetUser.announcement;
                      onUpdateUserAny(targetUser.id, {
                        xp: Math.max(0, Number(userStatsDraft.xp) || 0),
                        level: Math.max(1, Number(userStatsDraft.level) || 1),
                        streak: Math.max(0, Number(userStatsDraft.streak) || 0),
                        rankId: userStatsDraft.rankId || targetUser.rankId,
                        tagline: userStatsDraft.tagline,
                        announcement: userStatsDraft.announcement,
                        announcementChecked: announcementChanged
                          ? false
                          : targetUser.announcementChecked,
                      });
                      showToast(`Saved stats for ${targetUser.fullName}.`);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] py-2.5 text-xs font-bold text-[#08080a] hover:bg-[#f0cb65] cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save User Stats &amp; Announcement</span>
                  </button>

                  <div>
                    <label className="text-[11px] text-neutral-400">
                      Grant / Revoke Achievements
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {achievements.map((ach) => {
                        const has = targetUser.achievementIds.includes(ach.id);
                        return (
                          <button
                            key={ach.id}
                            type="button"
                            onClick={() => {
                              const nextIds = has
                                ? targetUser.achievementIds.filter(
                                    (id) => id !== ach.id
                                  )
                                : [...targetUser.achievementIds, ach.id];
                              onUpdateUserAny(targetUser.id, {
                                achievementIds: nextIds,
                              });
                            }}
                            className={`rounded-lg border px-2.5 py-1 text-xs cursor-pointer ${
                              has
                                ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#fde68a]'
                                : 'border-white/15 text-neutral-400'
                            }`}
                          >
                            {ach.icon} {ach.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Report Card Photo & Fields */}
                <div className="space-y-3.5 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-6">
                  <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                    Report Card Manager ({targetUser.fullName})
                  </h2>

                  <div className="flex items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#1a160c] px-4 py-2 text-xs font-semibold text-[#f5dc82]">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Report Card Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          e.target.value = '';
                          if (!f) return;
                          try {
                            const url = await uploadDqrMedia(f, 'report-cards');
                            onUpdateUserAny(targetUser.id, {
                              reportCard: {
                                ...targetUser.reportCard,
                                imageUrl: url,
                              },
                            });
                            showToast('Report card photo updated.');
                          } catch {
                            showToast('Failed to upload report card image.');
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <input
                    value={userStatsDraft.grade}
                    onChange={(e) =>
                      setUserStatsDraft((d) => ({
                        ...d,
                        grade: e.target.value,
                      }))
                    }
                    placeholder="Grade"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                  />
                  <input
                    value={userStatsDraft.presentation}
                    onChange={(e) =>
                      setUserStatsDraft((d) => ({
                        ...d,
                        presentation: e.target.value,
                      }))
                    }
                    placeholder="Presentation"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                  />
                  <input
                    value={userStatsDraft.totalQuestionsStudied}
                    onChange={(e) =>
                      setUserStatsDraft((d) => ({
                        ...d,
                        totalQuestionsStudied: e.target.value,
                      }))
                    }
                    placeholder="Total Questions Studied"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                  />
                  <textarea
                    rows={3}
                    value={userStatsDraft.remarks}
                    onChange={(e) =>
                      setUserStatsDraft((d) => ({
                        ...d,
                        remarks: e.target.value,
                      }))
                    }
                    placeholder="Remarks"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateUserAny(targetUser.id, {
                        reportCard: {
                          ...targetUser.reportCard,
                          grade: userStatsDraft.grade,
                          presentation: userStatsDraft.presentation,
                          totalQuestionsStudied:
                            userStatsDraft.totalQuestionsStudied,
                          remarks: userStatsDraft.remarks,
                          updatedAt: new Date().toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }),
                        },
                      });
                      showToast(`Report card saved for ${targetUser.fullName}.`);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] py-2.5 text-xs font-bold text-[#08080a] hover:bg-[#f0cb65] cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Report Card</span>
                  </button>
                </div>
              </div>
            )}

            {/* Ranks */}
            {ascAdminSub === 'ranks' && (
              <div className="rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6">
                <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                  Ranks Hierarchy (Supreme → Grade 4)
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!rkName.trim()) return;
                    onSaveRanks([
                      ...ranks,
                      {
                        id: `rk-${Date.now()}`,
                        name: rkName.trim(),
                        order: ranks.length + 1,
                        color: rkColor,
                        bgTint: '#1F1035',
                        emblem: rkEmblem || '✦',
                      },
                    ]);
                    setRkName('');
                    showToast('Rank added.');
                  }}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  <input
                    value={rkName}
                    onChange={(e) => setRkName(e.target.value)}
                    placeholder="New Rank Name"
                    className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    value={rkEmblem}
                    onChange={(e) => setRkEmblem(e.target.value)}
                    placeholder="Emblem"
                    className="w-20 rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="color"
                    value={rkColor}
                    onChange={(e) => setRkColor(e.target.value)}
                    className="h-9 w-12 rounded cursor-pointer"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#08080a] cursor-pointer"
                  >
                    Add Rank
                  </button>
                </form>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {ranks.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#16140f] px-4 py-2.5"
                    >
                      <span
                        style={{ color: r.color }}
                        className="font-display text-sm font-bold"
                      >
                        {r.emblem} {r.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onSaveRanks(ranks.filter((x) => x.id !== r.id))
                        }
                        className="text-red-300 hover:text-red-100 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Level Ranges */}
            {ascAdminSub === 'levels' && (
              <div className="rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6">
                <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                  Level Ranges & XP Growth (% Multiplier)
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSaveLevelRanges([
                      ...levelRanges,
                      {
                        id: `lr-${Date.now()}`,
                        startLevel: Number(lrStart) || 1,
                        endLevel: Number(lrEnd) || 5,
                        tag: lrTag || 'Tier',
                        color: lrColor,
                        bgColor: lrBg,
                        baseXp: Number(lrBase) || 500,
                        growthPercent: Number(lrGrowth) || 10,
                      },
                    ]);
                    showToast('Level range added.');
                  }}
                  className="mt-4 grid gap-2.5 sm:grid-cols-4 lg:grid-cols-8"
                >
                  <input
                    type="number"
                    value={lrStart}
                    onChange={(e) => setLrStart(e.target.value)}
                    placeholder="Start Lv"
                    className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="number"
                    value={lrEnd}
                    onChange={(e) => setLrEnd(e.target.value)}
                    placeholder="End Lv"
                    className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    value={lrTag}
                    onChange={(e) => setLrTag(e.target.value)}
                    placeholder="Tag (e.g. Recruit)"
                    className="col-span-2 rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="number"
                    value={lrBase}
                    onChange={(e) => setLrBase(e.target.value)}
                    placeholder="Base XP"
                    className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="number"
                    value={lrGrowth}
                    onChange={(e) => setLrGrowth(e.target.value)}
                    placeholder="Growth %"
                    className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={lrColor}
                      onChange={(e) => setLrColor(e.target.value)}
                      className="h-9 w-9 cursor-pointer"
                    />
                    <input
                      type="color"
                      value={lrBg}
                      onChange={(e) => setLrBg(e.target.value)}
                      className="h-9 w-9 cursor-pointer"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#d4af37] px-3 py-2 text-xs font-bold text-[#08080a] cursor-pointer"
                  >
                    Add Range
                  </button>
                </form>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {levelRanges.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        borderColor: `${r.color}55`,
                        backgroundColor: `${r.bgColor}80`,
                      }}
                      className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs"
                    >
                      <div>
                        <p style={{ color: r.color }} className="font-bold">
                          {r.tag}
                        </p>
                        <p className="font-mono text-white/75">
                          Lv {r.startLevel}–{r.endLevel} · {r.baseXp} XP (+
                          {r.growthPercent}%)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onSaveLevelRanges(
                            levelRanges.filter((x) => x.id !== r.id)
                          )
                        }
                        className="text-red-300 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Streak Bands */}
            {ascAdminSub === 'streaks' && (
              <div className="rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                    10-Day Streak Milestone Bands
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      streakBandsDirtyRef.current = false;
                      onSaveStreakBands(streakBandsDraft);
                      showToast('Streak milestone bands saved.');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#08080a] hover:bg-[#f0cb65] cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Streak Bands</span>
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {streakBandsDraft.map((b, idx) => (
                    <div
                      key={b.id}
                      className="grid items-center gap-3 rounded-xl border border-white/10 bg-[#16140f] p-3 sm:grid-cols-12"
                    >
                      <span className="font-mono text-xs text-[#d4af37] sm:col-span-2">
                        {b.minDays}–{b.maxDays >= 9999 ? '100+' : b.maxDays}d
                      </span>
                      <input
                        value={b.label}
                        onChange={(e) => {
                          streakBandsDirtyRef.current = true;
                          const next = [...streakBandsDraft];
                          next[idx] = { ...b, label: e.target.value };
                          setStreakBandsDraft(next);
                        }}
                        className="rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-white sm:col-span-3"
                      />
                      <input
                        value={b.message}
                        onChange={(e) => {
                          streakBandsDirtyRef.current = true;
                          const next = [...streakBandsDraft];
                          next[idx] = { ...b, message: e.target.value };
                          setStreakBandsDraft(next);
                        }}
                        className="rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-white sm:col-span-7"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Title Studio (50 Presets + Color Wheel + Live Preview + Gift/Deassign) */}
            {ascAdminSub === 'titles' && (
              <div className="grid gap-6 lg:grid-cols-12">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!tName.trim()) return;
                    onAddTitle({
                      ...previewTitle,
                      id: `ttl-${Date.now()}`,
                    });
                    showToast(`Created title "${tName}".`);
                  }}
                  className="space-y-4 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-7"
                >
                  <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                    Title Studio & Live Preview
                  </h2>

                  {/* Live Preview Box */}
                  <div className="flex items-center justify-between rounded-xl border border-[#8b5cf6]/40 bg-[#0b0714] p-4">
                    <span className="font-mono text-xs text-neutral-400">
                      Live Chip Preview:
                    </span>
                    <TitleBadge title={previewTitle} size="lg" />
                  </div>

                  {/* Quick 50-Preset Loader */}
                  <div>
                    <label className="text-[11px] text-neutral-400">
                      Load from 50 Preset Titles
                    </label>
                    <select
                      onChange={(e) => {
                        const preset = FIFTY_TITLE_PRESETS.find(
                          (p) => p.id === e.target.value
                        );
                        if (preset) {
                          setTName(preset.name);
                          setTBg(preset.bgColor);
                          setTText(preset.textColor);
                          setTBorder(preset.borderColor);
                          setTAnim(preset.animation);
                          setTShop(preset.isShopItem);
                          setTPrice(String(preset.priceXp));
                        }
                      }}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    >
                      <option value="">-- Select from 50 Presets --</option>
                      {FIFTY_TITLE_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.animation})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                      placeholder="Title Name"
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                    />
                    <select
                      value={tAnim}
                      onChange={(e) =>
                        setTAnim(e.target.value as TitleAnimationType)
                      }
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    >
                      <option value="shimmer">Animation: Shimmer</option>
                      <option value="pulse-glow">Animation: Pulse Glow</option>
                      <option value="float">Animation: Float</option>
                      <option value="neon-aura">Animation: Neon Aura</option>
                      <option value="gradient-sweep">
                        Animation: Gradient Sweep
                      </option>
                      <option value="none">Animation: None</option>
                    </select>
                  </div>

                  {/* Color Wheel Pickers */}
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-xs">
                      <span>BG:</span>
                      <input
                        type="color"
                        value={tBg}
                        onChange={(e) => setTBg(e.target.value)}
                        className="h-8 w-10 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <span>Text:</span>
                      <input
                        type="color"
                        value={tText}
                        onChange={(e) => setTText(e.target.value)}
                        className="h-8 w-10 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <span>Border:</span>
                      <input
                        type="color"
                        value={tBorder}
                        onChange={(e) => setTBorder(e.target.value)}
                        className="h-8 w-10 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Quick Swatches */}
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_WHEEL_PRESETS.map((sw) => (
                      <button
                        key={sw.name}
                        type="button"
                        onClick={() => {
                          setTBg(sw.bg);
                          setTText(sw.text);
                          setTBorder(sw.border);
                        }}
                        style={{
                          backgroundColor: sw.bg,
                          color: sw.text,
                          borderColor: sw.border,
                        }}
                        className="rounded border px-2 py-1 text-[10px] cursor-pointer"
                      >
                        {sw.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={tShop}
                        onChange={(e) => setTShop(e.target.checked)}
                      />
                      <span>List in Shop?</span>
                    </label>
                    {tShop && (
                      <input
                        type="number"
                        value={tPrice}
                        onChange={(e) => setTPrice(e.target.value)}
                        placeholder="XP Price"
                        className="w-28 rounded-xl border border-white/15 bg-[#16140f] px-3 py-1.5 font-mono text-xs text-white"
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-[#d4af37] px-5 py-2.5 text-xs font-bold text-[#08080a] cursor-pointer"
                  >
                    Create Title
                  </button>
                </form>

                {/* Assign / Gift / De-assign Titles to Users */}
                <div className="space-y-4 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-5">
                  <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                    Gift or De-assign Title
                  </h2>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} (@{u.username})
                      </option>
                    ))}
                  </select>

                  <select
                    value={giftTitleId}
                    onChange={(e) => setGiftTitleId(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  >
                    {titles.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.isShopItem ? '(Shop)' : '(Exclusive)'}
                      </option>
                    ))}
                  </select>

                  {targetUser && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!targetUser.ownedTitleIds.includes(giftTitleId)) {
                            onUpdateUserAny(targetUser.id, {
                              ownedTitleIds: [
                                ...targetUser.ownedTitleIds,
                                giftTitleId,
                              ],
                            });
                            showToast(`Gifted title to ${targetUser.fullName}.`);
                          }
                        }}
                        className="flex-1 rounded-xl bg-[#9333ea] py-2 text-xs font-bold text-white cursor-pointer"
                      >
                        Assign / Gift Title
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateUserAny(targetUser.id, {
                            ownedTitleIds: targetUser.ownedTitleIds.filter(
                              (id) => id !== giftTitleId
                            ),
                            equippedTitleId:
                              targetUser.equippedTitleId === giftTitleId
                                ? null
                                : targetUser.equippedTitleId,
                          });
                          showToast(
                            `Removed title from ${targetUser.fullName}.`
                          );
                        }}
                        className="rounded-xl border border-red-400/40 px-3 py-2 text-xs text-red-300 cursor-pointer"
                      >
                        De-assign
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Auctions & Past Winners */}
            {ascAdminSub === 'auctions' && (
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-4 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-6">
                  <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                    Launch Title Auction
                  </h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onCreateAuction({
                        id: `auc-${Date.now()}`,
                        title: {
                          id: `ttl-auc-${Date.now()}`,
                          name: aucTitleName || 'Auction Prestige Title',
                          bgColor: '#2E1065',
                          textColor: '#FDE047',
                          borderColor: '#D4AF37',
                          animation: 'gradient-sweep',
                          isShopItem: false,
                          priceXp: 0,
                          description: 'Auction-exclusive Ascension title.',
                        },
                        startingBid: Number(aucStartBid) || 500,
                        currentBid: Number(aucStartBid) || 500,
                        highestBidderId: null,
                        highestBidderName: null,
                        endsAt:
                          Date.now() +
                          Math.max(1, Number(aucHours) || 1) * 3600 * 1000,
                        settled: false,
                        bids: [],
                      });
                      showToast('Auction launched!');
                    }}
                    className="space-y-3"
                  >
                    <input
                      value={aucTitleName}
                      onChange={(e) => setAucTitleName(e.target.value)}
                      placeholder="Auction Title Name"
                      className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={aucStartBid}
                        onChange={(e) => setAucStartBid(e.target.value)}
                        placeholder="Starting Bid XP"
                        className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                      />
                      <input
                        type="number"
                        value={aucHours}
                        onChange={(e) => setAucHours(e.target.value)}
                        placeholder="Duration (Hours)"
                        className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#08080a] cursor-pointer"
                    >
                      <Gavel className="h-4 w-4" />
                      <span>Start Live Auction</span>
                    </button>
                  </form>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    {auctions.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-xl bg-[#16140f] p-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{a.title.name}</p>
                          <p className="text-neutral-400">
                            {a.currentBid} XP · {a.highestBidderName || 'No bids'}
                          </p>
                        </div>
                        {!a.settled && a.highestBidderId && (
                          <button
                            type="button"
                            onClick={() => {
                              onSettleAuction(a.id);
                              showToast('Auction settled.');
                            }}
                            className="rounded-lg bg-[#9333ea] px-3 py-1 text-xs font-bold text-white cursor-pointer"
                          >
                            Settle Now
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Past Winners Manager */}
                <div className="space-y-4 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-6">
                  <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                    Past Winners Entry
                  </h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!pwWon || !pwPrize) return;
                      onAddPastWinner({
                        id: `pw-${Date.now()}`,
                        userId: pwUserId,
                        wonText: pwWon,
                        prizeGot: pwPrize,
                        reason: pwReason,
                      });
                      setPwWon('');
                      setPwPrize('');
                      setPwReason('');
                      showToast('Past winner recorded.');
                    }}
                    className="space-y-3"
                  >
                    <select
                      value={pwUserId}
                      onChange={(e) => setPwUserId(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                    </select>
                    <input
                      value={pwWon}
                      onChange={(e) => setPwWon(e.target.value)}
                      placeholder="Won (e.g. Season II Championship)"
                      className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    />
                    <input
                      value={pwPrize}
                      onChange={(e) => setPwPrize(e.target.value)}
                      placeholder="Prize Got (e.g. Title + 800 XP)"
                      className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    />
                    <input
                      value={pwReason}
                      onChange={(e) => setPwReason(e.target.value)}
                      placeholder="Reason"
                      className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#08080a] cursor-pointer"
                    >
                      Add Winner
                    </button>
                  </form>

                  <div className="space-y-2">
                    {pastWinners.map((pw) => (
                      <div
                        key={pw.id}
                        className="flex items-center justify-between rounded-xl bg-[#16140f] px-3 py-2 text-xs"
                      >
                        <span>
                          {users.find((u) => u.id === pw.userId)?.fullName} —{' '}
                          {pw.wonText}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeletePastWinner(pw.id)}
                          className="text-red-300 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Certificates Studio & User Assignment */}
            {ascAdminSub === 'certificates' && (
              <AdminCertificateStudio
                users={users}
                certificates={certificates}
                onSaveCertificates={onSaveCertificates}
                onToast={showToast}
              />
            )}
          </div>
        )}

        {/* ================= 4. TERRITORIES ADMIN ================= */}
        {adminTab === 'territories' && (
          <div className="mt-7 space-y-6">
            <div className="inline-flex rounded-xl border border-white/15 bg-[#12100c] p-1">
              {(
                [
                  { id: 'manage', label: 'Create / Edit Territories' },
                  { id: 'questions', label: 'Question Bank' },
                  { id: 'cooldowns', label: 'Cooldowns & Ownership' },
                ] as const
              ).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setTerAdminSub(sub.id)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold cursor-pointer ${
                    terAdminSub === sub.id
                      ? 'bg-[#d4af37] text-[#08080a]'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {terAdminSub === 'manage' && (
              <div className="grid gap-6 lg:grid-cols-12">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newTerName.trim()) return;
                    const created: Territory = {
                      id: `ter-${Date.now()}`,
                      code: newTerCode || `TERRITORY #0${territories.length + 1}`,
                      name: newTerName.trim(),
                      description: newTerDesc || 'New competitive arena.',
                      iconType: 'bastion',
                      customIconUrl: null,
                      durationMinutes: Number(newTerDuration) || 10,
                      currentHolderUserId: null,
                      currentHolderName: null,
                      highestScore: 0,
                      wonOn: null,
                      questions: territories[0]?.questions || [],
                      history: [],
                      attemptedUserIds: [],
                    };
                    onSaveTerritories([...territories, created]);
                    setNewTerName('');
                    setNewTerDesc('');
                    showToast('Territory created.');
                  }}
                  className="space-y-3 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-5"
                >
                  <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                    Create Territory
                  </h2>
                  <input
                    value={newTerCode}
                    onChange={(e) => setNewTerCode(e.target.value)}
                    placeholder="TERRITORY #04"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                  />
                  <input
                    required
                    value={newTerName}
                    onChange={(e) => setNewTerName(e.target.value)}
                    placeholder="Territory Name (e.g. Moon Bastion)"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                  />
                  <textarea
                    rows={2}
                    value={newTerDesc}
                    onChange={(e) => setNewTerDesc(e.target.value)}
                    placeholder="Description"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newTerDuration}
                    onChange={(e) => setNewTerDuration(e.target.value)}
                    placeholder="Duration (Minutes)"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#d4af37] px-5 py-2.5 text-xs font-bold text-[#08080a] cursor-pointer"
                  >
                    Create Territory
                  </button>
                </form>

                <div className="space-y-3 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-7">
                  <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                    Active Territories ({territories.length})
                  </h2>
                  {territories.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#16140f] p-4"
                    >
                      <div>
                        <p className="font-mono text-[11px] text-[#d4af37]">
                          {t.code} · {t.durationMinutes} min ·{' '}
                          {t.questions.length} Qs
                        </p>
                        <p className="font-display text-base font-bold text-white">
                          {t.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer rounded-lg border border-[#d4af37]/30 px-2.5 py-1 text-xs text-[#f5dc82]">
                          Icon Upload
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.target.value = '';
                              if (!f) return;
                              try {
                                const url = await uploadDqrMedia(f, 'territories');
                                onSaveTerritories(
                                  territories.map((x) =>
                                    x.id === t.id
                                      ? { ...x, customIconUrl: url }
                                      : x
                                  )
                                );
                                showToast(`Updated icon for ${t.name}.`);
                              } catch {
                                showToast('Failed to upload territory icon.');
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            onSaveTerritories(
                              territories.filter((x) => x.id !== t.id)
                            )
                          }
                          className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-300 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {terAdminSub === 'questions' && activeTer && (
              <div className="grid gap-6 lg:grid-cols-12">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!qPrompt.trim()) return;
                    const newQ: TerritoryQuestion = {
                      id: `tq-${Date.now()}`,
                      question: qPrompt.trim(),
                      options: [
                        qOpt0 || 'Option A',
                        qOpt1 || 'Option B',
                        qOpt2 || 'Option C',
                        qOpt3 || 'Option D',
                      ],
                      correctIndex: Number(qCorrect) || 0,
                    };
                    onSaveTerritories(
                      territories.map((t) =>
                        t.id === activeTer.id
                          ? { ...t, questions: [...t.questions, newQ] }
                          : t
                      )
                    );
                    setQPrompt('');
                    setQOpt0('');
                    setQOpt1('');
                    setQOpt2('');
                    setQOpt3('');
                    showToast('Question added to territory.');
                  }}
                  className="space-y-3 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-5"
                >
                  <select
                    value={activeTer.id}
                    onChange={(e) => setSelectedTerId(e.target.value)}
                    className="w-full rounded-xl border border-[#d4af37]/40 bg-[#16140f] px-3 py-2 text-sm text-[#fde68a]"
                  >
                    {territories.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.questions.length} Qs)
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    value={qPrompt}
                    onChange={(e) => setQPrompt(e.target.value)}
                    placeholder="Question text..."
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                  />
                  <input
                    value={qOpt0}
                    onChange={(e) => setQOpt0(e.target.value)}
                    placeholder="Option A"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    value={qOpt1}
                    onChange={(e) => setQOpt1(e.target.value)}
                    placeholder="Option B"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    value={qOpt2}
                    onChange={(e) => setQOpt2(e.target.value)}
                    placeholder="Option C"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    value={qOpt3}
                    onChange={(e) => setQOpt3(e.target.value)}
                    placeholder="Option D"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <select
                    value={qCorrect}
                    onChange={(e) => setQCorrect(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  >
                    <option value="0">Correct: Option A</option>
                    <option value="1">Correct: Option B</option>
                    <option value="2">Correct: Option C</option>
                    <option value="3">Correct: Option D</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#08080a] cursor-pointer"
                  >
                    Add Question
                  </button>
                </form>

                <div className="space-y-2.5 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-7">
                  <h3 className="font-display text-lg font-bold text-[#f8e6a0]">
                    Questions in {activeTer.name}
                  </h3>
                  <div className="max-h-[420px] space-y-2 overflow-y-auto">
                    {activeTer.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="flex items-start justify-between gap-2 rounded-xl bg-[#16140f] p-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {idx + 1}. {q.question}
                          </p>
                          <p className="mt-1 text-emerald-300">
                            Ans: {q.options[q.correctIndex]}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onSaveTerritories(
                              territories.map((t) =>
                                t.id === activeTer.id
                                  ? {
                                      ...t,
                                      questions: t.questions.filter(
                                        (x) => x.id !== q.id
                                      ),
                                    }
                                  : t
                              )
                            )
                          }
                          className="text-red-300 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {terAdminSub === 'cooldowns' && (
              <div className="space-y-4 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6">
                <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                  Reset Ownership & Per-Territory Student Cooldowns
                </h2>
                {territories.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-white/10 bg-[#16140f] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-base font-bold text-white">
                          {t.name} ({t.code})
                        </p>
                        <p className="text-xs text-neutral-400">
                          Holder: {t.currentHolderName || 'Unclaimed'} · Score:{' '}
                          {t.highestScore}/{t.questions.length}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSaveTerritories(
                            territories.map((x) =>
                              x.id === t.id
                                ? {
                                    ...x,
                                    currentHolderUserId: null,
                                    currentHolderName: null,
                                    highestScore: 0,
                                    wonOn: null,
                                  }
                                : x
                            )
                          );
                          showToast(`Reset ownership for ${t.name}.`);
                        }}
                        className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs text-red-200 cursor-pointer"
                      >
                        Reset Ownership
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {users.map((u) => {
                        const locked = t.attemptedUserIds.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            disabled={!locked}
                            onClick={() => {
                              onSaveTerritories(
                                territories.map((x) =>
                                  x.id === t.id
                                    ? {
                                        ...x,
                                        attemptedUserIds:
                                          x.attemptedUserIds.filter(
                                            (id) => id !== u.id
                                          ),
                                      }
                                    : x
                                )
                              );
                              showToast(
                                `Reset ${u.fullName}'s cooldown for ${t.name}.`
                              );
                            }}
                            className={`rounded-lg px-2.5 py-1 text-xs cursor-pointer ${
                              locked
                                ? 'border border-[#d4af37]/50 bg-[#d4af37]/15 text-[#fde68a]'
                                : 'border border-white/10 text-neutral-500 cursor-default'
                            }`}
                          >
                            {u.fullName}:{' '}
                            {locked ? 'Reset Cooldown' : 'Attempt Available'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= 5. NEWSPAPER ADMIN ================= */}
        {adminTab === 'newspaper' && (
          <div className="mt-7 space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const changed =
                  newspaper.headline.trim() !== newsForm.headline.trim() ||
                  newspaper.volumeLabel.trim() !== newsForm.volumeLabel.trim() ||
                  newspaper.leadBody.trim() !== newsForm.leadBody.trim();
                if (changed) {
                  const snapshot: ArchivedNewspaperEdition = {
                    ...newspaper,
                    id: `news-arc-${Date.now()}`,
                    archivedAt: Date.now(),
                  };
                  const duplicate = newspaperArchive.some(
                    (a) =>
                      a.volumeLabel === snapshot.volumeLabel &&
                      a.headline === snapshot.headline
                  );
                  if (!duplicate) {
                    onSaveNewspaperArchive([snapshot, ...newspaperArchive]);
                  }
                }
                newsDirtyRef.current = false;
                onSaveNewspaper(newsForm);
                showToast(
                  changed
                    ? 'Previous edition archived & new edition published.'
                    : 'Newspaper edition updated.'
                );
              }}
              className="grid gap-6 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:grid-cols-12"
            >
              <div className="space-y-3 lg:col-span-7">
                <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                  The DQR Chronicle Editor
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-neutral-400">
                      Masthead Title
                    </label>
                    <input
                      value={newsForm.masthead}
                      onChange={(e) => {
                        newsDirtyRef.current = true;
                        setNewsForm((p) => ({ ...p, masthead: e.target.value }));
                      }}
                      placeholder="Masthead"
                      className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#f5dc82]">
                      Volume No.
                    </label>
                    <input
                      value={newsForm.volumeLabel}
                      onChange={(e) => {
                        newsDirtyRef.current = true;
                        setNewsForm((p) => ({
                          ...p,
                          volumeLabel: e.target.value,
                        }));
                      }}
                      placeholder="VOL. I · NO. 15"
                      className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#f5dc82]">
                      Edition Date
                    </label>
                    <input
                      value={newsForm.dateLabel}
                      onChange={(e) => {
                        newsDirtyRef.current = true;
                        setNewsForm((p) => ({
                          ...p,
                          dateLabel: e.target.value,
                        }));
                      }}
                      placeholder="SATURDAY, JUNE 2026"
                      className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>
                </div>
                <input
                  value={newsForm.headline}
                  onChange={(e) => {
                    newsDirtyRef.current = true;
                    setNewsForm((p) => ({ ...p, headline: e.target.value }));
                  }}
                  placeholder="Headline"
                  className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                />
                <input
                  value={newsForm.subheadline}
                  onChange={(e) => {
                    newsDirtyRef.current = true;
                    setNewsForm((p) => ({ ...p, subheadline: e.target.value }));
                  }}
                  placeholder="Subheadline"
                  className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={newsForm.leadAuthor}
                    onChange={(e) => {
                      newsDirtyRef.current = true;
                      setNewsForm((p) => ({ ...p, leadAuthor: e.target.value }));
                    }}
                    placeholder="Byline / Author"
                    className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    value={newsForm.sideTitle}
                    onChange={(e) => {
                      newsDirtyRef.current = true;
                      setNewsForm((p) => ({ ...p, sideTitle: e.target.value }));
                    }}
                    placeholder="Sidebar Heading"
                    className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                </div>
                <textarea
                  rows={5}
                  value={newsForm.leadBody}
                  onChange={(e) => {
                    newsDirtyRef.current = true;
                    setNewsForm((p) => ({ ...p, leadBody: e.target.value }));
                  }}
                  placeholder="Main article text..."
                  className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                />
                <textarea
                  rows={4}
                  value={newsForm.sideBody}
                  onChange={(e) => {
                    newsDirtyRef.current = true;
                    setNewsForm((p) => ({ ...p, sideBody: e.target.value }));
                  }}
                  placeholder="Inside This Edition bullet points..."
                  className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="space-y-4 lg:col-span-5">
                <h3 className="font-display text-lg font-bold text-[#f8e6a0]">
                  Newspaper Colors & Photo
                </h3>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-xs">
                    <span>Paper BG:</span>
                    <input
                      type="color"
                      value={newsForm.paperBg}
                      onChange={(e) => {
                        newsDirtyRef.current = true;
                        setNewsForm((p) => ({ ...p, paperBg: e.target.value }));
                      }}
                      className="h-8 w-10 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <span>Ink Color:</span>
                    <input
                      type="color"
                      value={newsForm.inkColor}
                      onChange={(e) => {
                        newsDirtyRef.current = true;
                        setNewsForm((p) => ({ ...p, inkColor: e.target.value }));
                      }}
                      className="h-8 w-10 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <span>Accent:</span>
                    <input
                      type="color"
                      value={newsForm.accentColor}
                      onChange={(e) => {
                        newsDirtyRef.current = true;
                        setNewsForm((p) => ({
                          ...p,
                          accentColor: e.target.value,
                        }));
                      }}
                      className="h-8 w-10 cursor-pointer"
                    />
                  </label>
                </div>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#1a160c] py-2.5 text-xs font-semibold text-[#f5dc82]">
                  <Upload className="h-4 w-4" />
                  <span>Upload Featured Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (!f) return;
                      try {
                        const url = await uploadDqrMedia(f, 'newspaper');
                        newsDirtyRef.current = true;
                        setNewsForm((p) => ({
                          ...p,
                          featuredImageUrl: url,
                        }));
                        showToast('Newspaper photo uploaded.');
                      } catch {
                        showToast('Failed to process newspaper image.');
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <input
                  value={newsForm.quoteText}
                  onChange={(e) => {
                    newsDirtyRef.current = true;
                    setNewsForm((p) => ({ ...p, quoteText: e.target.value }));
                  }}
                  placeholder="Quote Text"
                  className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                />
                <input
                  value={newsForm.quoteAuthor}
                  onChange={(e) => {
                    newsDirtyRef.current = true;
                    setNewsForm((p) => ({ ...p, quoteAuthor: e.target.value }));
                  }}
                  placeholder="Quote Attribution"
                  className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                />

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#d4af37] py-3 text-xs font-bold text-[#08080a] cursor-pointer"
                >
                  Publish Newspaper Edition
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const snapshot: ArchivedNewspaperEdition = {
                      ...newspaper,
                      id: `news-arc-${Date.now()}`,
                      archivedAt: Date.now(),
                    };
                    onSaveNewspaperArchive([snapshot, ...newspaperArchive]);
                    showToast('Current live edition saved to Archive.');
                  }}
                  className="w-full rounded-xl border border-[#d4af37]/40 bg-[#1a160c] py-2.5 text-xs font-semibold text-[#f5dc82] hover:bg-[#d4af37]/15 cursor-pointer"
                >
                  Save Current Snapshot to Archive
                </button>
              </div>
            </form>

            {/* Past Editions Archive List */}
            <div className="rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#f8e6a0]">
                    Past Editions Archive ({newspaperArchive.length})
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Publishing a new headline or volume automatically archives
                    the prior live issue.
                  </p>
                </div>
              </div>

              {newspaperArchive.length === 0 ? (
                <p className="mt-4 text-xs text-neutral-400">
                  No archived newspaper editions yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {newspaperArchive.map((arc) => (
                    <div
                      key={arc.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-[#16140f] p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-mono text-[11px] text-[#f5dc82]">
                          {arc.volumeLabel} · {arc.dateLabel}
                        </p>
                        <p className="mt-1 font-display text-base font-bold text-white">
                          {arc.headline}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const { id: _id, archivedAt: _at, ...editionFields } =
                              arc;
                            newsDirtyRef.current = true;
                            setNewsForm(editionFields);
                            showToast('Archived issue loaded into Editor.');
                          }}
                          className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/15 px-3 py-1.5 text-xs font-semibold text-[#f5dc82] hover:bg-[#d4af37]/25 cursor-pointer"
                        >
                          Load into Editor
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSaveNewspaperArchive(
                              newspaperArchive.filter((x) => x.id !== arc.id)
                            );
                            showToast('Archived issue deleted.');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/35 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= 6. SYSTEM ADMIN ================= */}
        {adminTab === 'system' && (
          <div className="mt-7 space-y-6">
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/15 bg-[#12100c] p-1">
              {(
                [
                  { id: 'inbox', label: 'Communication Inbox' },
                  { id: 'predictions', label: 'Predictions' },
                  { id: 'guidance', label: 'Guidance & Directives' },
                  { id: 'challenges', label: 'Challenges' },
                  {
                    id: 'verifications',
                    label: 'Verification Queue',
                    badge: pendingClaimsCount,
                  },
                  { id: 'verdict', label: 'System Verdict' },
                ] as { id: typeof sysAdminSub; label: string; badge?: number }[]
              ).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSysAdminSub(sub.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    sysAdminSub === sub.id
                      ? 'bg-[#3988FF] text-white'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <span>{sub.label}</span>
                  {typeof sub.badge === 'number' && sub.badge > 0 && (
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${
                        sysAdminSub === sub.id
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-400/20 text-amber-300'
                      }`}
                    >
                      {sub.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* System Communication Inbox */}
            {sysAdminSub === 'inbox' && (
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-2 rounded-2xl border border-[#3988FF]/30 bg-[#100f0c] p-4 lg:col-span-4">
                  <h3 className="font-mono text-xs font-bold text-[#83B9FF] uppercase">
                    User Terminals
                  </h3>
                  {users.map((u) => {
                    const count = systemMessages.filter(
                      (m) => m.userId === u.id && m.sender === 'user' && !m.readByAdmin
                    ).length;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setChatUserId(u.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs cursor-pointer ${
                          chatUserId === u.id
                            ? 'bg-[#3988FF]/20 text-white border border-[#3988FF]/50'
                            : 'bg-[#16140f] text-neutral-300'
                        }`}
                      >
                        <span>{u.fullName}</span>
                        {count > 0 && (
                          <span className="font-mono text-[#3988FF]">
                            {count} new
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-[#3988FF]/30 bg-[#100f0c] p-5 lg:col-span-8">
                  <div className="max-h-72 space-y-2.5 overflow-y-auto">
                    {systemMessages
                      .filter((m) => m.userId === chatUserId)
                      .map((m) => (
                        <div
                          key={m.id}
                          className={`rounded-xl p-3 text-xs ${
                            m.sender === 'system'
                              ? 'bg-[#151D2C] text-[#83B9FF]'
                              : 'bg-[#1e1b33] text-white'
                          }`}
                        >
                          <p className="font-mono text-[10px] opacity-70">
                            {m.sender === 'system' ? 'SYSTEM' : 'USER'}
                          </p>
                          <p className="mt-1 whitespace-pre-line">{m.text}</p>
                        </div>
                      ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!adminReply.trim()) return;
                      onAdminReplyMessage(chatUserId, adminReply.trim());
                      setAdminReply('');
                      showToast('System response transmitted.');
                    }}
                    className="mt-4 flex gap-2"
                  >
                    <input
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      placeholder="Reply as THE SYSTEM..."
                      className="flex-1 rounded-xl border border-[#3988FF]/30 bg-[#090B12] px-3.5 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#3988FF] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Reply</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Predictions */}
            {sysAdminSub === 'predictions' && (
              <div className="grid gap-6 lg:grid-cols-12">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!predTitle.trim()) return;
                    onSavePredictions([
                      {
                        id: `pred-${Date.now()}`,
                        title: predTitle.trim(),
                        category: predCat,
                        preview: predPreview || predFull,
                        fullText: predFull || predPreview,
                        confidence: predConf,
                        publishedAt: new Date().toISOString().slice(0, 10),
                        expiresAt: predExpires || null,
                        targetUserId: predTarget,
                        published: true,
                      },
                      ...predictions,
                    ]);
                    setPredTitle('');
                    setPredPreview('');
                    setPredFull('');
                    showToast('Prediction published.');
                  }}
                  className="space-y-3 rounded-2xl border border-[#3988FF]/30 bg-[#100f0c] p-6 lg:col-span-5"
                >
                  <h3 className="font-display text-lg font-bold text-[#83B9FF]">
                    Create Prediction
                  </h3>
                  <input
                    required
                    value={predTitle}
                    onChange={(e) => setPredTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={predCat}
                      onChange={(e) =>
                        setPredCat(e.target.value as SystemPredictionCategory)
                      }
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    >
                      <option>Rank Projection</option>
                      <option>Leaderboard Forecast</option>
                      <option>Territorial Forecast</option>
                      <option>Performance Prediction</option>
                      <option>Competition Forecast</option>
                      <option>Special Prediction</option>
                    </select>
                    <select
                      value={predConf}
                      onChange={(e) =>
                        setPredConf(e.target.value as ConfidenceLevel)
                      }
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    >
                      <option>LOW CONFIDENCE</option>
                      <option>MODERATE CONFIDENCE</option>
                      <option>HIGH CONFIDENCE</option>
                    </select>
                  </div>
                  <select
                    value={predTarget}
                    onChange={(e) => setPredTarget(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  >
                    <option value="all">Target: Everyone</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                  <input
                    value={predPreview}
                    onChange={(e) => setPredPreview(e.target.value)}
                    placeholder="Short Preview"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <textarea
                    rows={3}
                    value={predFull}
                    onChange={(e) => setPredFull(e.target.value)}
                    placeholder="Full projection text"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="date"
                    value={predExpires}
                    onChange={(e) => setPredExpires(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#3988FF] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    Publish Prediction
                  </button>
                </form>

                <div className="space-y-2.5 rounded-2xl border border-[#3988FF]/30 bg-[#100f0c] p-6 lg:col-span-7">
                  {predictions.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl bg-[#16140f] p-3.5 text-xs"
                    >
                      <div>
                        <p className="font-mono text-[10px] text-[#83B9FF]">
                          {p.category} · {p.confidence}
                        </p>
                        <p className="font-bold text-white">{p.title}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onSavePredictions(
                            predictions.filter((x) => x.id !== p.id)
                          )
                        }
                        className="text-red-300 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guidance & Per-User Directives (Strictly Unique Per User) */}
            {sysAdminSub === 'guidance' && (() => {
              const selectedProfile = systemConfig.perUserGuidance?.[guiTarget] || {
                strategicAdvice: '',
                nextObjective: '',
              };
              const targetUserObj = users.find((u) => u.id === guiTarget);
              const userGuidanceList = guidance.filter(
                (g) => g.targetUserId === guiTarget
              );
              return (
                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-12">
                    <div className="space-y-3 rounded-2xl border border-[#3988FF]/30 bg-[#100f0c] p-6 lg:col-span-6">
                      <h3 className="font-display text-lg font-bold text-[#83B9FF]">
                        Unique Personal Guidance · Per User
                      </h3>
                      <div>
                        <label className="mb-1 block text-[11px] text-neutral-400">
                          Select Challenger (Guidance is strictly unique per user)
                        </label>
                        <select
                          value={guiTarget}
                          onChange={(e) => setGuiTarget(e.target.value)}
                          className="w-full rounded-xl border border-[#3988FF]/40 bg-[#16140f] px-3 py-2 text-xs font-semibold text-[#83B9FF]"
                        >
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.fullName} (@{u.username})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] text-neutral-400">
                          Personal Strategic Advice for {targetUserObj?.fullName}
                        </label>
                        <textarea
                          rows={3}
                          value={guiAdviceDraft}
                          onChange={(e) => setGuiAdviceDraft(e.target.value)}
                          placeholder="Enter unique strategic advice for this user..."
                          className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] text-neutral-400">
                          Personal Next Objective for {targetUserObj?.fullName}
                        </label>
                        <input
                          value={guiObjectiveDraft}
                          onChange={(e) => setGuiObjectiveDraft(e.target.value)}
                          placeholder="Enter personal next objective..."
                          className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="border-t border-white/10 pt-3">
                        <label className="mb-1 block text-[11px] text-neutral-400">
                          System Welcome & Directive Header
                        </label>
                        <select
                          value={systemConfig.welcomeTemplate}
                          onChange={(e) =>
                            onSaveSystemConfig({
                              ...systemConfig,
                              welcomeTemplate: e.target.value,
                            })
                          }
                          className="mb-2 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                        >
                          {systemConfig.welcomeTemplates.map((tpl, i) => (
                            <option key={i} value={tpl}>
                              Template {i + 1}: {tpl.slice(0, 48)}...
                            </option>
                          ))}
                        </select>
                        <textarea
                          rows={2}
                          value={guiDirectiveDraft}
                          onChange={(e) => setGuiDirectiveDraft(e.target.value)}
                          placeholder="Latest System Directive"
                          className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSaveSystemConfig({
                            ...systemConfig,
                            globalAnnouncement: guiDirectiveDraft,
                            perUserGuidance: {
                              ...(systemConfig.perUserGuidance || {}),
                              [guiTarget]: {
                                ...selectedProfile,
                                strategicAdvice: guiAdviceDraft,
                                nextObjective: guiObjectiveDraft,
                              },
                            },
                          });
                          showToast(
                            `Saved guidance & directive for ${targetUserObj?.fullName || 'challenger'}.`
                          );
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3988FF] py-2.5 text-xs font-bold text-white hover:bg-[#5299ff] cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Guidance & Directive</span>
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!guiTitle.trim() || !guiTarget) return;
                        onSaveGuidance([
                          {
                            id: `gui-${Date.now()}`,
                            title: guiTitle.trim(),
                            explanation: guiExplain,
                            recommendedAction: guiAction,
                            priority: guiPriority,
                            category: 'Personal Guidance',
                            targetUserId: guiTarget,
                          },
                          ...guidance,
                        ]);
                        setGuiTitle('');
                        setGuiExplain('');
                        setGuiAction('');
                        showToast(
                          `Added private guidance card for ${targetUserObj?.fullName || 'user'}.`
                        );
                      }}
                      className="space-y-3 rounded-2xl border border-[#3988FF]/30 bg-[#100f0c] p-6 lg:col-span-6"
                    >
                      <h3 className="font-display text-lg font-bold text-[#83B9FF]">
                        Add Guidance Card for {targetUserObj?.fullName}
                      </h3>
                      <input
                        required
                        value={guiTitle}
                        onChange={(e) => setGuiTitle(e.target.value)}
                        placeholder="Guidance Title"
                        className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                      />
                      <input
                        value={guiExplain}
                        onChange={(e) => setGuiExplain(e.target.value)}
                        placeholder="Explanation (why this matters for this challenger)"
                        className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                      />
                      <input
                        value={guiAction}
                        onChange={(e) => setGuiAction(e.target.value)}
                        placeholder="Recommended Action"
                        className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                      />
                      <select
                        value={guiPriority}
                        onChange={(e) =>
                          setGuiPriority(
                            e.target.value as 'HIGH' | 'MEDIUM' | 'LOW'
                          )
                        }
                        className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                      >
                        <option value="HIGH">HIGH Priority</option>
                        <option value="MEDIUM">MEDIUM Priority</option>
                        <option value="LOW">LOW Priority</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-xl bg-[#3988FF] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                      >
                        Assign Private Guidance
                      </button>

                      <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                        <p className="font-mono text-[11px] text-neutral-400 uppercase">
                          Cards for {targetUserObj?.fullName} ({userGuidanceList.length})
                        </p>
                        {userGuidanceList.map((g) => (
                          <div
                            key={g.id}
                            className="flex items-center justify-between rounded-xl bg-[#16140f] p-3 text-xs"
                          >
                            <div>
                              <p className="font-bold text-white">{g.title}</p>
                              <p className="text-neutral-400">
                                {g.priority} · {g.recommendedAction}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onSaveGuidance(
                                  guidance.filter((x) => x.id !== g.id)
                                )
                              }
                              className="text-red-300 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </form>
                  </div>
                </div>
              );
            })()}

            {/* Challenges (Single User OR Global) */}
            {sysAdminSub === 'challenges' && (
              <div className="grid gap-6 lg:grid-cols-12">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!chlTitle.trim()) return;
                    onSaveChallenges([
                      {
                        id: `chl-${Date.now()}`,
                        title: chlTitle.trim(),
                        description: chlDesc,
                        category: chlCat,
                        difficulty: chlDiff,
                        rewardXp: Number(chlReward) || 300,
                        deadline: chlDeadline,
                        requirementText: chlReq,
                        targetUserId: chlTarget,
                        status: 'ACTIVE',
                        progressCurrent: 0,
                        progressTarget: 1,
                        completedByUserIds: [],
                      },
                      ...challenges,
                    ]);
                    setChlTitle('');
                    setChlDesc('');
                    setChlReq('');
                    showToast(
                      chlTarget === 'all'
                        ? 'Global challenge added.'
                        : 'Personal challenge assigned.'
                    );
                  }}
                  className="space-y-3 rounded-2xl border border-[#3988FF]/30 bg-[#100f0c] p-6 lg:col-span-5"
                >
                  <h3 className="font-display text-lg font-bold text-[#83B9FF]">
                    Create System Challenge
                  </h3>
                  <select
                    value={chlTarget}
                    onChange={(e) => setChlTarget(e.target.value)}
                    className="w-full rounded-xl border border-[#3988FF]/40 bg-[#16140f] px-3 py-2 text-xs font-semibold text-[#83B9FF]"
                  >
                    <option value="all">Scope: Global (Everyone)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        Single User: {u.fullName} (@{u.username})
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    value={chlTitle}
                    onChange={(e) => setChlTitle(e.target.value)}
                    placeholder="Challenge Title"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={chlCat}
                      onChange={(e) =>
                        setChlCat(
                          e.target.value as
                            | 'Individual'
                            | 'Competitive'
                            | 'Territorial'
                        )
                      }
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    >
                      <option value="Individual">Individual</option>
                      <option value="Competitive">Competitive</option>
                      <option value="Territorial">Territorial</option>
                    </select>
                    <select
                      value={chlDiff}
                      onChange={(e) =>
                        setChlDiff(
                          e.target.value as
                            | 'D-Rank'
                            | 'B-Rank'
                            | 'A-Rank'
                            | 'S-Rank'
                        )
                      }
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    >
                      <option value="D-Rank">D-Rank</option>
                      <option value="B-Rank">B-Rank</option>
                      <option value="A-Rank">A-Rank</option>
                      <option value="S-Rank">S-Rank</option>
                    </select>
                  </div>
                  <input
                    value={chlDesc}
                    onChange={(e) => setChlDesc(e.target.value)}
                    placeholder="Description"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <input
                    value={chlReq}
                    onChange={(e) => setChlReq(e.target.value)}
                    placeholder="Requirement"
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={chlReward}
                      onChange={(e) => setChlReward(e.target.value)}
                      placeholder="XP Reward"
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                    />
                    <input
                      type="date"
                      value={chlDeadline}
                      onChange={(e) => setChlDeadline(e.target.value)}
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#3988FF] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    Add Challenge
                  </button>
                </form>

                <div className="space-y-2.5 rounded-2xl border border-[#3988FF]/30 bg-[#100f0c] p-6 lg:col-span-7">
                  {challenges.map((c) => {
                    const targetLabel =
                      c.targetUserId === 'all'
                        ? 'GLOBAL'
                        : users.find((u) => u.id === c.targetUserId)?.fullName ||
                          'Single User';
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-xl bg-[#16140f] p-3.5 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{c.title}</p>
                            <span className="rounded bg-[#3988FF]/20 px-2 py-0.5 font-mono text-[10px] text-[#83B9FF]">
                              {targetLabel}
                            </span>
                          </div>
                          <p className="text-neutral-400">
                            {c.category} · {c.difficulty} · +{c.rewardXp} XP · Due{' '}
                            {c.deadline}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onSaveChallenges(
                              challenges.filter((x) => x.id !== c.id)
                            )
                          }
                          className="text-red-300 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Verification Queue (Approve / Reject Challenge XP Claims) */}
            {sysAdminSub === 'verifications' && (() => {
              const pendingClaims = [...challengeClaims]
                .filter((c) => c.status === 'pending')
                .sort((a, b) => b.submittedAt - a.submittedAt);
              const historyClaims = [...challengeClaims]
                .filter((c) => c.status !== 'pending')
                .sort(
                  (a, b) =>
                    (b.reviewedAt || b.submittedAt) -
                    (a.reviewedAt || a.submittedAt)
                );

              return (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-amber-400/35 bg-[#100f0c] p-4">
                      <span className="font-mono text-[10px] text-amber-300 uppercase">
                        Pending Review
                      </span>
                      <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                        {pendingClaims.length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/30 bg-[#100f0c] p-4">
                      <span className="font-mono text-[10px] text-emerald-300 uppercase">
                        Approved Claims
                      </span>
                      <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                        {
                          challengeClaims.filter((c) => c.status === 'approved')
                            .length
                        }
                      </p>
                    </div>
                    <div className="rounded-2xl border border-rose-400/30 bg-[#100f0c] p-4">
                      <span className="font-mono text-[10px] text-rose-300 uppercase">
                        Rejected Claims
                      </span>
                      <p className="mt-1 font-mono text-2xl font-extrabold text-white">
                        {
                          challengeClaims.filter((c) => c.status === 'rejected')
                            .length
                        }
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#3988FF]/30 bg-[#100f0c] p-6">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="h-5 w-5 text-[#83B9FF]" />
                        <div>
                          <h3 className="font-display text-lg font-bold text-[#83B9FF]">
                            Pending Challenge XP Claims
                          </h3>
                          <p className="text-xs text-neutral-400">
                            Verify member completion before releasing Challenge
                            XP rewards.
                          </p>
                        </div>
                      </div>
                    </div>

                    {pendingClaims.length === 0 ? (
                      <div className="py-10 text-center text-xs text-neutral-400">
                        All caught up — no Challenge XP claims awaiting
                        verification.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {pendingClaims.map((cl) => {
                          const member = users.find((u) => u.id === cl.userId);
                          const chl = challenges.find(
                            (c) => c.id === cl.challengeId
                          );
                          const noteVal = claimAdminNotes[cl.id] || '';
                          return (
                            <motion.div
                              key={cl.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-xl border border-amber-400/30 bg-[#16140f] p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-white">
                                      {member?.fullName || 'Unknown Member'}
                                    </span>
                                    {member && (
                                      <span className="font-mono text-[11px] text-neutral-400">
                                        @{member.username} · {member.xp} XP
                                      </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-400/15 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                                      <Clock className="h-3 w-3" />
                                      PENDING
                                    </span>
                                  </div>
                                  <p className="mt-1.5 text-sm font-bold text-[#83B9FF]">
                                    {chl?.title || 'Challenge Removed'}
                                    {chl && (
                                      <span className="ml-2 font-mono text-xs text-emerald-300">
                                        +{chl.rewardXp} XP
                                      </span>
                                    )}
                                  </p>
                                  {chl && (
                                    <p className="mt-0.5 text-[11px] text-neutral-400">
                                      Requirement: {chl.requirementText}
                                    </p>
                                  )}
                                  {cl.note && (
                                    <p className="mt-2 rounded-lg border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-neutral-200">
                                      Member proof: “{cl.note}”
                                    </p>
                                  )}
                                </div>

                                <span className="font-mono text-[10px] text-neutral-400">
                                  {new Date(cl.submittedAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:items-center">
                                <input
                                  type="text"
                                  value={noteVal}
                                  onChange={(e) =>
                                    setClaimAdminNotes((prev) => ({
                                      ...prev,
                                      [cl.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Optional verification note / feedback..."
                                  className="flex-1 rounded-lg border border-white/15 bg-[#0f0e0b] px-3 py-1.5 text-xs text-white"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onReviewChallengeClaim(
                                        cl.id,
                                        'approved',
                                        noteVal
                                      );
                                      setClaimAdminNotes((prev) => {
                                        const next = { ...prev };
                                        delete next[cl.id];
                                        return next;
                                      });
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-[#071310] transition-colors hover:bg-emerald-400 cursor-pointer"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>
                                      Approve &amp; Grant{' '}
                                      {chl ? `+${chl.rewardXp} XP` : 'XP'}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onReviewChallengeClaim(
                                        cl.id,
                                        'rejected',
                                        noteVal
                                      );
                                      setClaimAdminNotes((prev) => {
                                        const next = { ...prev };
                                        delete next[cl.id];
                                        return next;
                                      });
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/25 cursor-pointer"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {historyClaims.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-[#100f0c] p-6">
                      <h4 className="font-mono text-xs font-bold text-neutral-300 uppercase">
                        Recent Verification Log
                      </h4>
                      <div className="mt-3 space-y-2">
                        {historyClaims.slice(0, 15).map((cl) => {
                          const member = users.find((u) => u.id === cl.userId);
                          const chl = challenges.find(
                            (c) => c.id === cl.challengeId
                          );
                          return (
                            <div
                              key={cl.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#16140f] px-3.5 py-2.5 text-xs"
                            >
                              <div>
                                <span className="font-semibold text-white">
                                  {member?.fullName || 'Member'}
                                </span>{' '}
                                <span className="text-neutral-400">·</span>{' '}
                                <span className="text-[#83B9FF]">
                                  {chl?.title || 'Challenge'}
                                </span>
                                {cl.adminNote && (
                                  <span className="ml-2 text-neutral-400">
                                    (“{cl.adminNote}”)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 font-mono text-[11px]">
                                <span
                                  className={
                                    cl.status === 'approved'
                                      ? 'text-emerald-300'
                                      : 'text-rose-300'
                                  }
                                >
                                  {cl.status === 'approved'
                                    ? `APPROVED (+${chl?.rewardXp || 0} XP)`
                                    : 'REJECTED'}
                                </span>
                                <span className="text-neutral-500">
                                  {new Date(
                                    cl.reviewedAt || cl.submittedAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Assign Custom Destiny / System Verdict */}
            {sysAdminSub === 'verdict' && (
              <div className="grid gap-6 lg:grid-cols-12">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const finalDestiny = verdictClass.trim().toUpperCase();
                    if (!finalDestiny) return;
                    const today = new Date().toISOString().slice(0, 10);
                    const existing = verdicts.find(
                      (v) => v.userId === verdictTarget
                    );
                    const updated: VerdictRecord = existing
                      ? {
                          ...existing,
                          classification: finalDestiny,
                          description: verdictDesc || existing.description,
                          performanceCharacteristics:
                            verdictPerf || existing.performanceCharacteristics,
                          strongestAttribute:
                            verdictStrength || existing.strongestAttribute,
                          biggestWeakness:
                            verdictWeakness || existing.biggestWeakness,
                          competitiveTendencies:
                            verdictTendency || existing.competitiveTendencies,
                          assignedDate: today,
                          history: [
                            ...existing.history,
                            {
                              classification: finalDestiny,
                              assignedDate: today,
                            },
                          ],
                        }
                      : {
                          userId: verdictTarget,
                          classification: finalDestiny,
                          description:
                            verdictDesc ||
                            'Assigned by System Administration.',
                          assignedDate: today,
                          status: 'VERIFIED · ACTIVE',
                          performanceCharacteristics:
                            verdictPerf || 'Developing competitive profile.',
                          strongestAttribute: verdictStrength || 'Consistency',
                          biggestWeakness:
                            verdictWeakness || 'Needs broader territorial proof.',
                          competitiveTendencies:
                            verdictTendency || 'Active stage contender.',
                          history: [
                            {
                              classification: finalDestiny,
                              assignedDate: today,
                            },
                          ],
                        };
                    onSaveVerdicts([
                      ...verdicts.filter((v) => v.userId !== verdictTarget),
                      updated,
                    ]);
                    showToast(`Assigned Destiny "${finalDestiny}".`);
                  }}
                  className="space-y-3 rounded-2xl border border-[#3988FF]/30 bg-[#100f0c] p-6 lg:col-span-7"
                >
                  <h3 className="font-display text-lg font-bold text-[#83B9FF]">
                    Assign Custom Destiny / System Verdict
                  </h3>
                  <select
                    value={verdictTarget}
                    onChange={(e) => setVerdictTarget(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>

                  <div>
                    <label className="mb-1 block text-[11px] text-neutral-400">
                      Custom Destiny Title (Type any custom destiny or pick a preset)
                    </label>
                    <div className="flex gap-2">
                      <input
                        required
                        value={verdictClass}
                        onChange={(e) => setVerdictClass(e.target.value)}
                        placeholder="e.g. THE RISING FORCE, THE SOVEREIGN..."
                        className="flex-1 rounded-xl border border-[#3988FF]/40 bg-[#16140f] px-3 py-2 font-mono text-xs font-bold text-white uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const normalized = verdictClass.trim().toUpperCase();
                          if (!normalized) return;
                          const presets = systemConfig.customVerdictPresets || [];
                          if (!presets.includes(normalized)) {
                            onSaveSystemConfig({
                              ...systemConfig,
                              customVerdictPresets: [...presets, normalized],
                            });
                            showToast(`Saved "${normalized}" to Destiny presets.`);
                          }
                        }}
                        className="rounded-xl border border-[#3988FF]/40 px-3 py-2 text-[11px] font-semibold text-[#83B9FF] cursor-pointer"
                      >
                        Save Preset
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(
                      systemConfig.customVerdictPresets || [
                        'THE UNDERDOG',
                        'THE CONTENDER',
                        'THE RISING FORCE',
                        'THE DOMINANT',
                        'THE UNPREDICTABLE',
                      ]
                    ).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setVerdictClass(preset)}
                        className={`rounded-lg border px-2 py-1 font-mono text-[10px] cursor-pointer ${
                          verdictClass.toUpperCase() === preset
                            ? 'border-[#3988FF] bg-[#3988FF]/25 text-white'
                            : 'border-white/15 bg-black/30 text-neutral-300 hover:border-white/30'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={verdictDesc}
                    onChange={(e) => setVerdictDesc(e.target.value)}
                    placeholder="Destiny / identity description..."
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={verdictStrength}
                      onChange={(e) => setVerdictStrength(e.target.value)}
                      placeholder="Strongest Attribute"
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    />
                    <input
                      value={verdictWeakness}
                      onChange={(e) => setVerdictWeakness(e.target.value)}
                      placeholder="Biggest Weakness"
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    />
                    <input
                      value={verdictPerf}
                      onChange={(e) => setVerdictPerf(e.target.value)}
                      placeholder="Performance Characteristics"
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    />
                    <input
                      value={verdictTendency}
                      onChange={(e) => setVerdictTendency(e.target.value)}
                      placeholder="Competitive Tendencies"
                      className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#3988FF] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    Assign System Destiny
                  </button>
                </form>

                <div className="space-y-3 rounded-2xl border border-[#3988FF]/30 bg-[#100f0c] p-6 lg:col-span-5">
                  <h4 className="font-mono text-xs font-bold text-[#83B9FF] uppercase">
                    Current Member Verdicts
                  </h4>
                  <div className="space-y-2.5">
                    {users.map((u) => {
                      const v = verdicts.find((item) => item.userId === u.id);
                      return (
                        <div
                          key={u.id}
                          className="flex items-center justify-between rounded-xl bg-[#16140f] px-3.5 py-2.5 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {u.fullName}
                            </p>
                            <p className="font-mono text-[10px] text-neutral-400">
                              @{u.username}
                            </p>
                          </div>
                          <span className="rounded-lg border border-[#3988FF]/35 bg-[#3988FF]/15 px-2.5 py-1 font-mono text-[10px] font-bold text-[#83B9FF]">
                            {v?.classification || 'UNASSIGNED'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 6B. 1V1 QUESTION MANAGER ================= */}
        {adminTab === 'duel-bank' && (
          <div className="mt-7">
            <AdminDuelQuestionManager
              questions={duelQuestions}
              duelConfig={duelConfig}
              onSaveQuestions={onSaveDuelQuestions}
              onSaveDuelConfig={onSaveDuelConfig}
              onToast={showToast}
            />
          </div>
        )}

        {/* ================= 7. USERS ADMIN ================= */}
        {adminTab === 'users' && (
          <div className="mt-8 grid gap-7 lg:grid-cols-12">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setUserError('');
                if (!/^\d{4,9}$/.test(newPin)) {
                  setUserError('PIN must be 4 to 9 digits.');
                  return;
                }
                const err = onCreateUser({
                  username: newUsername.trim().toLowerCase(),
                  fullName: newFullName.trim(),
                  pin: newPin.trim(),
                  role: newRole,
                  photoUrl: null,
                  bio: 'DQR Challenger.',
                  favouriteTopic: 'General Knowledge',
                  isOnline: false,
                  lastLoggedIn: 'Just created',
                  xp: 500,
                  level: 1,
                  rankId: 'rk-g4',
                  streak: 1,
                  tagline: `${newFullName.trim()}'s Tagline`,
                  announcement: 'Welcome to DQR Ascension Path.',
                  announcementChecked: false,
                  ownedTitleIds: [],
                  equippedTitleId: null,
                  achievementIds: ['ach-1'],
                  equippedAchievementIds: ['ach-1'],
                  reportCard: {
                    imageUrl: null,
                    grade: 'Pending',
                    presentation: 'Pending',
                    totalQuestionsStudied: '0',
                    remarks: 'Initial profile created.',
                    updatedAt: '2082 B.S.',
                  },
                });
                if (err) {
                  setUserError(err);
                  return;
                }
                setNewUsername('');
                setNewFullName('');
                setNewPin('');
                showToast('User created.');
              }}
              className="space-y-3.5 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-5"
            >
              <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                Create Member / Admin
              </h2>
              <input
                required
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3.5 py-2.5 text-sm text-white"
              />
              <input
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Username"
                className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3.5 py-2.5 text-sm text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  maxLength={9}
                  value={newPin}
                  onChange={(e) =>
                    setNewPin(e.target.value.replace(/\D/g, '').slice(0, 9))
                  }
                  placeholder="4–9 Digit PIN"
                  className="rounded-xl border border-white/15 bg-[#16140f] px-3.5 py-2.5 font-mono text-sm text-white"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2.5 text-sm text-white"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {userError && (
                <p className="text-xs text-red-300">{userError}</p>
              )}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] py-2.5 text-xs font-bold text-[#08080a] cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create User</span>
              </button>
            </form>

            <div className="space-y-3 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-6 lg:col-span-7">
              <h2 className="font-display text-xl font-bold text-[#f8e6a0]">
                All Accounts ({users.length})
              </h2>
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#16140f] p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-bold text-white">
                        {u.fullName}
                      </span>
                      <span className="font-mono text-xs text-[#d4af37]">
                        @{u.username}
                      </span>
                      {u.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#d4af37]/20 px-2 py-0.5 text-[10px] font-bold text-[#fde68a]">
                          <Shield className="h-3 w-3" /> ADMIN
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-xs text-neutral-400">
                      PIN: {u.pin} · Type: {u.role}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextPin = String(
                          Math.floor(100000 + Math.random() * 899999)
                        );
                        onUpdateUserAny(u.id, { pin: nextPin });
                        showToast(`Updated PIN for ${u.username} to ${nextPin}.`);
                      }}
                      className="rounded-lg border border-[#d4af37]/30 px-2.5 py-1 text-xs text-[#f5dc82] cursor-pointer"
                    >
                      New PIN
                    </button>
                    {u.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteUser(u.id);
                          showToast(`Deleted ${u.username}.`);
                        }}
                        className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-300 cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
