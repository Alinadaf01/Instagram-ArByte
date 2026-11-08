import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';
import {CheckCircle2, Cpu, HardDrive, ScanSearch, Search, Send, User} from 'lucide-react';
import {COLORS, FPS} from '../config';
import {loadFonts} from '../lib/fonts';
import {clamp} from '../lib/anim';
import {BassProvider, useBass} from '../lib/audio';
import {BeatProvider, pulseAt} from '../lib/beat';
import {Glass} from '../components/Glass';
import {normalize} from '../lib/timeline';
import {Product} from '../v3/Budget';

loadFonts();

// ─────────────────────────────────────────────────────────────────────────
// Reel #4 — «این سرفیس پرو ۷ پلاسه… یا پرو ۵؟»
// Same desk as reel #3 (scripts/v4_build.py cuts the presenter's own grade).
// Music «Come Back» starts on its drop, so frame 0 hits the kick.
// The wall is the stage (cutout.webm on top): hook headline, then four
// «clues», each with its own graphic, a tracker and a closing checklist CTA.
// Colours: Pro 7+ cyan · Pro 7 violet · Pro 5/6 pink · numbers gold.
// ─────────────────────────────────────────────────────────────────────────

export const V4_MUSIC_START = 24.02;
const MUSIC_SRC = 'video4/music.mp3';
const P7P = '#22D3EE';
const P7 = '#B57BFF';
const P5 = '#FF4FA3';
const GOLD = '#FFC53D';
const GREEN = '#2EE59D';
const TAIL = 0.7;

export type Word = {word: string; start: number; end: number; seg: string};
export type Seg = {name: string; start: number; end: number; cuts?: number[]};
export type V4Props = {duration: number; words: Word[]; segments: Seg[]; beats: number[]; downbeats: number[]};

const f = (s: number) => Math.round(s * FPS);
const sp = (frame: number, at: number, damping = 14, stiffness = 150) => spring({frame: frame - at, fps: FPS, config: {damping, stiffness}});
const slamAt = (frame: number, at: number) => interpolate(frame - at, [0, 5, 13], [2.3, 0.92, 1], clamp);
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const outline = (c: string, px: number): React.CSSProperties => ({WebkitTextStroke: `${px}px ${c}`, color: 'transparent', paintOrder: 'stroke fill'});
const LTR: React.CSSProperties = {direction: 'ltr', unicodeBidi: 'isolate'};

// ── shared bits ───────────────────────────────────────────────────────────
const Pill: React.FC<{color: string; children: React.ReactNode; size?: number; style?: React.CSSProperties}> = ({color, children, size = 44, style}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 28px', borderRadius: 999, background: `linear-gradient(135deg, ${color}66, rgba(20,8,40,0.78))`, border: `3px solid ${color}`, boxShadow: `0 0 26px ${color}AA`, fontSize: size, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', backdropFilter: 'blur(12px)', ...style}}>
    {children}
  </div>
);

// «سرنخ ۱ / ۴» card that slams onto the wall at each chapter start
const ClueTitle: React.FC<{n: string; title: string; color: string; at: number; end: number}> = ({n, title, color, at, end}) => {
  const frame = useCurrentFrame();
  if (frame < at - 2 || frame > end) return null;
  const p = sp(frame, at - 2, 12, 170);
  const out = interpolate(frame, [end - 8, end], [1, 0], clamp);
  return (
    <div dir="rtl" style={{position: 'absolute', top: 205, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: out, transform: `translateY(${(1 - p) * -90}px) scale(${0.7 + p * 0.3})`}}>
      <Pill color={color} size={46}>
        <span style={{width: 58, height: 58, borderRadius: 99, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: color, color: '#0b0418', fontSize: 40}}>{n}</span>
        {title}
      </Pill>
    </div>
  );
};

