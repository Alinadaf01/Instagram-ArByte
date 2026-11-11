import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Cpu, HardDrive, MemoryStick, ShieldCheck, Truck, MessageCircle} from 'lucide-react';
import {COLORS} from '../config';
import {loadFonts} from '../lib/fonts';
import {Background} from '../components/Background';

loadFonts();

// Surface price list sent by DM to «سرفیس» commenters (1080×1350, 4:5).
// Data from the store's own sheet; sorted from cheapest to most expensive.
// Prices change: update ROWS + UPDATED before re-rendering.
const CYAN = '#22D3EE';
const VIOLET = '#B57BFF';
const PINK = '#FF4FA3';
const GOLD = '#FFC53D';
const LTR: React.CSSProperties = {direction: 'ltr', unicodeBidi: 'isolate'};
const fa = (s: string | number) => String(s).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const toman = (n: number) => fa(n.toLocaleString('en-US').replace(/,/g, '٬'));

export const UPDATED = '۲۰ آبان ۱۴۰۵';
type Row = {model: string; cpu: string; gen: string; ram: string; ssd: string; stock: number; price: number; color: string};
const ROWS: Row[] = [
  {model: 'Surface Pro 7', cpu: 'Core i5', gen: 'نسل ۱۰', ram: '8GB', ssd: '256GB', stock: 6, price: 79500000, color: CYAN},
  {model: 'Surface Pro 7', cpu: 'Core i7', gen: 'نسل ۱۰', ram: '16GB', ssd: '256GB', stock: 10, price: 106000000, color: CYAN},
  {model: 'Surface Pro 7', cpu: 'Core i7', gen: 'نسل ۱۰', ram: '16GB', ssd: '512GB', stock: 2, price: 113950000, color: CYAN},
  {model: 'Surface Pro 7+', cpu: 'Core i7', gen: 'نسل ۱۱', ram: '16GB', ssd: '256GB', stock: 5, price: 119250000, color: VIOLET},
  {model: 'Surface Pro 8', cpu: 'Core i5', gen: 'نسل ۱۱', ram: '16GB', ssd: '256GB', stock: 2, price: 151050000, color: PINK},
];

const Spec: React.FC<{icon: React.ReactNode; text: string; sub?: string}> = ({icon, text, sub}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
    {icon}
    <span style={{fontSize: 27, fontWeight: 800, color: '#fff', ...LTR}}>{text}</span>
    {sub ? <span style={{fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.65)'}}>{sub}</span> : null}
  </div>
);

export const PriceList: React.FC = () => (
  <AbsoluteFill style={{fontFamily: "'Vazirmatn', sans-serif", background: COLORS.bgDeep}}>
    <Background intensity={0.6} />
    {/* header */}
    <div dir="rtl" style={{position: 'absolute', top: 44, left: 60, right: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <div>
        <div style={{fontSize: 30, fontWeight: 800, color: 'rgba(255,255,255,0.75)'}}>لیست قیمت روز آربایت</div>
        <div style={{fontSize: 74, fontWeight: 900, color: '#fff', lineHeight: 1.15, textShadow: `0 0 26px ${COLORS.neon}`}}>
          سرفیس‌های <span style={{color: CYAN}}>موجود</span>
        </div>
        <div style={{marginTop: 6, display: 'inline-block', padding: '4px 18px', borderRadius: 999, background: 'rgba(255,197,61,0.16)', border: `2px solid ${GOLD}`, fontSize: 24, fontWeight: 800, color: GOLD}}>
          به‌روز: {UPDATED}
        </div>
      </div>
      <Img src={staticFile('surface/spin/05.png')} style={{width: 330, filter: `drop-shadow(0 0 30px ${COLORS.neon}) drop-shadow(0 20px 30px rgba(0,0,0,0.5))`, transform: 'rotate(-6deg)'}} />
    </div>
    {/* rows */}
    <div dir="rtl" style={{position: 'absolute', top: 300, left: 48, right: 48, display: 'flex', flexDirection: 'column', gap: 16}}>
      {ROWS.map((r, i) => (
        <div key={i} style={{height: 148, borderRadius: 30, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 22, background: `linear-gradient(270deg, ${r.color}26, rgba(20,8,40,0.82) 55%)`, border: `2px solid ${r.color}AA`, boxShadow: `0 0 22px ${r.color}44, inset 0 1px 0 rgba(255,255,255,0.25)`}}>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 10}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <span style={{fontSize: 40, fontWeight: 900, color: r.color, textShadow: `0 0 16px ${r.color}88`, ...LTR}}>{r.model}</span>
              <span style={{padding: '2px 14px', borderRadius: 999, fontSize: 22, fontWeight: 900, color: r.stock <= 2 ? '#fff' : 'rgba(255,255,255,0.9)', background: r.stock <= 2 ? 'rgba(255,77,109,0.85)' : 'rgba(46,229,157,0.22)', border: r.stock <= 2 ? 'none' : '1.5px solid #2EE59D'}}>
                {r.stock <= 2 ? `فقط ${fa(r.stock)} عدد` : `${fa(r.stock)} عدد موجود`}
              </span>
            </div>
            <div style={{display: 'flex', gap: 22}}>
              <Spec icon={<Cpu size={26} color={r.color} />} text={r.cpu} sub={r.gen} />
              <Spec icon={<MemoryStick size={26} color={r.color} />} text={r.ram} />
              <Spec icon={<HardDrive size={26} color={r.color} />} text={r.ssd} />
            </div>
          </div>
          <div style={{textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
            <span style={{fontSize: 46, fontWeight: 900, color: '#fff', lineHeight: 1.1}}>{toman(r.price)}</span>
            <span style={{fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.7)'}}>تومان</span>
          </div>
        </div>
      ))}
    </div>
    {/* footer */}
    <div dir="rtl" style={{position: 'absolute', bottom: 40, left: 48, right: 48, display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{display: 'flex', justifyContent: 'center', gap: 34}}>
        {[
          [<ShieldCheck key="a" size={30} color="#2EE59D" />, 'گارانتی + مهلت تست'],
          [<Truck key="b" size={30} color={CYAN} />, 'ارسال به سراسر ایران'],
        ].map(([ic, t]) => (
          <div key={t as string} style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 28, fontWeight: 800, color: '#fff'}}>
            {ic}
            {t}
          </div>
        ))}
      </div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '16px 0', borderRadius: 999, background: `linear-gradient(135deg, ${COLORS.neon}, #5A189A)`, boxShadow: `0 0 30px ${COLORS.neon}`, fontSize: 34, fontWeight: 900, color: '#fff'}}>
        <MessageCircle size={36} color="#fff" /> برای سفارش یا مشاوره همین‌جا پیام بده
      </div>
      <div style={{textAlign: 'center', fontSize: 26, fontWeight: 800, color: 'rgba(255,255,255,0.7)', ...LTR}}>arbyte.ir · @arbyte.ir</div>
    </div>
  </AbsoluteFill>
);
