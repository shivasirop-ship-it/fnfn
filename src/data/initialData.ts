import {
  AuctionItem,
  DqrUser,
  GalleryPhoto,
  IntroSettings,
  NewspaperEdition,
  PastWinnerRecord,
  QuizPosition,
  QuizRecord,
  StandingRow,
  SystemChallenge,
  SystemConfig,
  SystemGuidanceItem,
  SystemMessage,
  SystemPrediction,
  Territory,
  VerdictRecord,
} from '../types';

export const WHATSAPP_NUMBER = '9864563116';
export const WHATSAPP_URL = 'https://wa.me/9779864563116';

export const POSITION_OPTIONS: QuizPosition[] = [
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  'Not Qualified',
];

export const POSITION_POINTS: Record<QuizPosition, number> = {
  '1st': 6,
  '2nd': 5,
  '3rd': 4,
  '4th': 3,
  '5th': 2,
  '6th': 1,
  'Not Qualified': 0,
};

export const INITIAL_USERS: DqrUser[] = [
  {
    id: 'usr-admin-1',
    username: 'dijan',
    pin: '202606',
    fullName: 'Dijan Bhattarai',
    role: 'admin',
    createdAt: '2026-06-05',
    photoUrl: null,
    bio: 'Founder of DQR. Focused on disciplined daily recall across World History, Science, and Literature.',
    favouriteTopic: 'World History & Geopolitics',
    isOnline: true,
    lastLoggedIn: 'Online now',
    xp: 4850,
    level: 14,
    rankId: 'rk-supreme',
    streak: 42,
    tagline: "Master Dijan's Tagline — Compounding small wins every morning.",
    announcement: 'District Inter-School Qualifier prep begins Monday at 6:30 PM.',
    announcementChecked: false,
    ownedTitleIds: ['ttl-preset-1', 'ttl-preset-2', 'ttl-preset-6', 'ttl-preset-41'],
    equippedTitleId: 'ttl-preset-1',
    achievementIds: ['ach-1', 'ach-2', 'ach-3', 'ach-4', 'ach-5'],
    equippedAchievementIds: ['ach-3', 'ach-4'],
    reportCard: {
      imageUrl: '/src/assets/images/quiz_trophy_ceremony_1795329638334.jpg',
      grade: 'A+ (Supreme Distinction)',
      presentation: '9.8 / 10 — Crisp stage composure & rapid buzzer timing',
      totalQuestionsStudied: '1,420 Questions',
      remarks: 'Consistent high-accuracy performance under tie-breaker pressure.',
      updatedAt: '2082 B.S.',
    },
  },
  {
    id: 'usr-member-1',
    username: 'aarav',
    pin: '1234',
    fullName: 'Aarav Sharma',
    role: 'member',
    createdAt: '2026-06-05',
    photoUrl: null,
    bio: 'Science Olympiad finalist and daily DQR quizzer targeting Special Grade.',
    favouriteTopic: 'Astrophysics & Contemporary Science',
    isOnline: true,
    lastLoggedIn: 'Online now',
    xp: 2350,
    level: 7,
    rankId: 'rk-special',
    streak: 18,
    tagline: 'Precision beats speed when both are trained daily.',
    announcement: 'You have been cleared to challenge Territory #02.',
    announcementChecked: false,
    ownedTitleIds: ['ttl-preset-3', 'ttl-preset-8'],
    equippedTitleId: 'ttl-preset-3',
    achievementIds: ['ach-1', 'ach-2', 'ach-3'],
    equippedAchievementIds: ['ach-2', 'ach-3'],
    reportCard: {
      imageUrl: '/src/assets/images/quiz_science_olympiad_1795329638611.jpg',
      grade: 'A (Honors)',
      presentation: '9.1 / 10 — Clear team articulation',
      totalQuestionsStudied: '860 Questions',
      remarks: 'Strongest in STEM rounds; focus next month on Nepali Literature.',
      updatedAt: '2082 B.S.',
    },
  },
  {
    id: 'usr-member-2',
    username: 'sujata',
    pin: '4567',
    fullName: 'Sujata Adhikari',
    role: 'member',
    createdAt: '2026-06-05',
    photoUrl: null,
    bio: 'Literature & Heritage quiz specialist. Steady streaks, calm execution.',
    favouriteTopic: 'Literature & Cultural Heritage',
    isOnline: false,
    lastLoggedIn: '2 hours ago',
    xp: 1620,
    level: 4,
    rankId: 'rk-semi-special',
    streak: 11,
    tagline: 'Quiet consistency builds unstoppable momentum.',
    announcement: 'New System Challenges open for claim & verification.',
    announcementChecked: false,
    ownedTitleIds: ['ttl-preset-4', 'ttl-preset-12'],
    equippedTitleId: 'ttl-preset-4',
    achievementIds: ['ach-1', 'ach-2'],
    equippedAchievementIds: ['ach-1', 'ach-2'],
    reportCard: {
      imageUrl: '/src/assets/images/quiz_inter_school_finals_1795329640095.jpg',
      grade: 'A- (Merit)',
      presentation: '8.9 / 10 — Measured confidence',
      totalQuestionsStudied: '640 Questions',
      remarks: 'Excellent recall in humanities; sharpen rapid-fire math speed.',
      updatedAt: '2082 B.S.',
    },
  },
];

