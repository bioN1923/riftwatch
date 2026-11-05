import { Link } from 'react-router';
import clsx from 'clsx';
import type { MatchSummary, Participant, TeamSummary } from '../../../../shared/types';
import { assets, useStaticData } from '../../../lib/ddragon';
import { compact, formatKda, kdaRatio, kdaTone, pct, thousands } from '../../../lib/format';
import { profilePath } from '../../../lib/riotId';
import { GameImg } from '../../ui/GameImg';
import { Items, SpellsRunes } from '../Loadout';
import { Badge, ordinal } from '../MatchRow';
import { t } from '../../../i18n';

interface Group {
  key: string;
  title: string;
  win: boolean;
  team?: TeamSummary;
  players: Participant[];
}

function groups(m: MatchSummary): Group[] {
  const arena = m.participants.some((p) => p.subteam);
  if (arena) {
    const by = new Map<number, Participant[]>();
    for (const p of m.participants) by.set(p.subteam!, [...(by.get(p.subteam!) ?? []), p]);
    return [...by.values()]
      .sort((a, b) => (a[0].placement ?? 9) - (b[0].placement ?? 9))
      .map((players) => ({ key: String(players[0].subteam), title: players[0].placement ? ordinal(players[0].placement) : t('pg.team'), win: players[0].win, players }));
  }
  return m.teams.map((team) => ({
    key: String(team.teamId),
    title: t(team.teamId === 100 ? 'pg.blueSide' : 'pg.redSide', { result: m.remake ? t('result.remake') : team.win ? t('pg.victory') : t('pg.defeat') }),
    win: team.win,
    team,
    players: m.participants.filter((p) => p.teamId === team.teamId),
  }));
}

