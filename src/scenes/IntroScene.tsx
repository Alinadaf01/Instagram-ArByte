import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {ASSETS, COLORS, INTRO_BADGES, INTRO_BADGE_SIDE, INTRO_DURATION, INTRO_TRIM_START} from '../config';
import {bob, clamp, pop} from '../lib/anim';
import {sec} from '../lib/timeline';
import {Glass} from '../components/Glass';
import {SpecIcon} from '../components/Icon';
import {useBass} from '../lib/audio';

export const IntroScene: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const introEnd = sec(INTRO_DURATION);
  // slow cinematic push-in on the talking head
  const push = interpolate(frame, [0, introEnd], [1.0, 1.06], clamp);
  const title = pop(frame, 12);
  const side = INTRO_BADGE_SIDE;

  return (
    <AbsoluteFill style={{background: COLORS.bgDeep}}>
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <OffthreadVideo
          src={staticFile(ASSETS.intro)}
          trimBefore={sec(INTRO_TRIM_START)}
          trimAfter={sec(INTRO_TRIM_START) + durationInFrames + 2}
          // keep the voice up to the 12.4s cut, mute the overlap tail
          volume={(f) => interpolate(f, [introEnd - 3, introEnd], [1, 0], clamp)}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>

      {/* subtle purple grade + cinematic vignettes */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.55) 0%, transparent 22%)'}} />
      <AbsoluteFill
        style={{background: 'linear-gradient(0deg, rgba(8,4,17,0.92) 0%, rgba(8,4,17,0.55) 26%, transparent 46%)'}}
      />
      <AbsoluteFill
        style={{background: 'radial-gradient(120% 70% at 50% 40%, transparent 60%, rgba(8,4,17,0.55) 100%)'}}
      />

      {/* product title pill */}
      <div
        style={{
          position: 'absolute',
          top: 290,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          transform: `translateY(${(1 - title) * -50}px) scale(${0.85 + title * 0.15})`,
          opacity: title,
        }}
      >
        <Glass radius={999} style={{padding: '16px 40px'}} glow={0.2}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16, direction: 'ltr'}}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 99,
                background: COLORS.neonHot,
                boxShadow: `0 0 ${14 + bass * 20}px ${COLORS.neonSoft}`,
              }}
            />
            <span style={{fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: 0.5}}>
              Microsoft Surface Pro 7+
            </span>
          </div>
        </Glass>
      </div>

      {/* floating spec badges, synced to speech */}
      {INTRO_BADGES.map((b, i) => {
        const start = sec(b.at);
        const p = pop(frame, start);
        if (frame < start) return null;
        const dir = side === 'left' ? -1 : 1;
        const y = 640 + i * 158 + bob(frame, 7, 0.05, i * 1.7);
        return (
          <div
            key={b.value}
            style={{
              position: 'absolute',
              top: y,
              [side]: 44,
              transform: `translateX(${(1 - p) * 260 * dir}px) scale(${0.6 + p * 0.4}) rotate(${(1 - p) * 8 * dir}deg)`,
              transformOrigin: side === 'left' ? 'left center' : 'right center',
              opacity: Math.min(1, p * 1.5),
            }}
          >
            <Glass radius={30} style={{padding: '18px 26px 18px 18px'}} glow={interpolate(frame - start, [0, 40], [1, 0], clamp)}>
              <div style={{display: 'flex', alignItems: 'center', gap: 18, direction: 'ltr'}}>
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${COLORS.neon}, #5A189A)`,
                    boxShadow: `0 0 24px rgba(157,78,221,0.7), inset 0 1px 0 rgba(255,255,255,0.4)`,
                  }}
                >
                  <SpecIcon name={b.icon} size={42} />
                </div>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <span style={{fontSize: 24, fontWeight: 700, color: COLORS.muted, direction: 'rtl', textAlign: 'left'}}>
                    {b.label}
                  </span>
                  <span style={{fontSize: 36, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap'}}>{b.value}</span>
                </div>
              </div>
            </Glass>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
