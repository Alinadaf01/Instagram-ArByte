import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Feather, Fingerprint, Keyboard} from 'lucide-react';
import {COLORS} from '../config';
import {Turntable, TurntablePreload} from '../components/Turntable';
import {bob, clamp, pop, toFa} from '../lib/anim';
import {sec} from '../lib/timeline';
import {Background} from '../components/Background';
import {Glass, NeonText} from '../components/Glass';
import {useBass} from '../lib/audio';

type Cues = {keyboard: number; weight: number; touch: number};

// One full 360° turn of the real device («طراحی جادویی»), settle on the ¾
// front for «وزن ۷۷۰ گرم», square up to the front, then on «جدا شدن کیبورد»
// the keyboard drops away and it becomes the tablet.
const DeviceStage: React.FC<{offset: number; weightAt: number; keyboardAt: number; touchAt: number}> = ({
  offset,
  weightAt,
  keyboardAt,
  touchAt,
}) => {
  const frame = useCurrentFrame() + offset;
  const bass = useBass();
  const enter = pop(frame, 2);
  const spinEnd = Math.max(60, weightAt - 6);
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  // 18 (back) → 36 (= 0, ¾ front) during the spin, then 0 → 4 (front) before the detach
  let angle = 18 + 18 * ease(interpolate(frame, [0, spinEnd], [0, 1], clamp));
  angle += 4 * ease(interpolate(frame, [keyboardAt - 40, keyboardAt - 8], [0, 1], clamp));
  const detach = pop(frame, keyboardAt);
  const touchGlow = interpolate(frame - touchAt, [0, 20, 90], [0, 1, 0.25], clamp);
  const W = 900;
  const tabletW = 700;
  return (
    <AbsoluteFill>
      {/* laptop turntable — keyboard falls away on the detach */}
      <div
        style={{
          position: 'absolute',
          left: (1080 - W) / 2,
          top: 470 + bob(frame, 10, 0.035),
          transform: `translateY(${(1 - enter) * 700 + detach * 260}px) scale(${(0.6 + enter * 0.4) * (1 - detach * 0.15)})`,
          opacity: Math.min(1, enter * 1.6) * (1 - detach),
        }}
      >
        <Turntable angle={angle} width={W} glow={0.3 + bass * 0.4} />
      </div>
      {/* tablet mode */}
      {frame >= keyboardAt - 2 ? (
        <div
          style={{
            position: 'absolute',
            left: (1080 - tabletW) / 2,
            top: 455 + bob(frame, 10, 0.035),
            transform: `perspective(1400px) rotateX(${(1 - detach) * 25}deg) translateY(${(1 - detach) * 60}px) scale(${0.85 + detach * 0.15})`,
            opacity: detach,
          }}
        >
          <Img
            src={staticFile('surface/tablet.png')}
            style={{
              width: tabletW,
              display: 'block',
              filter: `drop-shadow(0 34px 40px rgba(0,0,0,0.65)) drop-shadow(0 0 ${30 + touchGlow * 50 + bass * 30}px rgba(199,125,255,${0.45 + touchGlow * 0.4}))`,
            }}
          />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const TouchRipple: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const f = frame - at;
  if (f < -10) return null;
  const finger = pop(frame, at - 10);
  return (
    <div style={{position: 'absolute', left: 540, top: 660, zIndex: 5}}>
      {[0, 14, 28, 42].map((d) => {
        const p = interpolate(f - d, [0, 50], [0, 1], clamp);
        if (f - d < 0) return null;
        return (
          <div
            key={d}
            style={{
              position: 'absolute',
              left: -200 * p,
              top: -200 * p,
              width: 400 * p,
              height: 400 * p,
              borderRadius: '50%',
              border: `4px solid rgba(224,170,255,${1 - p})`,
              boxShadow: `0 0 30px rgba(157,78,221,${(1 - p) * 0.9})`,
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: -34,
          top: -34,
          width: 68,
          height: 68,
          borderRadius: 99,
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 0 30px rgba(224,170,255,1)',
          transform: `scale(${f < 0 ? finger : interpolate(f, [0, 6, 16], [1, 0.7, 1], clamp)})`,
          opacity: interpolate(f, [60, 80], [1, 0], clamp),
        }}
      />
    </div>
  );
};

const WeightGauge: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const p = pop(frame, at);
  const fill = interpolate(frame - at, [6, 60], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const grams = Math.round(770 * fill);
  // arc: 220° sweep, "lighter is better" → needle lands in the green-ish low zone
  const R = 96;
  const sweep = 220;
  const startA = 90 + (360 - sweep) / 2; // degrees, svg coords
  const target = 0.32; // featherweight position on the scale
  const a = startA + sweep * target * fill;
  const polar = (deg: number, r = R) => [160 + r * Math.cos((deg * Math.PI) / 180), 118 + r * Math.sin((deg * Math.PI) / 180)];
  const arc = (from: number, to: number) => {
    const [x1, y1] = polar(from);
    const [x2, y2] = polar(to);
    return `M ${x1} ${y1} A ${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const [nx, ny] = polar(a, R - 26);
  return (
    <div
      style={{
        position: 'absolute',
        right: 44,
        top: 1090,
        width: 480,
        transform: `translateY(${(1 - p) * 200}px) scale(${0.8 + p * 0.2})`,
        opacity: Math.min(1, p * 1.5),
      }}
    >
      <Glass radius={40} style={{height: 300, padding: '18px 24px'}} glow={interpolate(frame - at, [0, 50], [1, 0], clamp)}>
        <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <Feather size={34} color={COLORS.neonHot} />
          <span style={{fontSize: 30, fontWeight: 800, color: '#fff'}}>فوق سبک</span>
        </div>
        <svg width={320} height={200} style={{position: 'absolute', left: 56, top: 40}}>
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0" stopColor={COLORS.neonHot} />
              <stop offset="1" stopColor={COLORS.neon} />
            </linearGradient>
          </defs>
          <path d={arc(startA, startA + sweep)} stroke="rgba(255,255,255,0.14)" strokeWidth={18} fill="none" strokeLinecap="round" />
          {fill > 0.01 ? (
            <path d={arc(startA, a)} stroke="url(#g)" strokeWidth={18} fill="none" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 10px #C77DFF)'}} />
          ) : null}
          <line x1={160} y1={118} x2={nx} y2={ny} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
          <circle cx={160} cy={118} r={12} fill="#fff" />
        </svg>
        <div dir="rtl" style={{position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center'}}>
          <span style={{fontSize: 58, fontWeight: 900, color: '#fff', textShadow: '0 0 20px rgba(199,125,255,0.9)'}}>
            {toFa(grams)}
          </span>
          <span style={{fontSize: 34, fontWeight: 800, color: COLORS.neonHot, marginRight: 10}}>گرم وزن</span>
        </div>
      </Glass>
    </div>
  );
};

const TouchCard: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const p = pop(frame, at);
  const f = frame - at;
  return (
    <div
      style={{
        position: 'absolute',
        left: 44,
        top: 1090,
        width: 460,
        transform: `translateY(${(1 - p) * 200}px) scale(${0.8 + p * 0.2})`,
        opacity: Math.min(1, p * 1.5),
      }}
    >
      <Glass radius={40} style={{height: 300, padding: '22px 26px'}} glow={interpolate(f, [0, 50], [1, 0], clamp)}>
        {[0, 20, 40].map((d) => {
          const q = ((f - d + 600) % 60) / 60;
          return (
            <div
              key={d}
              style={{
                position: 'absolute',
                left: 360 - 90 * q,
                top: 70 - 90 * q,
                width: 180 * q,
                height: 180 * q,
                borderRadius: '50%',
                border: `3px solid rgba(224,170,255,${(1 - q) * 0.8})`,
              }}
            />
          );
        })}
        <Fingerprint size={46} color={COLORS.neonHot} style={{position: 'absolute', left: 337, top: 47}} />
        <div style={{direction: 'ltr', display: 'flex', flexDirection: 'column'}}>
          <span style={{fontSize: 84, fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 0 24px rgba(199,125,255,0.9)'}}>
            12.3″
          </span>
          <span style={{fontSize: 40, fontWeight: 800, color: COLORS.neonHot, marginTop: 14}}>2K Touch</span>
          <span style={{fontSize: 26, fontWeight: 700, color: COLORS.muted, marginTop: 6}}>PixelSense · 2736×1824</span>
        </div>
      </Glass>
    </div>
  );
};

export const DesignScene: React.FC<{start: number; cues: Cues}> = ({start, cues}) => {
  const frame = useCurrentFrame();
  const local = (s: number) => sec(s) - start;
  const head = pop(frame, 8);
  const kb = pop(frame, local(cues.keyboard));
  const touchAt = local(cues.touch);
  return (
    <AbsoluteFill>
      <Background />
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 300,
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: `translateY(${(1 - head) * -40}px)`,
          opacity: head,
        }}
      >
        <NeonText size={58} weight={900}>
          ۲ در ۱ : تبلت + لپ‌تاپ
        </NeonText>
      </div>

      <TurntablePreload />
      <Sequence durationInFrames={40} layout="none">
        <CameraMotionBlur shutterAngle={200} samples={6}>
          <DeviceStage offset={0} weightAt={local(cues.weight)} keyboardAt={local(cues.keyboard)} touchAt={touchAt} />
        </CameraMotionBlur>
      </Sequence>
      <Sequence from={40} layout="none">
        <DeviceStage offset={40} weightAt={local(cues.weight)} keyboardAt={local(cues.keyboard)} touchAt={touchAt} />
      </Sequence>

      {/* detachable keyboard chip */}
      {frame >= local(cues.keyboard) ? (
        <div
          style={{
            position: 'absolute',
            top: 1000,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            transform: `scale(${0.5 + kb * 0.5})`,
            opacity: Math.min(1, kb * 1.5),
            zIndex: 6,
          }}
        >
          <Glass radius={999} style={{padding: '14px 32px'}} glow={0.4}>
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <Keyboard size={40} color={COLORS.neonHot} />
              <span style={{fontSize: 34, fontWeight: 800, color: '#fff'}}>کیبورد جداشونده</span>
              <span style={{fontSize: 28, fontWeight: 700, color: COLORS.muted, direction: 'ltr'}}>Type Cover</span>
            </div>
          </Glass>
        </div>
      ) : null}

      <TouchRipple at={touchAt} />
      {frame >= local(cues.weight) - 2 ? <WeightGauge at={local(cues.weight)} /> : null}
      {frame >= touchAt - 2 ? <TouchCard at={touchAt} /> : null}
    </AbsoluteFill>
  );
};
