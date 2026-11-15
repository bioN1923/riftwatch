import { Benchmarks, MAX_GOALS, useGoals, type MetricId } from './Insights';
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, Target } from 'lucide-react';
import type { MatchSummary } from '../../../shared/types';
import { assets, champSlug, useStaticData } from '../../lib/ddragon';
import { compact, decimal, duration as fmtDuration, formatKda, kdaRatio, kdaTone, multikill, pct, timeAgo, winRateTone } from '../../lib/format';
import { me } from '../../lib/stats';
import { winConditions, type WinCondition } from '../../lib/winConditions';
import { laneOpponents } from '../../lib/laneOpponents';
import { sessions, type Split } from '../../lib/sessions';
import { personalRecords, type PersonalRecord } from '../../lib/records';
import { GameImg, Tooltip } from '../ui/GameImg';
import { RoleIcon, ROLE_LABEL } from '../ui/RoleIcon';
import { EmptyState, Skeleton } from '../ui/States';
import { LineChart } from '../charts/LineChart';
import { langInfo, t } from '../../i18n';

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
        <EmptyState title={t('stats.empty')}>{t('stats.emptyBody')}</EmptyState>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p>
          {t.rich(matches.length > counted.length ? 'stats.basedOnRemakes' : 'stats.basedOn', { count: <span className="num font-semibold text-text">{counted.length}</span> })}
        </p>
        {hasMore && (
          <button onClick={onLoadMore} disabled={loadingMore} className="rounded border border-line-strong px-3 py-1.5 font-medium text-text transition-colors hover:border-gold/60 disabled:opacity-60">
            {loadingMore ? t('common.loading') : t('stats.more')}
          </button>
        )}
      </div>
      <Benchmarks matches={matches} puuid={puuid} />
      <WinConditions matches={matches} puuid={puuid} />
      <Sittings matches={matches} puuid={puuid} />
      <ChampionTable matches={matches} puuid={puuid} onOpen={onOpenChampion} />
      <LaneOpponents matches={matches} puuid={puuid} />
      <Records matches={matches} puuid={puuid} />
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
      <button onClick={() => setSort(active ? { k, dir: -sort.dir } : { k, dir: -1 })} className={clsx('-my-1 inline-flex min-h-[24px] min-w-[24px] items-center gap-1 py-1 hover:text-text', active && 'text-text')}>
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
        {t('stats.champions')}
      </h2>
      <div className="mt-2 overflow-x-auto">
        {/* Phones: champion, games, win rate and KDA; the per-minute columns from sm up. */}
        <table className="w-full text-sm sm:min-w-[760px]">
          <caption className="sr-only">{t('stats.championsCaption')}</caption>
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="px-4 py-2 text-left font-medium">
                {t('stats.champion')}
              </th>
              {h('games', t('stats.col.games'))}
              {h('wr', t('stats.col.wr'))}
              {h('kda', t('stats.col.kda'))}
              {h('cs', t('stats.col.cs'), 'hidden sm:table-cell')}
              {h('dmg', t('stats.col.dmg'), 'hidden sm:table-cell')}
              {h('gold', t('stats.col.gold'), 'hidden sm:table-cell')}
              {h('kp', t('stats.col.kp'), 'hidden sm:table-cell')}
              {h('share', t('stats.col.share'), 'hidden sm:table-cell')}
              {h('vision', t('stats.col.vision'), 'hidden pr-4 sm:table-cell')}
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
                      <button onClick={() => onOpen(id)} className="flex items-center gap-2.5 text-left font-medium hover:text-gold" title={t('pool.details', { champion: c.name })}>
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
                      {t('common.wins', { count: r.wins })} {t('common.losses', { count: r.games - r.wins })}
                    </span>
                  </td>
                  <td className={clsx('num px-2 text-right font-semibold', winRateTone(wr, r.games))}>{pct(wr)}</td>
                  <td className="num px-2 text-right">
                    <span className={clsx('font-semibold', kdaTone(ratio))}>{formatKda(ratio)}</span>
                    <span className="block text-xs text-muted">
                      {(r.k / r.games).toFixed(1)}/{(r.d / r.games).toFixed(1)}/{(r.a / r.games).toFixed(1)}
                    </span>
                  </td>
                  <td className="num hidden px-2 text-right sm:table-cell">{(r.cs / r.minutes).toFixed(1)}</td>
                  <td className="num hidden px-2 text-right sm:table-cell">{(r.dmg / r.minutes).toFixed(0)}</td>
                  <td className="num hidden px-2 text-right sm:table-cell">{(r.gold / r.minutes).toFixed(0)}</td>
                  <td className="num hidden px-2 text-right sm:table-cell">{pct(r.kp / r.games)}</td>
                  <td className="num hidden px-2 text-right sm:table-cell">{pct(r.share / r.games)}</td>
                  <td className="num hidden px-2 pr-4 text-right sm:table-cell">{(r.vision / r.minutes).toFixed(2)}</td>
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
        {t('stats.byRole')}
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
                {t.rich('stats.roleLine', {
                  games: t('common.games', { count: r.games }),
                  rate: <span className={clsx('font-semibold', winRateTone(wr, r.games))}>{pct(wr)}</span>,
                  kda: <span className={kdaTone(ratio)}>{formatKda(ratio)}</span>,
                })}
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
  const fmt = new Intl.DateTimeFormat(langInfo().intl, { weekday: 'short', month: 'short', day: 'numeric' });
  // Weekday initials in the current language, Monday first (5 Jan 2026 was a Monday).
  const wd = new Intl.DateTimeFormat(langInfo().intl, { weekday: 'short' });
  const dayNames = [0, 2, 4, 6].map((i) => wd.format(new Date(2026, 0, 5 + i)));
  const weeks: (typeof cells)[] = [];
  cells.forEach((c, i) => (weeks[Math.floor(i / 7)] ??= []).push(c));

  return (
    <section className="panel p-4" aria-labelledby="cal-h">
      <div className="flex items-baseline justify-between">
        <h2 id="cal-h" className="panel-title">
          {t('stats.activity')}
        </h2>
        <span className="text-xs text-muted">{t('stats.activitySub')}</span>
      </div>
      <div className="mt-3 flex gap-1" role="img" aria-label={t('stats.activityAria')}>
        <div className="mr-1 grid grid-rows-7 gap-1 text-[10px] text-faint" aria-hidden>
          {[dayNames[0], '', dayNames[1], '', dayNames[2], '', dayNames[3]].map((d, i) => (
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
              const label = n ? t('stats.dayGames', { date: fmt.format(date), games: t('common.games', { count: n }), wins: t('common.wins', { count: e!.w }), losses: t('common.losses', { count: e!.l }) }) : t('stats.dayNone', { date: fmt.format(date) });
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
          <span className="size-3 rounded-[3px] bg-win" /> {t('stats.legendWin')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-loss" /> {t('stats.legendLoss')}
        </span>
        <span>{t('stats.legendDark')}</span>
      </p>
    </section>
  );
}

const TREND_METRICS = [
  { id: 'kda', fmt: (n: number) => n.toFixed(1) },
  { id: 'cs', fmt: (n: number) => n.toFixed(1) },
  { id: 'share', fmt: (n: number) => pct(n) },
  { id: 'kp', fmt: (n: number) => pct(n) },
  { id: 'vision', fmt: (n: number) => n.toFixed(1) },
  { id: 'deaths', fmt: (n: number) => n.toFixed(1) },
] as const;
const metricLabel = (id: (typeof TREND_METRICS)[number]['id']) => t(`metric.${id}`);

/** Per-game values with a 5-game rolling average, oldest game on the left. */
function Trends({ matches, puuid }: { matches: MatchSummary[]; puuid: string }) {
  const [metric, setMetric] = useState<(typeof TREND_METRICS)[number]['id']>('kda');
  const def = TREND_METRICS.find((m) => m.id === metric)!;
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
            {t('stats.trends')}
          </h2>
          <p className="text-xs text-muted">
            {t('stats.trendCompare')}{' '}
            <span className={clsx('font-semibold', Math.abs(change) < 1e-6 ? 'text-muted' : better ? 'text-win' : 'text-loss')}>
              {change >= 0 ? '+' : '−'}
              {def.fmt(Math.abs(change))}
            </span>
          </p>
        </div>
        <div role="radiogroup" aria-label={t('stats.metric')} className="flex flex-wrap gap-1 rounded border border-line bg-surface p-1">
          {TREND_METRICS.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={metric === m.id}
              onClick={() => setMetric(m.id)}
              className={clsx('min-h-[24px] rounded-sm px-2.5 py-1 text-xs font-medium transition-colors', metric === m.id ? 'bg-raised text-text' : 'text-muted hover:text-text')}
            >
              {metricLabel(m.id)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <LineChart
          key={metric}
          label={t('stats.perGame', { metric: metricLabel(def.id) })}
          format={def.fmt}
          xLabel={(i) => `#${i + 1}`}
          hoverTitle={(i) => t('stats.gameOf', { n: i + 1, total: values.length })}
          tickEvery={Math.max(1, Math.ceil(values.length / 10))}
          series={[
            { id: 'avg', name: t('stats.avg5'), color: 'var(--series-1)', values: rolling },
            { id: 'game', name: t('stats.eachGame'), color: 'var(--faint)', values, dashed: true },
          ]}
        />
      </div>
    </section>
  );
}

/** "What your wins have in common": the stats whose usual value splits wins from losses best. */
function WinConditions({ matches, puuid }: { matches: MatchSummary[]; puuid: string }) {
  const games = matches.filter((m) => !m.remake && me(m, puuid)).length;
  if (games < 10) return null;
  const list = winConditions(matches, puuid).slice(0, 3);
  const [goals, setGoals] = useGoals(puuid);
  const [added, setAdded] = useState<string | null>(null);
  const overview = useLocation().pathname.replace(/\/stats$/, '');
  // Phrased for the side the wins are on: "5 deaths or fewer", or "under 1.3 vision score a minute".
  const cond = (c: WinCondition) => {
    const n = c.metric === 'cs' || c.metric === 'vision' ? decimal(c.at, 1) : c.metric === 'kp' || c.metric === 'share' ? pct(c.at) : c.at;
    return t(`wc.${c.metric}${c.flip ? 'Flip' : ''}` as 'wc.deaths', { n });
  };
  const rec = (x: { w: number; l: number }) => `${x.w}–${x.l} · ${pct(x.w / Math.max(1, x.w + x.l))}`;
  return (
    <section className="panel p-4" aria-labelledby="wc-h">
      <h2 id="wc-h" className="panel-title">
        {t('wc.title')}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{t('wc.lead', { count: games })}</p>
      {list.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t('wc.none')}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {list.map((c) => (
            <li key={c.metric} className="grid gap-x-4 gap-y-0.5 sm:grid-cols-[minmax(0,1fr)_auto]">
              <span className={clsx('text-sm font-medium', !c.sure && 'text-muted')}>
                {cond(c)}
                {!c.sure && <span className="ml-2 text-[11px] font-normal text-faint">{t('wc.leaning')}</span>}
              </span>
              <span className="num flex flex-wrap items-center gap-x-1 text-xs text-muted sm:justify-end">
                <GoalButton c={c} goals={goals} onAdd={(g) => (setGoals([...goals, g]), setAdded(c.metric))} />
                <span className="text-win">{rec(c.when)}</span>
                <span className="text-faint"> · {t('wc.otherwise')} </span>
                <span className="text-loss">{rec(c.otherwise)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {added && (
        <p className="mt-3 text-xs text-muted" role="status">
          {t.rich('wc.goalAdded', { link: <Link to={overview} className="text-gold hover:underline">{t('wc.goalOverview')}</Link> })}
        </p>
      )}
    </section>
  );
}

/** Which conditions map onto a goal metric: same stat, the "wins" side is the goal side. */
const GOAL_OF: Partial<Record<string, MetricId>> = { cs: 'cs', deaths: 'deaths', vision: 'vision', kp: 'kp' };

/** "Make it a goal": the condition's cut-off becomes the target (at most, for deaths). */
function GoalButton({ c, goals, onAdd }: { c: WinCondition; goals: { metric: MetricId; target: number }[]; onAdd: (g: { metric: MetricId; target: number }) => void }) {
  const id = GOAL_OF[c.metric];
  if (!id || c.flip) return null;
  const has = goals.some((g) => g.metric === id);
  const full = goals.length >= MAX_GOALS;
  return (
    <button
      type="button"
      disabled={has || full}
      onClick={() => onAdd({ metric: id, target: c.at })}
      title={has ? t('wc.goalHas') : full ? t('wc.goalFull', { n: MAX_GOALS }) : undefined}
      className="mr-2 inline-flex min-h-[24px] items-center gap-1 rounded border border-line px-2 text-[11px] font-medium text-muted hover:border-gold/60 hover:text-text disabled:cursor-default disabled:opacity-60 disabled:hover:border-line disabled:hover:text-muted"
    >
      <Target className="size-3" aria-hidden />
      {has ? t('wc.goalHas') : t('wc.goalMake')}
    </button>
  );
}

/** How results go within a sitting: right after a win or a loss, and early or late in a long sitting. */
function Sittings({ matches, puuid }: { matches: MatchSummary[]; puuid: string }) {
  const s = useMemo(() => sessions(matches, puuid), [matches, puuid]);
  if (s.games < 10 || (!s.afterResult && !s.early)) return null;
  const rec = (x: { w: number; l: number }) => `${x.w}–${x.l} · ${pct(x.w / Math.max(1, x.w + x.l))}`;
  // `gap` is first side minus second; `worse` names the second side doing worse.
  const verdict = (sp: Split, key: 'after' | 'late') => {
    if (sp.verdict === 'same') return t(`ses.${key}Same`);
    const second = sp.gap > 0 ? 'Worse' : 'Better';
    return t(`ses.${key}${second}${sp.verdict === 'sure' ? '' : 'Lean'}` as 'ses.afterWorse');
  };
  const row = (sp: Split, key: 'after' | 'late', la: string, lb: string) => (
    <li className="grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto]">
      <span className={clsx('text-sm font-medium', sp.verdict !== 'sure' && 'text-muted')}>{verdict(sp, key)}</span>
      <span className="num flex flex-wrap items-center gap-x-1 text-xs text-muted sm:justify-end">
        <span>{la}</span> <span className={winRateTone(sp.a.w / (sp.a.w + sp.a.l), sp.a.w + sp.a.l)}>{rec(sp.a)}</span>
        <span className="text-faint"> · </span>
        <span>{lb}</span> <span className={winRateTone(sp.b.w / (sp.b.w + sp.b.l), sp.b.w + sp.b.l)}>{rec(sp.b)}</span>
      </span>
    </li>
  );
  return (
    <section className="panel p-4" aria-labelledby="ses-h">
      <h2 id="ses-h" className="panel-title">
        {t('ses.title')}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{t('ses.lead', { count: s.sessions, games: s.games })}</p>
      <ul className="mt-3 space-y-2.5">
        {s.afterResult && row(s.afterResult, 'after', t('ses.afterWin'), t('ses.afterLoss'))}
        {s.early && row(s.early, 'late', t('ses.early'), t('ses.late'))}
      </ul>
    </section>
  );
}

/** Best single games among the loaded ones, each linking to that game in the match list. */
function Records({ matches, puuid }: { matches: MatchSummary[]; puuid: string }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const list = useMemo(() => personalRecords(matches, puuid), [matches, puuid]);
  const overview = useLocation().pathname.replace(/\/stats$/, '');
  if (list.length < 3) return null;
  const value = (r: PersonalRecord) =>
    r.id === 'kda'
      ? r.p.deaths === 0
        ? t('rec.perfect')
        : formatKda(r.value)
      : r.id === 'damage'
        ? compact(r.value)
        : r.id === 'cspm' || r.id === 'vision'
          ? decimal(r.value, 1)
          : r.id === 'multi'
            ? multikill(r.value)
            : r.id === 'length'
              ? fmtDuration(r.value)
              : String(r.value);
  return (
    <section className="panel p-4" aria-labelledby="rec-h">
      <h2 id="rec-h" className="panel-title">
        {t('rec.title')}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{t('rec.lead')}</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((r) => {
          const c = a.champion(r.p.championId);
          return (
            <li key={r.id}>
              <Link to={`${overview}#m-${r.match.id}`} className="flex h-full items-center gap-2.5 rounded border border-line bg-surface p-2.5 transition-colors hover:border-gold/60 hover:bg-raised">
                <GameImg src={c.url} alt="" size={36} rounded="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-[11px] text-muted">{t(`rec.${r.id}` as 'rec.kills')}</span>
                  <span className="num block font-display text-lg font-bold leading-tight">{value(r)}</span>
                  <span className="block truncate text-[11px] text-faint">
                    <span className={r.p.win ? 'text-win' : 'text-loss'}>{r.p.win ? t('result.win') : t('result.loss')}</span> · {c.name} · {timeAgo(r.match.startedAt)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Who they meet in lane most often, with their record against each (any champion they played). */
function LaneOpponents({ matches, puuid }: { matches: MatchSummary[]; puuid: string }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const { list, games } = laneOpponents(matches, puuid);
  if (games < 5 || !list.length) return null;
  return (
    <section className="panel p-4" aria-labelledby="opp-h">
      <h2 id="opp-h" className="panel-title">
        {t('stats.oppTitle')}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{t('stats.oppLead', { count: games })}</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {list.slice(0, 8).map((o) => {
          const c = a.champion(o.championId);
          const wr = o.wins / o.games;
          return (
            <li key={o.championId} className="flex items-center gap-2.5 rounded border border-line px-2.5 py-2">
              <GameImg src={c.url} alt="" size={30} rounded="md" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{c.name}</span>
                <span className="num block text-xs text-muted">
                  {o.wins}–{o.games - o.wins} · <span className={clsx('font-semibold', winRateTone(wr, o.games))}>{pct(wr)}</span>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
