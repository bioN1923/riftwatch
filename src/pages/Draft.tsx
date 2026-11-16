import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import { keepWhile } from '../lib/keepWhile';
import clsx from 'clsx';
import { callTone, matchupCall } from '../lib/matchupVerdict';
import { Ban, ChevronDown, Crosshair, Plus, Search, Shield, Swords, X } from 'lucide-react';
import type { ChampionStats } from '../../shared/types';
import { PLATFORMS, getPlatform } from '../../shared/regions';
import { api } from '../lib/api';
import { assets, champSlug, useStaticData } from '../lib/ddragon';
import { pct, sureTone } from '../lib/format';
import { damageMix, damageType } from '../lib/damageMix';
import { banSuggestions, cautiousRate, winRange } from '../lib/draft';
import { champHit } from '../lib/champSearch';
import { readPool, savePool } from '../lib/pool';
import { parseRiotId } from '../lib/riotId';
import { me } from '../lib/stats';
import { useRegion } from '../lib/storage';
import { GameImg } from '../components/ui/GameImg';
import { RoleIcon, ROLE_LABEL } from '../components/ui/RoleIcon';
import { ErrorState, Skeleton } from '../components/ui/States';
import { CopyLink } from '../components/ui/CopyLink';
import { t } from '../i18n';

/**
 * Draft helper: you know your role and who you're laning against — which champion should you
 * lock in? Ranks the best answers overall from Riftwatch's matchup data, and ranks your own
 * champion pool against that enemy, so the advice fits champions you actually play.
 */
const ROLES = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const;
type Role = (typeof ROLES)[number];
const MAX_POOL = 8;
const TEAM_SIZE = 5;

export function DraftPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data: sd } = useStaticData();
  // Whether the last enemy pick or "Change" came from the keyboard: then focus follows into the grid's search or back to "Change".
  const [enemyKey, setEnemyKey] = useState(false);
  const role: Role = (ROLES as readonly string[]).includes(params.get('role') ?? '') ? (params.get('role') as Role) : 'MIDDLE';
  const bySlug = useMemo(() => new Map([...(sd?.champions ?? new Map()).entries()].map(([key, c]) => [champSlug(c.id), key])), [sd]);
  const enemy = bySlug.get((params.get('enemy') ?? '').toLowerCase());
  const pool = useMemo(
    () =>
      (params.get('pool') ?? readPool(role))
        .split(',')
        .map((s) => bySlug.get(s.toLowerCase()))
        .filter((x): x is number => x != null)
        .slice(0, MAX_POOL),
    [params, bySlug, role],
  );

  const team = useMemo(
    () =>
      [...new Set((params.get('team') ?? '').split(',').map((s) => bySlug.get(s.toLowerCase())).filter((x): x is number => x != null))].slice(0, TEAM_SIZE),
    [params, bySlug],
  );

  useEffect(() => {
    document.title = t('draft.docTitle');
  }, []);

  const set = (next: { role?: Role; enemy?: number | null; pool?: number[] }) => {
    const p = new URLSearchParams(params);
    if (next.role) p.set('role', next.role);
    if (next.enemy !== undefined) next.enemy == null ? p.delete('enemy') : p.set('enemy', champSlug(sd!.champions.get(next.enemy)!.id));
    if (next.pool) {
      const slugs = next.pool.map((id) => champSlug(sd!.champions.get(id)!.id)).join(',');
      if (slugs) p.set('pool', slugs);
      else p.delete('pool');
      savePool(next.role ?? role, slugs);
    }
    navigate({ search: `?${p.toString().replace(/%2C/gi, ',')}` }, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{t('draft.heading')}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t('draft.lead')}</p>
      <p className="mt-1 text-sm">
        <Link to={`/draft/team?role=${role}`} className="text-gold hover:underline">
          {t('td.fromLane')}
        </Link>
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div role="tablist" aria-label={t('draft.role')} className="flex flex-wrap gap-1.5">
        {ROLES.map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={role === r}
            onClick={() => set({ role: r, pool: readPool(r).split(',').map((s) => bySlug.get(s)).filter((x): x is number => x != null) })}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium transition-colors',
              role === r ? 'border-gold bg-gold/10 text-text' : 'border-line text-muted hover:text-text',
            )}
          >
            <RoleIcon role={r} size={15} /> {ROLE_LABEL[r]}
          </button>
        ))}
      </div>
      {(enemy != null || team.length > 0) && <CopyLink labelled />}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="panel p-4" aria-labelledby="enemy-h">
          <h2 id="enemy-h" className="panel-title flex items-center gap-1.5">
            <Crosshair className="size-4 text-loss" aria-hidden /> {t('draft.enemy', { role: ROLE_LABEL[role] })}
          </h2>
          {enemy != null ? (
            <Chosen
              id={enemy}
              focus={enemyKey}
              onClear={(viaKey) => {
                setEnemyKey(viaKey);
                set({ enemy: null });
              }}
              tone="loss"
            />
          ) : (
            <ChampionGrid
              autoFocus={enemyKey}
              onPick={(id, viaKey) => {
                setEnemyKey(viaKey);
                set({ enemy: id });
              }}
              exclude={[]}
            />
          )}
        </section>

        <section className="panel p-4" aria-labelledby="pool-h">
          <h2 id="pool-h" className="panel-title">
            {t('draft.pool')}
          </h2>
          <p className="mt-0.5 text-xs text-muted">{t('draft.poolLead', { role: ROLE_LABEL[role] })}</p>
          <PoolEditor pool={pool} role={role} onChange={(next) => set({ pool: next })} />
        </section>
      </div>

      {enemy != null ? <Results enemy={enemy} role={role} pool={pool} /> : <BlindPanel role={role} pool={pool} />}
      {pool.length > 0 && <BanPanel role={role} pool={pool} onPick={(id) => set({ enemy: id })} />}
      <TeamDamage
        team={team}
        onChange={(next) => {
          const p = new URLSearchParams(params);
          const slugs = next.map((id) => champSlug(sd!.champions.get(id)!.id)).join(',');
          if (slugs) p.set('team', slugs);
          else p.delete('team');
          navigate({ search: `?${p.toString().replace(/%2C/gi, ',')}` }, { replace: true });
        }}
      />
    </div>
  );
}


