import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import {Briefcase, Clapperboard, Code2, Cpu, Gamepad2, Gpu, GraduationCap, HardDrive, MemoryStick, Monitor, PenTool, Box, Send, User} from 'lucide-react';
import {COLORS, FPS} from '../config';
import {loadFonts} from '../lib/fonts';
import {clamp} from '../lib/anim';
import {BassProvider, useBass} from '../lib/audio';
import {BeatProvider, pulseAt} from '../lib/beat';
import {Glass} from '../components/Glass';
import {normalize} from '../lib/timeline';

loadFonts();

// ─────────────────────────────────────────────────────────────────────────
// Reel #3 — «بودجه‌ت رو بگو، بهت می‌گم کدوم رو بخری»
// One desk, one take per line (scripts/v3_build.py). The wall behind the
// presenter is the stage: titles and products live *behind his head*
// (cutout.webm on top, scripts/v3_cutout.py). After each «این مدل» the
// picture blurs away into a full spec showcase on the music (the p1–p3 gaps).
// Tier colours: cheap = cyan, mid = violet, pro = hot pink.
// ─────────────────────────────────────────────────────────────────────────

export const V3_MUSIC_START = 16.48; // same Midnight City cut as reel #2
const MUSIC_SRC = 'video2/music/mc_cut.mp3';
const GOLD = '#FFC53D';
const TAIL = 0.6;

export type Word = {word: string; start: number; end: number; seg: string};
export type Seg = {name: string; start: number; end: number};
export type V3Props = {duration: number; words: Word[]; segments: Seg[]; beats: number[]; downbeats: number[]};

const f = (s: number) => Math.round(s * FPS);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sp = (frame: number, at: number, damping = 15, stiffness = 130) => spring({frame: frame - at, fps: FPS, config: {damping, stiffness}});
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

type Spec = {icon: React.FC<{size?: number; color?: string; strokeWidth?: number}>; label: string; value: string; sub?: string};
type Tier = {
  seg: string;
  gap: string;
  n: string;
  label: string;
  color: string;
  deep: string;
  uses: {key: string; text: string; icon: React.FC<{size?: number; color?: string}>}[];
  name: string;
  img: 'pro7' | 'pro7plus' | 'sls2';
  specs: Spec[];
};

const TIERS: Tier[] = [
  {
    seg: 'm1',
    gap: 'p1',
    n: '۱',
    label: 'اقتصادی',
    color: '#22D3EE',
    deep: '#0E7490',
    uses: [
      {key: 'دانشگاه', text: 'دانشگاه', icon: GraduationCap},
      {key: 'روزمره', text: 'کار روزمره', icon: Briefcase},
    ],
    name: 'Surface Pro 7',
    img: 'pro7',
    specs: [
      {icon: Cpu, label: 'پردازنده', value: 'Core i5-1035G4', sub: 'نسل ۱۰'},
      {icon: Gpu, label: 'گرافیک', value: 'Intel Iris Plus'},
      {icon: MemoryStick, label: 'رم', value: '8 / 16GB'},
      {icon: HardDrive, label: 'حافظه', value: '256GB SSD'},
      {icon: Monitor, label: 'نمایشگر', value: '12.3" 2.7K', sub: 'لمسی'},
    ],
  },
  {
    seg: 'm2',
    gap: 'p2',
    n: '۲',
    label: 'میان‌رده',
    color: '#B57BFF',
    deep: '#6D28D9',
    uses: [
      {key: 'طراحی', text: 'طراحی', icon: PenTool},
      {key: 'برنامهنویسی', text: 'برنامه‌نویسی', icon: Code2},
    ],
    name: 'Surface Pro 7+',
    img: 'pro7plus',
    specs: [
      {icon: Cpu, label: 'پردازنده', value: 'Core i7-1165G7', sub: 'نسل ۱۱'},
      {icon: Gpu, label: 'گرافیک', value: 'Intel Iris Xe'},
      {icon: MemoryStick, label: 'رم', value: '16GB'},
      {icon: HardDrive, label: 'حافظه', value: '256GB SSD'},
      {icon: Monitor, label: 'نمایشگر', value: '12.3" 2.7K', sub: 'لمسی'},
    ],
  },
  {
    seg: 'm3',
    gap: 'p3',
    n: '۳',
    label: 'حرفه‌ای',
    color: '#FF4FA3',
    deep: '#BE185D',
    uses: [
      {key: 'گیم', text: 'گیم', icon: Gamepad2},
      {key: 'رندر', text: 'رندر', icon: Box},
      {key: 'تدوین', text: 'تدوین', icon: Clapperboard},
    ],
    name: 'Surface Laptop Studio 2',
    img: 'sls2',
    specs: [
      {icon: Cpu, label: 'پردازنده', value: 'Core i7-13800H', sub: 'نسل ۱۳'},
      {icon: Gpu, label: 'گرافیک', value: 'RTX 4060 · 8GB'},
      {icon: MemoryStick, label: 'رم', value: '64GB'},
      {icon: HardDrive, label: 'حافظه', value: '2TB SSD'},
      {icon: Monitor, label: 'نمایشگر', value: '14.4" 120Hz', sub: 'لمسی'},
    ],
  },
];

