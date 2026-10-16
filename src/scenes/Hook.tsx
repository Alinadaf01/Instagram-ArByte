import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {BadgeCheck, ShoppingBag} from 'lucide-react';
import {ASSETS, COLORS, FPS} from '../config';
import {clamp, pop} from '../lib/anim';
import {beatAfter, useBeatPulse, useBeats} from '../lib/beat';
import {Glass, NeonText} from '../components/Glass';
import {useBass} from '../lib/audio';

// ── 0–3.5s scroll-stopper ─────────────────────────────────────────────────
// Frame 0 already has the Surface mid-flight (no fade-in), then every beat
// lands a new punch: name → «لپ‌تاپ؟» → «تبلت؟» → «هر دو!» → buy chip, and on
// the next downbeat the device flies up into the title pill and the intro
// video takes over.

export const useHookTimes = () => {
  const {beats} = useBeats();
  const b = (n: number) => beatAfter(beats, 0, n);
  return {
    name: b(0), // first beat ≈ frame 1 → text is on screen immediately
    laptop: b(1),
    tablet: b(2),
    both: b(3), // downbeat
    specs: b(4),
    chip: b(5),
    out: b(7), // ≈3.2s (downbeat)
  };
};

const Word: React.FC<{at: number; children: React.ReactNode; size: number; color?: string; strike?: boolean; style?: React.CSSProperties}> = ({
  at,
  children,
  size,
  color = '#fff',
  strike,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = Math.round(at * FPS);
  if (frame < f - 1) return null;
  const p = pop(frame, f);
  const slam = interpolate(frame - f, [0, 3, 10], [1.8, 0.92, 1], clamp);
  return (
    <div
      style={{
        transform: `scale(${slam * (0.6 + p * 0.4)})`,
        opacity: Math.min(1, (frame - f + 2) / 3),
        fontSize: size,
        fontWeight: 900,
        color,
        lineHeight: 1.1,
        textShadow: `0 0 26px rgba(199,125,255,0.95), 0 0 70px rgba(157,78,221,0.8), 0 6px 20px rgba(0,0,0,0.7)`,
        textDecoration: strike ? 'line-through' : undefined,
        textDecorationColor: COLORS.neonHot,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Device: React.FC<{offset: number; out: number}> = ({offset, out}) => {
  const frame = useCurrentFrame() + offset;
  const bass = useBass();
  const {beat} = useBeatPulse(offset, 6);
  // spring starts before frame 0 → first frame is mid-motion
  const enter = pop(frame, -9);
  const spin = interpolate(frame, [0, 40], [-38, 0], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const outF = Math.round(out * FPS);
  const fly = pop(frame, outF);
  const x = interpolate(fly, [0, 1], [0, -40]);
  const y = interpolate(fly, [0, 1], [0, -720]);
  const s = interpolate(fly, [0, 1], [1, 0.16]);
  const idle = Math.sin(frame * 0.06) * 6;
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        top: 700,
        width: 900,
        transform: `translate(${x}px, ${(1 - enter) * 700 + y + idle}px) perspective(1400px) rotateY(${spin + Math.sin(frame * 0.03) * 6}deg) rotateX(${(1 - enter) * 30}deg) scale(${(0.7 + enter * 0.3) * s * (1 + beat * 0.035)})`,
        opacity: interpolate(fly, [0.25, 0.7], [1, 0], clamp),
      }}
    >
      {/* halo */}
      <div
        style={{
          position: 'absolute',
          inset: '-10% -5%',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(157,78,221,${0.55 + bass * 0.3}) 0%, transparent 65%)`,
          filter: 'blur(20px)',
        }}
      />
      <Img
        src={staticFile(ASSETS.surfaceFront.replace('.png', '-clean.png'))}
        style={{
          position: 'relative',
          width: '100%',
          filter: `drop-shadow(0 40px 50px rgba(0,0,0,0.7)) drop-shadow(0 0 ${40 + beat * 40}px rgba(199,125,255,0.8))`,
        }}
      />
      {/* specular sweep over the device */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(110deg, transparent ${((frame * 3.2) % 260) - 80}%, rgba(255,255,255,0.35) ${((frame * 3.2) % 260) - 70}%, transparent ${((frame * 3.2) % 260) - 58}%)`,
          mixBlendMode: 'overlay',
          WebkitMaskImage: `url(${staticFile(ASSETS.surfaceFront.replace('.png', '-clean.png'))})`,
          WebkitMaskSize: '100% 100%',
          maskImage: `url(${staticFile(ASSETS.surfaceFront.replace('.png', '-clean.png'))})`,
          maskSize: '100% 100%',
        }}
      />
    </div>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const T = useHookTimes();
  const outF = Math.round(T.out * FPS);
  const {beat} = useBeatPulse(0, 5);
  const gone = interpolate(frame, [outF, outF + 18], [1, 0], clamp);
  if (gone <= 0) return null;
  const bothF = Math.round(T.both * FPS);
  const flash = interpolate(frame - bothF, [0, 3, 16], [0, 0.85, 0], clamp);
  const textOut = interpolate(frame, [outF - 4, outF + 8], [1, 0], clamp);
  const chip = pop(frame, Math.round(T.chip * FPS));
  return (
    <AbsoluteFill style={{opacity: gone}}>
      {/* purple glass wash over the intro video, pulsing on the beat */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(100% 70% at 50% 45%, rgba(21,9,43,${0.55 + beat * 0.08}) 0%, rgba(8,4,17,0.88) 100%)`,
          backdropFilter: 'blur(10px) saturate(140%)',
        }}
      />
      {/* Device: motion-blurred entrance, then sharp */}
      <Sequence durationInFrames={24} layout="none">
        <CameraMotionBlur shutterAngle={240} samples={7}>
          <Device offset={0} out={T.out} />
        </CameraMotionBlur>
      </Sequence>
      <Sequence from={24} layout="none">
        <Device offset={24} out={T.out} />
      </Sequence>

      {/* kinetic headline, one punch per beat */}
      <div style={{position: 'absolute', top: 330, left: 40, right: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: textOut}}>
        <Word at={T.name} size={124} style={{direction: 'ltr', letterSpacing: -2}}>
          Surface Pro 7+
        </Word>
        <div dir="rtl" style={{display: 'flex', gap: 34, alignItems: 'center', height: 130}}>
          <Word at={T.laptop} size={96} color={frame >= bothF ? 'rgba(255,255,255,0.55)' : '#fff'}>
            لپ‌تاپ؟
          </Word>
          <Word at={T.tablet} size={96} color={frame >= bothF ? 'rgba(255,255,255,0.55)' : '#fff'}>
            تبلت؟
          </Word>
        </div>
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 1150, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: textOut}}>
        <Word at={T.both} size={150} color={COLORS.neonHot}>
          هر دو!
        </Word>
        <Word at={T.specs} size={44} color={COLORS.silver} style={{direction: 'ltr', letterSpacing: 1}}>
          Core i7 · 16GB RAM · 2K Touch
        </Word>
      </div>
      {/* tells the viewer this is a review + where to buy */}
      {frame >= Math.round(T.chip * FPS) ? (
        <div
          style={{
            position: 'absolute',
            top: 1430,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            transform: `translateY(${(1 - chip) * 80}px) scale(${0.7 + chip * 0.3})`,
            opacity: Math.min(1, chip * 1.5) * textOut,
          }}
        >
          <Glass radius={999} style={{padding: '14px 34px'}} glow={0.7} tint="rgba(157,78,221,0.35)">
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <BadgeCheck size={40} color={COLORS.green} strokeWidth={2.6} />
              <NeonText size={40} weight={900} glow={0.4}>
                بررسی کامل + خرید از آربایت
              </NeonText>
              <ShoppingBag size={38} color={COLORS.neonHot} strokeWidth={2.4} />
            </div>
          </Glass>
        </div>
      ) : null}

      {flash > 0 ? (
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 60%, #fff 0%, rgba(224,170,255,0.8) 35%, transparent 75%)', opacity: flash, mixBlendMode: 'screen'}} />
      ) : null}
    </AbsoluteFill>
  );
};
