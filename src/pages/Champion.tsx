import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { callTone, matchupCall } from '../lib/matchupVerdict';
import type { ChampionStats, Rated, StatsGroup } from '../../shared/types';
import { api, ApiClientError } from '../lib/api';
import { assets, championBySlug, champSlug, matchupPath, useChampionDetail, useStaticData, type ChampionDetail } from '../lib/ddragon';
import { formatKda, kdaTone, pct, thousands, champClass, wlTone, sureTone } from '../lib/format';
import { profilePath } from '../lib/riotId';
import { getPlatform } from '../../shared/regions';
import { GameImg, Tooltip } from '../components/ui/GameImg';
import { ROLE_LABEL } from '../components/ui/RoleIcon';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { Tip } from '../components/match/Loadout';
import { ItemRow, MaxOrder, RuneTrees, SkillGrid } from '../components/build/BuildParts';
import { GroupToggle, PatchSelect, RoleTab, TierBadge, WinRateBar } from '../components/champions/common';
import { fadeIn } from '../lib/motion';
import { ArenaPanel, ArenaStrip } from '../components/champions/Arena';
import { SlidingIndicator, useSlideDirection } from '../components/ui/Motion';
import { t } from '../i18n';
import { useStickyTop } from '../lib/useStickyTop';
import { LaneCurve } from '../components/champions/LaneCurve';
import { PatchHistory } from '../components/champions/PatchHistory';
import { guessChampion } from '../lib/champSearch';
import { addRecentChamp } from '../lib/storage';
import { damageType } from '../lib/damageMix';

export function ChampionPage() {
  const { slug = '' } = useParams();
  const { data: sd, isPending } = useStaticData();
  const champ = championBySlug(sd, slug);
  const { search } = useLocation();

  if (isPending) return <HeroSkeleton />;
  if (!champ) {
    // "/champions/mf" or "/champions/miss-fortune" just goes there; a typo gets a "Did you mean".
    const guess = sd ? guessChampion(slug, [...sd.champions.values()]) : null;
    if (guess?.sure) return <Navigate replace to={`/champions/${champSlug(guess.champ.id)}${search}`} />;
    document.title = `${t('cp.notFound')} · Riftwatch`;
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState
          page
          title={t('cp.notFound')}
          error={new ApiClientError(404, 'NOT_FOUND', t('cp.notFoundBody', { slug }))}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {guess && (
                <Link to={`/champions/${champSlug(guess.champ.id)}${search}`} className="rounded bg-gold px-4 py-2 font-semibold text-gold-ink">
                  {t('cp.didYouMean', { name: guess.champ.name })}
                </Link>
              )}
              <Link to="/champions" className={guess ? 'rounded border border-line px-4 py-2 font-semibold hover:bg-surface' : 'rounded bg-gold px-4 py-2 font-semibold text-gold-ink'}>
                {t('cp.browse')}
              </Link>
            </div>
          }
        />
      </div>
    );
  }
  return <ChampionView key={champ.key} championId={champ.key} />;
}

