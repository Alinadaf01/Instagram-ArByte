import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import {
  Banknote,
  BatteryLow,
  Briefcase,
  Camera,
  CheckCircle2,
  Clapperboard,
  Code2,
  Cpu,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  MemoryStick,
  PenTool,
  PiggyBank,
  Send,
  User,
  XCircle,
  Zap,
} from 'lucide-react';
import {COLORS, FPS} from '../config';
import {loadFonts} from '../lib/fonts';
import {clamp, pop} from '../lib/anim';
import {BassProvider, useBass} from '../lib/audio';
import {BeatProvider, pulseAt} from '../lib/beat';
import {Background} from '../components/Background';
import {Glass, NeonText} from '../components/Glass';
import {normalize} from '../lib/timeline';

loadFonts();

// ─────────────────────────────────────────────────────────────────────────
// Reel #2 — «سرفیس i5 بخری یا i7؟»
// Five takes cut into one 38s edit (scripts/v2_build.py). Full-screen for the
// hook, the intro and the CTA; picture-in-picture with a big config card for
// the i5 and i7 chapters. Every overlay is cued off the spoken word.
// i5 is always cyan, i7 always magenta — on cards, captions and the CTA.
// ─────────────────────────────────────────────────────────────────────────

// music/mc_cut.mp3 = Midnight City instrumental (vocals removed with
// UVR-MDX-NET-Inst_HQ_3) starting at its riff + drum entry (16.48s), -16 LUFS
export const V2_MUSIC_START = 16.48;
const MUSIC_SRC = 'video2/music/mc_cut.mp3';
const I5 = '#22D3EE';
const I7 = '#E040FB';
const GOLD = '#FFC53D';
const RED = '#FF4D6D';

export type Word = {word: string; start: number; end: number; seg: string};
export type Seg = {name: string; start: number; end: number};
export type V2Props = {duration: number; words: Word[]; segments: Seg[]; beats: number[]; downbeats: number[]; cutStart: number; cutEnd: number};

const f = (s: number) => Math.round(s * FPS);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sp = (frame: number, at: number, damping = 15, stiffness = 130) => spring({frame: frame - at, fps: FPS, config: {damping, stiffness}});

// first word in `seg` matching one of `keys` (after `after` seconds)
const cueOf = (words: Word[], seg: string, keys: string[], fallback: number, after = 0) => {
  const ks = keys.map(normalize);
  const w = words.find((x) => x.seg === seg && x.start >= after - 0.001 && ks.some((k) => normalize(x.word).startsWith(k)));
  return w ? w.start : fallback;
};

// ── shared pieces ─────────────────────────────────────────────────────────
const CpuCard: React.FC<{kind: 'i5' | 'i7'; w: number; h: number; big?: boolean; glow?: number}> = ({kind, w, h, big, glow = 0}) => {
  const bass = useBass();
  const c = kind === 'i5' ? I5 : I7;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: big ? 48 : 30,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(150deg, ${c}33, rgba(20,8,40,0.75) 55%, ${c}22)`,
        border: `2px solid ${c}`,
        boxShadow: `0 0 ${24 + glow * 40 + bass * 20}px ${c}AA, inset 0 1px 0 rgba(255,255,255,0.4), 0 20px 50px rgba(0,0,0,0.5)`,
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Cpu size={big ? 90 : 38} color={c} strokeWidth={2} style={{filter: `drop-shadow(0 0 12px ${c})`}} />
      <div style={{fontSize: big ? 30 : 18, fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: 4, marginTop: big ? 10 : 2}}>INTEL CORE</div>
      <div style={{fontSize: big ? 150 : 70, fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: `0 0 30px ${c}, 0 0 70px ${c}88`}}>{kind}</div>
      {big ? (
        <div dir="rtl" style={{fontSize: 36, fontWeight: 900, color: c, marginTop: 14}}>
          نسل ۱۱ · {kind === 'i5' ? 'i5-1135G7' : 'i7-1165G7'}
        </div>
      ) : null}
    </div>
  );
};

const Chip: React.FC<{icon: React.ReactNode; text: string; color: string; p: number; style?: React.CSSProperties; size?: number}> = ({icon, text, color, p, style, size = 44}) => (
  <div style={{transform: `scale(${0.5 + p * 0.5})`, opacity: Math.min(1, p * 1.6), ...style}}>
    <Glass radius={32} style={{padding: '18px 26px'}} glow={0.4} tint={`${color}33`}>
      <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <div style={{width: 74, height: 74, flexShrink: 0, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}33`, border: `2px solid ${color}`, boxShadow: `0 0 18px ${color}99`}}>
          {icon}
        </div>
        <span style={{fontSize: size, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap'}}>{text}</span>
      </div>
    </Glass>
  </div>
);

const Stamp: React.FC<{at: number; text: string; color: string; icon: React.ReactNode; style: React.CSSProperties; size?: number}> = ({at, text, color, icon, style, size = 54}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const slam = interpolate(frame - at, [0, 4, 12], [2.4, 0.9, 1], clamp);
  return (
    <div style={{position: 'absolute', display: 'flex', justifyContent: 'center', transform: `scale(${slam}) rotate(-4deg)`, opacity: Math.min(1, (frame - at + 1) / 3), zIndex: 30, ...style}}>
      <div
        dir="rtl"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 34px',
          borderRadius: 26,
          border: `5px solid ${color}`,
          background: `${color}26`,
          color: '#fff',
          fontSize: size,
          fontWeight: 900,
          boxShadow: `0 0 40px ${color}, inset 0 0 30px ${color}55`,
          textShadow: `0 0 18px ${color}`,
          backdropFilter: 'blur(10px)',
          whiteSpace: 'nowrap',
        }}
      >
        {icon}
        {text}
      </div>
    </div>
  );
};

