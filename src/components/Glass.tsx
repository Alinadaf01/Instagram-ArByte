import React from 'react';
import {useCurrentFrame} from 'remotion';
import {COLORS} from '../config';
import {useBass} from '../lib/audio';

type Props = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  radius?: number;
  glow?: number; // 0..1 extra glow
  active?: boolean;
  shine?: boolean;
  tint?: string;
};

// Liquid-glass card: frosted blur, neon rim, specular top edge and a slow
// light sweep. Glow breathes with the music's bass.
export const Glass: React.FC<Props> = ({
  children,
  style,
  radius = 36,
  glow = 0,
  active = false,
  shine = true,
  tint = 'rgba(157,78,221,0.10)',
}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const g = Math.min(1, glow + bass * 0.55 + (active ? 0.45 : 0));
  const sweep = ((frame * 0.9) % 420) - 120;
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: radius,
        background: `linear-gradient(140deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 42%, ${tint} 100%)`,
        backdropFilter: 'blur(24px) saturate(170%)',
        WebkitBackdropFilter: 'blur(24px) saturate(170%)',
        border: `1.5px solid rgba(255,255,255,${0.16 + g * 0.12})`,
        boxShadow: [
          `0 0 0 1.5px rgba(157,78,221,${0.35 + g * 0.5})`,
          `0 0 ${24 + g * 46}px rgba(157,78,221,${0.25 + g * 0.45})`,
          'inset 0 1.5px 0 rgba(255,255,255,0.38)',
          'inset 0 -12px 30px rgba(157,78,221,0.12)',
          '0 30px 70px rgba(0,0,0,0.55)',
        ].join(', '),
        overflow: 'hidden',
        ...style,
      }}
    >
      {shine ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(115deg, transparent ${sweep}%, rgba(255,255,255,0.13) ${sweep + 8}%, transparent ${sweep + 18}%)`,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <div style={{position: 'relative', width: '100%', height: '100%'}}>{children}</div>
    </div>
  );
};

export const NeonText: React.FC<{
  children: React.ReactNode;
  size: number;
  weight?: number;
  color?: string;
  glow?: number;
  style?: React.CSSProperties;
}> = ({children, size, weight = 800, color = COLORS.white, glow = 0.6, style}) => (
  <div
    style={{
      fontSize: size,
      fontWeight: weight,
      color,
      lineHeight: 1.25,
      textShadow: `0 0 ${18 * glow}px rgba(199,125,255,${0.8 * glow}), 0 0 ${48 * glow}px rgba(157,78,221,${0.6 * glow}), 0 4px 18px rgba(0,0,0,0.5)`,
      ...style,
    }}
  >
    {children}
  </div>
);
