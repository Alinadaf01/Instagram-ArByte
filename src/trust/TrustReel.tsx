import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CheckCircle2, MessageCircle, Search, ShieldAlert, ShieldCheck} from 'lucide-react';
import {ASSETS, COLORS, FPS} from '../config';
import {loadFonts} from '../lib/fonts';
import {bob, clamp, pop} from '../lib/anim';
import {BassProvider, useBass} from '../lib/audio';
import {BeatProvider, pulseAt, useBeatPulse} from '../lib/beat';
import {Background} from '../components/Background';
import {Glass, NeonText} from '../components/Glass';
import {Turntable, TurntablePreload} from '../components/Turntable';

loadFonts();

// ─────────────────────────────────────────────────────────────────────────
// «لپ‌تاپ آنلاین می‌خری؟ اول این ۳ تا رو چک کن» — an 18s text-led reel
// (no voice) that teaches the viewer how to vet any online laptop shop and
// uses ArByte's own Torob / Emalls / e-Namad records as the worked example.
// Music: the track's drop lands on the first reveal; every scene change sits
// on a downbeat.
// ─────────────────────────────────────────────────────────────────────────

export const TRUST_FPS = FPS;
export const TRUST_DURATION = 18 * FPS;
// where in music.mp3 the reel starts: its drop (22.06s) lands at 2.2s
export const TRUST_MUSIC_START = 22.06 - 2.2;

const T = {
  check1: 2.2,
  lens1: 3.6,
  check2: 5.92,
  lens2: 7.3,
  check3: 9.63,
  lens3: 11.0,
  recap: 13.35,
  cta: 14.7,
};
const f = (s: number) => Math.round(s * FPS);

type Focus = {x: number; y: number; w: number; zoom: number};
const FOCUS = {
  torobYears: {x: 0.29, y: 0.61, w: 0.24, zoom: 2.4},
  torobNamad: {x: 0.72, y: 0.4675, w: 0.42, zoom: 1.75},
  emallsYears: {x: 0.83, y: 0.822, w: 0.3, zoom: 2.6},
} satisfies Record<string, Focus>;

const PHONE_W = 440;
const BEZEL = 14;
const INNER_W = PHONE_W - BEZEL * 2;

const Phone: React.FC<{src: string; focus: Focus; highlight: number}> = ({src, focus, highlight}) => (
  <div
    style={{
      width: PHONE_W,
      height: 890,
      borderRadius: 66,
      padding: BEZEL,
      background: 'linear-gradient(145deg, #2a2338, #0d0915)',
      boxShadow: `0 0 0 2px rgba(224,170,255,0.35), 0 0 ${40 + highlight * 50}px rgba(157,78,221,${0.4 + highlight * 0.4}), 0 40px 90px rgba(0,0,0,0.7)`,
    }}
  >
    <div style={{width: '100%', height: '100%', borderRadius: 54, overflow: 'hidden', position: 'relative', background: '#fff'}}>
      <div style={{position: 'relative', width: INNER_W}}>
        <Img src={staticFile(src)} style={{width: INNER_W, display: 'block'}} />
        <div
          style={{
            position: 'absolute',
            left: `${focus.x * 100}%`,
            top: `${focus.y * 100}%`,
            width: `${focus.w * 100}%`,
            height: 34,
            transform: `translate(-50%,-50%) scale(${1.6 - highlight * 0.6})`,
            opacity: highlight,
            borderRadius: 12,
            border: `4px solid ${COLORS.neon}`,
            boxShadow: `0 0 ${30 * highlight}px rgba(157,78,221,${highlight})`,
          }}
        />
      </div>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(125deg, rgba(255,255,255,0.22) 0%, transparent 38%)'}} />
      <div style={{position: 'absolute', top: 14, left: '50%', width: 110, height: 32, marginLeft: -55, borderRadius: 99, background: '#000'}} />
    </div>
  </div>
);

