import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import {CheckCircle2, Cpu, HardDrive, MemoryStick, MousePointer2, Sparkles} from 'lucide-react';
import {COLORS, FPS} from '../config';
import {clamp, pop} from '../lib/anim';
import {sec} from '../lib/timeline';
import {Background} from '../components/Background';
import {Glass, NeonText} from '../components/Glass';
import {useBass} from '../lib/audio';

type Cues = {
  cpuShow: number;
  cpu: number;
  cpuEco: number;
  cpu2: number;
  ram: number;
  ram8: number;
  ram16: number;
  ssd: number;
  ssd128: number;
  ssd512: number;
};

// ── Choreography ───────────────────────────────────────────────────────────
// Nothing is shown before you talk about it. Each box flies in BIG at the
// centre on its cue, the pointer clicks each option exactly as you say it,
// then the box shrinks and docks into the bento grid as the next one arrives.

type Rect = {cx: number; cy: number; s: number};
type Box = {w: number; h: number; big: Rect; dock: Rect};

const BOX: Record<'cpu' | 'ram' | 'ssd', Box> = {
  cpu: {w: 992, h: 260, big: {cx: 540, cy: 820, s: 1.0}, dock: {cx: 540, cy: 470, s: 0.86}},
  ram: {w: 480, h: 300, big: {cx: 540, cy: 930, s: 1.8}, dock: {cx: 796, cy: 740, s: 0.94}},
  ssd: {w: 480, h: 300, big: {cx: 540, cy: 1120, s: 1.6}, dock: {cx: 284, cy: 740, s: 0.94}},
};

// option centres in each box's own (unscaled) coordinates
const OPT = {
  i7: [268, 187],
  i5: [724, 187],
  r8: [354, 188],
  r16: [126, 188],
  s128: [94, 214],
  s256: [239, 199],
  s512: [384, 184],
} as const;

const sp = (frame: number, at: number, damping = 15, stiffness = 120) =>
  spring({frame: frame - at, fps: FPS, config: {damping, stiffness}});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// where a box is right now: off-screen → big → docked
const place = (box: Box, enter: number, dock: number): Rect => ({
  cx: lerp(box.big.cx, box.dock.cx, dock),
  cy: lerp(box.big.cy + (1 - enter) * 900, box.dock.cy, dock),
  s: lerp(box.big.s * (0.55 + enter * 0.45), box.dock.s, dock),
});

const toScreen = (box: Box, r: Rect, local: readonly [number, number]) =>
  [r.cx + (local[0] - box.w / 2) * r.s, r.cy + (local[1] - box.h / 2) * r.s] as const;

const Frame: React.FC<{box: Box; r: Rect; opacity: number; glow: number; children: React.ReactNode}> = ({
  box,
  r,
  opacity,
  glow,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: r.cx - box.w / 2,
      top: r.cy - box.h / 2,
      width: box.w,
      height: box.h,
      transform: `scale(${r.s})`,
      opacity,
    }}
  >
    <Glass radius={44} style={{width: '100%', height: '100%'}} glow={glow}>
      {children}
    </Glass>
  </div>
);

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

const Pill: React.FC<{text: string; on: number; style: React.CSSProperties}> = ({text, on, style}) => (
  <div
    style={{
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      fontSize: 38,
      fontWeight: 900,
      direction: 'ltr',
      color: on > 0.5 ? '#fff' : 'rgba(255,255,255,0.45)',
      background: `rgba(157,78,221,${0.12 + on * 0.75})`,
      border: `2px solid rgba(224,170,255,${0.2 + on * 0.7})`,
      boxShadow: on > 0.05 ? `0 0 ${36 * on}px rgba(157,78,221,${0.9 * on}), inset 0 1px 0 rgba(255,255,255,${0.4 * on})` : 'none',
      transform: `scale(${1 + on * 0.05})`,
      ...style,
    }}
  >
    {text}
  </div>
);

// click burst at an option the moment it is selected
const Burst: React.FC<{at: number; x: number; y: number}> = ({at, x, y}) => {
  const frame = useCurrentFrame();
  const f = frame - at;
  if (f < 0 || f > 30) return null;
  const p = f / 30;
  return (
    <div style={{position: 'absolute', left: x, top: y, zIndex: 25, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: -90 * p - 14,
          top: -90 * p - 14,
          width: 180 * p + 28,
          height: 180 * p + 28,
          borderRadius: '50%',
          border: `5px solid rgba(224,170,255,${1 - p})`,
          boxShadow: `0 0 30px rgba(157,78,221,${1 - p})`,
        }}
      />
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const d = 30 + p * 90;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: Math.cos(a) * d - 5,
              top: Math.sin(a) * d - 5,
              width: 10,
              height: 10,
              borderRadius: 99,
              background: COLORS.neonHot,
              opacity: 1 - p,
              boxShadow: `0 0 12px ${COLORS.neonSoft}`,
            }}
          />
        );
      })}
    </div>
  );
};

