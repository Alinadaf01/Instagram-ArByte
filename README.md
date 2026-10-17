# ArByte Reels — Surface Pro 7+

Remotion (React) project that renders the 9:16 Instagram reel for
[arbyte.ir](https://arbyte.ir): 1080×1920, 60fps, H.264.

## Run

```bash
npm install
pip install -r requirements.txt     # Python 3.10+
./scripts/prepare_media.sh          # proxies, cut-outs, audio analysis, Whisper
npm run studio                      # live preview in the browser
npm run render                      # → out/arbyte-surface-final.mp4
```

## How it syncs

| Source | Used for |
| --- | --- |
| `public/edit.json` (`transcribe.py` → `fix_transcript.py` → `build_audio.py`) | Word-by-word subtitles and every cue: spec badges, config clicks («Core i7», «۸ یا ۱۶», «۱۲۸ تا ۵۱۲»), the 2K burst, the CTA |
| `public/audio-analysis.json` (`analyze_audio.py`) | Voiceover pauses, the music's drops and its 129 BPM beat grid (hook punches, jump-zooms, beat-snapped entrances) |
| `public/media/*` (`build_audio.py`) | Voices cleaned and normalised, music normalised so it sits ~14 dB under speech; the ArByte-history sentence is cut from the voiceover |
| `public/surface/*` (`fetch_surface_images.py`) | Official Surface Pro 7+ 360° turntable (36 frames) and tablet-mode shot from microsoft.com |

The music is shifted so its drop lands exactly on the intro → design cut.

Everything you'd want to tweak (texts, badge timings, keywords, music levels)
lives in `src/config.ts`. Subtitle spelling fixes go in `scripts/fix_transcript.py`.