export const INITIAL_INTRO_SETTINGS: IntroSettings = {
  establishedDate: 'June 5, 2026',
  founderName: 'Dijan Bhattarai',
  founderPhotoUrl: null,
  aboutHeadline: 'Built for steady minds, not last-minute cramming.',
  aboutText:
    'DQR — Dijan Quiz Rankings — was created to transform academic preparation into a calm, daily ritual. Instead of cramming volumes before an exam or competition, students dedicate a few focused minutes each day to sharpen recall, track real progress, and rise through structured rankings.',
  missionLine:
    'A few intentional minutes every single day compound into championship readiness.',
};

export const INITIAL_BS_YEARS: string[] = ['2079', '2080', '2081', '2082'];

export const INITIAL_QUIZZES: QuizRecord[] = [
  {
    id: 'qz-2082-1',
    quizName: 'District Inter-School Grand Championship',
    yearBS: '2082',
    position: '1st',
    host: 'District Education Council',
    players: ['Dijan Bhattarai', 'Aarav Sharma', 'Sujata Adhikari'],
    teamCount: 28,
    rating: 10,
    extraNote:
      'Swept the rapid-fire buzzer round with 100% accuracy in World History & Contemporary Science to clinch the district gold trophy.',
    photos: [
      '/src/assets/images/quiz_district_championship_1795329636968.jpg',
      '/src/assets/images/quiz_trophy_ceremony_1795329638334.jpg',
    ],
    createdAt: 1790000800000,
  },
  {
    id: 'qz-2082-2',
    quizName: 'Valley Heritage & Literature Bowl',
    yearBS: '2082',
    position: '2nd',
    host: 'Patan Academic Forum',
    players: ['Dijan Bhattarai', 'Prashant Karki'],
    teamCount: 22,
    rating: 9,
    extraNote:
      'Finished two points behind first place after an intense tie-breaker round on classical Nepali & global literature.',
    photos: ['/src/assets/images/quiz_inter_school_finals_1795329640095.jpg'],
    createdAt: 1790000700000,
  },
  {
    id: 'qz-2081-1',
    quizName: 'Regional Science & Knowledge Olympiad',
    yearBS: '2081',
    position: '1st',
    host: 'Nepal Youth Science Circle',
    players: ['Dijan Bhattarai', 'Aarav Sharma', 'Nischal Thapa'],
    teamCount: 32,
    rating: 10,
    extraNote:
      'Undefeated from preliminary heats through the stage finals; commended by the jury for analytical speed.',
    photos: ['/src/assets/images/quiz_science_olympiad_1795329638611.jpg'],
    createdAt: 1790000600000,
  },
  {
    id: 'qz-2081-2',
    quizName: 'Mayor Cup District Quiz Invitational',
    yearBS: '2081',
    position: '3rd',
    host: 'Metropolitan Youth Desk',
    players: ['Aarav Sharma', 'Sujata Adhikari', 'Riya Gurung'],
    teamCount: 24,
    rating: 8,
    extraNote:
      'Secured podium bronze after mounting a dramatic fourth-round comeback in civic geography.',
    photos: ['/src/assets/images/quiz_inter_school_finals_1795329640095.jpg'],
    createdAt: 1790000500000,
  },
  {
    id: 'qz-2080-1',
    quizName: 'National Founders Memorial Quiz',
    yearBS: '2080',
    position: '1st',
    host: 'Lalitpur Scholars Guild',
    players: ['Dijan Bhattarai', 'Sujata Adhikari'],
    teamCount: 18,
    rating: 9,
    extraNote:
      'First major district title together; set the benchmark for daily structured quiz prep.',
    photos: ['/src/assets/images/quiz_trophy_ceremony_1795329638334.jpg'],
    createdAt: 1790000400000,
  },
  {
    id: 'qz-2080-2',
    quizName: 'Himalayan General Knowledge Conclave',
    yearBS: '2080',
    position: '4th',
    host: 'Central Valley Quiz Society',
    players: ['Prashant Karki', 'Nischal Thapa', 'Riya Gurung'],
    teamCount: 26,
    rating: 7,
    extraNote:
      'Strong semifinal run against senior college teams; valuable experience under timed audio-visual rounds.',
    photos: [],
    createdAt: 1790000300000,
  },
  {
    id: 'qz-2079-1',
    quizName: 'District Junior Mastery Challenge',
    yearBS: '2079',
    position: '2nd',
    host: 'District Education Council',
    players: ['Dijan Bhattarai', 'Prashant Karki', 'Aarav Sharma'],
    teamCount: 20,
    rating: 8,
    extraNote:
      'Our debut district finals appearance — sparked the discipline behind DQR.',
    photos: ['/src/assets/images/quiz_district_championship_1795329636968.jpg'],
    createdAt: 1790000200000,
  },
  {
    id: 'qz-2079-2',
    quizName: 'Autumn Inter-Academy Open',
    yearBS: '2079',
    position: 'Not Qualified',
    host: 'Eastern Valley Schools Union',
    players: ['Nischal Thapa', 'Riya Gurung'],
    teamCount: 30,
    rating: 6,
    extraNote:
      'Missed the top-6 cut in the written qualifier by a single mark — an important milestone that shaped future drills.',
    photos: [],
    createdAt: 1790000100000,
  },
];

