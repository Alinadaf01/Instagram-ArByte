import React from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Globe, Headset, Heart, Lock, Send, ShoppingBag, User} from 'lucide-react';
import {ASSETS, COLORS, CTA} from '../config';
import {bob, clamp, pop} from '../lib/anim';
import {sec} from '../lib/timeline';
import {Background} from '../components/Background';
import {Glass, NeonText} from '../components/Glass';
import {useBass} from '../lib/audio';

type Cues = {consult: number; buy: number; website: number; cta: number};

const Bubble: React.FC<{at: number; side: 'user' | 'expert'; children: React.ReactNode}> = ({at, side, children}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = pop(frame, at);
  const expert = side === 'expert';
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        justifyContent: expert ? 'flex-end' : 'flex-start',
        transform: `translateY(${(1 - p) * 40}px) scale(${0.7 + p * 0.3})`,
        transformOrigin: expert ? 'left bottom' : 'right bottom',
        opacity: Math.min(1, p * 1.5),
      }}
    >
      <div
        style={{
          maxWidth: 720,
          padding: '22px 30px',
          borderRadius: 34,
          borderBottomRightRadius: expert ? 34 : 10,
          borderBottomLeftRadius: expert ? 10 : 34,
          fontSize: 38,
          fontWeight: 800,
          lineHeight: 1.5,
          color: '#fff',
          background: expert ? `linear-gradient(135deg, ${COLORS.neon}, #5A189A)` : 'rgba(255,255,255,0.13)',
          border: `1.5px solid rgba(255,255,255,${expert ? 0.3 : 0.18})`,
          boxShadow: expert ? '0 0 34px rgba(157,78,221,0.7)' : '0 10px 30px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(18px)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Typing: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  return (
    <div style={{display: 'flex', justifyContent: 'flex-end'}}>
      <div style={{display: 'flex', gap: 10, padding: '22px 30px', borderRadius: 34, background: 'rgba(157,78,221,0.45)'}}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: 99,
              background: '#fff',
              opacity: 0.4 + 0.6 * Math.max(0, Math.sin((frame - from) * 0.25 - i * 0.9)),
            }}
          />
        ))}
      </div>
    </div>
  );
};

