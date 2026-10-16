import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';

type ZoomFlashProps = {flash: number; zoom: number};

// Punchy zoom-through with a neon flash, used on the beat drop.
const ZoomFlashPresentation: React.FC<TransitionPresentationComponentProps<ZoomFlashProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const entering = presentationDirection === 'entering';
  const scale = entering
    ? interpolate(p, [0, 1], [1 + passedProps.zoom, 1])
    : interpolate(p, [0, 1], [1, 1 + passedProps.zoom * 1.6]);
  const blur = entering ? interpolate(p, [0, 0.6], [18, 0], {extrapolateRight: 'clamp'}) : interpolate(p, [0.3, 1], [0, 22], {extrapolateLeft: 'clamp'});
  const opacity = entering ? interpolate(p, [0.35, 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const flash = interpolate(p, [0.25, 0.5, 0.85], [0, passedProps.flash, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${scale})`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined, opacity}}>
        {children}
      </AbsoluteFill>
      {entering ? (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(224,170,255,0.95) 30%, rgba(157,78,221,0.7) 60%, rgba(157,78,221,0) 100%)',
            opacity: flash,
            mixBlendMode: 'screen',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const zoomFlash = (props: Partial<ZoomFlashProps> = {}): TransitionPresentation<ZoomFlashProps> => ({
  component: ZoomFlashPresentation,
  props: {flash: 0.95, zoom: 0.35, ...props},
});

type GlassPushProps = {dir: 1 | -1};

// Lateral push with depth + motion-blur feel between UI scenes.
const GlassPushPresentation: React.FC<TransitionPresentationComponentProps<GlassPushProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const entering = presentationDirection === 'entering';
  const x = entering ? interpolate(p, [0, 1], [100, 0]) : interpolate(p, [0, 1], [0, -38]);
  const s = entering ? interpolate(p, [0, 1], [0.92, 1]) : interpolate(p, [0, 1], [1, 0.86]);
  const blur = Math.sin(p * Math.PI) * 10;
  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${x * passedProps.dir}%) scale(${s})`,
        filter: `blur(${blur}px) brightness(${entering ? 1 : 1 - p * 0.5})`,
        borderRadius: entering ? interpolate(p, [0, 1], [80, 0]) : 0,
        overflow: 'hidden',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// RTL story → new scenes enter from the left.
export const glassPush = (dir: 1 | -1 = -1): TransitionPresentation<GlassPushProps> => ({
  component: GlassPushPresentation,
  props: {dir},
});
