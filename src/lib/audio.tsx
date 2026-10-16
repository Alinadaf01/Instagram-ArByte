import React, {createContext, useContext} from 'react';
import {staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {ASSETS} from '../config';

// Bass energy of music.mp3 (0..1) for the current frame, shared via context
// so the audio is analysed once and every glow can pulse to the real bass.
const BassContext = createContext(0);

const BassAnalyser: React.FC<{
  musicStartFrame: number;
  musicTrimFrames: number;
  children: React.ReactNode;
}> = ({musicStartFrame, musicTrimFrames, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(staticFile(ASSETS.music));
  let bass = 0;
  const local = frame - musicStartFrame + musicTrimFrames;
  if (audioData && local >= 0) {
    const bins = visualizeAudio({
      fps,
      frame: local,
      audioData,
      numberOfSamples: 32,
      optimizeFor: 'speed',
    });
    // low bins = kick / bass
    const raw = (bins[0] + bins[1] + bins[2]) / 3;
    bass = Math.min(1, Math.pow(raw * 3.2, 1.4));
  }
  return <BassContext.Provider value={bass}>{children}</BassContext.Provider>;
};

export const BassProvider: React.FC<{
  enabled: boolean;
  musicStartFrame: number;
  musicTrimFrames: number;
  children: React.ReactNode;
}> = ({enabled, children, ...rest}) =>
  enabled ? (
    <BassAnalyser {...rest}>{children}</BassAnalyser>
  ) : (
    <BassContext.Provider value={0}>{children}</BassContext.Provider>
  );

export const useBass = () => useContext(BassContext);
