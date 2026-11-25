import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpCircle,
  Award,
  Bell,
  CalendarDays,
  Check,
  Crown,
  Download,
  Flame,
  Gavel,
  Lock,
  ShoppingBag,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  Upload,
  User as UserIcon,
  Users,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  AchievementDef,
  AscensionSubTab,
  AuctionItem,
  CertificateRecord,
  DqrUser,
  DuelMatch,
  LevelRange,
  PastWinnerRecord,
  QuizRecord,
  RankDef,
  StreakBand,
  Territory,
  TitleItem,
  UserWeeklyTracker,
} from '../types';
import {
  getLevelRangeForLevel,
  getStreakBand,
  getUserMoodMeta,
  getXpCostForNextLevel,
  USER_MOOD_OPTIONS,
} from '../data/presets';
import { TitleBadge } from './TitleBadge';
import { WeeklySummaryModal } from './WeeklySummaryModal';
import { CertificateRenderer, exportCertificateToPng } from './CertificateRenderer';
import { SeasonPassportSection } from './SeasonPassportSection';
import { uploadDqrMedia } from '../lib/supabase';
import { isEndOfWeek } from '../utils/weeklyHelpers';
import { DethroneAlert } from '../utils/territoryHelpers';
import { TimeOfDayGreeting, YearlyUserRecord } from '../utils/yearEndHelpers';

