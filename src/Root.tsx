import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {parseMedia} from '@remotion/media-parser';
import {ASSETS, FPS, HEIGHT, WIDTH} from './config';
import {AudioAnalysis, buildTimeline, Timestamps} from './lib/timeline';
import {ArbyteReel, VideoProps} from './Video';

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
  const [ts, voDur, analysis, hasMusic, cleanProducts, hasLogo, web] = await Promise.all([
    fetchJson<Timestamps>(ASSETS.timestamps),
    parseMedia({src: staticFile(ASSETS.voiceover), fields: {durationInSeconds: true}, acknowledgeRemotionLicense: true})
      .then((m) => m.durationInSeconds ?? 0)
      .catch(() => 0),
    fetchJson<AudioAnalysis>(ASSETS.audioAnalysis),
    exists(ASSETS.music),
    exists(ASSETS.surfaceFront.replace('.png', '-clean.png')),
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
      cleanProducts,
      hasLogo,
      websiteAspect: web ? web.width / web.height : 16 / 10,
    },
  };
};

export const RemotionRoot: React.FC = () => (
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
      cleanProducts: false,
      hasLogo: true,
      websiteAspect: 16 / 10,
    }}
    calculateMetadata={calculateMetadata}
  />
);