// money flying out of the centre on «پول اضافه»
const CashBurst: React.FC<{at: number; cx: number; cy: number; n?: number}> = ({at, cx, cy, n = 12}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 50) return null;
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.3;
        const d = 60 + t * 11;
        const g = t * t * 0.18;
        return (
          <div key={i} style={{position: 'absolute', left: cx + Math.cos(a) * d - 30, top: cy + Math.sin(a) * d + g - 30, transform: `rotate(${a * 57 + t * 9}deg)`, opacity: interpolate(t, [0, 6, 40, 50], [0, 1, 1, 0], clamp), zIndex: 25}}>
            <Banknote size={60} color={GOLD} strokeWidth={2} style={{filter: `drop-shadow(0 0 10px ${GOLD})`}} />
          </div>
        );
      })}
    </>
  );
};

// ── video layer ──────────────────────────────────────────────────────────
// Full screen for hook / intro / CTA. For the i5 and i7 chapters the beige
// wall dissolves into the motion world and the cut-out presenter (cutout.webm,
// same frames, alpha from scripts/v2_cutout.py) slides to the right with a
// neon rim light, so the cards can live beside him instead of a PiP box.
const SIDE = {x: 290, s: 0.95}; // presenter offset/scale while the graphics are up

const look = (
  <>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.5) 0%, transparent 22%, transparent 60%, rgba(8,4,17,0.88) 100%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(120% 70% at 50% 40%, transparent 60%, rgba(8,4,17,0.55) 100%)'}} />
  </>
);

