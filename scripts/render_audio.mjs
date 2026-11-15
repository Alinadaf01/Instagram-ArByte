// Render only the sound of a composition (wav), e.g. to re-mix music without
// re-rendering the picture: node scripts/render_audio.mjs <CompositionId> <out.wav>
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const [, , id, out] = process.argv;
const root = process.cwd();
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const browserExecutable = process.env.REMOTION_BROWSER;
const composition = await selectComposition({serveUrl, id, browserExecutable});
await renderMedia({composition, serveUrl, codec: 'wav', outputLocation: out, browserExecutable, concurrency: 2, timeoutInMilliseconds: 240000});
console.log('done', out);
