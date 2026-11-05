import { useState } from 'react';
import clsx from 'clsx';
import type { MatchSummary, TimelineFrame } from '../../../../shared/types';
import { assets, useStaticData } from '../../../lib/ddragon';
import { compact } from '../../../lib/format';
import { LineChart, type Series } from '../../charts/LineChart';
import { laneOpponent, SectionTitle, TimelineGate, useTimeline } from './shared';
import { t } from '../../../i18n';

const METRICS = [
  { id: 'gold', fmt: compact },
  { id: 'cs', fmt: (n: number) => n.toFixed(0) },
  { id: 'xp', fmt: compact },
  { id: 'damage', fmt: compact },
] as const;
type MetricId = (typeof METRICS)[number]['id'];
const metricName = (id: MetricId) => t(`met.${id}`);

export function Metrics({ match, puuid, platform }: { match: MatchSummary; puuid: string; platform: string }) {
  const q = useTimeline(platform, match.id);
  const { data } = useStaticData();
  const a = assets(data);
  const [metric, setMetric] = useState<MetricId>('gold');
  const p = match.participants.find((x) => x.puuid === puuid)!;
  const opp = laneOpponent(match, p);
  const def = METRICS.find((m) => m.id === metric)!;

  return (
    <div className="space-y-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label={t('perf.metric')} className="flex flex-wrap gap-1 rounded border border-line bg-surface p-1">
          {METRICS.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={metric === m.id}
              onClick={() => setMetric(m.id)}
              className={clsx('rounded-sm px-3 py-1 text-sm font-medium transition-colors', metric === m.id ? 'bg-raised text-text' : 'text-muted hover:text-text')}
            >
              {metricName(m.id)}
            </button>
          ))}
        </div>
      </div>
      <TimelineGate q={q}>
        {() => {
          const tl = q.data!;
          const i = tl.puuids.indexOf(puuid);
          const j = opp ? tl.puuids.indexOf(opp.puuid) : -1;
          const pick = (f: TimelineFrame, k: number) => f[metric][k] ?? 0;
          const avg = (f: TimelineFrame) => f[metric].reduce((s, v) => s + v, 0) / Math.max(1, f[metric].length);
          const series: Series[] = [
            { id: 'me', name: a.champion(p.championId).name, color: 'var(--series-1)', values: tl.frames.map((f) => pick(f, i)) },
            ...(j >= 0 ? [{ id: 'opp', name: a.champion(opp!.championId).name, color: 'var(--series-2)', values: tl.frames.map((f) => pick(f, j)) }] : []),
            { id: 'avg', name: t('perf.lobbyAvg'), color: 'var(--faint)', values: tl.frames.map(avg), dashed: true },
          ];
          const at = (min: number) => tl.frames[Math.min(min, tl.frames.length - 1)];
          const leadAt = (min: number, key: keyof Omit<TimelineFrame, 'minute'>) => (j >= 0 && tl.frames.length > min ? at(min)[key][i] - at(min)[key][j] : null);

          return (
            <>
              {j >= 0 && (
                <section>
                  <SectionTitle aside={t('met.vsChamp', { champion: a.champion(opp!.championId).name })}>{t('met.laneLeads')}</SectionTitle>
                  <div className="grid grid-cols-3 gap-px overflow-hidden rounded border border-line bg-line text-center">
                    {[10, 15, 20].map((min) => (
                      <div key={min} className="bg-surface px-3 py-2.5">
                        <p className="text-xs text-muted">{t('met.atMin', { min })}</p>
                        {tl.frames.length > min ? (
                          <div className="mt-1 flex justify-center gap-4 text-sm">
                            <Lead label={t('met.leadGold')} v={leadAt(min, 'gold')} fmt={compact} />
                            <Lead label={t('met.leadCs')} v={leadAt(min, 'cs')} fmt={(n) => n.toFixed(0)} />
                            <Lead label={t('met.leadXp')} v={leadAt(min, 'xp')} fmt={compact} />
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-faint">{t('met.ended')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <section>
                <SectionTitle>{t('met.overTime', { metric: metricName(def.id) })}</SectionTitle>
                <LineChart series={series} format={def.fmt} label={t('met.perMinute', { metric: metricName(def.id) })} />
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-muted hover:text-text">{t('met.table')}</summary>
                  <div className="mt-2 max-h-64 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-surface text-left text-muted">
                        <tr>
                          <th className="py-1 pr-3 font-medium">{t('met.minute')}</th>
                          {series.map((s) => (
                            <th key={s.id} className="py-1 pr-3 text-right font-medium">
                              {s.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tl.frames.map((f, k) => (
                          <tr key={k} className="border-t border-line">
                            <td className="num py-1 pr-3">{f.minute}</td>
                            {series.map((s) => (
                              <td key={s.id} className="num py-1 pr-3 text-right">
                                {def.fmt(s.values[k])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </section>
            </>
          );
        }}
      </TimelineGate>
    </div>
  );
}

function Lead({ label, v, fmt }: { label: string; v: number | null; fmt: (n: number) => string }) {
  if (v == null) return null;
  return (
    <span>
      <span className={clsx('num font-display text-lg font-bold', v > 0 ? 'text-win' : v < 0 ? 'text-loss' : 'text-muted')}>
        {v > 0 ? '+' : v < 0 ? '−' : '±'}
        {fmt(Math.abs(v))}
      </span>{' '}
      <span className="text-xs text-muted">{label}</span>
    </span>
  );
}
