import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import {BatteryCharging, CheckCircle2, Clock3, Fingerprint, MapPin, Monitor, Package, Phone, Plug, Send, ShieldCheck, Truck, User} from 'lucide-react';
import {COLORS, FPS} from '../config';
import {loadFonts} from '../lib/fonts';
import {clamp} from '../lib/anim';
import {BassProvider, useBass} from '../lib/audio';
import {BeatProvider, pulseAt} from '../lib/beat';
import {Background} from '../components/Background';
import {normalize} from '../lib/timeline';

loadFonts();

// ─────────────────────────────────────────────────────────────────────────
// Reel #7 — «قبل از ارسال، هر دستگاه رو این‌طوری تست می‌کنیم»
// Desk take + separate voice (scripts/v7_build.py). Hook: a parcel slams
// onto the wall behind the head with a route to Rasht. The four checks are
// full-screen explainers with the presenter in a corner circle; a tracker
// ticks them off. Warranty + CTA are full frame, then an end card.
// Music: «After Hours» (instrumental), a different section than reel #6.
// ─────────────────────────────────────────────────────────────────────────

export const V7_MUSIC_START = 70.0; // set once the track is back (see Root)
const MUSIC_SRC = 'video7/music.mp3';
const GOLD = '#FFC53D';
const CYAN = '#22D3EE';
const GREEN = '#2EE59D';
const PINK = '#FF4FA3';
const VIOLET = '#C77DFF';
export const TAIL7 = 1.0;

export type Word = {word: string; start: number; end: number; seg: string};
export type Seg = {name: string; start: number; end: number; cuts?: number[]};
export type V7Props = {duration: number; words: Word[]; segments: Seg[]; beats: number[]; downbeats: number[]; hasMusic: boolean; musicStart: number};

const f = (s: number) => Math.round(s * FPS);
const sp = (frame: number, at: number, damping = 14, stiffness = 150) => spring({frame: frame - at, fps: FPS, config: {damping, stiffness}});
const slamAt = (frame: number, at: number) => interpolate(frame - at, [0, 5, 13], [2.3, 0.92, 1], clamp);
const ease = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const LTR: React.CSSProperties = {direction: 'ltr', unicodeBidi: 'isolate'};

// ── shared ────────────────────────────────────────────────────────────────
const Panel: React.FC<{color: string; children: React.ReactNode; style?: React.CSSProperties}> = ({color, children, style}) => {
  const bass = useBass();
  return (
    <div style={{borderRadius: 32, padding: '22px 28px', background: 'linear-gradient(160deg, rgba(14,6,30,0.95), rgba(30,10,60,0.92))', border: `3px solid ${color}`, boxShadow: `0 0 ${30 + bass * 30}px ${color}99, 0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.22)`, ...style}}>
      {children}
    </div>
  );
};