function ChampionView({ championId }: { championId: number }) {
  const side = useStickyTop<HTMLElement>();
  const [params, setParams] = useSearchParams();
  const queue = params.get('queue');
  const group: StatsGroup = queue === 'aram' || queue === 'arena' ? queue : 'ranked';
  const role = params.get('role') ?? undefined;
  const patch = params.get('patch') ?? undefined;
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const info = sd?.champions.get(championId);
  const detail = useChampionDetail(sd, championId).data;
  // Remembered for the tier list's "Recently viewed" row (this browser only).
  useEffect(() => addRecentChamp({ id: championId, role }), [championId, role]);

  const q = useQuery({
    queryKey: ['champion', championId, group, role, patch],
    queryFn: ({ signal }) => api.champion(championId, { group, role, patch }, signal),
    staleTime: 60_000,
    // Switching role or patch keeps the current page on screen (dimmed) until the new numbers
    // arrive, instead of collapsing to skeletons and back. A different champion or mode starts fresh.
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[1] === championId && prevQuery?.queryKey[2] === group ? prev : undefined),
  });
  const switching = q.isPlaceholderData;
  const s = q.data;
  // A role is "rare" for this champion when it's both a tiny share and too few games to read.
  const rareRole = (r: { share: number; games: number }) => r.share < 0.02 && r.games < LOW_SAMPLE;
  const [allRoles, setAllRoles] = useState(false);

  useEffect(() => {
    if (info) document.title = t('cp.title', { champion: info.name });
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
            {t('cp.back')}
          </Link>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-5">
              <GameImg src={a.champion(championId).url} alt="" size={84} rounded="md" className="ring-1 ring-line-strong" />
              <div>
                <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight sm:text-6xl">{info?.name}</h1>
                <p className="mt-1 text-muted first-letter:uppercase">{info?.title}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(detail?.tags ?? info?.tags ?? []).map((tag) => (
                    <span key={tag} className="rounded-sm border border-line-strong px-1.5 py-px text-xs text-muted">
                      {champClass(tag)}
                    </span>
                  ))}
                  {(() => {
                    const k = damageType(info?.dmg);
                    if (!k) return null;
                    return (
                      <span className={clsx('rounded-sm border px-1.5 py-px text-xs', k === 'ad' ? 'border-orange-400/40 text-orange-300' : k === 'ap' ? 'border-sky-400/40 text-sky-300' : 'border-line-strong text-muted')} title={t('champ.dmgTip')}>
                        {k === 'ad' ? t('champ.dmgAd') : k === 'ap' ? t('champ.dmgAp') : t('champ.dmgMixed')}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PatchSelect patches={s?.patches ?? []} value={s?.patch ?? null} onChange={(p) => set('patch', p)} />
              <GroupToggle value={group} onChange={(g) => set('queue', g === 'ranked' ? null : g)} />
            </div>
          </div>

          {group === 'arena' && s && !q.isPending ? <ArenaStrip s={s} /> : <StatStrip s={s} loading={q.isPending} bans={group === 'ranked'} />}
          <CountersStrip s={s} />
          {detail && <Abilities detail={detail} />}

          {group === 'ranked' && s && s.roles.length > 0 && (
            <div className="mt-6 flex items-center gap-5">
            <div role="tablist" aria-label={t('tl.role')} className="relative flex min-w-0 gap-5 overflow-x-auto overflow-y-hidden">
              <SlidingIndicator />
              {s.roles.filter((r) => allRoles || r.role === (switching && role ? role : s.role) || !rareRole(r)).map((r) => (
                <RoleTab key={r.role} role={r.role} active={(switching && role ? role : s.role) === r.role} onClick={() => set('role', r.role)}>
                  {ROLE_LABEL[r.role] ?? r.role}
                  <span className="num text-xs text-faint">{pct(r.share)}</span>
                </RoleTab>
              ))}
            </div>
              {/* Off-roles with a sliver of games (Ahri bot 0%) are tucked behind one small button instead of a full tab each. */}
              {!allRoles && s.roles.some((r) => rareRole(r) && r.role !== (switching && role ? role : s.role)) && (
                <button type="button" onClick={() => setAllRoles(true)} className="shrink-0 self-center whitespace-nowrap py-2 text-xs text-muted hover:text-text">
                  {t('cp.moreRoles', { count: s.roles.filter((r) => rareRole(r) && r.role !== (switching && role ? role : s.role)).length })}
                </button>
              )}
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
            <EmptyState title={t(group === 'aram' ? 'cp.noAram' : group === 'arena' ? 'cp.noArena' : 'cp.noRanked', { champion: info?.name ?? '' })}>
              {t('cp.noGamesBody')}
            </EmptyState>
          </div>
        ) : (
          <div className={clsx('grid gap-5 transition-opacity duration-200 lg:grid-cols-[minmax(0,1fr)_300px]', switching && 'pointer-events-none opacity-60')} aria-busy={switching}>
            <div className="min-w-0 space-y-5">
              {/* Arena: no item, rune or augment win rates (Riot policy), so no build panel. */}
              {group === 'arena' ? <ArenaPanel s={s} /> : <BuildPanel s={s} abilityIcons={abilityIcons} />}
              {group === 'ranked' && <Matchups s={s} />}
              {group === 'ranked' && <Synergy s={s} />}
              {group === 'ranked' && s.lane && (
                <LaneCurve lane={s.lane} id="cp-lane-h" sub={t('cp.laneSub', { name: info?.name ?? '', count: s.lane.games })} />
              )}
              <LengthChart rows={s.byLength} title={group === 'arena' ? t('len.titleArena') : undefined} />
            </div>
            <aside ref={side.ref} style={side.style} className="space-y-5 lg:sticky lg:self-start">
              <Averages s={s} />
              <PatchHistory history={s.history} current={s.patch} rateLabel={group === 'arena' ? t('arena.top4') : undefined} />
              <TopPlayers s={s} />
              {detail && <BaseStats d={detail} />}
              {detail?.blurb && (
                <section className="panel p-4">
                  <h2 className="panel-title">{t('cp.lore')}</h2>
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

function StatStrip({ s, loading, bans = true }: { s?: ChampionStats; loading: boolean; bans?: boolean }) {
  if (loading) return <Skeleton className="mt-6 h-14 w-full max-w-2xl" />;
  const sum = s?.summary;
  if (!sum) return <div className="mt-6" />;
  const items: [string, string, string?][] = [
    [t('cp.winRate'), pct(sum.winRate, 1), sureTone(sum.winRate, sum.games)],
    [t('cp.pickRate'), pct(sum.pickRate, 1)],
    // ARAM has no bans: a "0.0%" there reads like nobody bans it.
    ...(bans ? [[t('cp.banRate'), pct(sum.banRate, 1)] as [string, string]] : []),
    [t('cp.games'), thousands(sum.games)],
  ];
  return (
    // Phones: a tidy 3-column grid (dividers only make sense in a single row, so they start at sm).
    // Labels line up across a row on phones (items-start); the tall tier badge would otherwise push its label above the others.
    <dl className="mt-7 grid grid-cols-3 items-start gap-x-4 gap-y-4 sm:flex sm:flex-wrap sm:items-end sm:gap-x-8 sm:gap-y-3">
      <div>
        <dt className="text-xs text-muted">{t('cp.tier')}</dt>
        <dd className="mt-1">
          <TierBadge tier={sum.tier} size="lg" />
        </dd>
      </div>
      {items.map(([label, value, tone]) => (
        <div key={label} className="min-w-0 sm:border-l sm:border-line sm:pl-8">
          <dt className="truncate text-xs text-muted">{label}</dt>
          <dd className={clsx('display-num mt-0.5 text-3xl font-extrabold leading-none sm:text-4xl', tone)}>{value}</dd>
        </div>
      ))}
      {sum.lowSample && <p className="col-span-3 text-xs text-faint">{t('cp.smallSample')}</p>}
    </dl>
  );
}

function Abilities({ detail }: { detail: ChampionDetail }) {
  const list = [{ key: t('cp.passive'), name: detail.passive.name, description: detail.passive.description, cooldown: '', icon: detail.passive.icon }, ...detail.spells];
  return (
    <ul className="mt-6 flex flex-wrap gap-2" aria-label={t('cp.abilities')}>
      {list.map((sp) => (
        <li key={sp.key}>
          <Tooltip
            content={
              <>
                <span className="block font-semibold">
                  {sp.name} <span className="font-normal text-muted">({sp.key})</span>
                </span>
                {sp.cooldown && <span className="block text-gold">{t('cp.cooldown', { value: sp.cooldown })}</span>}
                <span className="mt-0.5 block text-muted">{sp.description.length > 260 ? `${sp.description.slice(0, 257)}…` : sp.description}</span>
              </>
            }
          >
            <span className="relative block">
              <GameImg src={sp.icon} alt={`${sp.key}: ${sp.name}`} size={42} rounded="md" className="ring-1 ring-line-strong transition-transform duration-150 hover:-translate-y-0.5" />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-sm bg-bg px-1 font-display text-[11px] font-bold leading-tight text-gold">
                {sp.key === t('cp.passive') ? t('cp.passiveKey') : sp.key}
              </span>
            </span>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}

export const LOW_SAMPLE = 10;

/** Win rate plus how many games back it. Small samples are shown muted, since "100% over 2 games" means nothing. */
export function Rate({ r, className, share }: { r: Rated; className?: string; share?: number }) {
  const low = r.games < LOW_SAMPLE;
  return (
    <span className={clsx('num shrink-0 text-right text-xs', className)} title={low ? t('cp.only', { count: r.games }) : undefined}>
      <span className={clsx('block text-sm font-semibold', low ? 'text-faint' : sureTone(r.winRate, r.games))}>
        {pct(r.winRate, 1)}
        {low && <span aria-hidden>*</span>}
      </span>
      <span className="text-faint">
        {share != null ? `${pct(share)} · ` : ''}
        {t('common.games', { count: r.games })}
      </span>
    </span>
  );
}

export function Block({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
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

/**
 * The whole build on one line, the way other sites open their build pages: runes, spells, start,
 * core items, boots and skill max. It follows the rune page picked below (and that page's main
 * build once it has enough games); every part links down to its full section.
 */
export function BuildGlance({ s, page, abilityIcons }: { s: BuildData & { skills?: ChampionStats['skills'] }; page: number; abilityIcons?: string[] }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const names = useRuneNames(s.runes);
  const rune = s.runes[page] ?? s.runes[0];
  const build = rune?.builds?.[0] ?? variationsOf(s)[0];
  const boots = (build?.bootsTotal ?? 0) >= LOW_SAMPLE ? build!.boots[0] : s.boots[0];
  const spells = s.spells[0];
  const start = s.starting[0];
  const tree = rune ? sd?.trees.find((x) => x.id === rune.secondaryStyle) : undefined;
  if (!rune && !build) return null;
  const part = (label: string, body: React.ReactNode) => (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">{label}</span>
      <div className="flex items-center gap-1">{body}</div>
    </div>
  );
  return (
    <div className="rounded border border-gold/30 bg-gradient-to-r from-gold/[0.06] to-transparent p-4" aria-label={t('cp.glance')}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold">{t('cp.glance')}</h3>
        {rune && <span className="text-xs text-muted">{names[page] ?? names[0]}</span>}
      </div>
      <div className="flex flex-wrap items-start gap-x-5 gap-y-4">
        {rune &&
          part(
            t('cp.runes'),
            <>
              <GameImg src={a.rune(rune.primary[0]).url} alt={a.rune(rune.primary[0]).name} size={36} rounded="full" className="bg-[#0e1b1d]!" />
              {tree && <GameImg src={`https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`} alt={tree.name} size={22} rounded="full" className="opacity-80" />}
            </>,
          )}
        {spells &&
          part(
            t('cp.glanceSpells'),
            spells.ids.map((id) => <GameImg key={id} src={a.spell(id).url} alt={a.spell(id).name} size={30} rounded="sm" />),
          )}
        {start && part(t('cp.glanceStart'), <ItemRow ids={start.ids} size={30} />)}
        {build && part(t('cp.coreShort'), <ItemRow ids={build.ids} size={36} arrows linked />)}
        {boots && part(t('cp.boots'), <ItemRow ids={[boots.id]} size={30} />)}
        {s.skills?.order &&
          part(
            t('cp.glanceSkills'),
            <MaxOrder order={s.skills.order.split('').map((k) => 'QWE'.indexOf(k) + 1)} icons={abilityIcons} />,
          )}
      </div>
    </div>
  );
}

/** What the build sections need: a whole champion-role, or one matchup. */
export type BuildData = Pick<ChampionStats, 'championId' | 'role' | 'patch' | 'group' | 'runes' | 'spells' | 'starting' | 'builds' | 'core' | 'coreTotal' | 'boots' | 'bootsTotal' | 'later'>;

/** Rune page names: keystone and secondary tree, plus the first rune that tells two alike pages apart. */
function useRuneNames(runes: BuildData['runes']) {
  const { data } = useStaticData();
  const a = assets(data);
  const tree = (id: number) => data?.trees.find((x) => x.id === id)?.name ?? '';
  return runes.map((r, i) => {
    const base = t('cp.pageName', { keystone: a.rune(r.primary[0]).name || '?', tree: tree(r.secondaryStyle) });
    const twin = runes.find((o, j) => j !== i && o.primary[0] === r.primary[0] && o.secondaryStyle === r.secondaryStyle);
    if (!twin) return base;
    const all = [...r.primary.slice(1), ...r.secondary];
    const other = new Set([...twin.primary.slice(1), ...twin.secondary]);
    const diff = all.find((id) => !other.has(id));
    return diff ? `${base} (${a.rune(diff).name})` : base;
  });
}

/** Build names: the first item, or the first two when another build starts the same way. */
function useBuildNames(builds: { ids: number[] }[]) {
  const { data } = useStaticData();
  const a = assets(data);
  const name = (id: number) => a.item(id).name || t('item.fallback', { id: String(id) });
  return builds.map((b, i) => {
    const sameStart = builds.some((o, j) => j !== i && o.ids[0] === b.ids[0]);
    if (!sameStart) return t('cp.buildFirst', { item: name(b.ids[0]) });
    const sameTwo = builds.some((o, j) => j !== i && o.ids[0] === b.ids[0] && o.ids[1] === b.ids[1]);
    return t(sameTwo ? 'cp.buildThree' : 'cp.buildTwo', { a: name(b.ids[0]), b: name(b.ids[1]), c: name(b.ids[2]) });
  });
}

export function RunesBlock({ s, page: controlled, onPage }: { s: BuildData; page?: number; onPage?: (i: number) => void }) {
  const [own, setOwn] = useState(0);
  const page = controlled ?? own;
  const setPage = onPage ?? setOwn;
  useEffect(() => {
    if (controlled == null) setOwn(0);
  }, [s.championId, s.role, s.patch, s.group]); // eslint-disable-line react-hooks/exhaustive-deps
  const names = useRuneNames(s.runes);
  const rune = s.runes[page] ?? s.runes[0];
  const runeDir = useSlideDirection(page);
  if (!rune) return null;
  return (
    <Block title={t('cp.runes')} aside={s.runes.length > 1 ? t('cp.pagesAside', { count: s.runes.length }) : undefined}>
      {s.runes.length > 1 && (
        <VariationCards
          label={t('cp.runePages')}
          pick={page}
          onPick={setPage}
          items={s.runes.map((r, i) => ({
            key: `${r.primary.join()}|${r.secondary.join()}`,
            title: names[i],
            r: r.share != null ? r : { ...r, share: 0, tags: [] },
            content: <RunePageSummary r={r} />,
          }))}
        />
      )}
      <div key={page} className="tab-in flex flex-wrap items-start justify-between gap-4 rounded border border-line bg-raised/40 p-4" style={{ '--dir': runeDir } as React.CSSProperties}>
        <RuneTrees primaryStyle={rune.primaryStyle} secondaryStyle={rune.secondaryStyle} picked={[...rune.primary, ...rune.secondary]} shards={rune.shards} />
        <Rate r={rune} share={rune.share} />
      </div>
    </Block>
  );
}

export function SpellsAndStart({ s }: { s: BuildData }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  if (!s.spells.length && !s.starting.length) return null;
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {s.spells.length > 0 && (
        <Block title={t('cp.spells')}>
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
        <Block title={t('cp.starting')}>
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
  );
}

function BuildPanel({ s, abilityIcons }: { s: ChampionStats; abilityIcons?: string[] }) {
  // One choice drives both blocks: picking a rune page shows the items built with it.
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [s.championId, s.role, s.patch, s.group]);
  return (
    <section className="panel panel-tick p-5" aria-labelledby="build-h">
      <h2 id="build-h" className="panel-title text-2xl">
        {t('cp.recommended')}
      </h2>
      <p className="text-xs text-muted">{t('cp.recommendedSub')}</p>
      {s.summary && s.summary.games < 50 && (
        <p className="mt-3 rounded border border-kda-great/40 bg-kda-great/10 px-3 py-2 text-sm">
          {t('cp.early', { count: s.summary.games, min: LOW_SAMPLE })}
        </p>
      )}

      <div className="mt-5 space-y-7">
        <BuildGlance s={s} page={page} abilityIcons={abilityIcons} />

        <RunesBlock s={s} page={page} onPage={setPage} />

        <SpellsAndStart s={s} />

        <ItemsBlock s={s} runePage={page} />

        {s.skills.path.length > 0 && (
          <Block
            title={t('cp.skillOrder')}
            aside={
              <span className="flex items-center gap-2">
                {t('cp.max')} <MaxOrder order={s.skills.order.split('').map((k) => 'QWE'.indexOf(k) + 1)} icons={abilityIcons} />
              </span>
            }
          >
            <SkillGrid skills={s.skills.path} icons={abilityIcons} />
            {s.skills.maxOrders.length > 1 && (
              <p className="mt-2 text-xs text-muted">
                {t('cp.maxOrders')}{' '}
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

const nthItem = (slot: number) => t(`cp.nth.${slot}` as 'cp.nth.4');

function ItemName({ id }: { id: number }) {
  const { data: sd } = useStaticData();
  return <>{assets(sd).item(id).name || t('item.fallback', { id: String(id) })}</>;
}

/** Core build, boots and late-game options, laid out the way a game actually goes. */
/** Just the keystone, small, for labels that name a rune page. */
function RunePageIcon({ r }: { r: ChampionStats['runes'][number] }) {
  const { data } = useStaticData();
  const ks = assets(data).rune(r.primary[0]);
  return <GameImg src={ks.url} alt="" size={20} rounded="full" className="shrink-0 bg-[#0e1b1d]!" />;
}

/** Compact rune page for a card: keystone, the three other primary runes, and the secondary tree. */
export function RunePageSummary({ r }: { r: ChampionStats['runes'][number] }) {
  const { data } = useStaticData();
  const a = assets(data);
  const tree = (id: number) => data?.trees.find((t) => t.id === id);
  const ks = a.rune(r.primary[0]);
  const sec = tree(r.secondaryStyle);
  return (
    <span className="flex items-center gap-2">
      <GameImg src={ks.url} alt={ks.name} size={34} rounded="full" className="bg-[#0e1b1d]!" tip={ks.name ? <Tip title={ks.name} body={ks.desc} /> : undefined} />
      <span className="flex gap-0.5">
        {r.primary.slice(1).map((id) => {
          const x = a.rune(id);
          return <GameImg key={id} src={x.url} alt={x.name} size={20} rounded="full" className="bg-[#0e1b1d]!" tip={x.name ? <Tip title={x.name} body={x.desc} /> : undefined} />;
        })}
      </span>
      {sec && <GameImg src={`https://ddragon.leagueoflegends.com/cdn/img/${sec.icon}`} alt={sec.name} size={20} rounded="full" className="ml-auto opacity-80" tip={sec.name} />}
    </span>
  );
}

type Variation = Rated & { share: number; tags: ('popular' | 'best')[] };

/** A row of cards to choose between variations (builds, rune pages). Swipeable on phones. */
export function VariationCards({ label, items, pick, onPick }: { label: string; items: { key: string; title: string; r: Variation; content: React.ReactNode }[]; pick: number; onPick: (i: number) => void }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-4 mb-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(168px,1fr))] sm:overflow-visible sm:px-0 sm:pb-0"
    >
      {items.map(({ key, title, r: v, content }, i) => {
        const active = i === pick;
        const low = v.games < LOW_SAMPLE;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onPick(i)}
            className={clsx(
              'group flex w-[172px] shrink-0 snap-start flex-col gap-2 rounded border p-3 text-left transition-[border-color,background-color,translate,box-shadow] duration-300 hover:-translate-y-0.5 sm:w-auto',
              active ? 'border-gold bg-gold/[0.07] shadow-[0_0_0_1px_var(--gold)]' : 'border-line bg-raised/40 hover:border-line-strong',
            )}
          >
            <span className="flex flex-col gap-1">
              <span className={clsx('line-clamp-2 min-w-0 font-display text-sm font-bold leading-tight', active ? 'text-gold' : 'text-text/80')} title={title}>
                {title}
              </span>
              <span className="flex flex-wrap gap-1 empty:hidden">
                {v.tags.includes('popular') && <span className="rounded-sm bg-sunken px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-muted">{t('cp.mostPlayed')}</span>}
                {v.tags.includes('best') && <span className="rounded-sm border border-win/40 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-win">{t('cp.bestWr')}</span>}
              </span>
            </span>
            {content}
            <span className="num flex flex-wrap items-baseline justify-between gap-x-2 whitespace-nowrap text-xs">
              <span className={clsx('text-sm font-semibold', low ? 'text-faint' : sureTone(v.winRate, v.games))}>
                {pct(v.winRate, 1)}
                {low && <span aria-hidden>*</span>}
              </span>
              <span className="text-faint">
                {t('common.games', { count: v.games })} · {pct(v.share)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Build variations to choose from; older saved stats without them fall back to the overall core list. */
function variationsOf(s: BuildData): ChampionStats['builds'] {
  if (s.builds?.length) return s.builds;
  return s.core.slice(0, 3).map((c, i) => ({
    ...c,
    share: s.coreTotal ? c.games / s.coreTotal : 0,
    tags: i === 0 ? ['popular'] : [],
    boots: [],
    bootsTotal: 0,
    later: [],
  }));
}

export function ItemsBlock({ s, runePage }: { s: BuildData; runePage?: number }) {
  // With a rune page picked (champion page), its own builds when enough games used it; else every page's.
  const page = runePage != null && s.runes.length > 1 ? s.runes[runePage] : undefined;
  const runeNames = useRuneNames(s.runes);
  const pageBuilds = page?.builds?.length ? page.builds : null;
  // Variations seen in only a handful of games are noise, not a choice: keep the main one and those with enough games.
  const builds = (pageBuilds ?? variationsOf(s)).filter((v, i) => i === 0 || v.games >= LOW_SAMPLE);
  const buildNames = useBuildNames(builds);
  const [pick, setPick] = useState(0);
  useEffect(() => setPick(0), [s.championId, s.role, s.patch, s.group, runePage]);
  const b = builds[Math.min(pick, builds.length - 1)];
  const dir = useSlideDirection(pick);
  // Per-build follow-ups when we have them; otherwise the champion-wide numbers.
  // A handful of games after one build says little: below LOW_SAMPLE, fall back to the champion-wide picks.
  const boots = (b?.bootsTotal ?? 0) >= LOW_SAMPLE ? { list: b!.boots, total: b!.bootsTotal, own: true } : { list: s.boots, total: s.bootsTotal, own: false };
  const later = (slot: number) => {
    const own = b?.later.find((x) => x.slot === slot);
    return own && own.total >= LOW_SAMPLE ? { ...own, own: true } : { ...(s.later.find((x) => x.slot === slot) ?? { slot, total: 0, options: [] }), own: false };
  };

  return (
    <Block title={t('cp.items')} aside={s.coreTotal ? t('cp.itemsAside', { count: pageBuilds ? (page?.buildGames ?? 0) : s.coreTotal }) : undefined}>
      {page && runePage != null && (
        <p className={clsx('mb-3 flex items-center gap-2 rounded border px-3 py-2 text-xs', pageBuilds ? 'border-gold/40 bg-gold/[0.06] text-text' : 'border-line bg-raised/40 text-muted')} aria-live="polite">
          <RunePageIcon r={page} />
          <span className="min-w-0">
            {pageBuilds
              ? t.rich('cp.itemsForPage', { page: <span className="font-semibold">{runeNames[runePage]}</span>, count: page.buildGames ?? 0 })
              : t('cp.itemsForPageFew', { page: runeNames[runePage], count: page.buildGames ?? 0 })}
          </span>
        </p>
      )}
      {builds.length > 1 && (
        <VariationCards
          label={t('cp.buildVariations')}
          pick={pick}
          onPick={setPick}
          items={builds.map((v, i) => ({ key: v.ids.join(), title: buildNames[i], r: v, content: <ItemRow ids={v.ids} size={30} arrows /> }))}
        />
      )}

      {b ? (
        <div key={`${runePage ?? ''}:${b.ids.join()}`} className="tab-in" style={{ '--dir': dir } as React.CSSProperties}>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="rounded border border-line bg-raised/40 p-4">
              <p className="mb-3 text-xs font-medium text-muted">
                {builds.length > 1 ? t('cp.coreNamed', { name: buildNames[Math.min(pick, builds.length - 1)] }) : t('cp.core')}
              </p>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <ol className="flex items-start gap-2">
                  {b.ids.map((id, i) => (
                    <li key={`${id}-${i}`} className="flex items-start gap-2">
                      <span className="flex w-[76px] flex-col items-center gap-1.5 text-center">
                        <ItemRow ids={[id]} size={48} linked />
                        <span className="line-clamp-2 text-[11px] leading-tight text-muted">
                          <ItemName id={id} />
                        </span>
                      </span>
                      {i < b.ids.length - 1 && <span className="mt-4 text-faint" aria-hidden>›</span>}
                    </li>
                  ))}
                </ol>
                <Rate r={b} share={b.share} />
              </div>
            </div>

            <div className="rounded border border-line bg-raised/40 p-4">
              <p className="mb-3 flex items-baseline justify-between text-xs font-medium text-muted">
                {t('cp.boots')}
                {!boots.own && boots.list.length > 0 && builds.length > 1 && <span className="font-normal text-faint">{t('cp.allBuilds')}</span>}
              </p>
              {boots.list.length ? (
                <ul className="space-y-2.5">
                  {boots.list.filter((o, i) => i === 0 || o.games >= LOW_SAMPLE).map((o) => (
                    <OptionRow key={o.id} o={o} share={boots.total ? o.games / boots.total : undefined} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">{t('cp.noBoots')}</p>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[4, 5, 6].map((slot) => {
              const l = later(slot);
              return (
                <div key={slot} className="rounded border border-line p-4">
                  <p className="mb-3 flex items-baseline justify-between text-xs font-medium text-muted">
                    {nthItem(slot)}
                    {l.total ? (
                      <span className="font-normal text-faint">{!l.own && builds.length > 1 ? t('cp.allBuildsGames', { count: l.total }) : t('common.games', { count: l.total })}</span>
                    ) : null}
                  </p>
                  {l.options.length ? (
                    <ul className="space-y-2.5">
                      {/* One-off picks (under LOW_SAMPLE) aren't options; the most common stays even if small. */}
                      {l.options.filter((o, i) => i === 0 || o.games >= LOW_SAMPLE).map((o) => (
                        <OptionRow key={o.id} o={o} share={l.total ? o.games / l.total : undefined} linked />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">{t('cp.noNth', { nth: nthItem(slot).toLowerCase() })}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="rounded border border-line bg-raised/40 p-4 text-sm text-muted">{t('cp.noCore')}</p>
      )}
    </Block>
  );
}

export function OptionRow({ o, share, linked }: { o: Rated & { id: number }; share?: number; linked?: boolean }) {
  const low = o.games < LOW_SAMPLE;
  return (
    <li className="flex items-start gap-2.5">
      <ItemRow ids={[o.id]} size={32} linked={linked} />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 break-words text-[13px] leading-tight">
          <ItemName id={o.id} />
        </span>
        <span className="num mt-0.5 block text-xs text-faint" title={low ? t('cp.only', { count: o.games }) : undefined}>
          <span className={clsx('font-semibold', low ? 'text-faint' : sureTone(o.winRate, o.games))}>
            {pct(o.winRate, 1)}
            {low && '*'}
          </span>
          {' · '}
          {share != null ? `${t('cp.pick', { rate: pct(share) })} · ` : ''}
          {thousands(o.games)}
        </span>
      </span>
    </li>
  );
}

type Matchup = ChampionStats['matchups'][number];

/** Matchups with enough games to mean something, best and worst ranked by adjusted win rate. */
function laneMatchups(s: ChampionStats) {
  // Same bar as the server's counters: at least 8 games and 3% of the champion's games.
  const min = Math.max(8, Math.round((s.summary?.games ?? 0) * 0.03));
  const usable = s.matchups.filter((m) => m.games >= min);
  // Clear ones first (the same test as the matchup page: past two standard errors), then the ones that only lean.
  const sure = (m: Matchup) => {
    const c = matchupCall(m);
    return (c.side === 'me' || c.side === 'them') && c.sure;
  };
  const easiest = usable
    .filter((m) => m.adjusted >= 0.5)
    .map((m) => ({ ...m, sure: sure(m) }))
    .sort((a, b) => Number(b.sure) - Number(a.sure) || b.adjusted - a.adjusted);
  const hardest = usable
    .filter((m) => m.adjusted < 0.5)
    .map((m) => ({ ...m, sure: sure(m) }))
    .sort((a, b) => Number(b.sure) - Number(a.sure) || a.adjusted - b.adjusted);
  return { usable, easiest, hardest };
}

/** The headline answer: who beats this champion in lane, and who it beats. */
function CountersStrip({ s }: { s?: ChampionStats }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  if (!s || s.group !== 'ranked' || !s.summary) return null;
  const { hardest, easiest } = laneMatchups(s);
  if (!hardest.length && !easiest.length) return null;
  const group = (label: string, list: (Matchup & { sure: boolean })[], tone: 'win' | 'loss') => (
    <div className="min-w-0">
      <p className={clsx('mb-1.5 text-xs font-medium', tone === 'loss' ? 'text-loss' : 'text-win')}>{label}</p>
      {list.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {list.slice(0, 5).map((m) => {
            const c = a.champion(m.championId);
            return (
              <li key={m.championId}>
                <Link
                  to={matchupPath(sd, s.championId, m.championId, s.role)}
                  className={clsx(
                    'group flex items-center gap-2 rounded border bg-surface/70 py-1 pl-1 pr-2.5 backdrop-blur transition-colors hover:bg-raised',
                    !m.sure ? 'border-line border-dashed' : tone === 'loss' ? 'border-loss/40' : 'border-win/40',
                  )}
                  title={`${t('cp.counterTip', { rate: pct(m.winRate, 1), champion: c.name, games: t('common.games', { count: m.games }) })}${m.sure ? '' : ` · ${t('tl.leaning')}`}`}
                >
                  <GameImg src={c.url} alt="" size={28} rounded="sm" />
                  <span className="text-sm font-medium group-hover:text-gold">{c.name}</span>
                  <span className={clsx('num text-xs font-semibold', !m.sure || m.games < LOW_SAMPLE ? 'text-faint' : tone === 'loss' ? 'text-loss' : 'text-win')}>{pct(m.winRate)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">{t('cp.notEnough')}</p>
      )}
    </div>
  );
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {group(t('cp.counteredBy'), hardest, 'loss')}
      {group(t('cp.strongAgainst'), easiest, 'win')}
      {[...hardest.slice(0, 5), ...easiest.slice(0, 5)].some((m) => !m.sure) && (
        <p className="text-xs text-faint sm:col-span-2">{t('cp.leaningNote')}</p>
      )}
    </div>
  );
}

const MU_TABS = [
  { id: 'hard', label: () => t('mu.hard') },
  { id: 'easy', label: () => t('mu.easy') },
  { id: 'all', label: () => t('mu.all') },
] as const;
type MuSort = 'winRate' | 'games' | 'goldDiff15' | 'csDiff15' | 'xpDiff15';

export function Lead({ v, unit, decimals = 0 }: { v: number | null; unit: string; decimals?: number }) {
  if (v == null) return <span className="text-faint">–</span>;
  const f = 10 ** decimals;
  const r = Math.round(v * f) / f;
  return (
    <span className={clsx(r > 0 ? 'text-win' : r < 0 ? 'text-loss' : 'text-muted')}>
      {r > 0 ? '+' : r < 0 ? '−' : '±'}
      {Math.abs(r).toFixed(decimals)}
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
            {t('mu.title')}
          </h2>
          <p className="text-xs text-muted">{s.summary ? t('mu.sub', { role: ROLE_LABEL[s.role] ?? s.role, lane: (ROLE_LABEL[s.role] ?? s.role).toLowerCase() }) : t('mu.subNoRole')}</p>
        </div>
        <div role="tablist" aria-label={t('mu.list')} className="flex rounded border border-line bg-surface p-0.5">
          {MU_TABS.map((mt) => (
            <button
              key={mt.id}
              role="tab"
              aria-selected={tab === mt.id}
              onClick={() => setTab(mt.id)}
              className={clsx('rounded-sm px-3 py-1 text-sm font-medium transition-colors', tab === mt.id ? 'bg-raised text-text' : 'text-muted hover:text-text')}
            >
              {mt.label()}
              {mt.id === 'all' && <span className="num ml-1 text-xs text-faint">{s.matchups.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {usable.length === 0 ? t('mu.noneUsable') : tab === 'hard' ? t('mu.noLosing') : t('mu.noWinning')}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table key={tab} className="fade-in w-full min-w-[560px] text-sm">
            <caption className="sr-only">{t('mu.title')}</caption>
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-2 text-left font-medium">
                  {t('mu.opponent')}
                </th>
                <th scope="col" className="px-2 text-right font-medium">
                  {head('winRate', t('cp.winRate'))}
                </th>
                <th scope="col" className="px-2 text-right font-medium">
                  {head('games', t('cp.games'))}
                </th>
                <th scope="col" className="px-2 text-right font-medium">
                  {head('goldDiff15', t('mu.gold15'))}
                </th>
                <th scope="col" className="px-2 text-right font-medium">
                  {head('csDiff15', t('mu.cs15'))}
                </th>
                <th scope="col" className="pl-2 text-right font-medium">
                  {head('xpDiff15', t('mu.xp15'))}
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
                      <Link to={matchupPath(sd, s.championId, m.championId, s.role)} className="group flex items-center gap-2.5">
                        <GameImg src={c.url} alt="" size={30} rounded="md" />
                        <span className="font-medium group-hover:text-gold">{c.name}</span>
                      </Link>
                    </td>
                    <td className="num px-2 text-right">
                      <span className="inline-flex items-center gap-2">
                        <WinRateBar value={m.winRate} />
                        <span className={clsx('w-12 font-semibold', low ? 'text-faint' : callTone(matchupCall(m)))} title={low ? t('cp.only', { count: m.games }) : undefined}>
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
      <p className="mt-3 text-xs text-faint">
        {tab !== 'all' && `${t('mu.adjustedNote')} `}
        {t('mu.toneNote')}
      </p>
    </section>
  );
}

const LEN_LABELS = ['Under 20 min', '20–25 min', '25–30 min', '30–35 min', '35+ min'];
/** The server labels length buckets in English; show them in the current language. */
const lenLabel = (label: string) => (LEN_LABELS.includes(label) ? t(`len.${LEN_LABELS.indexOf(label)}` as 'len.0') : label);

/** Win rate by game length: one bar per bucket, around a 50% line. */
/** Short games (under 25 min) against long ones (30+): only called when both sides have a real sample. */
export function lengthTrend(rows: (Rated & { label: string })[]): 'len.early' | 'len.late' | 'len.even' | null {
  const side = (pick: (r: Rated & { label: string }) => boolean) => {
    const xs = rows.filter(pick);
    const g = xs.reduce((n, r) => n + r.games, 0);
    return { g, w: g ? xs.reduce((n, r) => n + r.winRate * r.games, 0) / g : 0 };
  };
  const short = side((r) => r.label === 'Under 20 min' || r.label === '20–25 min');
  const long = side((r) => r.label === '30–35 min' || r.label.startsWith('35') || r.label.startsWith('Over'));
  if (short.g < 60 || long.g < 60) return null;
  const d = long.w - short.w;
  return d >= 0.04 ? 'len.late' : d <= -0.04 ? 'len.early' : 'len.even';
}

function LengthChart({ rows, title }: { rows: (Rated & { label: string })[]; title?: string }) {
  const data = rows.filter((r) => r.games > 0);
  if (data.length < 2) return null;
  const lo = 0.35;
  const hi = 0.65;
  const y = (v: number) => (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo);
  const trend = lengthTrend(data);
  return (
    <section className="panel p-5" aria-labelledby="len-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="len-h" className="panel-title text-2xl">
          {title ?? t('len.title')}
        </h2>
        <span className="text-xs text-muted">{t('len.sub')}</span>
      </div>
      {trend && <p className="mt-1 text-sm font-medium">{t(trend)}</p>}
      <div className="relative mt-5 h-44">
        <div className="absolute inset-x-0 border-t border-dashed border-line-strong" style={{ bottom: `${y(0.5) * 100}%` }}>
          <span className="absolute -top-2.5 right-0 bg-surface pl-1 text-[10px] text-faint">50%</span>
        </div>
        <ul className="relative flex h-full items-end gap-3" aria-label={title ?? t('len.title')}>
          {data.map((r, i) => (
            <li key={r.label} className="flex h-full flex-1 flex-col items-center justify-end">
              <Tooltip content={t('len.tip', { label: lenLabel(r.label), rate: pct(r.winRate, 1), games: t('common.games', { count: r.games }) })}>
                <span className="flex flex-col items-center" style={{ height: '100%' }}>
                  <span className="num mb-1 text-xs font-semibold">{pct(r.winRate)}</span>
                </span>
              </Tooltip>
              <span
                className={clsx('grow-y w-full max-w-16 rounded-t-[4px]', (({ 'text-win': 'bg-win/80', 'text-loss': 'bg-loss/70' }) as Record<string, string>)[sureTone(r.winRate, r.games)] ?? 'bg-line-strong')}
                style={{ height: `${Math.max(4, y(r.winRate) * 100)}%`, animationDelay: `${i * 60}ms` }}
                role="img"
                aria-label={`${lenLabel(r.label)}: ${pct(r.winRate, 1)}`}
              />
            </li>
          ))}
        </ul>
      </div>
      <ul className="mt-2 flex gap-3" aria-hidden>
        {data.map((r) => (
          <li key={r.label} className="flex-1 text-center text-[11px] text-muted">
            {lenLabel(r.label)}
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
    [t('avg.kda'), `${v.kills.toFixed(1)} / ${v.deaths.toFixed(1)} / ${v.assists.toFixed(1)}`],
    ...(s.group === 'arena' ? [] : ([[t('avg.cs'), v.csPerMin.toFixed(1)]] as [string, string][])),
    [t('avg.dmg'), v.damagePerMin.toFixed(0)],
    [t('avg.gold'), v.goldPerMin.toFixed(0)],
    [t('avg.length'), `${Math.floor(v.minutes)}:${String(Math.round((v.minutes % 1) * 60)).padStart(2, '0')}`],
  ];
  return (
    <section className="panel panel-tick p-4">
      <h2 className="panel-title">{t('avg.title')}</h2>
      <dl className="mt-2 space-y-1.5 text-sm">
        {rows.map(([k, val]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted">{k}</dt>
            <dd className="num font-medium">{val}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-faint">
        {s.role !== 'ALL' ? t('avg.rolePatch', { role: ROLE_LABEL[s.role], patch: s.patch ?? '' }) : t('avg.patch', { patch: s.patch ?? '' })}
      </p>
    </section>
  );
}

function BaseStats({ d }: { d: ChampionDetail }) {
  const st = d.stats;
  const rows: [string, number, number?][] = [
    [t('base.health'), st.hp, st.hpperlevel],
    [d.partype || t('base.resource'), st.mp, st.mpperlevel],
    [t('base.ad'), st.attackdamage, st.attackdamageperlevel],
    [t('base.as'), st.attackspeed, st.attackspeedperlevel],
    [t('base.armor'), st.armor, st.armorperlevel],
    [t('base.mr'), st.spellblock, st.spellblockperlevel],
    [t('base.ms'), st.movespeed],
    [t('base.range'), st.attackrange],
  ];
  const bars: [string, number][] = [
    [t('base.damage'), d.info.attack],
    [t('base.toughness'), d.info.defense],
    [t('base.magic'), d.info.magic],
    [t('base.difficulty'), d.info.difficulty],
  ];
  return (
    <section className="panel p-4">
      <h2 className="panel-title">{t('base.title')}</h2>
      <dl className="mt-2 space-y-1.5">
        {bars.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[80px_1fr] items-center gap-3 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className="flex gap-0.5">
              <span className="sr-only">{t('base.outOf10', { value: String(v) })}</span>
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} aria-hidden className={clsx('h-1.5 flex-1 rounded-[1px]', i < v ? 'bg-gold' : 'bg-sunken')} />
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-4 text-xs font-semibold text-muted">{t('base.perLevel')}</h3>
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
                    {k === t('base.as') ? '%' : ''}
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
  const partner = ROLE_LABEL[s.synergy.role]?.toLowerCase() ?? t('syn.partner');
  return (
    <section className="panel p-5" aria-labelledby="syn-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="syn-h" className="panel-title text-2xl">
          {t('syn.title')}
        </h2>
        <span className="text-xs text-muted">{t('syn.sub', { partner })}</span>
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
                  <span className="num text-xs text-muted">{t('common.games', { count: m.games })}</span>
                </span>
                <span className={clsx('num text-sm font-semibold', sureTone(m.winRate, m.games))}>{pct(m.winRate, 1)}</span>
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
        {t('top.title')}
      </h2>
      <p className="text-xs text-muted">{t('top.sub')}</p>
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
                <span className={clsx('font-semibold', wlTone(p.winRate, p.games))}>{pct(p.winRate)}</span>
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
