import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { MatchSummary } from '../../../shared/types';
import { assets, champSlug, useStaticData } from '../../lib/ddragon';
import { formatKda, kdaRatio, kdaTone, pct, winRateTone } from '../../lib/format';
import { me } from '../../lib/stats';
import { GameImg, Tooltip } from '../ui/GameImg';
import { RoleIcon, ROLE_LABEL } from '../ui/RoleIcon';
import { EmptyState, Skeleton } from '../ui/States';
import { LineChart } from '../charts/LineChart';

interface Row {
  key: string;
  games: number;
  wins: number;
  k: number;
  d: number;
  a: number;
  cs: number;
  dmg: number;
  gold: number;
  vision: number;
  kp: number;
  share: number;
  minutes: number;
}
const empty = (key: string): Row => ({ key, games: 0, wins: 0, k: 0, d: 0, a: 0, cs: 0, dmg: 0, gold: 0, vision: 0, kp: 0, share: 0, minutes: 0 });

function aggregate(matches: MatchSummary[], puuid: string, keyOf: (m: MatchSummary, p: NonNullable<ReturnType<typeof me>>) => string | null) {
  const map = new Map<string, Row>();
  for (const m of matches) {
    if (m.remake) continue;
    const p = me(m, puuid);
    if (!p) continue;
    const key = keyOf(m, p);
    if (!key) continue;
    const r = map.get(key) ?? empty(key);
    const team = m.participants.filter((x) => x.teamId === p.teamId).reduce((s, x) => s + x.damage, 0);
    r.games++;
    r.wins += p.win ? 1 : 0;
    r.k += p.kills;
    r.d += p.deaths;
    r.a += p.assists;
    r.cs += p.cs;
    r.dmg += p.damage;
    r.gold += p.gold;
    r.vision += p.visionScore;
    r.kp += p.killParticipation;
    r.share += p.damage / Math.max(1, team);
    r.minutes += m.duration / 60;
    map.set(key, r);
  }
  return [...map.values()];
}

type SortKey = 'games' | 'wr' | 'kda' | 'cs' | 'dmg' | 'gold' | 'kp' | 'vision' | 'share';
const value = (r: Row, k: SortKey) =>
  k === 'games'
    ? r.games
    : k === 'wr'
      ? r.wins / r.games
      : k === 'kda'
        ? kdaRatio(r.k, r.d, r.a) === Infinity
          ? 99
          : kdaRatio(r.k, r.d, r.a)
        : k === 'cs'
          ? r.cs / r.minutes
          : k === 'dmg'
            ? r.dmg / r.minutes
            : k === 'gold'
              ? r.gold / r.minutes
              : k === 'kp'
                ? r.kp / r.games
                : k === 'vision'
                  ? r.vision / r.minutes
                  : r.share / r.games;

