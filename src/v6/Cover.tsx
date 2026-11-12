import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {MemoryStick, Monitor, Zap} from 'lucide-react';
import {COLORS} from '../config';
import {loadFonts} from '../lib/fonts';

loadFonts();

// Cover for reel #6 on the presenter's own photo (grade untouched). Gold +
// brand violet only (the green read poorly on the light wall); a dark violet
// haze behind the headline keeps it readable, the head overlaps its bottom.
const GOLD = '#FFC53D';
const CYAN = '#22D3EE';
const VIOLET = '#C77DFF';
const LTR: React.CSSProperties = {direction: 'ltr', unicodeBidi: 'isolate'};

export const GamingCover: React.FC = () => (
  <AbsoluteFill style={{fontFamily: "'Vazirmatn', sans-serif", background: COLORS.bgDeep}}>
    <Img src={staticFile('video6/cover/photo1080.jpg')} style={{width: 1080, height: 1920}} />
    {/* haze behind the headline (on the wall, under the cut-out) */}
    <AbsoluteFill style={{background: 'radial-gradient(70% 22% at 50% 22%, rgba(21,9,43,0.78), rgba(21,9,43,0.35) 60%, transparent 85%)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.55) 0%, transparent 26%, transparent 68%, rgba(8,4,17,0.7) 100%)'}} />
    <div dir="rtl" style={{position: 'absolute', top: 285, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{display: 'inline-block', padding: '6px 30px', borderRadius: 999, background: 'linear-gradient(135deg, #FF4D6D, #c9184a)', boxShadow: '0 0 30px rgba(255,77,109,0.8)', fontSize: 50, fontWeight: 900, color: '#fff'}}>
        🎮 لپ‌تاپ گیمینگ می‌خری؟
      </div>
      <div style={{marginTop: 14, fontSize: 112, fontWeight: 900, lineHeight: 1.05, color: '#fff', textShadow: `0 0 24px ${COLORS.neon}, 0 8px 22px rgba(0,0,0,0.6)`}}>
        <span style={{color: GOLD, textShadow: `0 0 36px ${GOLD}, 0 0 80px rgba(255,197,61,0.45), 0 10px 26px rgba(0,0,0,0.6)`}}>۳ تا عدد</span> رو بپرس!
      </div>
    </div>
    <Img src={staticFile('video6/cover/cutout.png')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}} />
    <div style={{position: 'absolute', top: 1395, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18}}>
      {[
        [<Zap key="z" size={46} color={GOLD} />, 'TGP', GOLD],
        [<MemoryStick key="m" size={46} color={CYAN} />, 'Dual RAM', CYAN],
        [<Monitor key="h" size={46} color={VIOLET} />, '144Hz', VIOLET],
      ].map(([ic, t, c]) => (
        <div key={t as string} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 28px', borderRadius: 999, background: 'rgba(8,4,17,0.88)', border: `3px solid ${c as string}`, boxShadow: `0 0 28px ${c as string}`, fontSize: 50, fontWeight: 900, color: '#fff', ...LTR}}>
          {ic}
          {t as string}
        </div>
      ))}
    </div>
    <div dir="rtl" style={{position: 'absolute', top: 1525, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{padding: '8px 30px', borderRadius: 999, background: 'rgba(8,4,17,0.85)', border: `2px solid ${GOLD}`, fontSize: 42, fontWeight: 900, color: '#fff'}}>
        یه گرافیک، <span style={{color: GOLD}}>دو تا قدرت؟!</span> 🤯
      </div>
    </div>
  </AbsoluteFill>
);