// «کارشناسای آربایت رایگان راهنمایی‌تون می‌کنن تا دقیقاً مدل مناسب کارتون رو بخرید»
const ConsultPart: React.FC<{cues: Cues; L: (s: number) => number}> = ({cues, L}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const c = Math.max(4, L(cues.consult));
  const buy = L(cues.buy);
  const head = pop(frame, c);
  const card = pop(frame, c + 6);
  const ring = Math.sin(frame * 0.9) * interpolate((frame - c) % 80, [0, 26, 27], [10, 0, 0], clamp);
  const pBuy = pop(frame, buy);
  return (
    <AbsoluteFill>
      {/* headline */}
      <div dir="rtl" style={{position: 'absolute', top: 300, left: 40, right: 40, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + head * 0.4})`, opacity: Math.min(1, head * 1.5)}}>
        <Glass radius={999} style={{padding: '18px 34px'}} glow={0.7} tint="rgba(157,78,221,0.35)">
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 20}}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 99,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: COLORS.green,
                boxShadow: `0 0 ${26 + bass * 30}px rgba(46,229,157,0.85)`,
                transform: `rotate(${ring}deg)`,
              }}
            >
              <Headset size={52} color="#06281a" strokeWidth={2.4} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <span style={{fontSize: 48, fontWeight: 900, color: '#fff', textShadow: '0 0 18px rgba(199,125,255,0.8)'}}>مشاوره رایگان</span>
              <span style={{fontSize: 30, fontWeight: 700, color: COLORS.silver}}>با کارشناسان آربایت</span>
            </div>
          </div>
        </Glass>
      </div>

      {/* chat */}
      <div style={{position: 'absolute', top: 520, left: 50, right: 50, transform: `translateY(${(1 - card) * 120}px)`, opacity: card}}>
        <Glass radius={48} style={{padding: '34px 30px'}} glow={0.4}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 22, minHeight: 400}}>
            <Bubble at={c + 14} side="user">
              برای کار من کدوم کانفیگ بهتره؟ 🤔
            </Bubble>
            <Typing from={c + 34} to={c + 70} />
            <Bubble at={c + 70} side="expert">
              بر اساس کارتون، دقیقاً مدل مناسب رو پیشنهاد می‌دیم ✅
            </Bubble>
            <Bubble at={c + 110} side="expert">
              i5 یا i7 · رم ۸ یا ۱۶ · SSD تا ۵۱۲
            </Bubble>
          </div>
        </Glass>
      </div>

      {/* «بخرید» */}
      {frame >= buy ? (
        <div style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.5 + pBuy * 0.5})`, opacity: Math.min(1, pBuy * 1.5)}}>
          <Glass radius={999} style={{padding: '16px 36px'}} glow={0.8} tint="rgba(46,229,157,0.2)">
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <ShoppingBag size={44} color={COLORS.green} strokeWidth={2.4} />
              <span style={{fontSize: 42, fontWeight: 900, color: '#fff'}}>خرید مطمئن از آربایت</span>
            </div>
          </Glass>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const WebsitePart: React.FC<{aspect: number; hasLogo: boolean; at: number; dim: number; accent: number | null}> = ({
  aspect,
  hasLogo,
  at,
  dim,
  accent,
}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const p = pop(frame, at);
  const h = 740;
  const w = Math.round(h * aspect);
  const flash = accent !== null ? interpolate(frame - accent, [0, 4, 24], [0, 1, 0], clamp) : 0;
  const pUrl = pop(frame, at + 14);
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${0.7 + p * 0.3 - dim * 0.06})`,
        opacity: Math.min(1, p * 1.4),
        filter: dim > 0 ? `blur(${dim * 10}px) brightness(${1 - dim * 0.45})` : undefined,
      }}
    >
      {hasLogo ? (
        <Img
          src={staticFile(ASSETS.logoClean)}
          style={{
            position: 'absolute',
            top: 262,
            left: 540 - 95,
            width: 190,
            height: 190,
            objectFit: 'contain',
            filter: `drop-shadow(0 0 ${20 + bass * 26}px rgba(157,78,221,0.9))`,
            transform: `translateY(${bob(frame, 6, 0.05)}px) scale(${1 + bass * 0.06 + flash * 0.12})`,
          }}
        />
      ) : null}
      {/* glowing glass frame around the phone screen recording */}
      <div
        style={{
          position: 'absolute',
          top: 450,
          left: 540 - w / 2 - 22,
          transform: `perspective(1600px) rotateY(${Math.sin(frame * 0.02) * 4}deg)`,
        }}
      >
        <Glass radius={74} style={{padding: 22}} glow={0.5 + bass * 0.3 + flash * 0.5}>
          <div style={{width: w, height: h, borderRadius: 54, overflow: 'hidden', background: '#000', position: 'relative'}}>
            <Sequence from={at} layout="none">
              <OffthreadVideo src={staticFile(ASSETS.website)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </Sequence>
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(125deg, rgba(255,255,255,0.14) 0%, transparent 30%)'}} />
          </div>
        </Glass>
      </div>
      {/* url pill */}
      <div
        style={{
          position: 'absolute',
          top: 1252,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          transform: `translateY(${(1 - pUrl) * 60}px) scale(${0.7 + pUrl * 0.3})`,
          opacity: pUrl,
        }}
      >
        <Glass radius={999} style={{padding: '12px 34px'}} glow={0.6 + flash * 0.4}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, direction: 'ltr'}}>
            <Lock size={30} color={COLORS.green} strokeWidth={2.6} />
            <span style={{fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: 1}}>arbyte.ir</span>
            <Globe size={34} color={COLORS.neonHot} />
          </div>
        </Glass>
      </div>
      {flash > 0 ? (
        <AbsoluteFill style={{background: 'radial-gradient(circle, rgba(224,170,255,0.55), transparent 70%)', opacity: flash, mixBlendMode: 'screen'}} />
      ) : null}
    </AbsoluteFill>
  );
};

const CommentCTA: React.FC<{at: number; hasLogo: boolean}> = ({at, hasLogo}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const f = frame - at;
  const pTitle = pop(frame, at);
  const pBox = pop(frame, at + 8);
  const word = CTA.word;
  const typed = Math.max(0, Math.min(word.length, Math.floor((f - 22) / 5)));
  const tapAt = 22 + word.length * 5 + 12;
  const tapped = f >= tapAt;
  const sendPulse = interpolate(f - tapAt, [0, 5, 18], [1, 0.8, 1.15], clamp);
  const fly = pop(frame, at + tapAt + 4);
  const heart = pop(frame, at + tapAt + 26);
  return (
    <AbsoluteFill>
      <div dir="rtl" style={{position: 'absolute', top: 440, left: 50, right: 50, textAlign: 'center', transform: `scale(${0.6 + pTitle * 0.4})`, opacity: Math.min(1, pTitle * 1.5)}}>
        <NeonText size={76} weight={900} glow={0.9 + bass * 0.3}>
          {CTA.title}
        </NeonText>
        <div style={{fontSize: 36, fontWeight: 700, color: COLORS.silver, marginTop: 14, textShadow: '0 2px 10px rgba(0,0,0,0.7)'}}>{CTA.sub}</div>
      </div>

      {/* posted comment bubble */}
      {tapped ? (
        <div style={{position: 'absolute', left: 60, right: 60, top: 980 - fly * 170, opacity: Math.min(1, fly * 1.5), transform: `scale(${0.8 + fly * 0.2})`}}>
          <Glass radius={36} style={{padding: '22px 28px'}} glow={0.4}>
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 18}}>
              <div style={{width: 70, height: 70, borderRadius: 99, background: `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff'}}><User size={40} color="#fff" /></div>
              <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                <span style={{fontSize: 26, fontWeight: 800, color: COLORS.muted}}>شما</span>
                <span style={{fontSize: 44, fontWeight: 900, color: '#fff'}}>{word}</span>
              </div>
              <Heart size={44} color="#ff3b6b" fill={heart > 0.5 ? '#ff3b6b' : 'transparent'} style={{transform: `scale(${0.6 + heart * 0.6})`}} />
            </div>
          </Glass>
        </div>
      ) : null}

      {/* comment input */}
      <div style={{position: 'absolute', left: 50, right: 50, top: 1060, transform: `translateY(${(1 - pBox) * 300}px)`, opacity: pBox}}>
        <Glass radius={999} style={{padding: '18px 22px'}} glow={0.5 + bass * 0.4}>
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 18}}>
            {hasLogo ? (
              <Img src={staticFile(ASSETS.logo)} style={{width: 76, height: 76, borderRadius: 99, objectFit: 'cover'}} />
            ) : (
              <div style={{width: 76, height: 76, borderRadius: 99, background: COLORS.neon}} />
            )}
            <div style={{flex: 1, fontSize: 44, fontWeight: 800, color: typed && !tapped ? '#fff' : 'rgba(255,255,255,0.5)'}}>
              {tapped ? 'یک کامنت بنویسید…' : typed ? word.slice(0, typed) : 'یک کامنت بنویسید…'}
              {!tapped && typed > 0 && Math.floor(f / 15) % 2 === 0 ? <span style={{color: COLORS.neonHot}}>|</span> : null}
            </div>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 99,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: typed === word.length ? `linear-gradient(135deg, ${COLORS.neonHot}, ${COLORS.neon})` : 'rgba(255,255,255,0.12)',
                boxShadow: typed === word.length ? `0 0 ${30 + (tapped ? 30 : 0)}px rgba(157,78,221,1)` : 'none',
                transform: `scale(${sendPulse})`,
                position: 'relative',
              }}
            >
              <Send size={46} color="#fff" style={{transform: 'scaleX(-1)'}} />
              {tapped && f - tapAt < 30 ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: -((f - tapAt) * 3),
                    borderRadius: '50%',
                    border: `4px solid rgba(224,170,255,${1 - (f - tapAt) / 30})`,
                  }}
                />
              ) : null}
            </div>
          </div>
        </Glass>
      </div>
    </AbsoluteFill>
  );
};

