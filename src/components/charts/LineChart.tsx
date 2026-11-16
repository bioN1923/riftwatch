import { useState } from 'react';
import { niceTicks, useWidth } from './useWidth';
import { t } from '../../i18n';

export interface Series {
  id: string;
  name: string;
  color: string; // CSS colour, usually a var(--series-n)
  values: number[];
  dashed?: boolean;
}

const PAD_BASE = { left: 46, right: 108, top: 12, bottom: 26 };

/** Multi-series line chart over game minutes, with a crosshair tooltip and direct end labels. */
export function LineChart({
  series,
  height = 240,
  format,
  label,
  xLabel = (i) => t('gold.minuteShort', { n: String(i) }),
  hoverTitle = (i) => t('gold.minute', { n: String(i) }),
  tickEvery = 5,
  endLabels = true,
  padLeft = 46,
  zeroBased = true,
  yTicks,
}: {
  series: Series[];
  height?: number;
  format: (n: number) => string;
  label: string;
  xLabel?: (i: number) => string;
  hoverTitle?: (i: number) => string;
  tickEvery?: number;
  endLabels?: boolean;
  padLeft?: number;
  zeroBased?: boolean;
  yTicks?: number[];
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  // The legend above already names each line; on narrow charts (phones) the end labels only got
  // cut off ("5-game avera…") and took 92 px from the plot, so they're left out there.
  const showEnds = endLabels && width >= 520;
  const PAD = { ...PAD_BASE, left: padLeft, right: showEnds ? PAD_BASE.right : 14 };
  const [hover, setHover] = useState<number | null>(null);
  const n = Math.max(...series.map((s) => s.values.length));
  const all = series.flatMap((s) => s.values);
  const ticks = yTicks ?? niceTicks(zeroBased ? Math.min(0, ...all) : Math.min(...all), Math.max(...all, 1));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const w = Math.max(0, width - PAD.left - PAD.right);
  const h = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * w);
  const y = (v: number) => PAD.top + h - ((v - yMin) / (yMax - yMin)) * h;
  const xTicks = Array.from({ length: n }, (_, i) => i).filter((i) => i % tickEvery === 0);

  // End labels: nudge apart so they never overlap.
  const ends = series
    .map((s) => ({ s, y: y(s.values[s.values.length - 1] ?? 0) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left) / rect.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  return (
    <figure className="relative" aria-label={label}>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden>
        {series.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5">
            <svg width="18" height="6">
              <line x1="0" x2="18" y1="3" y2="3" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? '4 3' : undefined} strokeLinecap="round" />
            </svg>
            {s.name}
          </span>
        ))}
      </div>
      <div ref={ref} className="relative w-full">
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={label} className="block overflow-visible">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + w} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="num fill-[var(--faint)] text-[10px]">
                  {format(t)}
                </text>
              </g>
            ))}
            {xTicks.map((i) => (
              <text key={i} x={x(i)} y={height - 6} textAnchor="middle" className="num fill-[var(--faint)] text-[10px]">
                {xLabel(i)}
              </text>
            ))}
            {series.map((s) => (
              <path
                key={s.id}
                d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                pathLength={1}
                className={s.dashed ? undefined : 'draw-line'}
                strokeDasharray={s.dashed ? '5 4' : undefined}
              />
            ))}
            {showEnds && ends.map(({ s, y: ly }) => (
              <text key={s.id} x={PAD.left + w + 8} y={ly} dy="0.32em" className="fill-[var(--muted)] text-[11px]">
                {s.name.length > 17 ? `${s.name.slice(0, 16)}…` : s.name}
              </text>
            ))}
            {hover != null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + h} stroke="var(--line-strong)" strokeWidth="1" />
                {series.map((s) =>
                  s.values[hover] != null ? <circle key={s.id} cx={x(hover)} cy={y(s.values[hover])} r="4" fill={s.color} stroke="var(--surface)" strokeWidth="2" /> : null,
                )}
              </g>
            )}
            <rect
              x={PAD.left}
              y={PAD.top}
              width={w}
              height={h}
              fill="transparent"
              // Touch: tap or drag sideways to read a point; vertical drags still scroll the page.
              style={{ touchAction: 'pan-y' }}
              onPointerDown={onMove}
              onPointerMove={onMove}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(null)}
            />
          </svg>
        )}
        {hover != null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-36 rounded border border-line-strong bg-raised px-2.5 py-2 text-xs shadow-xl"
            style={{ left: x(hover) > width / 2 ? x(hover) - 160 : x(hover) + 12 }}
          >
            <p className="mb-1 font-semibold">{hoverTitle(hover)}</p>
            {series.map((s) => (
              <p key={s.id} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="size-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="num font-medium">{s.values[hover] != null ? format(s.values[hover]) : '–'}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