const Stamp: React.FC<{at: number; color: string; top: number; children: React.ReactNode; size?: number; rot?: number}> = ({at, color, top, children, size = 56, rot = -3}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div dir="rtl" style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${slamAt(frame, at)}) rotate(${rot}deg)`, zIndex: 30}}>
      <div style={{padding: '10px 34px', borderRadius: 26, border: `5px solid ${color}`, background: 'rgba(14,6,30,0.85)', boxShadow: `0 0 36px ${color}`, fontSize: size, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap'}}>{children}</div>
    </div>
  );
};

// the 5-step tracker under the IG top bar
const STEPS = [
  {t: 'سریال', icon: Fingerprint, c: CYAN},
  {t: 'صفحه', icon: Monitor, c: PINK},
  {t: 'باتری', icon: BatteryCharging, c: GREEN},
  {t: 'پورت', icon: Plug, c: VIOLET},
  {t: 'ارسال', icon: Package, c: GOLD},
];
const Tracker: React.FC<{active: number; p: number}> = ({active, p}) => (
  <div style={{position: 'absolute', top: 112, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10, direction: 'rtl', opacity: p, zIndex: 35}}>
    {STEPS.map((s, i) => {
      const on = i === active;
      const done = i < active;
      const Icon = s.icon;
      return (
        <div key={s.t} style={{display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: on ? `${s.c}55` : done ? 'rgba(46,229,157,0.25)' : 'rgba(10,4,20,0.6)', border: `2px solid ${on ? s.c : done ? GREEN : 'rgba(255,255,255,0.25)'}`, boxShadow: on ? `0 0 20px ${s.c}` : 'none', transform: `scale(${on ? 1.1 : 0.92})`}}>
          {done ? <CheckCircle2 size={24} color={GREEN} /> : <Icon size={24} color={on ? '#fff' : 'rgba(255,255,255,0.6)'} />}
          <span style={{fontSize: 24, fontWeight: 800, color: on || done ? '#fff' : 'rgba(255,255,255,0.6)'}}>{s.t}</span>
        </div>
      );
    })}
  </div>
);

// a cardboard parcel
const Parcel: React.FC<{w: number; taped?: number}> = ({w, taped = 1}) => (
  <div style={{position: 'relative', width: w, height: w * 0.72}}>
    <div style={{position: 'absolute', inset: 0, borderRadius: 14, background: 'linear-gradient(160deg, #d8a86a, #b07a3f 60%, #8c5a28)', boxShadow: '0 24px 50px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.35)'}} />
    <div style={{position: 'absolute', left: '44%', width: '12%', top: 0, bottom: 0, background: 'rgba(240,220,170,0.75)', transform: `scaleY(${taped})`, transformOrigin: 'top'}} />
    <div style={{position: 'absolute', right: 18, bottom: 18, padding: '6px 14px', borderRadius: 8, background: '#fff', fontSize: w * 0.07, fontWeight: 900, color: '#222', display: 'flex', alignItems: 'center', gap: 6}}>
      <MapPin size={w * 0.07} color={PINK} /> رشت
    </div>
    <div style={{position: 'absolute', left: 18, top: 18, fontSize: w * 0.06, fontWeight: 900, color: '#5a3510', ...LTR}}>ArByte</div>
  </div>
);

// ── hook (behind the head) ───────────────────────────────────────────────
const HookWall: React.FC<{c: {rasht: number; bebin: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const leave = interpolate(frame, [c.end - 10, c.end], [1, 0], clamp);
  const drop = interpolate(frame, [0, 10, 16, 22], [-500, 0, -30, 0], clamp);
  const squash = interpolate(frame, [9, 12, 18], [1, 0.86, 1], clamp);
  const route = ease((frame - c.rasht + 6) / 24);
  const dust = frame >= 10 && frame < 34 ? (frame - 10) / 24 : -1;
  return (
    <AbsoluteFill style={{opacity: leave}}>
      <div dir="rtl" style={{position: 'absolute', top: 175, left: 0, right: 0, textAlign: 'center', transform: `scale(${slamAt(frame, 2)})`}}>
        <span style={{fontSize: 60, fontWeight: 900, color: '#fff', padding: '6px 26px', borderRadius: 999, background: 'linear-gradient(135deg, #FF4D6D, #c9184a)', boxShadow: '0 0 30px rgba(255,77,109,0.8)'}}>📦 تحویل فردا</span>
      </div>
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${drop}px) scaleY(${squash})`, transformOrigin: 'bottom'}}>
        <Parcel w={330} />
      </div>
      {dust >= 0 ? (
        <div style={{position: 'absolute', top: 520, left: 540 - 260 * dust - 60, width: 120 + 520 * dust, height: 40, borderRadius: '50%', background: `rgba(255,255,255,${0.45 * (1 - dust)})`, filter: 'blur(8px)'}} />
      ) : null}
      {/* route to Rasht */}
      {frame >= c.rasht - 6 ? (
        <svg width={1080} height={300} style={{position: 'absolute', top: 360, left: 0}}>
          <path d="M 120 220 C 300 40, 760 40, 960 200" fill="none" stroke={GOLD} strokeWidth={8} strokeDasharray="20 14" strokeLinecap="round" pathLength={100} style={{strokeDashoffset: 0, filter: `drop-shadow(0 0 10px ${GOLD})`}} opacity={0.9} strokeDashoffset={0} />
          <circle cx={lerp(120, 960, route)} cy={220 - Math.sin(route * Math.PI) * 140} r={18} fill="#fff" style={{filter: `drop-shadow(0 0 12px ${GOLD})`}} />
        </svg>
      ) : null}
      {frame >= c.rasht - 2 ? (
        <div style={{position: 'absolute', top: 440, right: 40, transform: `scale(${slamAt(frame, c.rasht - 2)})`, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 999, background: 'rgba(14,6,30,0.85)', border: `3px solid ${PINK}`, boxShadow: `0 0 ${20 + bass * 30}px ${PINK}`}}>
          <MapPin size={44} color={PINK} fill={PINK} />
          <span style={{fontSize: 48, fontWeight: 900, color: '#fff'}}>رشت</span>
        </div>
      ) : null}
      <Stamp at={c.bebin} color={GOLD} top={1230}>قبل از ارسال، ۵ تا تست 👀</Stamp>
    </AbsoluteFill>
  );
};