export const INITIAL_GALLERY: GalleryPhoto[] = [
  {
    id: 'gal-1',
    quizName: 'District Inter-School Grand Championship',
    yearBS: '2082',
    host: 'District Education Council',
    caption: 'Stage finals buzzer duel during Round 3: World History.',
    imageUrl: '/src/assets/images/quiz_district_championship_1795329636968.jpg',
  },
  {
    id: 'gal-2',
    quizName: 'District Inter-School Grand Championship',
    yearBS: '2082',
    host: 'District Education Council',
    caption: 'The District Academic Championship Gold Trophy before presentation.',
    imageUrl: '/src/assets/images/quiz_trophy_ceremony_1795329638334.jpg',
  },
  {
    id: 'gal-3',
    quizName: 'Valley Heritage & Literature Bowl',
    yearBS: '2082',
    host: 'Patan Academic Forum',
    caption: 'Four-team finals hall during the tie-breaker questioning.',
    imageUrl: '/src/assets/images/quiz_inter_school_finals_1795329640095.jpg',
  },
  {
    id: 'gal-4',
    quizName: 'Regional Science & Knowledge Olympiad',
    yearBS: '2081',
    host: 'Nepal Youth Science Circle',
    caption: 'Conferring over analytical notes before locking in the final answer.',
    imageUrl: '/src/assets/images/quiz_science_olympiad_1795329638611.jpg',
  },
];

export type StandingsSortMode =
  | 'points'
  | 'most-1st'
  | 'most-2nd'
  | 'most-3rd'
  | 'most-4th'
  | 'most-5th'
  | 'most-6th'
  | 'most-quizzes';

/**
 * Custom alphabetical comparator where 'D' gets first priority,
 * followed by 'A', 'B', 'C', 'E', 'F', ..., 'Z'.
 */
export function compareDFirst(nameA: string, nameB: string): number {
  const rankChar = (ch: string): number => {
    const upper = ch.toUpperCase();
    if (upper === 'D') return 0;
    if (upper >= 'A' && upper <= 'C') return upper.charCodeAt(0) - 64; // A=1, B=2, C=3
    if (upper >= 'E' && upper <= 'Z') return upper.charCodeAt(0) - 65; // E=4, F=5...
    return 100 + upper.charCodeAt(0);
  };

  const a = nameA.trim();
  const b = nameB.trim();
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const rA = rankChar(a[i]);
    const rB = rankChar(b[i]);
    if (rA !== rB) return rA - rB;
  }
  return a.length - b.length;
}

