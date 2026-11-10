import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Freeze, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import {Boxes, Cpu, Crown, Layers, Phone, Send, Sparkles, User, XCircle} from 'lucide-react';
import {COLORS, FPS} from '../config';
import {loadFonts} from '../lib/fonts';
import {clamp} from '../lib/anim';
import {BassProvider, useBass} from '../lib/audio';
import {BeatProvider, pulseAt} from '../lib/beat';
import {Glass} from '../components/Glass';
import {Background} from '../components/Background';
import {normalize} from '../lib/timeline';

loadFonts();

// ─────────────────────────────────────────────────────────────────────────
// Reel #5 — «بعضی از i5ها از i7 قوی‌ترن، باور می‌کنی؟»
// Four takes, camera sound, sped up 6% (scripts/v5_build.py). The music
// starts on the second drop of «Come Back» so frame 0 hits the kick.
// Hook: two chips collide behind the head. Example + «چرا؟»: the presenter
// shrinks into a circle top-left and the whole frame becomes the explainer.
// Ending: back full-frame, the model number gets decoded behind the head,
// then a motion-only CTA («مشاوره» → we call you).
// i5 = cyan, i7 = magenta, numbers gold.
// ─────────────────────────────────────────────────────────────────────────

export const V5_MUSIC_START = 104.04;
const MUSIC_SRC = 'video5/music.mp3';
const I5 = '#22D3EE';
const I7 = '#E040FB';
const GOLD = '#FFC53D';
const GREEN = '#2EE59D';
const RED = '#FF4D6D';
export const CTA_LEN = 3.6;

export type Word = {word: string; start: number; end: number; seg: string};
export type Seg = {name: string; start: number; end: number; cuts?: number[]};
export type V5Props = {duration: number; words: Word[]; segments: Seg[]; beats: number[]; downbeats: number[]};

const f = (s: number) => Math.round(s * FPS);
const sp = (frame: number, at: number, damping = 14, stiffness = 150) => spring({frame: frame - at, fps: FPS, config: {damping, stiffness}});
const slamAt = (frame: number, at: number) => interpolate(frame - at, [0, 5, 13], [2.3, 0.92, 1], clamp);
const ease = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const LTR: React.CSSProperties = {direction: 'ltr', unicodeBidi: 'isolate'};
const outline = (c: string, px: number): React.CSSProperties => ({WebkitTextStroke: `${px}px ${c}`, color: 'transparent', paintOrder: 'stroke fill'});

