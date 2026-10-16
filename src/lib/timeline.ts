import {
  CTA_SEC,
  CUES,
  FPS,
  INTRO_DURATION,
  MUSIC,
  TAIL_SEC,
  TRANSITION_SEC,
  VO_SPLITS_OVERRIDE,
} from '../config';

export type Word = {word: string; start: number; end: number};

// public/timestamps.json — written by scripts/transcribe.py
export type Timestamps = {
  intro?: {words: Word[]}; // seconds relative to the trimmed intro (final video time)
  voiceover?: {words: Word[]; duration?: number}; // seconds in voiceover.m4a
};

// public/audio-analysis.json — written by scripts/analyze_audio.py
export type AudioAnalysis = {
  voLeadIn?: number;
  voPauses?: [number, number][];
  musicDrop?: number;
  musicDrop2?: number;
};

export type Timeline = {
  durationInFrames: number;
  voStart: number; // seconds (final video)
  voLeadIn: number; // seconds trimmed off the head of voiceover.m4a
  voDuration: number; // seconds of voiceover actually used
  // Part ends in final-video seconds: [introEnd, designEnd, configEnd, end]
  bounds: [number, number, number, number];
  ctaStart: number;
  accent: number | null; // second music drop (final-video seconds)
  cues: {
    design: Record<keyof typeof CUES.design, number>;
    config: Record<keyof typeof CUES.config, number>;
    trust: Record<keyof typeof CUES.trust, number>;
  };
  words: Word[]; // all subtitle words in final-video seconds
};

export const sec = (s: number) => Math.round(s * FPS);

