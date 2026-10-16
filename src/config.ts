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
  voiceover: 'voiceover.m4a',
  website: 'media/website.mp4',
  music: 'music.mp3',
  logo: 'logo.png',
  logoClean: 'logo-clean.png', // logo with the black background keyed out
  surfaceFront: 'surface-front.png',
  surfaceSide: 'surface-side.png',
  surfaceBack: 'surface-back.png',
  torob: 'torob.jpg',
  emalls: 'emalls.jpg',
  timestamps: 'timestamps.json',
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
export const VO_SPLITS_OVERRIDE: [number, number] | null = null;

// Scene transition length (seconds)
export const TRANSITION_SEC = 0.5;

// Seconds of music-only tail after the voiceover ends (CTA breathing room)
export const TAIL_SEC = 1.6;

// Final CTA duration (seconds before the end)
export const CTA_SEC = 2.5;

// Music levels
export const MUSIC = {
  underSpeech: 0.12,
  drop: 0.45,
  gaps: 0.26,
  // Where in the final video the beat drop should land (intro → part B cut)
  dropAt: INTRO_DURATION,
};

// Magnifier focus on the Torob / Emalls screenshots (0..1 of image size).
// Pointed at the "۴ سال و ۳ ماه" text — adjust after looking at the images.
// w/h = size of the highlight box as a fraction of the screenshot width.
export const TOROB_FOCUS = {x: 0.262, y: 0.61, w: 0.24, h: 0.035, zoom: 2.6};
export const EMALLS_FOCUS = {x: 0.83, y: 0.822, w: 0.3, h: 0.035, zoom: 3.0};

export const STAGES = ['۱. معرفی', '۲. طراحی', '۳. کانفیگ‌ها', '۴. خرید از آربایت'];

export const CTA = {
  title: 'کلمه «سرفیس» رو کامنت کن!',
  sub: 'تا مشخصات کامل و قیمت روز رو برات دایرکت کنیم',
  word: 'سرفیس',
};

export const TRUST_BADGE = '۴ سال سابقه رسمی در ترب و ایمالز + اینماد';

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
  },
  config: {
    cpu: {words: ['i7', 'core', 'پردازنده', 'کور'], fallback: 0.08},
    cpu2: {words: ['i5'], fallback: 0.3},
    ram: {words: ['رم', 'رمهای', 'رمها'], fallback: 0.38},
    ram2: {words: ['16'], fallback: 0.45},
    ssd: {words: ['حافظه', 'ssd', 'اس‌اس‌دی', 'هارد'], fallback: 0.55},
    ssd128: {words: ['128'], fallback: 0.58},
    ssd512: {words: ['512'], fallback: 0.64},
    consult: {words: ['مشاوره', 'کارشناس', 'کارشناسان', 'راهنمایی'], fallback: 0.8},
  },
  trust: {
    years: {words: ['سال', 'سابقه'], fallback: 0.15},
    torob: {words: ['ترب'], fallback: 0.25},
    emalls: {words: ['ایمالز'], fallback: 0.3},
    namad: {words: ['نماد', 'اینماد'], fallback: 0.35},
    website: {words: ['سایت', 'وبسایت', 'arbyteir'], fallback: 0.6},
    cta: {words: ['کلمه', 'کامنت'], fallback: 0.85},
  },
} as const;
