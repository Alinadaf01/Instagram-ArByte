import React, {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';
import {FPS} from '../config';

type Grid = {beats: number[]; downbeats: number[]};
const BeatContext = createContext<Grid>({beats: [], downbeats: []});

export const BeatProvider: React.FC<Grid & {children: React.ReactNode}> = ({beats, downbeats, children}) => (
  <BeatContext.Provider value={{beats, downbeats}}>{children}</BeatContext.Provider>
);

export const useBeats = () => useContext(BeatContext);

// 1 on the beat, decaying exponentially. `offset` converts a Sequence-local
// frame back to absolute video frames.
export const pulseAt = (absFrame: number, times: number[], decay = 7) => {
  const t = absFrame / FPS;
  let last = -Infinity;
  for (const b of times) {
    if (b <= t + 1e-6) last = b;
    else break;
  }
  if (last === -Infinity) return 0;
  return Math.exp(-((t - last) * FPS) / decay);
};

export const useBeatPulse = (offset = 0, decay = 7) => {
  const frame = useCurrentFrame() + offset;
  const {beats, downbeats} = useBeats();
  return {beat: pulseAt(frame, beats, decay), down: pulseAt(frame, downbeats, decay * 1.4)};
};

// n-th beat at or after `from` seconds (fallback: evenly spaced at 129 BPM)
export const beatAfter = (beats: number[], from: number, n = 0) => {
  const idx = beats.findIndex((b) => b >= from - 0.02);
  if (idx >= 0 && beats[idx + n] !== undefined) return beats[idx + n];
  return from + n * (60 / 129);
};