// big step badge for the explainers
const StepBadge: React.FC<{n: string; title: string; color: string; at: number}> = ({n, title, color, at}) => {
  const frame = useCurrentFrame();
  return (
    <div dir="rtl" style={{position: 'absolute', top: 250, right: 50, display: 'flex', alignItems: 'center', gap: 18, transform: `scale(${slamAt(frame, at)})`, transformOrigin: 'right center'}}>
      <div style={{width: 124, height: 124, borderRadius: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(140deg, ${color}, ${color}66)`, boxShadow: `0 0 40px ${color}`, fontSize: 88, fontWeight: 900, color: '#0b0418'}}>{n}</div>
      <div style={{fontSize: 54, fontWeight: 900, color: '#fff', lineHeight: 1.15, textShadow: `0 0 20px ${color}`}}>{title}</div>
    </div>
  );
};

// ── 1. serial ────────────────────────────────────────────────────────────
const SN = '0F3X 9K21 7Q';
const SerialStage: React.FC<{c: {start: number; win: number; match: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const a = sp(frame, c.start + 4, 14, 150);
  const b = sp(frame, c.win - 4, 14, 150);
  const scan = ((frame - c.win) * 2.2) % 100;
  const ok = frame >= c.match ? sp(frame, c.match, 12, 170) : 0;
  const lit = frame >= c.match ? SN.length : Math.max(0, Math.floor((frame - c.win) / 2));
  const snText = (col: string) => (
    <span style={{...LTR, fontFamily: 'monospace', fontSize: 52, fontWeight: 900, letterSpacing: 4}}>
      {SN.split('').map((ch, i) => (
        <span key={i} style={{color: i < lit ? col : 'rgba(255,255,255,0.55)', textShadow: i < lit ? `0 0 12px ${col}` : 'none'}}>{ch}</span>
      ))}
    </span>
  );
  return (
    <AbsoluteFill style={{opacity: out}}>
      <StepBadge n="۱" title="تطبیق سریال" color={CYAN} at={c.start} />
      <div style={{position: 'absolute', top: 600, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 26}}>
        <div style={{transform: `translateX(${(1 - a) * 600}px)`, opacity: a}}>
          <Panel color={CYAN}>
            <div dir="rtl" style={{fontSize: 34, fontWeight: 900, color: 'rgba(255,255,255,0.75)', marginBottom: 8}}>🏷️ برچسب زیر پایه</div>
            <div style={{padding: '10px 18px', borderRadius: 14, background: 'linear-gradient(160deg, #e8e8ee, #b9bac4)', display: 'flex', alignItems: 'center', gap: 14, ...LTR}}>
              <span style={{fontSize: 34, fontWeight: 900, color: '#333'}}>S/N</span>
              <span style={{...LTR, fontFamily: 'monospace', fontSize: 52, fontWeight: 900, letterSpacing: 4, color: '#111'}}>{SN}</span>
            </div>
          </Panel>
        </div>
        {frame >= c.win - 4 ? (
          <div style={{transform: `translateX(${(1 - b) * -600}px)`, opacity: b, position: 'relative'}}>
            <Panel color={VIOLET}>
              <div dir="rtl" style={{fontSize: 34, fontWeight: 900, color: 'rgba(255,255,255,0.75)', marginBottom: 8}}>🪟 ویندوز ← Settings ← About</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 14, ...LTR}}>
                <span style={{fontSize: 30, fontWeight: 800, color: 'rgba(255,255,255,0.7)'}}>Serial number</span>
                {snText(GREEN)}
              </div>
              {ok === 0 ? <div style={{position: 'absolute', left: 30, right: 30, top: `${20 + scan * 0.6}%`, height: 4, background: GREEN, boxShadow: `0 0 16px ${GREEN}`, opacity: 0.7}} /> : null}
            </Panel>
          </div>
        ) : null}
      </div>
      {ok > 0 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${slamAt(frame, c.match)})`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 34px', borderRadius: 999, background: `${GREEN}33`, border: `4px solid ${GREEN}`, boxShadow: `0 0 34px ${GREEN}`, fontSize: 56, fontWeight: 900, color: '#fff'}}>
            <CheckCircle2 size={56} color={GREEN} /> تطبیق داره
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 2. screen ────────────────────────────────────────────────────────────
const ScreenStage: React.FC<{c: {start: number; pixel: number; touch: number; corner: number; end: number}; beats: number[]}> = ({c, beats}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const pIn = sp(frame, c.start + 2, 14, 150);
  const COLS = ['#ffffff', '#ff2a2a', '#22d33a', '#2a5bff', '#000000', '#ffffff'];
  const t = frame / FPS;
  const nBeats = beats.filter((b) => b <= t && b >= c.pixel / FPS).length;
  const col = frame >= c.pixel ? COLS[nBeats % COLS.length] : '#1b1530';
  const touching = frame >= c.touch;
  const tt = Math.max(0, (frame - c.touch) / (c.end - c.touch));
  const corners = [
    [8, 8],
    [92, 8],
    [92, 92],
    [8, 92],
  ];
  const lit = frame >= c.corner ? Math.min(4, 1 + Math.floor((frame - c.corner) / 6)) : 0;
  const fx = corners[Math.min(3, Math.floor(tt * 4))];
  return (
    <AbsoluteFill style={{opacity: out}}>
      <StepBadge n="۲" title="صفحه و تاچ" color={PINK} at={c.start} />
      <div style={{position: 'absolute', top: 600, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.8 + pIn * 0.2})`, opacity: pIn}}>
        <div style={{width: 860, height: 560, borderRadius: 30, background: '#0b0b10', border: '14px solid #2a2a34', boxShadow: `0 0 40px ${PINK}88`, position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', inset: 0, background: col, transition: 'none'}} />
          {/* pixel grid magnifier */}
          {frame >= c.pixel && !touching ? (
            <div style={{position: 'absolute', right: 30, bottom: 30, width: 210, height: 210, borderRadius: 99, border: '6px solid #fff', overflow: 'hidden', boxShadow: '0 0 30px rgba(0,0,0,0.6)', backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.5) 2px, transparent 2px), linear-gradient(rgba(0,0,0,0.5) 2px, transparent 2px)`, backgroundSize: '26px 26px', backgroundColor: col}}>
              <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,0,0,0.25) 33%, rgba(0,255,0,0.25) 33% 66%, rgba(0,0,255,0.25) 66%)', backgroundSize: '26px 26px'}} />
            </div>
          ) : null}
          {touching
            ? corners.map(([x, y], i) => (
                <div key={i} style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: 56, height: 56, marginLeft: -28, marginTop: -28, borderRadius: 99, background: i < lit ? GREEN : 'rgba(255,255,255,0.25)', boxShadow: i < lit ? `0 0 20px ${GREEN}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {i < lit ? <CheckCircle2 size={40} color="#0b0418" /> : null}
                </div>
              ))
            : null}
          {touching ? (
            <div style={{position: 'absolute', left: `${fx[0]}%`, top: `${fx[1]}%`, width: 90, height: 90, marginLeft: -45, marginTop: -45, borderRadius: 99, background: 'rgba(255,255,255,0.35)', border: '4px solid #fff', boxShadow: '0 0 26px rgba(255,255,255,0.9)', transition: 'none'}} />
          ) : null}
        </div>
      </div>
      {frame >= c.pixel ? (
        <div dir="rtl" style={{position: 'absolute', top: 1200, left: 0, right: 0, textAlign: 'center', fontSize: 46, fontWeight: 900, color: '#fff'}}>
          {touching ? <span>👆 تاچ، <span style={{color: GREEN}}>گوشه به گوشه</span></span> : <span>🔍 پیکسل سوخته؟ <span style={{color: PINK}}>پیکسل به پیکسل</span></span>}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 3. battery ───────────────────────────────────────────────────────────
const BatteryStage: React.FC<{c: {start: number; report: number; percent: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const out = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const w = sp(frame, c.report - 6, 14, 150);
  const health = 0.91 * ease((frame - c.report - 10) / 40);
  const ring = 2 * Math.PI * 130;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <StepBadge n="۳" title="سلامت باتری" color={GREEN} at={c.start} />
      <Stamp at={c.start + 10} color={PINK} top={920} size={44} rot={-3}>اینو خیلیا چک نمی‌کنن! 👀</Stamp>
      <div style={{position: 'absolute', top: 560, left: 60, right: 60, display: 'flex', alignItems: 'center', gap: 30, direction: 'rtl', opacity: w, transform: `translateY(${(1 - w) * 80}px)`}}>
        <svg width={330} height={330} viewBox="0 0 330 330">
          <circle cx="165" cy="165" r="130" fill="rgba(14,6,30,0.9)" stroke="rgba(255,255,255,0.12)" strokeWidth="26" />
          <circle cx="165" cy="165" r="130" fill="none" stroke={GREEN} strokeWidth="26" strokeLinecap="round" strokeDasharray={`${ring * health} ${ring}`} transform="rotate(-90 165 165)" style={{filter: `drop-shadow(0 0 ${10 + bass * 12}px ${GREEN})`}} />
          <text x="165" y="168" textAnchor="middle" fontSize="84" fontWeight="900" fill="#fff" style={{fontFamily: 'Vazirmatn'}}>{Math.round(health * 100)}%</text>
          <text x="165" y="222" textAnchor="middle" fontSize="28" fontWeight="800" fill={GREEN} style={{fontFamily: 'Vazirmatn'}}>سلامت باتری</text>
        </svg>
        <div style={{flex: 1}}>
          <Panel color={GREEN} style={{padding: '18px 22px'}}>
            <div style={{fontSize: 30, fontWeight: 900, color: '#fff', marginBottom: 10, ...LTR}}>Battery report</div>
            {[
              ['Design', '52,000 mWh'],
              ['Full charge', `${Math.round(52000 * Math.max(0.5, health)).toLocaleString('en-US')} mWh`],
            ].map(([k, v]) => (
              <div key={k} style={{display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.85)', marginBottom: 6, ...LTR}}>
                <span>{k}</span>
                <span style={{color: GREEN}}>{v}</span>
              </div>
            ))}
            <div dir="rtl" style={{marginTop: 6, fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.5)'}}>* نمونه</div>
          </Panel>
        </div>
      </div>
      {frame >= c.percent ? (
        <div dir="rtl" style={{position: 'absolute', top: 1060, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${slamAt(frame, c.percent)})`}}>
          <div style={{padding: '12px 30px', borderRadius: 999, background: 'rgba(14,6,30,0.9)', border: `3px solid ${GOLD}`, boxShadow: `0 0 26px ${GOLD}`, fontSize: 44, fontWeight: 900, color: '#fff'}}>
            📋 درصد سلامت رو <span style={{color: GOLD}}>قبل از خرید</span> بهت می‌گیم
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 4. ports ─────────────────────────────────────────────────────────────
const PortsStage: React.FC<{c: {start: number; one: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const pIn = sp(frame, c.start + 2, 14, 150);
  const ports: [string, number, number, number][] = [
    ['USB-C', 54, 22, 11],
    ['USB-A', 78, 26, 4],
    ['شارژ', 96, 18, 9],
    ['هدفون', 26, 26, 13],
  ];
  return (
    <AbsoluteFill style={{opacity: out}}>
      <StepBadge n="۴" title="شارژ و پورت‌ها" color={VIOLET} at={c.start} />
      <div style={{position: 'absolute', top: 620, left: 50, right: 50, opacity: pIn, transform: `scale(${0.85 + pIn * 0.15})`}}>
        <div style={{height: 190, borderRadius: 40, background: 'linear-gradient(180deg, #ececf2, #b4b6c2)', boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 30px ${VIOLET}66`, display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', direction: 'ltr'}}>
          {ports.map(([name, w, h, r], i) => {
            const at = c.one + i * 7;
            const on = frame >= at;
            const p = on ? sp(frame, at, 12, 190) : 0;
            return (
              <div key={name} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                <div style={{width: w, height: h, borderRadius: r, background: '#0d0a14', border: `4px solid ${on ? GREEN : '#555'}`, boxShadow: on ? `0 0 ${18 + p * 16}px ${GREEN}` : 'none'}} />
                <div style={{width: 44, height: 44, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? GREEN : 'rgba(0,0,0,0.15)', transform: `scale(${on ? 0.6 + p * 0.4 : 1})`}}>
                  {on ? <CheckCircle2 size={34} color="#0b0418" /> : null}
                </div>
                <span style={{fontSize: 28, fontWeight: 900, color: '#333', ...LTR}}>{name}</span>
              </div>
            );
          })}
        </div>
      </div>
      {frame >= c.one + 30 ? (
        <div dir="rtl" style={{position: 'absolute', top: 920, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${slamAt(frame, c.one + 30)})`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 30px', borderRadius: 999, background: 'rgba(14,6,30,0.9)', border: `3px solid ${GREEN}`, boxShadow: `0 0 26px ${GREEN}`, fontSize: 44, fontWeight: 900, color: '#fff'}}>
            <BatteryCharging size={46} color={GREEN} /> همه یک‌به‌یک تست شدن
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── warranty (behind the head) + CTA (front) ────────────────────────────
const WarrantyWall: React.FC<{c: {start: number; card: number; test: number; send: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const pIn = sp(frame, c.start + 2, 13, 150);
  const card = frame >= c.card ? sp(frame, c.card, 12, 160) : 0;
  const tape = frame >= c.send ? ease((frame - c.send) / 10) : 0;
  const truck = frame >= c.send + 10 ? ease((frame - c.send - 10) / 30) : 0;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateX(${truck * 900}px) scale(${0.7 + pIn * 0.3})`, opacity: pIn}}>
        <div style={{position: 'relative'}}>
          <Parcel w={380} taped={tape} />
          {card > 0 && tape < 1 ? (
            <div style={{position: 'absolute', left: 60, top: -140 + card * 120, width: 260, padding: '10px 14px', borderRadius: 14, background: '#fff', boxShadow: `0 0 ${20 + bass * 20}px ${GOLD}`, transform: `rotate(${(1 - card) * -20}deg)`, opacity: 1 - tape}}>
              <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 34, fontWeight: 900, color: '#222'}}>
                <ShieldCheck size={36} color="#6D28D9" /> برگه‌ی گارانتی
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {truck > 0 ? (
        <div style={{position: 'absolute', top: 300, left: -260 + truck * 700, opacity: Math.min(1, truck * 3) * (1 - Math.max(0, truck - 0.85) * 6)}}>
          <Truck size={200} color={GOLD} style={{filter: `drop-shadow(0 0 20px ${GOLD})`}} />
        </div>
      ) : null}
      <div dir="rtl" style={{position: 'absolute', top: 1235, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18}}>
        {frame >= c.card ? (
          <div style={{transform: `scale(${slamAt(frame, c.card)}) rotate(-3deg)`, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 26px', borderRadius: 24, border: `4px solid ${VIOLET}`, background: 'rgba(14,6,30,0.88)', boxShadow: `0 0 30px ${VIOLET}`, fontSize: 46, fontWeight: 900, color: '#fff'}}>
            <ShieldCheck size={46} color={VIOLET} /> گارانتی
          </div>
        ) : null}
        {frame >= c.test ? (
          <div style={{transform: `scale(${slamAt(frame, c.test)}) rotate(3deg)`, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 26px', borderRadius: 24, border: `4px solid ${GOLD}`, background: 'rgba(14,6,30,0.88)', boxShadow: `0 0 30px ${GOLD}`, fontSize: 46, fontWeight: 900, color: '#fff'}}>
            <Clock3 size={46} color={GOLD} /> مهلت تست
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const CtaFront: React.FC<{c: {start: number; comment: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const recap = sp(frame, c.start + 2, 14, 150);
  const box = sp(frame, c.comment - 6, 15, 140);
  const TYPE = 'مشاوره';
  const typed = Math.max(0, Math.min(TYPE.length, Math.floor((frame - c.comment) / 3)));
  const sentAt = c.comment + TYPE.length * 3 + 8;
  const sent = frame >= sentAt;
  const tap = sent ? interpolate(frame - sentAt, [0, 4, 14], [1, 0.82, 1.1], clamp) : 1;
  const call = sent ? sp(frame, sentAt + 4, 12, 160) : 0;
  return (
    <AbsoluteFill>
      <div dir="rtl" style={{position: 'absolute', top: 215, left: 90, right: 90, transform: `translateY(${(1 - recap) * -120}px)`, opacity: recap}}>
        <Panel color={GREEN} style={{padding: '18px 26px'}}>
          <div style={{fontSize: 44, fontWeight: 900, color: '#fff', marginBottom: 10}}>
            ✅ ۵ تست <span style={{color: GOLD}}>قبل از ارسال</span>
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const p = sp(frame, c.start + 6 + i * 4, 12, 200);
              return (
                <div key={s.t} style={{display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: `${s.c}33`, border: `2px solid ${s.c}`, fontSize: 30, fontWeight: 900, color: '#fff', transform: `scale(${p})`}}>
                  <Icon size={28} color={s.c} /> {s.t}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
      {frame >= c.comment - 6 ? (
        <div style={{position: 'absolute', left: 50, right: 50, top: 1370, transform: `translateY(${(1 - box) * 400}px)`, opacity: box, zIndex: 45}}>
          <div style={{borderRadius: 999, padding: '16px 20px', background: 'rgba(14,6,30,0.92)', border: `3px solid ${COLORS.neon}`, boxShadow: `0 0 ${30 + bass * 30}px ${COLORS.neon}`}}>
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{width: 72, height: 72, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})`}}>
                <User size={40} color="#fff" />
              </div>
              <div style={{flex: 1, fontSize: 54, fontWeight: 900, color: typed ? '#fff' : 'rgba(255,255,255,0.5)'}}>
                {typed ? <span style={{color: GOLD}}>{TYPE.slice(0, typed)}</span> : 'کامنت بنویس…'}
                {!sent && Math.floor(frame / 12) % 2 === 0 ? <span style={{color: COLORS.neonHot}}>|</span> : null}
              </div>
              <div style={{width: 92, height: 92, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: typed === TYPE.length ? `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})` : 'rgba(255,255,255,0.12)', transform: `scale(${tap})`}}>
                <Send size={44} color="#fff" style={{transform: 'scaleX(-1)'}} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {call > 0 ? (
        <div dir="rtl" style={{position: 'absolute', top: 1250, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + call * 0.4})`, opacity: Math.min(1, call * 1.5), zIndex: 46}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 30px', borderRadius: 999, background: 'rgba(14,6,30,0.92)', border: `3px solid ${GREEN}`, boxShadow: `0 0 26px ${GREEN}`, fontSize: 40, fontWeight: 900, color: '#fff'}}>
            <Phone size={40} color={GREEN} fill={GREEN} /> باهات تماس می‌گیریم
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const p = interpolate(frame - start, [0, 8], [0, 1], clamp);
  const s1 = sp(frame, start + 2, 12, 170);
  return (
    <AbsoluteFill style={{zIndex: 48}}>
      <AbsoluteFill style={{background: 'radial-gradient(80% 60% at 50% 45%, rgba(30,10,60,0.92), rgba(8,4,17,0.97))', opacity: p}} />
      <div dir="rtl" style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, transform: `scale(${0.7 + s1 * 0.3})`, opacity: p}}>
        <div style={{fontSize: 62, fontWeight: 900, color: '#fff', textShadow: `0 0 24px ${COLORS.neon}`}}>مطمئن خرید کن 🛡️</div>
        <div style={{padding: '18px 60px', borderRadius: 999, background: `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})`, boxShadow: `0 0 ${50 + bass * 40}px ${COLORS.neon}`, fontSize: 110, fontWeight: 900, color: '#fff'}}>مشاوره</div>
        <div style={{fontSize: 44, fontWeight: 900, color: GOLD, textShadow: `0 0 18px ${GOLD}`}}>رو کامنت کن 👇</div>
        <div style={{marginTop: 30, fontSize: 36, fontWeight: 800, color: 'rgba(255,255,255,0.85)'}}>📩 برای رفیقی که آنلاین لپ‌تاپ می‌خره بفرست</div>
      </div>
    </AbsoluteFill>
  );
};

// ── captions ─────────────────────────────────────────────────────────────
const kwColor = (w: string): string | null => {
  const n = normalize(w);
  const has = (ks: string[]) => ks.some((k) => n.startsWith(normalize(k)));
  if (has(['رشت', 'فردا'])) return PINK;
  if (has(['سریال', 'تطبیق'])) return CYAN;
  if (has(['پیکسل', 'تاچ', 'گوشه'])) return PINK;
  if (has(['سلامت', 'باتری', 'درصدش'])) return GREEN;
  if (has(['شارژ', 'پورت', 'یکبهیک'])) return VIOLET;
  if (has(['گارانتیش', 'مهلت', 'مطمئن'])) return GOLD;
  if (has(['«مشاوره»', 'مشاوره', 'کامنت'])) return COLORS.neon;
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
const FACE = {x: 560, y: 840};
const CIRCLE = {x: 40, y: 215, d: 330};
const FACE_SPAN = 470;

export const Qc: React.FC<V7Props> = ({duration, words, segments, beats, downbeats, hasMusic, musicStart}) => {
  const frame = useCurrentFrame();
  const seg = (n: string) => segments.find((s) => s.name === n) ?? {name: n, start: 0, end: 0, cuts: []};
  const cue = (sg: string, keys: string[], fb: number, nth = 0) => {
    const ks = keys.map(normalize);
    const ws = words.filter((x) => x.seg === sg && ks.some((k) => normalize(x.word).startsWith(k)));
    const w = ws[nth] ?? ws[0];
    return f(w ? w.start : fb);
  };
  const S = {hook: seg('hook'), serial: seg('serial'), screen: seg('screen'), battery: seg('battery'), ports: seg('ports'), warranty: seg('warranty'), cta: seg('cta')};
  const total = f(duration + TAIL7);

  const c = {
    hook: {rasht: cue('hook', ['رشت'], 1.39), bebin: cue('hook', ['ببین'], 1.75), end: f(S.hook.end)},
    serial: {start: f(S.serial.start), win: cue('serial', ['سریال'], 4.93, 1), match: cue('serial', ['تطبیق'], 5.77), end: f(S.serial.end)},
    screen: {start: f(S.screen.start), pixel: cue('screen', ['پیکسل'], 7.66), touch: cue('screen', ['تاچ'], 8.81), corner: cue('screen', ['گوشه'], 9.51), end: f(S.screen.end)},
    battery: {start: f(S.battery.start), report: cue('battery', ['گزارش'], 12.35), percent: cue('battery', ['درصدش'], 14.39), end: f(S.battery.end)},
    ports: {start: f(S.ports.start), one: cue('ports', ['یکبهیک'], 17.32), end: f(S.ports.end)},
    warranty: {start: f(S.warranty.start), card: cue('warranty', ['گارانتیش'], 19.17), test: cue('warranty', ['مهلت'], 20.21), send: cue('warranty', ['ارسال'], 21.93), end: f(S.warranty.end)},
    cta: {start: f(S.cta.start), comment: cue('cta', ['کامنت'], 25.09), end: total},
  };

  const pipStart = c.serial.start;
  const pipEnd = c.warranty.start;
  const pipIn = ease((frame - (pipStart - 6)) / 16);
  const pipOut = ease((frame - (pipEnd - 10)) / 14);
  const pip = frame < pipEnd + 6 ? Math.max(0, pipIn) * (1 - Math.max(0, pipOut)) : 0;

  const cuts = Object.values(S).flatMap((s) => [s.start, ...(s.cuts ?? [])]).map(f).sort((a, b) => a - b);
  const LEVEL = [1.0, 1.0, 1.08, 1.0, 1.1, 1.04, 1.12, 1.06, 1.0];
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
  const punches = [c.hook.rasht, c.warranty.card, c.cta.comment];
  const punch = punches.reduce((a, p) => a + (frame >= p && frame < p + 50 ? sp(frame, p, 14, 170) * 0.06 * interpolate(frame - p, [34, 50], [1, 0], clamp) : 0), 0);
  const zoom = (frame < 12 ? open : 1) * base * overshoot + punch;

  const box = {x: lerp(0, CIRCLE.x, pip), y: lerp(0, CIRCLE.y, pip), w: lerp(1080, CIRCLE.d, pip), h: lerp(1920, CIRCLE.d, pip), r: lerp(0, CIRCLE.d / 2, pip)};
  const sc = lerp(zoom, CIRCLE.d / FACE_SPAN, pip);
  const ax = lerp(540, FACE.x, pip);
  const ay = lerp(1920 * 0.32, FACE.y, pip);
  const vidLeft = lerp(540 * (1 - zoom), box.w / 2 - ax * sc, pip);
  const vidTop = lerp(1920 * 0.32 * (1 - zoom), box.h / 2 - ay * sc, pip);

  const beat = pulseAt(frame, beats, 7);
  const down = pulseAt(frame, downbeats, 10);
  const bigCuts = [c.serial.start, c.screen.start, c.battery.start, c.ports.start, c.warranty.start];
  const sinceBig = Math.min(...bigCuts.map((x) => (frame >= x ? frame - x : 999)), frame);
  const flash = interpolate(sinceBig, [0, 3, 12], [0.6, 0.28, 0], clamp);

  const steps = [c.serial.start, c.screen.start, c.battery.start, c.ports.start, c.warranty.start];
  const active = frame >= c.cta.start ? 5 : steps.reduce((a, x, i) => (frame >= x ? i : a), -1);

  const talk = words.map((w) => [w.start - 0.1, w.end + 0.16] as const);
  const last = words[words.length - 1];
  const musicVol = (fr: number) => {
    let s = 0;
    for (let i = -8; i <= 8; i++) {
      const t = (fr + i) / FPS;
      const on = talk.some(([a, b]) => t >= a && t <= b);
      const lastEnd = last ? last.end : duration;
      const b0 = t < 0.1 ? 0.6 : last && t > last.start - 0.15 && t <= lastEnd + 0.1 ? 0.07 : on ? 0.12 : t > lastEnd ? 0.32 : 0.24;
      const tot = duration + TAIL7;
      s += t > tot - 0.5 ? b0 * Math.max(0, (tot - t) / 0.5) : b0;
    }
    return s / 17;
  };

  const sfx: {at: number; src: string; vol: number}[] = [
    {at: 0, src: 'whoosh', vol: 0.35},
    {at: 10, src: 'impact', vol: 0.6},
    {at: c.hook.rasht - 2, src: 'pop', vol: 0.3},
    {at: c.hook.bebin, src: 'impact', vol: 0.4},
    ...bigCuts.map((x) => ({at: x - 6, src: 'whoosh', vol: 0.38})),
    {at: c.serial.match, src: 'ding', vol: 0.3},
    ...[0, 1, 2, 3].map((i) => ({at: c.screen.corner + i * 6, src: 'click', vol: 0.25})),
    {at: c.battery.start + 10, src: 'error', vol: 0.22},
    {at: c.battery.percent, src: 'pop', vol: 0.3},
    ...[0, 1, 2, 3].map((i) => ({at: c.ports.one + i * 7, src: 'click', vol: 0.28})),
    {at: c.warranty.card, src: 'pop', vol: 0.32},
    {at: c.warranty.test, src: 'pop', vol: 0.32},
    {at: c.warranty.send, src: 'whoosh', vol: 0.35},
    {at: c.cta.comment, src: 'click', vol: 0.3},
    {at: c.cta.comment + 'مشاوره'.length * 3 + 8, src: 'ding', vol: 0.3},
  ];

  const fullFrame = pip < 0.02;
  const endAt = f(duration) - 2;

  return (
    <BeatProvider beats={beats} downbeats={downbeats}>
      <BassProvider enabled={hasMusic} musicStartFrame={0} musicTrimFrames={f(musicStart)} src={MUSIC_SRC}>
        <AbsoluteFill style={{background: COLORS.bgDeep, fontFamily: "'Vazirmatn', sans-serif", overflow: 'hidden'}}>
          <AbsoluteFill style={{transform: `scale(${1 + beat * 0.004 + down * 0.01})`}}>
            {pip > 0.02 ? <Background intensity={1.2} /> : null}
            <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.r, overflow: 'hidden', zIndex: pip > 0.02 ? 20 : 0, boxShadow: pip > 0.02 ? `0 0 0 ${6 * pip}px #fff, 0 0 ${40 * pip}px ${GOLD}` : undefined}}>
              <div style={{position: 'absolute', left: vidLeft, top: vidTop, width: 1080 * sc, height: 1920 * sc}}>
                <OffthreadVideo src={staticFile('video7/edit.mp4')} muted style={{width: '100%', height: '100%'}} />
              </div>
            </div>
            {fullFrame ? <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.32) 0%, transparent 15%, transparent 74%, rgba(8,4,17,0.6) 100%)'}} /> : null}

            {frame < c.hook.end + 2 ? <HookWall c={c.hook} /> : null}
            {frame >= c.warranty.start - 4 && frame < c.cta.start + 4 ? <WarrantyWall c={c.warranty} /> : null}
            {frame >= c.cta.start - 4 ? <CtaFront c={c.cta} /> : null}
            {fullFrame ? (
              <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 32%', WebkitMaskImage: 'linear-gradient(180deg, #000 0px, #000 1000px, transparent 1180px)', zIndex: 2}}>
                <OffthreadVideo src={staticFile('video7/cutout.webm')} transparent muted style={{width: 1080, height: 1920}} />
              </AbsoluteFill>
            ) : null}

            {frame >= c.serial.start - 4 && frame < c.screen.start ? <SerialStage c={c.serial} /> : null}
            {frame >= c.screen.start - 2 && frame < c.battery.start ? <ScreenStage c={c.screen} beats={beats} /> : null}
            {frame >= c.battery.start - 2 && frame < c.ports.start ? <BatteryStage c={c.battery} /> : null}
            {frame >= c.ports.start - 2 && frame < c.warranty.start ? <PortsStage c={c.ports} /> : null}

            <Tracker active={active} p={frame >= c.serial.start - 6 && frame < c.cta.start ? 1 : 0} />
            <Captions words={words} hideFrom={c.cta.comment - 6} />
            {frame >= endAt ? <EndCard start={endAt} /> : null}
          </AbsoluteFill>
          {flash > 0 ? <AbsoluteFill style={{background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,197,61,0.35) 45%, transparent 80%)', opacity: flash, mixBlendMode: 'screen', zIndex: 50}} /> : null}

          <Audio src={staticFile('video7/voice.wav')} />
          {hasMusic ? <Audio src={staticFile(MUSIC_SRC)} trimBefore={f(musicStart)} volume={musicVol} /> : null}
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
