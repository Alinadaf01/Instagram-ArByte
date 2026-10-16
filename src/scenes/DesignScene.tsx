import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Feather, Fingerprint, Keyboard} from 'lucide-react';
import {ASSETS, COLORS} from '../config';
import {bob, clamp, pop, toFa} from '../lib/anim';
import {sec} from '../lib/timeline';
import {Background} from '../components/Background';
import {Glass, NeonText} from '../components/Glass';
import {useBass} from '../lib/audio';

type Cues = {keyboard: number; weight: number; touch: number};

const ProductShot: React.FC<{
  src: string;
  clean: boolean;
  width: number;
  style?: React.CSSProperties;
  glow?: number;
}> = ({src, clean, width, style, glow = 0}) => {
  if (clean) {
    return (
      <div style={{position: 'absolute', width, ...style}}>
        <Img
          src={staticFile(src)}
          style={{
            width: '100%',
            filter: `drop-shadow(0 30px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 ${30 + glow * 40}px rgba(157,78,221,${0.35 + glow * 0.4}))`,
          }}
        />
        {/* floor reflection */}
        <Img
          src={staticFile(src)}
          style={{
            width: '100%',
            transform: 'scaleY(-1)',
            marginTop: 6,
            opacity: 0.18,
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 35%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 35%)',
          }}
        />
      </div>
    );
  }
  // White-background photo → frame it inside a rounded glass showcase
  return (
    <div style={{position: 'absolute', width, ...style}}>
      <Glass radius={40} style={{padding: 14}} glow={glow}>
        <Img src={staticFile(src)} style={{width: '100%', borderRadius: 28, display: 'block'}} />
      </Glass>
    </div>
  );
};

const Products: React.FC<{offset: number; clean: boolean; touchAt: number}> = ({offset, clean, touchAt}) => {
  const frame = useCurrentFrame() + offset;
  const bass = useBass();
  const pFront = pop(frame, 4);
  const pSide = pop(frame, 16);
  const pBack = pop(frame, 26);
  const rot = Math.sin(frame * 0.025) * 7;
  const touchGlow = interpolate(frame - touchAt, [0, 20, 90], [0, 1, 0.2], clamp);
  return (
    <AbsoluteFill style={{perspective: 1400}}>
      <ProductShot
        src={clean ? ASSETS.surfaceSide.replace('.png', '-clean.png') : ASSETS.surfaceSide}
        clean={clean}
        width={clean ? 430 : 300}
        glow={bass * 0.3}
        style={{
          right: -20,
          top: 740 + bob(frame, 12, 0.04, 1),
          transform: `translateX(${(1 - pSide) * 500}px) rotateY(${-14 + rot}deg) rotateZ(2deg)`,
          opacity: pSide,
        }}
      />
      <ProductShot
        src={clean ? ASSETS.surfaceBack.replace('.png', '-clean.png') : ASSETS.surfaceBack}
        clean={clean}
        width={clean ? 400 : 340}
        glow={bass * 0.3}
        style={{
          right: 10,
          top: 420 + bob(frame, 12, 0.04, 2.4),
          transform: `translateX(${(1 - pBack) * 520}px) rotateY(${-26 + rot}deg) rotateZ(5deg)`,
          opacity: pBack,
        }}
      />
      <ProductShot
        src={clean ? ASSETS.surfaceFront.replace('.png', '-clean.png') : ASSETS.surfaceFront}
        clean={clean}
        width={clean ? 600 : 520}
        glow={0.25 + bass * 0.4 + touchGlow * 0.6}
        style={{
          left: clean ? 70 : 120,
          top: 500 + bob(frame, 14, 0.035),
          transform: `translateY(${(1 - pFront) * 900}px) scale(${0.6 + pFront * 0.4}) rotateY(${rot * 0.6}deg) rotateX(${(1 - pFront) * 40}deg)`,
          opacity: Math.min(1, pFront * 1.6),
          zIndex: 2,
        }}
      />
    </AbsoluteFill>
  );
};

const TouchRipple: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const f = frame - at;
  if (f < -10) return null;
  const finger = pop(frame, at - 10);
  return (
    <div style={{position: 'absolute', left: 370, top: 700, zIndex: 5}}>
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

export const DesignScene: React.FC<{start: number; cues: Cues; clean: boolean}> = ({start, cues, clean}) => {
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

      <Sequence durationInFrames={50} layout="none">
        <CameraMotionBlur shutterAngle={200} samples={6}>
          <Products offset={0} clean={clean} touchAt={touchAt} />
        </CameraMotionBlur>
      </Sequence>
      <Sequence from={50} layout="none">
        <Products offset={50} clean={clean} touchAt={touchAt} />
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