export function PostGame({ match, puuid, platform }: { match: MatchSummary; puuid: string; platform: string }) {
  const { data } = useStaticData();
  const a = assets(data);
  const maxDamage = Math.max(1, ...match.participants.map((p) => p.damage));
  const maxTaken = Math.max(1, ...match.participants.map((p) => p.damageTaken));
  const minutes = match.duration / 60;
  const gs = groups(match);
  const blue = match.teams.find((t) => t.teamId === 100);
  const red = match.teams.find((t) => t.teamId === 200);

  return (
    <div>
      {blue && red && !match.participants.some((p) => p.subteam) && <TeamCompare blue={blue} red={red} />}
      <div className="@container overflow-x-auto overflow-y-hidden">
        {gs.map((g) => (
          <table key={g.key} className="w-full min-w-[580px] table-fixed border-collapse text-xs">
            <caption className="sr-only">{g.title}</caption>
            <thead>
              <tr className={clsx('text-left text-muted', g.win ? 'bg-win-tint' : 'bg-loss-tint')}>
                <th scope="col" className="py-2 pl-3 font-display text-base font-bold">
                  <span className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                    {g.team && <span className={clsx('size-2 rounded-full', g.team.teamId === 100 ? 'bg-side-blue' : 'bg-side-red')} aria-hidden />}
                    <span className={clsx('truncate', g.win ? 'text-win' : 'text-loss')}>{g.title}</span>
                  </span>
                </th>
                <th scope="col" className="w-[104px] px-2 font-medium">
                  {t('pg.kda')}
                </th>
                <th scope="col" className="w-[112px] px-2 font-medium">
                  {t('pg.damage')}
                </th>
                <th scope="col" className="hidden w-[52px] px-2 text-right font-medium @[680px]:table-cell">
                  {t('pg.gold')}
                </th>
                <th scope="col" className="w-[60px] px-2 text-right font-medium">
                  {t('pg.cs')}
                </th>
                <th scope="col" className="hidden w-[56px] px-2 text-right font-medium @[740px]:table-cell">
                  {t('pg.wards')}
                </th>
                <th scope="col" className="w-[170px] px-2 pr-3 font-medium">
                  {t('pg.items')}
                </th>
              </tr>
            </thead>
            <tbody>
              {g.players.map((p) => {
                const c = a.champion(p.championId);
                const ratio = kdaRatio(p.kills, p.deaths, p.assists);
                const self = p.puuid === puuid;
                return (
                  <tr key={p.puuid + p.championId} className={clsx('border-t border-line', self && 'bg-raised')}>
                    <td className="py-1.5 pl-3 pr-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <div className="relative shrink-0">
                          <GameImg src={c.url} alt={c.name} size={32} rounded="full" />
                          <span className="num absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-bg text-[10px] ring-1 ring-line-strong">
                            {p.champLevel}
                          </span>
                        </div>
                        <span className="shrink-0">
                          <SpellsRunes p={p} a={a} size={15} />
                        </span>
                        <div className="ml-1 min-w-0 flex-1">
                          {self ? (
                            <span className="block truncate font-semibold" title={`${p.gameName}#${p.tagLine}`}>
                              {p.gameName}
                            </span>
                          ) : (
                            <Link to={profilePath(platform, p)} title={`${p.gameName}#${p.tagLine}`} className="block truncate hover:underline">
                              {p.gameName}
                            </Link>
                          )}
                          <span className="block truncate text-faint">#{p.tagLine}</span>
                        </div>
                      </div>
                    </td>
                    <td className="num px-2">
                      <span className="block whitespace-nowrap">
                        {p.kills}/{p.deaths}/{p.assists} <span className="text-muted">({pct(p.killParticipation)})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className={clsx('font-semibold', kdaTone(ratio))}>{formatKda(ratio)}</span>
                        {!match.remake && (
                          <span className="text-muted" title={t('pg.score')}>
                            {p.score.toFixed(1)}
                          </span>
                        )}
                        <Badge p={p} />
                      </span>
                    </td>
                    <td className="px-2">
                      <div className="flex w-24 items-center gap-1.5" title={t('pg.dmgDealt', { value: thousands(p.damage) })}>
                        <span className="num w-10 text-right">{compact(p.damage)}</span>
                        <span className="h-1.5 flex-1 rounded-full bg-sunken">
                          <span className="block h-full rounded-full bg-loss" style={{ width: `${(p.damage / maxDamage) * 100}%` }} />
                        </span>
                      </div>
                      <div className="mt-1 flex w-24 items-center gap-1.5" title={t('pg.dmgTaken', { value: thousands(p.damageTaken) })}>
                        <span className="num w-10 text-right text-muted">{compact(p.damageTaken)}</span>
                        <span className="h-1.5 flex-1 rounded-full bg-sunken">
                          <span className="block h-full rounded-full bg-faint" style={{ width: `${(p.damageTaken / maxTaken) * 100}%` }} />
                        </span>
                      </div>
                    </td>
                    <td className="num hidden px-2 text-right @[680px]:table-cell">{compact(p.gold)}</td>
                    <td className="num px-2 text-right">
                      {p.cs}
                      <span className="block text-muted">{t('pg.perMin', { value: (p.cs / minutes).toFixed(1) })}</span>
                    </td>
                    <td className="num hidden px-2 text-right @[740px]:table-cell" title={t('pg.wardsTip')}>
                      {p.visionScore}
                      <span className="block text-muted">
                        {p.wardsPlaced} · {p.controlWards}
                      </span>
                    </td>
                    <td className="px-2 pr-3">
                      <Items items={p.items} size={19} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}

function TeamCompare({ blue, red }: { blue: TeamSummary; red: TeamSummary }) {
  const rows: { label: string; b: number; r: number; fmt?: (n: number) => string }[] = [
    { label: t('pg.kills'), b: blue.kills, r: red.kills },
    { label: t('pg.gold'), b: blue.gold, r: red.gold, fmt: compact },
  ];
  const objectives: [string, keyof TeamSummary['objectives']][] = [
    [t('pg.towers'), 'tower'],
    [t('pg.dragons'), 'dragon'],
    [t('pg.barons'), 'baron'],
    [t('pg.voidgrubs'), 'grubs'],
    [t('pg.heralds'), 'herald'],
  ];
  return (
    <div className="grid gap-3 border-b border-line px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
      <div className="space-y-1.5">
        {rows.map(({ label, b, r, fmt }) => {
          const total = Math.max(1, b + r);
          return (
            <div key={label} className="flex items-center gap-3 text-xs">
              <span className="num w-10 text-right font-semibold text-side-blue">{fmt ? fmt(b) : b}</span>
              <div className="relative flex h-4 flex-1 overflow-hidden rounded-sm" role="img" aria-label={t('pg.barAria', { label, b, r })}>
                <span className="bg-side-blue" style={{ width: `${(b / total) * 100}%` }} />
                <span className="flex-1 bg-side-red" />
                <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold text-on-accent">{label}</span>
              </div>
              <span className="num w-10 font-semibold text-side-red">{fmt ? fmt(r) : r}</span>
            </div>
          );
        })}
      </div>
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted md:justify-end">
        {objectives.map(([label, k]) => (
          <div key={k} className="flex items-center gap-1.5">
            <dt>{label}</dt>
            <dd className="num font-semibold">
              <span className="text-side-blue">{blue.objectives[k]}</span>
              <span className="text-faint"> : </span>
              <span className="text-side-red">{red.objectives[k]}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
