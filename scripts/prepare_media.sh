#!/usr/bin/env bash
# One-shot asset pipeline. Run from the repo root.
#   1. H.264 proxies of the HEVC phone videos (Chrome can't decode HEVC)
#   2. official Surface Pro 7+ turntable/tablet images + keyed logo
#   3. audio analysis (VO lead-in / pauses, music drops)
#   4. Persian word timestamps (needs the Whisper model download)
#   5. voice/music loudness fix + voiceover edit → public/edit.json
set -euo pipefail
P=public
PY=${PYTHON:-python3}
mkdir -p $P/media
ffmpeg -v error -y -i $P/intro.mp4 -map 0:v:0 -map 0:a:0 \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p" \
  -c:v libx264 -preset slow -crf 16 -c:a aac -b:a 256k -movflags +faststart $P/media/intro.mp4
ffmpeg -v error -y -i $P/website.mp4 -an -vf "scale=720:-2,format=yuv420p" -r 60 \
  -c:v libx264 -preset slow -crf 18 -movflags +faststart $P/media/website.mp4
$PY scripts/fetch_surface_images.py
$PY scripts/key_logo.py
$PY scripts/analyze_audio.py
$PY scripts/transcribe.py || echo "!! transcription skipped (model download failed?)"
$PY scripts/fix_transcript.py
$PY scripts/build_audio.py
