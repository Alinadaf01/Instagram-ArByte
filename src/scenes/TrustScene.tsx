import React from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {BadgeCheck, Globe, Heart, Lock, Search, Send, User} from 'lucide-react';
import {ASSETS, COLORS, CTA, EMALLS_FOCUS, TOROB_FOCUS, TRUST_BADGE} from '../config';
import {bob, clamp, pop} from '../lib/anim';
import {sec} from '../lib/timeline';
import {Background} from '../components/Background';
import {Glass, NeonText} from '../components/Glass';
import {useBass} from '../lib/audio';

type Cues = {torob: number; emalls: number; years: number; website: number};
type Focus = {x: number; y: number; w: number; h: number; zoom: number};

const PHONE_W = 400;
const PHONE_H = 800;
const BEZEL = 14;

const Phone: React.FC<{src: string; focus: Focus; highlight: number; label: string}> = ({src, focus, highlight, label}) => {
  const innerW = PHONE_W - BEZEL * 2;
  return (
    <div
      style={{
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 62,
        padding: BEZEL,
        background: 'linear-gradient(145deg, #2a2338, #0d0915)',
        boxShadow: `0 0 0 2px rgba(224,170,255,0.35), 0 0 ${40 + highlight * 50}px rgba(157,78,221,${0.4 + highlight * 0.4}), 0 40px 90px rgba(0,0,0,0.7)`,
        position: 'relative',
      }}
    >
      <div style={{width: '100%', height: '100%', borderRadius: 50, overflow: 'hidden', position: 'relative', background: '#fff'}}>
        <div style={{position: 'relative', width: innerW}}>
          <Img src={staticFile(src)} style={{width: innerW, display: 'block'}} />
          {/* highlight box around the "۴ سال و ۳ ماه" text */}
          <div
            style={{
              position: 'absolute',
              left: `${focus.x * 100}%`,
              top: `${focus.y * 100}%`,
              width: `${focus.w * 100}%`,
              height: innerW * focus.h * 1.0 + 18,
              transform: `translate(-50%,-50%) scale(${1.6 - highlight * 0.6})`,
              opacity: highlight,
              borderRadius: 16,
              border: `4px solid rgba(157,78,221,${highlight})`,
              boxShadow: `0 0 ${30 * highlight}px rgba(157,78,221,${highlight}), inset 0 0 20px rgba(157,78,221,${highlight * 0.4})`,
            }}
          />
        </div>
        {/* glass reflection */}
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(125deg, rgba(255,255,255,0.22) 0%, transparent 38%)'}} />
        {/* dynamic island */}
        <div style={{position: 'absolute', top: 14, left: '50%', width: 110, height: 32, marginLeft: -55, borderRadius: 99, background: '#000'}} />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: -66,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 32,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 0 16px rgba(199,125,255,0.9)',
        }}
      >
        {label}
      </div>
    </div>
  );
};

const Lens: React.FC<{src: string; focus: Focus; p: number}> = ({src, focus, p}) => {
  const R = 190;
  const W = (PHONE_W - BEZEL * 2) * focus.zoom;
  return (
    <div
      style={{
        position: 'absolute',
        left: 540 - R,
        top: 560,
        width: R * 2,
        height: R * 2,
        transform: `scale(${p}) rotate(${(1 - p) * -30}deg)`,
        opacity: Math.min(1, p * 1.4),
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          background: '#fff',
          border: '8px solid rgba(255,255,255,0.9)',
          boxShadow: '0 0 0 4px #9D4EDD, 0 0 60px rgba(157,78,221,0.95), 0 30px 60px rgba(0,0,0,0.6)',
        }}
      >
        <Img
          src={staticFile(src)}
          style={{position: 'absolute', left: R, top: R, width: W, transform: `translate(-${focus.x * 100}%, -${focus.y * 100}%)`}}
        />
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), transparent 45%)'}} />
      </div>
      <div style={{position: 'absolute', right: -40, bottom: -40, transform: 'rotate(-45deg)'}}>
        <Search size={96} color="#fff" strokeWidth={2.4} style={{filter: 'drop-shadow(0 0 16px #9D4EDD)'}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: -84, display: 'flex', justifyContent: 'center'}}>
        <div
          dir="rtl"
          style={{
            padding: '8px 26px',
            borderRadius: 99,
            background: `linear-gradient(135deg, ${COLORS.neon}, #6A1FB0)`,
            fontSize: 40,
            fontWeight: 900,
            color: '#fff',
            boxShadow: '0 0 30px rgba(157,78,221,0.9)',
            whiteSpace: 'nowrap',
          }}
        >
          ۴ سال و ۳ ماه
        </div>
      </div>
    </div>
  );
};

const TrustPart: React.FC<{cues: Cues; L: (s: number) => number}> = ({cues, L}) => {
  const frame = useCurrentFrame();
  const torob = L(cues.torob);
  const emalls = L(cues.emalls);
  const years = L(cues.years);
  const pT = pop(frame, torob);
  const pE = pop(frame, emalls);
  const pL = pop(frame, years);
  const pB = pop(frame, years + 36);
  const hl = interpolate(frame - years, [0, 20], [0, 1], clamp);
  return (
    <AbsoluteFill style={{perspective: 1600}}>
      <div dir="rtl" style={{position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center', opacity: pop(frame, 4)}}>
        <NeonText size={50} weight={900}>
          خرید مطمئن از آربایت
        </NeonText>
      </div>
      {/* Torob (right) */}
      <div
        style={{
          position: 'absolute',
          right: 40,
          top: 390 + bob(frame, 8, 0.04),
          transform: `translateX(${(1 - pT) * 600}px) rotateY(-22deg) rotateZ(2deg) scale(${0.92})`,
          opacity: pT,
        }}
      >
        <Phone src={ASSETS.torob} focus={TOROB_FOCUS} highlight={hl} label="ترب" />
      </div>
      {/* Emalls (left) */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 410 + bob(frame, 8, 0.04, 2),
          transform: `translateX(${(1 - pE) * -600}px) rotateY(22deg) rotateZ(-2deg) scale(${0.92})`,
          opacity: pE,
        }}
      >
        <Phone src={ASSETS.emalls} focus={EMALLS_FOCUS} highlight={hl} label="ایمالز" />
      </div>
      {frame >= years ? <Lens src={ASSETS.torob} focus={TOROB_FOCUS} p={pL} /> : null}
      {frame >= years + 36 ? (
        <div
          style={{
            position: 'absolute',
            left: 40,
            right: 40,
            top: 1250,
            display: 'flex',
            justifyContent: 'center',
            transform: `translateY(${(1 - pB) * 120}px) scale(${0.7 + pB * 0.3})`,
            opacity: Math.min(1, pB * 1.5),
            zIndex: 11,
          }}
        >
          <Glass radius={999} style={{padding: '16px 30px'}} glow={0.5} tint="rgba(46,229,157,0.18)">
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <BadgeCheck size={50} color={COLORS.green} strokeWidth={2.4} style={{filter: 'drop-shadow(0 0 10px rgba(46,229,157,0.9))'}} />
              <span style={{fontSize: 34, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap'}}>{TRUST_BADGE}</span>
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

export const TrustScene: React.FC<{
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
          <TrustPart cues={cues} L={L} />
        </AbsoluteFill>
      ) : null}
      {frame >= web - 6 ? <WebsitePart aspect={websiteAspect} hasLogo={hasLogo} at={web} dim={dim} accent={accent === null ? null : L(accent)} /> : null}
      {frame >= cta ? <CommentCTA at={cta} hasLogo={hasLogo} /> : null}
    </AbsoluteFill>
  );
};