// Neon bloom on the music's second drop
const AccentFlash: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const f = interpolate(frame - at, [0, 4, 30], [0, 1, 0], clamp);
  if (f <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 45%, rgba(224,170,255,0.5), rgba(157,78,221,0.25) 40%, transparent 75%)',
        opacity: f,
        mixBlendMode: 'screen',
      }}
    />
  );
};

export const BuyScene: React.FC<{
  start: number;
  cues: Cues;
  ctaStart: number;
  websiteAspect: number;
  hasLogo: boolean;
  accent: number | null;
}> = ({start, cues, ctaStart, websiteAspect, hasLogo, accent}) => {
  const frame = useCurrentFrame();
  const L = (s: number) => sec(s) - start;
  const web = L(cues.website);
  const cta = L(ctaStart);
  const out = interpolate(frame, [web - 6, web + 18], [0, 1], clamp);
  const dim = interpolate(frame, [cta - 4, cta + 16], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Background />
      {out < 1 ? (
        <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 + out * 0.25})`, filter: out > 0 ? `blur(${out * 16}px)` : undefined}}>
          <ConsultPart cues={cues} L={L} />
        </AbsoluteFill>
      ) : null}
      {frame >= web - 6 ? <WebsitePart aspect={websiteAspect} hasLogo={hasLogo} at={web} dim={dim} accent={accent === null ? null : L(accent)} /> : null}
      {frame >= cta ? <CommentCTA at={cta} hasLogo={hasLogo} /> : null}
      {accent !== null && frame < web - 6 ? <AccentFlash at={L(accent)} /> : null}
    </AbsoluteFill>
  );
};
