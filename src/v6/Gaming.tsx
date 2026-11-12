import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import {CheckCircle2, MemoryStick, Monitor, Plus, Send, User, Zap} from 'lucide-react';
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
// Reel #6 — «لپ‌تاپ گیمینگ می‌خری؟ این ۳ تا عدد رو بپرس»
// Desk take + separate voice (scripts/v6_build.py), music = «Come Back» from
// its second drop like reel #5. Hook: two identical-RTX laptops behind the
// head, one pulls ahead. The three numbers are full-screen explainers with
// the presenter in a corner circle: TGP gauge, dual-channel RAM, 60 vs 144Hz.
// The CTA is full-frame: share + «گیمینگ» comment.
// Gaming accents: RTX green, hot red; brand violet stays the base.
// ─────────────────────────────────────────────────────────────────────────

export const V6_MUSIC_START = 35.17; // «After Hours» (instrumental): frame 0 on the drop
const MUSIC_SRC = 'video6/music.mp3';
const RTX = '#76E35A';
const HOT = '#FF3B5C';
const CYAN = '#22D3EE';
const GOLD = '#FFC53D';
const VIOLET = '#B57BFF';
export const TAIL6 = 0.9;

export type Word = {word: string; start: number; end: number; seg: string};
export type Seg = {name: string; start: number; end: number; cuts?: number[]};
export type V6Props = {duration: number; words: Word[]; segments: Seg[]; beats: number[]; downbeats: number[]};

const f = (s: number) => Math.round(s * FPS);
const sp = (frame: number, at: number, damping = 14, stiffness = 150) => spring({frame: frame - at, fps: FPS, config: {damping, stiffness}});
const slamAt = (frame: number, at: number) => interpolate(frame - at, [0, 5, 13], [2.3, 0.92, 1], clamp);
const ease = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const LTR: React.CSSProperties = {direction: 'ltr', unicodeBidi: 'isolate'};

// ── a gaming laptop, drawn ───────────────────────────────────────────────
const Laptop: React.FC<{w: number; glow: string; power: number; label?: string; local: number}> = ({w, glow, power, label = 'RTX 4060', local}) => {
  const bass = useBass();
  const h = w * 0.62;
  const rgb = (local * 6) % 360;
  return (
    <div style={{width: w, display: 'flex', flexDirection: 'column', alignItems: 'center', filter: `drop-shadow(0 0 ${18 + power * 30 + bass * 20}px ${glow})`}}>
      {/* screen */}
      <div style={{width: w * 0.9, height: h, borderRadius: w * 0.03, background: '#0b0b10', border: `${w * 0.012}px solid #2a2a34`, padding: w * 0.02, boxSizing: 'border-box'}}>
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.015, overflow: 'hidden', background: `linear-gradient(160deg, #1b0a3a, #3a0d2e 50%, #0a2a3a)`}}>
          {/* a racing-game horizon */}
          <div style={{position: 'absolute', left: 0, right: 0, top: '45%', height: 2, background: `${glow}`, boxShadow: `0 0 12px ${glow}`}} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const y = ((local * (1 + power * 2) + i * 18) % 100) / 100;
            return <div key={i} style={{position: 'absolute', left: `${50 - 4 - y * 40}%`, right: `${50 - 4 - y * 40}%`, top: `${45 + y * 55}%`, height: 3 + y * 6, background: `rgba(255,255,255,${0.15 + y * 0.5})`}} />;
          })}
          {/* FPS meter */}
          <div style={{position: 'absolute', left: 8, top: 8, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', fontSize: w * 0.05, fontWeight: 900, color: power > 0.5 ? RTX : HOT, ...LTR}}>
            FPS {'▮'.repeat(1 + Math.round(power * 5))}
          </div>
        </div>
      </div>
      {/* base with RGB keyboard strip */}
      <div style={{width: w, height: w * 0.05, borderRadius: `0 0 ${w * 0.03}px ${w * 0.03}px`, background: 'linear-gradient(180deg, #2c2c36, #15151c)', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: '12%', right: '12%', top: '30%', height: '35%', borderRadius: 4, background: `linear-gradient(90deg, hsl(${rgb},90%,60%), hsl(${rgb + 120},90%,60%), hsl(${rgb + 240},90%,60%))`, opacity: 0.85}} />
      </div>
      <div style={{marginTop: 10, padding: '4px 16px', borderRadius: 10, background: '#0b0b10', border: `2px solid ${RTX}`, color: RTX, fontSize: w * 0.075, fontWeight: 900, boxShadow: `0 0 14px ${RTX}88`, ...LTR}}>{label}</div>
    </div>
  );
};