// ── chip card ────────────────────────────────────────────────────────────
const Chip: React.FC<{kind: 'i5' | 'i7'; size: number; model?: string; gen?: string; glow?: number; cracked?: number}> = ({kind, size, model, gen, glow = 0, cracked = 0}) => {
  const bass = useBass();
  const c = kind === 'i5' ? I5 : I7;
  return (
    <div style={{position: 'relative', width: size, height: size, borderRadius: size * 0.16, background: `linear-gradient(150deg, ${c}55, rgba(20,8,40,0.85) 58%, ${c}22)`, border: `3px solid ${c}`, boxShadow: `0 0 ${20 + glow * 50 + bass * 25}px ${c}, inset 0 1px 0 rgba(255,255,255,0.45), 0 20px 50px rgba(0,0,0,0.5)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
      {/* pins */}
      {[0, 1, 2, 3].map((side) => (
        <div key={side} style={{position: 'absolute', display: 'flex', gap: size * 0.06, ...(side === 0 ? {top: 6, left: '18%', right: '18%'} : side === 1 ? {bottom: 6, left: '18%', right: '18%'} : side === 2 ? {left: 6, top: '18%', bottom: '18%', flexDirection: 'column'} : {right: 6, top: '18%', bottom: '18%', flexDirection: 'column'}), justifyContent: 'space-between'}}>
          {Array.from({length: 6}, (_, i) => (
            <div key={i} style={{width: side < 2 ? size * 0.03 : size * 0.05, height: side < 2 ? size * 0.05 : size * 0.03, background: `${c}AA`, borderRadius: 2}} />
          ))}
        </div>
      ))}
      <div style={{fontSize: size * 0.11, fontWeight: 800, letterSpacing: 3, color: 'rgba(255,255,255,0.85)', ...LTR}}>INTEL CORE</div>
      <div style={{fontSize: size * 0.42, fontWeight: 900, lineHeight: 1, color: '#fff', textShadow: `0 0 30px ${c}`, ...LTR}}>{kind}</div>
      {model ? <div style={{fontSize: size * 0.1, fontWeight: 900, color: c, marginTop: 4, ...LTR}}>{model}</div> : null}
      {gen ? <div dir="rtl" style={{fontSize: size * 0.09, fontWeight: 800, color: 'rgba(255,255,255,0.85)'}}>{gen}</div> : null}
      {cracked > 0 ? (
        <svg width={size} height={size} viewBox="0 0 100 100" style={{position: 'absolute', inset: 0, opacity: cracked}}>
          <g stroke="#fff" strokeWidth="1.2" fill="none" style={{filter: 'drop-shadow(0 0 2px #fff)'}}>
            <path d="M48 0 L52 22 L40 38 L55 52 L45 70 L58 100" />
            <path d="M52 22 L75 30 L100 26" />
            <path d="M40 38 L18 44 L0 40" />
            <path d="M55 52 L80 62 L100 70" />
            <path d="M45 70 L22 80 L8 100" />
          </g>
        </svg>
      ) : null}
    </div>
  );
};

// ── hook (behind the head) ───────────────────────────────────────────────
const HookWall: React.FC<{c: {i5: number; i7: number; strong: number; believe: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const leave = interpolate(frame, [c.end - 10, c.end], [1, 0], clamp);
  // the chips fly in and collide on frame ~18
  const hit = 18;
  const fly = ease(frame / hit);
  const after = frame - hit;
  const recoil = after > 0 ? Math.exp(-after / 10) * Math.sin(after * 0.9) * 30 : 0;
  const shock = after >= 0 && after < 24 ? after / 24 : -1;
  const win = frame >= c.strong ? sp(frame, c.strong, 12, 160) : 0;
  const crack = frame >= c.strong ? interpolate(frame - c.strong, [0, 8], [0, 1], clamp) : 0;
  const shake = frame >= hit && frame < hit + 14 ? Math.sin((frame - hit) * 2.6) * 16 * (1 - (frame - hit) / 14) : 0;
  const q = frame >= c.believe ? slamAt(frame, c.believe) : 0;
  const x5 = lerp(-150, 120, fly) - (after > 0 ? recoil : 0);
  const x7 = lerp(910, 640, fly) + (after > 0 ? recoil + win * 60 : 0);
  const vsP = frame < c.strong ? slamAt(frame, 0) : 0;
  return (
    <AbsoluteFill style={{opacity: leave, transform: `translateX(${shake}px)`}}>
      {shock >= 0 ? (
        <div style={{position: 'absolute', left: 540 - 400 * shock, top: 340 - 400 * shock, width: 800 * shock, height: 800 * shock, borderRadius: '50%', border: `${10 * (1 - shock)}px solid rgba(255,255,255,${0.8 * (1 - shock)})`, boxShadow: `0 0 40px ${COLORS.neon}`}} />
      ) : null}
      <div style={{position: 'absolute', top: 175, left: x5, transform: `scale(${1 + win * 0.18}) rotate(${(1 - fly) * -25 + win * -4}deg)`, transformOrigin: 'center'}}>
        <Chip kind="i5" size={320} glow={win} />
        {win > 0 ? (
          <div style={{position: 'absolute', top: -70, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${win}) rotate(-8deg)`}}>
            <Crown size={96} color={GOLD} fill={GOLD} style={{filter: `drop-shadow(0 0 20px ${GOLD})`}} />
          </div>
        ) : null}
      </div>
      <div style={{position: 'absolute', top: 175, left: x7, transform: `scale(${1 - win * 0.12}) rotate(${(1 - fly) * 25 + win * 8}deg)`, opacity: 1 - win * 0.25}}>
        <Chip kind="i7" size={320} cracked={crack} />
      </div>
      {vsP > 0 ? (
        <div style={{position: 'absolute', top: 265, left: 0, right: 0, textAlign: 'center', fontSize: 120, fontWeight: 900, color: '#fff', transform: `scale(${vsP})`, textShadow: `0 0 ${30 + bass * 40}px ${COLORS.neon}`, ...LTR}}>VS</div>
      ) : null}
      {/* the verdict sign between them */}
      {frame >= c.strong ? (
        <div style={{position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center', fontSize: 170, fontWeight: 900, color: GOLD, transform: `scale(${slamAt(frame, c.strong)})`, textShadow: `0 0 ${30 + bass * 40}px ${GOLD}`, ...LTR}}>&gt;</div>
      ) : null}
      {q > 0 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1130, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${q}) rotate(-4deg)`}}>
          <div style={{padding: '8px 34px', borderRadius: 26, border: `5px solid ${RED}`, background: `${RED}30`, boxShadow: `0 0 36px ${RED}`, fontSize: 64, fontWeight: 900, color: '#fff'}}>باور می‌کنی؟!</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── example: full-screen comparison ──────────────────────────────────────
const ExampleStage: React.FC<{c: {start: number; i5: number; i7: number; better: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const out = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const p5 = sp(frame, c.start + 2, 13, 150);
  const p7 = sp(frame, c.start + 8, 13, 150);
  const vs = sp(frame, c.start + 14, 11, 180);
  const hot5 = frame >= c.i5 ? Math.exp(-(frame - c.i5) / 20) : 0;
  const hot7 = frame >= c.i7 ? Math.exp(-(frame - c.i7) / 20) : 0;
  const bars = sp(frame, c.better - 2, 18, 90);
  const rows: [string, string, number, string, number][] = [
    ['گرافیک', 'Iris Xe · 80 EU', 1, 'UHD 620 · 24 EU', 0.3],
    ['لیتوگرافی', '10nm', 1, '14nm', 0.71],
    ['معماری', 'Tiger Lake', 1, 'Comet Lake', 0.75],
  ];
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', top: 590, left: 50, right: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl'}}>
        <div style={{transform: `translateX(${(1 - p5) * 500}px) rotate(${(1 - p5) * 15}deg)`, opacity: Math.min(1, p5 * 1.4)}}>
          <div style={{transform: `scale(${1 + hot5 * 0.08})`}}><Chip kind="i5" size={360} model="i5-1135G7" gen="نسل ۱۱ · ۲۰۲۰" glow={Math.max(bars, hot5)} /></div>
        </div>
        <div style={{fontSize: 90, fontWeight: 900, color: '#fff', transform: `scale(${vs})`, textShadow: `0 0 30px ${COLORS.neon}`, ...LTR}}>VS</div>
        <div style={{transform: `translateX(${(1 - p7) * -500}px) rotate(${(1 - p7) * -15}deg)`, opacity: Math.min(1, p7 * 1.4) * (1 - bars * 0.25)}}>
          <div style={{transform: `scale(${1 + hot7 * 0.08})`}}><Chip kind="i7" size={360} model="i7-10510U" gen="نسل ۱۰ · ۲۰۱۹" glow={hot7} /></div>
        </div>
      </div>
      {frame >= c.better - 2 ? (
        <div style={{position: 'absolute', top: 975, left: 60, right: 60, opacity: Math.min(1, bars * 1.5)}}>
          <Glass radius={30} style={{padding: '12px 22px'}} glow={0.4 + bass * 0.3}>
            {rows.map(([label, a, va, b, vb], i) => {
              const p = sp(frame, c.better + i * 5, 16, 120);
              return (
                <div key={label} style={{marginBottom: i < rows.length - 1 ? 8 : 0}}>
                  <div dir="rtl" style={{fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.8)', marginBottom: 0}}>{label}</div>
                  {[
                    [a, va, I5],
                    [b, vb, I7],
                  ].map(([txt, v, col]) => (
                    <div key={txt as string} style={{display: 'flex', alignItems: 'center', gap: 12, height: 34, direction: 'rtl'}}>
                      <div style={{flex: 1, height: 26, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
                        <div style={{width: `${(v as number) * p * 100}%`, height: '100%', borderRadius: 99, background: `linear-gradient(270deg, ${col}, ${col}66)`, boxShadow: `0 0 14px ${col}`}} />
                      </div>
                      <span style={{width: 300, fontSize: 28, fontWeight: 900, color: col as string, ...LTR, textAlign: 'left'}}>{txt as string}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </Glass>
        </div>
      ) : null}
      {frame >= c.better + 10 ? (
        <div style={{position: 'absolute', top: 520, right: 60, transform: `scale(${slamAt(frame, c.better + 10)}) rotate(8deg)`}}>
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 10, padding: '8px 24px', borderRadius: 999, background: `${GREEN}33`, border: `4px solid ${GREEN}`, boxShadow: `0 0 30px ${GREEN}`, fontSize: 44, fontWeight: 900, color: '#fff'}}>
            <Crown size={44} color={GOLD} fill={GOLD} /> برنده
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── why: the four factors ────────────────────────────────────────────────
const WhyStage: React.FC<{c: {start: number; only: number; nasl: number; core: number; arch: number; series: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const out = interpolate(frame, [c.end - 10, c.end], [1, 0], clamp);
  const why = slamAt(frame, c.start);
  const strike = interpolate(frame, [c.only + 18, c.only + 30], [0, 1], clamp);
  const tiles = [
    {at: c.nasl, icon: Sparkles, t: 'نسل', ex: '10 → 11 → 12 …', col: GOLD},
    {at: c.core, icon: Boxes, t: 'تعداد هسته', ex: '4 · 8 · 14 cores', col: I5},
    {at: c.arch, icon: Layers, t: 'معماری', ex: 'Comet → Tiger Lake', col: GREEN},
    {at: c.series, icon: Cpu, t: 'سری', ex: 'U · P · H', col: I7},
  ];
  const labelsOut = interpolate(frame, [c.nasl - 10, c.nasl], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div dir="rtl" style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', transform: `scale(${why})`, opacity: labelsOut}}>
        <div style={{fontSize: 210, fontWeight: 900, lineHeight: 1, color: '#fff', textShadow: `0 0 40px ${COLORS.neon}, 0 0 90px ${COLORS.neon}`}}>چرا؟</div>
      </div>
      {frame >= c.only - 4 ? (
        <div style={{position: 'absolute', top: 820, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40, opacity: labelsOut}}>
          {(['i5', 'i7'] as const).map((k) => (
            <div key={k} style={{position: 'relative', transform: `scale(${sp(frame, c.only - 4, 12, 170)})`}}>
              <div style={{fontSize: 150, fontWeight: 900, color: k === 'i5' ? I5 : I7, textShadow: `0 0 30px ${k === 'i5' ? I5 : I7}`, opacity: 1 - strike * 0.5, ...LTR}}>{k}</div>
              <div style={{position: 'absolute', left: -10, right: -10, top: '50%', height: 14, borderRadius: 7, background: RED, boxShadow: `0 0 20px ${RED}`, transform: `scaleX(${strike}) rotate(-10deg)`, transformOrigin: 'right'}} />
            </div>
          ))}
        </div>
      ) : null}
      {frame >= c.only + 30 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1040, left: 0, right: 0, textAlign: 'center', opacity: labelsOut, transform: `scale(${slamAt(frame, c.only + 30)})`}}>
          <span style={{padding: '8px 30px', borderRadius: 999, background: `${RED}33`, border: `3px solid ${RED}`, fontSize: 50, fontWeight: 900, color: '#fff'}}>فقط اسمش مهم نیست!</span>
        </div>
      ) : null}
      {/* 2×2 factor grid */}
      <div style={{position: 'absolute', top: 560, left: 50, right: 50, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26, direction: 'rtl'}}>
        {tiles.map((x) => {
          if (frame < x.at - 3) return <div key={x.t} style={{height: 330}} />;
          const p = sp(frame, x.at - 3, 12, 170);
          const hot = Math.exp(-Math.max(0, frame - x.at) / 18);
          const Icon = x.icon;
          return (
            <div key={x.t} style={{height: 330, transform: `scale(${0.5 + p * 0.5}) rotate(${(1 - p) * 10}deg)`, opacity: Math.min(1, p * 1.5)}}>
              <div style={{height: '100%', borderRadius: 40, background: `linear-gradient(150deg, ${x.col}44, rgba(20,8,40,0.85) 60%)`, border: `3px solid ${x.col}`, boxShadow: `0 0 ${18 + hot * 40 + bass * 16}px ${x.col}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14}}>
                <Icon size={96} color={x.col} strokeWidth={2} style={{filter: `drop-shadow(0 0 14px ${x.col})`}} />
                <div style={{fontSize: 58, fontWeight: 900, color: '#fff'}}>{x.t}</div>
                <div style={{fontSize: 32, fontWeight: 800, color: x.col, ...LTR}}>{x.ex}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── ending: decode the model number behind the head ─────────────────────