const Cursor: React.FC<{taps: {at: number; x: number; y: number}[]; hideAt: number}> = ({taps, hideAt}) => {
  const frame = useCurrentFrame();
  if (!taps.length || frame < taps[0].at - 30 || frame > hideAt + 20) return null;
  // glide from just below the first target, then hop between targets
  let x = taps[0].x + 120;
  let y = taps[0].y + 220;
  for (const t of taps) {
    const p = sp(frame, t.at - 16, 18, 150);
    x += (t.x - x) * p;
    y += (t.y - y) * p;
  }
  const last = [...taps].reverse().find((t) => frame >= t.at);
  const since = last ? frame - last.at : 99;
  const press = interpolate(since, [0, 3, 10], [0.78, 0.78, 1], clamp);
  const appear = pop(frame, taps[0].at - 30) * interpolate(frame, [hideAt, hideAt + 14], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y, zIndex: 30, opacity: appear}}>
      <div style={{transform: `translate(-6px,-4px) scale(${press})`, transformOrigin: 'top left', filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.6)) drop-shadow(0 0 10px rgba(199,125,255,0.8))'}}>
        <MousePointer2 size={84} color="#14081f" fill="#ffffff" strokeWidth={1.6} />
      </div>
    </div>
  );
};

export const ConfigScene: React.FC<{start: number; cues: Cues}> = ({start, cues}) => {
  const frame = useCurrentFrame();
  const bass = useBass();
  const L = (s: number) => sec(s) - start;
  const c = {
    cpuShow: L(cues.cpuShow),
    i7: L(cues.cpu),
    eco: L(cues.cpuEco),
    i5: L(cues.cpu2),
    ram: L(cues.ram),
    r8: L(cues.ram8),
    r16: L(cues.ram16),
    ssd: L(cues.ssd),
    s128: L(cues.ssd128),
    s512: L(cues.ssd512),
  };
  const s256 = Math.round((c.s128 + c.s512) / 2);
  const done = c.s512 + 40;

  // box states
  const cpuR = place(BOX.cpu, sp(frame, c.cpuShow), sp(frame, c.ram, 17, 110));
  const ramR = place(BOX.ram, sp(frame, c.ram), sp(frame, c.ssd, 17, 110));
  const ssdR = place(BOX.ssd, sp(frame, c.ssd), sp(frame, done, 17, 110));

  // selections («نسخه Core i7» → «اقتصادی‌تر Core i5»)
  const on = (at: number) => sp(frame, at, 14, 160);
  const i7On = on(c.i7) * (1 - on(c.i5));
  const i5On = on(c.i5);
  const knob = 1 - on(c.i5); // 1 = i7 (left), 0 = i5 (right)
  const r8 = on(c.r8) * (1 - on(c.r16));
  const r16 = on(c.r16);
  const b1 = on(c.s128);
  const b2 = on(s256);
  const b3 = on(c.s512);
  const ecoTag = pop(frame, c.eco);

  // pointer targets, computed from where each box is when it is clicked
  const at = (box: Box, r: Rect, opt: readonly [number, number]) => {
    const [x, y] = toScreen(box, r, opt);
    return {x, y};
  };
  const bigCpu = BOX.cpu.big;
  const bigRam = BOX.ram.big;
  const bigSsd = BOX.ssd.big;
  const taps = [
    {at: c.i7, ...at(BOX.cpu, bigCpu, OPT.i7)},
    {at: c.i5, ...at(BOX.cpu, bigCpu, OPT.i5)},
    {at: c.r8, ...at(BOX.ram, bigRam, OPT.r8)},
    {at: c.r16, ...at(BOX.ram, bigRam, OPT.r16)},
    {at: c.s128, ...at(BOX.ssd, bigSsd, OPT.s128)},
    {at: s256, ...at(BOX.ssd, bigSsd, OPT.s256)},
    {at: c.s512, ...at(BOX.ssd, bigSsd, OPT.s512)},
  ];

  const head = pop(frame, 4);
  const summary = pop(frame, done + 10);
  const visible = (show: number) => (frame >= show - 2 ? 1 : 0);

  return (
    <AbsoluteFill>
      <Background />
      <div dir="rtl" style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', transform: `translateY(${(1 - head) * -40}px)`, opacity: head}}>
        <NeonText size={56} weight={900}>
          کانفیگ دلخواهت رو انتخاب کن
        </NeonText>
      </div>

      {/* Processor */}
      {visible(c.cpuShow) ? (
        <Frame box={BOX.cpu} r={cpuR} opacity={1} glow={0.3 + Math.max(i7On, i5On) * 0.4}>
          <div style={{position: 'absolute', right: 34, top: 24}}>
            <Label icon={<Cpu size={34} color="#fff" />} title="پردازنده" sub="نسل ۱۱ اینتل" />
          </div>
          <div style={{position: 'absolute', left: 40, right: 40, top: 132, height: 110, borderRadius: 999, background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.12)'}}>
            <div
              style={{
                position: 'absolute',
                top: 7,
                bottom: 7,
                width: 'calc(50% - 10px)',
                right: `calc(${knob * 50}% + 7px)`,
                borderRadius: 999,
                background: `linear-gradient(135deg, ${COLORS.neon}, #6A1FB0)`,
                boxShadow: `0 0 ${30 + bass * 30}px rgba(157,78,221,0.9), inset 0 1px 0 rgba(255,255,255,0.45)`,
                opacity: frame >= c.i7 ? 1 : 0,
              }}
            />
            <div style={{position: 'absolute', inset: 0, display: 'flex', direction: 'ltr'}}>
              {[
                ['Core i7-1165G7', i7On],
                ['Core i5-1135G7', i5On],
              ].map(([t, v]) => (
                <div
                  key={t as string}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 40,
                    fontWeight: 900,
                    color: (v as number) > 0.5 ? '#fff' : 'rgba(255,255,255,0.5)',
                    textShadow: (v as number) > 0.5 ? '0 0 18px rgba(255,255,255,0.7)' : 'none',
                  }}
                >
                  {t as string}
                </div>
              ))}
            </div>
          </div>
          {/* «اقتصادی‌تر» tag over the i5 option */}
          {frame >= c.eco ? (
            <div
              dir="rtl"
              style={{
                position: 'absolute',
                left: 724 - 85,
                top: 114,
                width: 170,
                textAlign: 'center',
                padding: '2px 0',
                borderRadius: 99,
                fontSize: 21,
                zIndex: 2,
                fontWeight: 900,
                color: '#06281a',
                background: COLORS.green,
                boxShadow: '0 0 18px rgba(46,229,157,0.8)',
                transform: `scale(${0.5 + ecoTag * 0.5})`,
                opacity: Math.min(1, ecoTag * 1.5),
              }}
            >
              اقتصادی‌تر 💰
            </div>
          ) : null}
        </Frame>
      ) : null}

      {/* RAM */}
      {visible(c.ram) ? (
        <Frame box={BOX.ram} r={ramR} opacity={1} glow={0.3 + r16 * 0.4}>
          <div style={{position: 'absolute', right: 30, top: 24}}>
            <Label icon={<MemoryStick size={34} color="#fff" />} title="رم" sub="LPDDR4x" />
          </div>
          <Pill text="8GB" on={r8} style={{right: 26, top: 138, width: 200, height: 100}} />
          <Pill text="16GB" on={r16} style={{left: 26, top: 138, width: 200, height: 100}} />
        </Frame>
      ) : null}

      {/* SSD */}
      {visible(c.ssd) ? (
        <Frame box={BOX.ssd} r={ssdR} opacity={1} glow={0.3 + b3 * 0.4}>
          <div style={{position: 'absolute', right: 30, top: 24}}>
            <Label icon={<HardDrive size={34} color="#fff" />} title="حافظه SSD" />
          </div>
          {[
            ['128GB', b1, 70],
            ['256GB', b2, 100],
            ['512GB', b3, 130],
          ].map(([t, v, h], i) => (
            <div key={t as string} style={{position: 'absolute', left: 30 + i * 145, bottom: 26, width: 128, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
              <span style={{fontSize: 27, fontWeight: 900, color: (v as number) > 0.5 ? '#fff' : 'rgba(255,255,255,0.45)', direction: 'ltr'}}>{t as string}</span>
              <div
                style={{
                  width: '100%',
                  height: h as number,
                  borderRadius: 18,
                  background: `linear-gradient(0deg, rgba(157,78,221,${0.15 + (v as number) * 0.8}), rgba(224,170,255,${0.05 + (v as number) * 0.7}))`,
                  border: `2px solid rgba(224,170,255,${0.2 + (v as number) * 0.7})`,
                  boxShadow: (v as number) > 0.05 ? `0 0 ${30 * (v as number)}px rgba(157,78,221,0.9)` : 'none',
                }}
              />
            </div>
          ))}
        </Frame>
      ) : null}

      {/* everything docked → «every config is available» */}
      {frame >= done + 10 ? (
        <div style={{position: 'absolute', top: 930, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - summary) * 80}px) scale(${0.6 + summary * 0.4})`, opacity: Math.min(1, summary * 1.5)}}>
          <Glass radius={999} style={{padding: '16px 34px'}} glow={0.7} tint="rgba(46,229,157,0.18)">
            <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <CheckCircle2 size={42} color={COLORS.green} strokeWidth={2.6} />
              <span style={{fontSize: 40, fontWeight: 900, color: '#fff'}}>همه‌ی کانفیگ‌ها موجوده</span>
              <Sparkles size={36} color={COLORS.neonHot} />
            </div>
          </Glass>
        </div>
      ) : null}

      {taps.map((t, i) => (
        <Burst key={i} at={t.at} x={t.x} y={t.y} />
      ))}
      <Cursor taps={taps} hideAt={done} />
    </AbsoluteFill>
  );
};
