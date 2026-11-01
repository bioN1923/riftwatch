import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import type { ChampionStats, Rated, StatsGroup } from '../../shared/types';
import { api, ApiClientError } from '../lib/api';
import { assets, championBySlug, champSlug, useChampionDetail, useStaticData, type ChampionDetail } from '../lib/ddragon';
import { formatKda, kdaTone, pct, thousands } from '../lib/format';
import { profilePath } from '../lib/riotId';
import { getPlatform } from '../../shared/regions';
import { GameImg, Tooltip } from '../components/ui/GameImg';
import { ROLE_LABEL } from '../components/ui/RoleIcon';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { Tip } from '../components/match/Loadout';
import { ItemRow, MaxOrder, RuneTrees, SkillGrid } from '../components/build/BuildParts';
import { GroupToggle, PatchSelect, RoleTab, TierBadge, WinRateBar } from '../components/champions/common';
import { fadeIn } from '../lib/motion';

export function ChampionPage() {
  const { slug = '' } = useParams();
  const { data: sd, isPending } = useStaticData();
  const champ = championBySlug(sd, slug);

  if (isPending) return <HeroSkeleton />;
  if (!champ) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState
          page
          title="Champion not found"
          error={new ApiClientError(404, 'NOT_FOUND', `There’s no champion called “${slug}”.`)}
          action={
            <Link to="/champions" className="rounded bg-gold px-4 py-2 font-semibold text-gold-ink">
              Browse all champions
            </Link>
          }
        />
      </div>
    );
  }
  return <ChampionView key={champ.key} championId={champ.key} />;
}

