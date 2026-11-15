import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {parseMedia} from '@remotion/media-parser';
import {ASSETS, FPS, HEIGHT, WIDTH} from './config';
import {AudioAnalysis, buildTimeline, Timestamps} from './lib/timeline';
import {ArbyteReel, VideoProps} from './Video';
import {TRUST_DURATION, TRUST_MUSIC_START, TrustReel, TrustReelProps} from './trust/TrustReel';
import {Story} from './trust/Stories';
import {I5vsI7, V2_MUSIC_START, V2Props} from './v2/I5vsI7';
import {V2Cover} from './v2/Cover';
import {Budget, V3_MUSIC_START, V3Props} from './v3/Budget';
import {BudgetCover, BudgetStory} from './v3/CoverStory';
import {SurfaceId, V4_MUSIC_START, V4Props} from './v4/SurfaceId';
import {SurfaceCover} from './v4/Cover';
import {CTA_LEN, I5Gen11, V5_MUSIC_START, V5Props} from './v5/I5Gen11';
import {I5Cover} from './v5/Cover';
import {PriceList} from './lists/PriceList';
import {Gaming, TAIL6, V6_MUSIC_START, V6Props} from './v6/Gaming';
import {GamingCover} from './v6/Cover';
import {Qc, TAIL7, V7_MUSIC_START, V7Props} from './v7/Qc';
import {QcCover} from './v7/Cover';

const v2Metadata: CalculateMetadataFunction<V2Props> = async ({props}) => {
  const [edit, analysis, cut] = await Promise.all([
    fetchJson<{duration: number; words: V2Props['words']; segments: V2Props['segments']}>('video2/edit.json'),
    fetchJson<AudioAnalysis>('video2/music/analysis.json'),
    fetchJson<{start: number; end: number}>('video2/cutout.json'),
  ]);
  const duration = (edit?.duration ?? 38) + 0.4;
  const shift = (xs?: number[]) => (xs ?? []).map((b) => b - V2_MUSIC_START).filter((b) => b >= -0.01 && b <= duration);
  return {
    durationInFrames: Math.round(duration * FPS),
    props: {...props, duration, words: edit?.words ?? [], segments: edit?.segments ?? [], beats: shift(analysis?.beats), downbeats: shift(analysis?.downbeats), cutStart: cut?.start ?? 0, cutEnd: cut?.end ?? 0},
  };
};

const v3Metadata: CalculateMetadataFunction<V3Props> = async ({props}) => {
  const [edit, analysis] = await Promise.all([
    fetchJson<{duration: number; words: V3Props['words']; segments: V3Props['segments']}>('video3/edit.json'),
    fetchJson<AudioAnalysis>('video2/music/analysis.json'),
  ]);
  const duration = edit?.duration ?? 24.7;
  const total = duration + 0.6;
  const shift = (xs?: number[]) => (xs ?? []).map((b) => b - V3_MUSIC_START).filter((b) => b >= -0.01 && b <= total);
  return {
    durationInFrames: Math.round(total * FPS),
    props: {...props, duration, words: edit?.words ?? [], segments: edit?.segments ?? [], beats: shift(analysis?.beats), downbeats: shift(analysis?.downbeats)},
  };
};

const v4Metadata: CalculateMetadataFunction<V4Props> = async ({props}) => {
  const [edit, mb] = await Promise.all([
    fetchJson<{duration: number; words: V4Props['words']; segments: V4Props['segments']}>('video4/edit.json'),
    fetchJson<{beats: number[]}>('video4/music_beats.json'),
  ]);
  const duration = edit?.duration ?? 43.8;
  const total = duration + 0.7;
  const all = mb?.beats ?? [];
  // the drop (first beat after the music start) is a downbeat
  const d0 = all.findIndex((b) => b >= V4_MUSIC_START - 0.05);
  const beats = all.map((b) => b - V4_MUSIC_START).filter((b) => b >= -0.01 && b <= total);
  const downbeats = all.filter((_, i) => i >= d0 && (i - d0) % 4 === 0).map((b) => b - V4_MUSIC_START).filter((b) => b <= total);
  return {durationInFrames: Math.round(total * FPS), props: {...props, duration, words: edit?.words ?? [], segments: edit?.segments ?? [], beats, downbeats}};
};

const v5Metadata: CalculateMetadataFunction<V5Props> = async ({props}) => {
  const [edit, mb] = await Promise.all([
    fetchJson<{duration: number; words: V5Props['words']; segments: V5Props['segments']}>('video5/edit.json'),
    fetchJson<{beats: number[]}>('video5/music_beats.json'),
  ]);
  const duration = edit?.duration ?? 26;
  const total = duration + CTA_LEN;
  const all = mb?.beats ?? [];
  const d0 = all.findIndex((b) => b >= V5_MUSIC_START - 0.05);
  const beats = all.map((b) => b - V5_MUSIC_START).filter((b) => b >= -0.01 && b <= total);
  const downbeats = all.filter((_, i) => i >= d0 && (i - d0) % 4 === 0).map((b) => b - V5_MUSIC_START).filter((b) => b <= total);
  return {durationInFrames: Math.round(total * FPS), props: {...props, duration, words: edit?.words ?? [], segments: edit?.segments ?? [], beats, downbeats}};
};

