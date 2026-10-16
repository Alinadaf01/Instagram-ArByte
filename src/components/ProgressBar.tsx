import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FPS, STAGES} from '../config';
import {clamp, pop} from '../lib/anim';
import {useBass} from '../lib/audio';

// Segmented liquid-glass progress bar (RTL: stage 1 sits on the right).
export const ProgressBar: React.FC<{bounds: [number, number, number, number]}> = ({bounds}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const t = frame / FPS;
  const edges = [0, ...bounds];
  const enter = pop(frame, 6);
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        top: 196,
        left: 44,
        right: 44,
        display: 'flex',
        gap: 10,
        transform: `translateY(${(1 - enter) * -60}px)`,
        opacity: enter,
      }}
    >
      {STAGES.map((label, i) => {
        const p = interpolate(t, [edges[i], edges[i + 1]], [0, 1], clamp);
        const active = t >= edges[i] && t < edges[i + 1];
        const done = t >= edges[i + 1];
        const glow = active ? 0.6 + bass * 0.4 : done ? 0.25 : 0;
        return (
          <div key={label} style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 8}}>
            <div
              style={{
                height: 12,
                borderRadius: 99,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(14px)',
                overflow: 'hidden',
                boxShadow: glow ? `0 0 ${16 * glow}px rgba(157,78,221,${glow})` : undefined,
              }}
            >
              <div
                style={{
                  width: `${p * 100}%`,
                  height: '100%',
                  marginRight: 0,
                  borderRadius: 99,
                  background: `linear-gradient(270deg, ${COLORS.neonHot}, ${COLORS.neon})`,
                  boxShadow: `0 0 14px ${COLORS.neonSoft}`,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: active ? 800 : 700,
                color: active ? COLORS.white : done ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
                textAlign: 'center',
                textShadow: active ? '0 0 14px rgba(199,125,255,0.9), 0 2px 8px rgba(0,0,0,0.6)' : '0 2px 8px rgba(0,0,0,0.6)',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
