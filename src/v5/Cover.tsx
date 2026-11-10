import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Crown} from 'lucide-react';
import {COLORS} from '../config';
import {loadFonts} from '../lib/fonts';

loadFonts();

// Cover for reel #5 on the presenter's own frame (grade untouched): the
// «i5 > i7 ?!» headline behind his head, a cracked i7, two pills inside the
// 4:5 grid band.
const I5 = '#22D3EE';
const I7 = '#E040FB';
const GOLD = '#FFC53D';
const LTR: React.CSSProperties = {direction: 'ltr', unicodeBidi: 'isolate'};

export const I5Cover: React.FC = () => (
  <AbsoluteFill style={{fontFamily: "'Vazirmatn', sans-serif", background: COLORS.bgDeep}}>
    <Img src={staticFile('video5/cover/photo1080.jpg')} style={{width: 1080, height: 1920}} />
    <AbsoluteFill style={{background: 'radial-gradient(45% 22% at 28% 22%, rgba(34,211,238,0.28), transparent 70%), radial-gradient(45% 22% at 74% 22%, rgba(224,64,251,0.24), transparent 70%)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.42) 0%, transparent 24%, transparent 70%, rgba(8,4,17,0.6) 100%)'}} />
    <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, ...LTR}}>
      <div style={{position: 'relative'}}>
        <div style={{position: 'absolute', top: -96, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <Crown size={110} color={GOLD} fill={GOLD} style={{filter: `drop-shadow(0 0 22px ${GOLD})`, transform: 'rotate(-10deg)'}} />
        </div>
        <span style={{fontSize: 230, fontWeight: 900, lineHeight: 1, color: I5, textShadow: `0 0 40px ${I5}, 0 0 90px rgba(34,211,238,0.5), 0 10px 26px rgba(0,0,0,0.4)`}}>i5</span>
      </div>
      <span style={{fontSize: 190, fontWeight: 900, lineHeight: 1, color: GOLD, textShadow: `0 0 40px ${GOLD}`}}>&gt;</span>
      <div style={{position: 'relative'}}>
        <span style={{fontSize: 230, fontWeight: 900, lineHeight: 1, color: I7, textShadow: `0 0 40px ${I7}, 0 0 90px rgba(224,64,251,0.5), 0 10px 26px rgba(0,0,0,0.4)`}}>i7</span>
        <svg width={230} height={230} viewBox="0 0 100 100" style={{position: 'absolute', left: 0, top: 0}}>
          <g stroke="#fff" strokeWidth="2" fill="none" style={{filter: 'drop-shadow(0 0 3px #fff)'}}>
            <path d="M44 6 L50 30 L38 46 L56 60 L46 92" />
            <path d="M50 30 L74 36" />
            <path d="M38 46 L18 52" />
          </g>
        </svg>
      </div>
      <span style={{fontSize: 150, fontWeight: 900, color: '#fff', textShadow: `0 0 26px ${COLORS.neon}`}}>?!</span>
    </div>
    <Img src={staticFile('video5/cover/cutout.png')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}} />
    <div dir="rtl" style={{position: 'absolute', top: 1150, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{padding: '16px 42px', borderRadius: 999, background: 'linear-gradient(135deg, rgba(157,78,221,0.92), rgba(90,24,154,0.94))', border: '3px solid rgba(255,255,255,0.55)', boxShadow: `0 0 50px ${COLORS.neon}, inset 0 2px 0 rgba(255,255,255,0.45)`, fontSize: 62, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap'}}>
        گاهی <span style={{...LTR, color: I5}}>i5</span> قوی‌تره! 🤯
      </div>
    </div>
    <div dir="rtl" style={{position: 'absolute', top: 1480, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{padding: '10px 34px', borderRadius: 999, background: 'rgba(8,4,17,0.8)', border: `3px solid ${GOLD}`, boxShadow: `0 0 26px ${GOLD}`, fontSize: 48, fontWeight: 900, color: '#fff'}}>
        قبل از خرید لپ‌تاپ ببین 👇
      </div>
    </div>
  </AbsoluteFill>
);