const VideoLayer: React.FC<{sideIn: number; sideOut: number; cuts: number[]; hookEnd: number; cutStart: number; cutEnd: number}> = ({
  sideIn,
  sideOut,
  cuts,
  hookEnd,
  cutStart,
  cutEnd,
}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const p = sp(frame, sideIn - 10, 18, 110) * (1 - sp(frame, sideOut - 8, 18, 110));
  // jump-zooms on downbeats while full screen; hook opens with a slam-in
  const LEVELS = [1.14, 1.0, 1.22, 1.06];
  let level = 1;
  let last = -999;
  cuts.forEach((c, i) => {
    if (frame >= c) {
      level = LEVELS[i % LEVELS.length];
      last = c;
    }
  });
  const since = frame - last;
  const overshoot = interpolate(since, [0, 4, 12], [1.05, 0.99, 1], clamp);
  const open = interpolate(frame, [0, 10], [1.32, 1.0], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const zoom = (frame < hookEnd ? open : 1) * lerp(level * overshoot, 1, p);
  const useCut = frame >= cutStart && frame < cutEnd && p > 0.001;
  const presenter = `translate(${p * SIDE.x}px, 0) scale(${lerp(1, SIDE.s, p)})`;
  return (
    <>
      {/* the real frame, fading out while the presenter is cut out */}
      <AbsoluteFill style={{opacity: useCut ? 1 - p : 1}}>
        <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 30%'}}>
          <OffthreadVideo src={staticFile('video2/edit.mp4')} muted style={{width: 1080, height: 1920}} />
        </AbsoluteFill>
        {look}
      </AbsoluteFill>
      {useCut ? (
        <Sequence from={cutStart} durationInFrames={cutEnd - cutStart} layout="none">
          {/* spotlight + rim behind the presenter */}
          <div style={{position: 'absolute', left: 540 + p * SIDE.x - 520, top: 380, width: 1040, height: 1500, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(157,78,221,${0.55 * p + bass * 0.2}), transparent 75%)`, filter: 'blur(30px)', zIndex: 4}} />
          <AbsoluteFill style={{transform: presenter, transformOrigin: '50% 100%', zIndex: 5, filter: `drop-shadow(0 0 ${10 + bass * 8}px rgba(199,125,255,${0.85 * p})) drop-shadow(0 0 2px rgba(255,255,255,${0.6 * p}))`}}>
            <OffthreadVideo src={staticFile('video2/cutout.webm')} transparent muted style={{width: 1080, height: 1920}} />
          </AbsoluteFill>
          <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 70%, rgba(8,4,17,0.85) 100%)', opacity: p, zIndex: 6}} />
        </Sequence>
      ) : null}
    </>
  );
};

// ── captions: word-by-word, keyword colours by meaning ───────────────────
const kwColor = (w: string): string | null => {
  const n = normalize(w);
  if (n.startsWith('i5')) return I5;
  if (n.startsWith('i7')) return I7;
  if (['اشتباه', 'نمیاد'].some((k) => n.startsWith(k))) return RED;
  if (['پول', 'اضافه', 'قیمت'].some((k) => n.startsWith(k))) return GOLD;
  if (['دانشجویی', 'اداری', 'برنامهنویسی', 'فتوشاپ', 'طراحی', 'تدوین', 'تولید', 'رم', '16', 'گیگ', 'پردازنده', 'کامنت', 'surface', 'قویتریه', 'سبک', 'سنگینتر', 'نسل', 'یازده'].some((k) => n.startsWith(normalize(k))))
    return COLORS.neon;
  return null;
};

type Chunk = {words: Word[]; start: number; end: number};
const chunk = (words: Word[]): Chunk[] => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) out.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
    cur = [];
  };
  for (const w of words) {
    const prev = cur[cur.length - 1];
    const chars = cur.reduce((n, x) => n + x.word.length + 1, 0) + w.word.length;
    if (prev && (w.seg !== prev.seg || w.start - prev.end > 0.4 || cur.length >= 3 || chars > 20)) flush();
    cur.push(w);
    if (/[.!?؟،]$/.test(w.word)) flush();
  }
  flush();
  for (let i = 0; i < out.length; i++) {
    const nx = out[i + 1];
    out[i].end = nx ? Math.min(nx.start, out[i].end + 0.5) : out[i].end + 0.6;
  }
  return out;
};

const Captions: React.FC<{words: Word[]; hideFrom?: number}> = ({words, hideFrom}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const hidden = hideFrom !== undefined && frame >= hideFrom;
  const chunks = useMemo(() => chunk(words), [words]);
  const c = chunks.find((x) => t >= x.start - 0.04 && t < x.end);
  if (!c || hidden) return null;
  const enter = sp(frame, f(c.start - 0.04), 13, 170);
  return (
    <div dir="rtl" style={{position: 'absolute', left: 50, right: 50, bottom: 440, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 18px', transform: `translateY(${(1 - enter) * 50}px) scale(${0.85 + enter * 0.15})`, opacity: Math.min(1, enter * 1.5), zIndex: 40}}>
      {c.words.map((w, i) => {
        const spoken = t >= w.start;
        const live = spoken && t < w.end + 0.06;
        const col = kwColor(w.word);
        const wp = sp(frame, f(w.start), 12, 200);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontSize: col ? 82 : 74,
              fontWeight: 900,
              lineHeight: 1.3,
              padding: col ? '0 18px' : '0 2px',
              borderRadius: 20,
              color: spoken ? '#fff' : 'rgba(255,255,255,0.45)',
              background: col && spoken ? `linear-gradient(135deg, ${col}, ${col}AA)` : 'transparent',
              boxShadow: col && spoken ? `0 0 ${24 + wp * 24}px ${col}, inset 0 1px 0 rgba(255,255,255,0.45)` : undefined,
              transform: `scale(${live ? 1 + 0.12 * wp : 1}) rotate(${col && live ? -2 : 0}deg)`,
              WebkitTextStroke: '2px rgba(10,4,20,0.6)',
              paintOrder: 'stroke fill',
              textShadow: live ? '0 0 24px rgba(255,255,255,0.8), 0 5px 18px rgba(0,0,0,0.85)' : '0 5px 18px rgba(0,0,0,0.85)',
            }}
          >
            {/[A-Za-z]/.test(w.word) ? `\u2066${w.word}\u2069` : w.word}
          </span>
        );
      })}
    </div>
  );
};

// ── chapters ─────────────────────────────────────────────────────────────
const Hook: React.FC<{c: Record<string, number>}> = ({c}) => {
  const frame = useCurrentFrame();
  const title = interpolate(frame, [0, 5, 12], [1.7, 0.92, 1], clamp);
  const wrong = c.wrong;
  const shake = frame >= wrong && frame < wrong + 18 ? Math.sin((frame - wrong) * 2.3) * 14 * (1 - (frame - wrong) / 18) : 0;
  const red = interpolate(frame - wrong, [0, 4, 30], [0, 1, 0], clamp);
  const pi5 = sp(frame, c.i5 - 3, 12, 170);
  const pi7 = sp(frame, c.i7 - 3, 12, 170);
  const pMoney = pop(frame, c.money);
  const pSlow = pop(frame, c.slow);
  return (
    <AbsoluteFill style={{transform: `translateX(${shake}px)`}}>
      {/* frame-0 headline */}
      <div dir="rtl" style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${title})`}}>
        <div style={{fontSize: 150, fontWeight: 900, lineHeight: 1, color: '#fff', textShadow: `0 0 30px ${COLORS.neon}, 0 8px 30px rgba(0,0,0,0.8)`, WebkitTextStroke: '3px rgba(10,4,20,0.5)', paintOrder: 'stroke fill'}}>
          <span style={{color: I5, textShadow: `0 0 34px ${I5}`}}>i5</span> یا <span style={{color: I7, textShadow: `0 0 34px ${I7}`}}>i7</span>؟
        </div>
        <div style={{marginTop: 10, fontSize: 54, fontWeight: 900, color: RED, textShadow: `0 0 20px ${RED}, 0 4px 14px rgba(0,0,0,0.9)`, opacity: interpolate(frame, [10, 16], [0, 1], clamp) * interpolate(frame, [wrong - 4, wrong], [1, 0], clamp)}}>
          ❌ اشتباه انتخاب نکن!
        </div>
      </div>
      {/* the two configs, side by side (RTL: i5 on the right) */}
      <div style={{position: 'absolute', right: 40, top: 640, transform: `translateX(${(1 - pi5) * 420}px) rotate(${(1 - pi5) * 12}deg)`, opacity: pi5}}>
        <CpuCard kind="i5" w={230} h={250} glow={red * 0.5} />
      </div>
      <div style={{position: 'absolute', left: 40, top: 640, transform: `translateX(${(1 - pi7) * -420}px) rotate(${(1 - pi7) * -12}deg)`, opacity: pi7}}>
        <CpuCard kind="i7" w={230} h={250} glow={red * 0.5} />
      </div>
      {red > 0 ? <AbsoluteFill style={{background: `radial-gradient(circle, transparent 40%, ${RED}88 100%)`, opacity: red}} /> : null}
      <div style={{opacity: interpolate(frame, [c.money, c.money + 10], [1, 0], clamp)}}>
        <Stamp at={wrong} text="انتخاب اشتباه" color={RED} icon={<XCircle size={56} color={RED} strokeWidth={2.8} />} style={{top: 440, left: 0, right: 0}} size={64} />
      </div>
      <CashBurst at={c.money} cx={540} cy={1060} />
      {frame >= c.money && frame < c.slow ? (
        <div style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <Chip icon={<Banknote size={46} color={GOLD} />} text="پول اضافه دادی" color={GOLD} p={pMoney} />
        </div>
      ) : null}
      {frame >= c.slow ? (
        <div style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <Chip icon={<BatteryLow size={46} color={RED} />} text="یا جواب کارت رو نمی‌ده" color={RED} p={pSlow} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Intro: React.FC<{c: Record<string, number>; end: number}> = ({c, end}) => {
  const frame = useCurrentFrame();
  const p5 = sp(frame, c.i5b - 2, 13, 160);
  const p7 = sp(frame, c.i7b - 2, 13, 160);
  const pSame = pop(frame, c.surface);
  const pNeq = pop(frame, c.diff);
  const pCpu = pop(frame, c.cpu);
  const leave = sp(frame, end - 8, 18, 140);
  return (
    <AbsoluteFill style={{opacity: 1 - leave}}>
      <div style={{position: 'absolute', top: 200, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, direction: 'rtl'}}>
        <div style={{transform: `scale(${p5}) translateY(${(1 - p5) * -100}px)`, opacity: p5}}>
          <CpuCard kind="i5" w={250} h={250} glow={pCpu * 0.6} />
        </div>
        <div style={{width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {frame >= c.cpu ? (
            <div style={{transform: `scale(${0.4 + pCpu * 0.6}) rotate(${(1 - pCpu) * 90}deg)`, opacity: pCpu}}>
              <Zap size={140} color={GOLD} fill={GOLD} style={{filter: `drop-shadow(0 0 24px ${GOLD})`}} />
            </div>
          ) : frame >= c.diff ? (
            <div style={{fontSize: 150, fontWeight: 900, color: '#fff', transform: `scale(${0.4 + pNeq * 0.6})`, textShadow: `0 0 26px ${COLORS.neon}`}}>≠</div>
          ) : null}
        </div>
        <div style={{transform: `scale(${p7}) translateY(${(1 - p7) * -100}px)`, opacity: p7}}>
          <CpuCard kind="i7" w={250} h={250} glow={pCpu * 0.6} />
        </div>
      </div>
      {frame >= c.surface ? (
        <div style={{position: 'absolute', top: 1170, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + pSame * 0.4})`, opacity: Math.min(1, pSame * 1.5) * (frame >= c.cpu ? 0 : 1)}}>
          <Glass radius={999} style={{padding: '12px 34px'}} glow={0.5}>
            <div dir="rtl" style={{fontSize: 42, fontWeight: 900, color: '#fff'}}>
              هر دو سرفیس پرو ۷ پلاس
            </div>
          </Glass>
        </div>
      ) : null}
      {frame >= c.cpu ? (
        <div style={{position: 'absolute', top: 1170, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + pCpu * 0.4})`, opacity: Math.min(1, pCpu * 1.5)}}>
          <Glass radius={999} style={{padding: '12px 34px'}} glow={0.7} tint={`${GOLD}22`}>
            <div dir="rtl" style={{fontSize: 44, fontWeight: 900, color: '#fff'}}>
              فرقشون فقط: <span style={{color: GOLD}}>پردازنده</span>
            </div>
          </Glass>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

type ChipSpec = {at: number; icon: React.ReactNode; text: string};

const ConfigChapter: React.FC<{kind: 'i5' | 'i7'; start: number; end: number; chips: ChipSpec[]; extra?: React.ReactNode; flipFrom?: boolean}> = ({kind, start, end, chips, extra, flipFrom}) => {
  const frame = useCurrentFrame();
  const col = kind === 'i5' ? I5 : I7;
  const enter = sp(frame, start - 4, 14, 140);
  const flip = flipFrom ? interpolate(sp(frame, start - 4, 16, 120), [0, 1], [180, 0]) : 0;
  const leave = interpolate(frame, [end - 6, end + 4], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: leave}}>
      <div style={{position: 'absolute', left: 40, top: 270, perspective: 1400, zIndex: 7}}>
        <div style={{transform: `rotateY(${flip}deg) translateX(${flipFrom ? 0 : (1 - enter) * -500}px)`, opacity: flipFrom ? 1 : enter, backfaceVisibility: 'hidden'}}>
          <CpuCard kind={kind} w={540} h={480} big glow={0.3} />
        </div>
      </div>
      {chips.map((ch, i) => {
        const p = pop(frame, ch.at);
        if (frame < ch.at - 1) return null;
        return (
          <div key={ch.text} style={{position: 'absolute', top: 790 + i * 114, left: 40, zIndex: 7, transform: `translateX(${(1 - p) * -300}px)`}}>
            <Chip icon={ch.icon} text={ch.text} color={col} p={p} size={40} />
          </div>
        );
      })}
      {extra}
    </AbsoluteFill>
  );
};

const Cta: React.FC<{c: Record<string, number>}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const p5 = sp(frame, c.i5 - 2, 12, 170);
  const p7 = sp(frame, c.i7 - 2, 12, 170);
  const box = sp(frame, c.comment - 4, 15, 140);
  const typed = Math.max(0, Math.min(2, Math.floor((frame - c.write) / 6)));
  const sent = frame >= c.write + 24;
  const tap = interpolate(frame - (c.write + 24), [0, 4, 14], [1, 0.82, 1.1], clamp);
  const dm = pop(frame, c.price);
  const pulse = (k: number) => 1 + 0.06 * Math.sin(frame * 0.2 + k);
  const bubble = (kind: 'i5' | 'i7', p: number, side: 'left' | 'right') => (
    <div style={{position: 'absolute', top: 620, [side]: 50, transform: `scale(${p * pulse(side === 'left' ? 0 : 2)}) rotate(${side === 'left' ? -6 : 6}deg)`, opacity: Math.min(1, p * 1.5)}}>
      <div style={{width: 220, height: 220, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 110, fontWeight: 900, color: '#fff', background: `radial-gradient(circle at 35% 30%, ${kind === 'i5' ? I5 : I7}, ${kind === 'i5' ? '#0e7490' : '#86198f'})`, boxShadow: `0 0 ${40 + bass * 30}px ${kind === 'i5' ? I5 : I7}`, border: '4px solid rgba(255,255,255,0.6)'}}>
        {kind}
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      {frame >= c.i5 - 2 ? bubble('i5', p5, 'right') : null}
      {frame >= c.i7 - 2 ? bubble('i7', p7, 'left') : null}
      {frame >= c.comment - 4 ? (
        <div style={{position: 'absolute', left: 50, right: 50, top: 1390, transform: `translateY(${(1 - box) * 400}px)`, opacity: box, zIndex: 45}}>
          {frame >= c.price ? (
            <div style={{position: 'absolute', left: 0, right: 0, top: 380 - 1390, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + dm * 0.4})`, opacity: dm}}>
              <Glass radius={999} style={{padding: '10px 30px'}} glow={0.7} tint={`${GOLD}22`}>
                <div dir="rtl" style={{fontSize: 38, fontWeight: 900, color: '#fff'}}>
                  📩 قیمت روز همون کانفیگ <span style={{color: GOLD}}>تو دایرکتت</span>
                </div>
              </Glass>
            </div>
          ) : null}
          <Glass radius={999} style={{padding: '16px 20px'}} glow={0.6 + bass * 0.3}>
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{width: 72, height: 72, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})`}}>
                <User size={40} color="#fff" />
              </div>
              <div style={{flex: 1, fontSize: 48, fontWeight: 900, color: typed ? '#fff' : 'rgba(255,255,255,0.5)', direction: typed ? 'ltr' : 'rtl', textAlign: 'right'}}>
                {typed ? <span style={{color: I5}}>{'i5'.slice(0, typed)}</span> : 'کامنت بنویس…'}
                {!sent && Math.floor(frame / 15) % 2 === 0 ? <span style={{color: COLORS.neonHot}}>|</span> : null}
              </div>
              <div style={{width: 92, height: 92, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: typed === 2 ? `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})` : 'rgba(255,255,255,0.12)', boxShadow: typed === 2 ? `0 0 ${30 + (sent ? 30 : 0)}px ${COLORS.neon}` : 'none', transform: `scale(${tap})`}}>
                <Send size={44} color="#fff" style={{transform: 'scaleX(-1)'}} />
              </div>
            </div>
          </Glass>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── root ──────────────────────────────────────────────────────────────────
export const I5vsI7: React.FC<V2Props> = ({duration, words, segments, beats, downbeats, cutStart, cutEnd}) => {
  const frame = useCurrentFrame();
  const seg = (n: string) => segments.find((s) => s.name === n) ?? {name: n, start: 0, end: 0};
  const hook = seg('hook');
  const intro = seg('intro');
  const s5 = seg('i5');
  const s7 = seg('i7');
  const cta = seg('cta');
  const W = (sg: string, keys: string[], fb: number, after = 0) => f(cueOf(words, sg, keys, fb, after));

  const ch = {
    hook: {i5: W('hook', ['i5'], 0.4), i7: W('hook', ['i7'], 1.3), wrong: W('hook', ['اشتباه'], 2.2), money: W('hook', ['پول'], 3.1), slow: W('hook', ['دستگاهی'], 4.1)},
    intro: {i5b: W('intro', ['i5'], 6.1), i7b: W('intro', ['i7'], 6.7), surface: W('intro', ['surface'], 7.7), diff: W('intro', ['تفاوت'], 9.2), cpu: W('intro', ['پردازنده'], 10)},
    i5: {
      student: W('i5', ['دانشجو'], 12.2),
      office: W('i5', ['اداری', 'کارای'], 13),
      code: W('i5', ['برنامه'], 14),
      ps: W('i5', ['فتوشاپ'], 15.6),
      pick: W('i5', ['انتخاب'], 18.4),
      save: W('i5', ['پس'], 19.8),
    },
    i7: {
      design: W('i7', ['طراحی'], 21.5),
      ps: W('i7', ['فتوشاپ'], 22.5),
      content: W('i7', ['تولید'], 23.8),
      edit: W('i7', ['تدوین'], 24.7),
      ram: W('i7', ['رم'], 27.8),
      power: W('i7', ['قویتریه', 'قوی'], 28.6),
    },
    cta: {i5: W('cta', ['i5'], 32.1), i7: W('cta', ['i7'], 33.3), comment: W('cta', ['کامنت'], 34), write: W('cta', ['بنویس'], 34.6), price: W('cta', ['قیمت'], 36)},
  };

  // jump-zoom cuts: downbeats inside the full-screen chapters
  const cuts = downbeats
    .map(f)
    .filter((d) => (d > f(1.2) && d < f(intro.end) - 10) || (d > f(cta.start) + 20 && d < f(cta.end)));

  // music: drop on frame 0, ducked hard under the voice
  const talk = words.map((w) => [w.start - 0.12, w.end + 0.2] as const);
  const musicVol = (fr: number) => {
    let s = 0;
    for (let i = -10; i <= 10; i++) {
      const t = (fr + i) / FPS;
      const on = talk.some(([a, b]) => t >= a && t <= b);
      const base = t < 0.2 ? 0.5 : on ? 0.085 : 0.17;
      s += t > duration - 0.6 ? base * Math.max(0, (duration - t) / 0.6) : base;
    }
    return s / 21;
  };

  const sfx: {at: number; src: string; vol: number}[] = [
    {at: 0, src: 'impact', vol: 0.55},
    {at: ch.hook.i5, src: 'whoosh', vol: 0.3},
    {at: ch.hook.i7, src: 'whoosh', vol: 0.3},
    {at: ch.hook.wrong, src: 'error', vol: 0.4},
    {at: ch.hook.money, src: 'pop', vol: 0.35},
    {at: f(intro.start), src: 'whoosh', vol: 0.35},
    {at: ch.intro.cpu, src: 'impact', vol: 0.35},
    {at: f(s5.start) - 8, src: 'whoosh', vol: 0.4},
    ...['student', 'office', 'code', 'ps'].map((k) => ({at: ch.i5[k as 'student'], src: 'pop', vol: 0.3})),
    {at: ch.i5.pick, src: 'ding', vol: 0.3},
    {at: ch.i5.save, src: 'pop', vol: 0.35},
    {at: f(s7.start) - 4, src: 'whoosh', vol: 0.4},
    ...['design', 'ps', 'content', 'edit'].map((k) => ({at: ch.i7[k as 'design'], src: 'pop', vol: 0.3})),
    {at: ch.i7.ram, src: 'impact', vol: 0.5},
    {at: f(cta.start) - 6, src: 'whoosh', vol: 0.4},
    {at: ch.cta.i5, src: 'pop', vol: 0.35},
    {at: ch.cta.i7, src: 'pop', vol: 0.35},
    {at: ch.cta.write, src: 'click', vol: 0.4},
    {at: ch.cta.write + 6, src: 'click', vol: 0.4},
    {at: ch.cta.write + 24, src: 'ding', vol: 0.3},
  ];

  const beat = pulseAt(frame, beats, 7);
  const down = pulseAt(frame, downbeats, 10);
  const segCuts = [intro.start, s5.start, s7.start, cta.start].map(f);
  const since = Math.min(...segCuts.map((c) => (frame >= c ? frame - c : 999)));
  const flash = interpolate(since, [0, 3, 12], [0.55, 0.3, 0], clamp);
  const inPip = frame >= f(s5.start) - 4 && frame < f(cta.start);

  return (
    <BeatProvider beats={beats} downbeats={downbeats}>
      <BassProvider enabled musicStartFrame={0} musicTrimFrames={0} src={MUSIC_SRC}>
        <AbsoluteFill style={{background: COLORS.bgDeep, fontFamily: "'Vazirmatn', sans-serif"}}>
          <AbsoluteFill style={{transform: `scale(${1 + (inPip ? beat * 0.006 + down * 0.014 : 0)})`}}>
            <Background />
            <VideoLayer sideIn={f(s5.start)} sideOut={f(cta.start)} cuts={cuts} hookEnd={f(hook.end)} cutStart={f(cutStart)} cutEnd={f(cutEnd)} />
            <Sequence durationInFrames={f(hook.end)} layout="none">
              <Hook c={ch.hook} />
            </Sequence>
            <Sequence from={0} durationInFrames={f(intro.end) + 4} layout="none">
              {frame >= f(intro.start) ? <Intro c={ch.intro} end={f(intro.end)} /> : null}
            </Sequence>
            {frame >= f(s5.start) - 6 && frame < f(s7.start) + 6 ? (
              <ConfigChapter
                kind="i5"
                start={f(s5.start)}
                end={f(s7.start)}
                chips={[
                  {at: ch.i5.student, icon: <GraduationCap size={44} color={I5} />, text: 'دانشجویی'},
                  {at: ch.i5.office, icon: <Briefcase size={44} color={I5} />, text: 'کار اداری'},
                  {at: ch.i5.code, icon: <Code2 size={44} color={I5} />, text: 'برنامه‌نویسی'},
                  {at: ch.i5.ps, icon: <ImageIcon size={44} color={I5} />, text: 'فتوشاپ سبک'},
                ]}
                extra={
                  <>
                    <Stamp at={ch.i5.pick} text="انتخاب مناسب" color={COLORS.green} icon={<CheckCircle2 size={52} color={COLORS.green} strokeWidth={2.8} />} style={{top: 690, left: 40, width: 540}} size={44} />
                    <CashBurst at={ch.i5.save} cx={310} cy={1020} n={14} />
                    <Stamp at={ch.i5.save} text="چرا پول اضافه بدی؟" color={GOLD} icon={<PiggyBank size={54} color={GOLD} strokeWidth={2.4} />} style={{top: 1250, left: 30, width: 600}} size={44} />
                  </>
                }
              />
            ) : null}
            {frame >= f(s7.start) - 6 && frame < f(cta.start) + 6 ? (
              <ConfigChapter
                kind="i7"
                flipFrom
                start={f(s7.start)}
                end={f(cta.start)}
                chips={
                  frame < ch.i7.ram
                    ? [
                        {at: ch.i7.design, icon: <PenTool size={44} color={I7} />, text: 'طراحی گرافیک'},
                        {at: ch.i7.ps, icon: <Layers size={44} color={I7} />, text: 'فتوشاپ سنگین'},
                        {at: ch.i7.content, icon: <Camera size={44} color={I7} />, text: 'تولید محتوا'},
                        {at: ch.i7.edit, icon: <Clapperboard size={44} color={I7} />, text: 'تدوین ویدیو'},
                      ]
                    : []
                }
                extra={<RamAndPower ram={ch.i7.ram} power={ch.i7.power} />}
              />
            ) : null}
            {frame >= f(cta.start) - 2 ? <Cta c={ch.cta} /> : null}
            <Captions words={words} hideFrom={ch.cta.comment - 4} />
          </AbsoluteFill>
          {flash > 0 ? <AbsoluteFill style={{background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(157,78,221,0.45) 45%, transparent 80%)', opacity: Math.min(1, flash), mixBlendMode: 'screen', zIndex: 50}} /> : null}

          <Audio src={staticFile('video2/voice.wav')} />
          <Audio src={staticFile(MUSIC_SRC)} volume={musicVol} />
          {sfx.map((s, i) => (
            <Sequence key={i} from={Math.max(0, s.at)} durationInFrames={FPS} layout="none">
              <Audio src={staticFile(`video2/sfx/${s.src}.wav`)} volume={s.vol} />
            </Sequence>
          ))}
        </AbsoluteFill>
      </BassProvider>
    </BeatProvider>
  );
};

const RamAndPower: React.FC<{ram: number; power: number}> = ({ram, power}) => {
  const frame = useCurrentFrame();
  if (frame < ram) return null;
  const slam = interpolate(frame - ram, [0, 4, 12], [2.2, 0.92, 1], clamp);
  const bars = sp(frame, power, 18, 90);
  return (
    <div style={{position: 'absolute', top: 800, left: 40, width: 560, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 26, zIndex: 7}}>
      <div style={{transform: `scale(${slam})`, opacity: Math.min(1, (frame - ram + 1) / 3)}}>
        <Glass radius={40} style={{padding: '20px 40px'}} glow={0.9} tint={`${I7}33`}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22, direction: 'ltr'}}>
            <MemoryStick size={70} color={I7} strokeWidth={2} style={{filter: `drop-shadow(0 0 14px ${I7})`}} />
            <span style={{fontSize: 96, fontWeight: 900, color: '#fff', textShadow: `0 0 30px ${I7}`}}>16GB</span>
            <span style={{fontSize: 46, fontWeight: 900, color: I7}}>RAM</span>
          </div>
        </Glass>
      </div>
      {frame >= power ? (
        <div dir="rtl" style={{width: 560, display: 'flex', flexDirection: 'column', gap: 14, opacity: Math.min(1, bars * 1.5)}}>
          {[
            ['i5', I5, 0.62],
            ['i7', I7, 1],
          ].map(([k, c, v]) => (
            <div key={k as string} style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <span style={{width: 80, fontSize: 44, fontWeight: 900, color: c as string, direction: 'ltr', textAlign: 'center'}}>{k as string}</span>
              <div style={{flex: 1, height: 36, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
                <div style={{width: `${(v as number) * bars * 100}%`, height: '100%', borderRadius: 99, background: `linear-gradient(270deg, ${c}, ${c}88)`, boxShadow: `0 0 20px ${c}`}} />
              </div>
            </div>
          ))}
          <div style={{textAlign: 'center', fontSize: 30, fontWeight: 800, color: COLORS.silver}}>قدرت پردازش برای کارهای سنگین‌تر</div>
        </div>
      ) : null}
    </div>
  );
};