export function computeStandings(
  quizzes: QuizRecord[],
  yearFilter: string = 'all',
  sortBy: StandingsSortMode = 'points'
): StandingRow[] {
  const filtered =
    yearFilter === 'all'
      ? quizzes
      : quizzes.filter((q) => q.yearBS === yearFilter);

  const map = new Map<string, StandingRow>();

  for (const quiz of filtered) {
    const pts = POSITION_POINTS[quiz.position] ?? 0;
    const dateVal = quiz.createdAt || 0;

    for (const rawPlayer of quiz.players) {
      const player = rawPlayer.trim();
      if (!player) continue;
      if (!map.has(player)) {
        map.set(player, {
          player,
          first: 0,
          second: 0,
          third: 0,
          fourth: 0,
          fifth: 0,
          sixth: 0,
          totalQuizzes: 0,
          qualified: 0,
          notQualified: 0,
          points: 0,
          earliestDate: dateVal,
        });
      }
      const row = map.get(player)!;
      row.totalQuizzes += 1;
      row.points += pts;
      if (dateVal > 0 && (row.earliestDate === 0 || dateVal < row.earliestDate)) {
        row.earliestDate = dateVal;
      }

      if (quiz.position === 'Not Qualified') {
        row.notQualified += 1;
      } else {
        row.qualified += 1;
      }

      switch (quiz.position) {
        case '1st':
          row.first += 1;
          break;
        case '2nd':
          row.second += 1;
          break;
        case '3rd':
          row.third += 1;
          break;
        case '4th':
          row.fourth += 1;
          break;
        case '5th':
          row.fifth += 1;
          break;
        case '6th':
          row.sixth += 1;
          break;
      }
    }
  }

  const rows = Array.from(map.values());

  rows.sort((a, b) => {
    switch (sortBy) {
      case 'most-1st':
        if (b.first !== a.first) return b.first - a.first;
        break;
      case 'most-2nd':
        if (b.second !== a.second) return b.second - a.second;
        break;
      case 'most-3rd':
        if (b.third !== a.third) return b.third - a.third;
        break;
      case 'most-4th':
        if (b.fourth !== a.fourth) return b.fourth - a.fourth;
        break;
      case 'most-5th':
        if (b.fifth !== a.fifth) return b.fifth - a.fifth;
        break;
      case 'most-6th':
        if (b.sixth !== a.sixth) return b.sixth - a.sixth;
        break;
      case 'most-quizzes':
        if (b.totalQuizzes !== a.totalQuizzes)
          return b.totalQuizzes - a.totalQuizzes;
        break;
    }
    // Priority 1: Highest points
    if (b.points !== a.points) return b.points - a.points;
    // Priority 2: Oldest 1st quiz played (earliest timestamp first)
    if (a.earliestDate !== b.earliestDate) return a.earliestDate - b.earliestDate;
    // Priority 3: Custom alphabetical priority ('D' first, then 'A', 'B', 'C', 'E'...)
    return compareDFirst(a.player, b.player);
  });

  return rows;
}

/* ================= INITIAL AUCTIONS & PAST WINNERS ================= */

export const INITIAL_AUCTIONS: AuctionItem[] = [
  {
    id: 'auc-1',
    title: {
      id: 'ttl-auc-sovereign',
      name: 'Sovereign of the Eclipse',
      bgColor: '#24073B',
      textColor: '#FDE047',
      borderColor: '#A855F7',
      animation: 'gradient-sweep',
      isShopItem: false,
      priceXp: 0,
      description: 'Limited-edition Auction Title forged for apex challengers.',
    },
    startingBid: 600,
    currentBid: 850,
    highestBidderId: 'usr-member-1',
    highestBidderName: 'Aarav Sharma',
    endsAt: Date.now() + 1000 * 60 * 60 * 18, // 18 hours from load
    settled: false,
    bids: [
      {
        userId: 'usr-member-2',
        username: 'sujata',
        fullName: 'Sujata Adhikari',
        amount: 650,
        timestamp: Date.now() - 3600000,
      },
      {
        userId: 'usr-member-1',
        username: 'aarav',
        fullName: 'Aarav Sharma',
        amount: 850,
        timestamp: Date.now() - 1800000,
      },
    ],
  },
];

export const INITIAL_PAST_WINNERS: PastWinnerRecord[] = [
  {
    id: 'pw-1',
    userId: 'usr-admin-1',
    wonText: 'Season I Supreme Ascension',
    prizeGot: 'Title: Shadow Monarch + 1,000 XP',
    reason: 'Ranked #1 across 4 consecutive district tournaments with a 42-day streak.',
  },
  {
    id: 'pw-2',
    userId: 'usr-member-1',
    wonText: 'Winter Rapid-Fire Showdown',
    prizeGot: 'Title: Golden Tactician + 500 XP',
    reason: 'Highest buzzer accuracy in Regional Science & Knowledge Olympiad.',
  },
];

/* ================= INITIAL TERRITORIES ================= */

