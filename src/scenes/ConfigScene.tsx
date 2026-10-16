import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import {Cpu, HardDrive, Headset, MemoryStick, Pointer} from 'lucide-react';
import {COLORS, FPS} from '../config';
import {clamp, pop} from '../lib/anim';
import {sec} from '../lib/timeline';
import {Background} from '../components/Background';
import {Glass, NeonText} from '../components/Glass';
import {useBass} from '../lib/audio';

type Cues = {
  cpu: number;
  cpu2: number;
  ram: number;
  ram2: number;
  ssd: number;
  ssd128: number;
  ssd512: number;
  consult: number;
};

const Label: React.FC<{icon: React.ReactNode; title: string; sub?: string}> = ({icon, title, sub}) => (
  <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 14}}>
    <div
      style={{
        width: 58,
        height: 58,
        borderRadius: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${COLORS.neon}, #5A189A)`,
        boxShadow: '0 0 20px rgba(157,78,221,0.6), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}
    >
      {icon}
    </div>
    <div style={{display: 'flex', flexDirection: 'column'}}>
      <span style={{fontSize: 34, fontWeight: 800, color: '#fff'}}>{title}</span>
      {sub ? <span style={{fontSize: 22, fontWeight: 700, color: COLORS.muted}}>{sub}</span> : null}
    </div>
  </div>
);

const Option: React.FC<{text: string; on: number; style: React.CSSProperties; size?: number}> = ({text, on, style, size = 36}) => (
  <div
    style={{
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      fontSize: size,
      fontWeight: 900,
      direction: 'ltr',
      color: on > 0.5 ? '#fff' : 'rgba(255,255,255,0.45)',
      background: `rgba(157,78,221,${0.12 + on * 0.75})`,
      border: `2px solid rgba(224,170,255,${0.2 + on * 0.7})`,
      boxShadow: on > 0.05 ? `0 0 ${36 * on}px rgba(157,78,221,${0.9 * on}), inset 0 1px 0 rgba(255,255,255,${0.4 * on})` : 'none',
      transform: `scale(${1 + on * 0.04})`,
      ...style,
    }}
  >
    {text}
  </div>
);

// tap targets (absolute px) used by the virtual pointer
const T = {
  i5: [768, 590],
  i7: [312, 590],
  r8: [906, 878],
  r16: [686, 878],
  s128: [144, 900],
  s256: [284, 880],
  s512: [424, 860],
  consult: [540, 1090],
} as const;

const PointerHand: React.FC<{taps: {at: number; to: readonly [number, number]}[]}> = ({taps}) => {
  const frame = useCurrentFrame();
  if (!taps.length || frame < taps[0].at - 24) return null;
  let x = taps[0].to[0] + 160;
  let y = taps[0].to[1] + 260;
  for (const tap of taps) {
    const p = spring({frame: frame - (tap.at - 18), fps: FPS, config: {damping: 18, stiffness: 140}});
    x += (tap.to[0] - x) * p;
    y += (tap.to[1] - y) * p;
  }
  const last = [...taps].reverse().find((t) => frame >= t.at);
  const since = last ? frame - last.at : 99;
  const press = interpolate(since, [0, 4, 12], [0.82, 0.82, 1], clamp);
  const appear = pop(frame, taps[0].at - 24);
  return (
    <div style={{position: 'absolute', left: x, top: y, zIndex: 20, opacity: appear}}>
      {since < 30 ? (
        <div
          style={{
            position: 'absolute',
            left: -70 * (since / 30) - 10,
            top: -70 * (since / 30) - 10,
            width: 140 * (since / 30) + 20,
            height: 140 * (since / 30) + 20,
            borderRadius: '50%',
            border: `4px solid rgba(255,255,255,${1 - since / 30})`,
          }}
        />
      ) : null}
      <div style={{transform: `translate(-12px,-6px) scale(${press})`, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.6))'}}>
        <Pointer size={78} color="#fff" fill="rgba(255,255,255,0.95)" strokeWidth={1.6} />
      </div>
    </div>
  );
};

export const ConfigScene: React.FC<{start: number; cues: Cues}> = ({start, cues}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const L = (s: number) => sec(s) - start;
  const cpu = L(cues.cpu);
  const cpu2 = L(cues.cpu2);
  const ram = L(cues.ram);
  const ram2 = L(cues.ram2);
  const s128 = L(cues.ssd128);
  const s512 = L(cues.ssd512);
  const s256 = Math.round((s128 + s512) / 2);
  const consult = L(cues.consult);
  const sw = (at: number) => spring({frame: frame - at, fps: FPS, config: {damping: 14, stiffness: 120}});

  const head = pop(frame, 6);
  const cCpu = pop(frame, 14);
  const cRam = pop(frame, 22);
  const cSsd = pop(frame, 30);
  const cCon = pop(frame, consult - 6);

  // states
  // «نسخه Core i7» → «اقتصادی‌تر Core i5»
  const i7On = sw(cpu) * (1 - sw(cpu2));
  const i5On = sw(cpu2);
  const knob = 1 - sw(cpu2); // 1 = i7 (left), 0 = i5 (right)
  const r8 = sw(ram) * (1 - sw(ram2));
  const r16 = sw(ram2);
  const s1 = sw(s128);
  const s2 = sw(s256);
  const s3 = sw(s512);
  const ring = Math.sin(frame * 0.9) * interpolate((frame - consult) % 90, [0, 30, 31], [10, 0, 0], clamp);

  const card = (p: number): React.CSSProperties => ({
    transform: `translateY(${(1 - p) * 160}px) scale(${0.85 + p * 0.15})`,
    opacity: Math.min(1, p * 1.5),
  });

  return (
    <AbsoluteFill>
      <Background />
      <div dir="rtl" style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', ...card(head)}}>
        <NeonText size={56} weight={900}>
          کانفیگ دلخواهت رو انتخاب کن
        </NeonText>
      </div>

      {/* Processor */}
      <div style={{position: 'absolute', left: 44, top: 420, width: 992, height: 250, ...card(cCpu)}}>
        <Glass radius={44} style={{width: '100%', height: '100%'}} glow={Math.max(i7On, i5On) * 0.4}>
          <div style={{position: 'absolute', right: 34, top: 22}}>
            <Label icon={<Cpu size={34} color="#fff" />} title="پردازنده" sub="نسل ۱۱ اینتل" />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 40,
              right: 40,
              top: 122,
              height: 100,
              borderRadius: 999,
              background: 'rgba(0,0,0,0.28)',
              border: '1.5px solid rgba(255,255,255,0.12)',
            }}
          >
            {/* sliding knob */}
            <div
              style={{
                position: 'absolute',
                top: 6,
                bottom: 6,
                width: 'calc(50% - 9px)',
                right: `calc(${knob * 50}% + 6px)`,
                borderRadius: 999,
                background: `linear-gradient(135deg, ${COLORS.neon}, #6A1FB0)`,
                boxShadow: `0 0 ${30 + bass * 30}px rgba(157,78,221,0.9), inset 0 1px 0 rgba(255,255,255,0.45)`,
                opacity: frame >= cpu ? 1 : 0.35,
              }}
            />
            <div style={{position: 'absolute', inset: 0, display: 'flex', direction: 'ltr'}}>
              {[
                ['Core i7-1165G7', i7On],
                ['Core i5-1135G7', i5On],
              ].map(([t, on]) => (
                <div
                  key={t as string}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 38,
                    fontWeight: 900,
                    color: (on as number) > 0.5 ? '#fff' : 'rgba(255,255,255,0.5)',
                    textShadow: (on as number) > 0.5 ? '0 0 18px rgba(255,255,255,0.7)' : 'none',
                  }}
                >
                  {t as string}
                </div>
              ))}
            </div>
          </div>
        </Glass>
      </div>

      {/* RAM */}
      <div style={{position: 'absolute', left: 556, top: 700, width: 480, height: 290, ...card(cRam)}}>
        <Glass radius={44} style={{width: '100%', height: '100%'}} glow={r16 * 0.4}>
          <div style={{position: 'absolute', right: 30, top: 22}}>
            <Label icon={<MemoryStick size={34} color="#fff" />} title="رم" sub="LPDDR4x" />
          </div>
          <Option text="8GB" on={r8} style={{right: 26, top: 128, width: 200, height: 100}} />
          <Option text="16GB" on={r16} style={{left: 26, top: 128, width: 200, height: 100}} />
        </Glass>
      </div>

      {/* SSD */}
      <div style={{position: 'absolute', left: 44, top: 700, width: 480, height: 290, ...card(cSsd)}}>
        <Glass radius={44} style={{width: '100%', height: '100%'}} glow={s3 * 0.4}>
          <div style={{position: 'absolute', right: 30, top: 22}}>
            <Label icon={<HardDrive size={34} color="#fff" />} title="حافظه SSD" />
          </div>
          {[
            ['128GB', s1, 70],
            ['256GB', s2, 100],
            ['512GB', s3, 130],
          ].map(([t, on, h], i) => (
            <div key={t as string} style={{position: 'absolute', left: 30 + i * 145, bottom: 26, width: 128, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
              <span style={{fontSize: 27, fontWeight: 900, color: (on as number) > 0.5 ? '#fff' : 'rgba(255,255,255,0.45)', direction: 'ltr'}}>
                {t as string}
              </span>
              <div
                style={{
                  width: '100%',
                  height: h as number,
                  borderRadius: 18,
                  background: `linear-gradient(0deg, rgba(157,78,221,${0.15 + (on as number) * 0.8}), rgba(224,170,255,${0.05 + (on as number) * 0.7}))`,
                  border: `2px solid rgba(224,170,255,${0.2 + (on as number) * 0.7})`,
                  boxShadow: (on as number) > 0.05 ? `0 0 ${30 * (on as number)}px rgba(157,78,221,0.9)` : 'none',
                }}
              />
            </div>
          ))}
        </Glass>
      </div>

      {/* Free consultation badge */}
      {frame >= consult - 6 ? (
        <div style={{position: 'absolute', left: 44, right: 44, top: 1030, height: 132, ...card(cCon)}}>
          <Glass radius={999} style={{width: '100%', height: '100%'}} glow={0.6} tint="rgba(157,78,221,0.35)">
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, height: '100%'}}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 99,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: COLORS.green,
                  boxShadow: `0 0 ${26 + bass * 30}px rgba(46,229,157,0.85)`,
                  transform: `rotate(${ring}deg)`,
                }}
              >
                <Headset size={50} color="#06281a" strokeWidth={2.4} />
              </div>
              <span style={{fontSize: 42, fontWeight: 900, color: '#fff', textShadow: '0 0 18px rgba(199,125,255,0.8)'}}>
                مشاوره رایگان با کارشناسان آربایت
              </span>
            </div>
          </Glass>
        </div>
      ) : null}

      <PointerHand
        taps={[
          {at: cpu, to: T.i7},
          {at: cpu2, to: T.i5},
          {at: ram, to: T.r8},
          {at: ram2, to: T.r16},
          {at: s128, to: T.s128},
          {at: s256, to: T.s256},
          {at: s512, to: T.s512},
          {at: consult + 10, to: T.consult},
        ]}
      />
    </AbsoluteFill>
  );
};
