import clsx from 'clsx';
import type { MatchSummary, Participant } from '../../../../shared/types';
import { assets, useStaticData } from '../../../lib/ddragon';
import { compact, pct } from '../../../lib/format';
import { GameImg } from '../../ui/GameImg';
import { laneOpponent, SectionTitle } from './shared';

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
  { id: 'dmg', label: 'Damage to champions', value: (p) => p.damage, fmt: compact, strength: 'Most damage in the game' },
  { id: 'dpm', label: 'Damage per minute', value: (p, m) => per(p.damage, m), fmt: (n) => n.toFixed(0), strength: 'Highest damage per minute' },
  { id: 'share', label: 'Share of team damage', value: (p, m) => p.damage / Math.max(1, teamDamage(p, m)), fmt: (n) => pct(n), strength: 'Carried the team’s damage' },
  { id: 'kp', label: 'Kill share', value: (p) => p.killParticipation, fmt: (n) => pct(n), strength: 'In on the most kills' },
  { id: 'gpm', label: 'Gold per minute', value: (p, m) => per(p.gold, m), fmt: (n) => n.toFixed(0), strength: 'Richest player' },
  { id: 'cspm', label: 'CS per minute', value: (p, m) => per(p.cs, m), fmt: (n) => n.toFixed(1), strength: 'Best farmer' },
  { id: 'cs10', label: 'CS at 10 minutes', value: (p) => p.extra.csAt10, fmt: (n) => n.toFixed(0), strength: 'Best early farm' },
  { id: 'vpm', label: 'Vision per minute', value: (p, m) => per(p.visionScore, m), fmt: (n) => n.toFixed(2), strength: 'Best vision' },
  { id: 'taken', label: 'Damage taken', value: (p) => p.damageTaken, fmt: compact, strength: 'Soaked the most damage' },
  { id: 'mitigated', label: 'Damage mitigated', value: (p) => p.extra.damageMitigated, fmt: compact, strength: 'Toughest frontline' },
  { id: 'heal', label: 'Healing and shields on allies', value: (p) => p.extra.healing + p.extra.shielding, fmt: compact, strength: 'Kept the team alive' },
  { id: 'cc', label: 'Crowd control', value: (p) => p.extra.ccTime, fmt: (n) => `${n.toFixed(0)}s`, strength: 'Most crowd control' },
  { id: 'obj', label: 'Objective damage', value: (p) => p.extra.objectiveDamage, fmt: compact, strength: 'Took the objectives' },
  { id: 'turret', label: 'Turret damage', value: (p) => p.extra.turretDamage, fmt: compact, strength: 'Top tower pusher' },
  { id: 'solo', label: 'Solo kills', value: (p) => p.extra.soloKills, fmt: (n) => String(n), strength: 'Most solo kills' },
  { id: 'plates', label: 'Turret plates', value: (p) => p.extra.turretPlates, fmt: (n) => String(n), strength: 'Most turret plates' },
  { id: 'deaths', label: 'Deaths', value: (p) => p.deaths, fmt: (n) => String(n), strength: 'Fewest deaths', lowerIsBetter: true },
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
            <p className="text-xs text-muted">This player</p>
            <p className="font-display text-lg font-bold leading-tight">{me.name}</p>
          </div>
        </div>
        <span className="font-display text-xl font-bold text-faint">vs</span>
        <div className="flex items-center gap-2.5">
          {them ? <GameImg src={them.url} alt="" size={40} rounded="md" className="ring-2 ring-series-2" /> : <span className="size-10 rounded-md bg-series-2/30 ring-2 ring-series-2" />}
          <div>
            <p className="text-xs text-muted">{opp ? 'Lane opponent' : 'No lane opponent'}</p>
            <p className="font-display text-lg font-bold leading-tight">{them ? them.name : 'Lobby average'}</p>
          </div>
        </div>
        {strengths.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 lg:ml-auto" aria-label="Strengths this game">
            {strengths.map((s) => (
              <li key={s.mt.id} className="rounded-sm border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
                {s.mt.strength}
              </li>
            ))}
          </ul>
        )}
      </div>

      <SectionTitle aside="Bars are scaled to the best value in the game. Rank is out of all players.">Head to head</SectionTitle>
      <table className="w-full text-sm">
        <thead className="sr-only">
          <tr>
            <th>Metric</th>
            <th>{me.name}</th>
            <th>Comparison</th>
            <th>{them ? them.name : 'Lobby average'}</th>
            <th>Rank in game</th>
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