// ── hook (behind the head) ───────────────────────────────────────────────
const HookWall: React.FC<{c: {kart: number; farq: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const leave = interpolate(frame, [c.end - 10, c.end], [1, 0], clamp);
  const pin = sp(frame, 0, 13, 170);
  const diff = frame >= c.farq ? sp(frame, c.farq, 12, 150) : 0;
  const shake = frame >= c.farq && frame < c.farq + 14 ? Math.sin((frame - c.farq) * 2.6) * 14 * (1 - (frame - c.farq) / 14) : 0;
  const same = frame >= c.kart ? slamAt(frame, c.kart) : 0;
  return (
    <AbsoluteFill style={{opacity: leave, transform: `translateX(${shake}px)`}}>
      <div style={{position: 'absolute', top: 230, left: 30, transform: `translateX(${(1 - pin) * -140}px) rotate(${-6 + diff * -3}deg) scale(${1 - diff * 0.08})`, opacity: 1 - diff * 0.25}}>
        <Laptop w={420} glow={HOT} power={0.25} local={frame} />
      </div>
      <div style={{position: 'absolute', top: 230, right: 30, transform: `translateX(${(1 - pin) * 140}px) rotate(${6 + diff * 3}deg) scale(${1 + diff * 0.12})`}}>
        <Laptop w={420} glow={RTX} power={0.25 + diff * 0.75} local={frame} />
      </div>
      <div style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', fontSize: 110, fontWeight: 900, color: diff > 0 ? GOLD : '#fff', transform: `scale(${slamAt(frame, 0) * (diff > 0 ? 0.6 + diff * 0.4 : 1)})`, textShadow: `0 0 ${30 + bass * 40}px ${diff > 0 ? GOLD : COLORS.neon}`, ...LTR}}>
        {diff > 0 ? '≠' : same > 0 ? '=' : 'VS'}
      </div>
      {diff > 0 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1240, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${slamAt(frame, c.farq)}) rotate(-3deg)`}}>
          <div style={{padding: '10px 34px', borderRadius: 26, border: `5px solid ${GOLD}`, background: `${GOLD}2A`, boxShadow: `0 0 36px ${GOLD}`, fontSize: 60, fontWeight: 900, color: '#fff'}}>
            یه گرافیک، دو تا قدرت؟! 🤯
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// big «۱ ۲ ۳» badge for the explainers
const NumBadge: React.FC<{n: string; title: string; color: string; at: number}> = ({n, title, color, at}) => {
  const frame = useCurrentFrame();
  const p = slamAt(frame, at);
  return (
    <div dir="rtl" style={{position: 'absolute', top: 250, right: 50, display: 'flex', alignItems: 'center', gap: 18, transform: `scale(${p})`, transformOrigin: 'right center'}}>
      <div style={{width: 130, height: 130, borderRadius: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(140deg, ${color}, ${color}66)`, boxShadow: `0 0 40px ${color}`, fontSize: 96, fontWeight: 900, color: '#0b0418'}}>{n}</div>
      <div style={{fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1.15, textShadow: `0 0 20px ${color}`}}>{title}</div>
    </div>
  );
};