const EndWall: React.FC<{c: {start: number; label: number; dont: number; model: number; never: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const out = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const decoding = frame >= c.model - 4;
  const lab = sp(frame, c.label - 4, 12, 170);
  const x = frame >= c.dont ? interpolate(frame - c.dont, [0, 8], [0, 1], clamp) : 0;
  const d = sp(frame, c.model - 4, 14, 150);
  const parts: [string, string, string, number][] = [
    ['i5', 'رده', I5, 0],
    ['11', 'نسل', GOLD, 6],
    ['35', 'مدل', '#fff', 12],
    ['G7', 'گرافیک', GREEN, 18],
  ];
  return (
    <AbsoluteFill style={{opacity: out}}>
      {!decoding ? (
        <div style={{position: 'absolute', top: 180, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 50, transform: `scale(${lab})`}}>
          {(['i5', 'i7'] as const).map((k) => (
            <div key={k} style={{position: 'relative', padding: '6px 34px', borderRadius: 18, background: k === 'i5' ? '#0e7490' : '#86198f', border: '4px solid rgba(255,255,255,0.8)', boxShadow: `0 0 26px ${k === 'i5' ? I5 : I7}`, fontSize: 110, fontWeight: 900, color: '#fff', transform: `rotate(${k === 'i5' ? -6 : 6}deg)`, ...LTR}}>
              {k}
              {x > 0 ? (
                <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.5 + x * 0.5})`, opacity: x}}>
                  <XCircle size={170} color={RED} strokeWidth={2.6} style={{filter: `drop-shadow(0 0 16px ${RED})`}} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div style={{position: 'absolute', top: 170, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: Math.min(1, d * 1.4), transform: `translateY(${(1 - d) * -60}px)`}}>
          <div style={{fontSize: 44, fontWeight: 800, letterSpacing: 6, color: 'rgba(255,255,255,0.9)', textShadow: '0 4px 14px rgba(0,0,0,0.6)', ...LTR}}>INTEL CORE</div>
          <div style={{display: 'flex', alignItems: 'flex-start', gap: 6, ...LTR}}>
            {parts.map(([txt, label, col, delay], i) => {
              const p = sp(frame, c.model + 10 + delay, 12, 180);
              return (
                <React.Fragment key={txt}>
                  {i === 1 ? <span style={{fontSize: 130, fontWeight: 900, color: '#fff', lineHeight: 1}}>-</span> : null}
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <span style={{fontSize: 130, fontWeight: 900, lineHeight: 1, color: col, textShadow: `0 0 ${24 + bass * 30}px ${col}, 0 6px 18px rgba(0,0,0,0.5)`}}>{txt}</span>
                    <div style={{width: '90%', height: 8, borderRadius: 4, background: col, marginTop: 6, transform: `scaleX(${p})`, boxShadow: `0 0 12px ${col}`}} />
                    <span dir="rtl" style={{marginTop: 6, fontSize: 38, fontWeight: 900, color: '#fff', opacity: p, transform: `translateY(${(1 - p) * 20}px)`, padding: '2px 14px', borderRadius: 999, background: 'rgba(10,4,20,0.6)'}}>{label}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
      {frame >= c.never ? (
        <div dir="rtl" style={{position: 'absolute', top: 1180, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${slamAt(frame, c.never)}) rotate(-3deg)`}}>
          <div style={{padding: '10px 34px', borderRadius: 26, border: `5px solid ${GOLD}`, background: `${GOLD}2A`, boxShadow: `0 0 36px ${GOLD}`, fontSize: 58, fontWeight: 900, color: '#fff'}}>
            <span style={{...LTR, color: I7}}>i7</span> ≠ همیشه بهتر
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── motion-only CTA ──────────────────────────────────────────────────────
const CtaStage: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const t = frame - start;
  const head = sp(frame, start, 13, 150);
  const box = sp(frame, start + 14, 15, 140);
  const TYPE = 'مشاوره';
  const typed = Math.max(0, Math.min(TYPE.length, Math.floor((t - 26) / 4)));
  const sentAt = start + 26 + TYPE.length * 4 + 6;
  const sent = frame >= sentAt;
  const tap = sent ? interpolate(frame - sentAt, [0, 4, 14], [1, 0.82, 1.1], clamp) : 1;
  const call = sp(frame, sentAt + 8, 12, 160);
  const ring = sent ? Math.sin((frame - sentAt) * 0.9) * 14 * Math.exp(-(frame - sentAt - 8) / 40) : 0;
  return (
    <AbsoluteFill>
      <div dir="rtl" style={{position: 'absolute', top: 330, left: 60, right: 60, textAlign: 'center', transform: `scale(${0.7 + head * 0.3})`, opacity: head}}>
        <div style={{fontSize: 70, fontWeight: 900, color: '#fff', lineHeight: 1.35, textShadow: `0 0 26px ${COLORS.neon}`}}>
          نمی‌دونی پردازنده‌ی
          <br />
          لپ‌تاپت <span style={{color: GOLD}}>خوبه یا نه؟</span>
        </div>
      </div>
      <div style={{position: 'absolute', top: 660, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 30, transform: `scale(${head})`}}>
        <Chip kind="i5" size={210} />
        <div style={{fontSize: 120, fontWeight: 900, color: GOLD, alignSelf: 'center', textShadow: `0 0 30px ${GOLD}`}}>؟</div>
        <Chip kind="i7" size={210} />
      </div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 1000, transform: `translateY(${(1 - box) * 400}px)`, opacity: box}}>
        <Glass radius={999} style={{padding: '16px 20px'}} glow={0.6 + bass * 0.3}>
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <div style={{width: 76, height: 76, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})`}}>
              <User size={42} color="#fff" />
            </div>
            <div style={{flex: 1, fontSize: 56, fontWeight: 900, color: typed ? '#fff' : 'rgba(255,255,255,0.5)'}}>
              {typed ? <span style={{color: GOLD}}>{TYPE.slice(0, typed)}</span> : 'کامنت بنویس…'}
              {!sent && Math.floor(frame / 12) % 2 === 0 ? <span style={{color: COLORS.neonHot}}>|</span> : null}
            </div>
            <div style={{width: 96, height: 96, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: typed === TYPE.length ? `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})` : 'rgba(255,255,255,0.12)', boxShadow: typed === TYPE.length ? `0 0 ${30 + (sent ? 30 : 0)}px ${COLORS.neon}` : 'none', transform: `scale(${tap})`}}>
              <Send size={46} color="#fff" style={{transform: 'scaleX(-1)'}} />
            </div>
          </div>
        </Glass>
      </div>
      {sent ? (
        <div dir="rtl" style={{position: 'absolute', top: 1160, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + call * 0.4})`, opacity: Math.min(1, call * 1.5)}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '14px 34px', borderRadius: 999, background: `linear-gradient(135deg, ${GREEN}55, rgba(20,8,40,0.85))`, border: `3px solid ${GREEN}`, boxShadow: `0 0 34px ${GREEN}`}}>
            <div style={{transform: `rotate(${ring}deg)`}}>
              <Phone size={48} color={GREEN} fill={GREEN} />
            </div>
            <span style={{fontSize: 44, fontWeight: 900, color: '#fff'}}>
              باهات تماس می‌گیریم و <span style={{color: GOLD}}>رایگان</span> راهنماییت می‌کنیم
            </span>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── captions ─────────────────────────────────────────────────────────────
