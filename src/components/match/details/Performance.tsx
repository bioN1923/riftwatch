import clsx from 'clsx';
import type { MatchSummary, Participant } from '../../../../shared/types';
import { assets, useStaticData } from '../../../lib/ddragon';
import { compact, pct } from '../../../lib/format';
import { GameImg } from '../../ui/GameImg';
import { laneOpponent, SectionTitle } from './shared';
import { t } from '../../../i18n';

interface Metric {
  id: string;
  label: string;
  value: (p: Participant, m: MatchSummary) => number;
  fmt: (n: number) => string;
  strength: string; // shown when the player leads the lobby
  lowerIsBetter?: boolean;
}

const per = (n: number, m: MatchSummary) => n / Math.max(1, m.duration / 60);
const teamDamage = (p: Participant, m: MatchSummary) => m.participants.filter((x) => x.teamId === p.teamId).reduce((s, x) => s + x.damage, 0);

const METRICS: Metric[] = [
  { id: 'dmg', get label() { return t('perf.dmg'); }, value: (p) => p.damage, fmt: compact, get strength() { return t('perf.dmg.best'); } },
  { id: 'dpm', get label() { return t('perf.dpm'); }, value: (p, m) => per(p.damage, m), fmt: (n) => n.toFixed(0), get strength() { return t('perf.dpm.best'); } },
  { id: 'share', get label() { return t('perf.share'); }, value: (p, m) => p.damage / Math.max(1, teamDamage(p, m)), fmt: (n) => pct(n), get strength() { return t('perf.share.best'); } },
  { id: 'kp', get label() { return t('perf.kp'); }, value: (p) => p.killParticipation, fmt: (n) => pct(n), get strength() { return t('perf.kp.best'); } },
  { id: 'gpm', get label() { return t('perf.gpm'); }, value: (p, m) => per(p.gold, m), fmt: (n) => n.toFixed(0), get strength() { return t('perf.gpm.best'); } },
  { id: 'cspm', get label() { return t('perf.cspm'); }, value: (p, m) => per(p.cs, m), fmt: (n) => n.toFixed(1), get strength() { return t('perf.cspm.best'); } },
  { id: 'cs10', get label() { return t('perf.cs10'); }, value: (p) => p.extra.csAt10, fmt: (n) => n.toFixed(0), get strength() { return t('perf.cs10.best'); } },
  { id: 'vpm', get label() { return t('perf.vpm'); }, value: (p, m) => per(p.visionScore, m), fmt: (n) => n.toFixed(2), get strength() { return t('perf.vpm.best'); } },
  { id: 'taken', get label() { return t('perf.taken'); }, value: (p) => p.damageTaken, fmt: compact, get strength() { return t('perf.taken.best'); } },
  { id: 'mitigated', get label() { return t('perf.mitigated'); }, value: (p) => p.extra.damageMitigated, fmt: compact, get strength() { return t('perf.mitigated.best'); } },
  { id: 'heal', get label() { return t('perf.heal'); }, value: (p) => p.extra.healing + p.extra.shielding, fmt: compact, get strength() { return t('perf.heal.best'); } },
  { id: 'cc', get label() { return t('perf.cc'); }, value: (p) => p.extra.ccTime, fmt: (n) => t('perf.seconds', { n: n.toFixed(0) }), get strength() { return t('perf.cc.best'); } },
  { id: 'obj', get label() { return t('perf.obj'); }, value: (p) => p.extra.objectiveDamage, fmt: compact, get strength() { return t('perf.obj.best'); } },
  { id: 'turret', get label() { return t('perf.turret'); }, value: (p) => p.extra.turretDamage, fmt: compact, get strength() { return t('perf.turret.best'); } },
  { id: 'solo', get label() { return t('perf.solo'); }, value: (p) => p.extra.soloKills, fmt: (n) => String(n), get strength() { return t('perf.solo.best'); } },
  { id: 'plates', get label() { return t('perf.plates'); }, value: (p) => p.extra.turretPlates, fmt: (n) => String(n), get strength() { return t('perf.plates.best'); } },
  { id: 'deaths', get label() { return t('perf.deaths'); }, value: (p) => p.deaths, fmt: (n) => String(n), get strength() { return t('perf.deaths.best'); }, lowerIsBetter: true },
];