// ── 1. TGP ───────────────────────────────────────────────────────────────
const TgpStage: React.FC<{c: {start: number; rtx: number; tgp: number; watt: number; power: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const out = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const strike = interpolate(frame, [c.rtx + 14, c.rtx + 26], [0, 1], clamp);
  const gIn = sp(frame, c.tgp - 6, 14, 140);
  const bars = sp(frame, c.power, 18, 90);
  const gauge = (watts: number, color: string, label: string, delay: number) => {
    const t = Math.max(0, ease((frame - c.watt - delay) / 28));
    const frac = ((watts - 35) / (115 - 35)) * t;
    const ang = -120 + frac * 240;
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
        <svg width={450} height={315} viewBox="0 0 200 140">
          <path d="M 25 120 A 80 80 0 1 1 175 120" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="16" strokeLinecap="round" />
          <path d="M 25 120 A 80 80 0 1 1 175 120" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" pathLength={100} strokeDasharray={`${frac * 100} 100`} style={{filter: `drop-shadow(0 0 6px ${color})`}} />
          <g transform={`translate(100 100) rotate(${ang})`}>
            <line x1="0" y1="0" x2="0" y2="-62" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
          </g>
          <circle cx="100" cy="100" r="9" fill="#fff" />
          <text x="100" y="136" textAnchor="middle" fontSize="26" fontWeight="900" fill={color} style={{fontFamily: 'Vazirmatn'}}>{Math.round(35 + (watts - 35) * t)}W</text>
        </svg>
        <span dir="rtl" style={{fontSize: 34, fontWeight: 900, color: '#fff'}}>{label}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{opacity: out}}>
      <NumBadge n="۱" title="توان گرافیک (TGP)" color={RTX} at={c.start} />
      {/* «فقط اسم RTX رو نبین» */}
      {frame < c.tgp + 6 ? (
        <div style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 1 - interpolate(frame, [c.tgp - 4, c.tgp + 6], [0, 1], clamp)}}>
          <div style={{position: 'relative', transform: `scale(${slamAt(frame, c.start)})`}}>
            <div style={{padding: '10px 40px', borderRadius: 20, background: '#0b0b10', border: `4px solid ${RTX}`, boxShadow: `0 0 30px ${RTX}`, fontSize: 130, fontWeight: 900, color: RTX, ...LTR}}>RTX 4060</div>
            <div style={{position: 'absolute', left: -20, right: -20, top: '50%', height: 16, borderRadius: 8, background: HOT, boxShadow: `0 0 20px ${HOT}`, transform: `scaleX(${strike}) rotate(-8deg)`, transformOrigin: 'right'}} />
          </div>
        </div>
      ) : null}
      {frame >= c.tgp - 6 ? (
        <div style={{position: 'absolute', top: 560, left: 40, right: 40, opacity: Math.min(1, gIn * 1.4), transform: `translateY(${(1 - gIn) * 80}px)`}}>
          <div dir="rtl" style={{textAlign: 'center', fontSize: 46, fontWeight: 900, color: '#fff', marginBottom: 6}}>
            همون <span style={{color: RTX, ...LTR}}>RTX 4060</span>، دو تا توان:
          </div>
          <div style={{display: 'flex', justifyContent: 'space-around', direction: 'rtl'}}>
            {gauge(115, RTX, 'لپ‌تاپ A', 0)}
            {gauge(45, HOT, 'لپ‌تاپ B', 6)}
          </div>
          {frame >= c.power - 2 ? (
            <div style={{marginTop: 14, opacity: Math.min(1, bars * 1.5)}}>
              <Glass radius={26} style={{padding: '14px 22px'}} glow={0.4 + bass * 0.3}>
                <div dir="rtl" style={{fontSize: 32, fontWeight: 900, color: 'rgba(255,255,255,0.85)', marginBottom: 8}}>قدرتی که واقعاً بهت می‌رسه</div>
                {[
                  ['A', 1, RTX],
                  ['B', 0.58, HOT],
                ].map(([k, v, col]) => (
                  <div key={k as string} style={{display: 'flex', alignItems: 'center', gap: 12, height: 44, direction: 'rtl'}}>
                    <span style={{width: 40, fontSize: 34, fontWeight: 900, color: col as string, ...LTR}}>{k as string}</span>
                    <div style={{flex: 1, height: 28, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
                      <div style={{width: `${(v as number) * bars * 100}%`, height: '100%', borderRadius: 99, background: `linear-gradient(270deg, ${col}, ${col}55)`, boxShadow: `0 0 14px ${col}`}} />
                    </div>
                  </div>
                ))}
              </Glass>
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 2. dual-channel RAM ─────────────────────────────────────────────────
const Stick: React.FC<{w: number; color: string; on: number; empty?: boolean}> = ({w, color, on, empty}) => (
  <div style={{width: w, height: w * 0.26, borderRadius: 8, border: `3px ${empty ? 'dashed' : 'solid'} ${empty ? 'rgba(255,255,255,0.5)' : color}`, background: empty ? 'transparent' : `linear-gradient(180deg, #1a5a32, #0f3a20)`, boxShadow: on > 0 ? `0 0 ${20 * on}px ${color}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', padding: '0 10px', position: 'relative'}}>
    {empty ? <Plus size={w * 0.16} color="rgba(255,255,255,0.8)" /> : [0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} style={{width: w * 0.07, height: w * 0.13, borderRadius: 3, background: '#111'}} />)}
    {!empty ? <div style={{position: 'absolute', bottom: -10, left: 10, right: 10, height: 8, background: `repeating-linear-gradient(90deg, ${GOLD} 0 4px, transparent 4px 8px)`}} /> : null}
  </div>
);

const RamStage: React.FC<{c: {start: number; dual: number; slot: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const dual = frame >= c.dual ? sp(frame, c.dual, 14, 140) : 0;
  const slot = frame >= c.slot ? sp(frame, c.slot, 12, 170) : 0;
  const flow = (frame * 9) % 100;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <NumBadge n="۲" title="رم دوکاناله" color={CYAN} at={c.start} />
      <div style={{position: 'absolute', top: 600, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
        <div style={{display: 'flex', gap: 30, alignItems: 'center'}}>
          <div style={{transform: `translateY(${(1 - sp(frame, c.start + 4, 13, 150)) * -200}px)`}}>
            <Stick w={400} color={CYAN} on={dual} />
          </div>
          <div style={{transform: `translateY(${(1 - dual) * -300}px)`, opacity: Math.min(1, dual * 1.5)}}>
            <Stick w={400} color={CYAN} on={dual} />
          </div>
        </div>
        {/* data lanes to the CPU */}
        <div style={{position: 'relative', width: 830, height: 110, opacity: Math.max(0.3, dual)}}>
          {[0, 1].map((lane) => (
            <div key={lane} style={{position: 'absolute', left: lane ? 430 : 0, width: 400, top: 0, height: 110, display: 'flex', justifyContent: 'center'}}>
              <div style={{width: 10, height: 120, borderRadius: 5, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative'}}>
                <div style={{position: 'absolute', left: 0, right: 0, top: `${flow - 30}%`, height: '30%', background: CYAN, boxShadow: `0 0 12px ${CYAN}`, opacity: lane === 0 || dual > 0.5 ? 1 : 0}} />
              </div>
            </div>
          ))}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '12px 34px', borderRadius: 20, background: 'rgba(20,8,40,0.8)', border: `3px solid ${CYAN}`, boxShadow: `0 0 26px ${CYAN}`, fontSize: 48, fontWeight: 900, color: '#fff', ...LTR}}>
          <MemoryStick size={50} color={CYAN} /> {dual > 0.5 ? 'Dual Channel ×2' : 'Single Channel'}
        </div>
        {slot > 0 ? (
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 24, transform: `scale(${slot})`}}>
            <Stick w={260} color={GOLD} on={0} empty />
            <span style={{fontSize: 48, fontWeight: 900, color: GOLD, textShadow: `0 0 18px ${GOLD}`}}>اسلات خالی برای ارتقا</span>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ── 3. 60Hz vs 144Hz ─────────────────────────────────────────────────────
const HzStage: React.FC<{c: {start: number; hz: number; eye: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const out = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const pIn = sp(frame, c.start + 2, 14, 150);
  const pane = (hz: number, color: string, steps: number) => {
    // ball position sampled at the panel's refresh rate (choppy vs smooth)
    const t = frame / FPS;
    const q = Math.floor(t * steps) / steps;
    const x = (Math.sin(q * Math.PI * 1.6) * 0.5 + 0.5) * 100;
    return (
      <div style={{width: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
        <div style={{position: 'relative', width: 520, height: 250, borderRadius: 26, background: '#0b0b10', border: `4px solid ${color}`, boxShadow: `0 0 ${20 + (hz > 100 ? bass * 30 : 0)}px ${color}`, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: 'rgba(255,255,255,0.12)'}} />
          <div style={{position: 'absolute', top: 'calc(50% - 40px)', left: `calc(${x}% * 0.8 + 4%)`, width: 80, height: 80, borderRadius: 99, background: `radial-gradient(circle at 35% 30%, #fff, ${color})`, boxShadow: `0 0 26px ${color}`}} />
          {hz > 100
            ? [1, 2, 3].map((k) => {
                const qq = t - k * 0.025;
                const xx = (Math.sin(qq * Math.PI * 1.6) * 0.5 + 0.5) * 100;
                return <div key={k} style={{position: 'absolute', top: 'calc(50% - 40px)', left: `calc(${xx}% * 0.8 + 4%)`, width: 80, height: 80, borderRadius: 99, background: color, opacity: 0.18 / k}} />;
              })
            : null}
        </div>
        <span style={{fontSize: 58, fontWeight: 900, lineHeight: 1.1, color, textShadow: `0 0 18px ${color}`, ...LTR}}>{hz}Hz</span>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{opacity: out}}>
      <NumBadge n="۳" title="صفحه‌ی ۱۴۴ هرتز" color={VIOLET} at={c.start} />
      <div style={{position: 'absolute', top: 560, left: 40, right: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: pIn, transform: `translateY(${(1 - pIn) * 80}px)`}}>
        {pane(60, HOT, 8)}
        <div style={{transform: frame >= c.hz ? `scale(${1 + Math.exp(-(frame - c.hz) / 20) * 0.08})` : undefined}}>{pane(144, RTX, 60)}</div>
      </div>
    </AbsoluteFill>
  );
};

// ── CTA (full frame, behind the head + front) ───────────────────────────
const CtaWall: React.FC<{c: {start: number; send: number; comment: number; list: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const card = sp(frame, c.start + 2, 14, 140);
  const items: [React.ReactNode, string][] = [
    [<Zap key="z" size={38} color={RTX} />, 'TGP گرافیک'],
    [<MemoryStick key="m" size={38} color={CYAN} />, 'رم دوکاناله + اسلات خالی'],
    [<Monitor key="h" size={38} color={VIOLET} />, 'صفحه‌ی ۱۴۴ هرتز به بالا'],
  ];
  const sendP = frame >= c.send ? sp(frame, c.send, 12, 170) : 0;
  const box = sp(frame, c.comment - 4, 15, 140);
  const TYPE = 'گیمینگ';
  const typed = Math.max(0, Math.min(TYPE.length, Math.floor((frame - c.comment) / 3)));
  const sentAt = c.comment + TYPE.length * 3 + 8;
  const sent = frame >= sentAt;
  const tap = sent ? interpolate(frame - sentAt, [0, 4, 14], [1, 0.82, 1.1], clamp) : 1;
  const dm = sp(frame, c.list - 2, 13, 160);
  return (
    <AbsoluteFill>
      {/* recap card behind the head: solid dark panel so it reads on the bright wall */}
      <div dir="rtl" style={{position: 'absolute', top: 215, left: 70, right: 70, transform: `translateY(${(1 - card) * -140}px) scale(${0.9 + card * 0.1})`, opacity: card}}>
        <div style={{borderRadius: 36, padding: '22px 30px 18px', background: 'linear-gradient(160deg, rgba(14,6,30,0.94), rgba(30,10,60,0.92))', border: `3px solid ${VIOLET}`, boxShadow: `0 0 ${36 + bass * 30}px ${VIOLET}AA, 0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 50, fontWeight: 900, color: '#fff', marginBottom: 10, paddingBottom: 12, borderBottom: '2px solid rgba(255,255,255,0.15)'}}>
            🎮 چک‌لیست خرید <span style={{color: GOLD, textShadow: `0 0 18px ${GOLD}`}}>لپ‌تاپ گیمینگ</span>
          </div>
          {items.map(([ic, t], i) => {
            const at = c.start + 10 + i * 9;
            const p = sp(frame, at, 12, 200);
            const on = frame >= at;
            return (
              <div key={t} style={{display: 'flex', alignItems: 'center', gap: 16, height: 76, opacity: on ? 1 : 0.35, transform: `translateX(${on ? 0 : 30}px)`}}>
                <div style={{width: 54, height: 54, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? GOLD : 'rgba(255,255,255,0.12)', boxShadow: on ? `0 0 18px ${GOLD}` : 'none', transform: `scale(${on ? 0.6 + p * 0.4 : 1})`}}>
                  <CheckCircle2 size={38} color={on ? '#1a0b2e' : 'rgba(255,255,255,0.5)'} strokeWidth={2.6} />
                </div>
                {ic}
                <span style={{fontSize: 44, fontWeight: 900, color: '#fff'}}>{t}</span>
              </div>
            );
          })}
        </div>
      </div>
      {sendP > 0 && frame < c.comment - 4 ? (
        <div style={{position: 'absolute', top: 1250, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${sendP * (1 + 0.06 * Math.sin(frame * 0.3))})`}}>
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 16, padding: '14px 36px', borderRadius: 999, background: `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})`, boxShadow: `0 0 40px ${COLORS.neon}`, fontSize: 48, fontWeight: 900, color: '#fff'}}>
            <Send size={46} color="#fff" style={{transform: 'scaleX(-1)'}} /> بفرست برای رفیق گیمرت
          </div>
        </div>
      ) : null}
      {frame >= c.list - 2 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + dm * 0.4})`, opacity: Math.min(1, dm * 1.5), zIndex: 46}}>
          <Glass radius={999} style={{padding: '10px 30px'}} glow={0.7} tint={`${GOLD}22`}>
            <div dir="rtl" style={{fontSize: 40, fontWeight: 900, color: '#fff'}}>
              📋 لیست موجودی + <span style={{color: GOLD}}>قیمت روز</span> تو دایرکتت
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
              <div style={{flex: 1, fontSize: 52, fontWeight: 900, color: typed ? '#fff' : 'rgba(255,255,255,0.5)'}}>
                {typed ? <span style={{color: RTX}}>{TYPE.slice(0, typed)}</span> : 'کامنت بنویس…'}
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

// ── end card over the last half-second (no frozen face at the end) ───────
const EndCard: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const p = interpolate(frame - start, [0, 8], [0, 1], clamp);
  const s1 = sp(frame, start + 2, 12, 170);
  return (
    <AbsoluteFill style={{zIndex: 48}}>
      <AbsoluteFill style={{background: 'radial-gradient(80% 60% at 50% 45%, rgba(30,10,60,0.9), rgba(8,4,17,0.96))', opacity: p}} />
      <div dir="rtl" style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, transform: `scale(${0.7 + s1 * 0.3})`, opacity: p}}>
        <div style={{fontSize: 64, fontWeight: 900, color: '#fff', textShadow: `0 0 24px ${COLORS.neon}`}}>کامنت کن 👇</div>
        <div style={{padding: '18px 60px', borderRadius: 999, background: `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})`, boxShadow: `0 0 ${50 + bass * 40}px ${COLORS.neon}`, fontSize: 120, fontWeight: 900, color: '#fff'}}>گیمینگ</div>
        <div style={{fontSize: 46, fontWeight: 900, color: GOLD, textShadow: `0 0 18px ${GOLD}`}}>📋 لیست موجودی + قیمت روز تو دایرکتت</div>
      </div>
    </AbsoluteFill>
  );
};

// ── captions ─────────────────────────────────────────────────────────────
const kwColor = (w: string): string | null => {
  const n = normalize(w);
  const has = (ks: string[]) => ks.some((k) => n.startsWith(normalize(k)));
  if (has(['rtx', 'tgp', 'واته', 'قدرت'])) return RTX;
  if (has(['دوکاناله', 'اسلات', 'ارتقا', 'رمش'])) return CYAN;
  if (has(['۱۴۴', 'هرتز', 'چشم'])) return VIOLET;
  if (has(['فرق', 'نبین'])) return HOT;
  if (has(['گیمینگ', '«گیمینگ»', 'کامنت', 'بفرست', 'موجودی'])) return COLORS.neon;
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
    out[i].end = nx ? Math.min(nx.start, out[i].end + 0.4) : out[i].end + 0.5;
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
const FACE = {x: 525, y: 870};
const CIRCLE = {x: 40, y: 215, d: 330};
const FACE_SPAN = 470;

export const Gaming: React.FC<V6Props> = ({duration, words, segments, beats, downbeats}) => {
  const frame = useCurrentFrame();
  const seg = (n: string) => segments.find((s) => s.name === n) ?? {name: n, start: 0, end: 0, cuts: []};
  const cue = (sg: string, keys: string[], fb: number, nth = 0) => {
    const ks = keys.map(normalize);
    const ws = words.filter((x) => x.seg === sg && ks.some((k) => normalize(x.word).startsWith(k)));
    const w = ws[nth] ?? ws[0];
    return f(w ? w.start : fb);
  };
  const S = {hook: seg('hook'), n1: seg('n1'), n2: seg('n2'), n3: seg('n3'), cta: seg('cta')};
  const total = f(duration + TAIL6);

  const c = {
    hook: {kart: cue('hook', ['کارت'], 0.87), farq: cue('hook', ['فرق'], 2.17), end: f(S.hook.end)},
    n1: {start: f(S.n1.start), rtx: cue('n1', ['rtx'], 3.44), tgp: cue('n1', ['tgp'], 4.68), watt: cue('n1', ['واته'], 5.46), power: cue('n1', ['قدرت'], 7.11), end: f(S.n1.end)},
    n2: {start: f(S.n2.start), dual: cue('n2', ['دوکاناله'], 9.61), slot: cue('n2', ['اسلات'], 10.49), end: f(S.n2.end)},
    n3: {start: f(S.n3.start), hz: cue('n3', ['۱۴۴'], 13.92), eye: cue('n3', ['چشم'], 15.88), end: f(S.n3.end)},
    cta: {start: f(S.cta.start), send: cue('cta', ['بفرست'], 19.2), comment: cue('cta', ['کامنت'], 21.0), list: cue('cta', ['لیست'], 21.7), end: total},
  };

  const pipStart = c.n1.start;
  const pipEnd = c.cta.start;
  const pipIn = ease((frame - (pipStart - 6)) / 16);
  const pipOut = ease((frame - (pipEnd - 10)) / 14);
  const pip = frame < pipEnd + 6 ? Math.max(0, pipIn) * (1 - Math.max(0, pipOut)) : 0;

  const cuts = Object.values(S).flatMap((s) => [s.start, ...(s.cuts ?? [])]).map(f).sort((a, b) => a - b);
  const LEVEL = [1.0, 1.0, 1.08, 1.0, 1.1, 1.04, 1.12, 1.06];
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
  const punches = [c.hook.farq, c.cta.send, c.cta.comment];
  const punch = punches.reduce((a, p) => a + (frame >= p && frame < p + 50 ? sp(frame, p, 14, 170) * 0.06 * interpolate(frame - p, [34, 50], [1, 0], clamp) : 0), 0);
  const holdFrom = f(duration - 0.36); // edit.mp4 holds its last good frame from here (v6_build FREEZE_AT)
  const hold = frame >= holdFrom ? interpolate(frame, [holdFrom, total], [0, 0.07], clamp) : 0;
  const zoom = (frame < 12 ? open : 1) * base * overshoot + punch + hold;

  const box = {x: lerp(0, CIRCLE.x, pip), y: lerp(0, CIRCLE.y, pip), w: lerp(1080, CIRCLE.d, pip), h: lerp(1920, CIRCLE.d, pip), r: lerp(0, CIRCLE.d / 2, pip)};
  const sc = lerp(zoom, CIRCLE.d / FACE_SPAN, pip);
  const ax = lerp(540, FACE.x, pip);
  const ay = lerp(1920 * 0.32, FACE.y, pip);
  const vidLeft = lerp(540 * (1 - zoom), box.w / 2 - ax * sc, pip);
  const vidTop = lerp(1920 * 0.32 * (1 - zoom), box.h / 2 - ay * sc, pip);

  const beat = pulseAt(frame, beats, 7);
  const down = pulseAt(frame, downbeats, 10);
  const bigCuts = [c.n1.start, c.n2.start, c.n3.start, c.cta.start];
  const sinceBig = Math.min(...bigCuts.map((x) => (frame >= x ? frame - x : 999)), frame);
  const flash = interpolate(sinceBig, [0, 3, 12], [0.6, 0.28, 0], clamp);

  const talk = words.map((w) => [w.start - 0.1, w.end + 0.16] as const);
  const musicVol = (fr: number) => {
    let s = 0;
    for (let i = -8; i <= 8; i++) {
      const t = (fr + i) / FPS;
      const on = talk.some(([a, b]) => t >= a && t <= b);
      const last = words[words.length - 1];
      const lastEnd = last ? last.end : duration;
      // the last word («کنیم») is soft: duck the music hard under it
      const b0 = t < 0.1 ? 0.6 : last && t > last.start - 0.15 ? 0.05 : on ? 0.12 : 0.26;
      const tot = duration + TAIL6;
      s += t > lastEnd ? b0 * Math.max(0, 1 - (t - lastEnd) / (tot - lastEnd)) : b0;
    }
    return s / 17;
  };

  const sfx: {at: number; src: string; vol: number}[] = [
    {at: 0, src: 'impact', vol: 0.6},
    {at: 4, src: 'whoosh', vol: 0.3},
    {at: c.hook.kart, src: 'pop', vol: 0.3},
    {at: c.hook.farq, src: 'impact', vol: 0.55},
    ...[c.n1.start, c.n2.start, c.n3.start, c.cta.start].map((x) => ({at: x - 6, src: 'whoosh', vol: 0.4})),
    {at: c.n1.rtx + 18, src: 'error', vol: 0.28},
    {at: c.n1.watt, src: 'whoosh', vol: 0.25},
    {at: c.n1.power, src: 'ding', vol: 0.25},
    {at: c.n2.dual, src: 'click', vol: 0.35},
    {at: c.n2.slot, src: 'pop', vol: 0.3},
    {at: c.n3.hz, src: 'ding', vol: 0.25},
    ...[10, 19, 28].map((d) => ({at: c.cta.start + d, src: 'pop', vol: 0.22})),
    {at: c.cta.send, src: 'whoosh', vol: 0.3},
    {at: c.cta.comment, src: 'click', vol: 0.3},
    {at: c.cta.comment + 'گیمینگ'.length * 3 + 8, src: 'ding', vol: 0.3},
  ];

  const fullFrame = pip < 0.02;

  return (
    <BeatProvider beats={beats} downbeats={downbeats}>
      <BassProvider enabled musicStartFrame={0} musicTrimFrames={f(V6_MUSIC_START)} src={MUSIC_SRC}>
        <AbsoluteFill style={{background: COLORS.bgDeep, fontFamily: "'Vazirmatn', sans-serif", overflow: 'hidden'}}>
          <AbsoluteFill style={{transform: `scale(${1 + beat * 0.004 + down * 0.01})`}}>
            {pip > 0.02 ? <Background intensity={1.2} /> : null}
            <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.r, overflow: 'hidden', zIndex: pip > 0.02 ? 20 : 0, boxShadow: pip > 0.02 ? `0 0 0 ${6 * pip}px #fff, 0 0 ${40 * pip}px ${RTX}` : undefined}}>
              <div style={{position: 'absolute', left: vidLeft, top: vidTop, width: 1080 * sc, height: 1920 * sc}}>
                <OffthreadVideo src={staticFile('video6/edit.mp4')} muted style={{width: '100%', height: '100%'}} />
              </div>
            </div>
            {fullFrame ? <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.32) 0%, transparent 15%, transparent 74%, rgba(8,4,17,0.6) 100%)'}} /> : null}

            {frame < c.hook.end + 2 ? <HookWall c={c.hook} /> : null}
            {frame >= c.cta.start - 4 ? <CtaWall c={c.cta} /> : null}
            {fullFrame ? (
              <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 32%', WebkitMaskImage: 'linear-gradient(180deg, #000 0px, #000 1020px, transparent 1200px)', zIndex: 2}}>
                <OffthreadVideo src={staticFile('video6/cutout.webm')} transparent muted style={{width: 1080, height: 1920}} />
              </AbsoluteFill>
            ) : null}

            {frame >= c.n1.start - 4 && frame < c.n2.start ? <TgpStage c={c.n1} /> : null}
            {frame >= c.n2.start - 2 && frame < c.n3.start ? <RamStage c={c.n2} /> : null}
            {frame >= c.n3.start - 2 && frame < c.cta.start ? <HzStage c={c.n3} /> : null}

            <Captions words={words} hideFrom={c.cta.comment - 4} />
            {frame >= f(duration) - 4 ? <EndCard start={f(duration) - 4} /> : null}
          </AbsoluteFill>
          {flash > 0 ? <AbsoluteFill style={{background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(118,227,90,0.4) 45%, transparent 80%)', opacity: flash, mixBlendMode: 'screen', zIndex: 50}} /> : null}

          <Audio src={staticFile('video6/voice.wav')} />
          <Audio src={staticFile(MUSIC_SRC)} trimBefore={f(V6_MUSIC_START)} volume={musicVol} />
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