const kwColor = (w: string): string | null => {
  const n = normalize(w);
  const has = (ks: string[]) => ks.some((k) => n.startsWith(normalize(k)));
  if (n.startsWith('i5')) return I5;
  if (n.startsWith('i7')) return I7;
  if (has(['۱۱', '۱۰', 'قویترن', 'بهتری'])) return GOLD;
  if (has(['نسل', 'تعداد', 'هسته', 'معماری', 'سری', 'مدل', 'دقیق'])) return COLORS.neon;
  if (has(['نکن', 'نیست'])) return RED;
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
    if (/[.!?؟،؛:]$/.test(w.word)) flush();
  }
  flush();
  for (let i = 0; i < out.length; i++) {
    const nx = out[i + 1];
    out[i].end = nx ? Math.min(nx.start, out[i].end + 0.4) : out[i].end + 0.4;
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
              ...(/[A-Za-z]/.test(w.word) ? {unicodeBidi: 'isolate'} : {}),
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

// ── root ─────────────────────────────────────────────────────────────────
// PiP circle: face centre in the first three takes ≈ (530, 730)
const FACE = {x: 530, y: 730};
const CIRCLE = {x: 40, y: 215, d: 330};
const FACE_SPAN = 470; // source pixels that fill the circle

export const I5Gen11: React.FC<V5Props> = ({duration, words, segments, beats, downbeats}) => {
  const frame = useCurrentFrame();
  const seg = (n: string) => segments.find((s) => s.name === n) ?? {name: n, start: 0, end: 0, cuts: []};
  const cue = (sg: string, keys: string[], fb: number, nth = 0) => {
    const ks = keys.map(normalize);
    const ws = words.filter((x) => x.seg === sg && ks.some((k) => normalize(x.word).startsWith(k)));
    const w = ws[nth] ?? ws[0];
    return f(w ? w.start : fb);
  };
  const S = {hook: seg('hook'), example: seg('example'), why: seg('why'), end: seg('end')};
  const ctaStart = f(duration);

  const c = {
    hook: {i5: cue('hook', ['i5'], 1.52), i7: cue('hook', ['i7'], 2.16), strong: cue('hook', ['قوی'], 2.58), believe: cue('hook', ['باور'], 3.05), end: f(S.hook.end)},
    example: {start: f(S.example.start), i5: cue('example', ['i5'], 5.42), i7: cue('example', ['i7'], 7.08), better: cue('example', ['عملکرد'], 8.19), end: f(S.example.end)},
    why: {start: f(S.why.start), only: cue('why', ['فقط'], 11.32), nasl: cue('why', ['نسل'], 13.71), core: cue('why', ['تعداد'], 14.16), arch: cue('why', ['معماری'], 14.86), series: cue('why', ['سری'], 15.78), end: f(S.why.end)},
    end: {start: f(S.end.start), label: cue('end', ['برچسب'], 18.91), dont: cue('end', ['توجه'], 20.69), model: cue('end', ['مدل'], 21.48), never: cue('end', ['همیشه'], 23.6), end: ctaStart},
  };

  // PiP amount: 0 = full frame, 1 = face in the circle
  const pipIn = ease((frame - (c.example.start - 6)) / 16);
  const pipOut = ease((frame - (c.end.start - 10)) / 14);
  const pip = frame < c.end.start + 6 ? Math.max(0, pipIn) * (1 - Math.max(0, pipOut)) : 0;
  const inCta = frame >= ctaStart;

  // camera for the full-frame parts
  const cuts = [S.hook, S.example, S.why, S.end].flatMap((s) => [s.start, ...(s.cuts ?? [])]).map(f).sort((a, b) => a - b);
  const LEVEL = [1.0, 1.0, 1.08, 1.0, 1.12, 1.04, 1.1];
  let base = 1;
  let since = 999;
  cuts.forEach((x, i) => {
    if (frame >= x) {
      base = LEVEL[i % LEVEL.length];
      since = frame - x;
    }
  });
  const open = interpolate(frame, [0, 12], [1.35, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const overshoot = interpolate(since, [0, 4, 12], [1.05, 0.99, 1], clamp);
  const punches = [c.hook.strong, c.end.model, c.end.never];
  const punch = punches.reduce((a, p) => a + (frame >= p && frame < p + 50 ? sp(frame, p, 14, 170) * 0.06 * interpolate(frame - p, [34, 50], [1, 0], clamp) : 0), 0);
  const zoom = (frame < 12 ? open : 1) * base * overshoot + punch;

  // plate box: lerp from full frame to the circle
  const box = {
    x: lerp(0, CIRCLE.x, pip),
    y: lerp(0, CIRCLE.y, pip),
    w: lerp(1080, CIRCLE.d, pip),
    h: lerp(1920, CIRCLE.d, pip),
    r: lerp(0, CIRCLE.d / 2, pip),
  };
  const sc = lerp(zoom, CIRCLE.d / FACE_SPAN, pip);
  const ax = lerp(540, FACE.x, pip);
  const ay = lerp(1920 * 0.32, FACE.y, pip);
  const vidLeft = box.w / 2 - ax * sc;
  const vidTop = lerp(1920 * 0.32 * (1 - zoom), box.h / 2 - ay * sc, pip);
  const vidLeft0 = lerp(540 * (1 - zoom), vidLeft, pip);

  const beat = pulseAt(frame, beats, 7);
  const down = pulseAt(frame, downbeats, 10);
  const bigCuts = [c.example.start, c.end.start, ctaStart];
  const sinceBig = Math.min(...bigCuts.map((x) => (frame >= x ? frame - x : 999)), frame);
  const flash = interpolate(sinceBig, [0, 3, 12], [0.6, 0.28, 0], clamp);

  const talk = words.map((w) => [w.start - 0.1, w.end + 0.16] as const);
  const musicVol = (fr: number) => {
    let s = 0;
    for (let i = -8; i <= 8; i++) {
      const t = (fr + i) / FPS;
      const on = talk.some(([a, b]) => t >= a && t <= b);
      const b0 = t < 0.1 ? 0.6 : t >= duration ? 0.5 : on ? 0.13 : 0.26;
      const tot = duration + CTA_LEN;
      s += t > tot - 0.8 ? b0 * Math.max(0, (tot - t) / 0.8) : b0;
    }
    return s / 17;
  };

  const sfx: {at: number; src: string; vol: number}[] = [
    {at: 0, src: 'whoosh', vol: 0.4},
    {at: 18, src: 'impact', vol: 0.65},
    {at: c.hook.strong, src: 'ding', vol: 0.3},
    {at: c.hook.believe, src: 'error', vol: 0.3},
    {at: c.example.start - 6, src: 'whoosh', vol: 0.4},
    {at: c.example.i5 - 4, src: 'whoosh', vol: 0.28},
    {at: c.example.i7 - 4, src: 'whoosh', vol: 0.28},
    {at: c.example.better, src: 'pop', vol: 0.3},
    {at: c.example.better + 10, src: 'impact', vol: 0.4},
    {at: c.why.start, src: 'impact', vol: 0.45},
    {at: c.why.only + 18, src: 'error', vol: 0.25},
    ...[c.why.nasl, c.why.core, c.why.arch, c.why.series].map((x) => ({at: x - 3, src: 'pop', vol: 0.3})),
    {at: c.end.start - 10, src: 'whoosh', vol: 0.4},
    {at: c.end.label - 4, src: 'pop', vol: 0.3},
    {at: c.end.dont, src: 'error', vol: 0.3},
    {at: c.end.model - 4, src: 'whoosh', vol: 0.3},
    ...[10, 16, 22, 28].map((d) => ({at: c.end.model + d, src: 'click', vol: 0.25})),
    {at: c.end.never, src: 'impact', vol: 0.45},
    {at: ctaStart, src: 'whoosh', vol: 0.4},
    {at: ctaStart + 26, src: 'click', vol: 0.3},
    {at: ctaStart + 26 + 24 + 6, src: 'ding', vol: 0.35},
  ];

  const fullFrame = pip < 0.02 && !inCta;
  const lastFrame = Math.max(0, f(duration) - 2);

  return (
    <BeatProvider beats={beats} downbeats={downbeats}>
      <BassProvider enabled musicStartFrame={0} musicTrimFrames={f(V5_MUSIC_START)} src={MUSIC_SRC}>
        <AbsoluteFill style={{background: COLORS.bgDeep, fontFamily: "'Vazirmatn', sans-serif", overflow: 'hidden'}}>
          <AbsoluteFill style={{transform: `scale(${1 + beat * 0.004 + down * 0.01})`}}>
            {/* motion world behind the PiP / CTA */}
            {pip > 0.02 || inCta ? <Background intensity={1.2} /> : null}

            {/* plate (presenter's own grade) — full frame or shrinking into the circle */}
            {!inCta ? (
              <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.r, overflow: 'hidden', zIndex: pip > 0.02 ? 20 : 0, boxShadow: pip > 0.02 ? `0 0 0 ${6 * pip}px #fff, 0 0 ${40 * pip}px ${COLORS.neon}` : undefined}}>
                <div style={{position: 'absolute', left: vidLeft0, top: vidTop, width: 1080 * sc, height: 1920 * sc}}>
                  <OffthreadVideo src={staticFile('video5/edit.mp4')} muted style={{width: '100%', height: '100%'}} />
                </div>
              </div>
            ) : (
              <AbsoluteFill style={{filter: 'blur(18px) brightness(0.35)', transform: 'scale(1.1)'}}>
                <Freeze frame={lastFrame}>
                  <OffthreadVideo src={staticFile('video5/edit.mp4')} muted style={{width: 1080, height: 1920}} />
                </Freeze>
              </AbsoluteFill>
            )}
            {fullFrame ? <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.32) 0%, transparent 15%, transparent 74%, rgba(8,4,17,0.6) 100%)'}} /> : null}

            {/* wall graphics (behind the head) */}
            {frame < c.hook.end + 2 ? <HookWall c={c.hook} /> : null}
            {frame >= c.end.start - 4 && frame < ctaStart ? <EndWall c={c.end} /> : null}
            {fullFrame ? (
              <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 32%', WebkitMaskImage: 'linear-gradient(180deg, #000 0px, #000 900px, transparent 1100px)'}}>
                <OffthreadVideo src={staticFile('video5/cutout.webm')} transparent muted style={{width: 1080, height: 1920}} />
              </AbsoluteFill>
            ) : null}

            {/* full-screen explainer stages */}
            {frame >= c.example.start - 4 && frame < c.why.start ? <ExampleStage c={c.example} /> : null}
            {frame >= c.why.start - 2 && frame < c.end.start ? <WhyStage c={c.why} /> : null}
            {inCta ? <CtaStage start={ctaStart} /> : null}

            <Captions words={words} hideFrom={ctaStart} />
          </AbsoluteFill>
          {flash > 0 ? <AbsoluteFill style={{background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(157,78,221,0.45) 45%, transparent 80%)', opacity: flash, mixBlendMode: 'screen', zIndex: 50}} /> : null}

          <Audio src={staticFile('video5/voice.wav')} />
          <Audio src={staticFile(MUSIC_SRC)} trimBefore={f(V5_MUSIC_START)} volume={musicVol} />
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
