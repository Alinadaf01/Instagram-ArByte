import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FPS, STAGES} from '../config';
import {clamp, pop} from '../lib/anim';
import {useBass} from '../lib/audio';

// Segmented liquid-glass chapter bar (RTL: stage 1 on the right). Each
// segment fills over its own chapter; the live chapter's label glows.
export const ProgressBar: React.FC<{bounds: [number, number, number, number]}> = ({bounds}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const t = frame / FPS;
  const edges = [0, ...bounds];
  const enter = pop(frame, 4);
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        top: 170,
        left: 36,
        right: 36,
        padding: '14px 18px 16px',
        borderRadius: 30,
        background: 'linear-gradient(140deg, rgba(255,255,255,0.13), rgba(157,78,221,0.10))',
        border: '1.5px solid rgba(255,255,255,0.16)',
        boxShadow: `0 0 0 1px rgba(157,78,221,0.35), 0 0 ${18 + bass * 18}px rgba(157,78,221,0.35), 0 14px 40px rgba(0,0,0,0.45)`,
        backdropFilter: 'blur(20px) saturate(160%)',
        display: 'flex',
        gap: 12,
        transform: `translateY(${(1 - enter) * -60}px)`,
        opacity: enter,
      }}
    >
      {STAGES.map((label, i) => {
        const p = interpolate(t, [edges[i], edges[i + 1]], [0, 1], clamp);
        const active = t >= edges[i] && t < edges[i + 1];
        const done = t >= edges[i + 1];
        const pulse = active ? pop(frame, Math.round(edges[i] * FPS)) : 1;
        return (
          <div key={label} style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 9, alignItems: 'stretch'}}>
            <div
              style={{
                fontSize: 27,
                fontWeight: active ? 900 : 700,
                color: active ? COLORS.white : done ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.42)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                transform: `scale(${active ? 0.9 + pulse * 0.12 : 1})`,
                textShadow: active ? '0 0 16px rgba(199,125,255,0.95), 0 2px 8px rgba(0,0,0,0.6)' : '0 2px 8px rgba(0,0,0,0.6)',
              }}
            >
              {label}
            </div>
            <div style={{height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.14)', overflow: 'hidden'}}>
              <div
                style={{
                  width: `${p * 100}%`,
                  height: '100%',
                  borderRadius: 99,
                  background: `linear-gradient(270deg, ${COLORS.neonHot}, ${COLORS.neon})`,
                  boxShadow: active ? `0 0 ${12 + bass * 14}px ${COLORS.neonSoft}` : undefined,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
