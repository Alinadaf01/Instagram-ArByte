import {interpolate, spring} from 'remotion';
import {FPS, SPRING, SPRING_SOFT} from '../config';

export const pop = (frame: number, startFrame: number, soft = false) =>
  spring({
    frame: frame - startFrame,
    fps: FPS,
    config: soft ? SPRING_SOFT : SPRING,
  });

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const fadeIn = (frame: number, start: number, len = 12) =>
  interpolate(frame, [start, start + len], [0, 1], clamp);

export const fadeOut = (frame: number, start: number, len = 12) =>
  interpolate(frame, [start, start + len], [1, 0], clamp);

// Gentle floating bob
export const bob = (frame: number, amp = 10, speed = 0.035, phase = 0) =>
  Math.sin(frame * speed + phase) * amp;

export const toFa = (s: string | number) =>
  String(s).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
