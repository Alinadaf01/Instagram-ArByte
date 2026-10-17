import React from 'react';
import {Img, staticFile} from 'remotion';

// Official Surface Pro 7+ 360° turntable (36 frames, 10° apart).
// Frame 0 = ¾ front-left, 4 = straight front, 13 = side, 22 = straight back.
export const SPIN_FRAMES = 36;
export const SPIN_ASPECT = 911 / 493;
export const FRONT = 0;

export const spinSrc = (i: number) =>
  staticFile(`surface/spin/${String(((Math.round(i) % SPIN_FRAMES) + SPIN_FRAMES) % SPIN_FRAMES).padStart(2, '0')}.png`);

export const Turntable: React.FC<{
  angle: number; // in frames (any real number, wraps)
  width: number;
  glow?: number;
  style?: React.CSSProperties;
  reflection?: boolean;
}> = ({angle, width, glow = 0.3, style, reflection = true}) => {
  const src = spinSrc(angle);
  return (
    <div style={{position: 'relative', width, ...style}}>
      <div
        style={{
          position: 'absolute',
          inset: '-12% -6%',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(157,78,221,${0.35 + glow * 0.4}) 0%, transparent 62%)`,
          filter: 'blur(24px)',
        }}
      />
      <Img
        src={src}
        style={{
          position: 'relative',
          width: '100%',
          display: 'block',
          filter: `drop-shadow(0 34px 40px rgba(0,0,0,0.65)) drop-shadow(0 0 ${26 + glow * 40}px rgba(199,125,255,${0.35 + glow * 0.45}))`,
        }}
      />
      {reflection ? (
        <Img
          src={src}
          style={{
            position: 'relative',
            width: '100%',
            display: 'block',
            transform: 'scaleY(-1)',
            marginTop: -6,
            opacity: 0.16,
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 32%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 32%)',
          }}
        />
      ) : null}
    </div>
  );
};

// Preloads every frame once so a fast spin never waits on decode
export const TurntablePreload: React.FC = () => (
  <div style={{position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0}}>
    {Array.from({length: SPIN_FRAMES}, (_, i) => (
      <Img key={i} src={spinSrc(i)} style={{width: 1}} />
    ))}
  </div>
);
