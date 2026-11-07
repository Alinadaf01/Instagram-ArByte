import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {COLORS} from '../config';
import {loadFonts} from '../lib/fonts';
import {GOLD, Product, Tier, TIERS} from './Budget';

loadFonts();

// Cover + story for reel #3, built on the presenter's own photo
// (public/video3/cover/photo1080.jpg, his grade untouched). The cut-out
// (cutout.png) sits on top, so the headline lives behind his head like in
// the reel. Cover: everything that matters stays inside the centre 1080×1350
// band the profile grid shows (y 285–1635).

const FONT = "'Vazirmatn', sans-serif";
const outline = (c: string, px: number): React.CSSProperties => ({WebkitTextStroke: `${px}px ${c}`, color: 'transparent', paintOrder: 'stroke fill'});

const Badge: React.FC<{t: Tier; size?: number}> = ({t, size = 84}) => (
  <div style={{position: 'absolute', top: -size * 0.35, right: size * 0.2, width: size, height: size, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.72, fontWeight: 900, color: '#fff', background: `radial-gradient(circle at 35% 30%, ${t.color}, ${t.deep})`, boxShadow: `0 0 26px ${t.color}`, border: '3px solid rgba(255,255,255,0.75)'}}>
    ؟
  </div>
);

const Floating: React.FC<{t: Tier; left: number; top: number; w: number; rot: number}> = ({t, left, top, w, rot}) => (
  <div style={{position: 'absolute', left, top, transform: `rotate(${rot}deg)`}}>
    <div style={{position: 'absolute', inset: -40, borderRadius: '50%', background: `radial-gradient(closest-side, ${t.color}66, transparent)`, filter: 'blur(10px)'}} />
    <Product img={t.img} w={w} local={0} color={t.color} />
    <Badge t={t} />
  </div>
);

// wall glow + headline (under the cut-out)
const Stage: React.FC<{top: number}> = ({top}) => (
  <>
    <AbsoluteFill style={{background: `radial-gradient(60% 34% at 50% ${(top + 260) / 19.2}%, rgba(157,78,221,0.32), transparent 75%)`}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(21,9,43,0.42) 0%, transparent 22%, transparent 70%, rgba(8,4,17,0.7) 100%)'}} />
    <div dir="rtl" style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontSize: 190, fontWeight: 900, lineHeight: 1, color: GOLD, textShadow: `0 0 50px ${GOLD}, 0 0 110px rgba(255,197,61,0.5), 0 12px 30px rgba(0,0,0,0.45)`}}>بودجه‌ت</div>
    </div>
    <div dir="rtl" style={{position: 'absolute', top: top + 165, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontSize: 200, fontWeight: 900, lineHeight: 1, ...outline('#fff', 5), filter: `drop-shadow(0 0 22px ${COLORS.neon}) drop-shadow(0 0 50px ${COLORS.neon})`}}>چقدره؟</div>
    </div>
  </>
);

const Person: React.FC = () => <Img src={staticFile('video3/cover/cutout.png')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}} />;

const TierPills: React.FC<{size?: number}> = ({size = 40}) => (
  <div dir="rtl" style={{display: 'flex', justifyContent: 'center', gap: 16}}>
    {TIERS.map((t) => (
      <div key={t.n} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '10px 24px', borderRadius: 999, background: `linear-gradient(135deg, ${t.color}66, rgba(20,8,40,0.75))`, border: `2.5px solid ${t.color}`, boxShadow: `0 0 24px ${t.color}AA`, backdropFilter: 'blur(14px)'}}>
        <span style={{fontSize: size, fontWeight: 900, color: t.color}}>{t.n}</span>
        <span style={{fontSize: size, fontWeight: 900, color: '#fff'}}>{t.label}</span>
      </div>
    ))}
  </div>
);

const Question: React.FC<{text: React.ReactNode; size?: number}> = ({text, size = 64}) => (
  <div style={{padding: '18px 46px', borderRadius: 999, background: 'linear-gradient(135deg, rgba(157,78,221,0.9), rgba(90,24,154,0.92))', border: '3px solid rgba(255,255,255,0.55)', boxShadow: `0 0 50px ${COLORS.neon}, inset 0 2px 0 rgba(255,255,255,0.45)`, fontSize: size, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap'}}>
    {text}
  </div>
);

const [cheap, mid, pro] = TIERS;

export const BudgetCover: React.FC = () => (
  <AbsoluteFill style={{fontFamily: FONT, background: COLORS.bgDeep}}>
    <Img src={staticFile('video3/cover/photo1080.jpg')} style={{width: 1080, height: 1920}} />
    <Stage top={292} />
    <Person />
    <Floating t={pro} left={-15} top={680} w={320} rot={-8} />
    <Floating t={cheap} left={745} top={660} w={320} rot={7} />
    <Floating t={mid} left={790} top={930} w={250} rot={-6} />
    <div dir="rtl" style={{position: 'absolute', top: 1385, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
      <Question text={<>کدوم <span style={{color: GOLD}}>سرفیس</span> رو بخری؟</>} />
      <TierPills />
    </div>
  </AbsoluteFill>
);

export const BudgetStory: React.FC = () => (
  <AbsoluteFill style={{fontFamily: FONT, background: COLORS.bgDeep}}>
    <Img src={staticFile('video3/cover/photo1080.jpg')} style={{width: 1080, height: 1920}} />
    <Stage top={292} />
    <Person />
    <Floating t={pro} left={-15} top={680} w={320} rot={-8} />
    <Floating t={cheap} left={745} top={660} w={320} rot={7} />
    <Floating t={mid} left={790} top={930} w={250} rot={-6} />
    {/* top tag */}
    <div style={{position: 'absolute', top: 175, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div dir="rtl" style={{padding: '12px 34px', borderRadius: 999, background: 'linear-gradient(135deg, #FF4D6D, #c9184a)', boxShadow: '0 0 36px rgba(255,77,109,0.85)', fontSize: 44, fontWeight: 900, color: '#fff', border: '2px solid rgba(255,255,255,0.6)'}}>
        🎬 ریلز جدید
      </div>
    </div>
    {/* message card over the desk; the link sticker goes under it */}
    <div dir="rtl" style={{position: 'absolute', top: 1270, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
      <Question text={<>بهت می‌گم کدوم <span style={{color: GOLD}}>سرفیس</span> رو بخری</>} size={54} />
      <TierPills size={36} />
      <div style={{marginTop: 18, fontSize: 50, fontWeight: 900, color: '#fff', textShadow: `0 0 20px ${COLORS.neon}, 0 4px 14px rgba(0,0,0,0.9)`}}>👇 ریلز رو ببین</div>
    </div>
  </AbsoluteFill>
);
