import { useId, useState } from 'react';
import type { TimelineEvent } from '../../../shared/types';
import { compact } from '../../lib/format';
import { niceTicks, useWidth } from './useWidth';
import { t } from '../../i18n';

const PAD = { left: 46, right: 16, top: 14, bottom: 46 };

const OBJECTIVES = new Set(['DRAGON', 'BARON_NASHOR', 'RIFTHERALD', 'HORDE', 'ATAKHAN', 'ELDER_DRAGON', 'FIRE_DRAGON', 'WATER_DRAGON', 'EARTH_DRAGON', 'AIR_DRAGON', 'HEXTECH_DRAGON', 'CHEMTECH_DRAGON']);
const objName = (k: string) => (OBJECTIVES.has(k) ? t(`obj.${k}` as 'obj.DRAGON') : k);
/** Objective names in the current language; dragons by element (Infernal, Ocean …) when known. */
export const objectiveLabel = (e: Extract<TimelineEvent, { type: 'objective' }>) => (e.monster === 'DRAGON' && e.sub ? objName(e.sub) : objName(e.monster));
export const buildingLabel = (b: string) => (b === 'INHIBITOR' ? t('obj.inhibitor') : t('obj.tower'));

/**
 * Blue-side gold lead over time. Above the zero line is Blue ahead, below is Red ahead.
 * Objectives and towers sit on a strip beneath, coloured by the side that took them.
 */
export function GoldChart({ diff, events, height = 230 }: { diff: number[]; events: TimelineEvent[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const clip = useId().replace(/:/g, '');
  const n = diff.length;
  const ext = Math.max(1000, ...diff.map(Math.abs));
  const ticks = niceTicks(-ext, ext, 4);
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const w = Math.max(0, width - PAD.left - PAD.right);
  const h = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * w);
  const xs = (sec: number) => PAD.left + Math.min(1, sec / 60 / Math.max(1, n - 1)) * w;
  const y = (v: number) => PAD.top + h - ((v - yMin) / (yMax - yMin)) * h;
  const zero = y(0);
  const line = diff.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${line}L${x(n - 1)},${zero}L${x(0)},${zero}Z`;
  const marks = events.filter((e) => e.type === 'objective' || e.type === 'building') as Exclude<TimelineEvent, { type: 'kill' }>[];
  const stripY = PAD.top + h + 20;

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - rect.left) / rect.width) * (n - 1)))));
  }
  const near = hover != null ? marks.filter((m) => Math.abs(m.t / 60 - hover) <= 0.5) : [];

  return (
    <figure aria-label={t('gold.aria')}>
      <div className="mb-2 flex gap-4 text-xs text-muted" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-side-blue" /> {t('gold.blueAhead')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-side-red" /> {t('gold.redAhead')}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M5 0L10 5L5 10L0 5Z" fill="var(--muted)" />
          </svg>
          {t('gold.objective')}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="1.5" y="1.5" width="7" height="7" fill="var(--muted)" />
          </svg>
          {t('gold.building')}
        </span>
      </div>
      <div ref={ref} className="relative">
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={t('gold.chart')} className="block">
            <defs>
              <clipPath id={`${clip}-up`}>
                <rect x={0} y={0} width={width} height={zero} />
              </clipPath>
              <clipPath id={`${clip}-down`}>
                <rect x={0} y={zero} width={width} height={height} />
              </clipPath>
            </defs>
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={PAD.left} x2={PAD.left + w} y1={y(tick)} y2={y(tick)} stroke={tick === 0 ? 'var(--line-strong)' : 'var(--line)'} />
                <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="num fill-[var(--faint)] text-[10px]">
                  {tick === 0 ? t('gold.even') : compact(Math.abs(tick))}
                </text>
              </g>
            ))}
            {Array.from({ length: n }, (_, i) => i)
              .filter((i) => i % 5 === 0)
              .map((i) => (
                <text key={i} x={x(i)} y={PAD.top + h + 12} textAnchor="middle" className="num fill-[var(--faint)] text-[10px]">
                  {t('gold.minuteShort', { n: String(i) })}
                </text>
              ))}
            <g clipPath={`url(#${clip}-up)`}>
              <path d={area} fill="var(--side-blue)" opacity="0.22" className="fade-in-slow" />
              <path d={line} fill="none" stroke="var(--side-blue)" strokeWidth="2" strokeLinejoin="round" pathLength={1} className="draw-line" />
            </g>
            <g clipPath={`url(#${clip}-down)`}>
              <path d={area} fill="var(--side-red)" opacity="0.22" className="fade-in-slow" />
              <path d={line} fill="none" stroke="var(--side-red)" strokeWidth="2" strokeLinejoin="round" pathLength={1} className="draw-line" />
            </g>
            <line x1={PAD.left} x2={PAD.left + w} y1={stripY} y2={stripY} stroke="var(--line)" />
            {marks.map((m, i) => {
              const cx = xs(m.t);
              const fill = m.teamId === 100 ? 'var(--side-blue)' : 'var(--side-red)';
              const label = m.type === 'objective' ? objectiveLabel(m) : buildingLabel(m.building);
              return m.type === 'objective' ? (
                <path key={i} d={`M${cx},${stripY - 6}L${cx + 6},${stripY}L${cx},${stripY + 6}L${cx - 6},${stripY}Z`} fill={fill} stroke="var(--surface)" strokeWidth="1.5">
                  <title>{label}</title>
                </path>
              ) : (
                <rect key={i} x={cx - 4} y={stripY - 4} width={8} height={8} fill={fill} stroke="var(--surface)" strokeWidth="1.5" opacity="0.8">
                  <title>{label}</title>
                </rect>
              );
            })}
            {hover != null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={stripY + 6} stroke="var(--line-strong)" />
                <circle cx={x(hover)} cy={y(diff[hover])} r="4.5" fill={diff[hover] >= 0 ? 'var(--side-blue)' : 'var(--side-red)'} stroke="var(--surface)" strokeWidth="2" />
              </g>
            )}
            <rect x={PAD.left} y={PAD.top} width={w} height={h + 30} fill="transparent"
              // Touch: a tap shows that minute and a sideways drag scrubs (vertical drags still scroll); the readout stays after lifting the finger.
              style={{ touchAction: 'pan-y' }}
              onPointerDown={onMove}
              onPointerMove={onMove}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(null)}
            />
          </svg>
        )}
        {hover != null && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-40 rounded border border-line-strong bg-raised px-2.5 py-2 text-xs shadow-xl"
            style={{ left: x(hover) > width / 2 ? x(hover) - 180 : x(hover) + 12 }}
          >
            <p className="font-semibold">{t('gold.minute', { n: String(hover) })}</p>
            <p className="text-muted">
              {diff[hover] === 0
                ? t('gold.isEven')
                : t.rich(diff[hover] > 0 ? 'gold.blueBy' : 'gold.redBy', { amount: <span className="num font-medium text-text">{compact(Math.abs(diff[hover]))}</span> })}
            </p>
            {near.map((m, i) => (
              <p key={i} className="mt-0.5 flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: m.teamId === 100 ? 'var(--side-blue)' : 'var(--side-red)' }} />
                {m.type === 'objective' ? objectiveLabel(m) : buildingLabel(m.building)}
              </p>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