export const normalize = (w: string) =>
  w
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[‌‏‎]/g, '')
    .replace(/[.,!?؟،؛:"'«»()\-–—…]/g, '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .trim();

const findCue = (
  words: Word[],
  from: number,
  to: number,
  spec: {words: readonly string[]; fallback: number},
  minAt?: number,
): number => {
  const targets = spec.words.map(normalize);
  const lo = Math.max(from, minAt ?? from);
  for (const w of words) {
    if (w.start < lo || w.start >= to) continue;
    const n = normalize(w.word);
    if (targets.some((t) => n === t || (t.length >= 3 && n.startsWith(t)))) return w.start;
  }
  return Math.max(lo, from + (to - from) * spec.fallback);
};

// Pick the longest gap near `target` (gaps are [start, end] in VO seconds).
const splitNear = (gaps: [number, number][], target: number, window: number): number => {
  let best = target;
  let bestScore = -Infinity;
  for (const [a, b] of gaps) {
    const mid = (a + b) / 2;
    if (Math.abs(mid - target) > window) continue;
    const score = b - a - Math.abs(mid - target) * 0.05;
    if (score > bestScore) {
      bestScore = score;
      best = mid;
    }
  }
  return best;
};

export const buildTimeline = (
  ts: Timestamps | null,
  voFileDuration: number,
  analysis: AudioAnalysis | null,
): Timeline => {
  const voStart = INTRO_DURATION;
  const lead = analysis?.voLeadIn ?? 0;
  const fileDur = voFileDuration > 0 ? voFileDuration : ts?.voiceover?.duration ?? 30;
  const voDuration = fileDur - lead;

  // voiceover words, re-based to trimmed VO time
  const voWords = (ts?.voiceover?.words ?? [])
    .map((w) => ({...w, start: w.start - lead, end: w.end - lead}))
    .filter((w) => w.end > 0);
  const introWords = (ts?.intro?.words ?? []).filter((w) => w.end > 0 && w.start < INTRO_DURATION);

  // candidate split points: gaps between words + measured silences
  const gaps: [number, number][] = [
    ...voWords.slice(0, -1).map((w, i) => [w.end, voWords[i + 1].start] as [number, number]),
    ...(analysis?.voPauses ?? []).map(([a, b]) => [a - lead, b - lead] as [number, number]),
  ].filter(([a, b]) => b - a > 0.05);

  let s1: number;
  let s2: number;
  if (VO_SPLITS_OVERRIDE) {
    [s1, s2] = VO_SPLITS_OVERRIDE;
  } else {
    const third = voDuration / 3;
    const win = Math.max(3, voDuration * 0.12);
    s1 = splitNear(gaps, third, win);
    s2 = splitNear(gaps, Math.max(s1 + 4, third * 2), win);
  }

  const end = voStart + voDuration + TAIL_SEC;
  const bounds: [number, number, number, number] = [voStart, voStart + s1, voStart + s2, end];
  const [b0, b1, b2] = bounds;
  const voEnd = voStart + voDuration;

  const words: Word[] = [
    ...introWords,
    ...voWords.map((w) => ({...w, start: w.start + voStart, end: w.end + voStart})),
  ];

  const design = {
    keyboard: findCue(words, b0, b1, CUES.design.keyboard, b0 + 1.2),
    weight: findCue(words, b0, b1, CUES.design.weight, b0 + 1.6),
    touch: findCue(words, b0, b1, CUES.design.touch, b0 + 2.4),
  };
  const c = CUES.config;
  const cpu = findCue(words, b1, b2, c.cpu, b1 + 0.6);
  const cpu2 = Math.max(findCue(words, b1, b2, c.cpu2, cpu + 0.5), cpu + 1.0);
  const ram = Math.max(findCue(words, b1, b2, c.ram, cpu2 + 0.3), cpu2 + 0.6);
  const ram2 = Math.max(findCue(words, b1, b2, c.ram2, ram + 0.2), ram + 0.5);
  const ssd = Math.max(findCue(words, b1, b2, c.ssd, ram2 + 0.2), ram2 + 0.5);
  const ssd128 = Math.max(findCue(words, b1, b2, c.ssd128, ssd), ssd + 0.3);
  const ssd512 = Math.max(findCue(words, b1, b2, c.ssd512, ssd128 + 0.3), ssd128 + 0.6);
  const consult = Math.min(Math.max(findCue(words, b1, b2, c.consult, ssd512 + 0.4), ssd512 + 0.8), b2 - 1.2);
  const config = {cpu, cpu2, ram, ram2, ssd, ssd128, ssd512, consult};

  // second music drop → glow accent wherever it lands
  const drop = analysis?.musicDrop ?? null;
  const accent =
    drop !== null && analysis?.musicDrop2 ? analysis.musicDrop2 - (drop - MUSIC.dropAt) : null;

  const t = CUES.trust;
  // CTA starts when you say «کلمه سرفیس رو کامنت کنید», at most CTA_SEC before the end
  const cta = Math.min(findCue(words, b2 + 4, voEnd, t.cta), end - CTA_SEC);
  const years = findCue(words, b2, cta, t.years, b2 + 0.8);
  const torob = findCue(words, b2, cta, t.torob, years);
  const emalls = Math.max(findCue(words, b2, cta, t.emalls, torob), torob + 0.25);
  const namad = Math.max(findCue(words, b2, cta, t.namad, emalls), emalls + 0.3);
  const website = Math.min(Math.max(findCue(words, b2, cta, t.website, namad + 1), namad + 2), cta - 1.2);
  const trust = {years, torob, emalls, namad, website, cta};
  const ctaStart = cta;

  return {
    durationInFrames: sec(end),
    voStart,
    voLeadIn: lead,
    voDuration,
    bounds,
    ctaStart,
    accent,
    cues: {design, config, trust},
    words,
  };
};

// TransitionSeries durations so every transition is centred on its boundary.
// Computed in whole frames so the series adds up exactly to durationInFrames.
export const sceneLayout = (tl: Timeline) => {
  const Tf = Math.round(sec(TRANSITION_SEC) / 2) * 2;
  const h = Tf / 2;
  const [f1, f2, f3, fEnd] = tl.bounds.map(sec);
  return {
    transitionFrames: Tf,
    starts: [0, f1 - h, f2 - h, f3 - h],
    durations: [f1 + h, f2 - f1 + Tf, f3 - f2 + Tf, fEnd - f3 + h],
  };
};
