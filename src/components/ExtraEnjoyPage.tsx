import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Heart,
  HelpCircle,
  Maximize2,
  MessageSquare,
  Minimize2,
  Moon,
  Music,
  Pin,
  PinOff,
  Play,
  Pause,
  Quote,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Star,
  Trash2,
  Trees,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';
import {
  AnonQuestionCategory,
  AnonymousQuestion,
  DailyUserQuote,
  UserQuoteReactionKey,
  UserQuoteTag,
} from '../types';
import {
  ALL_CALM_QUOTES,
  CALM_MOODS,
  CALM_QUOTES_BY_MOOD,
  CalmMoodId,
} from '../data/calmQuotes';
import {
  NATURE_LOOP_SECONDS,
  NatureCanvasStage,
  NatureSceneId,
} from './NatureCanvasStage';
import { SilenceRoomSection } from './SilenceRoomSection';
import { CalmAudioEngine } from '../utils/calmAudio';

export type ExtraEnjoySubTab =
  | 'question-form'
  | 'calm-sanctuary'
  | 'silence-room'
  | 'user-quotes';

interface ExtraEnjoyPageProps {
  questions: AnonymousQuestion[];
  userQuotes: DailyUserQuote[];
  isAdmin: boolean;
  currentUserId: string;
  initialSubTab?: ExtraEnjoySubTab;
  onAskQuestion: (question: string, category: AnonQuestionCategory) => void;
  onReplyQuestion: (id: string, reply: string) => void;
  onTogglePinQuestion: (id: string) => void;
  onDeleteQuestion: (id: string) => void;
  onToggleUpvoteQuestion: (id: string, delta: 1 | -1) => void;
  onSubmitUserQuote: (text: string, tag?: UserQuoteTag) => void;
  onVerifyUserQuote: (
    id: string,
    decision: 'approved' | 'rejected',
    featureToday?: boolean
  ) => void;
  onToggleFeatureUserQuote: (id: string) => void;
  onDeleteUserQuote: (id: string) => void;
  onReactUserQuote: (id: string, key: UserQuoteReactionKey) => void;
}

const QUESTION_CATEGORIES: AnonQuestionCategory[] = [
  'General',
  'Quiz Prep',
  'Study Tips',
  'Exam Stress',
  'Club Suggestion',
  'Personal / Advice',
];

const QUOTE_TAGS: UserQuoteTag[] = [
  'Study Wisdom',
  'Exam Mindset',
  'Resilience',
  'Life Lesson',
  'General',
];

const QUOTE_REACTIONS: {
  key: UserQuoteReactionKey;
  label: string;
  emoji: string;
}[] = [
  { key: 'needed', label: 'Needed this', emoji: '🤍' },
  { key: 'inspiring', label: 'Inspiring', emoji: '✨' },
  { key: 'wise', label: 'Wise', emoji: '🦉' },
];

const UPVOTE_STORAGE_KEY = 'dqr_v2_anon_upvoted_ids';

