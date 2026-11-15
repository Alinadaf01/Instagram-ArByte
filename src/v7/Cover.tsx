import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BatteryCharging, Fingerprint, Monitor, Plug} from 'lucide-react';
import {COLORS} from '../config';
import {loadFonts} from '../lib/fonts';

loadFonts();

// Cover for reel #7 on the presenter's own photo (no grade). Headline sits on
// the wall above the head (inside the 4:5 grid band 285–1635), the cut-out
// overlaps nothing; the four checks sit on the desk.
const GOLD = '#FFC53D';
const CYAN = '#22D3EE';
const GREEN = '#2EE59D';
const PINK = '#FF4FA3';
const VIOLET = '#C77DFF';

export const QcCover: React.FC = () => (
  <AbsoluteFill style={{fontFamily: "'Vazirmatn', sans-serif", background: COLORS.bgDeep}}>
    <Img src={staticFile('video7/cover/photo1080.jpg')} style={{width: 1080, height: 1920}} />
    <AbsoluteFill style={{background: 'radial-gradient(75% 20% at 50% 24%, rgba(21,9,43,0.82), rgba(21,9,43,0.4) 60%, transparent 88%)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.55) 0%, transparent 28%, transparent 66%, rgba(8,4,17,0.75) 100%)'}} />
    <div dir="rtl" style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{display: 'inline-block', padding: '6px 30px', borderRadius: 999, background: 'linear-gradient(135deg, #FF4D6D, #c9184a)', boxShadow: '0 0 30px rgba(255,77,109,0.8)', fontSize: 50, fontWeight: 900, color: '#fff'}}>
        📦 فردا می‌ره رشت
      </div>
      <div style={{marginTop: 14, fontSize: 104, fontWeight: 900, lineHeight: 1.08, color: '#fff', textShadow: `0 0 24px ${COLORS.neon}, 0 8px 22px rgba(0,0,0,0.6)`}}>
        قبل از ارسال
        <br />
        <span style={{color: GOLD, textShadow: `0 0 36px ${GOLD}, 0 0 80px rgba(255,197,61,0.45), 0 10px 26px rgba(0,0,0,0.6)`}}>چی تست می‌کنیم؟</span>
      </div>
    </div>
    <Img src={staticFile('video7/cover/cutout.png')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}} />
    <div dir="rtl" style={{position: 'absolute', top: 1470, left: 30, right: 30, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16}}>
      {(
        [
          [Fingerprint, 'سریال', CYAN],
          [Monitor, 'صفحه', PINK],
          [BatteryCharging, 'باتری', GREEN],
          [Plug, 'پورت', VIOLET],
        ] as const
      ).map(([Icon, t, c]) => (
        <div key={t} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 999, background: 'rgba(8,4,17,0.88)', border: `3px solid ${c}`, boxShadow: `0 0 26px ${c}`, fontSize: 46, fontWeight: 900, color: '#fff'}}>
          <Icon size={42} color={c} />
          {t}
        </div>
      ))}
    </div>
    <div dir="rtl" style={{position: 'absolute', top: 1580, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{padding: '8px 30px', borderRadius: 999, background: 'rgba(8,4,17,0.85)', border: `2px solid ${GOLD}`, fontSize: 40, fontWeight: 900, color: '#fff'}}>
        تست سوم رو <span style={{color: GOLD}}>خیلیا انجام نمی‌دن</span> 👀
      </div>
    </div>
  </AbsoluteFill>
);