/* --------------------------------------------------------- champion grid */

/** `autoFocus`: put the cursor in the search box on open (callers pass it only when the grid was opened from the keyboard). */
export function ChampionGrid({ onPick, exclude, autoFocus = false }: { onPick: (id: number, viaKey: boolean) => void; exclude: number[]; autoFocus?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const needle = q.trim();
    return [...(sd?.champions ?? new Map()).entries()]
      .map(([id, c]) => [id, c, needle ? champHit(needle, c) : 1] as const)
      .filter(([id, , hit]) => !exclude.includes(id) && hit != null)
      .sort((x, y) => (x[2] ?? 3) - (y[2] ?? 3) || x[1].name.localeCompare(y[1].name))
      .map(([id, c]) => [id, c] as const);
  }, [sd, q, exclude]);
  if (!sd) return <Skeleton className="mt-3 h-64" />;
  return (
    <div className="mt-3">
      <label className="relative block">
        <span className="sr-only">{t('draft.search')}</span>
        <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-faint" aria-hidden />
        <input
          // Riot IDs and champion names: no autocorrect, capitalisation or spellcheck on phones.
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          ref={inputRef}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && list[0]) {
              onPick(list[0][0], true);
              setQ('');
            }
          }}
          placeholder={t('draft.search')}
          className="h-9 w-full rounded border border-line bg-sunken pl-8 pr-3 text-sm outline-none placeholder:text-faint focus:border-gold focus:ring-2 focus:ring-gold/50"
        />
      </label>
      <ul className="mt-3 grid max-h-72 grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2 overflow-y-auto pr-1">
        {list.map(([id, c]) => (
          <li key={id}>
            <button
              onClick={(e) => {
                const viaKey = e.detail === 0;
                onPick(id, viaKey);
                setQ('');
                // The picked tile leaves the grid; from the keyboard, carry on from the search box.
                if (viaKey) inputRef.current?.focus();
              }}
              title={c.name} className="group flex w-full flex-col items-center gap-1">
              <GameImg src={a.champion(id).url} alt="" size={48} rounded="md" className="transition-transform group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-gold" />
              <span className="w-full truncate text-center text-[10px] text-muted group-hover:text-text">{c.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Chosen({ id, onClear, tone, focus = false }: { id: number; onClear: (viaKey: boolean) => void; tone: 'win' | 'loss'; focus?: boolean }) {
  const { data: sd } = useStaticData();
  const c = assets(sd).champion(id);
  return (
    <div className="mt-3 flex items-center gap-3">
      <GameImg src={c.url} alt="" size={64} rounded="md" className={clsx('ring-2', tone === 'loss' ? 'ring-loss/70' : 'ring-win/70')} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl font-bold">{c.name}</p>
        <button autoFocus={focus} onClick={(e) => onClear(e.detail === 0)} className="-my-1 inline-block py-1 text-sm text-muted underline hover:text-text">
          {t('draft.change')}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ pool editor */

function PoolEditor({ pool, role, onChange }: { pool: number[]; role: Role; onChange: (next: number[]) => void }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const [adding, setAdding] = useState<false | 'key' | 'pointer'>(false);
  const [importing, setImporting] = useState(false);
  const addRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="mt-3">
      <ul className="flex flex-wrap gap-2">
        {pool.map((id) => (
          <li key={id} className="relative">
            <GameImg src={a.champion(id).url} alt={a.champion(id).name} size={44} rounded="md" />
            <button
              onClick={(e) => {
                onChange(pool.filter((x) => x !== id));
                if (e.detail === 0) addRef.current?.focus(); // keyboard: the removed button is gone, so land on "Add"
              }}
              aria-label={t('draft.removeFromPool', { champion: a.champion(id).name })}
              className="absolute -right-2 -top-2 grid size-[24px] place-items-center rounded-full bg-surface text-faint ring-1 ring-line hover:text-text"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </li>
        ))}
        {pool.length < MAX_POOL && (
          <li>
            <button
              ref={addRef}
              onClick={(e) => setAdding((v) => (v ? false : e.detail === 0 ? 'key' : 'pointer'))}
              aria-expanded={!!adding}
              aria-label={t('draft.addToPool')}
              className="grid size-11 place-items-center rounded-md border border-dashed border-line-strong text-muted hover:border-gold/60 hover:text-text"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </li>
        )}
      </ul>
      {adding && (
        <ChampionGrid
          exclude={pool}
          autoFocus={adding === 'key'}
          onPick={(id) => {
            onChange([...pool, id].slice(0, MAX_POOL));
            if (pool.length + 1 >= MAX_POOL) setAdding(false);
          }}
        />
      )}
      <button onClick={() => setImporting((v) => !v)} aria-expanded={importing} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline">
        {t('draft.import')} <ChevronDown className={clsx('size-3.5 transition-transform', importing && 'rotate-180')} aria-hidden />
      </button>
      {importing && (
        <ImportPool
          role={role}
          onDone={(ids) => {
            onChange([...new Set([...ids, ...pool])].slice(0, MAX_POOL));
            setImporting(false);
          }}
        />
      )}
    </div>
  );
}

/** Fill the pool with the champions a player has played in this role recently. */
function ImportPool({ role, onDone }: { role: Role; onDone: (ids: number[]) => void }) {
  const [region] = useRegion();
  const [text, setText] = useState('');
  const [platform, setPlatform] = useState(region);
  const [state, setState] = useState<'idle' | 'busy' | 'none' | 'error'>('idle');
  const run = async () => {
    const id = parseRiotId(text, getPlatform(platform)?.defaultTag ?? 'EUW');
    if (!id) return;
    setState('busy');
    try {
      const prof = await api.profile(platform, id.gameName, id.tagLine);
      const page = await api.matches(platform, prof.account.puuid, { start: 0, count: 20, queue: 'all' });
      const counts = new Map<number, number>();
      for (const m of page.matches) {
        const p = me(m, prof.account.puuid);
        if (p && !m.remake && p.position === role) counts.set(p.championId, (counts.get(p.championId) ?? 0) + 1);
      }
      const ids = [...counts.entries()].sort((x, y) => y[1] - x[1]).map(([cid]) => cid);
      if (!ids.length) return setState('none');
      setState('idle');
      onDone(ids);
    } catch {
      setState('error');
    }
  };
  return (
    <form
      className="mt-2 flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void run();
      }}
    >
      <input
        // Riot IDs and champion names: no autocorrect, capitalisation or spellcheck on phones.
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('cmp.placeholder')}
        aria-label={t('pv.riotId')}
        className="h-9 min-w-0 flex-1 rounded border border-line bg-sunken px-3 text-sm outline-none placeholder:text-faint focus:border-gold focus:ring-2 focus:ring-gold/50"
      />
      <select value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label={t('ms.region')} className="h-9 rounded border border-line bg-sunken px-2 text-sm">
        {PLATFORMS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <button disabled={state === 'busy' || !text.includes('#')} className="h-9 rounded bg-gold px-3 text-sm font-semibold text-gold-ink disabled:opacity-40">
        {state === 'busy' ? t('draft.importing') : t('draft.importGo')}
      </button>
      {state === 'none' && <p className="w-full text-xs text-muted">{t('draft.importNone', { role: ROLE_LABEL[role] })}</p>}
      {state === 'error' && <p className="w-full text-xs text-loss">{t('pv.notFound')}</p>}
    </form>
  );
}

/* ---------------------------------------------------------------- results */

interface Answer {
  championId: number;
  games: number;
  winRate: number; // ours, against the enemy
  adjusted: number;
  goldDiff15: number | null;
}

function Results({ enemy, role, pool }: { enemy: number; role: Role; pool: number[] }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const q = useQuery({
    queryKey: ['champion', enemy, 'ranked', role, undefined],
    queryFn: ({ signal }) => api.champion(enemy, { group: 'ranked', role }, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepWhile(['champion', enemy], 1),
  });
  if (q.isPending) return <Skeleton className="mt-6 h-64" />;
  // A failed load isn't "not enough games": say what happened and offer a retry.
  if (q.isError && !q.data)
    return (
      <div className="mt-6">
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </div>
    );
  const s = q.data as ChampionStats | undefined;
  const enemyName = a.champion(enemy).name;
  // The enemy's matchups, seen from our side of the lane.
  const min = Math.max(8, Math.round((s?.summary?.games ?? 0) * 0.03));
  const answers: Answer[] = (s?.role === role ? s.matchups : []).map((m) => ({
    championId: m.championId,
    games: m.games,
    winRate: 1 - m.winRate,
    adjusted: 1 - m.adjusted,
    goldDiff15: m.goldDiff15 == null ? null : -m.goldDiff15,
  }));
  // Only matchups that actually favour us count as answers.
  // Ranked by what each answer can be fairly sure of, so a lucky 40 games doesn't top 400 solid ones.
  const best = answers
    .filter((x) => x.games >= min && x.adjusted >= 0.5)
    .sort((x, y) => cautiousRate(y.adjusted, y.games) - cautiousRate(x.adjusted, x.games))
    .slice(0, 8);
  const mine = pool
    .map((id) => answers.find((x) => x.championId === id) ?? { championId: id, games: 0, winRate: 0, adjusted: 0, goldDiff15: null })
    .sort((x, y) => (y.games >= min ? cautiousRate(y.adjusted, y.games) : -1) - (x.games >= min ? cautiousRate(x.adjusted, x.games) : -1));
  const top = mine.find((x) => x.games >= min);

  if (!best.length && !mine.length) {
    return <p className="panel mt-6 p-4 text-sm text-muted">{t('draft.noData', { enemy: enemyName, role: ROLE_LABEL[role] })}</p>;
  }
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="panel p-4" aria-labelledby="best-h">
        <h2 id="best-h" className="panel-title flex items-center gap-1.5">
          <Swords className="size-4 text-gold" aria-hidden /> {t('draft.best', { enemy: enemyName })}
        </h2>
        <p className="mt-0.5 text-xs text-muted">{t('draft.bestLead', { patch: s?.patch ?? '' })}</p>
        {best.length ? <AnswerList list={best} enemy={enemy} role={role} min={min} inPool={new Set(pool)} /> : <p className="mt-3 text-sm text-faint">{t('draft.fewGames')}</p>}
      </section>
      <section className="panel p-4" aria-labelledby="mine-h">
        <h2 id="mine-h" className="panel-title">
          {t('draft.yours')}
        </h2>
        {mine.length ? (
          <>
            {top && (
              <p className="mt-1 text-sm">
                {t.rich('draft.pick', { champion: <b className="text-gold">{a.champion(top.championId).name}</b>, rate: pct(top.winRate, 1) })}
              </p>
            )}
            <AnswerList list={mine} enemy={enemy} role={role} min={min} />
          </>
        ) : (
          <p className="mt-1 text-sm text-muted">{t('draft.emptyPool')}</p>
        )}
      </section>
    </div>
  );
}

/** Before the enemy laner is known (first pick): champions with no hard counters. */
function BlindPanel({ role, pool }: { role: Role; pool: number[] }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const q = useQuery({ queryKey: ['blind', role], queryFn: ({ signal }) => api.blind(role, signal), staleTime: 5 * 60_000, placeholderData: keepWhile(['blind']) });
  if (q.isPending) return <Skeleton className="mt-6 h-48" />;
  if (q.isError && !q.data)
    return (
      <div className="mt-6">
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </div>
    );
  const picks = q.data?.picks ?? [];
  const yours = new Set(pool);
  return (
    <section className="panel mt-6 p-4" aria-labelledby="blind-h">
      <h2 id="blind-h" className="panel-title flex items-center gap-1.5">
        <Shield className="size-4 text-gold" aria-hidden /> {t('draft.blindTitle', { role: ROLE_LABEL[role] })}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{t('draft.blindLead')}</p>
      {picks.length ? (
        <ol className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {picks.map((p) => {
            const c = a.champion(p.championId);
            const w = a.champion(p.worst.championId);
            const slug = sd?.champions.get(p.championId)?.id;
            return (
              <li key={p.championId}>
                <Link
                  to={slug ? `/champions/${champSlug(slug)}?role=${role}` : '#'}
                  className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded px-1 py-1.5 transition-colors hover:bg-raised"
                >
                  <GameImg src={c.url} alt="" size={36} rounded="md" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {c.name}
                      {yours.has(p.championId) && <span className="ml-1.5 rounded-sm bg-gold/15 px-1 text-[10px] font-semibold text-gold">{t('draft.inPool')}</span>}
                    </span>
                    <span className="num block truncate text-[11px] text-muted">{t('draft.blindWorst', { name: w.name, rate: pct(p.worst.winRate) })} · {t('common.games', { count: p.worst.games })}</span>
                  </span>
                  <span className={clsx('num text-right text-sm font-bold', sureTone(p.winRate, p.games))}>{pct(p.winRate, 1)}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-faint">{t('draft.blindNone')}</p>
      )}
    </section>
  );
}

/** The enemy laners the player's pool does worst against: what to ban in champion select. */
function BanPanel({ role, pool, onPick }: { role: Role; pool: number[]; onPick: (id: number) => void }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const qs = useQueries({
    queries: pool.map((id) => ({
      queryKey: ['champion', id, 'ranked', role, undefined],
      queryFn: ({ signal }: { signal: AbortSignal }) => api.champion(id, { group: 'ranked', role }, signal),
      staleTime: 5 * 60_000,
    })),
  });
  if (qs.some((q) => q.isPending)) return <Skeleton className="mt-6 h-40" />;
  const stats = new Map(pool.map((id, i) => [id, qs[i].data as ChampionStats | undefined]));
  const bans = banSuggestions(pool, stats, role);
  return (
    <section className="panel mt-6 p-4" aria-labelledby="ban-h">
      <h2 id="ban-h" className="panel-title flex items-center gap-1.5">
        <Ban className="size-4 text-loss" aria-hidden /> {t('draft.banTitle')}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{t('draft.banLead', { role: ROLE_LABEL[role] })}</p>
      {bans.length ? (
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {bans.map((b) => {
            const c = a.champion(b.championId);
            return (
              <li key={b.championId} className={clsx('rounded border p-3', b.sure ? 'border-line' : 'border-dashed border-line')}>
                <div className="flex items-center gap-3">
                  <GameImg src={c.url} alt="" size={44} rounded="md" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="num text-xs text-muted">
                      {t.rich('draft.banRate', { rate: <b className={b.sure ? 'text-loss' : 'text-muted'}>{pct(b.poolRate, 1)}</b> })} · {t('common.games', { count: b.games })}
                    </p>
                    {!b.sure && <p className="text-[11px] text-faint">{t('tl.leaning')}</p>}
                  </div>
                </div>
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t('draft.banHard', { name: c.name })}>
                  {b.against.map((x) => (
                    <li key={x.championId} className="flex items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[11px]" title={a.champion(x.championId).name}>
                      <GameImg src={a.champion(x.championId).url} alt={a.champion(x.championId).name} size={18} rounded="sm" />
                      <span className={clsx('num font-semibold', callTone(matchupCall(x)))}>{pct(x.winRate)}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => onPick(b.championId)} className="mt-2 text-xs text-gold underline underline-offset-2 hover:text-text">
                  {t('draft.banAnswers', { name: c.name })}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-faint">{t('draft.banNone')}</p>
      )}
    </section>
  );
}

/**
 * A matchup win rate with its likely range underneath. Green or red only when the whole range is on
 * one side of 50%; otherwise it could be chance, so it stays neutral.
 */
function RateWithRange({ rate, games }: { rate: number; games: number }) {
  const [lo, hi] = winRange(rate, games);
  const tone = lo > 0.5 ? 'text-win' : hi < 0.5 ? 'text-loss' : 'text-text';
  return (
    <span className="text-right" title={t('draft.rangeTip', { lo: pct(lo), hi: pct(hi), count: games })}>
      <span className={clsx('num block text-sm font-bold', tone)}>{pct(rate, 1)}</span>
      <span className="num block text-[10px] text-faint">
        {Math.round(lo * 100)}–{Math.round(hi * 100)}%
      </span>
    </span>
  );
}

function AnswerList({ list, enemy, role, min, inPool }: { list: Answer[]; enemy: number; role: Role; min: number; inPool?: Set<number> }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const enemySlug = sd?.champions.get(enemy)?.id;
  return (
    <ol className="mt-3 space-y-1">
      {list.map((x) => {
        const c = a.champion(x.championId);
        const slug = sd?.champions.get(x.championId)?.id;
        const enough = x.games >= min;
        return (
          <li key={x.championId}>
            <Link
              to={slug && enemySlug ? `/champions/${champSlug(slug)}/vs/${champSlug(enemySlug)}?role=${role}` : '#'}
              className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded px-1 py-1.5 transition-colors hover:bg-raised"
            >
              <GameImg src={c.url} alt="" size={36} rounded="md" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {c.name}
                  {inPool?.has(x.championId) && <span className="ml-1.5 rounded-sm bg-gold/15 px-1 text-[10px] font-semibold text-gold">{t('draft.inPool')}</span>}
                </span>
                <span className="num block text-[11px] text-muted">
                  {enough ? t('common.games', { count: x.games }) : t('draft.notEnough', { count: x.games })}
                  {enough && x.games < 30 && <span className="text-kda-great"> · {t('draft.small')}</span>}
                  {enough && x.goldDiff15 != null && ` · ${t('draft.gold15', { gold: `${x.goldDiff15 >= 0 ? '+' : '−'}${Math.abs(Math.round(x.goldDiff15))}` })}`}
                </span>
              </span>
              {enough ? (
                <RateWithRange rate={x.winRate} games={x.games} />
              ) : (
                <span className="text-right text-xs text-faint">–</span>
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/* ----------------------------------------------------------- team damage */

/**
 * Your team's damage mix while picks come in: lock-ins so far and whether they lean physical or
 * magic, so the last picks can balance it. Lives in the URL only (shareable, nothing saved).
 */
function TeamDamage({ team, onChange }: { team: number[]; onChange: (next: number[]) => void }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const [opened, setOpen] = useState<false | 'key' | 'pointer'>(false);
  const open = opened || team.length > 0;
  // Same focus hand-off as the team draft: removed buttons and the "Add" button disappear when used.
  const sectionRef = useRef<HTMLElement>(null);
  const refocus = useRef<number | null>(null);
  useEffect(() => {
    const want = refocus.current;
    if (want == null) return;
    refocus.current = null;
    const removes = sectionRef.current?.querySelectorAll<HTMLButtonElement>('button[data-remove]') ?? [];
    const next = removes[Math.min(want, removes.length - 1)] ?? sectionRef.current?.querySelector<HTMLInputElement>('input');
    next?.focus();
  });
  const ratings = team.map((id) => sd?.champions.get(id)?.dmg);
  const mix = team.length ? damageMix(ratings) : null;
  const label = (id: number) => {
    const k = damageType(sd?.champions.get(id)?.dmg);
    return k === 'ad' ? t('draft.teamAd') : k === 'ap' ? t('draft.teamAp') : k === 'mixed' ? t('draft.teamMixed') : '';
  };
  return (
    <section ref={sectionRef} className="panel mt-6 p-4" aria-labelledby="team-h">
      <h2 id="team-h" className="panel-title flex items-center gap-1.5">
        <Shield className="size-4 text-gold" aria-hidden /> {t('draft.teamTitle')}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{t('draft.teamLead')}</p>
      {team.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {team.map((id, i) => (
            <li key={id} className="flex items-center gap-2 rounded border border-line bg-surface py-1 pl-1 pr-1.5">
              <GameImg src={a.champion(id).url} alt="" size={32} rounded="sm" />
              <span className="text-sm">
                {a.champion(id).name}
                <span className="block text-[11px] text-muted">{label(id)}</span>
              </span>
              <button
                data-remove
                onClick={(e) => {
                  if (e.detail === 0) refocus.current = i;
                  onChange(team.filter((x) => x !== id));
                }}
                aria-label={t('draft.teamRemove', { champion: a.champion(id).name })}
                className="ml-1 grid size-6 place-items-center rounded text-muted hover:bg-raised hover:text-text"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {mix && (
        <p className="mt-3 text-sm" role="status">
          <span className="num font-semibold">
            {[mix.ad && t('live.dmgAd', { n: mix.ad }), mix.ap && t('live.dmgAp', { n: mix.ap }), mix.mixed && t('live.dmgMixed', { n: mix.mixed })].filter(Boolean).join(' · ')}
          </span>{' '}
          <span className={clsx('ml-1', mix.lean ? 'text-kda-great' : 'text-muted')}>
            {mix.lean === 'ad' ? t('draft.teamLeanAd') : mix.lean === 'ap' ? t('draft.teamLeanAp') : t('draft.teamBalanced')}
          </span>
        </p>
      )}
      {team.length < TEAM_SIZE &&
        (open ? (
          <ChampionGrid
            autoFocus={opened === 'key'}
            onPick={(id) => {
              const next = [...team, id].slice(0, TEAM_SIZE);
              if (next.length >= TEAM_SIZE) refocus.current = next.length - 1; // the grid closes: land on the last remove button
              onChange(next);
            }}
            exclude={team}
          />
        ) : (
          <button onClick={(e) => setOpen(e.detail === 0 ? 'key' : 'pointer')} className="mt-3 inline-flex items-center gap-1.5 rounded border border-line px-3 py-1.5 text-sm font-medium text-muted hover:border-gold/60 hover:text-text">
            <Plus className="size-4" aria-hidden /> {t('draft.teamAdd')}
          </button>
        ))}
      {team.length > 0 && <p className="mt-2 text-[11px] text-faint">{t('live.dmgNote')}</p>}
    </section>
  );
}
