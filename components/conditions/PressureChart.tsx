'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ConditionsDay } from '@/lib/conditions';

const W = 800;
const H = 150;
const PAD_L = 44;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 22;

/** Hourly air pressure over the four days, with a crosshair tooltip. */
export function PressureChart({ days, locale }: { days: ConditionsDay[]; locale: string }) {
  const t = useTranslations('conditions');
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const hours = useMemo(() => days.flatMap((d) => d.hours).filter((h) => Number.isFinite(h.pressure)), [days]);
  const fmtTip = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'numeric' }), [locale]);
  if (hours.length < 2) return null;

  const values = hours.map((h) => h.pressure);
  const lo = Math.floor(Math.min(...values) - 1);
  const hi = Math.ceil(Math.max(...values) + 1);
  const x = (i: number) => PAD_L + (i / (hours.length - 1)) * (W - PAD_L - PAD_R);
  const y = (v: number) => PAD_T + ((hi - v) / (hi - lo)) * (H - PAD_T - PAD_B);
  const points = hours.map((h, i) => `${x(i).toFixed(1)},${y(h.pressure).toFixed(1)}`).join(' ');
  const ticks = [hi, Math.round((hi + lo) / 2), lo];
  const change = values[values.length - 1] - values[0];
  const trend = change <= -1.5 ? 'falling' : change >= 1.5 ? 'rising' : 'stable';
  const arrow = trend === 'falling' ? '↘' : trend === 'rising' ? '↗' : '→';

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD_L) / (W - PAD_L - PAD_R)) * (hours.length - 1));
    setHover(Math.max(0, Math.min(hours.length - 1, i)));
  }

  const h = hover === null ? null : hours[hover];
  const tipX = hover === null ? 0 : Math.min(x(hover) + 10, W - 160);

  return (
    <figure className="mt-6">
      <figcaption className="flex justify-between">
        <span className="label">{t('pressure')} · hPa</span>
        <span className="num text-xs text-muted">
          {arrow} {t(`trend.${trend}`)} ({change > 0 ? '+' : ''}
          {change.toFixed(1)})
        </span>
      </figcaption>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 block h-auto w-full touch-none"
        role="img"
        aria-label={`${t('pressure')}: ${Math.round(values[0])} → ${Math.round(values[values.length - 1])} hPa, ${t(`trend.${trend}`)}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)} stroke="var(--rule-2)" strokeWidth="1" />
            <text x={0} y={y(v) + 4} fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)">
              {v}
            </text>
          </g>
        ))}
        {days.slice(1).map((d) => {
          const idx = hours.findIndex((hh) => hh.time.startsWith(d.date));
          return idx > 0 ? (
            <line key={d.date} x1={x(idx)} x2={x(idx)} y1={PAD_T} y2={H - PAD_B} stroke="var(--rule)" strokeDasharray="2 4" />
          ) : null;
        })}
        <polyline points={points} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" />
        {h && hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={PAD_T} y2={H - PAD_B} stroke="var(--ink)" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(h.pressure)} r="5" fill="var(--paper)" stroke="var(--brand)" strokeWidth="2" />
            <rect x={tipX} y={PAD_T} width="150" height="40" fill="var(--ink)" />
            <text x={tipX + 10} y={PAD_T + 16} fontSize="11" fill="var(--paper)" fontFamily="var(--font-mono)">
              {fmtTip.format(new Date(`${h.time}:00`))} · {h.time.slice(11, 16)}
            </text>
            <text x={tipX + 10} y={PAD_T + 32} fontSize="12" fill="var(--paper)" fontFamily="var(--font-mono)">
              {h.pressure.toFixed(1)} hPa
            </text>
          </g>
        )}
      </svg>
    </figure>
  );
}
