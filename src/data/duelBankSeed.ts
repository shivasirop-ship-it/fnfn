import { DuelConfig, DuelQuestion } from '../types';

export const INITIAL_DUEL_CONFIG: DuelConfig = {
  topics: [
    'Mathematics',
    'Science',
    'History',
    'Geography',
    'General Knowledge',
  ],
  secondsPerQuestion: 15,
  wagerXp: 1000,
};

function makeSeed(
  id: string,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  question: string,
  options: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  subtopic?: string
): DuelQuestion {
  return {
    id,
    topic,
    subtopic,
    difficulty,
    question,
    options,
    correctIndex,
    status: 'approved',
    isActive: true,
    timesUsed: 0,
    lastUsedAt: null,
    recentlySeenBy: [],
    flaggedCount: 0,
    flaggedReasons: [],
    flaggedByUserIds: [],
    createdAt: 1740000000000,
  };
}

export const INITIAL_DUEL_QUESTIONS: DuelQuestion[] = [
  // ================= MATHEMATICS (3 Easy, 4 Medium, 3 Hard) =================
  makeSeed(
    'dq-math-e1',
    'Mathematics',
    'easy',
    'What is the value of 15% of 200?',
    ['20', '25', '30', '35'],
    2,
    'Arithmetic'
  ),
  makeSeed(
    'dq-math-e2',
    'Mathematics',
    'easy',
    'How many degrees are in the interior angles of any triangle?',
    ['90°', '180°', '270°', '360°'],
    1,
    'Geometry'
  ),
  makeSeed(
    'dq-math-e3',
    'Mathematics',
    'easy',
    'What is the only even prime number?',
    ['0', '2', '4', '6'],
    1,
    'Number Theory'
  ),
  makeSeed(
    'dq-math-m1',
    'Mathematics',
    'medium',
    'What is the derivative of x² with respect to x?',
    ['x', '2x', 'x²', '2'],
    1,
    'Calculus'
  ),
  makeSeed(
    'dq-math-m2',
    'Mathematics',
    'medium',
    'If 3x + 7 = 22, what is the value of 2x - 1?',
    ['7', '9', '10', '11'],
    1,
    'Algebra'
  ),
  makeSeed(
    'dq-math-m3',
    'Mathematics',
    'medium',
    'What is the sum of the first 10 positive integers (1 + 2 + ... + 10)?',
    ['45', '50', '55', '60'],
    2,
    'Series'
  ),
  makeSeed(
    'dq-math-m4',
    'Mathematics',
    'medium',
    'A right triangle has legs of 6 cm and 8 cm. What is the length of its hypotenuse?',
    ['10 cm', '12 cm', '14 cm', '9 cm'],
    0,
    'Geometry'
  ),
  makeSeed(
    'dq-math-h1',
    'Mathematics',
    'hard',
    'What is the value of log₂(64)?',
    ['4', '5', '6', '8'],
    2,
    'Logarithms'
  ),
  makeSeed(
    'dq-math-h2',
    'Mathematics',
    'hard',
    'In how many distinct ways can 5 different books be arranged on a shelf?',
    ['25', '60', '120', '720'],
    2,
    'Combinatorics'
  ),
  makeSeed(
    'dq-math-h3',
    'Mathematics',
    'hard',
    'What is the determinant of the 2×2 matrix [[4, 3], [2, 5]]?',
    ['10', '14', '20', '26'],
    1,
    'Linear Algebra'
  ),

  // ================= SCIENCE (3 Easy, 4 Medium, 3 Hard) =================
  makeSeed(
    'dq-sci-e1',
    'Science',
    'easy',
    'What is the chemical symbol for Gold?',
    ['Gd', 'Ag', 'Au', 'Go'],
    2,
    'Chemistry'
  ),
  makeSeed(
    'dq-sci-e2',
    'Science',
    'easy',
    'Which planet in our Solar System is closest to the Sun?',
    ['Venus', 'Mercury', 'Mars', 'Earth'],
    1,
    'Astronomy'
  ),
  makeSeed(
    'dq-sci-e3',
    'Science',
    'easy',
    'Which gas do plants primarily absorb from the atmosphere for photosynthesis?',
    ['Nitrogen', 'Oxygen', 'Carbon Dioxide', 'Hydrogen'],
    2,
    'Biology'
  ),
  makeSeed(
    'dq-sci-m1',
    'Science',
    'medium',
    'What is the SI unit of electrical resistance?',
    ['Volt', 'Ampere', 'Ohm', 'Watt'],
    2,
    'Physics'
  ),
  makeSeed(
    'dq-sci-m2',
    'Science',
    'medium',
    'Which organelle is known as the powerhouse of the eukaryotic cell?',
    ['Ribosome', 'Golgi Apparatus', 'Mitochondrion', 'Lysosome'],
    2,
    'Biology'
  ),
  makeSeed(
    'dq-sci-m3',
    'Science',
    'medium',
    'At standard atmospheric pressure, what is the pH of pure neutral water at 25°C?',
    ['5', '7', '9', '14'],
    1,
    'Chemistry'
  ),
  makeSeed(
    'dq-sci-m4',
    'Science',
    'medium',
    'Approximately how long does light take to travel from the Sun to Earth?',
    ['8 seconds', '8 minutes', '8 hours', '1.3 seconds'],
    1,
    'Physics'
  ),
  makeSeed(
    'dq-sci-h1',
    'Science',
    'hard',
    'Which subatomic particle carries no net electric charge and resides in the atomic nucleus?',
    ['Proton', 'Electron', 'Neutron', 'Positron'],
    2,
    'Physics'
  ),
  makeSeed(
    'dq-sci-h2',
    'Science',
    'hard',
    'What is Avogadro’s constant approximately equal to (in mol⁻¹)?',
    ['6.022 × 10²³', '3.141 × 10⁸', '1.602 × 10⁻¹⁹', '9.81 × 10²'],
    0,
    'Chemistry'
  ),
  makeSeed(
    'dq-sci-h3',
    'Science',
    'hard',
    'Which scientist formulated the three laws of planetary motion?',
    ['Tycho Brahe', 'Johannes Kepler', 'Nicolaus Copernicus', 'Edwin Hubble'],
    1,
    'Astronomy'
  ),

  // ================= HISTORY (3 Easy, 4 Medium, 3 Hard) =================
  makeSeed(
    'dq-his-e1',
    'History',
    'easy',
    'Who was the first President of the United States?',
    ['Thomas Jefferson', 'Abraham Lincoln', 'George Washington', 'John Adams'],
    2,
    'Modern History'
  ),
  makeSeed(
    'dq-his-e2',
    'History',
    'easy',
    'In which ancient civilization were the Pyramids of Giza constructed?',
    ['Mesopotamia', 'Ancient Egypt', 'Indus Valley', 'Ancient Greece'],
    1,
    'Ancient History'
  ),
  makeSeed(
    'dq-his-e3',
    'History',
    'easy',
    'In what year did World War II end?',
    ['1943', '1944', '1945', '1947'],
    2,
    '20th Century'
  ),
  makeSeed(
    'dq-his-m1',
    'History',
    'medium',
    'Who unified the fractured principalities into the modern Kingdom of Nepal in the 18th century?',
    ['Bhimsen Thapa', 'Prithvi Narayan Shah', 'Jung Bahadur Rana', 'Amar Singh Thapa'],
    1,
    'South Asian History'
  ),
  makeSeed(
    'dq-his-m2',
    'History',
    'medium',
    'Which document, signed in 1215, limited the power of King John of England?',
    ['Bill of Rights', 'Treaty of Versailles', 'Magna Carta', 'Edict of Nantes'],
    2,
    'Medieval History'
  ),
  makeSeed(
    'dq-his-m3',
    'History',
    'medium',
    'The Renaissance began in the 14th century in which European city?',
    ['Paris', 'Florence', 'Vienna', 'Madrid'],
    1,
    'Cultural History'
  ),
  makeSeed(
    'dq-his-m4',
    'History',
    'medium',
    'Which empire built the stone citadel of Machu Picchu?',
    ['Maya', 'Aztec', 'Inca', 'Olmec'],
    2,
    'Americas'
  ),
  makeSeed(
    'dq-his-h1',
    'History',
    'hard',
    'Which treaty formally concluded the Anglo-Nepal War in March 1816?',
    ['Treaty of Thapathali', 'Treaty of Sugauli', 'Treaty of Betrawati', 'Treaty of Titalia'],
    1,
    'South Asian History'
  ),
  makeSeed(
    'dq-his-h2',
    'History',
    'hard',
    'In which year did the Byzantine capital of Constantinople fall to the Ottoman Empire?',
    ['1415', '1453', '1492', '1517'],
    1,
    'Medieval History'
  ),
  makeSeed(
    'dq-his-h3',
    'History',
    'hard',
    'Who was the chief architect of the Meiji Restoration’s abolition of feudal domains or a key leader of Japan’s 1868 modernization?',
    ['Tokugawa Ieyasu', 'Oda Nobunaga', 'Emperor Meiji', 'Minamoto Yoritomo'],
    2,
    'East Asian History'
  ),

  // ================= GEOGRAPHY (3 Easy, 4 Medium, 3 Hard) =================
  makeSeed(
    'dq-geo-e1',
    'Geography',
    'easy',
    'Which is the largest ocean on Earth?',
    ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
    2,
    'Oceans'
  ),
  makeSeed(
    'dq-geo-e2',
    'Geography',
    'easy',
    'What is the capital city of Japan?',
    ['Kyoto', 'Osaka', 'Tokyo', 'Sapporo'],
    2,
    'Capitals'
  ),
  makeSeed(
    'dq-geo-e3',
    'Geography',
    'easy',
    'Mount Everest lies on the border between Nepal and which region/country?',
    ['India', 'Tibet / China', 'Bhutan', 'Pakistan'],
    1,
    'Mountains'
  ),
  makeSeed(
    'dq-geo-m1',
    'Geography',
    'medium',
    'Which river is widely regarded as the longest river in South America?',
    ['Orinoco', 'Paraná', 'Amazon', 'São Francisco'],
    2,
    'Rivers'
  ),
  makeSeed(
    'dq-geo-m2',
    'Geography',
    'medium',
    'Which country has the most natural lakes in the world?',
    ['Finland', 'Russia', 'Canada', 'United States'],
    2,
    'Physical Geography'
  ),
  makeSeed(
    'dq-geo-m3',
    'Geography',
    'medium',
    'What is the capital city of Australia?',
    ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    2,
    'Capitals'
  ),
  makeSeed(
    'dq-geo-m4',
    'Geography',
    'medium',
    'Which strait separates Europe (Spain) from Africa (Morocco)?',
    ['Strait of Hormuz', 'Strait of Malacca', 'Strait of Gibraltar', 'Bering Strait'],
    2,
    'Straits'
  ),
  makeSeed(
    'dq-geo-h1',
    'Geography',
    'hard',
    'What is the deepest known point in Earth’s oceans?',
    ['Puerto Rico Trench', 'Java Trench', 'Challenger Deep', 'Tonga Trench'],
    2,
    'Oceanography'
  ),
  makeSeed(
    'dq-geo-h2',
    'Geography',
    'hard',
    'Which landlocked country is completely surrounded by South Africa?',
    ['Eswatini', 'Lesotho', 'Botswana', 'Malawi'],
    1,
    'Political Geography'
  ),
  makeSeed(
    'dq-geo-h3',
    'Geography',
    'hard',
    'Which desert is the largest non-polar (hot) desert in the world?',
    ['Gobi Desert', 'Kalahari Desert', 'Arabian Desert', 'Sahara Desert'],
    3,
    'Biomes'
  ),

  // ================= GENERAL KNOWLEDGE (3 Easy, 4 Medium, 3 Hard) =================
  makeSeed(
    'dq-gk-e1',
    'General Knowledge',
    'easy',
    'How many players are on the field for one standard football (soccer) team?',
    ['9', '10', '11', '12'],
    2,
    'Sports'
  ),
  makeSeed(
    'dq-gk-e2',
    'General Knowledge',
    'easy',
    'Who painted the Mona Lisa?',
    ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Pablo Picasso'],
    1,
    'Art'
  ),
  makeSeed(
    'dq-gk-e3',
    'General Knowledge',
    'easy',
    'Which currency is used in Japan?',
    ['Won', 'Yuan', 'Yen', 'Baht'],
    2,
    'World Affairs'
  ),
  makeSeed(
    'dq-gk-m1',
    'General Knowledge',
    'medium',
    'Who wrote the dystopian novel "1984"?',
    ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells'],
    1,
    'Literature'
  ),
  makeSeed(
    'dq-gk-m2',
    'General Knowledge',
    'medium',
    'Which international organization is headquartered in Geneva, Switzerland, and oversees global public health?',
    ['UNESCO', 'WHO', 'IMF', 'WTO'],
    1,
    'Institutions'
  ),
  makeSeed(
    'dq-gk-m3',
    'General Knowledge',
    'medium',
    'In computing, what does HTTP stand for?',
    [
      'HyperText Transfer Protocol',
      'High Transmission Text Process',
      'Hyperlink Terminal Transfer Path',
      'Host Text Transport Protocol',
    ],
    0,
    'Technology'
  ),
  makeSeed(
    'dq-gk-m4',
    'General Knowledge',
    'medium',
    'Which Olympic Games city hosted the first modern Olympics in 1896?',
    ['Paris', 'London', 'Athens', 'Rome'],
    2,
    'Sports'
  ),
  makeSeed(
    'dq-gk-h1',
    'General Knowledge',
    'hard',
    'Who was the first woman to win a Nobel Prize, and later became the first person to win two?',
    ['Rosalind Franklin', 'Marie Curie', 'Ada Lovelace', 'Lise Meitner'],
    1,
    'Awards & Pioneers'
  ),
  makeSeed(
    'dq-gk-h2',
    'General Knowledge',
    'hard',
    'In chess, what is the only piece that can jump over other pieces?',
    ['Bishop', 'Rook', 'Knight', 'Queen'],
    2,
    'Games'
  ),
  makeSeed(
    'dq-gk-h3',
    'General Knowledge',
    'hard',
    'Which musical instrument traditionally has 88 keys on a standard concert model?',
    ['Harpsichord', 'Accordion', 'Grand Piano', 'Pipe Organ'],
    2,
    'Music'
  ),
];
