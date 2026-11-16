import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ChevronDown, Search } from 'lucide-react';
import type { ItemStats } from '../../shared/types';
import { api } from '../lib/api';
import { keepWhile } from '../lib/keepWhile';
import { PatchSelect } from '../components/champions/common';
import { assets, champSlug, useStaticData } from '../lib/ddragon';
import { pct, thousands } from '../lib/format';
import { GameImg } from '../components/ui/GameImg';
import { RoleIcon, ROLE_LABEL } from '../components/ui/RoleIcon';
import { ItemTip } from '../components/ui/ItemTip';
import { ErrorState, Skeleton } from '../components/ui/States';
import { t } from '../i18n';

type Row = ItemStats['items'][number];

/** Filters built from Riot's item tags. */
const KINDS = [
  { id: 'all', test: () => true },
  { id: 'ad', test: (tags: string[]) => tags.includes('Damage') },
  { id: 'ap', test: (tags: string[]) => tags.includes('SpellDamage') },
  { id: 'crit', test: (tags: string[]) => tags.includes('CriticalStrike') },
  { id: 'defence', test: (tags: string[]) => ['Health', 'Armor', 'SpellBlock'].some((x) => tags.includes(x)) && !tags.includes('Damage') && !tags.includes('SpellDamage') },
] as const;
type Kind = (typeof KINDS)[number]['id'];
type ChampRow = Row['champions'][number];

/**
 * A champion's win rate with an item against its usual win rate in that role. Green or red only
 * when the gap is past two standard errors; otherwise plain, since most gaps are noise.
 */
function vsUsual(c: ChampRow) {
  const diff = c.winRate - c.usual;
  const se = Math.sqrt(Math.max(c.winRate * (1 - c.winRate), 0.01) / c.games);
  const sure = Math.abs(diff) > 2 * se;
  return { diff, tone: !sure ? 'text-muted' : diff > 0 ? 'text-win' : 'text-loss' };
}