const v6Metadata: CalculateMetadataFunction<V6Props> = async ({props}) => {
  const [edit, mb] = await Promise.all([
    fetchJson<{duration: number; words: V6Props['words']; segments: V6Props['segments']}>('video6/edit.json'),
    fetchJson<{beats: number[]}>('video6/music_beats.json'),
  ]);
  const duration = edit?.duration ?? 23.6;
  const total = duration + TAIL6;
  const all = mb?.beats ?? [];
  const d0 = all.findIndex((b) => b >= V6_MUSIC_START - 0.05);
  const beats = all.map((b) => b - V6_MUSIC_START).filter((b) => b >= -0.01 && b <= total);
  const downbeats = all.filter((_, i) => i >= d0 && (i - d0) % 4 === 0).map((b) => b - V6_MUSIC_START).filter((b) => b <= total);
  return {durationInFrames: Math.round(total * FPS), props: {...props, duration, words: edit?.words ?? [], segments: edit?.segments ?? [], beats, downbeats}};
};

const v7Metadata: CalculateMetadataFunction<V7Props> = async ({props}) => {
  const [edit, mb, hasMusic] = await Promise.all([
    fetchJson<{duration: number; words: V7Props['words']; segments: V7Props['segments']}>('video7/edit.json'),
    fetchJson<{beats: number[]; start?: number}>('video7/music_beats.json'),
    exists('video7/music.mp3'),
  ]);
  const duration = edit?.duration ?? 25.9;
  const total = duration + TAIL7;
  const start = mb?.start ?? V7_MUSIC_START;
  // no track yet → a 120 bpm grid keeps the visual pulses alive
  const all = mb?.beats ?? Array.from({length: Math.ceil(total * 2) + 4}, (_, i) => start + i * 0.5);
  const d0 = all.findIndex((b) => b >= start - 0.05);
  const beats = all.map((b) => b - start).filter((b) => b >= -0.01 && b <= total);
  const downbeats = all.filter((_, i) => i >= d0 && (i - d0) % 4 === 0).map((b) => b - start).filter((b) => b <= total);
  return {durationInFrames: Math.round(total * FPS), props: {...props, duration, words: edit?.words ?? [], segments: edit?.segments ?? [], beats, downbeats, hasMusic: hasMusic && !!mb, musicStart: start}};
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
    defaultProps={{duration: 38, words: [], segments: [], beats: [], downbeats: [], cutStart: 0, cutEnd: 0}}
    calculateMetadata={v2Metadata}
  />
  <Composition
    id="Budget"
    component={Budget}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    durationInFrames={FPS * 25}
    defaultProps={{duration: 24.7, words: [], segments: [], beats: [], downbeats: []}}
    calculateMetadata={v3Metadata}
  />
  <Composition
    id="SurfaceId"
    component={SurfaceId}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    durationInFrames={FPS * 44}
    defaultProps={{duration: 43.8, words: [], segments: [], beats: [], downbeats: []}}
    calculateMetadata={v4Metadata}
  />
  <Composition
    id="I5Gen11"
    component={I5Gen11}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    durationInFrames={FPS * 30}
    defaultProps={{duration: 26, words: [], segments: [], beats: [], downbeats: []}}
    calculateMetadata={v5Metadata}
  />
  <Composition
    id="Gaming"
    component={Gaming}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    durationInFrames={FPS * 25}
    defaultProps={{duration: 23.6, words: [], segments: [], beats: [], downbeats: []}}
    calculateMetadata={v6Metadata}
  />
  <Composition id="GamingCover" component={GamingCover} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={1} />
  <Composition
    id="Qc"
    component={Qc}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    durationInFrames={FPS * 27}
    defaultProps={{duration: 25.9, words: [], segments: [], beats: [], downbeats: [], hasMusic: false, musicStart: V7_MUSIC_START}}
    calculateMetadata={v7Metadata}
  />
  <Composition id="QcCover" component={QcCover} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={1} />
  <Composition id="PriceList" component={PriceList} fps={FPS} width={1080} height={1350} durationInFrames={1} />
  <Composition id="I5Cover" component={I5Cover} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={1} />
  <Composition id="SurfaceCover" component={SurfaceCover} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={1} />
  <Composition id="BudgetCover" component={BudgetCover} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={1} />
  <Composition id="BudgetStory" component={BudgetStory} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={1} />
  <Composition id="V2Cover" component={V2Cover} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={1} defaultProps={{at: 4.4}} />
  <Composition id="Story" component={Story} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={1} defaultProps={{index: 0}} />
  </>
);