export function StatsTab({
  matches,
  puuid,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
  onOpenChampion,
}: {
  matches?: MatchSummary[];
  puuid: string;
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onOpenChampion?: (championId: number) => void;
}) {
  if (loading || !matches) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-72" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  const counted = matches.filter((m) => !m.remake && me(m, puuid));
  if (!counted.length) {
    return (
      <div className="panel">
        <EmptyState title="No games to analyse yet">Try another queue filter.</EmptyState>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p>
          Based on the last <span className="num font-semibold text-text">{counted.length}</span> games{matches.length > counted.length ? ' (remakes excluded)' : ''}.
        </p>
        {hasMore && (
          <button onClick={onLoadMore} disabled={loadingMore} className="rounded border border-line-strong px-3 py-1.5 font-medium text-text transition-colors hover:border-gold/60 disabled:opacity-60">
            {loadingMore ? 'Loading…' : 'Include 10 more games'}
          </button>
        )}
      </div>
      <ChampionTable matches={matches} puuid={puuid} onOpen={onOpenChampion} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <RoleTable matches={matches} puuid={puuid} />
        <ActivityCalendar matches={matches} puuid={puuid} />
      </div>
      <Trends matches={matches} puuid={puuid} />
    </div>
  );
}

function SortHeader({ k, sort, setSort, children, className }: { k: SortKey; sort: { k: SortKey; dir: number }; setSort: (s: { k: SortKey; dir: number }) => void; children: React.ReactNode; className?: string }) {
  const active = sort.k === k;
  return (
    <th scope="col" aria-sort={active ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'} className={clsx('px-2 py-2 text-right font-medium', className)}>
      <button onClick={() => setSort(active ? { k, dir: -sort.dir } : { k, dir: -1 })} className={clsx('inline-flex items-center gap-1 hover:text-text', active && 'text-text')}>
        {children}
        {active && (sort.dir > 0 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}
      </button>
    </th>
  );
}

function ChampionTable({ matches, puuid, onOpen }: { matches: MatchSummary[]; puuid: string; onOpen?: (championId: number) => void }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const [sort, setSort] = useState<{ k: SortKey; dir: number }>({ k: 'games', dir: -1 });
  const rows = useMemo(() => aggregate(matches, puuid, (_m, p) => String(p.championId)), [matches, puuid]);
  const sorted = [...rows].sort((x, y) => (value(x, sort.k) - value(y, sort.k)) * sort.dir || y.games - x.games);
  const h = (k: SortKey, label: string, cls?: string) => (
    <SortHeader k={k} sort={sort} setSort={setSort} className={cls}>
      {label}
    </SortHeader>
  );

  return (
    <section className="panel panel-tick overflow-hidden" aria-labelledby="pc-h">
      <h2 id="pc-h" className="panel-title px-4 pt-4">
        Champions played
      </h2>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Per-champion averages, sortable</caption>
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="px-4 py-2 text-left font-medium">
                Champion
              </th>
              {h('games', 'Games')}
              {h('wr', 'Win rate')}
              {h('kda', 'KDA')}
              {h('cs', 'CS/min')}
              {h('dmg', 'Dmg/min')}
              {h('gold', 'Gold/min')}
              {h('kp', 'Kill share')}
              {h('share', 'Dmg share')}
              {h('vision', 'Vision/min', 'pr-4')}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const id = Number(r.key);
              const c = a.champion(id);
              const slug = sd?.champions.get(id)?.id;
              const ratio = kdaRatio(r.k, r.d, r.a);
              const wr = r.wins / r.games;
              return (
                <tr key={r.key} className="fade-up border-t border-line first:border-0 hover:bg-raised" style={{ animationDelay: `${Math.min(i, 12) * 15}ms` }}>
                  <td className="px-4 py-2">
                    {onOpen ? (
                      <button onClick={() => onOpen(id)} className="flex items-center gap-2.5 text-left font-medium hover:text-gold" title={`${c.name}: details and comparison`}>
                        <GameImg src={c.url} alt="" size={30} rounded="md" />
                        {c.name}
                      </button>
                    ) : (
                      <Link to={slug ? `/champions/${champSlug(slug)}` : '#'} className="flex items-center gap-2.5 font-medium hover:text-gold">
                        <GameImg src={c.url} alt="" size={30} rounded="md" />
                        {c.name}
                      </Link>
                    )}
                  </td>
                  <td className="num px-2 text-right">
                    {r.games}
                    <span className="block text-xs text-muted">
                      {r.wins}W {r.games - r.wins}L
                    </span>
                  </td>
                  <td className={clsx('num px-2 text-right font-semibold', winRateTone(wr))}>{pct(wr)}</td>
                  <td className="num px-2 text-right">
                    <span className={clsx('font-semibold', kdaTone(ratio))}>{formatKda(ratio)}</span>
                    <span className="block text-xs text-muted">
                      {(r.k / r.games).toFixed(1)}/{(r.d / r.games).toFixed(1)}/{(r.a / r.games).toFixed(1)}
                    </span>
                  </td>
                  <td className="num px-2 text-right">{(r.cs / r.minutes).toFixed(1)}</td>
                  <td className="num px-2 text-right">{(r.dmg / r.minutes).toFixed(0)}</td>
                  <td className="num px-2 text-right">{(r.gold / r.minutes).toFixed(0)}</td>
                  <td className="num px-2 text-right">{pct(r.kp / r.games)}</td>
                  <td className="num px-2 text-right">{pct(r.share / r.games)}</td>
                  <td className="num px-2 pr-4 text-right">{(r.vision / r.minutes).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoleTable({ matches, puuid }: { matches: MatchSummary[]; puuid: string }) {
  const rows = aggregate(matches, puuid, (_m, p) => p.position || null).sort((x, y) => y.games - x.games);
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.games));
  return (
    <section className="panel p-4" aria-labelledby="pr-h">
      <h2 id="pr-h" className="panel-title">
        By role
      </h2>
      <ul className="mt-3 space-y-2.5">
        {rows.map((r) => {
          const wr = r.wins / r.games;
          const ratio = kdaRatio(r.k, r.d, r.a);
          return (
            <li key={r.key} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm">
              <span className="flex items-center gap-2">
                <RoleIcon role={r.key} size={16} />
                {ROLE_LABEL[r.key]}
              </span>
              <span className="h-2 rounded-full bg-sunken" aria-hidden>
                <span className="grow-x block h-full origin-left rounded-full bg-gold" style={{ width: `${(r.games / max) * 100}%` }} />
              </span>
              <span className="num w-44 text-right text-xs text-muted">
                {r.games} games · <span className={clsx('font-semibold', winRateTone(wr))}>{pct(wr)}</span> · <span className={kdaTone(ratio)}>{formatKda(ratio)}</span> KDA
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Last 8 weeks, one cell per day: how much they played and how it went. */
function ActivityCalendar({ matches, puuid }: { matches: MatchSummary[]; puuid: string }) {
  const days = new Map<string, { w: number; l: number }>();
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  for (const m of matches) {
    const p = me(m, puuid);
    if (!p || m.remake) continue;
    const k = key(new Date(m.startedAt));
    const e = days.get(k) ?? { w: 0, l: 0 };
    p.win ? e.w++ : e.l++;
    days.set(k, e);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - 7 * 8 + 1 - ((today.getDay() + 6) % 7) + 6);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // back to Monday
  const cells: { date: Date; e?: { w: number; l: number } }[] = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) cells.push({ date: new Date(d), e: days.get(key(d)) });
  const max = Math.max(1, ...[...days.values()].map((e) => e.w + e.l));
  const fmt = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' });
  const weeks: (typeof cells)[] = [];
  cells.forEach((c, i) => (weeks[Math.floor(i / 7)] ??= []).push(c));

  return (
    <section className="panel p-4" aria-labelledby="cal-h">
      <div className="flex items-baseline justify-between">
        <h2 id="cal-h" className="panel-title">
          Activity
        </h2>
        <span className="text-xs text-muted">Last 8 weeks of loaded games</span>
      </div>
      <div className="mt-3 flex gap-1" role="img" aria-label="Games played per day over the last eight weeks">
        <div className="mr-1 grid grid-rows-7 gap-1 text-[10px] text-faint" aria-hidden>
          {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((d, i) => (
            <span key={i} className="h-4 leading-4">
              {d}
            </span>
          ))}
        </div>
        {weeks.map((w, wi) => (
          <div key={wi} className="grid grid-rows-7 gap-1">
            {w.map(({ date, e }) => {
              const n = e ? e.w + e.l : 0;
              const wr = e && n ? e.w / n : 0;
              const label = `${fmt.format(date)}: ${n ? `${n} game${n > 1 ? 's' : ''}, ${e!.w}W ${e!.l}L` : 'no games'}`;
              return (
                <Tooltip key={date.toISOString()} content={label}>
                  <span
                    className={clsx('block size-4 rounded-[3px]', !n && 'bg-sunken')}
                    style={n ? { background: `color-mix(in srgb, ${wr >= 0.5 ? 'var(--win)' : 'var(--loss)'} ${25 + (n / max) * 75}%, var(--sunken))` } : undefined}
                  />
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-win" /> Won most games that day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-loss" /> Lost most
        </span>
        <span>Darker = more games</span>
      </p>
    </section>
  );
}

const TREND_METRICS = [
  { id: 'kda', label: 'KDA', fmt: (n: number) => n.toFixed(1) },
  { id: 'cs', label: 'CS per minute', fmt: (n: number) => n.toFixed(1) },
  { id: 'share', label: 'Damage share', fmt: (n: number) => `${Math.round(n * 100)}%` },
  { id: 'kp', label: 'Kill share', fmt: (n: number) => `${Math.round(n * 100)}%` },
  { id: 'vision', label: 'Vision per minute', fmt: (n: number) => n.toFixed(1) },
  { id: 'deaths', label: 'Deaths', fmt: (n: number) => n.toFixed(1) },
] as const;

/** Per-game values with a 5-game rolling average, oldest game on the left. */
function Trends({ matches, puuid }: { matches: MatchSummary[]; puuid: string }) {
  const [metric, setMetric] = useState<(typeof TREND_METRICS)[number]['id']>('kda');
  const def = TREND_METRICS.find((t) => t.id === metric)!;
  const games = [...matches]
    .reverse()
    .flatMap((m) => {
      const p = me(m, puuid);
      return p && !m.remake ? [{ m, p }] : [];
    });
  if (games.length < 5) return null;
  const values = games.map(({ m, p }) => {
    const min = m.duration / 60;
    switch (metric) {
      case 'kda':
        return Math.min(15, (p.kills + p.assists) / Math.max(1, p.deaths));
      case 'cs':
        return p.cs / min;
      case 'share':
        return p.damage / Math.max(1, m.participants.filter((x) => x.teamId === p.teamId).reduce((s, x) => s + x.damage, 0));
      case 'kp':
        return p.killParticipation;
      case 'vision':
        return p.visionScore / min;
      case 'deaths':
        return p.deaths;
    }
  });
  const rolling = values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - 4), i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
  const half = Math.floor(values.length / 2);
  const avg = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / Math.max(1, xs.length);
  const change = avg(values.slice(half)) - avg(values.slice(0, half));
  const better = metric === 'deaths' ? change < 0 : change > 0;

  return (
    <section className="panel p-4" aria-labelledby="trend-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="trend-h" className="panel-title">
            Trends
          </h2>
          <p className="text-xs text-muted">
            Recent half vs earlier half:{' '}
            <span className={clsx('font-semibold', Math.abs(change) < 1e-6 ? 'text-muted' : better ? 'text-win' : 'text-loss')}>
              {change >= 0 ? '+' : '−'}
              {def.fmt(Math.abs(change))}
            </span>
          </p>
        </div>
        <div role="radiogroup" aria-label="Metric" className="flex flex-wrap gap-1 rounded border border-line bg-surface p-1">
          {TREND_METRICS.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={metric === t.id}
              onClick={() => setMetric(t.id)}
              className={clsx('rounded-sm px-2.5 py-1 text-xs font-medium transition-colors', metric === t.id ? 'bg-raised text-text' : 'text-muted hover:text-text')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <LineChart
          key={metric}
          label={`${def.label} per game`}
          format={def.fmt}
          xLabel={(i) => `#${i + 1}`}
          hoverTitle={(i) => `Game ${i + 1} of ${values.length}`}
          tickEvery={Math.max(1, Math.ceil(values.length / 10))}
          series={[
            { id: 'avg', name: '5-game average', color: 'var(--series-1)', values: rolling },
            { id: 'game', name: 'Each game', color: 'var(--faint)', values, dashed: true },
          ]}
        />
      </div>
    </section>
  );
}
