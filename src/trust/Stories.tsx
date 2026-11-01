import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BarChart3, HelpCircle, MessageCircle} from 'lucide-react';
import {ASSETS, COLORS} from '../config';
import {loadFonts} from '../lib/fonts';
import {Background} from '../components/Background';
import {Glass, NeonText} from '../components/Glass';
import {Turntable} from '../components/Turntable';

loadFonts();

// Story frames (1080×1920 stills). Each leaves a clear zone where the
// interactive sticker (poll / slider / questions) is placed in the app.
type Frame = {icon: 'poll' | 'slider' | 'ask'; kicker: string; title: string; hint: string; foot?: string};

export const STORY_FRAMES: Frame[] = [
  {icon: 'poll', kicker: 'یه سؤال ازت دارم', title: 'لپ‌تاپ بعدیت رو بیشتر برای چی می‌خوای؟', hint: 'جواب بده 👇'},
  {icon: 'slider', kicker: 'راستشو بگو', title: 'خرید آنلاین لپ‌تاپ چقدر برات استرس داره؟', hint: '👇 بکش'},
  {icon: 'ask', kicker: 'مشاوره رایگان', title: 'نمی‌دونی کدوم کانفیگ به کارت میاد؟', hint: 'سؤالت رو اینجا بپرس 👇', foot: 'یا «مشاوره» رو دایرکت کن'},
];

const ICON = {poll: BarChart3, slider: HelpCircle, ask: MessageCircle};

export const Story: React.FC<{index: number}> = ({index}) => {
  const s = STORY_FRAMES[index] ?? STORY_FRAMES[0];
  const I = ICON[s.icon];
  return (
    <AbsoluteFill style={{background: COLORS.bgDeep, fontFamily: "'Vazirmatn', sans-serif"}}>
      <Background />
      <Img src={staticFile(ASSETS.logoClean)} style={{position: 'absolute', top: 150, left: 540 - 60, width: 120, height: 120, objectFit: 'contain', filter: 'drop-shadow(0 0 22px rgba(157,78,221,0.9))'}} />
      <div dir="rtl" style={{position: 'absolute', top: 330, left: 60, right: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, textAlign: 'center'}}>
        <Glass radius={999} style={{padding: '10px 30px'}} glow={0.5}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <I size={36} color={COLORS.neonHot} />
            <span style={{fontSize: 34, fontWeight: 800, color: '#fff'}}>{s.kicker}</span>
          </div>
        </Glass>
        <NeonText size={78} weight={900} style={{lineHeight: 1.35}}>
          {s.title}
        </NeonText>
        <div style={{fontSize: 44, fontWeight: 800, color: COLORS.neonHot, marginTop: 10}}>{s.hint}</div>
      </div>
      {/* sticker zone: ~y 900–1350 kept clear */}
      {s.foot ? (
        <div dir="rtl" style={{position: 'absolute', top: 1400, left: 0, right: 0, textAlign: 'center', fontSize: 40, fontWeight: 800, color: COLORS.silver}}>{s.foot}</div>
      ) : null}
      <div style={{position: 'absolute', left: 190, top: 1490, opacity: 0.85}}>
        <Turntable angle={index * 9} width={700} glow={0.4} />
      </div>
    </AbsoluteFill>
  );
};
