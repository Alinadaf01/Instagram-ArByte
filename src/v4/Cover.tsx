import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ScanSearch} from 'lucide-react';
import {COLORS} from '../config';
import {loadFonts} from '../lib/fonts';

loadFonts();

// Cover for reel #4 on the presenter's own photo (grade untouched). The
// headline sits behind his head (cutout.png on top); a scan frame locks onto
// the Surface on the desk. Key content stays inside the 4:5 grid band.
const P7P = '#22D3EE';
const P5 = '#FF4FA3';
const GOLD = '#FFC53D';
const LTR: React.CSSProperties = {direction: 'ltr', unicodeBidi: 'isolate'};

const Corner: React.FC<{s: React.CSSProperties}> = ({s}) => (
  <div style={{position: 'absolute', width: 80, height: 80, borderColor: P7P, borderStyle: 'solid', borderWidth: 0, filter: `drop-shadow(0 0 10px ${P7P})`, ...s}} />
);

export const SurfaceCover: React.FC = () => (
  <AbsoluteFill style={{fontFamily: "'Vazirmatn', sans-serif", background: COLORS.bgDeep}}>
    <Img src={staticFile('video4/cover/photo1080.jpg')} style={{width: 1080, height: 1920}} />
    {/* wall glow + light shade (the photo itself is untouched) */}
    <AbsoluteFill style={{background: 'radial-gradient(60% 30% at 50% 24%, rgba(34,211,238,0.22), transparent 70%), radial-gradient(40% 22% at 75% 30%, rgba(255,79,163,0.18), transparent 70%)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.4) 0%, transparent 22%, transparent 72%, rgba(8,4,17,0.55) 100%)'}} />
    {/* headline behind the head */}
    <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', ...LTR}}>
      <div style={{fontSize: 180, fontWeight: 900, lineHeight: 1, color: P7P, textShadow: `0 0 40px ${P7P}, 0 0 90px rgba(34,211,238,0.5), 0 10px 26px rgba(0,0,0,0.4)`, whiteSpace: 'nowrap'}}>PRO 7+</div>
    </div>
    <div dir="rtl" style={{position: 'absolute', top: 478, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26}}>
      <span style={{fontSize: 110, fontWeight: 900, color: '#fff', textShadow: `0 0 26px ${COLORS.neon}, 0 6px 18px rgba(0,0,0,0.5)`}}>یا</span>
      <span style={{fontSize: 180, fontWeight: 900, lineHeight: 1, color: P5, textShadow: `0 0 40px ${P5}, 0 0 90px rgba(255,79,163,0.5), 0 10px 26px rgba(0,0,0,0.4)`, whiteSpace: 'nowrap', ...LTR}}>PRO 5?</span>
    </div>
    <Img src={staticFile('video4/cover/cutout.png')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}} />
    {/* chest pill */}
    <div dir="rtl" style={{position: 'absolute', top: 1135, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{padding: '16px 42px', borderRadius: 999, background: 'linear-gradient(135deg, rgba(157,78,221,0.92), rgba(90,24,154,0.94))', border: '3px solid rgba(255,255,255,0.55)', boxShadow: `0 0 50px ${COLORS.neon}, inset 0 2px 0 rgba(255,255,255,0.45)`, fontSize: 60, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap'}}>
        از بیرون <span style={{color: GOLD}}>عین همن!</span> 👀
      </div>
    </div>
    {/* scan frame on the device */}
    <div style={{position: 'absolute', left: 265, top: 1262, width: 520, height: 290}}>
      <Corner s={{left: 0, top: 0, borderLeftWidth: 8, borderTopWidth: 8, borderTopLeftRadius: 20}} />
      <Corner s={{right: 0, top: 0, borderRightWidth: 8, borderTopWidth: 8, borderTopRightRadius: 20}} />
      <Corner s={{left: 0, bottom: 0, borderLeftWidth: 8, borderBottomWidth: 8, borderBottomLeftRadius: 20}} />
      <Corner s={{right: 0, bottom: 0, borderRightWidth: 8, borderBottomWidth: 8, borderBottomRightRadius: 20}} />
      <div style={{position: 'absolute', left: 14, right: 14, top: 112, height: 6, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${P7P}, transparent)`, boxShadow: `0 0 30px ${P7P}`}} />
    </div>
    <div dir="rtl" style={{position: 'absolute', top: 1528, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '10px 30px', borderRadius: 999, background: 'rgba(8,4,17,0.78)', border: `3px solid ${P7P}`, boxShadow: `0 0 26px ${P7P}`, fontSize: 46, fontWeight: 900, color: '#fff'}}>
        <ScanSearch size={46} color={P7P} /> ۴ نشونه برای تشخیص
      </div>
    </div>
  </AbsoluteFill>
);
