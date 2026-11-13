import clsx from 'clsx';
import type { LaneCurve as LaneCurveData } from '../../../shared/types';
import { t } from '../../i18n';

/** Signed lead with a real minus sign; anything that rounds to zero is just "0" (no sign, neutral colour). */
function signed(v: number, digits: number) {
  const r = Number(v.toFixed(digits));
  if (r === 0) return { text: '0', sign: 0 };
  return { text: `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(digits)}`, sign: Math.sign(r) };
}
const tone = (sign: number) => (sign > 0 ? 'var(--win)' : sign < 0 ? 'var(--loss)' : 'var(--muted)');

/** Gold and CS lead at 5, 10 and 15 minutes as two small line charts (matchup page and champion page). */
export function LaneCurve({ lane, sub, note, id = 'mu-lane-h' }: { lane: LaneCurveData; sub: string; note?: string; id?: string }) {
  const chart = (label: string, values: number[], digits: number) => {
    const max = Math.max(1, ...values.map(Math.abs));
    const W = 400;
    const H = 120;
    const x = (i: number) => 32 + (i * (W - 64)) / (values.length - 1);
    const y = (v: number) => H / 2 - (v / max) * (H / 2 - 24);
    const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
    const end = signed(values.at(-1) ?? 0, digits);
    const pts = values.map((v) => signed(v, digits));
    return (
      <figure className="min-w-0">
        <figcaption className="flex items-baseline justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className={clsx('num font-semibold', end.sign > 0 ? 'text-win' : end.sign < 0 ? 'text-loss' : 'text-muted')}>{end.text} @15</span>
        </figcaption>
        <svg viewBox={`0 0 ${W} ${H + 18}`} className="mt-1 w-full" role="img" aria-label={`${label}: ${values.map((_, i) => `${lane.minutes[i]} min ${pts[i].text}`).join(', ')}`}>
          <line x1="12" x2={W - 12} y1={H / 2} y2={H / 2} stroke="var(--line-strong)" strokeDasharray="3 3" />
          <path d={path} fill="none" stroke={tone(end.sign)} strokeWidth="2.5" strokeLinejoin="round" />
          {values.map((v, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(v)} r="4" fill={tone(pts[i].sign)} />
              <text x={x(i)} y={y(v) + (v >= 0 ? -9 : 17)} textAnchor="middle" className="num" fontSize="12" fill="var(--muted)">
                {pts[i].text}
              </text>
              <text x={x(i)} y={H + 14} textAnchor="middle" fontSize="12" fill="var(--faint)">
                {t('mp.minute', { n: lane.minutes[i] })}
              </text>
            </g>
          ))}
        </svg>
      </figure>
    );
  };
  return (
    <section className="panel p-5" aria-labelledby={id}>
      <h2 id={id} className="panel-title">
        {t('mp.laneTitle')}
      </h2>
      <p className="text-xs text-muted">{sub}</p>
      {note && <p className="mt-1 text-xs text-faint">{note}</p>}
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {chart(t('mp.laneGold'), lane.gold, 0)}
        {chart(t('mp.laneCs'), lane.cs, 1)}
      </div>
    </section>
  );
}
