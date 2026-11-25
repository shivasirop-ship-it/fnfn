export type UserRole = 'admin' | 'member';

export type QuizPosition =
  | '1st'
  | '2nd'
  | '3rd'
  | '4th'
  | '5th'
  | '6th'
  | 'Not Qualified';

export interface QuizRecord {
  id: string;
  quizName: string;
  yearBS: string;
  position: QuizPosition;
  host: string;
  players: string[];
  teamCount: number;
  rating: number;
  playerRatings?: Record<string, number>;
  extraNote: string;
  photos: string[];
  createdAt: number; // timestamp for tie-breaker priority
}

export interface GalleryPhoto {
  id: string;
  quizName: string;
  yearBS: string;
  host: string;
  caption: string;
  imageUrl: string;
}

export interface IntroSettings {
  establishedDate: string;
  founderName: string;
  founderPhotoUrl: string | null;
  aboutHeadline: string;
  aboutText: string;
  missionLine: string;
}

export interface StandingRow {
  player: string;
  first: number;
  second: number;
  third: number;
  fourth: number;
  fifth: number;
  sixth: number;
  totalQuizzes: number;
  qualified: number;
  notQualified: number;
  points: number;
  earliestDate: number;
}

/* ================= ASCENSION PATH ================= */

export type TitleAnimationType =
  | 'none'
  | 'shimmer'
  | 'pulse-glow'
  | 'float'
  | 'neon-aura'
  | 'gradient-sweep';

export interface TitleItem {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  animation: TitleAnimationType;
  isShopItem: boolean;
  priceXp: number;
  description: string;
}

export interface RankDef {
  id: string;
  name: string;
  order: number;
  color: string;
  bgTint: string;
  emblem: string;
}

export interface LevelRange {
  id: string;
  startLevel: number;
  endLevel: number;
  tag: string;
  color: string;
  bgColor: string;
  baseXp: number;
  growthPercent: number;
}

export interface StreakBand {
  id: string;
  minDays: number;
  maxDays: number;
  label: string;
  message: string;
  color: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
}

export interface ReportCardData {
  imageUrl: string | null;
  grade: string;
  presentation: string;
  totalQuestionsStudied: string;
  remarks: string;
  updatedAt: string;
}

export interface AuctionBid {
  userId: string;
  username: string;
  fullName: string;
  amount: number;
  timestamp: number;
}

export interface AuctionItem {
  id: string;
  title: TitleItem;
  startingBid: number;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  endsAt: number;
  settled: boolean;
  bids: AuctionBid[];
}

export interface PastWinnerRecord {
  id: string;
  userId: string;
  wonText: string;
  prizeGot: string;
  reason: string;
}

export interface DqrUser {
  id: string;
  username: string;
  pin: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  photoUrl: string | null;
  bio: string;
  favouriteTopic: string;
  isOnline: boolean;
  lastLoggedIn: string;
  xp: number;
  level: number;
  rankId: string;
  streak: number;
  tagline: string;
  announcement: string;
  announcementChecked: boolean;
  ownedTitleIds: string[];
  equippedTitleId: string | null;
  achievementIds: string[];
  equippedAchievementIds: string[]; // max 2
  reportCard: ReportCardData;
  mood?: string | null;
}

export interface UserMoodOption {
  id: string;
  emoji: string;
  label: string;
  chipClass: string;
}

/* ================= TERRITORIES ================= */

export interface TerritoryQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export interface TerritoryHistoryEntry {
  id: string;
  holderUserId: string;
  holderName: string;
  score: number;
  totalQuestions: number;
  dateLabel: string;
  submittedAt?: number;
  completionSeconds?: number;
  result: 'Current' | 'Defeated';
}