export function ItemsPage() {
  const [params, setParams] = useSearchParams();
  const patch = params.get('patch') ?? undefined;
  const open = Number(params.get('item')) || null;
  const kind = (KINDS.find((k) => k.id === params.get('kind'))?.id ?? 'all') as Kind;
  const [query, setQuery] = useState('');
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const q = useQuery({ queryKey: ['items', patch], queryFn: ({ signal }) => api.items(patch, signal), staleTime: 5 * 60_000, placeholderData: keepWhile(['items']) });
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null) next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    document.title = t('it.title');
  }, []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const test: (tags: string[]) => boolean = KINDS.find((k) => k.id === kind)!.test;
    return (q.data?.items ?? []).filter((r) => {
      const name = a.item(r.id).name;
      return name && (!needle || name.toLowerCase().includes(needle)) && test(sd?.items.get(r.id)?.tags ?? []);
    });
  }, [q.data, query, a, kind, sd]);

  // Arriving from a champion page (?item=…): bring that item into view once the list is in.
  const missing = !!open && !!q.data && !q.data.items.some((r) => r.id === open);
  useEffect(() => {
    if (!open || !q.data) return;
    document.getElementById(`item-${open}`)?.scrollIntoView({ block: 'start' });
  }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: number) => {
    const next = new URLSearchParams(params);
    if (open === id) next.delete('item');
    else next.set('item', String(id));
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{t('it.heading')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {q.data && q.data.builds > 0
              ? t.rich('it.lead', { count: <span className="num font-semibold text-text">{thousands(q.data.builds)}</span>, patch: q.data.patch ?? '' })
              : t('it.noData')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
        <PatchSelect patches={q.data?.patches ?? []} value={q.data?.patch ?? null} onChange={(p) => setParam('patch', p)} />
        <label className="relative flex items-center">
          <span className="sr-only">{t('it.filter')}</span>
          <Search className="pointer-events-none absolute left-2.5 size-4 text-faint" aria-hidden />
          <input
            // Riot IDs and champion names: no autocorrect, capitalisation or spellcheck on phones.
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('it.filter')}
            className="h-9 w-56 rounded border border-line bg-surface pl-8 pr-3 text-sm outline-none placeholder:text-faint focus:border-gold focus:ring-2 focus:ring-gold/50"
          />
        </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t('it.kinds')}>
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            aria-pressed={kind === k.id}
            onClick={() => setParam('kind', k.id === 'all' ? null : k.id)}
            className={clsx(
              'h-8 rounded-full border px-3 text-sm font-medium transition-colors',
              kind === k.id ? 'border-gold bg-gold/10 text-text' : 'border-line text-muted hover:border-line-strong hover:text-text',
            )}
          >
            {t(`it.kind.${k.id}` as 'it.kind.all')}
          </button>
        ))}
      </div>

      {q.isError ? (
        <div className="panel mt-6">
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        </div>
      ) : !q.data ? (
        <Skeleton className="mt-6 h-96" />
      ) : (
        <>
        {missing && <p className="mt-6 rounded border border-line bg-surface px-3 py-2 text-sm text-muted">{t('it.missing', { item: a.item(open!).name || String(open) })}</p>}
        <ul className={clsx('mt-4 divide-y divide-line rounded border border-line bg-surface transition-opacity duration-200', q.isPlaceholderData && 'pointer-events-none opacity-60')} aria-busy={q.isPlaceholderData}>
          {rows.map((r, _i, all) => {
            const it = a.item(r.id);
            // Bar scaled to the most-built item in view, so the drop-off down the list is visible at a glance.
            const top = Math.max(...all.map((x) => x.share));
            const expanded = open === r.id;
            return (
              <li key={r.id} id={`item-${r.id}`} className="scroll-mt-20">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => toggle(r.id)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-raised"
                >
                  <GameImg src={it.url} alt="" size={36} rounded="md" tip={<ItemTip id={r.id} />} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{it.name}</span>
                    <span className="block text-xs text-muted">{t('it.share', { pct: pct(r.share, 1), count: thousands(r.games) })}</span>
                    <span className="mt-1 block h-1 w-full max-w-56 overflow-hidden rounded-full bg-sunken" aria-hidden>
                      <span className="block h-full rounded-full bg-gold/70" style={{ width: `${top ? (r.share / top) * 100 : 0}%` }} />
                    </span>
                  </span>
                  {it.gold > 0 && <span className="num hidden w-20 shrink-0 text-right text-xs text-muted md:block">{t('it.cost', { gold: thousands(it.gold) })}</span>}
                  <span className="hidden items-center gap-1 sm:flex" aria-hidden>
                    {r.champions.slice(0, 5).map((c) => (
                      <GameImg key={`${c.championId}-${c.role}`} src={a.champion(c.championId).url} alt="" size={26} rounded="sm" />
                    ))}
                  </span>
                  <ChevronDown className={clsx('size-4 shrink-0 text-faint transition-transform', expanded && 'rotate-180')} aria-hidden />
                </button>
                {expanded && (
                  <div className="border-t border-line bg-sunken/40 px-3 py-3">
                    <h2 className="mb-2 text-xs font-semibold text-muted">{t('it.whoBuilds', { item: it.name })}</h2>
                    <table className="w-full text-sm">
                      <thead className="text-xs text-faint">
                        <tr>
                          <th scope="col" className="py-1 text-left font-medium">{t('it.col.champion')}</th>
                          <th scope="col" className="py-1 text-right font-medium">{t('it.col.games')}</th>
                          <th scope="col" className="py-1 text-right font-medium">{t('it.col.wr')}</th>
                          <th scope="col" className="hidden py-1 text-right font-medium sm:table-cell">{t('it.col.vsUsual')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.champions.map((c) => {
                          const ch = sd?.champions.get(c.championId);
                          const v = vsUsual(c);
                          return (
                            <tr key={`${c.championId}-${c.role}`} className="border-t border-line/60">
                              <td className="py-1.5">
                                <Link to={ch ? `/champions/${champSlug(ch.id)}?role=${c.role}` : '#'} className="flex items-center gap-2 hover:text-gold">
                                  <GameImg src={a.champion(c.championId).url} alt="" size={24} rounded="sm" />
                                  <span className="truncate">{a.champion(c.championId).name}</span>
                                  <span className="flex items-center gap-1 text-xs text-muted">
                                    <RoleIcon role={c.role} size={12} />
                                    <span className="hidden sm:inline">{ROLE_LABEL[c.role]}</span>
                                  </span>
                                </Link>
                              </td>
                              <td className="num py-1.5 text-right text-muted">{thousands(c.games)}</td>
                              <td className="num py-1.5 text-right">{pct(c.winRate, 1)}</td>
                              <td className={clsx('num hidden py-1.5 text-right sm:table-cell', v.tone)} title={t('it.vsUsualTip', { rate: pct(c.usual, 1) })}>
                                {`${v.diff >= 0 ? '+' : '−'}${pct(Math.abs(v.diff), 1)}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className="mt-2 text-[11px] text-faint">{t('it.note')}</p>
                  </div>
                )}
              </li>
            );
          })}
          {rows.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted">
              {t('it.none')}
              {/* Filtered to nothing: clear both the text and the kind chip in one go. */}
              {(query.trim() || kind !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    const next = new URLSearchParams(params);
                    next.delete('kind');
                    setParams(next, { replace: true });
                  }}
                  className="ml-3 inline-flex min-h-[24px] items-center rounded border border-line px-3 py-1 text-sm font-medium text-text hover:border-gold/60"
                >
                  {t('tl.clearFilter')}
                </button>
              )}
            </li>
          )}
        </ul>
        </>
      )}
    </div>
  );
}
