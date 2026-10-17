import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {ASSETS, FPS, MUSIC} from './config';
import {loadFonts} from './lib/fonts';
import {sceneLayout, sec, Timeline} from './lib/timeline';
import {BassProvider} from './lib/audio';
import {IntroScene} from './scenes/IntroScene';
import {DesignScene} from './scenes/DesignScene';
import {ConfigScene} from './scenes/ConfigScene';
import {BuyScene} from './scenes/BuyScene';
import {ProgressBar} from './components/ProgressBar';
import {Subtitles} from './components/Subtitles';
import {glassPush, zoomFlash} from './components/transitions';
import {beatAfter, BeatProvider, useBeatPulse} from './lib/beat';

// Whole-frame "camera" punch on every beat (stronger on downbeats) once the
// motion-graphics part starts, so the edit hits with the music.
const BeatPunch: React.FC<{from: number; children: React.ReactNode}> = ({from, children}) => {
  const {beat, down} = useBeatPulse(0, 7);
  const frameT = useCurrentFrame() / FPS;
  const k = frameT >= from ? 1 : 0;
  return (
    <AbsoluteFill style={{transform: `scale(${1 + k * (beat * 0.008 + down * 0.018)})`}}>{children}</AbsoluteFill>
  );
};

loadFonts();

export type VideoProps = {
  timeline: Timeline;
  musicDrop: number | null; // seconds into music.mp3 where its drop is
  hasMusic: boolean;
  hasLogo: boolean;
  websiteAspect: number;
};

// Music volume envelope: duck under speech, swell on the drop & in pauses.
const useMusicVolume = (tl: Timeline) => {
  const speech = tl.words.map((w) => [w.start - 0.15, w.end + 0.25] as const);
  const introEnd = tl.voStart;
  const voEnd = tl.voStart + tl.voDuration;
  const end = tl.bounds[3];
  const target = (t: number) => {
    if (t >= introEnd - 0.15 && t < introEnd + 0.9) return MUSIC.drop;
    if (t < introEnd) return MUSIC.underSpeech;
    if (t >= voEnd + 0.2) return MUSIC.drop * Math.max(0, Math.min(1, (end - t) / 0.6));
    const talking = speech.some(([a, b]) => t >= a && t <= b);
    return talking ? MUSIC.underSpeech : MUSIC.gaps;
  };
  return (f: number) => {
    // smooth with a ±0.2s box filter so ducking ramps instead of clicking
    let s = 0;
    const N = 12;
    for (let i = -N; i <= N; i++) s += target((f + i) / FPS);
    return s / (2 * N + 1);
  };
};

export const ArbyteReel: React.FC<VideoProps> = ({timeline: tl, musicDrop, hasMusic, hasLogo, websiteAspect}) => {
  const {starts, durations, transitionFrames} = sceneLayout(tl);
  const volume = useMusicVolume(tl);
  const timing = linearTiming({durationInFrames: transitionFrames});

  // Align the music's own drop with the intro → part B cut.
  const offset = (musicDrop ?? MUSIC.dropAt) - MUSIC.dropAt; // + → trim music start, − → delay music
  const musicTrim = Math.max(0, sec(offset));
  const musicDelay = Math.max(0, sec(-offset));

  return (
    <BeatProvider beats={tl.beats} downbeats={tl.downbeats}>
    <BassProvider enabled={hasMusic} musicStartFrame={musicDelay} musicTrimFrames={musicTrim}>
      <AbsoluteFill style={{background: '#080411', fontFamily: "'Vazirmatn', sans-serif"}}>
        <BeatPunch from={tl.voStart}>
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={durations[0]}>
            <IntroScene durationInFrames={durations[0]} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={zoomFlash()} timing={timing} />
          <TransitionSeries.Sequence durationInFrames={durations[1]}>
            <DesignScene start={starts[1]} cues={tl.cues.design} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={glassPush()} timing={timing} />
          <TransitionSeries.Sequence durationInFrames={durations[2]}>
            <ConfigScene start={starts[2]} cues={tl.cues.config} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={glassPush()} timing={timing} />
          <TransitionSeries.Sequence durationInFrames={durations[3]}>
            <BuyScene
              start={starts[3]}
              cues={tl.cues.buy}
              ctaStart={tl.ctaStart}
              websiteAspect={websiteAspect}
              hasLogo={hasLogo}
              accent={tl.accent}
            />
          </TransitionSeries.Sequence>
        </TransitionSeries>
        </BeatPunch>

        <ProgressBar bounds={tl.bounds} />
        <Subtitles words={tl.words} showFrom={beatAfter(tl.beats, 0, 7) + 0.25} hideFrom={tl.ctaStart} />

        {/* Intro camera voice (cleaned) — fades out right at the 12.4s cut */}
        <Audio
          src={staticFile(ASSETS.introVoice)}
          volume={(f) => Math.max(0, Math.min(1, (sec(tl.voStart) - f) / 4))}
        />
        {/* Voiceover starts exactly at the intro cut */}
        <Sequence from={sec(tl.voStart)} layout="none">
          <Audio src={staticFile(ASSETS.voiceover)} trimBefore={sec(tl.voLeadIn)} />
        </Sequence>
        {hasMusic ? (
          <Sequence from={musicDelay} layout="none">
            <Audio src={staticFile(ASSETS.music)} trimBefore={musicTrim} volume={(f) => volume(f + musicDelay)} />
          </Sequence>
        ) : null}
      </AbsoluteFill>
    </BassProvider>
    </BeatProvider>
  );
};