function ChampionView({ championId }: { championId: number }) {
  const [params, setParams] = useSearchParams();
  const group: StatsGroup = params.get('queue') === 'aram' ? 'aram' : 'ranked';
  const role = params.get('role') ?? undefined;
  const patch = params.get('patch') ?? undefined;
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const info = sd?.champions.get(championId);
  const detail = useChampionDetail(sd, championId).data;

  const q = useQuery({
    queryKey: ['champion', championId, group, role, patch],
    queryFn: ({ signal }) => api.champion(championId, { group, role, patch }, signal),
    staleTime: 60_000,
  });
  const s = q.data;

  useEffect(() => {
    if (info) document.title = `${info.name} build, runes and stats — Riftwatch`;
  }, [info]);

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null) next.delete(k);
    else next.set(k, v);
    if (k === 'queue') next.delete('role');
    setParams(next, { replace: true });
  };

  const abilityIcons = detail?.spells.map((x) => x.icon);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <img
            key={championId}
            src={a.fullSplash(championId)}
            alt=""
            {...fadeIn('splash')}
            className="h-full w-full object-cover object-[70%_20%] opacity-50"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-surface/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-0 pt-8">
          <Link to="/champions" className="text-sm text-muted hover:text-text">
            ← Tier list
          </Link>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-5">
              <GameImg src={a.champion(championId).url} alt="" size={84} rounded="md" className="ring-1 ring-line-strong" />
              <div>
                <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">{info?.name}</h1>
                <p className="mt-1 text-muted first-letter:uppercase">{info?.title}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(detail?.tags ?? info?.tags ?? []).map((t) => (
                    <span key={t} className="rounded-sm border border-line-strong px-1.5 py-px text-xs text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PatchSelect patches={s?.patches ?? []} value={s?.patch ?? null} onChange={(p) => set('patch', p)} />
              <GroupToggle value={group} onChange={(g) => set('queue', g === 'ranked' ? null : g)} />
            </div>
          </div>

          <StatStrip s={s} loading={q.isPending} />
          <CountersStrip s={s} />
          {detail && <Abilities detail={detail} />}

          {group === 'ranked' && s && s.roles.length > 0 && (
            <div role="tablist" aria-label="Role" className="mt-6 flex gap-5 overflow-x-auto">
              {s.roles.map((r) => (
                <RoleTab key={r.role} role={r.role} active={s.role === r.role} onClick={() => set('role', r.role)}>
                  {ROLE_LABEL[r.role] ?? r.role}
                  <span className="num text-xs text-faint">{pct(r.share)}</span>
                </RoleTab>
              ))}
            </div>
          )}
          {!(group === 'ranked' && s && s.roles.length > 0) && <div className="h-6" />}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {q.isPending ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Skeleton className="h-96" />
            <Skeleton className="h-72" />
          </div>
        ) : q.isError ? (
          <ErrorState error={q.error} />
        ) : !s?.summary ? (
          <div className="panel">
            <EmptyState title={`No ${group === 'aram' ? 'ARAM' : 'ranked'} games with ${info?.name} yet`}>
              Stats appear once the server has read games with this champion. Check back soon, or try the other queue.
            </EmptyState>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-5">
              <BuildPanel s={s} abilityIcons={abilityIcons} />
              {group === 'ranked' && <Matchups s={s} />}
              {group === 'ranked' && <Synergy s={s} />}
              <LengthChart rows={s.byLength} />
            </div>
            <aside className="space-y-5 lg:sticky lg:top-[72px] lg:self-start">
              <Averages s={s} />
              <TopPlayers s={s} />
              {detail && <BaseStats d={detail} />}
              {detail?.blurb && (
                <section className="panel p-4">
                  <h2 className="panel-title">Lore</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{detail.blurb}</p>
                </section>
              )}
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

function StatStrip({ s, loading }: { s?: ChampionStats; loading: boolean }) {
  if (loading) return <Skeleton className="mt-6 h-14 w-full max-w-2xl" />;
  const sum = s?.summary;
  if (!sum) return <div className="mt-6" />;
  const items: [string, string, string?][] = [
    ['Win rate', pct(sum.winRate, 1), sum.winRate >= 0.5 ? 'text-win' : 'text-loss'],
    ['Pick rate', pct(sum.pickRate, 1)],
    ['Ban rate', pct(sum.banRate, 1)],
    ['Games', thousands(sum.games)],
  ];
  return (
    <dl className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-3">
      <div>
        <dt className="text-xs text-muted">Tier</dt>
        <dd className="mt-1">
          <TierBadge tier={sum.tier} size="lg" />
        </dd>
      </div>
      {items.map(([label, value, tone]) => (
        <div key={label} className="border-l border-line pl-8 first-of-type:border-0">
          <dt className="text-xs text-muted">{label}</dt>
          <dd className={clsx('display-num mt-0.5 text-4xl font-extrabold leading-none', tone)}>{value}</dd>
        </div>
      ))}
      {sum.lowSample && <p className="text-xs text-faint">Small sample — numbers will settle as more games come in.</p>}
    </dl>
  );
}

function Abilities({ detail }: { detail: ChampionDetail }) {
  const list = [{ key: 'Passive', name: detail.passive.name, description: detail.passive.description, cooldown: '', icon: detail.passive.icon }, ...detail.spells];
  return (
    <ul className="mt-6 flex flex-wrap gap-2" aria-label="Abilities">
      {list.map((sp) => (
        <li key={sp.key}>
          <Tooltip
            content={
              <>
                <span className="block font-semibold">
                  {sp.name} <span className="font-normal text-muted">({sp.key})</span>
                </span>
                {sp.cooldown && <span className="block text-gold">Cooldown {sp.cooldown}s</span>}
                <span className="mt-0.5 block text-muted">{sp.description.length > 260 ? `${sp.description.slice(0, 257)}…` : sp.description}</span>
              </>
            }
          >
            <span className="relative block">
              <GameImg src={sp.icon} alt={`${sp.key}: ${sp.name}`} size={42} rounded="md" className="ring-1 ring-line-strong transition-transform duration-150 hover:-translate-y-0.5" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-sm bg-bg px-1 font-display text-[11px] font-bold leading-tight text-gold">
                {sp.key === 'Passive' ? 'P' : sp.key}
              </span>
            </span>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}

const LOW_SAMPLE = 10;

/** Win rate plus how many games back it. Small samples are shown muted, since "100% over 2 games" means nothing. */
function Rate({ r, className, share }: { r: Rated; className?: string; share?: number }) {
  const low = r.games < LOW_SAMPLE;
  return (
    <span className={clsx('num shrink-0 text-right text-xs', className)} title={low ? `Only ${r.games} game${r.games === 1 ? '' : 's'} so far` : undefined}>
      <span className={clsx('block text-sm font-semibold', low ? 'text-faint' : r.winRate >= 0.5 ? 'text-win' : 'text-loss')}>
        {pct(r.winRate, 1)}
        {low && <span aria-hidden>*</span>}
      </span>
      <span className="text-faint">
        {share != null ? `${pct(share)} · ` : ''}
        {thousands(r.games)} game{r.games === 1 ? '' : 's'}
      </span>
    </span>
  );
}

function Block({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {aside && <span className="text-xs text-muted">{aside}</span>}
      </div>
      {children}
    </div>
  );
}

function BuildPanel({ s, abilityIcons }: { s: ChampionStats; abilityIcons?: string[] }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const [page, setPage] = useState(0);
  const rune = s.runes[page] ?? s.runes[0];

  return (
    <section className="panel panel-tick p-5" aria-labelledby="build-h">
      <h2 id="build-h" className="panel-title text-2xl">
        Recommended build
      </h2>
      <p className="text-xs text-muted">The most played choices, with how often they win.</p>
      {s.summary && s.summary.games < 50 && (
        <p className="mt-3 rounded border border-kda-great/40 bg-kda-great/10 px-3 py-2 text-sm">
          Early numbers: built from {s.summary.games} game{s.summary.games === 1 ? '' : 's'} so far. Win rates marked * have fewer than {LOW_SAMPLE} games behind them and will
          settle as more games come in.
        </p>
      )}

      <div className="mt-5 space-y-7">
        {rune && (
          <Block
            title="Runes"
            aside={
              s.runes.length > 1 && (
                <span role="tablist" aria-label="Rune pages" className="flex gap-1">
                  {s.runes.map((r, i) => (
                    <button
                      key={i}
                      role="tab"
                      aria-selected={page === i}
                      onClick={() => setPage(i)}
                      className={clsx('rounded-sm px-2 py-1 transition-colors', page === i ? 'bg-raised text-text' : 'text-muted hover:text-text')}
                    >
                      <span className="flex items-center gap-1.5">
                        <GameImg src={a.rune(r.primary[0]).url} alt="" size={16} rounded="full" />
                        <span className="num">{pct(r.winRate)}</span>
                      </span>
                    </button>
                  ))}
                </span>
              )
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <RuneTrees key={page} primaryStyle={rune.primaryStyle} secondaryStyle={rune.secondaryStyle} picked={[...rune.primary, ...rune.secondary]} shards={rune.shards} />
              <Rate r={rune} />
            </div>
          </Block>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {s.spells.length > 0 && (
            <Block title="Summoner spells">
              <ul className="space-y-2">
                {s.spells.map((sp, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="flex gap-1">
                      {sp.ids.map((id) => {
                        const x = a.spell(id);
                        return <GameImg key={id} src={x.url} alt={x.name} size={32} rounded="sm" tip={x.name ? <Tip title={x.name} body={x.description} /> : undefined} />;
                      })}
                    </span>
                    <Rate r={sp} />
                  </li>
                ))}
              </ul>
            </Block>
          )}
          {s.starting.length > 0 && (
            <Block title="Starting items">
              <ul className="space-y-2">
                {s.starting.map((st, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <ItemRow ids={st.ids} />
                    <Rate r={st} />
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>

        <ItemsBlock s={s} />

        {s.skills.path.length > 0 && (
          <Block
            title="Skill order"
            aside={
              <span className="flex items-center gap-2">
                Max <MaxOrder order={s.skills.order.split('').map((k) => 'QWE'.indexOf(k) + 1)} icons={abilityIcons} />
              </span>
            }
          >
            <SkillGrid skills={s.skills.path} icons={abilityIcons} />
            {s.skills.maxOrders.length > 1 && (
              <p className="mt-2 text-xs text-muted">
                Max orders:{' '}
                {s.skills.maxOrders.map((m, i) => (
                  <span key={m.order}>
                    {i > 0 && ' · '}
                    <span className="font-semibold text-text">{m.order.split('').join(' > ')}</span> {pct(m.winRate)} ({thousands(m.games)})
                  </span>
                ))}
              </p>
            )}
          </Block>
        )}
      </div>
    </section>
  );
}

const ORDINAL: Record<number, string> = { 4: '4th', 5: '5th', 6: '6th' };

function ItemName({ id }: { id: number }) {
  const { data: sd } = useStaticData();
  return <>{assets(sd).item(id).name || `Item ${id}`}</>;
}

/** Core build, boots and late-game options, laid out the way a game actually goes. */
function ItemsBlock({ s }: { s: ChampionStats }) {
  const [more, setMore] = useState(false);
  const core = s.core[0];
  return (
    <Block title="Items" aside={s.coreTotal ? `${thousands(s.coreTotal)} games with three or more completed items` : undefined}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="rounded border border-line bg-raised/40 p-4">
          <p className="mb-3 text-xs font-medium text-muted">Core build — first three completed items, in buying order</p>
          {core ? (
            <div className="flex flex-wrap items-end justify-between gap-4">
              <ol className="flex items-start gap-2">
                {core.ids.map((id, i) => (
                  <li key={`${id}-${i}`} className="flex items-start gap-2">
                    <span className="flex w-[76px] flex-col items-center gap-1.5 text-center">
                      <ItemRow ids={[id]} size={48} />
                      <span className="line-clamp-2 text-[11px] leading-tight text-muted">
                        <ItemName id={id} />
                      </span>
                    </span>
                    {i < core.ids.length - 1 && <span className="mt-4 text-faint" aria-hidden>›</span>}
                  </li>
                ))}
              </ol>
              <Rate r={core} share={s.coreTotal ? core.games / s.coreTotal : undefined} />
            </div>
          ) : (
            <p className="text-sm text-muted">No game has reached three completed items yet.</p>
          )}
          {s.core.length > 1 && (
            <div className="mt-3 border-t border-line pt-2">
              <button onClick={() => setMore((v) => !v)} aria-expanded={more} className="text-xs font-medium text-gold hover:underline">
                {more ? 'Hide other core builds' : `Show ${s.core.length - 1} other core build${s.core.length > 2 ? 's' : ''}`}
              </button>
              {more && (
                <ul className="fade-up mt-2 space-y-2">
                  {s.core.slice(1).map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <ItemRow ids={c.ids} size={30} arrows />
                      <Rate r={c} share={s.coreTotal ? c.games / s.coreTotal : undefined} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="rounded border border-line bg-raised/40 p-4">
          <p className="mb-3 text-xs font-medium text-muted">Boots</p>
          {s.boots.length ? (
            <ul className="space-y-2.5">
              {s.boots.map((b) => (
                <OptionRow key={b.id} o={b} share={s.bootsTotal ? b.games / s.bootsTotal : undefined} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No boots data yet.</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[4, 5, 6].map((slot) => {
          const l = s.later.find((x) => x.slot === slot);
          return (
            <div key={slot} className="rounded border border-line p-4">
              <p className="mb-3 flex items-baseline justify-between text-xs font-medium text-muted">
                {ORDINAL[slot]} item
                {l?.total ? <span className="font-normal text-faint">{thousands(l.total)} games</span> : null}
              </p>
              {l && l.options.length ? (
                <ul className="space-y-2.5">
                  {l.options.map((o) => (
                    <OptionRow key={o.id} o={o} share={l.total ? o.games / l.total : undefined} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No game has reached a {ORDINAL[slot]} item yet.</p>
              )}
            </div>
          );
        })}
      </div>
    </Block>
  );
}

function OptionRow({ o, share }: { o: Rated & { id: number }; share?: number }) {
  const low = o.games < LOW_SAMPLE;
  return (
    <li className="flex items-start gap-2.5">
      <ItemRow ids={[o.id]} size={32} />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 break-words text-[13px] leading-tight">
          <ItemName id={o.id} />
        </span>
        <span className="num mt-0.5 block text-xs text-faint" title={low ? `Only ${o.games} game${o.games === 1 ? '' : 's'} so far` : undefined}>
          <span className={clsx('font-semibold', low ? 'text-faint' : o.winRate >= 0.5 ? 'text-win' : 'text-loss')}>
            {pct(o.winRate, 1)}
            {low && '*'}
          </span>
          {' · '}
          {share != null ? `${pct(share)} pick · ` : ''}
          {thousands(o.games)}
        </span>
      </span>
    </li>
  );
}

type Matchup = ChampionStats['matchups'][number];

/** Matchups with enough games to mean something, best and worst ranked by adjusted win rate. */
function laneMatchups(s: ChampionStats) {
  const min = Math.max(2, Math.round((s.summary?.games ?? 0) * 0.01));
  const usable = s.matchups.filter((m) => m.games >= min);
  const easiest = usable.filter((m) => m.adjusted >= 0.5).sort((a, b) => b.adjusted - a.adjusted);
  const hardest = usable.filter((m) => m.adjusted < 0.5).sort((a, b) => a.adjusted - b.adjusted);
  return { usable, easiest, hardest };
}

function champLink(sd: ReturnType<typeof useStaticData>['data'], id: number, role: string) {
  const slug = sd?.champions.get(id)?.id;
  return slug ? `/champions/${champSlug(slug)}?role=${role}` : '#';
}

/** The headline answer: who beats this champion in lane, and who it beats. */
function CountersStrip({ s }: { s?: ChampionStats }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  if (!s || s.group !== 'ranked' || !s.summary) return null;
  const { hardest, easiest } = laneMatchups(s);
  if (!hardest.length && !easiest.length) return null;
  const group = (label: string, list: Matchup[], tone: 'win' | 'loss') => (
    <div className="min-w-0">
      <p className={clsx('mb-1.5 text-xs font-medium', tone === 'loss' ? 'text-loss' : 'text-win')}>{label}</p>
      {list.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {list.slice(0, 5).map((m) => {
            const c = a.champion(m.championId);
            return (
              <li key={m.championId}>
                <Link
                  to={champLink(sd, m.championId, s.role)}
                  className={clsx('group flex items-center gap-2 rounded border bg-surface/70 py-1 pl-1 pr-2.5 backdrop-blur transition-colors hover:bg-raised', tone === 'loss' ? 'border-loss/40' : 'border-win/40')}
                  title={`${pct(m.winRate, 1)} win rate against ${c.name} over ${m.games} game${m.games === 1 ? '' : 's'}`}
                >
                  <GameImg src={c.url} alt="" size={28} rounded="sm" />
                  <span className="text-sm font-medium group-hover:text-gold">{c.name}</span>
                  <span className={clsx('num text-xs font-semibold', m.games < LOW_SAMPLE ? 'text-faint' : tone === 'loss' ? 'text-loss' : 'text-win')}>{pct(m.winRate)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">Not enough games yet.</p>
      )}
    </div>
  );
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {group('Countered by', hardest, 'loss')}
      {group('Strong against', easiest, 'win')}
    </div>
  );
}

const MU_TABS = [
  { id: 'hard', label: 'Hardest' },
  { id: 'easy', label: 'Easiest' },
  { id: 'all', label: 'All' },
] as const;
type MuSort = 'winRate' | 'games' | 'goldDiff15' | 'csDiff15' | 'xpDiff15';

function Lead({ v, unit }: { v: number | null; unit: string }) {
  if (v == null) return <span className="text-faint">–</span>;
  const r = Math.round(v);
  return (
    <span className={clsx(r > 0 ? 'text-win' : r < 0 ? 'text-loss' : 'text-muted')}>
      {r > 0 ? '+' : r < 0 ? '−' : '±'}
      {Math.abs(r)}
      {unit}
    </span>
  );
}

/** Lane matchups: win rate and early leads against every opponent in the same role. */
function Matchups({ s }: { s: ChampionStats }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const [tab, setTab] = useState<(typeof MU_TABS)[number]['id']>('hard');
  const [sort, setSort] = useState<{ k: MuSort; dir: 1 | -1 }>({ k: 'games', dir: -1 });
  const { usable, easiest, hardest } = laneMatchups(s);
  if (!s.matchups.length) return null;

  const list =
    tab === 'hard'
      ? hardest.slice(0, 10)
      : tab === 'easy'
        ? easiest.slice(0, 10)
        : [...s.matchups].sort((x, y) => (((x[sort.k] ?? -1e9) as number) - ((y[sort.k] ?? -1e9) as number)) * sort.dir || y.games - x.games);
  const head = (k: MuSort, label: string) =>
    tab === 'all' ? (
      <button onClick={() => setSort((v) => (v.k === k ? { k, dir: (v.dir * -1) as 1 | -1 } : { k, dir: -1 }))} className={clsx('hover:text-text', sort.k === k && 'text-text')}>
        {label}
        {sort.k === k ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}
      </button>
    ) : (
      label
    );

  return (
    <section className="panel p-5" aria-labelledby="mu-h">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="mu-h" className="panel-title text-2xl">
            Lane matchups
          </h2>
          <p className="text-xs text-muted">
            {s.summary ? `${ROLE_LABEL[s.role] ?? s.role} vs the enemy ${ROLE_LABEL[s.role]?.toLowerCase() ?? 'laner'}. ` : ''}Leads are averages at 15 minutes.
          </p>
        </div>
        <div role="tablist" aria-label="Matchup list" className="flex rounded border border-line bg-surface p-0.5">
          {MU_TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={clsx('rounded-sm px-3 py-1 text-sm font-medium transition-colors', tab === t.id ? 'bg-raised text-text' : 'text-muted hover:text-text')}
            >
              {t.label}
              {t.id === 'all' && <span className="num ml-1 text-xs text-faint">{s.matchups.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {usable.length === 0 ? 'Not enough games against any single opponent yet. Check the All tab, or come back once more games are collected.' : tab === 'hard' ? 'No losing matchups so far.' : 'No winning matchups so far.'}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table key={tab} className="fade-in w-full min-w-[560px] text-sm">
            <caption className="sr-only">Lane matchups</caption>
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-2 text-left font-medium">
                  Opponent
                </th>
                <th scope="col" className="px-2 text-right font-medium">
                  {head('winRate', 'Win rate')}
                </th>
                <th scope="col" className="px-2 text-right font-medium">
                  {head('games', 'Games')}
                </th>
                <th scope="col" className="px-2 text-right font-medium">
                  {head('goldDiff15', 'Gold @15')}
                </th>
                <th scope="col" className="px-2 text-right font-medium">
                  {head('csDiff15', 'CS @15')}
                </th>
                <th scope="col" className="pl-2 text-right font-medium">
                  {head('xpDiff15', 'XP @15')}
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const c = a.champion(m.championId);
                const low = m.games < LOW_SAMPLE;
                return (
                  <tr key={m.championId} className="border-b border-line/60 last:border-0 hover:bg-raised">
                    <td className="py-1.5 pr-2">
                      <Link to={champLink(sd, m.championId, s.role)} className="group flex items-center gap-2.5">
                        <GameImg src={c.url} alt="" size={30} rounded="md" />
                        <span className="font-medium group-hover:text-gold">{c.name}</span>
                      </Link>
                    </td>
                    <td className="num px-2 text-right">
                      <span className="inline-flex items-center gap-2">
                        <WinRateBar value={m.winRate} />
                        <span className={clsx('w-12 font-semibold', low ? 'text-faint' : m.winRate >= 0.5 ? 'text-win' : 'text-loss')} title={low ? `Only ${m.games} games` : undefined}>
                          {pct(m.winRate, 1)}
                          {low && '*'}
                        </span>
                      </span>
                    </td>
                    <td className="num px-2 text-right text-muted">{thousands(m.games)}</td>
                    <td className="num px-2 text-right">
                      <Lead v={m.goldDiff15} unit="g" />
                    </td>
                    <td className="num px-2 text-right">
                      <Lead v={m.csDiff15} unit="" />
                    </td>
                    <td className="num pl-2 text-right">
                      <Lead v={m.xpDiff15} unit="" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {tab !== 'all' && <p className="mt-3 text-xs text-faint">Ranked by win rate adjusted for sample size, so a couple of lucky games don’t top the list.</p>}
    </section>
  );
}

/** Win rate by game length: one bar per bucket, around a 50% line. */
function LengthChart({ rows }: { rows: (Rated & { label: string })[] }) {
  const data = rows.filter((r) => r.games > 0);
  if (data.length < 2) return null;
  const lo = 0.35;
  const hi = 0.65;
  const y = (v: number) => (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo);
  return (
    <section className="panel p-5" aria-labelledby="len-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="len-h" className="panel-title text-2xl">
          Win rate by game length
        </h2>
        <span className="text-xs text-muted">Does this champion want short or long games?</span>
      </div>
      <div className="relative mt-5 h-44">
        <div className="absolute inset-x-0 border-t border-dashed border-line-strong" style={{ bottom: `${y(0.5) * 100}%` }}>
          <span className="absolute -top-2.5 right-0 bg-surface pl-1 text-[10px] text-faint">50%</span>
        </div>
        <ul className="relative flex h-full items-end gap-3" aria-label="Win rate by game length">
          {data.map((r, i) => (
            <li key={r.label} className="flex h-full flex-1 flex-col items-center justify-end">
              <Tooltip content={`${r.label}: ${pct(r.winRate, 1)} over ${thousands(r.games)} games`}>
                <span className="flex flex-col items-center" style={{ height: '100%' }}>
                  <span className="num mb-1 text-xs font-semibold">{pct(r.winRate)}</span>
                </span>
              </Tooltip>
              <span
                className={clsx('grow-y w-full max-w-16 rounded-t-[4px]', r.winRate >= 0.5 ? 'bg-win/80' : 'bg-loss/70')}
                style={{ height: `${Math.max(4, y(r.winRate) * 100)}%`, animationDelay: `${i * 60}ms` }}
                role="img"
                aria-label={`${r.label}: ${pct(r.winRate, 1)}`}
              />
            </li>
          ))}
        </ul>
      </div>
      <ul className="mt-2 flex gap-3" aria-hidden>
        {data.map((r) => (
          <li key={r.label} className="flex-1 text-center text-[11px] text-muted">
            {r.label}
            <span className="block text-faint">{thousands(r.games)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Averages({ s }: { s: ChampionStats }) {
  const v = s.avg;
  if (!v) return null;
  const rows: [string, string][] = [
    ['K / D / A', `${v.kills.toFixed(1)} / ${v.deaths.toFixed(1)} / ${v.assists.toFixed(1)}`],
    ['CS per minute', v.csPerMin.toFixed(1)],
    ['Damage per minute', v.damagePerMin.toFixed(0)],
    ['Gold per minute', v.goldPerMin.toFixed(0)],
    ['Game length', `${Math.floor(v.minutes)}:${String(Math.round((v.minutes % 1) * 60)).padStart(2, '0')}`],
  ];
  return (
    <section className="panel panel-tick p-4">
      <h2 className="panel-title">Average game</h2>
      <dl className="mt-2 space-y-1.5 text-sm">
        {rows.map(([k, val]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted">{k}</dt>
            <dd className="num font-medium">{val}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-faint">
        {s.role !== 'ALL' ? `${ROLE_LABEL[s.role]}, ` : ''}patch {s.patch}
      </p>
    </section>
  );
}

function BaseStats({ d }: { d: ChampionDetail }) {
  const st = d.stats;
  const rows: [string, number, number?][] = [
    ['Health', st.hp, st.hpperlevel],
    [d.partype || 'Resource', st.mp, st.mpperlevel],
    ['Attack damage', st.attackdamage, st.attackdamageperlevel],
    ['Attack speed', st.attackspeed, st.attackspeedperlevel],
    ['Armor', st.armor, st.armorperlevel],
    ['Magic resist', st.spellblock, st.spellblockperlevel],
    ['Move speed', st.movespeed],
    ['Attack range', st.attackrange],
  ];
  const bars: [string, number][] = [
    ['Damage', d.info.attack],
    ['Toughness', d.info.defense],
    ['Magic', d.info.magic],
    ['Difficulty', d.info.difficulty],
  ];
  return (
    <section className="panel p-4">
      <h2 className="panel-title">Profile</h2>
      <dl className="mt-2 space-y-1.5">
        {bars.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[80px_1fr] items-center gap-3 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className="flex gap-0.5">
              <span className="sr-only">{v} out of 10</span>
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} aria-hidden className={clsx('h-1.5 flex-1 rounded-[1px]', i < v ? 'bg-gold' : 'bg-sunken')} />
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-4 text-xs font-semibold text-muted">Base stats (per level)</h3>
      <dl className="mt-1.5 space-y-1 text-sm">
        {rows
          .filter(([, v]) => v != null && v > 0)
          .map(([k, v, per]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted">{k}</dt>
              <dd className="num">
                {Number.isInteger(v) ? v : v.toFixed(3)}
                {per ? (
                  <span className="text-faint">
                    {' '}
                    +{Number.isInteger(per) ? per : per.toFixed(per < 1 ? 2 : 1)}
                    {k === 'Attack speed' ? '%' : ''}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
      </dl>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-5 px-4 py-12">
        <Skeleton className="size-[84px]" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}

/** Best partners in the role this champion depends on most (support for ADCs, jungler for mids …). */
function Synergy({ s }: { s: ChampionStats }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  if (!s.synergy || s.synergy.list.length < 2) return null;
  const partner = ROLE_LABEL[s.synergy.role]?.toLowerCase() ?? 'partner';
  return (
    <section className="panel p-5" aria-labelledby="syn-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="syn-h" className="panel-title text-2xl">
          Best with
        </h2>
        <span className="text-xs text-muted">Win rate with each {partner} on the same team</span>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {s.synergy.list.map((m) => {
          const c = a.champion(m.championId);
          const slug = sd?.champions.get(m.championId)?.id;
          return (
            <li key={m.championId}>
              <Link
                to={slug ? `/champions/${champSlug(slug)}?role=${s.synergy!.role}` : '#'}
                className="group flex items-center gap-3 rounded border border-line px-3 py-2 transition-colors hover:border-gold/60 hover:bg-raised"
              >
                <GameImg src={c.url} alt="" size={36} rounded="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium group-hover:text-gold">{c.name}</span>
                  <span className="num text-xs text-muted">{thousands(m.games)} games</span>
                </span>
                <span className={clsx('num text-sm font-semibold', m.winRate >= 0.5 ? 'text-win' : 'text-loss')}>{pct(m.winRate, 1)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Players this server has seen play the champion most. */
function TopPlayers({ s }: { s: ChampionStats }) {
  if (s.players.length < 2) return null;
  return (
    <section className="panel p-4" aria-labelledby="tp-h">
      <h2 id="tp-h" className="panel-title">
        Who plays it most
      </h2>
      <p className="text-xs text-muted">From games this server has read</p>
      <ol className="mt-3 space-y-1">
        {s.players.map((p, i) => (
          <li key={`${p.gameName}#${p.tagLine}`}>
            <Link to={profilePath(p.platform, p)} className="group grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded px-1 py-1 text-sm hover:bg-raised">
              <span className={clsx('num text-xs', i < 3 ? 'font-bold text-gold' : 'text-faint')}>{i + 1}</span>
              <span className="min-w-0 truncate group-hover:text-gold">
                {p.gameName}
                <span className="text-faint">#{p.tagLine}</span>
                <span className="ml-1 text-[10px] text-faint">{getPlatform(p.platform)?.label}</span>
              </span>
              <span className="num text-right text-xs">
                <span className={clsx('font-semibold', p.winRate >= 0.5 ? 'text-win' : 'text-loss')}>{pct(p.winRate)}</span>
                <span className="text-muted"> · {p.games}</span>
                <span className={clsx('ml-1', kdaTone(p.kda))}>{formatKda(p.kda)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
