// ─────────────────────────────────────────────────────────────
//  ArByte Reel — central config. Tweak timings/text here only.
// ─────────────────────────────────────────────────────────────

export const FPS = 60;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const COLORS = {
  bgDeep: '#080411',
  bgViolet: '#15092B',
  neon: '#9D4EDD',
  neonSoft: '#C77DFF',
  neonHot: '#E0AAFF',
  white: '#FFFFFF',
  silver: '#D9D4E7',
  muted: 'rgba(230,220,255,0.62)',
  green: '#2EE59D',
};

export const FONT = "'Vazirmatn', sans-serif";

// Spring preset requested: organic Apple-like bounce.
export const SPRING = {damping: 14, stiffness: 120, mass: 1};
export const SPRING_SOFT = {damping: 20, stiffness: 90, mass: 1};

export const ASSETS = {
  intro: 'media/intro.mp4', // H.264 1080x1920 proxy of intro.mp4 (scripts/prepare_media.sh)
  voiceover: 'media/voiceover.wav', // cleaned, normalised & edited (scripts/build_audio.py)
  introVoice: 'media/intro-voice.wav', // intro camera audio, cleaned & normalised
  website: 'media/website.mp4',
  music: 'media/music.mp3', // loudness-normalised music.mp3
  logo: 'logo.png',
  logoClean: 'logo-clean.png', // logo with the black background keyed out
  timestamps: 'edit.json', // word timings re-timed to the edited voiceover
  audioAnalysis: 'audio-analysis.json',
};

// intro.mp4 trim (seconds in the source file)
// Speech starts at 0s (you walk in while talking) — starting later cut the
// first sentence mid-word, so the whole opening is kept.
export const INTRO_TRIM_START = 0;
export const INTRO_TRIM_END = 12.4;
export const INTRO_DURATION = INTRO_TRIM_END - INTRO_TRIM_START; // 12.4s

// Floating spec badges in the intro (seconds in the FINAL video)
export const INTRO_BADGES = [
  // synced to the spoken words (timestamps.json)
  {at: 4.75, label: 'پردازنده', value: 'Intel Core i7-1165G7', icon: 'cpu'},
  {at: 6.85, label: 'گرافیک', value: 'Intel Iris Xe Graphics', icon: 'zap'},
  {at: 8.55, label: 'حافظه', value: '256GB SSD', icon: 'disk'},
  {at: 10.3, label: 'رم', value: '16GB RAM', icon: 'ram'},
] as const;

// Which side of the frame the intro badges float on. Right keeps them off
// your gesturing hand; they sit above Instagram's right-side buttons.
export const INTRO_BADGE_SIDE: 'left' | 'right' = 'right';

// Manual override of voiceover part splits (seconds from VO start, after the
// lead-in silence is trimmed). null = auto-detect from word gaps / pauses.
export const VO_SPLITS_OVERRIDE: [number, number] | null = [14.76, 25.6];

// Scene transition length (seconds)
export const TRANSITION_SEC = 0.5;

// Seconds of music-only tail after the voiceover ends (CTA breathing room)
export const TAIL_SEC = 1.6;

// Final CTA duration (seconds before the end)
export const CTA_SEC = 2.5;

// Music levels
export const MUSIC = {
  // music.mp3 is normalised to ≈-15 LUFS and the voice to ≈-19 LUFS, so
  // 0.12 keeps the bed ~14 dB under speech.
  underSpeech: 0.12,
  drop: 0.5,
  gaps: 0.24,
  // Where in the final video the beat drop should land (intro → part B cut)
  dropAt: INTRO_DURATION,
};


export const STAGES = ['۱. معرفی', '۲. طراحی', '۳. کانفیگ‌ها', '۴. خرید از آربایت'];

export const CTA = {
  title: 'کلمه «سرفیس» رو کامنت کن!',
  sub: 'تا مشخصات کامل و قیمت روز رو برات دایرکت کنیم',
  word: 'سرفیس',
};


// Words that get the purple glow highlight in subtitles (normalised form)
export const KEYWORDS = [
  'سرفیس', 'پرو', 'مایکروسافت', 'آربایت', 'اربایت', 'پردازنده', 'گرافیک', 'رم', 'حافظه',
  'تاچ', 'لمسی', 'کیبورد', 'کیبرد', 'وزن', 'گرم', 'سبک', 'مشاوره', 'رایگان', 'ترب',
  'ایمالز', 'سابقه', 'سال', 'اینماد', 'سایت', 'کامنت', 'i7', 'i5', 'ssd', '2k', 'نسل',
  'قیمت', 'خرید', 'گارانتی', 'اورجینال',
];

// Keyword cues inside each voiceover part. First matching word wins;
// `fallback` is a 0..1 fraction of the part if nothing matches.
export const CUES = {
  design: {
    keyboard: {words: ['کیبورد', 'کیبرد', 'جدا', 'جداشدنی'], fallback: 0.3},
    weight: {words: ['وزن', 'گرم', 'سبک', 'سبکه'], fallback: 0.45},
    touch: {words: ['تاچ', 'لمسی', '2k', 'دوکا', 'صفحه', 'نمایشگر'], fallback: 0.65},
    k2: {words: ['2k', 'دوکا'], fallback: 0.85},
  },
  config: {
    // each box arrives big when you start talking about it, the pointer
    // clicks the option as you say it, then the box docks into the grid
    cpuShow: {words: ['علاوه', 'نسخه'], fallback: 0.02},
    cpu: {words: ['core', 'i7'], fallback: 0.12},
    cpuEco: {words: ['اقتصادیتر', 'اقتصادی'], fallback: 0.28},
    cpu2: {words: ['core', 'i5'], fallback: 0.36},
    ram: {words: ['رمهای', 'رمها', 'رم'], fallback: 0.48},
    ram8: {words: ['8'], fallback: 0.54},
    ram16: {words: ['16'], fallback: 0.6},
    ssd: {words: ['حافظههای', 'حافظه', 'ssd', 'هارد'], fallback: 0.66},
    ssd128: {words: ['128'], fallback: 0.72},
    ssd512: {words: ['512'], fallback: 0.82},
  },
  buy: {
    consult: {words: ['کارشناسای', 'کارشناس', 'کارشناسان', 'مشاوره'], fallback: 0.02},
    buy: {words: ['بخرید', 'خرید'], fallback: 0.4},
    website: {words: ['سایت', 'وبسایت', 'arbyteir'], fallback: 0.55},
    cta: {words: ['کلمه', 'کامنت'], fallback: 0.8},
  },
} as const;