const Lens: React.FC<{src: string; focus: Focus; at: number; label: string; cx: number; cy: number}> = ({src, focus, at, label, cx, cy}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = pop(frame, at);
  const R = 190;
  const W = INNER_W * focus.zoom;
  const pl = pop(frame, at + 10);
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - R,
        top: cy - R,
        width: R * 2,
        height: R * 2,
        transform: `scale(${p}) rotate(${(1 - p) * -30}deg)`,
        opacity: Math.min(1, p * 1.4),
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          background: '#fff',
          border: '8px solid rgba(255,255,255,0.92)',
          boxShadow: `0 0 0 4px ${COLORS.neon}, 0 0 60px rgba(157,78,221,0.95), 0 30px 60px rgba(0,0,0,0.6)`,
        }}
      >
        <Img src={staticFile(src)} style={{position: 'absolute', left: R, top: R, width: W, transform: `translate(-${focus.x * 100}%, -${focus.y * 100}%)`}} />
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), transparent 45%)'}} />
      </div>
      <div style={{position: 'absolute', right: -40, bottom: -40, transform: 'rotate(-45deg)'}}>
        <Search size={96} color="#fff" strokeWidth={2.4} style={{filter: `drop-shadow(0 0 16px ${COLORS.neon})`}} />
      </div>
      <div style={{position: 'absolute', left: -120, right: -120, bottom: -96, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + pl * 0.4})`, opacity: Math.min(1, pl * 1.5)}}>
        <div
          dir="rtl"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 28px',
            borderRadius: 99,
            background: `linear-gradient(135deg, ${COLORS.green}, #13a86c)`,
            fontSize: 40,
            fontWeight: 900,
            color: '#04210f',
            boxShadow: '0 0 30px rgba(46,229,157,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          <CheckCircle2 size={38} color="#04210f" strokeWidth={2.8} />
          {label}
        </div>
      </div>
    </div>
  );
};