export interface Territory {
  id: string;
  code: string; // e.g. TERRITORY #01
  name: string;
  description: string;
  iconType: 'citadel' | 'observatory' | 'sanctum' | 'spire' | 'bastion' | 'vault';
  customIconUrl: string | null;
  durationMinutes: number;
  currentHolderUserId: string | null;
  currentHolderName: string | null;
  highestScore: number;
  wonOn: string | null;
  questions: TerritoryQuestion[];
  history: TerritoryHistoryEntry[];
  attemptedUserIds: string[]; // locked until admin resets cooldown for user
}

/* ================= NEWSPAPER ================= */

export interface NewspaperEdition {
  masthead: string;
  volumeLabel: string;
  dateLabel: string;
  headline: string;
  subheadline: string;
  leadAuthor: string;
  leadBody: string;
  sideTitle: string;
  sideBody: string;
  quoteText: string;
  quoteAuthor: string;
  featuredImageUrl: string;
  paperBg: string;
  inkColor: string;
  accentColor: string;
}

export interface ArchivedNewspaperEdition extends NewspaperEdition {
  id: string;
  archivedAt: number;
}

/* ================= SYSTEM ================= */

export type SystemPredictionCategory =
  | 'Rank Projection'
  | 'Leaderboard Forecast'
  | 'Territorial Forecast'
  | 'Performance Prediction'
  | 'Competition Forecast'
  | 'Special Prediction';

export type ConfidenceLevel =
  | 'LOW CONFIDENCE'
  | 'MODERATE CONFIDENCE'
  | 'HIGH CONFIDENCE';

export interface SystemPrediction {
  id: string;
  title: string;
  category: SystemPredictionCategory;
  preview: string;
  fullText: string;
  confidence: ConfidenceLevel;
  publishedAt: string;
  expiresAt: string | null;
  targetUserId: string | 'all';
  published: boolean;
}

export interface SystemGuidanceItem {
  id: string;
  title: string;
  explanation: string;
  recommendedAction: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  targetUserId: string; // strictly unique per user
}

export interface SystemChallenge {
  id: string;
  title: string;
  description: string;
  category: 'Individual' | 'Competitive' | 'Territorial';
  difficulty: 'D-Rank' | 'B-Rank' | 'A-Rank' | 'S-Rank';
  rewardXp: number;
  deadline: string;
  requirementText: string;
  targetUserId: string | 'all'; // user-based OR global
  status: 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  progressCurrent: number;
  progressTarget: number;
  completedByUserIds: string[];
}

export type ChallengeClaimStatus = 'pending' | 'approved' | 'rejected';

export interface ChallengeClaimRequest {
  id: string;
  challengeId: string;
  userId: string;
  submittedAt: number;
  note?: string;
  status: ChallengeClaimStatus;
  reviewedAt?: number;
  reviewedByUserId?: string;
  adminNote?: string;
}

export type VerdictClassification = string;

export interface VerdictRecord {
  userId: string;
  classification: VerdictClassification;
  description: string;
  assignedDate: string;
  status: string;
  performanceCharacteristics: string;
  strongestAttribute: string;
  biggestWeakness: string;
  competitiveTendencies: string;
  history: { classification: VerdictClassification; assignedDate: string }[];
}

export interface SystemMessage {
  id: string;
  userId: string;
  sender: 'system' | 'user';
  text: string;
  createdAt: number;
  readByAdmin: boolean;
  readByUser: boolean;
}

export interface UserGuidanceProfile {
  strategicAdvice: string;
  nextObjective: string;
}

export interface SystemConfig {
  welcomeTemplate: string;
  welcomeTemplates: string[];
  globalAnnouncement: string;
  perUserGuidance: Record<string, UserGuidanceProfile>;
  customVerdictPresets: string[];
  online: boolean;
}

export type MainTab =
  | 'home'
  | 'about'
  | 'hall-of-fame'
  | 'ascension'
  | 'territories'
  | 'newspaper'
  | 'system'
  | 'extra-enjoy'
  | 'admin';

export type AnonQuestionCategory =
  | 'General'
  | 'Quiz Prep'
  | 'Study Tips'
  | 'Exam Stress'
  | 'Club Suggestion'
  | 'Personal / Advice';

