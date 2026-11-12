import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {MemoryStick, Monitor, Zap} from 'lucide-react';
import {COLORS} from '../config';
import {loadFonts} from '../lib/fonts';

loadFonts();

// Cover for reel #6 on the presenter's own photo (grade untouched): headline
// behind the head, the three numbers as pills inside the 4:5 grid band.
const RTX = '#76E35A';
const CYAN = '#22D3EE';
const VIOLET = '#B57BFF';
const GOLD = '#FFC53D';
const LTR: React.CSSProperties = {direction: 'ltr', unicodeBidi: 'isolate'};

export const GamingCover: React.FC = () => (
  <AbsoluteFill style={{fontFamily: "'Vazirmatn', sans-serif", background: COLORS.bgDeep}}>
    <Img src={staticFile('video6/cover/photo1080.jpg')} style={{width: 1080, height: 1920}} />
    <AbsoluteFill style={{background: 'radial-gradient(60% 26% at 50% 24%, rgba(118,227,90,0.24), transparent 70%)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.42) 0%, transparent 24%, transparent 70%, rgba(8,4,17,0.6) 100%)'}} />
    <div dir="rtl" style={{position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontSize: 86, fontWeight: 900, color: '#fff', lineHeight: 1.1, textShadow: `0 0 26px ${COLORS.neon}, 0 6px 18px rgba(0,0,0,0.5)`}}>لپ‌تاپ گیمینگ می‌خری؟</div>
      <div style={{marginTop: 6, fontSize: 108, fontWeight: 900, lineHeight: 1.05, color: '#fff', textShadow: '0 8px 22px rgba(0,0,0,0.45)'}}>
        <span style={{color: RTX, textShadow: `0 0 34px ${RTX}, 0 0 80px rgba(118,227,90,0.5)`}}>۳ تا عدد</span> رو بپرس!
      </div>
    </div>
    <Img src={staticFile('video6/cover/cutout.png')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}} />
    <div dir="rtl" style={{position: 'absolute', top: 1400, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18}}>
      {[
        [<Zap key="z" size={44} color={RTX} />, 'TGP', RTX],
        [<MemoryStick key="m" size={44} color={CYAN} />, 'Dual RAM', CYAN],
        [<Monitor key="h" size={44} color={VIOLET} />, '144Hz', VIOLET],
      ].map(([ic, t, c]) => (
        <div key={t as string} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 26px', borderRadius: 999, background: 'rgba(8,4,17,0.82)', border: `3px solid ${c as string}`, boxShadow: `0 0 26px ${c as string}`, fontSize: 48, fontWeight: 900, color: '#fff', ...LTR}}>
          {ic}
          {t as string}
        </div>
      ))}
    </div>
    <div dir="rtl" style={{position: 'absolute', top: 1530, left: 0, right: 0, textAlign: 'center', fontSize: 40, fontWeight: 900, color: GOLD, textShadow: '0 4px 14px rgba(0,0,0,0.9)'}}>یه گرافیک، دو تا قدرت؟! 🤯</div>
  </AbsoluteFill>
);
