import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {Cpu} from 'lucide-react';
import {COLORS} from '../config';
import {loadFonts} from '../lib/fonts';

loadFonts();

// Reel cover (1080×1920). Everything that matters sits inside the centre
// 1080×1350 (4:5) band, which is what the profile grid shows.
const I5 = '#22D3EE';
const I7 = '#E040FB';

const Card: React.FC<{k: 'i5' | 'i7'}> = ({k}) => {
  const c = k === 'i5' ? I5 : I7;
  return (
    <div
      style={{
        width: 250,
        height: 250,
        borderRadius: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(150deg, ${c}44, rgba(20,8,40,0.8) 60%)`,
        border: `3px solid ${c}`,
        boxShadow: `0 0 50px ${c}, inset 0 1px 0 rgba(255,255,255,0.4)`,
      }}
    >
      <Cpu size={54} color={c} style={{filter: `drop-shadow(0 0 12px ${c})`}} />
      <div style={{fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: 4}}>INTEL CORE</div>
      <div style={{fontSize: 120, fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: `0 0 30px ${c}`}}>{k}</div>
    </div>
  );
};

export const V2Cover: React.FC<{at: number}> = ({at}) => (
  <AbsoluteFill style={{background: COLORS.bgDeep, fontFamily: "'Vazirmatn', sans-serif"}}>
    <AbsoluteFill style={{transform: 'scale(1.08)', transformOrigin: '50% 35%'}}>
      <OffthreadVideo src={staticFile('video2/edit.mp4')} trimBefore={Math.round(at * 30)} muted style={{width: 1080, height: 1920}} />
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,4,17,0.85) 0%, rgba(8,4,17,0.25) 30%, transparent 45%, transparent 62%, rgba(8,4,17,0.9) 85%)'}} />
    <div dir="rtl" style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontSize: 190, fontWeight: 900, lineHeight: 1, color: '#fff', WebkitTextStroke: '4px rgba(10,4,20,0.5)', paintOrder: 'stroke fill', textShadow: `0 0 40px ${COLORS.neon}, 0 10px 30px rgba(0,0,0,0.8)`}}>
        <span style={{color: I5, textShadow: `0 0 40px ${I5}`}}>i5</span> یا <span style={{color: I7, textShadow: `0 0 40px ${I7}`}}>i7</span>؟
      </div>
    </div>
    <div style={{position: 'absolute', top: 1050, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', direction: 'rtl'}}>
      <div style={{transform: 'rotate(6deg)'}}>
        <Card k="i5" />
      </div>
      <div style={{transform: 'rotate(-6deg)'}}>
        <Card k="i7" />
      </div>
    </div>
    <div dir="rtl" style={{position: 'absolute', top: 1360, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{padding: '16px 44px', borderRadius: 999, background: 'linear-gradient(135deg, #FF4D6D, #c9184a)', boxShadow: '0 0 40px rgba(255,77,109,0.8)', fontSize: 62, fontWeight: 900, color: '#fff'}}>
        اشتباه نخر! ❌
      </div>
    </div>
  </AbsoluteFill>
);