export interface AnonymousQuestion {
  id: string;
  question: string;
  category: AnonQuestionCategory;
  createdAt: number;
  adminReply: string | null;
  repliedAt: number | null;
  upvotes: number;
  pinned: boolean;
}

export type UserQuoteStatus = 'pending' | 'approved' | 'rejected';

export type UserQuoteTag =
  | 'Study Wisdom'
  | 'Exam Mindset'
  | 'Resilience'
  | 'Life Lesson'
  | 'General';

export type UserQuoteReactionKey = 'needed' | 'inspiring' | 'wise';

export interface DailyUserQuote {
  id: string;
  text: string;
  tag?: UserQuoteTag;
  createdAt: number;
  status: UserQuoteStatus;
  reviewedAt?: number | null;
  featured?: boolean;
  reactions?: Record<UserQuoteReactionKey, number>;
  reactedBy?: Record<string, UserQuoteReactionKey[]>;
}

export type HofSubTab = 'gallery' | 'standings' | 'external-wins' | 'synergy';
export type AscensionSubTab =
  | 'dashboard'
  | 'passport'
  | 'shop'
  | 'auction'
  | 'users'
  | 'profile'
  | 'achievements'
  | 'report-cards'
  | 'past-winners'
  | 'certificates';

/* ================= CERTIFICATES ================= */

export type CertificateBorderStyle =
  | 'imperial-double'
  | 'ornate-filigree'
  | 'architectural-hairline'
  | 'art-deco'
  | 'royal-crest'
  | 'parchment-framed';

export type CertificateSealStyle =
  | 'gold-foil'
  | 'wax-stamp'
  | 'laurel-wreath'
  | 'crown-crest'
  | 'minimal-monogram'
  | 'none';

export type CertificateSignatureMode = 'text' | 'drawn' | 'none';

export interface CertificateTypographyConfig {
  titleFont: string;
  recipientFont: string;
  bodyFont: string;
  metaFont: string;
  titleScale: number; // 0.8 - 1.35
  recipientScale: number; // 0.8 - 1.35
  bodyScale: number; // 0.85 - 1.25
  uppercaseTitle: boolean;
}

export interface CertificatePaletteConfig {
  bgPrimary: string;
  bgSecondary: string;
  borderColor: string;
  accentColor: string;
  titleColor: string;
  recipientColor: string;
  textColor: string;
  sealColor: string;
}

export interface CertificateSignatureConfig {
  enabled: boolean;
  mode: CertificateSignatureMode;
  signatureText: string;
  signatureFont: string;
  signatureColor: string;
  drawnDataUrl: string | null;
  signatoryName: string;
  signatoryRole: string;
  secondaryEnabled: boolean;
  secondarySignatureText: string;
  secondarySignatoryName: string;
  secondarySignatoryRole: string;
}

export interface CertificateRecord {
  id: string;
  userId: string;
  presetId: string;
  presetName: string;
  category: string;
  institutionText: string;
  ribbonText: string;
  titleText: string;
  subtitleText: string;
  recipientName: string;
  bodyText: string;
  achievementText: string;
  dateText: string;
  serialText: string;
  sealStyle: CertificateSealStyle;
  sealInitials: string;
  sealCaption: string;
  borderStyle: CertificateBorderStyle;
  palette: CertificatePaletteConfig;
  typography: CertificateTypographyConfig;
  signature: CertificateSignatureConfig;
  createdAt: number;
  updatedAt: number;
}

export interface CertificatePreset {
  id: string;
  name: string;
  category: string;
  institutionText: string;
  ribbonText: string;
  titleText: string;
  subtitleText: string;
  bodyText: string;
  achievementText: string;
  sealStyle: CertificateSealStyle;
  sealInitials: string;
  sealCaption: string;
  borderStyle: CertificateBorderStyle;
  palette: CertificatePaletteConfig;
  typography: CertificateTypographyConfig;
  signatureDefaults: {
    signatureText: string;
    signatureFont: string;
    signatoryName: string;
    signatoryRole: string;
  };
}
export type SystemSubTab =
  | 'overview'
  | 'communication'
  | 'predictions'
  | 'guidance'
  | 'challenges'
  | 'verdict'
  | 'rival'
  | 'duel';