// ── 1. hook ───────────────────────────────────────────────────────────────
const SLOT = ['7+', '6', '5', '7', '7+', '5', '6', '7+'];
const HookWall: React.FC<{c: {p7: number; p5: number; same: number; four: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const leave = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  // slot machine until «پرو ۷ پلاسه», then the two cards
  const spinning = frame < c.p7;
  const digit = SLOT[Math.floor(frame / 3) % SLOT.length];
  const split = sp(frame, c.p5 - 2, 13, 150);
  const same = sp(frame, c.same - 2, 13, 150);
  const four = frame >= c.four ? slamAt(frame, c.four) : 0;
  const shake = frame >= c.four && frame < c.four + 16 ? Math.sin((frame - c.four) * 2.4) * 12 * (1 - (frame - c.four) / 16) : 0;
  const card = (label: string, color: string, x: number, show: number, year: string) => (
    <div style={{position: 'absolute', left: x, top: 260, width: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: Math.min(1, show * 1.5), transform: `scale(${0.6 + show * 0.4})`}}>
      <div style={{fontSize: 118, fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap', color, textShadow: `0 0 ${30 + bass * 40}px ${color}, 0 8px 24px rgba(0,0,0,0.5)`, ...LTR}}>{label}</div>
      <div style={{marginTop: 4, fontSize: 40, fontWeight: 900, color: '#fff', ...LTR, opacity: four > 0 ? 1 : 0, textShadow: `0 0 16px ${color}`}}>{year}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{opacity: leave, transform: `translateX(${shake}px)`}}>
      {/* frame-0 headline: SURFACE PRO + spinning model digit */}
      {spinning || split < 0.02 ? (
        <div style={{position: 'absolute', top: 230, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${slamAt(frame, 0)})`}}>
          <div style={{fontSize: 64, fontWeight: 900, letterSpacing: 10, color: '#fff', textShadow: `0 0 20px ${COLORS.neon}`, ...LTR}}>SURFACE PRO</div>
          <div style={{fontSize: 250, fontWeight: 900, lineHeight: 1, color: spinning ? '#fff' : P7P, textShadow: `0 0 40px ${spinning ? COLORS.neon : P7P}`, filter: spinning ? 'blur(1.5px)' : undefined, ...LTR}}>{spinning ? digit : '7+'}</div>
        </div>
      ) : (
        <>
          {card('PRO 7+', P7P, 540 - 230 - split * 262, 1, '2021')}
          {card('PRO 5', P5, 540 - 230 + split * 262, split, '2017')}
          {/* = then ≠ */}
          <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontSize: 130, fontWeight: 900, color: four > 0 ? GOLD : '#fff', opacity: same, transform: `scale(${four > 0 ? four : 0.6 + same * 0.4})`, textShadow: `0 0 30px ${four > 0 ? GOLD : COLORS.neon}`}}>
            {four > 0 ? '≠' : '='}
          </div>
        </>
      )}
      {/* «از بیرون عین همن»: the same device twice, behind the head */}
      {frame >= c.same - 2 && four === 0 ? (
        <>
          <div style={{position: 'absolute', left: 30, top: 690, transform: `scale(${same}) rotate(-8deg)`, opacity: same}}>
            <Product img="pro7" w={330} local={0} color={P7P} />
          </div>
          <div style={{position: 'absolute', left: 720, top: 690, transform: `scale(${same}) rotate(8deg) scaleX(-1)`, opacity: same}}>
            <Product img="pro7" w={330} local={0} color={P5} />
          </div>
        </>
      ) : null}
      {/* «چهار سال فاصله» */}
      {four > 0 ? (
        <div dir="rtl" style={{position: 'absolute', top: 545, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${four}) rotate(-3deg)`}}>
          <div style={{padding: '12px 40px', borderRadius: 30, border: `5px solid ${GOLD}`, background: `${GOLD}2E`, boxShadow: `0 0 40px ${GOLD}`, fontSize: 70, fontWeight: 900, color: '#fff', textShadow: `0 0 18px ${GOLD}`}}>
            ۴ سال فاصله!
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// detective scan over the device on the desk during the hook
const Scan: React.FC<{end: number}> = ({end}) => {
  const frame = useCurrentFrame();
  if (frame > end) return null;
  const o = interpolate(frame, [0, 6, end - 10, end], [0, 1, 1, 0], clamp);
  const y = 1240 + ((frame * 9) % 380);
  const box = {left: 250, top: 1230, width: 580, height: 400};
  const corner = (s: React.CSSProperties) => <div style={{position: 'absolute', width: 70, height: 70, borderColor: P7P, borderStyle: 'solid', borderWidth: 0, filter: `drop-shadow(0 0 8px ${P7P})`, ...s}} />;
  return (
    <div style={{position: 'absolute', ...box, opacity: o}}>
      {corner({left: 0, top: 0, borderLeftWidth: 7, borderTopWidth: 7, borderTopLeftRadius: 18})}
      {corner({right: 0, top: 0, borderRightWidth: 7, borderTopWidth: 7, borderTopRightRadius: 18})}
      {corner({left: 0, bottom: 0, borderLeftWidth: 7, borderBottomWidth: 7, borderBottomLeftRadius: 18})}
      {corner({right: 0, bottom: 0, borderRightWidth: 7, borderBottomWidth: 7, borderBottomRightRadius: 18})}
      <div style={{position: 'absolute', left: 10, right: 10, top: y - box.top, height: 6, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${P7P}, transparent)`, boxShadow: `0 0 30px ${P7P}`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: -64, display: 'flex', justifyContent: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '4px 18px', borderRadius: 10, background: 'rgba(8,4,17,0.7)', border: `2px solid ${P7P}`, color: P7P, fontSize: 30, fontWeight: 900, letterSpacing: 4, ...LTR}}>
          <ScanSearch size={30} color={P7P} /> SCANNING{'.'.repeat(1 + (Math.floor(frame / 8) % 3))}
        </div>
      </div>
    </div>
  );
};

// ── 2. ports ──────────────────────────────────────────────────────────────
// side edge of the tablet with its ports, one strip per generation
const PortStrip: React.FC<{kind: '7' | '5'; p: number; hot: number}> = ({kind, p, hot}) => {
  const bass = useBass();
  const c = kind === '7' ? P7P : P5;
  const port = (w: number, h: number, r: number, label: string, glow: boolean) => (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
      <div style={{width: w, height: h, borderRadius: r, background: '#0d0a14', border: `3px solid ${glow ? c : 'rgba(255,255,255,0.35)'}`, boxShadow: glow ? `0 0 ${18 + hot * 30 + bass * 20}px ${c}, inset 0 0 10px ${c}` : 'none'}} />
      <span style={{fontSize: 26, fontWeight: 900, color: glow ? c : 'rgba(255,255,255,0.6)', ...LTR}}>{label}</span>
    </div>
  );
  return (
    <div style={{transform: `translateX(${(1 - p) * (kind === '7' ? 700 : -700)}px)`, opacity: Math.min(1, p * 1.5)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20, direction: 'rtl'}}>
        <Pill color={c} size={40}><span style={LTR}>{kind === '7' ? 'Pro 7 / 7+' : 'Pro 5 / 6'}</span></Pill>
        <div style={{flex: 1, height: 120, borderRadius: 26, background: 'linear-gradient(180deg, #e9e9ee, #b9bac4)', display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', padding: '0 20px', boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 ${20 * hot}px ${c}`, direction: 'ltr'}}>
          {port(64, 22, 6, 'USB-A', false)}
          {kind === '7' ? port(46, 18, 9, 'USB-C', true) : port(50, 22, 3, 'Mini DP', true)}
          {port(80, 14, 7, 'Surface', false)}
        </div>
      </div>
    </div>
  );
};

const PortsWall: React.FC<{c: {start: number; typec: number; minidp: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const leave = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const p7 = sp(frame, c.typec - 3, 14, 140);
  const p5 = sp(frame, c.minidp - 3, 14, 140);
  const hot7 = Math.exp(-Math.max(0, frame - c.typec) / 20);
  const hot5 = Math.exp(-Math.max(0, frame - c.minidp) / 20);
  return (
    <AbsoluteFill style={{opacity: leave}}>
      <div style={{position: 'absolute', top: 300, left: 50, right: 50, display: 'flex', flexDirection: 'column', gap: 26}}>
        {frame >= c.typec - 3 ? <PortStrip kind="7" p={p7} hot={hot7} /> : null}
        {frame >= c.minidp - 3 ? <PortStrip kind="5" p={p5} hot={hot5} /> : null}
      </div>
    </AbsoluteFill>
  );
};

// ── 3. model number ───────────────────────────────────────────────────────
const Kickstand: React.FC<{open: number}> = ({open}) => (
  <svg width={260} height={190} viewBox="0 0 260 190" style={{overflow: 'visible'}}>
    <defs>
      <linearGradient id="ks" x1="0" x2="1">
        <stop offset="0" stopColor="#f2f2f6" />
        <stop offset="1" stopColor="#a9aab6" />
      </linearGradient>
    </defs>
    <line x1="10" y1="180" x2="250" y2="180" stroke="rgba(255,255,255,0.35)" strokeWidth="4" strokeLinecap="round" />
    {/* tablet body leaning back */}
    <g transform="translate(120 178) rotate(-68)">
      <rect x="0" y="-9" width="175" height="18" rx="8" fill="url(#ks)" />
    </g>
    {/* kickstand swinging out from the back */}
    <g transform={`translate(${120 + Math.cos((-68 * Math.PI) / 180) * 120} ${178 + Math.sin((-68 * Math.PI) / 180) * 120}) rotate(${-68 + 0 + open * 128})`}>
      <rect x="0" y="-5" width="128" height="10" rx="5" fill={GOLD} style={{filter: `drop-shadow(0 0 8px ${GOLD})`}} />
    </g>
  </svg>
);

const ModelWall: React.FC<{c: {start: number; open: number; r1: number; r2: number; r3: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const leave = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const open = ease((frame - c.open) / 18);
  const tableIn = sp(frame, c.r1 - 8, 14, 140);
  const rows = [
    {at: c.r1, num: '1960 · 1961', name: 'Pro 7+', color: P7P},
    {at: c.r2, num: '1866', name: 'Pro 7', color: P7},
    {at: c.r3, num: '1796', name: 'Pro 5 / 6', color: P5},
  ];
  const active = rows.reduce((a, r, i) => (frame >= r.at ? i : a), -1);
  return (
    <AbsoluteFill style={{opacity: leave}}>
      {/* kickstand diagram until the numbers start */}
      {frame < c.r1 + 6 ? (
        <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 1 - interpolate(frame, [c.r1 - 6, c.r1 + 6], [0, 1], clamp)}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
            <Kickstand open={open} />
            <div dir="rtl" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
              <div style={{fontSize: 40, fontWeight: 900, color: 'rgba(255,255,255,0.9)'}}>زیر پایه:</div>
              <div style={{fontSize: 86, fontWeight: 900, color: GOLD, textShadow: `0 0 26px ${GOLD}`, ...LTR}}>Model ????</div>
            </div>
          </div>
        </div>
      ) : null}
      {frame >= c.r1 - 8 ? (
        <div style={{position: 'absolute', top: 260, left: 60, right: 60, opacity: tableIn, transform: `translateY(${(1 - tableIn) * -80}px)`}}>
          <Glass radius={34} style={{padding: '18px 22px'}} glow={0.4 + bass * 0.3} tint="rgba(255,197,61,0.10)">
            <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              {rows.map((r, i) => {
                const on = i === active;
                const seen = frame >= r.at;
                const p = sp(frame, r.at - 2, 12, 190);
                return (
                  <div key={r.num} style={{height: 92, display: 'flex', alignItems: 'center', gap: 20, padding: '0 24px', borderRadius: 22, background: on ? `linear-gradient(90deg, ${r.color}55, rgba(20,8,40,0.6))` : 'rgba(20,8,40,0.45)', border: `2.5px solid ${seen ? r.color : 'rgba(255,255,255,0.15)'}`, boxShadow: on ? `0 0 30px ${r.color}` : 'none', transform: `scale(${on ? 1 + 0.03 * p : 0.97})`, opacity: seen ? 1 : 0.35, ...LTR}}>
                    <span style={{fontSize: 52, fontWeight: 900, color: GOLD, textShadow: on ? `0 0 18px ${GOLD}` : 'none', minWidth: 380}}>{r.num}</span>
                    <span style={{fontSize: 46, fontWeight: 900, color: 'rgba(255,255,255,0.7)'}}>→</span>
                    <span style={{fontSize: 54, fontWeight: 900, color: seen ? r.color : 'rgba(255,255,255,0.4)', textShadow: on ? `0 0 20px ${r.color}` : 'none'}}>{seen ? r.name : '…'}</span>
                  </div>
                );
              })}
            </div>
          </Glass>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 4. SSD door (x-ray) ───────────────────────────────────────────────────
const SsdWall: React.FC<{c: {start: number; only: number; door: number; ssd: number; swap: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const leave = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const pIn = sp(frame, c.start + 4, 14, 140);
  const door = ease((frame - c.ssd) / 14);
  const chip = sp(frame, c.ssd + 6, 12, 160);
  const swap = frame >= c.swap ? ((frame - c.swap) * 6) % 360 : 0;
  const only = frame >= c.only ? slamAt(frame, c.only) : 0;
  const xray = 0.5 + 0.5 * Math.sin(frame * 0.15);
  return (
    <AbsoluteFill style={{opacity: leave}}>
      <div style={{position: 'absolute', top: 310, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.7 + pIn * 0.3})`, opacity: pIn}}>
        {/* back of the tablet, x-ray look */}
        <div style={{position: 'relative', width: 640, height: 400, borderRadius: 34, background: 'linear-gradient(160deg, rgba(34,211,238,0.22), rgba(8,4,17,0.75))', border: `3px solid ${P7P}`, boxShadow: `0 0 ${30 + bass * 30}px ${P7P}88, inset 0 0 60px rgba(34,211,238,${0.15 + xray * 0.15})`, overflow: 'hidden'}}>
          {/* grid lines */}
          <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.12) 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
          {/* logo */}
          <div style={{position: 'absolute', left: 290, top: 60, width: 60, height: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, opacity: 0.7}}>
            {[0, 1, 2, 3].map((i) => <div key={i} style={{background: P7P, borderRadius: 2, boxShadow: `0 0 10px ${P7P}`}} />)}
          </div>
          {/* kickstand hinge line */}
          <div style={{position: 'absolute', left: 30, right: 30, top: 150, height: 4, background: 'rgba(255,255,255,0.35)', borderRadius: 2}} />
          {/* the door */}
          <div style={{position: 'absolute', left: 215, top: 200, width: 210, height: 130, borderRadius: 14, border: `4px dashed ${GOLD}`, boxShadow: `0 0 30px ${GOLD}`}}>
            {/* chip under the door */}
            <div style={{position: 'absolute', left: 18, top: 28, width: 166, height: 70, borderRadius: 8, background: 'linear-gradient(90deg, #1a6b3c, #0f4a28)', border: '2px solid #2EE59D', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: Math.max(door, 0.25), transform: `scale(${0.8 + chip * 0.2})`}}>
              <HardDrive size={30} color="#fff" />
              <span style={{fontSize: 26, fontWeight: 900, color: '#fff', ...LTR}}>M.2 2230</span>
            </div>
            {/* the cover sliding away */}
            <div style={{position: 'absolute', inset: 0, borderRadius: 12, background: 'linear-gradient(135deg, #d9dae2, #a7a8b3)', transform: `translateY(${door * 150}px) rotate(${door * 14}deg)`, opacity: 1 - door * 0.9}} />
          </div>
          {frame >= c.swap ? (
            <div style={{position: 'absolute', left: 430, top: 210, width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 90, color: GREEN, transform: `rotate(${swap}deg)`, textShadow: `0 0 20px ${GREEN}`}}>↻</div>
          ) : null}
        </div>
      </div>
      {only > 0 ? (
        <div dir="rtl" style={{position: 'absolute', top: 205, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${only}) rotate(-3deg)`}}>
          <div style={{padding: '10px 34px', borderRadius: 26, border: `5px solid ${P7P}`, background: `${P7P}30`, boxShadow: `0 0 36px ${P7P}`, fontSize: 56, fontWeight: 900, color: '#fff'}}>
            فقط <span style={{...LTR, color: P7P}}>Pro 7+</span>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 5. msinfo32 ───────────────────────────────────────────────────────────
const InfoWall: React.FC<{c: {start: number; type: number; model: number; gen: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const leave = interpolate(frame, [c.end - 8, c.end], [1, 0], clamp);
  const win = sp(frame, c.start + 2, 14, 140);
  const CMD = 'msinfo32';
  const typed = Math.max(0, Math.min(CMD.length, Math.floor((frame - c.type + 6) / 3)));
  const opened = frame >= c.type + 30;
  const op = sp(frame, c.type + 30, 14, 160);
  const rows: [string, string, number][] = [
    ['OS Name', 'Microsoft Windows 11 Pro', 0],
    ['System Manufacturer', 'Microsoft Corporation', 0],
    ['System Model', 'Surface Pro 7+', c.model],
    ['Processor', '11th Gen Intel(R) Core(TM) i5-1135G7', c.gen],
  ];
  return (
    <AbsoluteFill style={{opacity: leave}}>
      <div style={{position: 'absolute', top: 310, left: 50, right: 50, transform: `translateY(${(1 - win) * -120}px) scale(${0.85 + win * 0.15})`, opacity: win}}>
        <div style={{borderRadius: 18, overflow: 'hidden', background: '#f3f3f3', boxShadow: `0 30px 70px rgba(0,0,0,0.55), 0 0 40px ${COLORS.neon}`, border: '1px solid #c8c8c8', fontFamily: "'Segoe UI', 'Inter', sans-serif", ...LTR}}>
          <div style={{height: 54, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, background: '#ffffff', borderBottom: '1px solid #ddd'}}>
            <Search size={26} color="#0067c0" />
            <span style={{fontSize: 26, fontWeight: 700, color: '#222'}}>{opened ? 'System Information' : 'Run'}</span>
            <span style={{flex: 1}} />
            <span style={{fontSize: 26, color: '#555'}}>—  ☐  ✕</span>
          </div>
          {!opened ? (
            <div style={{padding: '26px 30px', display: 'flex', alignItems: 'center', gap: 18}}>
              <span style={{fontSize: 30, color: '#333'}}>Open:</span>
              <div style={{flex: 1, height: 64, borderRadius: 6, border: '2px solid #0067c0', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 38, color: '#111', fontFamily: 'monospace'}}>
                {CMD.slice(0, typed)}
                {Math.floor(frame / 12) % 2 === 0 ? <span style={{color: '#0067c0'}}>|</span> : null}
              </div>
              <div style={{padding: '12px 30px', borderRadius: 6, background: typed === CMD.length ? '#0067c0' : '#ccc', color: '#fff', fontSize: 28, fontWeight: 700}}>OK</div>
            </div>
          ) : (
            <div style={{padding: '12px 0', opacity: op}}>
              {rows.map(([k, v, at]) => {
                const hi = at > 0 && frame >= at;
                const p = hi ? sp(frame, at, 12, 180) : 0;
                return (
                  <div key={k} style={{display: 'flex', alignItems: 'center', padding: '10px 24px', fontSize: 28, background: hi ? `rgba(255,197,61,${0.35 * p + 0.15})` : 'transparent', borderLeft: hi ? `8px solid ${GOLD}` : '8px solid transparent', transform: `scale(${1 + p * 0.02})`}}>
                    <span style={{width: 300, color: '#444', fontWeight: 600}}>{k}</span>
                    <span style={{color: '#111', fontWeight: hi ? 800 : 500}}>{v}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {frame >= c.gen ? (
        <div style={{position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${slamAt(frame, c.gen)})`}}>
          <div dir="rtl" style={{display: 'flex', gap: 18}}>
            <Pill color={P7P} size={40}>
              <Cpu size={38} color={P7P} /> <span style={LTR}>Pro 7+</span> نسل ۱۱
            </Pill>
            <Pill color={P7} size={40}>
              <Cpu size={38} color={P7} /> <span style={LTR}>Pro 7</span> نسل ۱۰
            </Pill>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 6. CTA ────────────────────────────────────────────────────────────────
const CtaWall: React.FC<{c: {start: number; comment: number; list: number; send: number; end: number}}> = ({c}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const card = sp(frame, c.start + 2, 14, 140);
  const items = ['پورت USB-C', 'شماره‌ی مدل زیر پایه', 'دریچه‌ی SSD', 'msinfo32 در ویندوز'];
  const box = sp(frame, c.comment - 4, 15, 140);
  const TYPE = 'سرفیس';
  const typed = Math.max(0, Math.min(TYPE.length, Math.floor((frame - c.comment) / 3)));
  const sentAt = c.comment + TYPE.length * 3 + 8;
  const sent = frame >= sentAt;
  const tap = sent ? interpolate(frame - sentAt, [0, 4, 14], [1, 0.82, 1.1], clamp) : 1;
  const dm = sp(frame, c.send - 2, 13, 160);
  return (
    <AbsoluteFill>
      <div dir="rtl" style={{position: 'absolute', top: 230, left: 120, right: 120, transform: `translateY(${(1 - card) * -140}px) rotate(${(1 - card) * -6}deg)`, opacity: card}}>
        <Glass radius={34} style={{padding: '22px 30px'}} glow={0.5 + bass * 0.3}>
          <div style={{fontSize: 46, fontWeight: 900, color: '#fff', marginBottom: 10}}>
            🕵️ چک‌لیست خرید <span style={{color: P7P}}>سرفیس</span>
          </div>
          {items.map((it, i) => {
            const at = c.start + 10 + i * 9;
            const p = sp(frame, at, 12, 200);
            return (
              <div key={it} style={{display: 'flex', alignItems: 'center', gap: 14, height: 62, opacity: frame >= at ? 1 : 0.3}}>
                <CheckCircle2 size={40} color={frame >= at ? GREEN : 'rgba(255,255,255,0.4)'} style={{transform: `scale(${frame >= at ? 0.6 + p * 0.4 : 1})`, filter: frame >= at ? `drop-shadow(0 0 10px ${GREEN})` : undefined}} />
                <span style={{fontSize: 38, fontWeight: 800, color: '#fff'}}>{it}</span>
              </div>
            );
          })}
        </Glass>
      </div>
      {frame >= c.send - 2 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + dm * 0.4})`, opacity: Math.min(1, dm * 1.5), zIndex: 46}}>
          <Glass radius={999} style={{padding: '10px 30px'}} glow={0.7} tint={`${GOLD}22`}>
            <div dir="rtl" style={{fontSize: 40, fontWeight: 900, color: '#fff'}}>
              📩 چک‌لیست کامل <span style={{color: GOLD}}>تو دایرکتت</span>
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
                {typed ? <span style={{color: P7P}}>{TYPE.slice(0, typed)}</span> : 'کامنت بنویس…'}
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

// clue tracker under the IG top bar
const CLUES = [
  {n: '۱', t: 'پورت', c: P7P},
  {n: '۲', t: 'مدل', c: GOLD},
  {n: '۳', t: 'SSD', c: GREEN},
  {n: '۴', t: 'ویندوز', c: P7},
];
const Tracker: React.FC<{active: number}> = ({active}) => (
  <div style={{position: 'absolute', top: 118, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14, direction: 'rtl', opacity: active >= 0 ? 1 : 0, zIndex: 35}}>
    {CLUES.map((x, i) => {
      const on = i === active;
      const done = i < active;
      return (
        <div key={x.n} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '7px 18px', borderRadius: 999, background: on ? `${x.c}55` : 'rgba(10,4,20,0.55)', border: `2px solid ${on || done ? x.c : 'rgba(255,255,255,0.25)'}`, boxShadow: on ? `0 0 22px ${x.c}` : 'none', transform: `scale(${on ? 1.08 : 0.92})`}}>
          <span style={{fontSize: 28, fontWeight: 900, color: '#fff'}}>{done ? '✓' : x.n}</span>
          <span style={{fontSize: 26, fontWeight: 800, color: on ? '#fff' : 'rgba(255,255,255,0.6)'}}>{x.t}</span>
        </div>
      );
    })}
  </div>
);

// ── captions ─────────────────────────────────────────────────────────────
const kwColor = (w: string): string | null => {
  const n = normalize(w);
  const has = (ks: string[]) => ks.some((k) => n.startsWith(normalize(k)));
  if (/^(19|18|17)\d\d$/.test(n)) return GOLD;
  if (has(['پلاسه', 'تایپ', 'msinfo', 'ssd'])) return P7P;
  if (has(['۵', '۶', 'مینی', 'دیسپلی'])) return P5;
  if (has(['چهار', 'فاصله', 'مدلنامبر', 'نسل'])) return GOLD;
  if (has(['سرفیس', 'کامنت', 'چکلیست'])) return COLORS.neon;
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
        const latin = /[A-Za-z0-9]/.test(w.word);
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
              ...(latin ? {unicodeBidi: 'isolate'} : {}),
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
export const SurfaceId: React.FC<V4Props> = ({duration, words, segments, beats, downbeats}) => {
  const frame = useCurrentFrame();
  const seg = (n: string) => segments.find((s) => s.name === n) ?? {name: n, start: 0, end: 0, cuts: []};
  const cue = (sg: string, keys: string[], fb: number, nth = 0) => {
    const ks = keys.map(normalize);
    const ws = words.filter((x) => x.seg === sg && ks.some((k) => normalize(x.word).startsWith(k)));
    const w = ws[nth] ?? ws[0];
    return f(w ? w.start : fb);
  };
  const S = {hook: seg('hook'), ports: seg('ports'), model: seg('model'), ssd: seg('ssd'), info: seg('info'), cta: seg('cta')};
  const total = duration + TAIL;

  const c = {
    hook: {p7: cue('hook', ['پلاسه'], 1.03), p5: cue('hook', ['پرو'], 2.21, 1), same: cue('hook', ['عین'], 3.36), four: cue('hook', ['چهار'], 4.16), end: f(S.hook.end)},
    ports: {start: f(S.ports.start), typec: cue('ports', ['تایپ'], 8.13), minidp: cue('ports', ['مینی'], 12.63), end: f(S.ports.end)},
    model: {start: f(S.model.start), open: cue('model', ['باز'], 14.96), r1: cue('model', ['1960'], 17.34), r2: cue('model', ['1866'], 20.18), r3: cue('model', ['1796'], 22.28), end: f(S.model.end)},
    ssd: {start: f(S.ssd.start), only: cue('ssd', ['فقط'], 25.7), door: cue('ssd', ['دریچه'], 27.48), ssd: cue('ssd', ['ssd'], 28.74), swap: cue('ssd', ['قابل'], 30.0), end: f(S.ssd.end)},
    info: {start: f(S.info.start), type: cue('info', ['msinfo'], 32.65), model: cue('info', ['مدل'], 33.99), gen: cue('info', ['نسل'], 35.23), end: f(S.info.end)},
    cta: {start: f(S.cta.start), comment: cue('cta', ['کامنت'], 40.5), list: cue('cta', ['چک'], 41.16), send: cue('cta', ['ارسال'], 42.84), end: f(total)},
  };

  // camera: slam on frame 0, a new framing on every cut (hides jump cuts),
  // punch-ins on the key words
  const cuts = [S.hook, S.ports, S.model, S.ssd, S.info, S.cta].flatMap((s) => [s.start, ...(s.cuts ?? [])]).map(f).sort((a, b) => a - b);
  const LEVEL = [1.0, 1.12, 1.04, 1.16, 1.0, 1.1, 1.06, 1.14, 1.02, 1.12];
  let base = 1;
  let since = 999;
  cuts.forEach((x, i) => {
    if (frame >= x) {
      base = LEVEL[i % LEVEL.length];
      since = frame - x;
    }
  });
  const open = interpolate(frame, [0, 12], [1.4, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const overshoot = interpolate(since, [0, 4, 12], [1.05, 0.99, 1], clamp);
  const punches = [c.hook.four, c.ports.typec, c.model.r1, c.ssd.ssd, c.info.type, cue('cta', ['«سرفیس»', 'سرفیس'], 39.72, 1)];
  const punch = punches.reduce((a, p) => a + (frame >= p && frame < p + 45 ? sp(frame, p, 14, 170) * 0.06 * interpolate(frame - p, [30, 45], [1, 0], clamp) : 0), 0);
  const zoom = (frame < 12 ? open : 1) * base * overshoot + punch;

  const beat = pulseAt(frame, beats, 7);
  const down = pulseAt(frame, downbeats, 10);
  const chapterStarts = [S.ports.start, S.model.start, S.ssd.start, S.info.start, S.cta.start].map(f);
  const sinceCh = Math.min(...chapterStarts.map((x) => (frame >= x ? frame - x : 999)), frame);
  const flash = interpolate(sinceCh, [0, 3, 12], [0.55, 0.25, 0], clamp);

  const active = frame >= c.cta.start ? 4 : frame >= c.info.start ? 3 : frame >= c.ssd.start ? 2 : frame >= c.model.start ? 1 : frame >= c.ports.start ? 0 : -1;

  // music: full on the drop, ducked under the voice
  const talk = words.map((w) => [w.start - 0.1, w.end + 0.18] as const);
  const musicVol = (fr: number) => {
    let s = 0;
    for (let i = -8; i <= 8; i++) {
      const t = (fr + i) / FPS;
      const on = talk.some(([a, b]) => t >= a && t <= b);
      const b0 = t < 0.12 ? 0.6 : on ? 0.14 : 0.28;
      s += t > total - 0.8 ? b0 * Math.max(0, (total - t) / 0.8) : b0;
    }
    return s / 17;
  };

  const sfx: {at: number; src: string; vol: number}[] = [
    {at: 0, src: 'impact', vol: 0.6},
    ...[0, 3, 6, 9, 12, 15].map((d) => ({at: 2 + d * 2, src: 'click', vol: 0.12})),
    {at: c.hook.p7, src: 'ding', vol: 0.25},
    {at: c.hook.p5 - 2, src: 'whoosh', vol: 0.3},
    {at: c.hook.same, src: 'pop', vol: 0.3},
    {at: c.hook.four, src: 'impact', vol: 0.55},
    ...chapterStarts.map((x) => ({at: x - 4, src: 'whoosh', vol: 0.35})),
    {at: c.ports.typec, src: 'pop', vol: 0.32},
    {at: c.ports.minidp, src: 'pop', vol: 0.32},
    {at: c.model.open, src: 'click', vol: 0.35},
    {at: c.model.r1, src: 'ding', vol: 0.25},
    {at: c.model.r2, src: 'pop', vol: 0.28},
    {at: c.model.r3, src: 'pop', vol: 0.28},
    {at: c.ssd.only, src: 'impact', vol: 0.4},
    {at: c.ssd.ssd, src: 'whoosh', vol: 0.3},
    {at: c.ssd.swap, src: 'ding', vol: 0.22},
    ...[0, 3, 6, 9, 12, 15, 18, 21].map((d) => ({at: c.info.type - 6 + d, src: 'click', vol: 0.16})),
    {at: c.info.gen, src: 'pop', vol: 0.3},
    ...[0, 9, 18, 27].map((d) => ({at: c.cta.start + 10 + d, src: 'pop', vol: 0.22})),
    {at: c.cta.comment, src: 'click', vol: 0.3},
    {at: c.cta.comment + 'سرفیس'.length * 3 + 8, src: 'ding', vol: 0.3},
  ];

  return (
    <BeatProvider beats={beats} downbeats={downbeats}>
      <BassProvider enabled musicStartFrame={0} musicTrimFrames={f(V4_MUSIC_START)} src={MUSIC_SRC}>
        <AbsoluteFill style={{background: COLORS.bgDeep, fontFamily: "'Vazirmatn', sans-serif", overflow: 'hidden'}}>
          <AbsoluteFill style={{transform: `scale(${1 + beat * 0.004 + down * 0.01})`}}>
            {/* plate: the presenter's own grade, untouched */}
            <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 32%'}}>
              <OffthreadVideo src={staticFile('video4/edit.mp4')} muted style={{width: 1080, height: 1920}} />
            </AbsoluteFill>
            {/* light shade top/bottom for legibility only */}
            <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.32) 0%, transparent 15%, transparent 74%, rgba(8,4,17,0.6) 100%)'}} />

            {/* ── wall (behind the head) ── */}
            <Sequence durationInFrames={c.hook.end + 2} layout="none">
              <HookWall c={c.hook} />
            </Sequence>
            {frame >= c.ports.start - 4 && frame < c.ports.end ? <PortsWall c={c.ports} /> : null}
            {frame >= c.model.start - 4 && frame < c.model.end ? <ModelWall c={c.model} /> : null}
            {frame >= c.ssd.start - 4 && frame < c.ssd.end ? <SsdWall c={c.ssd} /> : null}

            <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 32%', WebkitMaskImage: 'linear-gradient(180deg, #000 0px, #000 860px, transparent 1060px)'}}>
              <OffthreadVideo src={staticFile('video4/cutout.webm')} transparent muted style={{width: 1080, height: 1920}} />
            </AbsoluteFill>

            {/* ── front ── */}
            <Scan end={c.hook.end} />
            {frame >= c.info.start - 4 && frame < c.info.end ? <InfoWall c={c.info} /> : null}
            {frame >= c.cta.start - 4 ? <CtaWall c={c.cta} /> : null}
            <ClueTitle n="۱" title="پورت‌ها رو ببین" color={P7P} at={c.ports.start} end={c.ports.typec} />
            <ClueTitle n="۲" title="شماره‌ی مدل" color={GOLD} at={c.model.start} end={c.model.r1 - 8} />
            <ClueTitle n="۳" title="دریچه‌ی SSD" color={GREEN} at={c.ssd.start} end={c.ssd.only} />
            <ClueTitle n="۴" title="داخل ویندوز" color={P7} at={c.info.start} end={c.info.end} />
            <Tracker active={active} />
            <Captions words={words} hideFrom={c.cta.comment - 4} />
          </AbsoluteFill>
          {flash > 0 ? <AbsoluteFill style={{background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(157,78,221,0.45) 45%, transparent 80%)', opacity: flash, mixBlendMode: 'screen', zIndex: 50}} /> : null}

          <Audio src={staticFile('video4/voice.wav')} />
          <Audio src={staticFile(MUSIC_SRC)} trimBefore={f(V4_MUSIC_START)} volume={musicVol} />
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