// One «چک» scene: numbered title, what to look for, the phone and the lens
const Check: React.FC<{
  n: number;
  title: string;
  sub: string;
  src: string;
  focus: Focus;
  start: number;
  lens: number;
  label: string;
}> = ({n, title, sub, src, focus, start, lens, label}) => {
  const frame = useCurrentFrame() + start; // absolute frame
  const p = pop(frame, start);
  const ps = pop(frame, start + 8);
  const pp = pop(frame, start + 4);
  const hl = interpolate(frame - lens, [0, 18], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <div dir="rtl" style={{position: 'absolute', top: 300, left: 50, right: 50, display: 'flex', alignItems: 'center', gap: 22, transform: `translateX(${(1 - p) * -300}px)`, opacity: Math.min(1, p * 1.5)}}>
        <div
          style={{
            width: 104,
            height: 104,
            flexShrink: 0,
            borderRadius: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            fontWeight: 900,
            color: '#fff',
            background: `linear-gradient(135deg, ${COLORS.neon}, #5A189A)`,
            boxShadow: '0 0 34px rgba(157,78,221,0.85), inset 0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          {'۰۱۲۳'[n]}
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <NeonText size={58} weight={900}>
            {title}
          </NeonText>
          <div style={{fontSize: 34, fontWeight: 700, color: COLORS.silver, opacity: Math.min(1, ps * 1.5), marginTop: 4}}>{sub}</div>
        </div>
      </div>
      <div style={{position: 'absolute', top: 470 + bob(frame, 8, 0.04), left: 110, transform: `perspective(1600px) rotateY(${(1 - pp) * 40 + 10}deg) translateY(${(1 - pp) * 500}px)`, opacity: pp}}>
        <Phone src={src} focus={focus} highlight={hl} />
      </div>
      <Lens src={src} focus={focus} at={lens - start} label={label} cx={760} cy={1050} />
    </AbsoluteFill>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const {beat} = useBeatPulse(0, 6);
  const p1 = pop(frame, -6); // already in motion on frame 0
  const p2 = pop(frame, 30);
  const shake = frame < 40 ? Math.sin(frame * 1.7) * 6 * (1 - frame / 40) : 0;
  const warn = 0.55 + 0.45 * Math.abs(Math.sin(frame * 0.18));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 90, top: 1010, opacity: 0.55}}>
        <Turntable angle={frame / 3} width={900} glow={0.3 + bass * 0.4} />
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 360, left: 40, right: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
        <div style={{transform: `translateX(${shake}px) scale(${(0.6 + p1 * 0.4) * (1 + beat * 0.04)})`}}>
          <ShieldAlert size={150} color="#ff4d6d" strokeWidth={2.2} style={{filter: `drop-shadow(0 0 ${30 * warn}px rgba(255,77,109,0.95))`}} />
        </div>
        <div style={{transform: `scale(${0.7 + p1 * 0.3})`, opacity: Math.min(1, p1 * 2), textAlign: 'center'}}>
          <NeonText size={92} weight={900}>
            لپ‌تاپ آنلاین می‌خری؟
          </NeonText>
        </div>
        <div style={{transform: `translateY(${(1 - p2) * 60}px) scale(${0.8 + p2 * 0.2})`, opacity: Math.min(1, p2 * 1.5), textAlign: 'center'}}>
          <div style={{fontSize: 60, fontWeight: 900, color: COLORS.neonHot, textShadow: '0 0 20px rgba(199,125,255,0.9), 0 4px 16px rgba(0,0,0,0.7)'}}>
            اول این ۳ تا رو چک کن 👇
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Recap: React.FC<{hasLogo: boolean}> = ({hasLogo}) => {
  const frame = useCurrentFrame() + f(T.recap);
  const bass = useBass();
  const head = pop(frame, f(T.recap));
  const items = ['۴ سال و ۳ ماه سابقه در ترب', '۴ سال و ۳ ماه همکاری با ایمالز', 'نماد اعتماد الکترونیکی فعال'];
  const cta = pop(frame, f(T.cta));
  return (
    <AbsoluteFill>
      {hasLogo ? (
        <Img
          src={staticFile(ASSETS.logoClean)}
          style={{position: 'absolute', top: 280, left: 540 - 80, width: 160, height: 160, objectFit: 'contain', filter: `drop-shadow(0 0 ${20 + bass * 26}px rgba(157,78,221,0.9))`, opacity: head, transform: `scale(${0.6 + head * 0.4})`}}
        />
      ) : null}
      <div dir="rtl" style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', transform: `scale(${0.7 + head * 0.3})`, opacity: head}}>
        <NeonText size={64} weight={900}>
          آربایت هر ۳ تا رو داره
        </NeonText>
      </div>
      <div style={{position: 'absolute', top: 600, left: 70, right: 70, display: 'flex', flexDirection: 'column', gap: 22}}>
        {items.map((t, i) => {
          const p = pop(frame, f(T.recap) + 10 + i * 9);
          return (
            <div key={t} style={{transform: `translateX(${(1 - p) * 400}px)`, opacity: Math.min(1, p * 1.5)}}>
              <Glass radius={34} style={{padding: '20px 28px'}} glow={0.3} tint="rgba(46,229,157,0.12)">
                <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 18}}>
                  <ShieldCheck size={46} color={COLORS.green} strokeWidth={2.4} />
                  <span style={{fontSize: 42, fontWeight: 900, color: '#fff'}}>{t}</span>
                </div>
              </Glass>
            </div>
          );
        })}
      </div>
      {frame >= f(T.cta) ? (
        <div style={{position: 'absolute', top: 1090, left: 50, right: 50, transform: `translateY(${(1 - cta) * 200}px) scale(${0.8 + cta * 0.2})`, opacity: cta}}>
          <Glass radius={44} style={{padding: '28px 32px'}} glow={0.7 + bass * 0.3} tint="rgba(157,78,221,0.35)">
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 22}}>
              <div style={{width: 96, height: 96, flexShrink: 0, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})`, boxShadow: '0 0 30px rgba(157,78,221,0.9)'}}>
                <MessageCircle size={52} color="#fff" strokeWidth={2.4} />
              </div>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <span style={{fontSize: 40, fontWeight: 900, color: '#fff'}}>قبل از خرید سؤال داری؟</span>
                <span style={{fontSize: 46, fontWeight: 900, color: COLORS.neonHot, textShadow: '0 0 18px rgba(199,125,255,0.8)'}}>کلمه «مشاوره» رو کامنت کن</span>
              </div>
            </div>
          </Glass>
          <div style={{marginTop: 26, textAlign: 'center', fontSize: 40, fontWeight: 900, color: '#fff', direction: 'ltr', opacity: pop(frame, f(T.cta) + 14)}}>arbyte.ir</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export type TrustReelProps = {beats: number[]; downbeats: number[]; hasLogo: boolean};

export const TrustReel: React.FC<TrustReelProps> = ({beats, downbeats, hasLogo}) => {
  const frame = useCurrentFrame();
  const {beat, down} = useBeatPulseRoot(beats, downbeats, frame);
  // flash on every scene change
  const cuts = [T.check1, T.check2, T.check3, T.recap].map(f);
  const since = Math.min(...cuts.map((c) => (frame >= c ? frame - c : 999)));
  const flash = interpolate(since, [0, 3, 14], [0.6, 0.35, 0], clamp);
  const musicTrim = f(TRUST_MUSIC_START);
  const end = TRUST_DURATION;
  return (
    <BeatProvider beats={beats} downbeats={downbeats}>
      <BassProvider enabled musicStartFrame={0} musicTrimFrames={musicTrim}>
        <AbsoluteFill style={{background: COLORS.bgDeep, fontFamily: "'Vazirmatn', sans-serif"}}>
          <AbsoluteFill style={{transform: `scale(${1 + beat * 0.008 + down * 0.018})`}}>
            <Background />
            <TurntablePreload />
            <Sequence durationInFrames={f(T.check1)} layout="none">
              <Hook />
            </Sequence>
            <Sequence from={f(T.check1)} durationInFrames={f(T.check2) - f(T.check1)} layout="none">
              <Check n={1} title="سابقه‌ش توی ترب" sub="تاریخ شروع همکاری رو ببین" src={ASSETS.torob} focus={FOCUS.torobYears} start={f(T.check1)} lens={f(T.lens1)} label="۴ سال و ۳ ماه" />
            </Sequence>
            <Sequence from={f(T.check2)} durationInFrames={f(T.check3) - f(T.check2)} layout="none">
              <Check n={2} title="سابقه‌ش توی ایمالز" sub="فروشگاه تازه‌کار یعنی ریسک بیشتر" src={ASSETS.emalls} focus={FOCUS.emallsYears} start={f(T.check2)} lens={f(T.lens2)} label="۴ سال و ۳ ماه و ۷ روز" />
            </Sequence>
            <Sequence from={f(T.check3)} durationInFrames={f(T.recap) - f(T.check3)} layout="none">
              <Check n={3} title="نماد اعتماد الکترونیکی" sub="اینماد فعال داره یا نه؟" src={ASSETS.torob} focus={FOCUS.torobNamad} start={f(T.check3)} lens={f(T.lens3)} label="اینماد فعال" />
            </Sequence>
            <Sequence from={f(T.recap)} layout="none">
              <Recap hasLogo={hasLogo} />
            </Sequence>
          </AbsoluteFill>
          {flash > 0 ? <AbsoluteFill style={{background: 'radial-gradient(circle, rgba(224,170,255,0.9), rgba(157,78,221,0.4) 45%, transparent 80%)', opacity: flash, mixBlendMode: 'screen'}} /> : null}
          <Audio
            src={staticFile(ASSETS.music)}
            trimBefore={musicTrim}
            volume={(fr) => 0.55 * Math.min(1, fr / 6) * Math.min(1, (end - fr) / 30)}
          />
        </AbsoluteFill>
      </BassProvider>
    </BeatProvider>
  );
};

// beat pulse computed from props (the provider is created inside this component)
const useBeatPulseRoot = (beats: number[], downbeats: number[], frame: number) => ({
  beat: pulseAt(frame, beats, 7),
  down: pulseAt(frame, downbeats, 10),
});
