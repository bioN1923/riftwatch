import { Link } from 'react-router';
import clsx from 'clsx';
import type { Mastery, MatchSummary } from '../../../shared/types';
import { GameImg } from '../ui/GameImg';
import { Skeleton } from '../ui/States';
import { RoleIcon, ROLE_LABEL } from '../ui/RoleIcon';
import { assets, champSlug, useStaticData } from '../../lib/ddragon';
import { compact, formatKda, kdaRatio, kdaTone, pct, winRateTone } from '../../lib/format';
import { me, result, type Overview } from '../../lib/stats';
import { profilePath } from '../../lib/riotId';
import { t } from '../../i18n';

const ROLES = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];

/** A short written read of recent games — the summary a coach would give, not a wall of numbers. */
export function ScoutingReport({ ov, matches, puuid, name }: { ov?: Overview; matches?: MatchSummary[]; puuid: string; name: string }) {
  const { data } = useStaticData();
  const a = assets(data);
  if (!ov || !matches) {
    return (
      <div className="panel panel-tick space-y-2 p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }
  if (!ov.games) return null;

  const g = ov.games;
  const ratio = kdaRatio(ov.kills, ov.deaths, ov.assists);
  const roleEntries = ROLES.map((r) => [r, ov.roles[r] ?? 0] as const).sort((x, y) => y[1] - x[1]);
  const [mainRole, mainCount] = roleEntries[0];
  const roleGames = roleEntries.reduce((s, [, n]) => s + n, 0);
  const comfort = ov.champions[0];
  const comfortName = comfort ? a.champion(comfort.championId).name : '';

  let best: { m: MatchSummary; score: number } | null = null;
  for (const m of matches) {
    const p = me(m, puuid);
    if (p && !m.remake && (!best || p.score > best.score)) best = { m, score: p.score };
  }
  const bestP = best ? me(best.m, puuid)! : null;

  const lines: React.ReactNode[] = [];
  if (roleGames) {
    lines.push(
      mainCount / roleGames >= 0.6 ? (
        <>{t.rich('report.mainRole', { role: <b>{ROLE_LABEL[mainRole]}</b>, count: mainCount, total: roleGames })}</>
      ) : (
        <>{t.rich('report.flexRole', { role: <b>{ROLE_LABEL[mainRole]}</b>, count: mainCount, total: roleGames })}</>
      ),
    );
  }
  if (comfort && comfort.games >= 2) {
    lines.push(
      <>{t.rich('report.mostPlayed', { champion: <b>{comfortName}</b>, count: comfort.games, wins: comfort.wins })}</>,
    );
  }
  lines.push(
    <>
      {t.rich('report.averages', {
        kda: (
          <b className="num">
            {(ov.kills / g).toFixed(1)} / {(ov.deaths / g).toFixed(1)} / {(ov.assists / g).toFixed(1)}
          </b>
        ),
        kp: pct(ov.kp),
      })}
    </>,
  );
  if (bestP && best) {
    lines.push(
      <>
        {t.rich('report.best', {
          kda: (
            <b className="num">
              {bestP.kills}/{bestP.deaths}/{bestP.assists}
            </b>
          ),
          champion: a.champion(bestP.championId).name,
          link: (
            <a href={`#m-${best.m.id}`} className="underline decoration-line-strong underline-offset-2 hover:text-text">
              {t('report.seeGame')}
            </a>
          ),
        })}
      </>,
    );
  }

  const wr = ov.wins / g;
  return (
    <section className="panel panel-tick p-4" aria-labelledby="report-h">
      <h2 id="report-h" className="panel-title">
        {t('report.title')}
      </h2>
      <p className="text-xs text-muted">{t(matches.some((m) => m.remake) ? 'report.subRemakes' : 'report.sub', { name, count: g })}</p>

      <div className="mt-4 flex items-end gap-5">
        <div>
          <p className={clsx('display-num text-5xl font-extrabold leading-none', wr >= 0.5 ? 'text-win' : 'text-loss')}>{Math.round(wr * 100)}%</p>
          <p className="num mt-1 text-xs text-muted">{t('report.wonLost', { wins: ov.wins, losses: ov.losses })}</p>
        </div>
        <div>
          <p className={clsx('display-num text-3xl font-bold leading-none', kdaTone(ratio))}>{formatKda(ratio)}</p>
          <p className="mt-1 text-xs text-muted">{t('common.kda')}</p>
        </div>
        {roleGames > 0 && (
          <div className="ml-auto flex items-end gap-1.5" role="group" aria-label={t('report.perPosition')}>
            {ROLES.map((r) => {
              const n = ov.roles[r] ?? 0;
              return (
                <div key={r} className="flex flex-col items-center gap-1" title={`${ROLE_LABEL[r]}: ${n}`}>
                  <div className="flex h-10 w-2.5 items-end overflow-hidden rounded-sm bg-sunken">
                    <div className="w-full bg-gold" style={{ height: `${(n / Math.max(1, mainCount)) * 100}%` }} />
                  </div>
                  <RoleIcon role={r} size={13} className={n ? 'text-text' : 'text-faint'} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ul className="mt-4 space-y-2 border-t border-line pt-3 text-sm leading-snug text-muted [&_b]:font-semibold [&_b]:text-text">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[7px] size-1 shrink-0 rotate-45 bg-gold" aria-hidden />
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ChampionPool({ ov, loading, onOpen }: { ov?: Overview; loading: boolean; onOpen?: (championId: number) => void }) {
  const { data } = useStaticData();
  const a = assets(data);
  return (
    <section className="panel" aria-labelledby="champ-h">
      <h2 id="champ-h" className="panel-title px-4 pt-3.5">
        {t('pool.title')}
      </h2>
      <ul className="mt-1 pb-2">
        {loading &&
          Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2">
              <Skeleton className="size-9" />
              <Skeleton className="h-4 flex-1" />
            </li>
          ))}
        {ov?.champions.slice(0, 6).map((c, _i, top) => {
          const champ = a.champion(c.championId);
          // Bar length follows how much they play it (vs their most-played here); green/red inside is the record.
          // A one-game 100% no longer fills the whole bar like a 20-game main does.
          const most = Math.max(...top.map((x) => x.games));
          const ratio = kdaRatio(c.kills, c.deaths, c.assists);
          const wr = c.wins / c.games;
          return (
            <li key={c.championId}>
              <button
                onClick={() => onOpen?.(c.championId)}
                className="group grid w-full grid-cols-[36px_1fr_auto] items-center gap-3 px-4 py-1.5 text-left text-sm transition-colors hover:bg-raised"
                title={t('pool.details', { champion: champ.name })}
              >
              <GameImg src={champ.url} alt="" size={36} rounded="md" />
              <div className="min-w-0">
                <span className="block truncate font-medium group-hover:text-gold">{champ.name}</span>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken" role="img" aria-label={t('common.winsLossesAria', { wins: c.wins, losses: c.games - c.wins })}>
                  <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${Math.max(8, (c.games / most) * 100)}%` }}>
                    <span className="bg-win" style={{ width: `${wr * 100}%` }} />
                    <span className="flex-1 bg-loss/70" />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={clsx('num text-sm font-semibold', winRateTone(wr, c.games))}>
                  {pct(wr)} <span className="font-normal text-muted">({c.games})</span>
                </p>
                <p className={clsx('num text-xs', kdaTone(ratio))}>{t('common.kdaValue', { value: formatKda(ratio) })}</p>
              </div>
              </button>
            </li>
          );
        })}
        {ov && ov.champions.length === 0 && <li className="px-4 py-3 text-sm text-muted">{t('pool.empty')}</li>}
      </ul>
    </section>
  );
}

export function PlayedWith({ ov, platform }: { ov?: Overview; platform: string }) {
  if (!ov || ov.duos.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="duo-h">
      <h2 id="duo-h" className="panel-title px-4 pt-3.5">
        {t('duo.title')}
      </h2>
      <ul className="mt-1 pb-2">
        {ov.duos.map((d) => {
          const wr = d.wins / d.games;
          return (
            <li key={d.puuid}>
              <Link to={profilePath(platform, d)} className="flex items-center gap-3 px-4 py-1.5 text-sm hover:bg-raised">
                <span className="min-w-0 flex-1 truncate">
                  {d.gameName}
                  <span className="text-faint">#{d.tagLine}</span>
                </span>
                <span className="num text-xs text-muted">{t('common.games', { count: d.games })}</span>
                <span className={clsx('num w-10 text-right font-semibold', winRateTone(wr, d.games))}>{pct(wr)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function MasteryList({ mastery }: { mastery: Mastery[] }) {
  const { data } = useStaticData();
  const a = assets(data);
  if (!mastery.length) return null;
  const top = mastery.slice(0, 5);
  return (
    <section className="panel" aria-labelledby="mastery-h">
      <h2 id="mastery-h" className="panel-title px-4 pt-3.5">
        {t('mastery.title')}
      </h2>
      <ul className="flex justify-between gap-2 px-4 pb-4 pt-3">
        {top.map((m) => {
          const champ = a.champion(m.championId);
          return (
            <li key={m.championId}>
              <Link to={data?.champions.get(m.championId) ? `/champions/${champSlug(data.champions.get(m.championId)!.id)}` : '#'} className="group flex flex-col items-center gap-1 text-center">
                <GameImg src={champ.url} alt={champ.name} size={40} rounded="full" className="ring-1 ring-line-strong transition-transform duration-150 group-hover:-translate-y-0.5" tip={t('mastery.tip', { champion: champ.name, level: m.championLevel })} />
                <span className="num font-display text-base font-bold leading-none group-hover:text-gold">{compact(m.championPoints)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Used by the match list's day headers. */
export function dayRecord(matches: MatchSummary[], puuid: string) {
  let w = 0;
  let l = 0;
  let played = 0;
  // How the day ended: the run of same results at its latest games (matches come newest first; remakes skipped).
  let end = null as { r: 'win' | 'loss'; n: number } | null;
  let open = true;
  for (const m of matches) {
    const p = me(m, puuid);
    if (!p) continue;
    const r = result(m, p);
    played += m.duration;
    if (r === 'win') w++;
    else if (r === 'loss') l++;
    if (r !== 'win' && r !== 'loss') continue;
    if (open && (!end || end.r === r)) end = { r, n: (end?.n ?? 0) + 1 };
    else open = false;
  }
  return { w, l, played, end };
}