/* ================= RIVAL ================= */

export type RivalStatus =
  | 'pending'
  | 'active'
  | 'declined'
  | 'cancelled'
  | 'ended';

export type RivalHistoryEventType =
  | 'started'
  | 'xp'
  | 'territory'
  | 'streak'
  | 'questions'
  | 'challenge'
  | 'rank'
  | 'ended';

export interface RivalHistoryEvent {
  id: string;
  timestamp: number;
  dateLabel: string;
  type: RivalHistoryEventType;
  actorUserId?: string;
  title: string;
  detail: string;
}

export interface RivalStatsSnapshot {
  territories: number;
  xpEarned: number;
  streak: number;
  questions: number;
  rankId: string;
}

export interface RivalRecord {
  id: string;
  requesterId: string;
  recipientId: string;
  status: RivalStatus;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  requesterEarnedXp: number;
  recipientEarnedXp: number;
  baselineStats?: {
    requester: RivalStatsSnapshot;
    recipient: RivalStatsSnapshot;
  };
  finalStats?: {
    requester: RivalStatsSnapshot;
    recipient: RivalStatsSnapshot;
  };
  history: RivalHistoryEvent[];
}

/* ================= 1V1 DUEL SYSTEM ================= */

export type DuelDifficulty = 'easy' | 'medium' | 'hard';

export type DuelQuestionStatus = 'approved' | 'pending' | 'rejected';

export interface DuelQuestion {
  id: string;
  topic: string;
  subtopic?: string;
  difficulty: DuelDifficulty;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  status: DuelQuestionStatus;
  isActive: boolean;
  timesUsed: number;
  lastUsedAt: number | null;
  recentlySeenBy: string[];
  flaggedCount: number;
  flaggedReasons?: string[];
  flaggedByUserIds?: string[];
  createdAt: number;
}

export interface DuelConfig {
  topics: string[];
  secondsPerQuestion: number;
  wagerXp: number;
}

export type DuelStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'cancelled';

export interface DuelParticipantProgress {
  userId: string;
  currentIndex: number;
  answers: Record<string, number>;
  questionTimesMs: Record<string, number>;
  correctCount: number;
  totalTimeMs: number;
  submitted: boolean;
  submittedAt: number | null;
  autoSubmittedReason?: 'completed' | 'timeout' | 'tab-switch' | 'window-blur' | 'exit';
}

export interface DuelMatch {
  id: string;
  challengerId: string;
  opponentId: string;
  topic: string;
  status: DuelStatus;
  createdAt: number;
  expiresAt: number;
  startedAt: number | null;
  questionIds: string[];
  secondsPerQuestion: number;
  wagerXp: number;
  challengerProgress: DuelParticipantProgress;
  opponentProgress: DuelParticipantProgress;
  winnerId: string | 'draw' | null;
  xpTransferred: number;
  settledAt: number | null;
}

/* ================= WEEKLY DASHBOARD SUMMARY ================= */

export interface UserWeeklySummary {
  weekStartIso: string;
  weekLabel: string;
  xpEarned: number;
  startQuestions: number;
  currentQuestions: number;
  startStreak: number;
  currentStreak: number;
  startTerritories: number;
  territoriesAcquired: number;
  currentTerritories: number;
  dismissedEndOfWeek: boolean;
}

export interface UserWeeklyTracker {
  activeWeek: UserWeeklySummary;
  completedWeeks: UserWeeklySummary[];
}

export type AdminSubTab =
  | 'introduction'
  | 'hall-of-fame'
  | 'ascension'
  | 'territories'
  | 'newspaper'
  | 'system'
  | 'duel-bank'
  | 'users';

