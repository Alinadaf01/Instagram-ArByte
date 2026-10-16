import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {COLORS, FPS, KEYWORDS} from '../config';
import {pop} from '../lib/anim';
import {normalize, Word} from '../lib/timeline';

type Chunk = {words: Word[]; start: number; end: number};

const MAX_WORDS = 4;
const MAX_CHARS = 24;
const GAP_BREAK = 0.45;

const chunkWords = (words: Word[]): Chunk[] => {
  const chunks: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) chunks.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
    cur = [];
  };
  for (const w of words) {
    const prev = cur[cur.length - 1];
    const chars = cur.reduce((n, x) => n + x.word.trim().length + 1, 0) + w.word.trim().length;
    if (prev && (w.start - prev.end > GAP_BREAK || cur.length >= MAX_WORDS || chars > MAX_CHARS)) flush();
    cur.push(w);
    if (/[.!?؟]$/.test(w.word.trim())) flush();
  }
  flush();
  // hold each chunk until the next one starts (max +0.6s)
  for (let i = 0; i < chunks.length; i++) {
    const next = chunks[i + 1];
    chunks[i].end = next ? Math.min(next.start, chunks[i].end + 0.6) : chunks[i].end + 0.6;
  }
  return chunks;
};

const KW = new Set(KEYWORDS.map(normalize));
const isKeyword = (w: string) => {
  const n = normalize(w);
  return KW.has(n) || [...KW].some((k) => k.length >= 4 && n.startsWith(k));
};

// Word-by-word Persian captions in the lower third: the spoken word lights
// up white, keywords get a neon purple pill.
export const Subtitles: React.FC<{words: Word[]; hideFrom?: number; bottom?: number}> = ({
  words,
  hideFrom,
  bottom = 470,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunks = useMemo(() => chunkWords(words), [words]);
  if (hideFrom !== undefined && t >= hideFrom) return null;
  const chunk = chunks.find((c) => t >= c.start - 0.05 && t < c.end);
  if (!chunk) return null;
  const enter = pop(frame, Math.round((chunk.start - 0.05) * FPS));
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        bottom,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '6px 16px',
        transform: `translateY(${(1 - enter) * 40}px) scale(${0.9 + enter * 0.1})`,
        opacity: Math.min(1, enter * 1.4),
      }}
    >
      {chunk.words.map((w, i) => {
        const spoken = t >= w.start;
        const current = spoken && t < w.end + 0.08;
        const kw = isKeyword(w.word);
        const wp = pop(frame, Math.round(w.start * FPS));
        return (
          <span
            key={i}
            style={{
              position: 'relative',
              fontSize: 66,
              fontWeight: 900,
              lineHeight: 1.35,
              padding: kw ? '0 18px' : '0 2px',
              borderRadius: 18,
              color: spoken ? COLORS.white : 'rgba(255,255,255,0.5)',
              background: kw && spoken ? `linear-gradient(135deg, ${COLORS.neon}, #6A1FB0)` : 'transparent',
              boxShadow: kw && spoken ? `0 0 ${20 + wp * 20}px rgba(157,78,221,0.85), inset 0 1px 0 rgba(255,255,255,0.4)` : undefined,
              transform: `scale(${current ? 1 + 0.08 * wp : 1})`,
              display: 'inline-block',
              WebkitTextStroke: '1.5px rgba(10,4,20,0.55)',
              paintOrder: 'stroke fill',
              textShadow: current
                ? '0 0 22px rgba(224,170,255,0.95), 0 4px 16px rgba(0,0,0,0.75)'
                : '0 4px 16px rgba(0,0,0,0.75)',
            }}
          >
            {w.word.trim()}
          </span>
        );
      })}
    </div>
  );
};