// ── product art ───────────────────────────────────────────────────────────
// Pro 7 / 7+ share the chassis, so both come from the official Pro 7+ 360°
// turntable (public/surface/spin): Pro 7 is a still angle, Pro 7+ spins.
const Product: React.FC<{img: Tier['img']; w: number; local: number; color: string}> = ({img, w, local, color}) => {
  const bass = useBass();
  const glow = `drop-shadow(0 0 ${30 + bass * 40}px ${color}AA) drop-shadow(0 30px 40px rgba(0,0,0,0.55))`;
  if (img === 'sls2') {
    const sweep = ((local * 2.2) % 260) - 80;
    return (
      <div style={{position: 'relative', width: w, height: w * 0.81}}>
        <Img src={staticFile('video3/img/sls2.png')} style={{width: w, filter: glow}} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            WebkitMaskImage: `url(${staticFile('video3/img/sls2.png')})`,
            WebkitMaskSize: '100% 100%',
            background: `linear-gradient(115deg, transparent ${sweep}%, rgba(255,255,255,0.55) ${sweep + 6}%, transparent ${sweep + 14}%)`,
            mixBlendMode: 'screen',
          }}
        />
      </div>
    );
  }
  const idx = img === 'pro7plus' ? Math.floor(local / 3.5) % 36 : 5;
  return <Img src={staticFile(`surface/spin/${String(idx).padStart(2, '0')}.png`)} style={{width: w, filter: glow}} />;
};

// ── video layers ──────────────────────────────────────────────────────────
// `zoom` and `blur` are shared by the plate and the cut-out so they stay
// pixel-aligned; the cut-out only covers the top of the frame (head and
// shoulders), so the desk always comes from the plate.
const Plate: React.FC<{zoom: number; blur: number; dim: number}> = ({zoom, blur, dim}) => (
  <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 32%'}}>
    <OffthreadVideo src={staticFile('video3/edit.mp4')} muted style={{width: 1080, height: 1920, filter: blur > 0.3 ? `blur(${blur}px) brightness(${1 - dim * 0.72})` : undefined}} />
  </AbsoluteFill>
);

const Presenter: React.FC<{zoom: number}> = ({zoom}) => (
  <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 32%', WebkitMaskImage: 'linear-gradient(180deg, #000 0px, #000 880px, transparent 1080px)'}}>
    <OffthreadVideo src={staticFile('video3/cutout.webm')} transparent muted style={{width: 1080, height: 1920}} />
  </AbsoluteFill>
);

// ── captions ─────────────────────────────────────────────────────────────
const kwColor = (w: string): string | null => {
  const n = normalize(w);
  const has = (ks: string[]) => ks.some((k) => n.startsWith(normalize(k)));
  if (has(['بودجه'])) return GOLD;
  if (has(['دانشگاه', 'روزمره', 'کم'])) return TIERS[0].color;
  if (has(['طراحی', 'برنامهنویسی', 'جدیتر'])) return TIERS[1].color;
  if (has(['گیم', 'رندر', 'تدوین', 'سنگینتر'])) return TIERS[2].color;
  if (has(['کامنت', 'دایرکت', 'دقیقترین'])) return COLORS.neon;
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
    if (/[.!?؟،؛]$/.test(w.word)) flush();
  }
  flush();
  for (let i = 0; i < out.length; i++) {
    const nx = out[i + 1];
    out[i].end = nx ? Math.min(nx.start, out[i].end + 0.45) : out[i].end + 0.5;
  }
  return out;
};

