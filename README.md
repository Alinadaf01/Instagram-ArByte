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
| `public/timestamps.json` (`scripts/transcribe.py`) | Word-by-word subtitles and keyword cues (e.g. «رم» lights up the RAM toggle) |
| `public/audio-analysis.json` (`scripts/analyze_audio.py`) | Trims the 1.3s of silence at the head of the voiceover, splits it into 3 parts at its longest pauses, and finds the music's drops |
| `music.mp3` (`useAudioData`) | Neon glows pulse to the real bass |

The music is shifted so its drop (22.06s in the track) lands exactly on the
intro → design cut, and its second drop accents the website reveal.

Everything you'd want to tweak (texts, badge timings, keywords, music levels,
magnifier position on the Torob/Emalls screenshots) lives in `src/config.ts`.
If a subtitle word is misspelt, fix its `"word"` in `public/timestamps.json`.
