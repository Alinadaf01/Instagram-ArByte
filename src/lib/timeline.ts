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
  voiceover?: {words: Word[]; duration?: number; pauses?: [number, number][]}; // seconds in the voiceover file
};

// public/audio-analysis.json — written by scripts/analyze_audio.py
export type AudioAnalysis = {
  voLeadIn?: number;
  voPauses?: [number, number][];
  musicDrop?: number;
  musicDrop2?: number;
  tempo?: number;
  beats?: number[]; // seconds in music.mp3
  downbeats?: number[];
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
  beats: number[]; // music beats in final-video seconds
  downbeats: number[];
  cues: {
    design: Record<keyof typeof CUES.design, number>;
    config: Record<keyof typeof CUES.config, number>;
    buy: Record<keyof typeof CUES.buy, number>;
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

  // music beat grid in final-video time (music is shifted so its drop hits voStart)
  const shift = analysis?.musicDrop !== undefined ? analysis.musicDrop - MUSIC.dropAt : 0;
  const toVideo = (xs?: number[]) => (xs ?? []).map((b) => b - shift).filter((b) => b >= -0.01 && b <= end);
  const beats = toVideo(analysis?.beats);
  const downbeats = toVideo(analysis?.downbeats);
  // nudge a UI cue onto the beat when it is already close (keeps speech sync)
  const q = (x: number) => {
    let best = x;
    for (const b of beats) if (Math.abs(b - x) < Math.abs(best - x) || best === x) best = b;
    return Math.abs(best - x) <= 0.13 ? best : x;
  };

  const words: Word[] = [
    ...introWords,
    ...voWords.map((w) => ({...w, start: w.start + voStart, end: w.end + voStart})),
  ];

  const design = {
    keyboard: q(findCue(words, b0, b1, CUES.design.keyboard, b0 + 1.2)),
    weight: q(findCue(words, b0, b1, CUES.design.weight, b0 + 1.6)),
    touch: q(findCue(words, b0, b1, CUES.design.touch, b0 + 2.4)),
    k2: 0,
  };
  design.k2 = Math.max(findCue(words, b0, b1, CUES.design.k2, design.touch + 0.6), design.touch + 1.2);
  const c = CUES.config;
  const f = (spec: (typeof c)[keyof typeof c], after: number, gap: number) =>
    Math.max(findCue(words, b1, b2, spec, after), after + gap);
  const cpuShow = q(findCue(words, b1, b2, c.cpuShow, b1 + 0.2));
  const cpu = f(c.cpu, cpuShow + 0.4, 0.4);
  const cpuEco = f(c.cpuEco, cpu + 0.4, 0.6);
  const cpu2 = f(c.cpu2, cpuEco, 0.4);
  const ram = q(f(c.ram, cpu2 + 0.3, 0.6));
  const ram8 = f(c.ram8, ram + 0.2, 0.45);
  const ram16 = f(c.ram16, ram8 + 0.2, 0.4);
  const ssd = q(f(c.ssd, ram16 + 0.2, 0.5));
  const ssd128 = f(c.ssd128, ssd + 0.2, 0.45);
  const ssd512 = f(c.ssd512, ssd128 + 0.3, 0.6);
  // clicks stay exactly on the words; box entrances snap to the beat
  const config = {cpuShow, cpu, cpuEco, cpu2, ram, ram8, ram16, ssd, ssd128, ssd512};

  // second music drop → glow accent wherever it lands
  const drop = analysis?.musicDrop ?? null;
  const accent =
    drop !== null && analysis?.musicDrop2 ? analysis.musicDrop2 - (drop - MUSIC.dropAt) : null;

  const t = CUES.buy;
  // CTA starts when you say «کلمه سرفیس رو کامنت کنید», at most CTA_SEC before the end
  const cta = Math.min(findCue(words, b2 + 3, voEnd, t.cta), end - CTA_SEC);
  const consult = findCue(words, b2, cta, t.consult, b2);
  const buyAt = Math.max(findCue(words, b2, cta, t.buy, consult + 1), consult + 1.2);
  const website = Math.min(Math.max(findCue(words, b2, cta, t.website, buyAt + 0.3), buyAt + 0.6), cta - 1.2);
  const buy = {consult: q(consult), buy: q(buyAt), website: q(website), cta};
  const ctaStart = cta;

  return {
    durationInFrames: sec(end),
    voStart,
    voLeadIn: lead,
    voDuration,
    bounds,
    ctaStart,
    accent,
    beats,
    downbeats,
    cues: {design, config, buy},
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