export function Performance({ match, puuid }: { match: MatchSummary; puuid: string }) {
  const { data } = useStaticData();
  const a = assets(data);
  const p = match.participants.find((x) => x.puuid === puuid);
  if (!p) return null;
  const opp = laneOpponent(match, p);
  const ps = match.participants;

  const rows = METRICS.map((mt) => {
    const all = ps.map((x) => mt.value(x, match));
    if (all.every((v) => v === 0)) return null;
    const mine = mt.value(p, match);
    const other = opp ? mt.value(opp, match) : all.reduce((s, v) => s + v, 0) / all.length;
    const sorted = [...all].sort((x, y) => (mt.lowerIsBetter ? x - y : y - x));
    const rank = sorted.indexOf(mine) + 1;
    const max = Math.max(...all, 0.0001);
    return { mt, mine, other, rank, max };
  }).filter(Boolean) as { mt: Metric; mine: number; other: number; rank: number; max: number }[];

  const strengths = rows.filter((r) => r.rank === 1 && !match.remake).slice(0, 4);
  const me = a.champion(p.championId);
  const them = opp ? a.champion(opp.championId) : null;

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2.5">
          <GameImg src={me.url} alt="" size={40} rounded="md" className="ring-2 ring-series-1" />
          <div>
            <p className="text-xs text-muted">{t('perf.thisPlayer')}</p>
            <p className="font-display text-lg font-bold leading-tight">{me.name}</p>
          </div>
        </div>
        <span className="font-display text-xl font-bold text-faint">{t('perf.vs')}</span>
        <div className="flex items-center gap-2.5">
          {them ? <GameImg src={them.url} alt="" size={40} rounded="md" className="ring-2 ring-series-2" /> : <span className="size-10 rounded-md bg-series-2/30 ring-2 ring-series-2" />}
          <div>
            <p className="text-xs text-muted">{opp ? t('perf.laneOpp') : t('perf.noLaneOpp')}</p>
            <p className="font-display text-lg font-bold leading-tight">{them ? them.name : t('perf.lobbyAvg')}</p>
          </div>
        </div>
        {strengths.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 lg:ml-auto" aria-label={t('perf.strengths')}>
            {strengths.map((s) => (
              <li key={s.mt.id} className="rounded-sm border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
                {s.mt.strength}
              </li>
            ))}
          </ul>
        )}
      </div>

      <SectionTitle aside={t('perf.headNote')}>{t('perf.head')}</SectionTitle>
      <table className="w-full text-sm">
        <thead className="sr-only">
          <tr>
            <th>{t('perf.metric')}</th>
            <th>{me.name}</th>
            <th>{t('perf.comparison')}</th>
            <th>{them ? them.name : t('perf.lobbyAvg')}</th>
            <th>{t('perf.rank')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ mt, mine, other, rank, max }) => {
            const better = mt.lowerIsBetter ? mine < other : mine > other;
            return (
              <tr key={mt.id} className="border-t border-line first:border-t-0">
                <th scope="row" className="w-[34%] py-1.5 pr-3 text-left font-normal text-muted">
                  {mt.label}
                </th>
                <td className={clsx('num w-16 py-1.5 pr-2 text-right', better ? 'font-semibold text-text' : 'text-muted')}>{mt.fmt(mine)}</td>
                <td className="py-1.5">
                  <div className="flex items-center gap-[2px]" aria-hidden>
                    <div className="flex h-2 flex-1 justify-end">
                      <span className="grow-x h-full origin-right rounded-l-[2px] bg-series-1" style={{ width: `${(mine / max) * 100}%` }} />
                    </div>
                    <div className="flex h-2 flex-1">
                      <span className="grow-x h-full origin-left rounded-r-[2px] bg-series-2" style={{ width: `${(other / max) * 100}%` }} />
                    </div>
                  </div>
                </td>
                <td className={clsx('num w-16 py-1.5 pl-2', !better ? 'font-semibold text-text' : 'text-muted')}>{mt.fmt(other)}</td>
                <td className="w-14 py-1.5 text-right">
                  <span className={clsx('num rounded-sm px-1.5 py-px text-xs font-semibold', rank === 1 ? 'bg-gold text-gold-ink' : rank <= 3 ? 'bg-raised text-text' : 'text-faint')}>#{rank}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