function loadVotedIds(): string[] {
  try {
    const raw = localStorage.getItem(UPVOTE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function formatClockTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDateLabel(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

const SCENE_OPTIONS: {
  id: NatureSceneId;
  label: string;
  badge: string;
  swatch: string;
}[] = [
  {
    id: 'mountain-river',
    label: 'Mountain River',
    badge: 'Flowing Stream',
    swatch: 'from-sky-400 to-emerald-400',
  },
  {
    id: 'sunset-lake',
    label: 'Sunset Lake',
    badge: 'Golden Dusk',
    swatch: 'from-amber-400 to-rose-400',
  },
  {
    id: 'rainy-pine',
    label: 'Night Rain',
    badge: 'Forest & Fireflies',
    swatch: 'from-slate-400 to-cyan-400',
  },
  {
    id: 'aurora-peaks',
    label: 'Northern Lights',
    badge: 'Aurora & Fjords',
    swatch: 'from-emerald-400 to-violet-400',
  },
  {
    id: 'sakura-breeze',
    label: 'Sakura River',
    badge: 'Drifting Petals',
    swatch: 'from-rose-300 to-amber-200',
  },
  {
    id: 'starlit-meadow',
    label: 'Midnight Cosmos',
    badge: 'Milky Way & Stars',
    swatch: 'from-indigo-400 to-amber-300',
  },
  {
    id: 'ocean-moonrise',
    label: 'Moonlit Ocean',
    badge: 'Gentle Tide',
    swatch: 'from-blue-300 to-slate-400',
  },
  {
    id: 'golden-wheat',
    label: 'Golden Wheat',
    badge: 'Amber Sunset Plains',
    swatch: 'from-amber-300 to-orange-500',
  },
  {
    id: 'bamboo-rain',
    label: 'Bamboo Mist',
    badge: 'Emerald Forest Rain',
    swatch: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'bioluminescent-cove',
    label: 'Bioluminescent Cove',
    badge: 'Glowing Night Tide',
    swatch: 'from-cyan-300 to-blue-600',
  },
];

const CATEGORY_META: Record<
  AnonQuestionCategory,
  { emoji: string; pillClass: string }
> = {
  General: {
    emoji: '✨',
    pillClass: 'border-[#d4af37]/35 bg-[#d4af37]/12 text-[#f8e6a0]',
  },
  'Quiz Prep': {
    emoji: '📚',
    pillClass: 'border-sky-400/35 bg-sky-500/12 text-sky-200',
  },
  'Study Tips': {
    emoji: '🧠',
    pillClass: 'border-amber-400/35 bg-amber-500/12 text-amber-200',
  },
  'Exam Stress': {
    emoji: '🌿',
    pillClass: 'border-teal-400/35 bg-teal-500/12 text-teal-200',
  },
  'Club Suggestion': {
    emoji: '💡',
    pillClass: 'border-emerald-400/35 bg-emerald-500/12 text-emerald-200',
  },
  'Personal / Advice': {
    emoji: '💬',
    pillClass: 'border-violet-400/35 bg-violet-500/12 text-violet-200',
  },
};

const LEARNING_PROMPTS = [
  'Staying calm for two extra seconds before buzzing...',
  'One topic I struggled with finally clicked today when...',
  'Consistency in 15-minute daily blocks feels easier than...',
];

export function ExtraEnjoyPage({
  questions,
  userQuotes,
  isAdmin,
  currentUserId,
  initialSubTab = 'question-form',
  onAskQuestion,
  onReplyQuestion,
  onTogglePinQuestion,
  onDeleteQuestion,
  onToggleUpvoteQuestion,
  onSubmitUserQuote,
  onVerifyUserQuote,
  onToggleFeatureUserQuote,
  onDeleteUserQuote,
  onReactUserQuote,
}: ExtraEnjoyPageProps) {
  const [subTab, setSubTab] = useState<ExtraEnjoySubTab>(initialSubTab);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // ================= 1. QUESTION FORM STATE =================
  const [questionSubTab, setQuestionSubTab] = useState<'ask' | 'answers'>(
    'answers'
  );
  const [questionDraft, setQuestionDraft] = useState('');
  const [categoryDraft, setCategoryDraft] =
    useState<AnonQuestionCategory>('General');
  const [justSubmitted, setJustSubmitted] = useState(false);

  const [statusFilter, setStatusFilter] = useState<
    'all' | 'answered' | 'waiting'
  >('all');
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | AnonQuestionCategory
  >('all');
  const [questionSort, setQuestionSort] = useState<'newest' | 'most-upvoted'>(
    'newest'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [votedIds, setVotedIds] = useState<string[]>(() => loadVotedIds());

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);

  // ================= 2. CALM SANCTUARY STATE =================
  const sanctuaryStageRef = useRef<HTMLDivElement | null>(null);
  const [scene, setScene] = useState<NatureSceneId>('mountain-river');
  const [loopSecond, setLoopSecond] = useState(0);
  const [selectedMood, setSelectedMood] = useState<'all' | CalmMoodId>(
    'long-day'
  );
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [autoCycle, setAutoCycle] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [breathingSec, setBreathingSec] = useState(0);

  // Sanctuary Settings & Fullscreen
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hideControls, setHideControls] = useState(false);
  const [showQuotes, setShowQuotes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(true); // Full-screen experience default on Sanctuary open, toggleable anytime!

  const [windOn, setWindOn] = useState(false);
  const [windVol, setWindVol] = useState(0.45);
  const [songOn, setSongOn] = useState(false);
  const [songVol, setSongVol] = useState(0.42);
  const audioEngineRef = useRef<CalmAudioEngine | null>(null);

  // ================= 3. USER QUOTES ("What are you learning?") STATE =================
  const [quoteSubTab, setQuoteSubTab] = useState<'share' | 'gallery'>(
    'gallery'
  );
  const [userQuoteDraft, setUserQuoteDraft] = useState('');
  const [quoteTagDraft, setQuoteTagDraft] =
    useState<UserQuoteTag>('Study Wisdom');
  const [quoteTagFilter, setQuoteTagFilter] = useState<'all' | UserQuoteTag>(
    'all'
  );
  const [quoteSubmittedBanner, setQuoteSubmittedBanner] = useState(false);

  useEffect(() => {
    return () => {
      audioEngineRef.current?.dispose();
      audioEngineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (subTab !== 'calm-sanctuary') {
      if (windOn) setWindOn(false);
      if (songOn) setSongOn(false);
      audioEngineRef.current?.setWind(false, windVol);
      audioEngineRef.current?.setSong(false, songVol);
    }
  }, [subTab, windOn, songOn, windVol, songVol]);

  // Escape exits fullscreen cleanly
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && subTab === 'calm-sanctuary') {
        setIsFullscreen(false);
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen, subTab]);

  const getAudioEngine = () => {
    if (!audioEngineRef.current) {
      audioEngineRef.current = new CalmAudioEngine();
    }
    return audioEngineRef.current;
  };

  const handleToggleWind = () => {
    const next = !windOn;
    setWindOn(next);
    getAudioEngine().setWind(next, windVol);
  };

  const handleToggleSong = () => {
    const next = !songOn;
    setSongOn(next);
    getAudioEngine().setSong(next, songVol);
  };

  const handleToggleBrowserFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    if (next && sanctuaryStageRef.current?.requestFullscreen) {
      void sanctuaryStageRef.current.requestFullscreen().catch(() => {});
    } else if (!next && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
  };

  // Active mood quotes pool
  const activeQuotes = useMemo(() => {
    if (selectedMood === 'all') {
      return ALL_CALM_QUOTES;
    }
    return CALM_QUOTES_BY_MOOD[selectedMood].map((text) => ({
      mood: selectedMood,
      text,
    }));
  }, [selectedMood]);

  const safeQuoteIndex =
    activeQuotes.length > 0 ? quoteIndex % activeQuotes.length : 0;
  const currentQuote = activeQuotes[safeQuoteIndex] || activeQuotes[0];

  useEffect(() => {
    if (!autoCycle || subTab !== 'calm-sanctuary' || activeQuotes.length <= 1) {
      return;
    }
    const id = window.setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % activeQuotes.length);
    }, 12000);
    return () => window.clearInterval(id);
  }, [autoCycle, subTab, activeQuotes.length]);

  useEffect(() => {
    if (!breathingOpen || subTab !== 'calm-sanctuary') return;
    setBreathingSec(0);
    const id = window.setInterval(() => {
      setBreathingSec((s) => (s + 1) % 19);
    }, 1000);
    return () => window.clearInterval(id);
  }, [breathingOpen, subTab]);

  const breathingPhase = useMemo(() => {
    if (breathingSec < 4) {
      return {
        label: 'Inhale Gently',
        count: 4 - breathingSec,
        scale: 1.24,
        ringClass: 'border-emerald-300/80 bg-emerald-400/20 text-emerald-100',
      };
    }
    if (breathingSec < 11) {
      return {
        label: 'Hold Softly',
        count: 11 - breathingSec,
        scale: 1.24,
        ringClass: 'border-[#f5dc82]/80 bg-[#d4af37]/20 text-[#f8e6a0]',
      };
    }
    return {
      label: 'Exhale Slowly',
      count: 19 - breathingSec,
      scale: 0.92,
      ringClass: 'border-sky-300/75 bg-sky-400/15 text-sky-100',
    };
  }, [breathingSec]);

  const filteredQuestions = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();
    return [...questions]
      .filter((item) => {
        if (statusFilter === 'answered' && !item.adminReply) return false;
        if (statusFilter === 'waiting' && item.adminReply) return false;
        if (categoryFilter !== 'all' && item.category !== categoryFilter) {
          return false;
        }
        if (qLower) {
          const matchesQ = item.question.toLowerCase().includes(qLower);
          const matchesA = (item.adminReply || '').toLowerCase().includes(qLower);
          if (!matchesQ && !matchesA) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (questionSort === 'most-upvoted' && b.upvotes !== a.upvotes) {
          return b.upvotes - a.upvotes;
        }
        return b.createdAt - a.createdAt;
      });
  }, [questions, statusFilter, categoryFilter, questionSort, searchQuery]);

  const answeredCount = questions.filter((q) => Boolean(q.adminReply)).length;
  const waitingCount = questions.length - answeredCount;

  const approvedUserQuotes = useMemo(
    () =>
      userQuotes
        .filter((q) => q.status === 'approved')
        .sort(
          (a, b) =>
            Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
            b.createdAt - a.createdAt
        ),
    [userQuotes]
  );

  const pendingUserQuotes = useMemo(
    () =>
      userQuotes
        .filter((q) => q.status === 'pending')
        .sort((a, b) => b.createdAt - a.createdAt),
    [userQuotes]
  );

  const handleSubmitAnonQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = questionDraft.trim();
    if (!cleaned) return;
    onAskQuestion(cleaned, categoryDraft);
    setQuestionDraft('');
    setJustSubmitted(true);
    window.setTimeout(() => setJustSubmitted(false), 3200);
  };

  const handleSubmitLearningQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = userQuoteDraft.trim();
    if (!cleaned) return;
    onSubmitUserQuote(cleaned, quoteTagDraft);
    setUserQuoteDraft('');
    setQuoteSubmittedBanner(true);
    window.setTimeout(() => setQuoteSubmittedBanner(false), 4000);
  };

  const handleToggleVote = (id: string) => {
    const alreadyVoted = votedIds.includes(id);
    const next = alreadyVoted
      ? votedIds.filter((x) => x !== id)
      : [...votedIds, id];
    setVotedIds(next);
    try {
      localStorage.setItem(UPVOTE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota issues
    }
    onToggleUpvoteQuestion(id, alreadyVoted ? -1 : 1);
  };

  return (
    <div className="min-h-screen bg-[#08080a] pb-20 text-[#f5f2eb]">
      {/* TOP BANNER & SUB-TAB BAR */}
      <section className="border-b border-[#d4af37]/20 bg-gradient-to-b from-[#13110b] to-[#08080a] px-4 pb-8 pt-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.2em] text-[#d4af37] uppercase">
                DQR Space &amp; Sanctuary
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold text-[#f8e6a0] sm:text-4xl">
                Community
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-neutral-300">
                Ask Admin anonymously, unwind in the fullscreen Calm Sanctuary,
                sit quietly in a Shared Silence Room, or share anonymous wisdom
                on what you&apos;re learning.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 rounded-2xl border border-[#d4af37]/35 bg-[#11100c] p-1.5 shadow-lg">
              <button
                type="button"
                onClick={() => setSubTab('question-form')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'question-form'
                    ? 'bg-gradient-to-r from-[#c79a26] to-[#f0cb65] text-[#08080a] shadow-md'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Question Form</span>
                {questions.length > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                      subTab === 'question-form'
                        ? 'bg-black/20 text-[#08080a]'
                        : 'bg-[#d4af37]/20 text-[#f8e6a0]'
                    }`}
                  >
                    {questions.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubTab('calm-sanctuary');
                  setIsFullscreen(true);
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'calm-sanctuary'
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-[#061310] shadow-md'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Trees className="h-3.5 w-3.5" />
                <span>Calm Sanctuary</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('silence-room')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'silence-room'
                    ? 'bg-gradient-to-r from-sky-400 to-indigo-300 text-[#06101b] shadow-md'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Silence Room</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('user-quotes')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'user-quotes'
                    ? 'bg-gradient-to-r from-amber-300 to-[#f8e6a0] text-[#140e04] shadow-md'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Quote className="h-3.5 w-3.5" />
                <span>User Quotes</span>
                {isAdmin && pendingUserQuotes.length > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                    {pendingUserQuotes.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-8">
        <AnimatePresence mode="wait">
          {/* ================= 1. QUESTION FORM SUB-TAB ================= */}
          {subTab === 'question-form' && (
            <motion.div
              key="question-form"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto max-w-4xl space-y-7"
            >
              {/* Clean Obsidian & Gold Header + 2 Sub-Tabs */}
              <div className="flex flex-col justify-between gap-5 border-b border-[#d4af37]/20 pb-6 sm:flex-row sm:items-end">
                <div>
                  <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#d4af37] uppercase">
                    Anonymous Desk · Open Answers
                  </p>
                  <h2 className="mt-1.5 font-display text-2xl font-bold text-[#fcf9f2] sm:text-3xl">
                    Question Form
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400 sm:text-sm">
                    Ask freely with zero identity attached. Public answers from
                    Admin appear in the Answers board.
                  </p>
                </div>

                <div className="flex shrink-0 gap-2 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-1.5">
                  <button
                    type="button"
                    onClick={() => setQuestionSubTab('ask')}
                    className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer ${
                      questionSubTab === 'ask'
                        ? 'bg-[#d4af37] text-[#08080a] shadow-sm'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Ask a Question
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionSubTab('answers')}
                    className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all tabular-nums cursor-pointer ${
                      questionSubTab === 'answers'
                        ? 'bg-[#d4af37] text-[#08080a] shadow-sm'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Question Answers ({questions.length})
                  </button>
                </div>
              </div>

              {questionSubTab === 'ask' ? (
                <div className="mx-auto max-w-2xl rounded-3xl border border-[#d4af37]/30 bg-[#100f0c] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-8">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="font-display text-xl font-bold text-[#f8e6a0]">
                        Submit Anonymous Question
                      </h3>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        Your name and profile are never saved with this post.
                      </p>
                    </div>
                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
                  </div>

                  <form
                    onSubmit={handleSubmitAnonQuestion}
                    className="mt-6 space-y-6"
                  >
                    <div>
                      <label className="mb-2.5 block font-mono text-[11px] font-bold tracking-widest text-[#d4af37] uppercase">
                        Select Topic
                      </label>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {QUESTION_CATEGORIES.map((cat) => {
                          const meta = CATEGORY_META[cat];
                          const active = categoryDraft === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategoryDraft(cat)}
                              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                active
                                  ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#f8e6a0]'
                                  : 'border-white/10 bg-[#08080a] text-neutral-300 hover:border-white/25 hover:text-white'
                              }`}
                            >
                              <span>{meta.emoji}</span>
                              <span className="truncate">{cat}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="anon-question-input"
                        className="mb-2 block font-mono text-[11px] font-bold tracking-widest text-[#d4af37] uppercase"
                      >
                        Your Question
                      </label>
                      <textarea
                        id="anon-question-input"
                        rows={5}
                        maxLength={600}
                        value={questionDraft}
                        onChange={(e) => setQuestionDraft(e.target.value)}
                        placeholder="Ask about quiz rules, preparation advice, club ideas, or anything on your mind..."
                        className="w-full resize-none rounded-2xl border border-white/12 bg-[#08080a] p-4 text-sm leading-relaxed text-white placeholder:text-neutral-500 transition-colors focus:border-[#d4af37] focus:outline-none"
                      />
                      <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-neutral-500 tabular-nums">
                        <span>Anonymous submission</span>
                        <span>{questionDraft.length} / 600</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="submit"
                        disabled={questionDraft.trim().length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c79a26] to-[#f0cb65] px-6 py-3 text-sm font-bold text-[#08080a] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                        <span>Post Anonymously</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQuestionSubTab('answers')}
                        className="font-mono text-xs text-neutral-400 underline-offset-4 hover:text-[#f8e6a0] hover:underline cursor-pointer"
                      >
                        Browse {questions.length} community Q&amp;As →
                      </button>
                    </div>

                    {justSubmitted && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          Posted anonymously! Everyone can see it on the Answers tab.
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuestionSubTab('answers')}
                          className="shrink-0 font-mono font-bold text-emerald-100 underline cursor-pointer"
                        >
                          View
                        </button>
                      </motion.div>
                    )}
                  </form>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Spacious Filter & Tag Bar */}
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-[#100f0c] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            { id: 'all', label: `All (${questions.length})` },
                            {
                              id: 'answered',
                              label: `Answered (${answeredCount})`,
                            },
                            { id: 'waiting', label: `Waiting (${waitingCount})` },
                          ] as const
                        ).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setStatusFilter(tab.id)}
                            className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-all tabular-nums cursor-pointer ${
                              statusFilter === tab.id
                                ? 'bg-[#d4af37] text-[#08080a]'
                                : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
                        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Q&As..."
                            className="w-full rounded-xl border border-white/10 bg-[#08080a] py-2 pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 focus:border-[#d4af37] focus:outline-none"
                          />
                        </div>

                        <select
                          aria-label="Sort questions"
                          value={questionSort}
                          onChange={(e) =>
                            setQuestionSort(
                              e.target.value as 'newest' | 'most-upvoted'
                            )
                          }
                          className="rounded-xl border border-white/10 bg-[#08080a] px-3 py-2 text-xs font-semibold text-neutral-200 focus:border-[#d4af37] focus:outline-none cursor-pointer"
                        >
                          <option value="newest">Newest First</option>
                          <option value="most-upvoted">Most Upvoted</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => setCategoryFilter('all')}
                        className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                          categoryFilter === 'all'
                            ? 'bg-white/15 text-[#f8e6a0]'
                            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        All Topics
                      </button>
                      {QUESTION_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategoryFilter(cat)}
                          className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                            categoryFilter === cat
                              ? 'bg-[#d4af37]/25 text-[#f8e6a0]'
                              : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {CATEGORY_META[cat].emoji} {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredQuestions.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/15 bg-[#100f0c] p-14 text-center">
                      <MessageSquare className="mx-auto h-9 w-9 text-[#d4af37]/60" />
                      <p className="mt-3 font-display text-lg font-semibold text-white">
                        {questions.length === 0
                          ? 'No anonymous questions yet'
                          : 'No matching questions'}
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {questions.length === 0
                          ? 'Switch to Ask a Question to start the conversation.'
                          : 'Try clearing your search or topic filter.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredQuestions.map((item) => {
                        const hasVoted = votedIds.includes(item.id);
                        const isEditingReply = editingReplyId === item.id;
                        const currentDraft =
                          replyDrafts[item.id] ?? item.adminReply ?? '';
                        const catMeta = CATEGORY_META[item.category];

                        return (
                          <motion.article
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-3xl border p-6 transition-colors sm:p-7 ${
                              item.pinned
                                ? 'border-[#d4af37]/50 bg-[#15120b]'
                                : 'border-white/10 bg-[#100f0c] hover:border-white/20'
                            }`}
                          >
                            {/* Clean Single Metadata Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                              <div className="flex flex-wrap items-center gap-2 text-neutral-400">
                                {item.pinned && (
                                  <span className="inline-flex items-center gap-1 font-bold text-[#f8e6a0] uppercase">
                                    <Pin className="h-3 w-3" />
                                    Pinned ·
                                  </span>
                                )}
                                <span className="text-[#f8e6a0]">
                                  {catMeta.emoji} {item.category}
                                </span>
                                <span>·</span>
                                <span>Anonymous</span>
                                <span>·</span>
                                <span>{formatDateLabel(item.createdAt)}</span>
                              </div>

                              <span
                                className={`font-semibold uppercase ${
                                  item.adminReply
                                    ? 'text-emerald-300'
                                    : 'text-amber-300'
                                }`}
                              >
                                {item.adminReply ? 'Answered' : 'Awaiting Reply'}
                              </span>
                            </div>

                            {/* Question */}
                            <p className="mt-4 whitespace-pre-wrap font-display text-xl leading-relaxed font-medium text-[#fcf9f2]">
                              {item.question}
                            </p>

                            {/* Admin Answer Box (Full Border, No Thick Left Stripe) */}
                            {item.adminReply && !isEditingReply && (
                              <div className="mt-5 rounded-2xl border border-[#d4af37]/30 bg-[#08080a] p-5">
                                <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                                  <span className="inline-flex items-center gap-1.5 font-bold tracking-wider text-[#d4af37] uppercase">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Admin Answer
                                  </span>
                                  {item.repliedAt && (
                                    <span className="text-neutral-500">
                                      {formatDateLabel(item.repliedAt)}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-[#f2ece0]">
                                  {item.adminReply}
                                </p>
                              </div>
                            )}

                            {/* Admin Inline Composer */}
                            {isAdmin && (isEditingReply || !item.adminReply) && (
                              <div className="mt-5 rounded-2xl border border-[#d4af37]/25 bg-[#08080a] p-4">
                                <label className="mb-2 block font-mono text-[10px] font-bold tracking-wider text-[#d4af37] uppercase">
                                  {item.adminReply
                                    ? 'Edit Admin Reply'
                                    : 'Write Public Admin Reply'}
                                </label>
                                <textarea
                                  rows={2}
                                  value={currentDraft}
                                  onChange={(e) =>
                                    setReplyDrafts((prev) => ({
                                      ...prev,
                                      [item.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Write your answer visible to everyone..."
                                  className="w-full resize-none rounded-xl border border-white/10 bg-[#100f0c] p-3 text-xs text-white placeholder:text-neutral-500 focus:border-[#d4af37] focus:outline-none"
                                />
                                <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
                                  {isEditingReply && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingReplyId(null)}
                                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-white/10 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={!currentDraft.trim()}
                                    onClick={() => {
                                      onReplyQuestion(
                                        item.id,
                                        currentDraft.trim()
                                      );
                                      setEditingReplyId(null);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#d4af37] px-3.5 py-1.5 text-xs font-bold text-[#08080a] hover:bg-[#f0cb65] disabled:opacity-40 cursor-pointer"
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                    <span>Publish Answer</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Card Footer */}
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                              <button
                                type="button"
                                onClick={() => handleToggleVote(item.id)}
                                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors tabular-nums cursor-pointer ${
                                  hasVoted
                                    ? 'border-rose-400/45 bg-rose-500/12 text-rose-200'
                                    : 'border-white/10 bg-[#08080a] text-neutral-300 hover:border-white/25 hover:text-white'
                                }`}
                              >
                                <Heart
                                  className={`h-3.5 w-3.5 ${
                                    hasVoted ? 'fill-rose-400 text-rose-400' : ''
                                  }`}
                                />
                                <span>Same here ({item.upvotes})</span>
                              </button>

                              {isAdmin && (
                                <div className="flex flex-wrap items-center gap-2">
                                  {item.adminReply && !isEditingReply && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyDrafts((prev) => ({
                                          ...prev,
                                          [item.id]: item.adminReply || '',
                                        }));
                                        setEditingReplyId(item.id);
                                      }}
                                      className="rounded-lg border border-white/15 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-neutral-200 hover:bg-white/10 cursor-pointer"
                                    >
                                      Edit Answer
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onTogglePinQuestion(item.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#f8e6a0] hover:bg-[#d4af37]/20 cursor-pointer"
                                  >
                                    {item.pinned ? (
                                      <>
                                        <PinOff className="h-3.5 w-3.5" />
                                        <span>Unpin</span>
                                      </>
                                    ) : (
                                      <>
                                        <Pin className="h-3.5 w-3.5" />
                                        <span>Pin</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteQuestion(item.id)}
                                    aria-label="Delete anonymous question"
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-rose-200 hover:bg-rose-500/20 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= 2. CALM SANCTUARY SUB-TAB ================= */}
          {subTab === 'calm-sanctuary' && (
            <motion.div
              key="calm-sanctuary"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Fullscreen / Full-bleed Sanctuary Stage */}
              <div
                ref={sanctuaryStageRef}
                className={
                  isFullscreen
                    ? 'fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-[#07111a]'
                    : 'relative min-h-[78vh] overflow-hidden rounded-3xl border border-[#d4af37]/35 bg-[#07111a] shadow-[0_28px_90px_rgba(0,0,0,0.75)]'
                }
              >
                {/* 75-Second Procedural Moving Nature Video Stage */}
                <NatureCanvasStage
                  scene={scene}
                  onTickSecond={(sec) => setLoopSecond(sec)}
                />

                {/* Subtle readability scrim behind text when controls or quotes are shown */}
                {(showQuotes || !hideControls) && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/60" />
                )}

                {/* Scene Loop Progress Bar */}
                {!hideControls && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-1 bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-300 via-[#f8e6a0] to-sky-300 transition-[width] duration-700"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((loopSecond + 1) / NATURE_LOOP_SECONDS) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                )}

                {/* Top-Right Settings & Fullscreen Controls (Always accessible) */}
                <div className="absolute right-4 top-4 z-40 flex items-center gap-2 sm:right-6 sm:top-6">
                  {!hideControls && (
                    <span className="hidden items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 font-mono text-[11px] text-white/90 backdrop-blur-md sm:inline-flex">
                      <span>
                        {formatClockTime(loopSecond)} /{' '}
                        {formatClockTime(NATURE_LOOP_SECONDS)}
                      </span>
                      <span className="text-emerald-300">· Reset Loop</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSettingsOpen((o) => !o)}
                    aria-label="Sanctuary settings"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer ${
                      settingsOpen
                        ? 'border-[#f5dc82] bg-[#d4af37]/25 text-[#fff4c8]'
                        : 'border-white/25 bg-black/55 text-white hover:bg-black/75'
                    }`}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleBrowserFullscreen}
                    aria-label={
                      isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/55 px-3.5 py-1.5 font-mono text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/75 cursor-pointer"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize2 className="h-3.5 w-3.5 text-[#f8e6a0]" />
                        <span>Exit Fullscreen</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-3.5 w-3.5 text-[#f8e6a0]" />
                        <span>Fullscreen</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Settings Drawer / Popover */}
                <AnimatePresence>
                  {settingsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-4 top-16 z-40 w-72 rounded-2xl border border-white/20 bg-[#0b0d12]/90 p-4 text-white shadow-2xl backdrop-blur-xl sm:right-6"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <span className="font-mono text-[11px] font-bold tracking-wider text-[#f5dc82] uppercase">
                          Sanctuary Settings
                        </span>
                        <button
                          type="button"
                          onClick={() => setSettingsOpen(false)}
                          aria-label="Close settings"
                          className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-2.5 text-xs">
                        {/* Toggle Hide Sound & UI Controls */}
                        <button
                          type="button"
                          onClick={() => setHideControls((h) => !h)}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 font-semibold transition-colors cursor-pointer ${
                            hideControls
                              ? 'border-[#d4af37]/60 bg-[#d4af37]/20 text-[#f8e6a0]'
                              : 'border-white/15 bg-white/5 text-neutral-200 hover:bg-white/10'
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            {hideControls ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span>Hide Controls &amp; Audio UI</span>
                          </span>
                          <span className="font-mono text-[10px] uppercase">
                            {hideControls ? 'Hidden' : 'Shown'}
                          </span>
                        </button>

                        {/* Toggle Quotes On / Off */}
                        <button
                          type="button"
                          onClick={() => setShowQuotes((q) => !q)}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 font-semibold transition-colors cursor-pointer ${
                            showQuotes
                              ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                              : 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Quote className="h-4 w-4" />
                            <span>Show Quotes</span>
                          </span>
                          <span className="font-mono text-[10px] uppercase">
                            {showQuotes ? 'On' : 'Off'}
                          </span>
                        </button>

                        {/* Quick Sound Toggles */}
                        <button
                          type="button"
                          onClick={handleToggleWind}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 font-semibold transition-colors cursor-pointer ${
                            windOn
                              ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                              : 'border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Wind className="h-3.5 w-3.5" />
                            <span>Calm Wind Sound</span>
                          </span>
                          <span className="font-mono text-[10px] uppercase">
                            {windOn ? 'On' : 'Off'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleToggleSong}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 font-semibold transition-colors cursor-pointer ${
                            songOn
                              ? 'border-[#d4af37]/55 bg-[#d4af37]/20 text-[#f8e6a0]'
                              : 'border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Music className="h-3.5 w-3.5" />
                            <span>Easy Song</span>
                          </span>
                          <span className="font-mono text-[10px] uppercase">
                            {songOn ? 'On' : 'Off'}
                          </span>
                        </button>

                        {/* Quick Theme Switcher inside Settings */}
                        <div className="border-t border-white/10 pt-2.5">
                          <span className="mb-1.5 block font-mono text-[10px] tracking-wider text-white/60 uppercase">
                            Scene Theme
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {SCENE_OPTIONS.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setScene(opt.id)}
                                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] font-semibold transition-colors cursor-pointer ${
                                  scene === opt.id
                                    ? 'border-[#f5dc82]/70 bg-[#d4af37]/25 text-[#fff4c8]'
                                    : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/15'
                                }`}
                              >
                                <span
                                  className={`h-2 w-2 shrink-0 rounded-full bg-gradient-to-br ${opt.swatch}`}
                                />
                                <span className="truncate">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Foreground Sanctuary Content */}
                <div
                  className={`relative z-10 flex flex-1 flex-col justify-between gap-6 p-5 sm:p-8 ${
                    isFullscreen ? 'h-full overflow-y-auto' : 'min-h-[78vh]'
                  }`}
                >
                  {/* Top Scene Switcher (hidden when hideControls is ON) */}
                  {!hideControls ? (
                    <div className="flex flex-wrap items-center gap-2 pr-0 sm:pr-72">
                      {SCENE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setScene(opt.id)}
                          className={`inline-flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-left text-xs font-semibold backdrop-blur-md transition-all cursor-pointer ${
                            scene === opt.id
                              ? 'border-[#f5dc82]/75 bg-[#d4af37]/25 text-[#fff4c8] shadow-md'
                              : 'border-white/20 bg-black/45 text-neutral-200 hover:bg-black/65'
                          }`}
                        >
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br ${opt.swatch}`}
                          />
                          <span>
                            <span className="block font-bold">{opt.label}</span>
                            <span className="block font-mono text-[10px] opacity-80">
                              {opt.badge}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Center Quote Stage (ONLY shown when showQuotes is ON; buttons hidden if hideControls is ON) */}
                  <div className="mx-auto my-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
                    {!hideControls && breathingOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <motion.div
                          animate={{ scale: breathingPhase.scale }}
                          transition={{ duration: 0.95, ease: 'easeInOut' }}
                          className={`flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 backdrop-blur-md shadow-xl ${breathingPhase.ringClass}`}
                        >
                          <span className="font-mono text-2xl font-extrabold">
                            {breathingPhase.count}
                          </span>
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                            {breathingPhase.label}
                          </span>
                        </motion.div>
                        <span className="font-mono text-[10px] text-white/80">
                          4-7-8 Calm Breathing Guide
                        </span>
                      </motion.div>
                    )}

                    {showQuotes && (
                      <div
                        className={`w-full rounded-3xl border p-6 backdrop-blur-md sm:p-9 ${
                          hideControls
                            ? 'border-white/15 bg-black/35'
                            : 'border-white/20 bg-black/50'
                        }`}
                      >
                        {!hideControls && (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/15 px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-[#f8e6a0] uppercase">
                              <Sparkles className="h-3 w-3" />
                              {selectedMood === 'all'
                                ? CALM_MOODS.find(
                                    (m) => m.id === currentQuote.mood
                                  )?.label || 'Calm Note'
                                : CALM_MOODS.find((m) => m.id === selectedMood)
                                    ?.label}
                            </span>
                            <span className="font-mono text-[11px] text-neutral-300">
                              Message {safeQuoteIndex + 1} of{' '}
                              {activeQuotes.length}
                            </span>
                          </div>
                        )}

                        <AnimatePresence mode="wait">
                          <motion.blockquote
                            key={`${selectedMood}-${safeQuoteIndex}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className={`${
                              hideControls ? '' : 'mt-5'
                            } font-display text-xl leading-relaxed font-semibold text-white sm:text-2xl md:text-[28px]`}
                          >
                            &ldquo;{currentQuote.text}&rdquo;
                          </motion.blockquote>
                        </AnimatePresence>

                        {!hideControls && (
                          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                setQuoteIndex(
                                  (prev) =>
                                    (prev - 1 + activeQuotes.length) %
                                    activeQuotes.length
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 cursor-pointer"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span>Prev</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (activeQuotes.length <= 1) return;
                                let next = Math.floor(
                                  Math.random() * activeQuotes.length
                                );
                                if (next === safeQuoteIndex) {
                                  next = (next + 1) % activeQuotes.length;
                                }
                                setQuoteIndex(next);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d4af37]/45 bg-[#d4af37]/20 px-4 py-2 text-xs font-bold text-[#f8e6a0] hover:bg-[#d4af37]/30 cursor-pointer"
                            >
                              <Shuffle className="h-3.5 w-3.5" />
                              <span>Shuffle Quote</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setQuoteIndex(
                                  (prev) => (prev + 1) % activeQuotes.length
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 cursor-pointer"
                            >
                              <span>Next</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setAutoCycle((a) => !a)}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                                autoCycle
                                  ? 'border-emerald-400/55 bg-emerald-500/20 text-emerald-200'
                                  : 'border-white/20 bg-white/10 text-neutral-200 hover:bg-white/20'
                              }`}
                            >
                              {autoCycle ? (
                                <>
                                  <Pause className="h-3.5 w-3.5" />
                                  <span>Auto-Cycle On</span>
                                </>
                              ) : (
                                <>
                                  <Play className="h-3.5 w-3.5" />
                                  <span>Auto-Cycle (12s)</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setBreathingOpen((b) => !b)}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                                breathingOpen
                                  ? 'border-sky-400/55 bg-sky-500/20 text-sky-200'
                                  : 'border-white/20 bg-white/10 text-neutral-200 hover:bg-white/20'
                              }`}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>
                                {breathingOpen
                                  ? 'Hide Breathing'
                                  : '4-7-8 Breath'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Controls (Mood Selector + Sound Toggles) — hidden when hideControls is ON */}
                  {!hideControls ? (
                    <div className="grid gap-4 lg:grid-cols-12">
                      <div className="rounded-2xl border border-white/20 bg-black/55 p-4 backdrop-blur-md lg:col-span-7">
                        <div className="mb-2.5 flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold tracking-wider text-[#f5dc82] uppercase">
                            Select Your Mood · 100 Messages Each (500 Total)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMood('all');
                              setQuoteIndex(0);
                            }}
                            className={`rounded-xl border px-3 py-1.5 font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                              selectedMood === 'all'
                                ? 'border-white bg-white text-[#08080a]'
                                : 'border-white/20 bg-white/10 text-neutral-200 hover:bg-white/20'
                            }`}
                          >
                            All Moods ({ALL_CALM_QUOTES.length})
                          </button>
                          {CALM_MOODS.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedMood(m.id);
                                setQuoteIndex(0);
                              }}
                              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                selectedMood === m.id
                                  ? m.accentClass
                                  : 'border-white/20 bg-white/10 text-neutral-200 hover:bg-white/20'
                              }`}
                            >
                              {m.label} ({CALM_QUOTES_BY_MOOD[m.id].length})
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/20 bg-black/55 p-4 backdrop-blur-md lg:col-span-5">
                        <span className="mb-2.5 block font-mono text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
                          Ambient Audio Mixer (Toggleable)
                        </span>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={handleToggleWind}
                              className={`inline-flex min-w-[140px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                                windOn
                                  ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                                  : 'border-white/20 bg-white/10 text-neutral-200 hover:bg-white/20'
                              }`}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <Wind className="h-3.5 w-3.5" />
                                <span>Calm Wind</span>
                              </span>
                              <span className="font-mono text-[10px] uppercase">
                                {windOn ? 'On' : 'Off'}
                              </span>
                            </button>
                            <div className="flex flex-1 items-center gap-2">
                              {windOn ? (
                                <Volume2 className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                              ) : (
                                <VolumeX className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                              )}
                              <input
                                type="range"
                                aria-label="Calm wind volume"
                                min={0}
                                max={1}
                                step={0.05}
                                value={windVol}
                                onChange={(e) => {
                                  const v = Number.parseFloat(e.target.value);
                                  setWindVol(v);
                                  if (windOn) {
                                    getAudioEngine().setWind(true, v);
                                  }
                                }}
                                className="w-full accent-emerald-400 cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={handleToggleSong}
                              className={`inline-flex min-w-[140px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                                songOn
                                  ? 'border-[#d4af37]/60 bg-[#d4af37]/25 text-[#f8e6a0]'
                                  : 'border-white/20 bg-white/10 text-neutral-200 hover:bg-white/20'
                              }`}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <Music className="h-3.5 w-3.5" />
                                <span>Easy Song</span>
                              </span>
                              <span className="font-mono text-[10px] uppercase">
                                {songOn ? 'On' : 'Off'}
                              </span>
                            </button>
                            <div className="flex flex-1 items-center gap-2">
                              {songOn ? (
                                <Volume2 className="h-3.5 w-3.5 shrink-0 text-[#f8e6a0]" />
                              ) : (
                                <VolumeX className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                              )}
                              <input
                                type="range"
                                aria-label="Easy song volume"
                                min={0}
                                max={1}
                                step={0.05}
                                value={songVol}
                                onChange={(e) => {
                                  const v = Number.parseFloat(e.target.value);
                                  setSongVol(v);
                                  if (songOn) {
                                    getAudioEngine().setSong(true, v);
                                  }
                                }}
                                className="w-full accent-[#d4af37] cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= 3. SHARED SILENCE ROOM SUB-TAB ================= */}
          {subTab === 'silence-room' && (
            <motion.div
              key="silence-room"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <SilenceRoomSection />
            </motion.div>
          )}

          {/* ================= 4. USER QUOTES ("What are you learning?") SUB-TAB ================= */}
          {subTab === 'user-quotes' && (() => {
            const visibleQuotes =
              quoteTagFilter === 'all'
                ? approvedUserQuotes
                : approvedUserQuotes.filter(
                    (q) => (q.tag || 'General') === quoteTagFilter
                  );
            const spotlightQuote =
              visibleQuotes.find((q) => q.featured) || visibleQuotes[0] || null;
            const galleryQuotes = spotlightQuote
              ? visibleQuotes.filter((q) => q.id !== spotlightQuote.id)
              : visibleQuotes;

            return (
              <motion.div
                key="user-quotes"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto max-w-4xl space-y-7"
              >
                {/* Clean Obsidian & Gold Header + 2 Sub-Tabs */}
                <div className="flex flex-col justify-between gap-5 border-b border-[#d4af37]/20 pb-6 sm:flex-row sm:items-end">
                  <div>
                    <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#d4af37] uppercase">
                      Wisdom Without Ego · Verified by Admin
                    </p>
                    <h2 className="mt-1.5 font-display text-2xl font-bold text-[#fcf9f2] sm:text-3xl">
                      User Quotes
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-400 sm:text-sm">
                      Anonymous reflections on what members are learning right
                      now.
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2 rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-1.5">
                    <button
                      type="button"
                      onClick={() => setQuoteSubTab('share')}
                      className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer ${
                        quoteSubTab === 'share'
                          ? 'bg-[#d4af37] text-[#08080a] shadow-sm'
                          : 'text-neutral-300 hover:text-white'
                      }`}
                    >
                      Share Reflection
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuoteSubTab('gallery')}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all tabular-nums cursor-pointer ${
                        quoteSubTab === 'gallery'
                          ? 'bg-[#d4af37] text-[#08080a] shadow-sm'
                          : 'text-neutral-300 hover:text-white'
                      }`}
                    >
                      <span>Reflections Wall ({approvedUserQuotes.length})</span>
                      {isAdmin && pendingUserQuotes.length > 0 && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] ${
                            quoteSubTab === 'gallery'
                              ? 'bg-[#08080a] text-[#f8e6a0]'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {pendingUserQuotes.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {quoteSubTab === 'share' ? (
                  <div className="mx-auto max-w-2xl rounded-3xl border border-[#d4af37]/30 bg-[#100f0c] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-8">
                    <div className="border-b border-white/10 pb-4">
                      <h3 className="font-display text-xl font-bold text-[#f8e6a0]">
                        What are you learning?
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                        Share one honest insight or study lesson. No names are
                        stored—once approved by Admin, it joins the Reflections
                        Wall.
                      </p>
                    </div>

                    <div className="mt-5">
                      <span className="font-mono text-[10px] font-bold tracking-widest text-[#d4af37] uppercase">
                        Reflection Theme
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {QUOTE_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setQuoteTagDraft(tag)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                              quoteTagDraft === tag
                                ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#f8e6a0]'
                                : 'border-white/10 bg-[#08080a] text-neutral-300 hover:border-white/25 hover:text-white'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <span className="font-mono text-[10px] font-bold tracking-widest text-[#d4af37] uppercase">
                        Inspiration Starters
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {LEARNING_PROMPTS.map((starter) => (
                          <button
                            key={starter}
                            type="button"
                            onClick={() => setUserQuoteDraft(starter)}
                            className="rounded-xl border border-white/10 bg-[#08080a] px-3 py-1.5 text-left text-xs text-neutral-300 transition-colors hover:border-[#d4af37]/45 hover:text-[#f8e6a0] cursor-pointer"
                          >
                            “{starter.slice(0, 38)}…”
                          </button>
                        ))}
                      </div>
                    </div>

                    <form
                      onSubmit={handleSubmitLearningQuote}
                      className="mt-5 space-y-5"
                    >
                      <div>
                        <textarea
                          rows={5}
                          maxLength={280}
                          value={userQuoteDraft}
                          onChange={(e) => setUserQuoteDraft(e.target.value)}
                          placeholder="Write one reflection worth passing forward..."
                          className="w-full resize-none rounded-2xl border border-white/12 bg-[#08080a] p-4 font-display text-lg leading-relaxed text-white placeholder:font-sans placeholder:text-sm placeholder:text-neutral-500 transition-colors focus:border-[#d4af37] focus:outline-none"
                        />
                        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-neutral-500 tabular-nums">
                          <span>100% Anonymous · Reviewed by Admin</span>
                          <span>{userQuoteDraft.length} / 280</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="submit"
                          disabled={userQuoteDraft.trim().length === 0}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c79a26] to-[#f0cb65] px-6 py-3 text-sm font-bold text-[#08080a] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                        >
                          <Send className="h-4 w-4" />
                          <span>Submit for Review</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setQuoteSubTab('gallery')}
                          className="font-mono text-xs text-neutral-400 underline-offset-4 hover:text-[#f8e6a0] hover:underline cursor-pointer"
                        >
                          View Reflections Wall →
                        </button>
                      </div>

                      {quoteSubmittedBanner && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200"
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>
                            Sent to Admin! Once verified, your reflection joins
                            the Reflections Wall.
                          </span>
                        </motion.div>
                      )}
                    </form>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Tag Filter Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-[#100f0c] p-3">
                      <button
                        type="button"
                        onClick={() => setQuoteTagFilter('all')}
                        className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors cursor-pointer ${
                          quoteTagFilter === 'all'
                            ? 'bg-[#d4af37] text-[#08080a]'
                            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        All Themes ({approvedUserQuotes.length})
                      </button>
                      {QUOTE_TAGS.map((tag) => {
                        const count = approvedUserQuotes.filter(
                          (q) => (q.tag || 'General') === tag
                        ).length;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setQuoteTagFilter(tag)}
                            className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors tabular-nums cursor-pointer ${
                              quoteTagFilter === tag
                                ? 'bg-[#d4af37] text-[#08080a]'
                                : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {tag} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Admin Verification Queue */}
                    {isAdmin && pendingUserQuotes.length > 0 && (
                      <div className="rounded-3xl border border-amber-400/40 bg-[#151109] p-6">
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <span className="font-mono text-xs font-bold tracking-wider text-amber-300 uppercase">
                            Admin Verification Queue ({pendingUserQuotes.length})
                          </span>
                          <span className="font-mono text-[11px] text-neutral-400">
                            Approve before public display
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">
                          {pendingUserQuotes.map((pq) => (
                            <div
                              key={pq.id}
                              className="rounded-2xl border border-white/10 bg-[#08080a] p-4"
                            >
                              <p className="font-display text-base leading-relaxed text-white italic">
                                &ldquo;{pq.text}&rdquo;
                              </p>
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <span className="font-mono text-[11px] text-neutral-400">
                                  {pq.tag || 'General'} · Anonymous ·{' '}
                                  {formatDateLabel(pq.createdAt)}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onVerifyUserQuote(pq.id, 'approved', false)
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1.5 font-mono text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Verify</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onVerifyUserQuote(pq.id, 'approved', true)
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#d4af37] px-2.5 py-1.5 font-mono text-[11px] font-bold text-[#08080a] hover:bg-[#f0cb65] cursor-pointer"
                                  >
                                    <Star className="h-3.5 w-3.5" />
                                    <span>Verify &amp; Spotlight</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteUserQuote(pq.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-400/35 bg-rose-500/10 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-rose-200 hover:bg-rose-500/20 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Spotlight Reflection */}
                    {spotlightQuote && (
                      <div className="rounded-3xl border border-[#d4af37]/40 bg-[#14110a] p-7 sm:p-9">
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                          <span className="inline-flex items-center gap-1.5 font-bold tracking-widest text-[#d4af37] uppercase">
                            <Sparkles className="h-3.5 w-3.5" />
                            {spotlightQuote.featured
                              ? 'Spotlight Reflection · Admin Curated'
                              : 'Featured Reflection'}
                          </span>
                          <span className="text-neutral-400">
                            {spotlightQuote.tag || 'General'} · Anonymous ·{' '}
                            {formatDateLabel(spotlightQuote.createdAt)}
                          </span>
                        </div>

                        <blockquote className="mt-5 font-display text-2xl leading-relaxed font-medium text-[#fcf8ee] italic sm:text-3xl">
                          &ldquo;{spotlightQuote.text}&rdquo;
                        </blockquote>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {QUOTE_REACTIONS.map((rx) => {
                              const count =
                                spotlightQuote.reactions?.[rx.key] || 0;
                              const active = Boolean(
                                currentUserId &&
                                  spotlightQuote.reactedBy?.[
                                    currentUserId
                                  ]?.includes(rx.key)
                              );
                              return (
                                <button
                                  key={rx.key}
                                  type="button"
                                  onClick={() =>
                                    onReactUserQuote(spotlightQuote.id, rx.key)
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs transition-colors tabular-nums cursor-pointer ${
                                    active
                                      ? 'border-[#d4af37]/60 bg-[#d4af37]/18 text-[#f8e6a0]'
                                      : 'border-white/10 bg-[#08080a] text-neutral-300 hover:border-white/25 hover:text-white'
                                  }`}
                                >
                                  <span>{rx.emoji}</span>
                                  <span>{rx.label}</span>
                                  {count > 0 && (
                                    <span className="font-bold">({count})</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {isAdmin && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleFeatureUserQuote(spotlightQuote.id)
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#f8e6a0] hover:bg-[#d4af37]/20 cursor-pointer"
                              >
                                <Star className="h-3 w-3" />
                                <span>
                                  {spotlightQuote.featured
                                    ? 'Remove Spotlight'
                                    : 'Pin Spotlight'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onDeleteUserQuote(spotlightQuote.id)
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-rose-200 hover:bg-rose-500/20 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Spacious 2-Column Reflections Wall */}
                    {visibleQuotes.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-white/15 bg-[#100f0c] p-14 text-center">
                        <Quote className="mx-auto h-9 w-9 text-[#d4af37]/60" />
                        <p className="mt-3 font-display text-lg font-semibold text-white">
                          {approvedUserQuotes.length === 0
                            ? 'No verified reflections yet'
                            : `No reflections tagged "${quoteTagFilter}" yet`}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          Share what you&apos;re learning—once approved by
                          Admin, it appears here.
                        </p>
                      </div>
                    ) : galleryQuotes.length > 0 ? (
                      <div className="grid gap-5 sm:grid-cols-2">
                        {galleryQuotes.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#100f0c] p-6 transition-colors hover:border-[#d4af37]/40"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-neutral-400">
                                <span className="text-[#f8e6a0]">
                                  {item.tag || 'General'} · Anonymous
                                </span>
                                <span>{formatDateLabel(item.createdAt)}</span>
                              </div>
                              <blockquote className="mt-4 font-display text-lg leading-relaxed text-[#f6f1e6] italic">
                                &ldquo;{item.text}&rdquo;
                              </blockquote>
                            </div>

                            <div className="mt-5 space-y-3 border-t border-white/10 pt-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {QUOTE_REACTIONS.map((rx) => {
                                  const count = item.reactions?.[rx.key] || 0;
                                  const active = Boolean(
                                    currentUserId &&
                                      item.reactedBy?.[currentUserId]?.includes(
                                        rx.key
                                      )
                                  );
                                  return (
                                    <button
                                      key={rx.key}
                                      type="button"
                                      onClick={() =>
                                        onReactUserQuote(item.id, rx.key)
                                      }
                                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-colors tabular-nums cursor-pointer ${
                                        active
                                          ? 'border-[#d4af37]/60 bg-[#d4af37]/18 text-[#f8e6a0]'
                                          : 'border-white/10 bg-[#08080a] text-neutral-400 hover:border-white/25 hover:text-white'
                                      }`}
                                    >
                                      <span>{rx.emoji}</span>
                                      <span>{rx.label}</span>
                                      {count > 0 && (
                                        <span className="font-bold">
                                          ({count})
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {isAdmin && (
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onToggleFeatureUserQuote(item.id)
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#f8e6a0] hover:bg-[#d4af37]/20 cursor-pointer"
                                  >
                                    <Star className="h-3 w-3" />
                                    <span>Spotlight</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteUserQuote(item.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-rose-200 hover:bg-rose-500/20 cursor-pointer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
