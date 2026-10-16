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

  const gaps: [number, number][] =
    voWords.length > 6
      ? voWords.slice(0, -1).map((w, i) => [w.end, voWords[i + 1].start] as [number, number])
      : (analysis?.voPauses ?? []).map(([a, b]) => [a - lead, b - lead] as [number, number]);

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
  const ctaStart = end - CTA_SEC;

  const words: Word[] = [
    ...introWords,
    ...voWords.map((w) => ({...w, start: w.start + voStart, end: w.end + voStart})),
  ];

  const design = {
    keyboard: findCue(words, b0, b1, CUES.design.keyboard, b0 + 1.2),
    weight: findCue(words, b0, b1, CUES.design.weight, b0 + 1.6),
    touch: findCue(words, b0, b1, CUES.design.touch, b0 + 2.4),
  };
  const config = {
    cpu: findCue(words, b1, b2, CUES.config.cpu, b1 + 0.6),
    ram: findCue(words, b1, b2, CUES.config.ram),
    ssd: findCue(words, b1, b2, CUES.config.ssd),
    consult: findCue(words, b1, b2, CUES.config.consult),
  };
  config.ram = Math.max(config.ram, config.cpu + 1.6);
  config.ssd = Math.max(config.ssd, config.ram + 1.4);
  config.consult = Math.min(Math.max(config.consult, config.ssd + 1.4), b2 - 1.2);

  // second music drop → accent / website reveal
  const drop = analysis?.musicDrop ?? null;
  const accent =
    drop !== null && analysis?.musicDrop2 ? analysis.musicDrop2 - (drop - MUSIC.dropAt) : null;

  const trustEnd = Math.min(voEnd, ctaStart);
  const trust = {
    torob: findCue(words, b2, trustEnd, CUES.trust.torob),
    emalls: findCue(words, b2, trustEnd, CUES.trust.emalls),
    years: findCue(words, b2, trustEnd, CUES.trust.years),
    website: findCue(words, b2, trustEnd, CUES.trust.website, b2 + 2.5),
  };
  trust.emalls = Math.max(trust.emalls, trust.torob + 0.5);
  trust.years = Math.max(trust.years, trust.emalls + 0.6);
  if (accent !== null && Math.abs(accent - trust.website) < 3) trust.website = accent;
  trust.website = Math.min(Math.max(trust.website, trust.years + 2.2), ctaStart - 1.5);

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