export const INITIAL_TERRITORIES: Territory[] = [
  {
    id: 'ter-1',
    code: 'TERRITORY #01',
    name: 'The Shadow Citadel',
    description: 'A territory controlled by the strongest all-around challenger across World History & General Knowledge.',
    iconType: 'citadel',
    customIconUrl: null,
    durationMinutes: 10,
    currentHolderUserId: 'usr-admin-1',
    currentHolderName: 'Dijan Bhattarai',
    highestScore: 9,
    wonOn: '18 November',
    attemptedUserIds: [],
    history: [
      { id: 'th-1', holderUserId: 'usr-admin-1', holderName: 'Dijan Bhattarai', score: 9, totalQuestions: 10, dateLabel: '18 Nov', result: 'Current' },
      { id: 'th-2', holderUserId: 'usr-member-1', holderName: 'Aarav Sharma', score: 8, totalQuestions: 10, dateLabel: '12 Nov', result: 'Defeated' },
      { id: 'th-3', holderUserId: 'usr-member-2', holderName: 'Sujata Adhikari', score: 6, totalQuestions: 10, dateLabel: '04 Nov', result: 'Defeated' },
    ],
    questions: [
      { id: 'q1', question: 'Which ancient civilization built the city of Machu Picchu?', options: ['Maya', 'Aztec', 'Inca', 'Olmec'], correctIndex: 2 },
      { id: 'q2', question: 'What is the chemical symbol for Tungsten?', options: ['Tu', 'Tg', 'W', 'Tn'], correctIndex: 2 },
      { id: 'q3', question: 'Who wrote the philosophical work "The Republic"?', options: ['Aristotle', 'Plato', 'Socrates', 'Seneca'], correctIndex: 1 },
      { id: 'q4', question: 'Which river passes through the greatest number of countries?', options: ['Nile', 'Amazon', 'Danube', 'Mekong'], correctIndex: 2 },
      { id: 'q5', question: 'In what year did the Berlin Wall fall?', options: ['1987', '1989', '1991', '1993'], correctIndex: 1 },
      { id: 'q6', question: 'Which planet has the most prominent ring system?', options: ['Uranus', 'Jupiter', 'Saturn', 'Neptune'], correctIndex: 2 },
      { id: 'q7', question: 'Who was the first woman to win a Nobel Prize?', options: ['Rosalind Franklin', 'Marie Curie', 'Ada Lovelace', 'Jane Addams'], correctIndex: 1 },
      { id: 'q8', question: 'What is the capital city of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correctIndex: 2 },
      { id: 'q9', question: 'Which mountain range separates Europe from Asia?', options: ['Alps', 'Caucasus', 'Ural Mountains', 'Carpathians'], correctIndex: 2 },
      { id: 'q10', question: 'What is the SI unit of electrical resistance?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], correctIndex: 2 },
    ],
  },
  {
    id: 'ter-2',
    code: 'TERRITORY #02',
    name: 'Astral Observatory',
    description: 'Dominion of STEM, astrophysics, and analytical logic masters.',
    iconType: 'observatory',
    customIconUrl: null,
    durationMinutes: 10,
    currentHolderUserId: 'usr-member-1',
    currentHolderName: 'Aarav Sharma',
    highestScore: 8,
    wonOn: '19 November',
    attemptedUserIds: [],
    history: [
      { id: 'th-4', holderUserId: 'usr-member-1', holderName: 'Aarav Sharma', score: 8, totalQuestions: 10, dateLabel: '19 Nov', result: 'Current' },
      { id: 'th-5', holderUserId: 'usr-member-2', holderName: 'Sujata Adhikari', score: 7, totalQuestions: 10, dateLabel: '10 Nov', result: 'Defeated' },
    ],
    questions: [
      { id: 'oq1', question: 'What is the approximate speed of light in vacuum (km/s)?', options: ['150,000', '300,000', '450,000', '1,000,000'], correctIndex: 1 },
      { id: 'oq2', question: 'Which particle carries a negative electrical charge?', options: ['Proton', 'Neutron', 'Electron', 'Photon'], correctIndex: 2 },
      { id: 'oq3', question: 'Which moon of Saturn has a thick nitrogen-rich atmosphere?', options: ['Europa', 'Titan', 'Io', 'Phobos'], correctIndex: 1 },
      { id: 'oq4', question: 'What is the powerhouse organelle of a eukaryotic cell?', options: ['Ribosome', 'Golgi Apparatus', 'Mitochondrion', 'Lysosome'], correctIndex: 2 },
      { id: 'oq5', question: 'Which gas makes up roughly 78% of Earth’s atmosphere?', options: ['Oxygen', 'Nitrogen', 'Argon', 'Carbon Dioxide'], correctIndex: 1 },
      { id: 'oq6', question: 'Who formulated the three laws of planetary motion?', options: ['Galileo Galilei', 'Johannes Kepler', 'Tycho Brahe', 'Edwin Hubble'], correctIndex: 1 },
      { id: 'oq7', question: 'What is the hardest naturally occurring mineral on the Mohs scale?', options: ['Quartz', 'Corundum', 'Topaz', 'Diamond'], correctIndex: 3 },
      { id: 'oq8', question: 'Which blood cells are primarily responsible for fighting infection?', options: ['Erythrocytes', 'Platelets', 'Leukocytes', 'Plasma'], correctIndex: 2 },
      { id: 'oq9', question: 'What is the pH value of pure neutral water at 25°C?', options: ['0', '5', '7', '14'], correctIndex: 2 },
      { id: 'oq10', question: 'Which element has atomic number 6?', options: ['Boron', 'Carbon', 'Nitrogen', 'Oxygen'], correctIndex: 1 },
    ],
  },
  {
    id: 'ter-3',
    code: 'TERRITORY #03',
    name: 'Sanctum of Heritage',
    description: 'Contested ground for Asian history, Nepali heritage, and world literature.',
    iconType: 'sanctum',
    customIconUrl: null,
    durationMinutes: 10,
    currentHolderUserId: null,
    currentHolderName: null,
    highestScore: 0,
    wonOn: null,
    attemptedUserIds: [],
    history: [],
    questions: [
      { id: 'sq1', question: 'Which temple complex in Kathmandu Valley is famed for its 55-window palace?', options: ['Patan Durbar', 'Bhaktapur Durbar', 'Hanuman Dhoka', 'Changunarayan'], correctIndex: 1 },
      { id: 'sq2', question: 'Who is celebrated as Adikavi in Nepali literature?', options: ['Laxmi Prasad Devkota', 'Bhanubhakta Acharya', 'Lekhnath Paudyal', 'Balkrishna Sama'], correctIndex: 1 },
      { id: 'sq3', question: 'In which district of Nepal is Lumbini, the birthplace of Buddha, located?', options: ['Kapilvastu', 'Rupandehi', 'Nawalparasi', 'Palpa'], correctIndex: 1 },
      { id: 'sq4', question: 'Who wrote the classic novel "Muna Madan"?', options: ['Bhanubhakta Acharya', 'Laxmi Prasad Devkota', 'B.P. Koirala', 'Parijat'], correctIndex: 1 },
      { id: 'sq5', question: 'Which script is historically used to write classical Sanskrit and Nepali?', options: ['Grantha', 'Devanagari', 'Brahmi', 'Sharada'], correctIndex: 1 },
      { id: 'sq6', question: 'Which Himalayan peak is the highest mountain entirely inside Nepal?', options: ['Dhaulagiri I', 'Annapurna I', 'Manaslu', 'Langtang Lirung'], correctIndex: 0 },
      { id: 'sq7', question: 'Who authored "1984" and "Animal Farm"?', options: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells'], correctIndex: 1 },
      { id: 'sq8', question: 'Which ancient trade route connected East Asia with the Mediterranean?', options: ['Amber Road', 'Silk Road', 'Spice Route', 'Incense Route'], correctIndex: 1 },
      { id: 'sq9', question: 'Who painted "The Starry Night"?', options: ['Claude Monet', 'Pablo Picasso', 'Vincent van Gogh', 'Salvador Dalí'], correctIndex: 2 },
      { id: 'sq10', question: 'Which epic poem is attributed to the ancient Greek poet Homer?', options: ['Aeneid', 'The Odyssey', 'Metamorphoses', 'Divine Comedy'], correctIndex: 1 },
    ],
  },
];

/* ================= INITIAL NEWSPAPER ================= */

export const INITIAL_NEWSPAPER: NewspaperEdition = {
  masthead: 'THE DQR CHRONICLE',
  volumeLabel: 'VOL. I · NO. 14 · DISTRICT EDITION',
  dateLabel: 'SATURDAY, JUNE 2026',
  headline: 'SMALL ACTIONS ACCUMULATE: DISTRICT QUIZ STANDINGS SHIFT AFTER GRAND FINALS',
  subheadline:
    'Daily ten-minute discipline powers unbeaten streak across twenty-eight competing schools as Territory battles intensify.',
  leadAuthor: 'By The DQR Editorial Desk',
  leadBody:
    'Across the district auditorium this week, months of quiet preparation became unmistakable stage composure. Rather than relying on frantic overnight revision, top-ranked DQR challengers leaned on structured daily study habits—converting five to ten focused minutes each day into decisive buzzer speed during the third and fourth tie-breaker rounds.\n\nMeanwhile, the Territory arena saw renewed pressure on The Shadow Citadel and Astral Observatory as emerging Grade contenders logged consecutive streaks and higher accuracy ratings.',
  sideTitle: 'Inside This Edition',
  sideBody:
    '• Dijan Bhattarai extends unbroken study streak past 40 days.\n• Aarav Sharma holds Astral Observatory with 8/10 benchmark.\n• Sanctum of Heritage remains unclaimed—open to all eligible challengers.\n• System Challenge verification queue now active for members.',
  quoteText:
    'Potential is silent until pressure arrives. Consistency turns small daily actions into unmistakable authority.',
  quoteAuthor: 'Dijan Bhattarai, Founder of DQR',
  featuredImageUrl: '/src/assets/images/quiz_district_championship_1795329636968.jpg',
  paperBg: '#F4EFE4',
  inkColor: '#171411',
  accentColor: '#8A1C1C',
};

/* ================= INITIAL SYSTEM DATA ================= */

export const INITIAL_SYSTEM_CONFIG: SystemConfig = {
  welcomeTemplate: 'IDENTIFICATION CONFIRMED. Welcome back, Hunter. Your journey continues. Your achievements have been recorded.',
  welcomeTemplates: [
    'IDENTIFICATION CONFIRMED. Welcome back, Hunter. Your journey continues. Your achievements have been recorded.',
    'SYSTEM LINK ESTABLISHED. Potential means nothing without proof. Step forward and validate your rank.',
    'OBSERVATION MODE ACTIVE. Every round you skip is ground surrendered to a competitor.',
  ],
  globalAnnouncement:
    'Territory #03 (Sanctum of Heritage) remains unclaimed. Any challenger scoring above 0/10 secures immediate dominion.',
  perUserGuidance: {
    'usr-admin-1': {
      strategicAdvice:
        'Authority is maintained by setting the pace. Defend The Shadow Citadel against 9/10 challengers and expand into Heritage.',
      nextObjective:
        'Consolidate Territory #01 defense and surpass 5,000 XP before the next cycle evaluation.',
    },
    'usr-member-1': {
      strategicAdvice:
        'Your STEM velocity is elite, but humanities tie-breakers are costing you 1st-place finishes. Balance your daily 10-minute drills.',
      nextObjective:
        'Defend Astral Observatory (8/10) and prepare a targeted challenge on Territory #01.',
    },
    'usr-member-2': {
      strategicAdvice:
        'Consistent heritage accuracy gives you a clear opening. Hesitation on buzzer rounds is the only barrier left.',
      nextObjective:
        'Enter Territory #03 (Sanctum of Heritage) immediately to claim your first 100 Territory Power.',
    },
  },
  customVerdictPresets: [
    'THE UNDERDOG',
    'THE CONTENDER',
    'THE RISING FORCE',
    'THE DOMINANT',
    'THE UNPREDICTABLE',
    'THE ARCHITECT',
    'THE SOVEREIGN',
  ],
  online: true,
};

export const INITIAL_PREDICTIONS: SystemPrediction[] = [
  {
    id: 'pred-1',
    title: 'A New Rank Threshold Is Within Reach',
    category: 'Rank Projection',
    preview: 'Sustained XP velocity suggests imminent elevation toward Supreme/Special tier review.',
    fullText:
      'Analysis of recent quiz accuracy and daily streak adherence indicates that maintaining your current pace over the next two evaluation cycles places you directly in line for an administrative rank review.',
    confidence: 'HIGH CONFIDENCE',
    publishedAt: '2026-11-18',
    expiresAt: null,
    targetUserId: 'all',
    published: true,
  },
  {
    id: 'pred-2',
    title: 'Territorial Dominance Faces Challenger Pressure',
    category: 'Territorial Forecast',
    preview: 'Multiple Grade contenders are preparing attempts on Territory #01 and #02.',
    fullText:
      'Activity logs across the Territories division show heightened preparation in History and STEM question banks. Existing holders with scores below 10/10 remain vulnerable to a single flawless attempt.',
    confidence: 'MODERATE CONFIDENCE',
    publishedAt: '2026-11-19',
    expiresAt: null,
    targetUserId: 'all',
    published: true,
  },
  {
    id: 'pred-3',
    title: 'Leaderboard Convergence Expected',
    category: 'Leaderboard Forecast',
    preview: 'Mid-table contenders are narrowing the point gap ahead of the next district cycle.',
    fullText:
      'With 6 points awarded per 1st-place finish, a single podium swing at the next district invitational could rearrange positions 2 through 5.',
    confidence: 'MODERATE CONFIDENCE',
    publishedAt: '2026-11-15',
    expiresAt: '2026-11-01',
    targetUserId: 'all',
    published: true,
  },
];

export const INITIAL_GUIDANCE: SystemGuidanceItem[] = [
  {
    id: 'gui-1',
    title: 'Fortify Literature Tie-Breaker Accuracy',
    explanation: 'Two recent podium placements were decided by narrow margins in classical literature.',
    recommendedAction: 'Spend 10 minutes daily reviewing Nepali & classical world authors.',
    priority: 'HIGH',
    category: 'Precision Focus',
    targetUserId: 'usr-admin-1',
  },
  {
    id: 'gui-2',
    title: 'Convert STEM Precision into Territory Expansion',
    explanation: 'Your single-attempt accuracy in science gives you an edge in timed Territory runs.',
    recommendedAction: 'Study regional history prompts before initiating a Territory #01 challenge.',
    priority: 'HIGH',
    category: 'Territorial Strategy',
    targetUserId: 'usr-member-1',
  },
  {
    id: 'gui-3',
    title: 'Seize Unclaimed Sanctum of Heritage',
    explanation: 'Your humanities foundation aligns directly with Territory #03 subjects.',
    recommendedAction: 'Submit your attempt on Sanctum of Heritage this week to earn 100 Power.',
    priority: 'HIGH',
    category: 'Territorial Opportunity',
    targetUserId: 'usr-member-2',
  },
];

export const INITIAL_CHALLENGES: SystemChallenge[] = [
  {
    id: 'chl-1',
    title: 'Claim an Unconquered Territory',
    description: 'Enter a Territory arena and achieve a strictly higher score than the reigning holder.',
    category: 'Territorial',
    difficulty: 'A-Rank',
    rewardXp: 400,
    deadline: '2026-12-05',
    requirementText: 'Hold active control of at least 1 Territory.',
    targetUserId: 'all',
    status: 'ACTIVE',
    progressCurrent: 1,
    progressTarget: 1,
    completedByUserIds: ['usr-admin-1', 'usr-member-1'],
  },
  {
    id: 'chl-2',
    title: '14-Day Unbroken Discipline',
    description: 'Sustain daily academic momentum without breaking your streak for two full weeks.',
    category: 'Individual',
    difficulty: 'B-Rank',
    rewardXp: 250,
    deadline: '2026-12-10',
    requirementText: 'Reach Streak ≥ 14 days on Ascension Dashboard.',
    targetUserId: 'all',
    status: 'ACTIVE',
    progressCurrent: 14,
    progressTarget: 14,
    completedByUserIds: ['usr-admin-1', 'usr-member-1'],
  },
  {
    id: 'chl-3',
    title: 'Podium Supremacy',
    description: 'Secure at least two 1st-place finishes in District Hall of Fame records.',
    category: 'Competitive',
    difficulty: 'S-Rank',
    rewardXp: 600,
    deadline: '2026-12-30',
    requirementText: 'Accumulate 2+ Gold (1st) placements in Standings.',
    targetUserId: 'all',
    status: 'AVAILABLE',
    progressCurrent: 0,
    progressTarget: 2,
    completedByUserIds: ['usr-admin-1'],
  },
];


export const INITIAL_VERDICTS: VerdictRecord[] = [
  {
    userId: 'usr-admin-1',
    classification: 'THE DOMINANT',
    description: 'Consistently establishes competitive authority across stage quizzes, streaks, and territorial holdings.',
    assignedDate: '2026-11-18',
    status: 'VERIFIED · ACTIVE',
    performanceCharacteristics: 'High buzzer conviction, disciplined daily habit compounding, relentless tie-breaker composure.',
    strongestAttribute: 'Sustained Multi-Cycle Consistency',
    biggestWeakness: 'Must guard against complacency at the summit.',
    competitiveTendencies: 'Leads early rounds and locks down territories with 90%+ benchmark scores.',
    history: [
      { classification: 'THE RISING FORCE', assignedDate: '2026-08-01' },
      { classification: 'THE DOMINANT', assignedDate: '2026-11-18' },
    ],
  },
  {
    userId: 'usr-member-1',
    classification: 'THE RISING FORCE',
    description: 'Shows notable improvement and development across STEM challenges and territorial warfare.',
    assignedDate: '2026-11-19',
    status: 'VERIFIED · ACTIVE',
    performanceCharacteristics: 'Methodical under countdown pressure; excels in precision reasoning.',
    strongestAttribute: 'Analytical Speed in Science & Logic',
    biggestWeakness: 'Cross-disciplinary literature & regional history recall.',
    competitiveTendencies: 'Targets high-value territories and steadily climbs leaderboard rankings.',
    history: [
      { classification: 'THE CONTENDER', assignedDate: '2026-09-12' },
      { classification: 'THE RISING FORCE', assignedDate: '2026-11-19' },
    ],
  },
  {
    userId: 'usr-member-2',
    classification: 'THE CONTENDER',
    description: 'Demonstrates competitive potential with strong domain depth awaiting decisive territorial proof.',
    assignedDate: '2026-11-20',
    status: 'VERIFIED · ACTIVE',
    performanceCharacteristics: 'Composed, accurate in humanities, selective with risk-taking.',
    strongestAttribute: 'Heritage & Literary Mastery',
    biggestWeakness: 'Needs sharper aggressiveness in rapid-fire & territory challenges.',
    competitiveTendencies: 'Consistent team anchor during multi-round district finals.',
    history: [
      { classification: 'THE UNDERDOG', assignedDate: '2026-07-15' },
      { classification: 'THE CONTENDER', assignedDate: '2026-11-20' },
    ],
  },
];

export const INITIAL_SYSTEM_MESSAGES: SystemMessage[] = [
  {
    id: 'smsg-1',
    userId: 'usr-member-1',
    sender: 'system',
    text: 'IDENTIFICATION CONFIRMED.\nWhat would you like to know, Hunter? Submit your inquiry. The System awaits.',
    createdAt: Date.now() - 86400000 * 2,
    readByAdmin: true,
    readByUser: true,
  },
  {
    id: 'smsg-2',
    userId: 'usr-member-1',
    sender: 'user',
    text: 'When can I re-attempt Territory #01 if I want to beat 9/10?',
    createdAt: Date.now() - 86400000 * 1.5,
    readByAdmin: true,
    readByUser: true,
  },
  {
    id: 'smsg-3',
    userId: 'usr-member-1',
    sender: 'system',
    text: 'Each challenger receives one attempt per Territory until Administration resets your cooldown for that specific sector. Prove your readiness first.',
    createdAt: Date.now() - 86400000,
    readByAdmin: true,
    readByUser: false,
  },
];