interface AscensionPathProps {
  currentUser: DqrUser;
  users: DqrUser[];
  ranks: RankDef[];
  levelRanges: LevelRange[];
  streakBands: StreakBand[];
  titles: TitleItem[];
  achievements: AchievementDef[];
  auctions: AuctionItem[];
  pastWinners: PastWinnerRecord[];
  certificates: CertificateRecord[];
  weeklyTracker: UserWeeklyTracker;
  onDismissWeeklySummary: (userId: string, weekStartIso: string) => void;
  onLevelUp: (userId: string, xpCost: number) => void;
  onAcknowledgeAnnouncement: (userId: string) => void;
  onBuyTitle: (userId: string, title: TitleItem) => string | null;
  onEquipTitle: (userId: string, titleId: string | null) => void;
  onToggleEquipAchievement: (userId: string, achId: string) => void;
  onUpdateProfile: (
    userId: string,
    patch: Partial<
      Pick<DqrUser, 'photoUrl' | 'bio' | 'favouriteTopic' | 'pin' | 'mood'>
    >
  ) => void;
  onPlaceBid: (
    auctionId: string,
    userId: string,
    amount: number
  ) => string | null;
  onSettleAuction: (auctionId: string) => void;
  dethroneAlerts?: DethroneAlert[];
  onDismissDethroneAlert?: (eventId: string) => void;
  onOpenTerritories?: () => void;
  dailyGreeting?: TimeOfDayGreeting | null;
  onDismissDailyGreeting?: () => void;
  quizzes?: QuizRecord[];
  territories?: Territory[];
  bsYears?: string[];
  duelMatches?: DuelMatch[];
  yearlyRecords?: Record<string, YearlyUserRecord>;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function AscensionPath({
  currentUser,
  users,
  ranks,
  levelRanges,
  streakBands,
  titles,
  achievements,
  auctions,
  pastWinners,
  certificates,
  weeklyTracker,
  onDismissWeeklySummary,
  onLevelUp,
  onAcknowledgeAnnouncement,
  onBuyTitle,
  onEquipTitle,
  onToggleEquipAchievement,
  onUpdateProfile,
  onPlaceBid,
  onSettleAuction,
  dethroneAlerts = [],
  onDismissDethroneAlert,
  onOpenTerritories,
  dailyGreeting = null,
  onDismissDailyGreeting,
  quizzes = [],
  territories = [],
  bsYears = [],
  duelMatches = [],
  yearlyRecords = {},
}: AscensionPathProps) {
  const [subTab, setSubTab] = useState<AscensionSubTab>('dashboard');
  const [feedback, setFeedback] = useState<string>('');
  const [now, setNow] = useState(() => Date.now());
  const [selectedUserModal, setSelectedUserModal] = useState<DqrUser | null>(
    null
  );
  const [reportZoomOpen, setReportZoomOpen] = useState(false);
  const [zoomedCert, setZoomedCert] = useState<CertificateRecord | null>(null);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [weeklyFocusIso, setWeeklyFocusIso] = useState<string | null>(null);

  // Profile form state
  const [bioInput, setBioInput] = useState(currentUser.bio);
  const [topicInput, setTopicInput] = useState(currentUser.favouriteTopic);
  const [pinInput, setPinInput] = useState(currentUser.pin);
  const [photoInput, setPhotoInput] = useState(currentUser.photoUrl || '');
  const [moodInput, setMoodInput] = useState<string | null>(
    currentUser.mood ?? null
  );

  // Bid input state per auction
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    setBioInput(currentUser.bio);
    setTopicInput(currentUser.favouriteTopic);
    setPinInput(currentUser.pin);
    setPhotoInput(currentUser.photoUrl || '');
    setMoodInput(currentUser.mood ?? null);
  }, [
    currentUser.id,
    currentUser.bio,
    currentUser.favouriteTopic,
    currentUser.pin,
    currentUser.photoUrl,
    currentUser.mood,
  ]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // First Login of the Day: show 10 seconds of warmth while viewing Dashboard
  useEffect(() => {
    if (subTab !== 'dashboard' || !dailyGreeting || !onDismissDailyGreeting) {
      return;
    }
    const timer = window.setTimeout(() => {
      onDismissDailyGreeting();
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [subTab, dailyGreeting, onDismissDailyGreeting]);

  // Automatically pop up the Weekly Summary on the Dashboard at the end of each week
  useEffect(() => {
    if (subTab !== 'dashboard') return;
    const latestCompleted = weeklyTracker.completedWeeks[0];
    if (latestCompleted && !latestCompleted.dismissedEndOfWeek) {
      setWeeklyFocusIso(latestCompleted.weekStartIso);
      setWeeklyModalOpen(true);
      return;
    }
    if (isEndOfWeek() && !weeklyTracker.activeWeek.dismissedEndOfWeek) {
      setWeeklyFocusIso(weeklyTracker.activeWeek.weekStartIso);
      setWeeklyModalOpen(true);
    }
  }, [
    subTab,
    currentUser.id,
    weeklyTracker.activeWeek.weekStartIso,
    weeklyTracker.activeWeek.dismissedEndOfWeek,
    weeklyTracker.completedWeeks,
  ]);

  const showMsg = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3200);
  };

  const currentRank =
    ranks.find((r) => r.id === currentUser.rankId) || ranks[ranks.length - 1];
  const levelRange = getLevelRangeForLevel(currentUser.level, levelRanges);
  const xpRequired = getXpCostForNextLevel(currentUser.level, levelRanges);
  const canLevelUp = currentUser.xp >= xpRequired;
  const xpPercent = Math.min(
    100,
    Math.round((currentUser.xp / Math.max(1, xpRequired)) * 100)
  );
  const streakBand = getStreakBand(currentUser.streak, streakBands);

  const equippedTitle = titles.find(
    (t) => t.id === currentUser.equippedTitleId
  );
  const shopTitles = titles.filter((t) => t.isShopItem);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showMsg('Uploading profile photo...');
      const url = await uploadDqrMedia(file, 'profiles');
      setPhotoInput(url);
      onUpdateProfile(currentUser.id, { photoUrl: url });
      showMsg('Profile photo uploaded & saved.');
    } catch {
      showMsg('Failed to process selected image.');
    }
  };

  const handleProfileSave = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,9}$/.test(pinInput.trim())) {
      showMsg('PIN must be 4 to 9 numeric digits.');
      return;
    }
    onUpdateProfile(currentUser.id, {
      bio: bioInput.trim(),
      favouriteTopic: topicInput.trim(),
      pin: pinInput.trim(),
      photoUrl: photoInput.trim() || null,
      mood: moodInput,
    });
    showMsg('Profile updated successfully.');
  };

  const tabs: { id: AscensionSubTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'passport', label: 'Season Passport' },
    { id: 'shop', label: 'Shop' },
    { id: 'auction', label: 'Auction' },
    { id: 'users', label: 'Users' },
    { id: 'profile', label: 'Profile' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'report-cards', label: 'Report Cards' },
    { id: 'past-winners', label: 'Past Winners' },
    { id: 'certificates', label: 'Certificates' },
  ];

  return (
    <div className="min-h-screen bg-[#0b0714] text-[#f4effa]">
      {/* Header Banner — Solo Leveling Purple balanced with Gold & Burgundy */}
      <div className="border-b border-[#9333ea]/30 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.24),transparent)] px-5 pt-10 pb-7 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-xs tracking-[0.22em] text-[#d4af37] uppercase">
                Solo Ascension System · {currentUser.fullName}
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                The Ascension Path
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#cfc5e3]">
                Track rank elevation, spend XP on animated prestige titles,
                compete in live auctions, and inspect member records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setWeeklyFocusIso(
                    weeklyTracker.completedWeeks[0] &&
                      !weeklyTracker.completedWeeks[0].dismissedEndOfWeek
                      ? weeklyTracker.completedWeeks[0].weekStartIso
                      : weeklyTracker.activeWeek.weekStartIso
                  );
                  setWeeklyModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#8b5cf6]/45 bg-[#140d24] px-4 py-3 text-left transition-colors hover:border-[#d4af37]/60 cursor-pointer"
              >
                <CalendarDays className="h-4 w-4 text-[#d4af37]" />
                <div>
                  <p className="font-mono text-[10px] tracking-wider text-[#c4b5fd] uppercase">
                    Weekly Recap
                  </p>
                  <p className="font-mono text-xs font-bold text-white">
                    {weeklyTracker.activeWeek.weekLabel}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-3 rounded-2xl border border-[#d4af37]/40 bg-[#140d24] px-4 py-3 shadow-[0_8px_30px_rgba(139,92,246,0.2)]">
                <Sparkles className="h-5 w-5 text-[#d4af37]" />
                <div>
                  <p className="font-mono text-[10px] tracking-wider text-[#c4b5fd] uppercase">
                    Available XP
                  </p>
                  <p className="font-mono text-lg font-bold text-[#fde68a] tabular-nums">
                    {currentUser.xp.toLocaleString()} XP
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-tab Ribbon */}
          <div className="mt-7 flex flex-wrap gap-2 rounded-2xl border border-[#8b5cf6]/30 bg-[#120b20]/90 p-1.5">
            {tabs.map((t) => {
              const active = subTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSubTab(t.id)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer sm:text-sm ${
                    active
                      ? 'bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#881337] text-white shadow-[0_4px_20px_rgba(147,51,234,0.45)]'
                      : 'text-[#d4cbe8] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 rounded-xl border border-[#d4af37]/50 bg-[#1c132d] px-4 py-3 text-sm font-medium text-[#fde68a]"
          >
            <Check className="h-4 w-4 text-[#d4af37]" />
            <span>{feedback}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* ================= 1. DASHBOARD ================= */}
          {subTab === 'dashboard' && (
            <motion.div
              key="dash"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* First Login of the Day — 10 seconds of warmth */}
              <AnimatePresence>
                {dailyGreeting && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="relative overflow-hidden rounded-2xl border border-[#f5dc82]/45 bg-gradient-to-r from-[#241a0b]/95 via-[#181124]/95 to-[#120d1a]/95 px-5 py-4 shadow-[0_14px_40px_rgba(212,175,55,0.16)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#f5dc82]/35 bg-[#d4af37]/15 text-xl">
                          {dailyGreeting.emoji}
                        </span>
                        <div>
                          <p className="font-mono text-[10px] tracking-[0.2em] text-[#f5dc82]/80 uppercase">
                            {dailyGreeting.timeLabel} · First Login Today
                          </p>
                          <p className="mt-0.5 font-display text-lg font-semibold text-white sm:text-xl">
                            {dailyGreeting.message}
                          </p>
                        </div>
                      </div>
                      {onDismissDailyGreeting && (
                        <button
                          type="button"
                          onClick={onDismissDailyGreeting}
                          aria-label="Dismiss greeting"
                          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <motion.div
                      initial={{ scaleX: 1 }}
                      animate={{ scaleX: 0 }}
                      transition={{ duration: 10, ease: 'linear' }}
                      style={{ transformOrigin: 'left' }}
                      className="mt-3 h-0.5 w-full rounded-full bg-gradient-to-r from-[#f5dc82] via-[#d4af37] to-[#a855f7]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Unchecked Announcement Alert */}
              {!currentUser.announcementChecked && currentUser.announcement && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-[#d4af37]/60 bg-gradient-to-r from-[#2e1065]/70 via-[#4c0519]/60 to-[#1c1406]/80 p-5 shadow-[0_12px_40px_rgba(136,19,55,0.25)] sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#fde68a]">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-mono text-[11px] font-bold tracking-wider text-[#fde68a] uppercase">
                        Unchecked Administrative Announcement
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-white">
                        {currentUser.announcement}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAcknowledgeAnnouncement(currentUser.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#0b0714] hover:bg-[#fde047] cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Mark Checked</span>
                  </button>
                </motion.div>
              )}

              {/* Territory Dethrone Alerts */}
              <AnimatePresence>
                {dethroneAlerts.map((alert) => (
                  <motion.div
                    key={alert.eventId}
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-rose-500/50 bg-gradient-to-r from-[#360d1c]/90 via-[#1f0f24] to-[#140e24] p-5 shadow-[0_12px_40px_rgba(244,63,94,0.2)] sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/20 text-rose-200">
                        <Swords className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-mono text-[11px] font-bold tracking-wider text-rose-300 uppercase">
                          Territory Dethroned · {alert.territoryCode}
                        </p>
                        <p className="mt-1 text-sm text-white">
                          <span className="font-semibold text-[#fde68a]">
                            {alert.dethronedBy}
                          </span>{' '}
                          seized{' '}
                          <span className="font-semibold text-white">
                            {alert.territoryName}
                          </span>{' '}
                          with {alert.newScore}/{alert.totalQuestions} (
                          {alert.dateLabel}).
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {onOpenTerritories && (
                        <button
                          type="button"
                          onClick={onOpenTerritories}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f0cb65] px-4 py-2 text-xs font-bold text-[#0b0714] cursor-pointer"
                        >
                          <Swords className="h-3.5 w-3.5" />
                          <span>Challenge Back</span>
                        </button>
                      )}
                      {onDismissDethroneAlert && (
                        <button
                          type="button"
                          onClick={() => onDismissDethroneAlert(alert.eventId)}
                          className="rounded-xl border border-white/20 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 cursor-pointer"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Hero Status & Aura Power Grid */}
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Main Aura Power Card */}
                <div className="relative overflow-hidden rounded-3xl border border-[#8b5cf6]/45 bg-gradient-to-br from-[#160d2b] via-[#10091e] to-[#1a0a16] p-6 shadow-[0_24px_70px_rgba(88,28,135,0.28)] sm:p-8 lg:col-span-7">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#9333ea]/20 blur-3xl"
                  />

                  <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-mono text-xs tracking-widest text-[#c4b5fd] uppercase">
                        Ascension Status Window
                      </p>
                      <h2 className="mt-2 font-display text-3xl font-bold text-white">
                        {currentUser.fullName}
                      </h2>
                      <p className="mt-1.5 text-sm italic text-[#fde68a]">
                        {currentUser.tagline}
                      </p>
                      {(() => {
                        const myMood = getUserMoodMeta(currentUser.mood);
                        if (!myMood) return null;
                        return (
                          <div className="mt-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${myMood.chipClass}`}
                            >
                              <span>{myMood.emoji}</span>
                              <span>{myMood.label}</span>
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Rank Emblem Badge */}
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 3.4, repeat: Infinity }}
                      style={{
                        borderColor: `${currentRank.color}88`,
                        backgroundColor: currentRank.bgTint,
                      }}
                      className="flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg shrink-0"
                    >
                      <span
                        style={{ color: currentRank.color }}
                        className="text-2xl"
                      >
                        {currentRank.emblem}
                      </span>
                      <div>
                        <p className="font-mono text-[10px] text-white/65 uppercase">
                          Current Rank
                        </p>
                        <p
                          style={{ color: currentRank.color }}
                          className="font-display text-base font-bold"
                        >
                          {currentRank.name}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Level & Manual Level-Up Bar */}
                  <div
                    style={{
                      borderColor: `${levelRange.color}55`,
                      backgroundColor: `${levelRange.bgColor}65`,
                    }}
                    className="relative z-10 mt-7 rounded-2xl border p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p
                          style={{ color: levelRange.color }}
                          className="font-display text-2xl font-extrabold"
                        >
                          {levelRange.tag}
                        </p>
                        <p className="font-mono text-xs text-white/80">
                          Level {currentUser.level} · Next Level Cost:{' '}
                          {xpRequired.toLocaleString()} XP (+{levelRange.growthPercent}
                          %/lvl)
                        </p>
                      </div>

                      <motion.button
                        type="button"
                        whileHover={canLevelUp ? { scale: 1.04 } : {}}
                        whileTap={canLevelUp ? { scale: 0.96 } : {}}
                        disabled={!canLevelUp}
                        onClick={() => {
                          onLevelUp(currentUser.id, xpRequired);
                          showMsg(
                            `Leveled up to Level ${currentUser.level + 1}!`
                          );
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                          canLevelUp
                            ? 'bg-gradient-to-r from-[#d4af37] to-[#fde047] text-[#0b0714] shadow-[0_0_24px_rgba(212,175,55,0.5)]'
                            : 'cursor-not-allowed border border-white/15 bg-white/5 text-white/40'
                        }`}
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        <span>
                          {canLevelUp
                            ? `Level Up (-${xpRequired} XP)`
                            : `Need ${xpRequired - currentUser.xp} more XP`}
                        </span>
                      </motion.button>
                    </div>

                    {/* Animated XP Progress Bar */}
                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-black/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPercent}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          background: `linear-gradient(90deg, #9333ea, ${levelRange.color}, #d4af37)`,
                        }}
                        className="h-full rounded-full"
                      />
                    </div>
                    <div className="mt-2 flex justify-between font-mono text-[11px] text-white/75 tabular-nums">
                      <span>Total XP: {currentUser.xp.toLocaleString()}</span>
                      <span>{xpPercent}% Ready</span>
                    </div>
                  </div>

                  {/* Equipped Title & Achievements Row */}
                  <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="font-mono text-[10px] tracking-wider text-[#c4b5fd] uppercase">
                        Equipped Title
                      </p>
                      <div className="mt-2.5">
                        {equippedTitle ? (
                          <TitleBadge title={equippedTitle} size="md" />
                        ) : (
                          <span className="text-xs text-white/50">
                            No title equipped
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="font-mono text-[10px] tracking-wider text-[#c4b5fd] uppercase">
                        Equipped Achievements (Max 2)
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {currentUser.equippedAchievementIds.length === 0 ? (
                          <span className="text-xs text-white/50">
                            Equip from Achievements tab
                          </span>
                        ) : (
                          currentUser.equippedAchievementIds.map((aid) => {
                            const ach = achievements.find((a) => a.id === aid);
                            if (!ach) return null;
                            return (
                              <span
                                key={aid}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/35 bg-[#1b122b] px-2.5 py-1 text-xs font-medium text-[#fde68a]"
                              >
                                <span>{ach.icon}</span>
                                <span>{ach.title}</span>
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Streak & Power Breakdown Column */}
                <div className="flex flex-col gap-6 lg:col-span-5">
                  {/* Animated Streak Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ borderColor: `${streakBand.color}55` }}
                    className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-[#230b1a] via-[#130b20] to-[#0b0714] p-6 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs tracking-wider text-[#fda4af] uppercase">
                          Daily Streak Band
                        </p>
                        <h3
                          style={{ color: streakBand.color }}
                          className="mt-1 font-display text-2xl font-bold"
                        >
                          {streakBand.label}
                        </h3>
                      </div>

                      <motion.div
                        animate={{ scale: [1, 1.07, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        className="flex items-center gap-1.5 rounded-2xl border border-amber-400/50 bg-amber-500/15 px-4 py-2 font-mono text-base font-bold text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.3)]"
                      >
                        <Flame className="h-5 w-5 text-amber-400" />
                        <span>🔥 {currentUser.streak} days</span>
                      </motion.div>
                    </div>

                    <p className="mt-4 rounded-xl border border-white/10 bg-black/35 p-3.5 text-sm leading-relaxed text-[#f1e9fa]">
                      {streakBand.message}
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-white/55">
                      Band: {streakBand.minDays}–
                      {streakBand.maxDays >= 9999 ? '100+' : streakBand.maxDays}{' '}
                      days
                    </p>
                  </motion.div>

                  {/* Power Summary Chart Card */}
                  <div className="flex-1 rounded-3xl border border-[#8b5cf6]/30 bg-[#120b20] p-6">
                    <p className="font-mono text-xs tracking-wider text-[#d4af37] uppercase">
                      Power Profile Matrix
                    </p>
                    <div className="mt-4 space-y-3.5">
                      {[
                        {
                          label: 'Level Tier',
                          value: `Lv. ${currentUser.level} (${levelRange.tag})`,
                          pct: Math.min(100, currentUser.level * 2),
                          color: levelRange.color,
                        },
                        {
                          label: 'Streak Endurance',
                          value: `${currentUser.streak} Days`,
                          pct: Math.min(100, currentUser.streak),
                          color: '#FB7185',
                        },
                        {
                          label: 'Titles Collected',
                          value: `${currentUser.ownedTitleIds.length} Unlocked`,
                          pct: Math.min(
                            100,
                            currentUser.ownedTitleIds.length * 14
                          ),
                          color: '#D4AF37',
                        },
                        {
                          label: 'Achievements',
                          value: `${currentUser.achievementIds.length} / ${achievements.length}`,
                          pct: Math.round(
                            (currentUser.achievementIds.length /
                              Math.max(1, achievements.length)) *
                              100
                          ),
                          color: '#A855F7',
                        },
                      ].map((bar) => (
                        <div key={bar.label}>
                          <div className="flex justify-between text-xs">
                            <span className="text-[#c4b5fd]">{bar.label}</span>
                            <span className="font-mono font-semibold text-white">
                              {bar.value}
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${bar.pct}%` }}
                              transition={{ duration: 0.7 }}
                              style={{ backgroundColor: bar.color }}
                              className="h-full rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= SEASON PASSPORT ================= */}
          {subTab === 'passport' && (
            <motion.div
              key="passport"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <SeasonPassportSection
                currentUser={currentUser}
                ranks={ranks}
                quizzes={quizzes}
                territories={territories}
                bsYears={bsYears}
                duelMatches={duelMatches}
                yearlyRecords={yearlyRecords}
              />
            </motion.div>
          )}

          {/* ================= 2. SHOP SUB-TAB ================= */}
          {subTab === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#d4af37]/30 bg-[#140d24] p-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#fde68a]">
                    Title Vault & Shop
                  </h2>
                  <p className="text-xs text-[#cfc5e3]">
                    Spend accumulated XP to unlock animated prestige titles.
                    Equip your favorite directly.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-[#fde047]">
                  <ShoppingBag className="h-4 w-4" />
                  <span>{currentUser.xp.toLocaleString()} XP Available</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shopTitles.map((title) => {
                  const owned = currentUser.ownedTitleIds.includes(title.id);
                  const equipped = currentUser.equippedTitleId === title.id;
                  const affordable = currentUser.xp >= title.priceXp;

                  return (
                    <motion.div
                      key={title.id}
                      whileHover={{ y: -4 }}
                      className="flex flex-col justify-between rounded-2xl border border-[#8b5cf6]/30 bg-[#130c22] p-5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <TitleBadge title={title} size="md" />
                          <span className="font-mono text-xs font-bold text-[#fde68a]">
                            {owned ? 'OWNED' : `${title.priceXp} XP`}
                          </span>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-[#c4b5fd]">
                          {title.description}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
                        <span className="font-mono text-[11px] text-white/50">
                          Anim: {title.animation}
                        </span>
                        {owned ? (
                          <button
                            type="button"
                            onClick={() => {
                              onEquipTitle(
                                currentUser.id,
                                equipped ? null : title.id
                              );
                              showMsg(
                                equipped
                                  ? 'Title unequipped.'
                                  : `Equipped "${title.name}".`
                              );
                            }}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                              equipped
                                ? 'border border-[#d4af37] bg-[#d4af37]/20 text-[#fde68a]'
                                : 'bg-[#7c3aed] text-white hover:bg-[#9333ea]'
                            }`}
                          >
                            {equipped ? 'Equipped ✓' : 'Equip'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!affordable}
                            onClick={() => {
                              const err = onBuyTitle(currentUser.id, title);
                              if (err) showMsg(err);
                              else showMsg(`Purchased "${title.name}"!`);
                            }}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                              affordable
                                ? 'bg-gradient-to-r from-[#d4af37] to-[#f0cb65] text-[#0b0714]'
                                : 'cursor-not-allowed bg-white/10 text-white/40'
                            }`}
                          >
                            Buy ({title.priceXp} XP)
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ================= 3. AUCTION SUB-TAB ================= */}
          {subTab === 'auction' && (
            <motion.div
              key="auction"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#1e0b36] to-[#2e0919] p-6">
                <div className="flex items-center gap-3">
                  <Gavel className="h-6 w-6 text-[#fde047]" />
                  <div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Live Title Auction House
                    </h2>
                    <p className="text-xs text-[#e9d5ff]">
                      Every new highest bid automatically extends the timer by{' '}
                      <span className="font-bold text-[#fde047]">+10 seconds</span>
                      . Winner receives the exclusive title and XP is deducted.
                    </p>
                  </div>
                </div>
              </div>

              {auctions.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#130c22] p-12 text-center">
                  <p className="text-sm text-white/70">
                    No active auctions right now. Admin can launch a new auction
                    anytime.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {auctions.map((auc) => {
                    const remaining = auc.endsAt - now;
                    const expired = remaining <= 0;
                    const minNextBid =
                      auc.highestBidderId === null
                        ? auc.startingBid
                        : auc.currentBid + 50;
                    const inputVal = bidAmounts[auc.id] ?? String(minNextBid);

                    return (
                      <div
                        key={auc.id}
                        className="rounded-3xl border border-[#d4af37]/45 bg-[#130c22] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                          <div>
                            <p className="font-mono text-[11px] text-[#c4b5fd] uppercase">
                              Auction Lot
                            </p>
                            <div className="mt-2">
                              <TitleBadge title={auc.title} size="lg" />
                            </div>
                          </div>

                          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3.5 py-2 text-right">
                            <div className="flex items-center justify-end gap-1.5 font-mono text-[11px] text-amber-200">
                              <Timer className="h-3.5 w-3.5" />
                              <span>
                                {auc.settled
                                  ? 'SETTLED'
                                  : expired
                                    ? 'ENDED'
                                    : 'TIME LEFT'}
                              </span>
                            </div>
                            <p className="font-mono text-lg font-bold text-[#fde047] tabular-nums">
                              {auc.settled
                                ? 'Closed'
                                : formatCountdown(remaining)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-4">
                          <div className="rounded-xl border border-white/10 bg-black/30 p-3.5">
                            <p className="text-[11px] text-white/60">
                              Current Highest Bid
                            </p>
                            <p className="mt-1 font-mono text-xl font-bold text-[#fde68a]">
                              {auc.currentBid.toLocaleString()} XP
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/30 p-3.5">
                            <p className="text-[11px] text-white/60">
                              Highest Bidder
                            </p>
                            <p className="mt-1 truncate font-display text-base font-bold text-white">
                              {auc.highestBidderName || 'No bids yet'}
                            </p>
                          </div>
                        </div>

                        {!auc.settled && !expired && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            <input
                              type="number"
                              min={minNextBid}
                              value={inputVal}
                              onChange={(e) =>
                                setBidAmounts((p) => ({
                                  ...p,
                                  [auc.id]: e.target.value,
                                }))
                              }
                              className="w-36 rounded-xl border border-[#8b5cf6]/40 bg-[#0b0714] px-3 py-2 font-mono text-sm text-white focus:border-[#fde047] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const amt = Number(inputVal);
                                const err = onPlaceBid(
                                  auc.id,
                                  currentUser.id,
                                  amt
                                );
                                if (err) showMsg(err);
                                else
                                  showMsg(
                                    `Bid of ${amt} XP placed! (+10s added to timer)`
                                  );
                              }}
                              className="flex-1 rounded-xl bg-gradient-to-r from-[#9333ea] to-[#d4af37] px-4 py-2 text-xs font-bold text-white shadow-lg hover:opacity-95 cursor-pointer"
                            >
                              Place Bid (+10s Timer)
                            </button>
                          </div>
                        )}

                        {!auc.settled &&
                          expired &&
                          auc.highestBidderId && (
                            <button
                              type="button"
                              onClick={() => {
                                onSettleAuction(auc.id);
                                showMsg(
                                  `Awarded "${auc.title.name}" to ${auc.highestBidderName}!`
                                );
                              }}
                              className="mt-5 w-full rounded-xl bg-[#d4af37] py-2.5 text-xs font-bold text-[#0b0714] cursor-pointer"
                            >
                              Finalize & Award Title to {auc.highestBidderName}
                            </button>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ================= 4. USERS SUB-TAB ================= */}
          {subTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    Ascension Directory ({users.length})
                  </h2>
                  <p className="text-xs text-[#c4b5fd]">
                    Click any member card to inspect full streak, bio, equipped
                    achievements, and status.
                  </p>
                </div>
                <Users className="h-5 w-5 text-[#d4af37]" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {users.map((u) => {
                  const uRank =
                    ranks.find((r) => r.id === u.rankId) || ranks[ranks.length - 1];
                  const uTitle = titles.find(
                    (t) => t.id === u.equippedTitleId
                  );

                  return (
                    <motion.button
                      key={u.id}
                      type="button"
                      whileHover={{ y: -5 }}
                      onClick={() => setSelectedUserModal(u)}
                      className="group flex flex-col justify-between rounded-2xl border border-[#8b5cf6]/35 bg-[#130c22] p-5 text-left transition-colors hover:border-[#d4af37] cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-[#d4af37]/60 bg-[#1e1236]">
                          {u.photoUrl ? (
                            <img
                              src={u.photoUrl}
                              alt={u.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-[#fde68a]">
                              {u.fullName.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-display text-lg font-bold text-white group-hover:text-[#fde68a]">
                              {u.fullName}
                            </h3>
                            {u.role === 'admin' && (
                              <span className="rounded bg-[#d4af37]/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#fde047]">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <p
                            style={{ color: uRank.color }}
                            className="font-mono text-xs font-semibold"
                          >
                            Level {u.level} · {uRank.name}
                          </p>
                        </div>
                      </div>

                      {(() => {
                        const uMood = getUserMoodMeta(u.mood);
                        if (!uMood) return null;
                        return (
                          <div className="mt-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold ${uMood.chipClass}`}
                            >
                              <span>{uMood.emoji}</span>
                              <span>{uMood.label}</span>
                            </span>
                          </div>
                        );
                      })()}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                        {uTitle ? (
                          <TitleBadge title={uTitle} size="sm" />
                        ) : (
                          <span className="text-xs text-white/40">
                            No title
                          </span>
                        )}
                        <span
                          className={`font-mono text-[11px] ${
                            u.isOnline ? 'text-emerald-300' : 'text-neutral-400'
                          }`}
                        >
                          {u.isOnline ? 'Online' : u.lastLoggedIn}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ================= 5. PROFILE SUB-TAB ================= */}
          {subTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid gap-7 lg:grid-cols-12"
            >
              {/* Editable Fields */}
              <form
                onSubmit={handleProfileSave}
                className="rounded-3xl border border-[#8b5cf6]/35 bg-[#130c22] p-6 lg:col-span-7"
              >
                <h2 className="font-display text-2xl font-bold text-[#fde68a]">
                  Customize Your Profile
                </h2>
                <p className="mt-1 text-xs text-[#c4b5fd]">
                  You can update your photo, bio, favourite topic, equipped
                  title, achievements, and 4–9 digit PIN.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[#d4af37] bg-[#1e1236]">
                      {photoInput ? (
                        <img
                          src={photoInput}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-[#fde68a]">
                          {currentUser.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#1e1236] px-4 py-2 text-xs font-semibold text-[#fde68a]">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#d4cbe8]">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0b0714] px-3.5 py-2.5 text-sm text-white focus:border-[#a855f7] focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[#d4cbe8]">
                        Favourite Topic
                      </label>
                      <input
                        type="text"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0b0714] px-3.5 py-2.5 text-sm text-white focus:border-[#a855f7] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#d4cbe8]">
                        PIN (4–9 Digits)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={9}
                        value={pinInput}
                        onChange={(e) =>
                          setPinInput(
                            e.target.value.replace(/\D/g, '').slice(0, 9)
                          )
                        }
                        className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0b0714] px-3.5 py-2.5 font-mono text-sm text-white focus:border-[#a855f7] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-xs font-medium text-[#d4cbe8]">
                        Current Mood (Optional Profile Chip)
                      </label>
                      {moodInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setMoodInput(null);
                            onUpdateProfile(currentUser.id, { mood: null });
                            showMsg('Mood chip cleared.');
                          }}
                          className="text-[11px] font-medium text-white/55 hover:text-white cursor-pointer"
                        >
                          Clear mood
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {USER_MOOD_OPTIONS.map((m) => {
                        const selected = moodInput === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              const nextMood = selected ? null : m.id;
                              setMoodInput(nextMood);
                              onUpdateProfile(currentUser.id, {
                                mood: nextMood,
                              });
                              showMsg(
                                nextMood
                                  ? `Mood updated to ${m.emoji} ${m.label}.`
                                  : 'Mood chip cleared.'
                              );
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                              selected
                                ? `${m.chipClass} ring-2 ring-[#fde68a]/40`
                                : 'border-white/12 bg-[#0b0714] text-white/75 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            <span>{m.emoji}</span>
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#d4cbe8]">
                      Equipped Title
                    </label>
                    <select
                      value={currentUser.equippedTitleId || ''}
                      onChange={(e) =>
                        onEquipTitle(currentUser.id, e.target.value || null)
                      }
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0b0714] px-3.5 py-2.5 text-sm text-white focus:border-[#a855f7] focus:outline-none"
                    >
                      <option value="">None</option>
                      {currentUser.ownedTitleIds.map((tid) => {
                        const t = titles.find((x) => x.id === tid);
                        if (!t) return null;
                        return (
                          <option key={tid} value={tid}>
                            {t.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#d4af37] px-6 py-3 text-sm font-bold text-white shadow-lg cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>

              {/* Locked Admin-Controlled Records */}
              <div className="rounded-3xl border border-[#881337]/45 bg-[#130c22] p-6 lg:col-span-5">
                <div className="flex items-center gap-2 text-[#fda4af]">
                  <Lock className="h-4 w-4" />
                  <h3 className="font-display text-lg font-bold">
                    Admin-Verified Credentials
                  </h3>
                </div>
                <p className="mt-1 text-xs text-white/60">
                  These core progression fields can only be altered by
                  Administration.
                </p>

                <div className="mt-5 space-y-3 text-sm">
                  {[
                    { label: 'Username', value: `@${currentUser.username}` },
                    { label: 'Date Joined', value: currentUser.createdAt },
                    { label: 'Rank', value: currentRank.name },
                    { label: 'Level', value: `Level ${currentUser.level} (${levelRange.tag})` },
                    { label: 'Total XP', value: `${currentUser.xp.toLocaleString()} XP` },
                    { label: 'Daily Streak', value: `🔥 ${currentUser.streak} days` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                    >
                      <span className="text-xs text-[#c4b5fd]">
                        {item.label}
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= 6. ACHIEVEMENTS SUB-TAB ================= */}
          {subTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Achievements Vault
                </h2>
                <p className="text-xs text-[#c4b5fd]">
                  Achievements are awarded by Admin. Equip up to 2 unlocked
                  achievements to display on your Dashboard and User Card.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.map((ach) => {
                  const unlocked = currentUser.achievementIds.includes(ach.id);
                  const equipped = currentUser.equippedAchievementIds.includes(
                    ach.id
                  );

                  return (
                    <motion.div
                      key={ach.id}
                      whileHover={{ y: -4 }}
                      style={{
                        borderColor: unlocked
                          ? `${ach.accentColor}66`
                          : 'rgba(255,255,255,0.1)',
                      }}
                      className={`flex flex-col justify-between rounded-2xl border p-5 ${
                        unlocked ? 'bg-[#160f28]' : 'bg-[#0f0a19] opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-3xl">{ach.icon}</span>
                          <span className="font-mono text-[11px] font-bold uppercase text-[#fde68a]">
                            {unlocked ? 'UNLOCKED' : 'LOCKED'}
                          </span>
                        </div>
                        <h3 className="mt-3 font-display text-lg font-bold text-white">
                          {ach.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#c4b5fd]">
                          {ach.description}
                        </p>
                      </div>

                      {unlocked && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleEquipAchievement(currentUser.id, ach.id);
                            showMsg(
                              equipped
                                ? `Unequipped "${ach.title}".`
                                : `Equipped "${ach.title}".`
                            );
                          }}
                          className={`mt-5 w-full rounded-xl py-2 text-xs font-bold cursor-pointer ${
                            equipped
                              ? 'border border-[#d4af37] bg-[#d4af37]/20 text-[#fde68a]'
                              : 'bg-[#7c3aed] text-white hover:bg-[#9333ea]'
                          }`}
                        >
                          {equipped ? 'Equipped (Max 2) ✓' : 'Equip Achievement'}
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ================= 7. REPORT CARDS SUB-TAB ================= */}
          {subTab === 'report-cards' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-3xl border border-[#8b5cf6]/35 bg-[#130c22] p-6 sm:p-9"
            >
              <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
                <div>
                  <p className="font-mono text-xs tracking-wider text-[#d4af37] uppercase">
                    Official Academic Assessment · {currentUser.fullName}
                  </p>
                  <h2 className="mt-1 font-display text-3xl font-bold text-white">
                    Report Card
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#c4b5fd]">
                  Updated: {currentUser.reportCard.updatedAt}
                </span>
              </div>

              <div className="mt-8 grid gap-8 lg:grid-cols-12">
                {/* Large Uncongested Report Card Image */}
                <div className="lg:col-span-7">
                  <div className="overflow-hidden rounded-2xl border-2 border-[#d4af37]/40 bg-black">
                    {currentUser.reportCard.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setReportZoomOpen(true)}
                        className="group relative block w-full cursor-pointer"
                      >
                        <img
                          src={currentUser.reportCard.imageUrl}
                          alt={`${currentUser.fullName} Report Card`}
                          referrerPolicy="no-referrer"
                          className="max-h-[480px] w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <span className="absolute bottom-3 right-3 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-medium text-[#fde68a]">
                          Click to Enlarge
                        </span>
                      </button>
                    ) : (
                      <div className="flex h-72 items-center justify-center text-sm text-white/50">
                        No report card photo uploaded by Admin yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Free-Text Summary Fields */}
                <div className="space-y-4 lg:col-span-5">
                  {[
                    { label: 'Grade', val: currentUser.reportCard.grade },
                    {
                      label: 'Presentation',
                      val: currentUser.reportCard.presentation,
                    },
                    {
                      label: 'Total Questions Studied',
                      val: currentUser.reportCard.totalQuestionsStudied,
                    },
                    { label: 'Remarks', val: currentUser.reportCard.remarks },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className="rounded-2xl border border-white/10 bg-[#0b0714] p-4"
                    >
                      <p className="font-mono text-[11px] tracking-wider text-[#d4af37] uppercase">
                        {field.label}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed font-medium text-white">
                        {field.val || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= 8. PAST WINNERS SUB-TAB ================= */}
          {subTab === 'past-winners' && (
            <motion.div
              key="winners"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-3xl border border-[#d4af37]/35 bg-[#120b20] p-6 sm:p-8"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="font-mono text-xs tracking-wider text-[#d4af37] uppercase">
                    Ascension Honor Roll
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                    Past Winners
                  </h2>
                </div>
                <Crown className="h-7 w-7 text-[#d4af37]" />
              </div>

              <div className="mt-6 space-y-3">
                {pastWinners.length === 0 ? (
                  <p className="py-10 text-center text-sm text-white/60">
                    No past winners recorded yet.
                  </p>
                ) : (
                  pastWinners.map((pw, idx) => {
                    const winner = users.find((u) => u.id === pw.userId);
                    return (
                      <motion.div
                        key={pw.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="grid items-center gap-4 rounded-2xl border border-[#d4af37]/25 bg-[#0b0714] p-4 sm:grid-cols-12"
                      >
                        <div className="flex items-center gap-3 sm:col-span-4">
                          <span className="font-mono text-xs font-bold text-[#d4af37]">
                            {idx + 1}.
                          </span>
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[#d4af37]/70 bg-[#1e1236]">
                            {winner?.photoUrl ? (
                              <img
                                src={winner.photoUrl}
                                alt={winner.fullName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-display text-base font-bold text-[#fde68a]">
                                {(winner?.fullName || 'U').charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="truncate font-display text-base font-bold text-white">
                            {winner?.fullName || 'Unknown User'}
                          </span>
                        </div>

                        <div className="sm:col-span-3">
                          <p className="font-mono text-[10px] text-white/50 uppercase">
                            Won
                          </p>
                          <p className="text-sm font-semibold text-[#e9d5ff]">
                            {pw.wonText}
                          </p>
                        </div>

                        <div className="sm:col-span-2">
                          <p className="font-mono text-[10px] text-white/50 uppercase">
                            Prize Got
                          </p>
                          <p className="text-xs font-bold text-[#fde68a]">
                            {pw.prizeGot}
                          </p>
                        </div>

                        <div className="sm:col-span-3">
                          <p className="font-mono text-[10px] text-white/50 uppercase">
                            Reason
                          </p>
                          <p className="text-xs leading-relaxed text-white/80">
                            {pw.reason}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* ================= 9. CERTIFICATES ================= */}
          {subTab === 'certificates' && (
            <motion.div
              key="certificates"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {(() => {
                const myCertificates = certificates
                  .filter((c) => c.userId === currentUser.id)
                  .sort((a, b) => b.updatedAt - a.updatedAt);

                return (
                  <div className="rounded-3xl border border-[#d4af37]/30 bg-[#140d24] p-6 sm:p-8">
                    <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
                      <div>
                        <p className="font-mono text-[11px] tracking-[0.2em] text-[#d4af37] uppercase">
                          Official Credentials Archive
                        </p>
                        <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                          Certificates &amp; Honors
                        </h2>
                        <p className="mt-1 text-xs text-[#d4cbe8]">
                          Signed academic, territorial, and Ascension distinctions issued directly to {currentUser.fullName}.
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#fde68a]">
                        {myCertificates.length} Issued
                      </span>
                    </div>

                    {myCertificates.length === 0 ? (
                      <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-[#0b0714] px-6 py-12 text-center">
                        <Award className="mx-auto h-8 w-8 text-[#d4af37]/60" />
                        <p className="mt-3 font-display text-lg font-semibold text-white">
                          No Certificates Issued Yet
                        </p>
                        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#c4b5fd]/80">
                          When administration awards you a District Honor, Rank Patent, Streak Milestone, or Territory Writ, it will appear here ready for inspection and download.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        {myCertificates.map((cert) => (
                          <div
                            key={cert.id}
                            className="group flex flex-col overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-[#0b0714] p-4 transition-all hover:border-[#d4af37]/70"
                          >
                            <div
                              onClick={() => setZoomedCert(cert)}
                              className="relative cursor-pointer overflow-hidden rounded-xl"
                            >
                              <CertificateRenderer certificate={cert} />
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#d4af37]/60 bg-[#0b0714]/90 px-3.5 py-2 text-xs font-semibold text-[#fde68a]">
                                  <ZoomIn className="h-3.5 w-3.5" />
                                  <span>Inspect Certificate</span>
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
                              <div className="min-w-0">
                                <p className="truncate font-display text-base font-bold text-white">
                                  {cert.titleText}
                                </p>
                                <p className="truncate font-mono text-[11px] text-[#c4b5fd]/80">
                                  {cert.category} · {cert.dateText} · {cert.serialText}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setZoomedCert(cert)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:border-[#d4af37]/50 cursor-pointer"
                                >
                                  <ZoomIn className="h-3.5 w-3.5" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void exportCertificateToPng(cert);
                                    showMsg('Downloading high-resolution PNG certificate...');
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#d4af37] px-3.5 py-1.5 text-xs font-bold text-[#0b0714] hover:bg-[#fde047] cursor-pointer"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Download PNG</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* USER DETAIL POPUP MODAL */}
      <AnimatePresence>
        {selectedUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUserModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl border border-[#8b5cf6]/50 bg-[#120b20] p-6 text-white shadow-2xl"
            >
              {(() => {
                const u = selectedUserModal;
                const uRank =
                  ranks.find((r) => r.id === u.rankId) || ranks[ranks.length - 1];
                const uTitle = titles.find((t) => t.id === u.equippedTitleId);
                return (
                  <>
                    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-[#d4af37] bg-[#1e1236]">
                          {u.photoUrl ? (
                            <img
                              src={u.photoUrl}
                              alt={u.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-[#fde68a]">
                              {u.fullName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-bold">
                            {u.fullName}
                          </h3>
                          <p
                            style={{ color: uRank.color }}
                            className="font-mono text-xs font-semibold"
                          >
                            Level {u.level} · {uRank.name}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUserModal(null)}
                        className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      {(() => {
                        const uMood = getUserMoodMeta(u.mood);
                        if (!uMood) return null;
                        return (
                          <div>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${uMood.chipClass}`}
                            >
                              <span>{uMood.emoji}</span>
                              <span>{uMood.label}</span>
                            </span>
                          </div>
                        );
                      })()}
                      <p className="text-xs italic text-[#fde68a]">
                        {u.tagline}
                      </p>
                      <p className="rounded-xl bg-black/30 p-3 text-xs leading-relaxed text-[#e9d5ff]">
                        {u.bio}
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                          <span className="text-white/55">Streak</span>
                          <p className="mt-1 font-mono font-bold text-amber-300">
                            🔥 {u.streak} days
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                          <span className="text-white/55">Favourite Topic</span>
                          <p className="mt-1 font-semibold text-white">
                            {u.favouriteTopic}
                          </p>
                        </div>
                      </div>

                      {uTitle && (
                        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 p-3">
                          <span className="text-xs text-white/60">
                            Equipped Title
                          </span>
                          <TitleBadge title={uTitle} size="sm" />
                        </div>
                      )}

                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <span className="text-xs text-white/60">
                          Equipped Achievements
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {u.equippedAchievementIds.map((aid) => {
                            const ach = achievements.find((a) => a.id === aid);
                            if (!ach) return null;
                            return (
                              <span
                                key={aid}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/30 bg-[#1e1236] px-2.5 py-1 text-xs text-[#fde68a]"
                              >
                                <Award className="h-3 w-3" />
                                <span>{ach.title}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REPORT CARD IMAGE ZOOM MODAL */}
      <AnimatePresence>
        {reportZoomOpen && currentUser.reportCard.imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setReportZoomOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          >
            <img
              src={currentUser.reportCard.imageUrl}
              alt="Report card enlarged"
              className="max-h-[90vh] max-w-4xl rounded-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CERTIFICATE FULLSCREEN INSPECT MODAL */}
      <AnimatePresence>
        {zoomedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedCert(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#120b20]/95 px-4 py-3 text-white">
                <div>
                  <p className="font-display text-base font-bold text-[#fde68a]">
                    {zoomedCert.titleText}
                  </p>
                  <p className="font-mono text-[11px] text-[#c4b5fd]">
                    Issued to {zoomedCert.recipientName} · {zoomedCert.serialText}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void exportCertificateToPng(zoomedCert)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#0b0714] hover:bg-[#fde047] cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomedCert(null)}
                    className="rounded-xl border border-white/15 p-2 text-white/75 hover:bg-white/10 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <CertificateRenderer
                certificate={zoomedCert}
                className="rounded-2xl border border-[#d4af37]/40"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WEEKLY END-OF-WEEK SUMMARY MODAL */}
      <WeeklySummaryModal
        open={weeklyModalOpen}
        currentUser={currentUser}
        currentRank={currentRank}
        tracker={weeklyTracker}
        initialFocusWeekIso={weeklyFocusIso}
        onClose={(acknowledgedWeekIso) => {
          setWeeklyModalOpen(false);
          onDismissWeeklySummary(currentUser.id, acknowledgedWeekIso);
        }}
      />
    </div>
  );
}
