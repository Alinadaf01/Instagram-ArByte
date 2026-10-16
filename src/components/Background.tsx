import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {COLORS} from '../config';
import {useBass} from '../lib/audio';

const ORBS = [
  {x: 0.15, y: 0.18, r: 620, c: 'rgba(157,78,221,0.55)', seed: 'a'},
  {x: 0.9, y: 0.42, r: 700, c: 'rgba(90,24,154,0.6)', seed: 'b'},
  {x: 0.3, y: 0.82, r: 760, c: 'rgba(123,44,191,0.5)', seed: 'c'},
  {x: 0.8, y: 0.95, r: 520, c: 'rgba(224,170,255,0.22)', seed: 'd'},
];

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// Deep obsidian→violet backdrop with drifting neon orbs (bass-reactive),
// a faint perspective grid and film grain.
export const Background: React.FC<{intensity?: number}> = ({intensity = 1}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 80% at 50% 0%, ${COLORS.bgViolet} 0%, ${COLORS.bgDeep} 70%)`,
        overflow: 'hidden',
      }}
    >
      {ORBS.map((o, i) => {
        const dx = noise2D(o.seed, frame / 400, 0) * 140;
        const dy = noise2D(o.seed, 0, frame / 400) * 160;
        const s = 1 + bass * 0.22 * intensity;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: o.x * 1080 - o.r / 2 + dx,
              top: o.y * 1920 - o.r / 2 + dy,
              width: o.r,
              height: o.r,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${o.c} 0%, transparent 68%)`,
              transform: `scale(${s})`,
              opacity: 0.75 + bass * 0.25,
              filter: 'blur(30px)',
            }}
          />
        );
      })}
      {/* perspective grid floor */}
      <div
        style={{
          position: 'absolute',
          left: -540,
          right: -540,
          bottom: -200,
          height: 900,
          transform: 'perspective(700px) rotateX(62deg)',
          backgroundImage:
            'linear-gradient(rgba(157,78,221,0.22) 2px, transparent 2px), linear-gradient(90deg, rgba(157,78,221,0.22) 2px, transparent 2px)',
          backgroundSize: '90px 90px',
          backgroundPosition: `0 ${(frame * 1.2) % 90}px`,
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent 85%)',
          opacity: 0.55 + bass * 0.3,
        }}
      />
      <AbsoluteFill style={{backgroundImage: GRAIN, opacity: 0.07, mixBlendMode: 'overlay'}} />
      <AbsoluteFill
        style={{background: 'radial-gradient(130% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)'}}
      />
    </AbsoluteFill>
  );
};
