import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {parseMedia} from '@remotion/media-parser';
import {ASSETS, FPS, HEIGHT, WIDTH} from './config';
import {AudioAnalysis, buildTimeline, Timestamps} from './lib/timeline';
import {ArbyteReel, VideoProps} from './Video';
import {TRUST_DURATION, TRUST_MUSIC_START, TrustReel, TrustReelProps} from './trust/TrustReel';
import {Story} from './trust/Stories';
import {I5vsI7, V2_MUSIC_START, V2Props} from './v2/I5vsI7';

const v2Metadata: CalculateMetadataFunction<V2Props> = async ({props}) => {
  const [edit, analysis] = await Promise.all([
    fetchJson<{duration: number; words: V2Props['words']; segments: V2Props['segments']}>('video2/edit.json'),
    fetchJson<AudioAnalysis>(ASSETS.audioAnalysis),
  ]);
  const duration = (edit?.duration ?? 38) + 0.4;
  const shift = (xs?: number[]) => (xs ?? []).map((b) => b - V2_MUSIC_START).filter((b) => b >= -0.01 && b <= duration);
  return {
    durationInFrames: Math.round(duration * FPS),
    props: {...props, duration, words: edit?.words ?? [], segments: edit?.segments ?? [], beats: shift(analysis?.beats), downbeats: shift(analysis?.downbeats)},
  };
};

// beats of music.mp3 re-based to a reel that starts `start` seconds into it
const trustMetadata: CalculateMetadataFunction<TrustReelProps> = async ({props}) => {
  const analysis = await fetchJson<AudioAnalysis>(ASSETS.audioAnalysis);
  const shift = (xs?: number[]) => (xs ?? []).map((b) => b - TRUST_MUSIC_START).filter((b) => b >= -0.01 && b <= TRUST_DURATION / FPS);
  return {props: {...props, beats: shift(analysis?.beats), downbeats: shift(analysis?.downbeats), hasLogo: await exists(ASSETS.logoClean)}};
};

const exists = async (file: string) => {
  try {
    const r = await fetch(staticFile(file), {method: 'HEAD'});
    return r.ok;
  } catch {
    return false;
  }
};

const fetchJson = async <T,>(file: string): Promise<T | null> => {
  try {
    const r = await fetch(staticFile(file));
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
};

const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({props}) => {
  const [ts, voDur, analysis, hasMusic, hasLogo, web] = await Promise.all([
    fetchJson<Timestamps>(ASSETS.timestamps),
    parseMedia({src: staticFile(ASSETS.voiceover), fields: {durationInSeconds: true}, acknowledgeRemotionLicense: true})
      .then((m) => m.durationInSeconds ?? 0)
      .catch(() => 0),
    fetchJson<AudioAnalysis>(ASSETS.audioAnalysis),
    exists(ASSETS.music),
    exists(ASSETS.logo),
    parseMedia({src: staticFile(ASSETS.website), fields: {dimensions: true}, acknowledgeRemotionLicense: true})
      .then((m) => m.dimensions)
      .catch(() => null),
  ]);
  // edit.json is already trimmed/cut → no lead-in, pauses come re-timed with it
  const edited: AudioAnalysis | null = analysis && {...analysis, voLeadIn: 0, voPauses: ts?.voiceover?.pauses ?? []};
  const timeline = buildTimeline(ts, voDur, edited);
  return {
    durationInFrames: timeline.durationInFrames,
    props: {
      ...props,
      timeline,
      musicDrop: edited?.musicDrop ?? null,
      hasMusic,
      hasLogo,
      websiteAspect: web ? web.width / web.height : 16 / 10,
    },
  };
};

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="SurfacePro7Plus"
    component={ArbyteReel}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    durationInFrames={FPS * 40}
    defaultProps={{
      timeline: buildTimeline(null, 30, null),
      musicDrop: null,
      hasMusic: true,
      hasLogo: true,
      websiteAspect: 16 / 10,
    }}
    calculateMetadata={calculateMetadata}
  />
  <Composition
    id="TrustReel"
    component={TrustReel}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    durationInFrames={TRUST_DURATION}
    defaultProps={{beats: [], downbeats: [], hasLogo: true}}
    calculateMetadata={trustMetadata}
  />
  <Composition
    id="I5vsI7"
    component={I5vsI7}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    durationInFrames={FPS * 38}
    defaultProps={{duration: 38, words: [], segments: [], beats: [], downbeats: []}}
    calculateMetadata={v2Metadata}
  />
  <Composition id="Story" component={Story} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={1} defaultProps={{index: 0}} />
  </>
);