const Captions: React.FC<{words: Word[]; hideFrom: number}> = ({words, hideFrom}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunks = useMemo(() => chunk(words), [words]);
  const c = chunks.find((x) => t >= x.start - 0.04 && t < x.end);
  if (!c || frame >= hideFrom) return null;
  const enter = sp(frame, f(c.start - 0.04), 13, 170);
  return (
    <div dir="rtl" style={{position: 'absolute', left: 50, right: 50, bottom: 430, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 18px', transform: `translateY(${(1 - enter) * 50}px) scale(${0.85 + enter * 0.15})`, opacity: Math.min(1, enter * 1.5), zIndex: 40}}>
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
              fontSize: col ? 84 : 76,
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
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

// ── wall (behind the head) ───────────────────────────────────────────────
const outline = (c: string, px = 4): React.CSSProperties => ({WebkitTextStroke: `${px}px ${c}`, color: 'transparent', paintOrder: 'stroke fill'});

const HookWall: React.FC<{c: {kodom: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const s1 = interpolate(frame, [0, 5, 12], [2.1, 0.94, 1], clamp);
  const s2 = interpolate(frame, [4, 9, 16], [2.1, 0.94, 1], clamp);
  const leave = interpolate(frame, [c.end - 6, c.end + 2], [1, 0], clamp);
  const q = sp(frame, c.kodom - 2, 11, 170);
  return (
    <AbsoluteFill style={{opacity: leave}}>
      <div dir="rtl" style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', transform: `scale(${s1})`}}>
        <div style={{fontSize: 210, fontWeight: 900, lineHeight: 1, color: GOLD, textShadow: `0 0 ${40 + bass * 40}px ${GOLD}, 0 10px 30px rgba(0,0,0,0.5)`}}>بودجه‌ت</div>
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 545, left: 0, right: 0, textAlign: 'center', transform: `scale(${s2})`, opacity: frame >= 4 ? 1 : 0}}>
        <div style={{fontSize: 230, fontWeight: 900, lineHeight: 1, ...outline('#fff', 5), filter: `drop-shadow(0 0 18px ${COLORS.neon})`}}>چقدره؟</div>
      </div>
      {/* three candidates pop in on «کدوم» (the middle one hides behind the head) */}
      {frame >= c.kodom - 2
        ? TIERS.map((t, i) => {
            const p = sp(frame, c.kodom - 2 + i * 5, 11, 170);
            const pos = [{left: 690, top: 800}, {left: 355, top: 590}, {left: 20, top: 800}][i];
            const bob = Math.sin((frame + i * 25) * 0.07) * 6;
            return (
              <div key={t.n} style={{position: 'absolute', ...pos, width: 370, display: 'flex', justifyContent: 'center', transform: `translateY(${bob}px) scale(${p}) rotate(${(1 - p) * 25 + (i - 1) * -6}deg)`, opacity: Math.min(1, p * 1.5)}}>
                <Product img={t.img} w={t.img === 'sls2' ? 300 : 340} local={0} color={t.color} />
                <div style={{position: 'absolute', top: -30, right: 30, width: 84, height: 84, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 900, color: '#fff', background: `radial-gradient(circle at 35% 30%, ${t.color}, ${t.deep})`, boxShadow: `0 0 26px ${t.color}`, border: '3px solid rgba(255,255,255,0.7)'}}>؟</div>
              </div>
            );
          })
        : null}
    </AbsoluteFill>
  );
};

// giant tier word behind the head, then the product slams in on «این مدل»
const TierWall: React.FC<{t: Tier; start: number; inMadal: number; end: number}> = ({t, start, inMadal, end}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const enter = sp(frame, start - 2, 13, 150);
  const word = interpolate(frame, [inMadal - 4, inMadal + 2], [1, 0], clamp);
  const slam = interpolate(frame - inMadal, [0, 5, 12], [2.4, 0.9, 1], clamp);
  return (
    <AbsoluteFill>
      {word > 0 ? (
        <div dir="rtl" style={{position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: word * Math.min(1, enter * 1.4), transform: `translateY(${(1 - enter) * -160}px)`}}>
          <div style={{fontSize: 56, fontWeight: 900, color: '#fff', padding: '6px 30px', borderRadius: 999, background: `${t.color}44`, border: `3px solid ${t.color}`, boxShadow: `0 0 26px ${t.color}`}}>
            بودجه‌ی {t.n === '۱' ? 'کم' : t.n === '۲' ? 'متوسط' : 'بالا'}
          </div>
          <div style={{fontSize: 250, fontWeight: 900, lineHeight: 1.1, marginTop: 6, ...outline(t.color, 6), filter: `drop-shadow(0 0 ${20 + bass * 30}px ${t.color})`}}>{t.label}</div>
        </div>
      ) : null}
      {frame >= inMadal ? (
        <div style={{position: 'absolute', top: t.img === 'sls2' ? 150 : 200, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${slam})`, opacity: interpolate(frame, [end - 1, end], [1, 0], clamp)}}>
          <Product img={t.img} w={t.img === 'sls2' ? 620 : 700} local={frame - inMadal} color={t.color} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// use-case chips either side of the face, in front of everything
const Uses: React.FC<{t: Tier; cues: number[]; end: number}> = ({t, cues, end}) => {
  const frame = useCurrentFrame();
  const leave = interpolate(frame, [end - 6, end], [1, 0], clamp);
  const slots = [
    {right: 40, top: 760},
    {left: 40, top: 760},
    {right: 60, top: 900},
  ];
  return (
    <AbsoluteFill style={{opacity: leave}}>
      {t.uses.map((u, i) => {
        const at = cues[i];
        if (frame < at - 2) return null;
        const p = sp(frame, at - 2, 11, 180);
        const Icon = u.icon;
        const side = 'right' in slots[i] ? 1 : -1;
        return (
          <div key={u.text} style={{position: 'absolute', ...slots[i], transform: `translateX(${(1 - p) * 300 * side}px) scale(${0.6 + p * 0.4}) rotate(${side * -4}deg)`, opacity: Math.min(1, p * 1.5), zIndex: 30}}>
            <Glass radius={30} style={{padding: '14px 24px'}} glow={0.5} tint={`${t.color}33`}>
              <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 14}}>
                <div style={{width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${t.color}33`, border: `2px solid ${t.color}`, boxShadow: `0 0 16px ${t.color}`}}>
                  <Icon size={38} color={t.color} />
                </div>
                <span style={{fontSize: 46, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap'}}>{u.text}</span>
              </div>
            </Glass>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── the spec showcase in each gap ────────────────────────────────────────
const Showcase: React.FC<{t: Tier; start: number; end: number; inMadal: number; rowAt: number[]}> = ({t, start, end, inMadal, rowAt}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const k = ease((frame - start + 2) / 12); // product glides from the wall into place
  const out = ease((frame - (end - 8)) / 8);
  const local = frame - inMadal;
  const fromTop = t.img === 'sls2' ? 150 : 200;
  const fromW = t.img === 'sls2' ? 620 : 700;
  const toW = t.img === 'sls2' ? 760 : 860;
  const w = lerp(fromW, toW, k);
  const name = sp(frame, start + 2, 14, 160);
  return (
    <AbsoluteFill style={{transform: `translateY(${out * -120}px) scale(${1 - out * 0.08})`, opacity: 1 - out}}>
      {/* spotlight + floor */}
      <div style={{position: 'absolute', left: 540 - 520, top: 120, width: 1040, height: 900, borderRadius: '50%', background: `radial-gradient(closest-side, ${t.color}${Math.round(40 + bass * 60).toString(16).padStart(2, '0')}, transparent 72%)`, opacity: k}} />
      <div style={{position: 'absolute', left: 140, right: 140, top: 820, height: 70, borderRadius: '50%', background: `radial-gradient(closest-side, ${t.color}99, transparent)`, filter: 'blur(14px)', opacity: k}} />
      <div style={{position: 'absolute', top: lerp(fromTop, 230, k), left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Product img={t.img} w={w} local={local} color={t.color} />
      </div>
      {/* name + tier */}
      <div style={{position: 'absolute', top: 880, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transform: `translateY(${(1 - name) * 60}px)`, opacity: Math.min(1, name * 1.4)}}>
        <div style={{fontSize: t.name.length > 16 ? 70 : 84, fontWeight: 900, color: '#fff', direction: 'ltr', letterSpacing: -1, textShadow: `0 0 30px ${t.color}, 0 6px 20px rgba(0,0,0,0.8)`, whiteSpace: 'nowrap'}}>{t.name}</div>
      </div>
      {/* spec rows */}
      <div style={{position: 'absolute', top: 1000, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 12}}>
        {t.specs.map((s, i) => {
          const p = sp(frame, rowAt[i], 13, 190);
          if (frame < rowAt[i]) return <div key={s.label} style={{height: 84}} />;
          const Icon = s.icon;
          const hero = (t.img === 'sls2' && (i === 1 || i === 2)) || (t.img === 'pro7plus' && i === 0);
          return (
            <div key={s.label} style={{height: 84, transform: `translateX(${(1 - p) * (i % 2 ? -1 : 1) * 260}px)`, opacity: Math.min(1, p * 1.6)}}>
              <div
                dir="rtl"
                style={{
                  height: 84,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '0 22px',
                  borderRadius: 26,
                  background: `linear-gradient(270deg, ${t.color}${hero ? '55' : '2A'}, rgba(20,8,40,0.72) 60%)`,
                  border: `2px solid ${t.color}${hero ? 'FF' : '88'}`,
                  boxShadow: hero ? `0 0 ${24 + bass * 26}px ${t.color}` : `0 0 12px ${t.color}55`,
                  backdropFilter: 'blur(16px)',
                }}
              >
                <Icon size={44} color={t.color} strokeWidth={2.2} />
                <span style={{fontSize: 38, fontWeight: 800, color: 'rgba(255,255,255,0.75)', width: 170}}>{s.label}</span>
                <span style={{flex: 1}} />
                {s.sub ? <span style={{fontSize: 32, fontWeight: 800, color: t.color}}>{s.sub}</span> : null}
                <span style={{fontSize: 46, fontWeight: 900, color: '#fff', direction: 'ltr', whiteSpace: 'nowrap'}}>{s.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── CTA ─────────────────────────────────────────────────────────────────
const CtaLayer: React.FC<{c: {start: number; kart: number; comment: number; daqiq: number; direct: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const box = sp(frame, c.comment - 4, 15, 140);
  const TYPE = '۳۰ میلیون، دانشگاه';
  const typed = Math.max(0, Math.min(TYPE.length, Math.floor((frame - c.comment) / 1.6)));
  const sent = frame >= c.comment + Math.ceil(TYPE.length * 1.6) + 6;
  const tap = sent ? interpolate(frame - (c.comment + Math.ceil(TYPE.length * 1.6) + 6), [0, 4, 14], [1, 0.82, 1.1], clamp) : 1;
  const dm = sp(frame, c.direct - 2, 13, 160);
  return (
    <AbsoluteFill>
      {/* the three tiers line up behind the head */}
      {TIERS.map((t, i) => {
        const p = sp(frame, c.start + 2 + i * 4, 12, 160);
        const bob = Math.sin((frame + i * 20) * 0.08) * 8;
        return (
          <div key={t.n} style={{position: 'absolute', top: 300 + (i === 1 ? -60 : 0) + bob, left: [730, 400, 70][i], width: 290, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${p})`, opacity: Math.min(1, p * 1.5)}}>
            <Product img={t.img} w={t.img === 'sls2' ? 250 : 280} local={0} color={t.color} />
            <div style={{marginTop: 8, padding: '4px 18px', borderRadius: 999, background: `${t.color}44`, border: `2px solid ${t.color}`, fontSize: 30, fontWeight: 900, color: '#fff'}}>{t.label}</div>
          </div>
        );
      })}
      {frame >= c.direct - 2 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + dm * 0.4})`, opacity: Math.min(1, dm * 1.5), zIndex: 46}}>
          <Glass radius={999} style={{padding: '10px 30px'}} glow={0.7} tint={`${GOLD}22`}>
            <div dir="rtl" style={{fontSize: 40, fontWeight: 900, color: '#fff'}}>
              📩 بهترین گزینه + <span style={{color: GOLD}}>قیمت روز</span> تو دایرکتت
            </div>
          </Glass>
        </div>
      ) : null}
      {frame >= c.comment - 4 ? (
        <div style={{position: 'absolute', left: 50, right: 50, top: 1370, transform: `translateY(${(1 - box) * 400}px)`, opacity: box, zIndex: 45}}>
          <Glass radius={999} style={{padding: '16px 20px'}} glow={0.6 + bass * 0.3}>
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{width: 72, height: 72, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})`}}>
                <User size={40} color="#fff" />
              </div>
              <div style={{flex: 1, fontSize: 48, fontWeight: 900, color: typed ? '#fff' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden'}}>
                {typed ? <span>{TYPE.slice(0, typed)}</span> : 'کامنت بنویس…'}
                {!sent && Math.floor(frame / 12) % 2 === 0 ? <span style={{color: COLORS.neonHot}}>|</span> : null}
              </div>
              <div style={{width: 92, height: 92, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: typed === TYPE.length ? `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})` : 'rgba(255,255,255,0.12)', boxShadow: typed === TYPE.length ? `0 0 ${30 + (sent ? 30 : 0)}px ${COLORS.neon}` : 'none', transform: `scale(${tap})`}}>
                <Send size={44} color="#fff" style={{transform: 'scaleX(-1)'}} />
              </div>
            </div>
          </Glass>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// little «۱ ۲ ۳» tier tracker under the IG top bar
const Tracker: React.FC<{active: number; p: number}> = ({active, p}) => (
  <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18, direction: 'rtl', opacity: p, zIndex: 35}}>
    {TIERS.map((t, i) => {
      const on = i === active;
      const done = i < active;
      return (
        <div key={t.n} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px', borderRadius: 999, background: on ? `${t.color}55` : 'rgba(10,4,20,0.55)', border: `2px solid ${on || done ? t.color : 'rgba(255,255,255,0.25)'}`, boxShadow: on ? `0 0 22px ${t.color}` : 'none', transform: `scale(${on ? 1.08 : 0.92})`}}>
          <span style={{fontSize: 30, fontWeight: 900, color: '#fff'}}>{t.n}</span>
          <span style={{fontSize: 28, fontWeight: 800, color: on ? '#fff' : 'rgba(255,255,255,0.6)'}}>{t.label}</span>
        </div>
      );
    })}
  </div>
);

// ── root ─────────────────────────────────────────────────────────────────
export const Budget: React.FC<V3Props> = ({duration, words, segments, beats, downbeats}) => {
  const frame = useCurrentFrame();
  const seg = (n: string) => segments.find((s) => s.name === n) ?? {name: n, start: 0, end: 0};
  const cue = (sg: string, keys: string[], fb: number) => {
    const ks = keys.map(normalize);
    const w = words.find((x) => x.seg === sg && ks.some((k) => normalize(x.word).startsWith(k)));
    return f(w ? w.start : fb);
  };
  const hook = seg('hook');
  const cta = seg('cta');
  const total = duration + TAIL;

  // per tier: segment, gap, «این» cue, use-case cues, spec row times on beats
  const tiers = TIERS.map((t) => {
    const s = seg(t.seg);
    const g = seg(t.gap);
    const inMadal = cue(t.seg, ['این'], s.end - 1);
    const uses = t.uses.map((u) => cue(t.seg, [u.key], s.start + 0.5));
    const bs = beats.filter((b) => b >= g.start + 0.15 && b < g.end - 0.6);
    const rowAt = t.specs.map((_, i) => {
      const half = bs.length >= 2 ? (bs[1] - bs[0]) / 2 : 0.29; // eighth notes
      return f((bs[0] ?? g.start + 0.2) + i * half);
    });
    return {t, s: f(s.start), e: f(s.end), gs: f(g.start), ge: f(g.end), inMadal, uses, rowAt};
  });

  const c = {
    kodom: cue('hook', ['کدوم'], 1.36),
    start: f(cta.start),
    kart: cue('cta', ['کارت'], 20.4),
    comment: cue('cta', ['کامنت'], 21),
    daqiq: cue('cta', ['دقیق'], 21.7),
    direct: cue('cta', ['دایرکت'], 23.75),
    end: f(total),
  };

  // which phase are we in?
  const gapIdx = tiers.findIndex((x) => frame >= x.gs && frame < x.ge);
  const tierIdx = tiers.findIndex((x) => frame >= x.s && frame < x.ge);

  // camera: slam-in on the hook, a punch-in on every «این مدل», alternating
  // framings per take (jump-cut feel), blur-away into each showcase
  const speakCuts = [hook, seg('m1'), seg('m2'), seg('m3'), cta].map((x) => f(x.start));
  const LEVEL = [1.0, 1.1, 1.0, 1.12, 1.04];
  let base = 1;
  let since = 999;
  speakCuts.forEach((s0, i) => {
    if (frame >= s0) {
      base = LEVEL[i];
      since = frame - s0;
    }
  });
  const open = interpolate(frame, [0, 12], [1.38, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const overshoot = interpolate(since, [0, 4, 12], [1.05, 0.99, 1], clamp);
  const punch = tiers.reduce((acc, x) => acc + (frame >= x.inMadal && frame < x.gs ? sp(frame, x.inMadal, 14, 170) * 0.09 : 0), 0);
  const gapP = tiers.reduce((acc, x) => Math.max(acc, frame >= x.gs - 4 && frame < x.ge + 6 ? Math.min(ease((frame - x.gs + 4) / 10), 1 - ease((frame - (x.ge - 6)) / 10)) : 0), 0);
  const zoom = (frame < 12 ? open : 1) * base * overshoot + punch + gapP * 0.18;
  const blur = gapP * 22;

  const beat = pulseAt(frame, beats, 7);
  const down = pulseAt(frame, downbeats, 10);

  // flashes on every take change
  const changes = [...speakCuts.slice(1), ...tiers.map((x) => x.gs)];
  const sinceChange = Math.min(...changes.map((x) => (frame >= x ? frame - x : 999)));
  const flash = interpolate(sinceChange, [0, 3, 12], [0.5, 0.25, 0], clamp);

  // music: drop on frame 0, ducked under the voice, up in the showcases
  const talk = words.map((w) => [w.start - 0.12, w.end + 0.2] as const);
  const musicVol = (fr: number) => {
    let s = 0;
    for (let i = -8; i <= 8; i++) {
      const t = (fr + i) / FPS;
      const on = talk.some(([a, b]) => t >= a && t <= b);
      const inGap = tiers.some((x) => fr + i >= x.gs && fr + i < x.ge);
      const b0 = t < 0.25 ? 0.5 : on ? 0.09 : inGap ? 0.36 : 0.2;
      s += t > total - 0.7 ? b0 * Math.max(0, (total - t) / 0.7) : b0;
    }
    return s / 17;
  };

  const sfx: {at: number; src: string; vol: number}[] = [
    {at: 0, src: 'impact', vol: 0.55},
    {at: 4, src: 'whoosh', vol: 0.25},
    ...[0, 3, 6].map((d) => ({at: c.kodom - 2 + d, src: 'pop', vol: 0.25})),
    ...tiers.flatMap((x) => [
      {at: x.s - 4, src: 'whoosh', vol: 0.35},
      ...x.uses.map((u) => ({at: u - 2, src: 'pop', vol: 0.28})),
      {at: x.inMadal, src: 'impact', vol: 0.5},
      {at: x.gs - 4, src: 'whoosh', vol: 0.4},
      ...x.rowAt.map((r) => ({at: r, src: 'click', vol: 0.22})),
      {at: x.rowAt[x.rowAt.length - 1] + 6, src: 'ding', vol: 0.22},
    ]),
    {at: c.start - 4, src: 'whoosh', vol: 0.35},
    ...[0, 4, 8].map((d) => ({at: c.start + 2 + d, src: 'pop', vol: 0.25})),
    {at: c.comment, src: 'click', vol: 0.3},
    {at: c.comment + Math.ceil('۳۰ میلیون، دانشگاه'.length * 1.6) + 6, src: 'ding', vol: 0.3},
  ];

  const showPresenter = gapP < 0.98;
  const activeTier = gapIdx >= 0 ? gapIdx : tierIdx;
  const trackerP = activeTier >= 0 ? 1 : 0;

  return (
    <BeatProvider beats={beats} downbeats={downbeats}>
      <BassProvider enabled musicStartFrame={0} musicTrimFrames={0} src={MUSIC_SRC}>
        <AbsoluteFill style={{background: COLORS.bgDeep, fontFamily: "'Vazirmatn', sans-serif", overflow: 'hidden'}}>
          <AbsoluteFill style={{transform: `scale(${1 + beat * 0.004 + down * 0.01})`}}>
            <Plate zoom={zoom} blur={blur} dim={gapP} />
            {/* colour wash for the showcase */}
            {gapP > 0 ? (
              <AbsoluteFill style={{opacity: gapP, background: `radial-gradient(110% 70% at 50% 35%, ${tiers[Math.max(0, gapIdx >= 0 ? gapIdx : tierIdx)]?.t.deep ?? COLORS.neon}55, rgba(8,4,17,0.75) 75%)`}} />
            ) : null}
            {/* vignette + top/bottom shade for text */}
            <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.55) 0%, transparent 20%, transparent 62%, rgba(8,4,17,0.85) 100%)'}} />

            {/* ── wall: behind the head ── */}
            <Sequence durationInFrames={f(hook.end) + 2} layout="none">
              <HookWall c={{kodom: c.kodom, end: f(hook.end)}} />
            </Sequence>
            {tiers.map((x) =>
              frame >= x.s - 4 && frame < x.gs ? <TierWall key={x.t.n} t={x.t} start={x.s} inMadal={x.inMadal} end={x.gs} /> : null,
            )}
            {frame >= c.start - 2 ? <CtaLayer c={c} /> : null}

            {showPresenter ? <Presenter zoom={zoom} /> : null}

            {/* ── front ── */}
            {tiers.map((x) => (frame >= x.s - 2 && frame < x.gs + 2 ? <Uses key={x.t.n} t={x.t} cues={x.uses} end={x.gs} /> : null))}
            {tiers.map((x) => (frame >= x.gs - 2 && frame < x.ge + 2 ? <Showcase key={x.t.n} t={x.t} start={x.gs} end={x.ge} inMadal={x.inMadal} rowAt={x.rowAt} /> : null))}
            <Tracker active={activeTier} p={trackerP} />
            <Captions words={words} hideFrom={c.comment - 4} />
          </AbsoluteFill>
          {flash > 0 ? <AbsoluteFill style={{background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(157,78,221,0.45) 45%, transparent 80%)', opacity: flash, mixBlendMode: 'screen', zIndex: 50}} /> : null}

          <Audio src={staticFile('video3/voice.wav')} />
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

