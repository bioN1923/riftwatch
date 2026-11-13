import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Search, Clock, Star, X, ChevronDown, BadgeCheck, LoaderCircle, Swords } from 'lucide-react';
import { PLATFORMS, getPlatform } from '../../shared/regions';
import type { PlayerHit } from '../../shared/types';
import { parseRiotId, profilePath } from '../lib/riotId';
import { removeRecent, useFavorites, useRecent, useRegion, type SavedPlayer } from '../lib/storage';
import { GameImg } from './ui/GameImg';
import { assets, champSlug, rankEmblem, useStaticData } from '../lib/ddragon';
import { api } from '../lib/api';
import { champClass, regionName, tierName } from '../lib/format';
import { fadeIn } from '../lib/motion';
import { t } from '../i18n';
import { champHit } from '../lib/champSearch';

type Option =
  | { kind: 'player'; player: PlayerHit; source: 'favorite' | 'recent' | 'match' }
  | { kind: 'champion'; championId: number; slug: string; name: string; title: string; tags: string[] }
  | { kind: 'go'; label: string };

const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER']);
const squash = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
const keyOf = (p: { platform: string; gameName: string; tagLine: string }) => `${p.platform}:${p.gameName}#${p.tagLine}`.toLowerCase();

function useWide() {
  const query = '(min-width: 640px)';
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Bold the part of the name the user typed. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.split('#')[0].trim().toLowerCase();
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-text">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function SearchBox({ variant = 'compact', autoFocus }: { variant?: 'hero' | 'compact'; autoFocus?: boolean }) {
  const navigate = useNavigate();
  const [region, setRegion] = useRegion();
  const platform = getPlatform(region) ?? PLATFORMS[0];
  const recent = useRecent();
  const favorites = useFavorites();
  const { data: sd } = useStaticData();
  const a = assets(sd);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const hero = variant === 'hero';
  const wide = useWide();

  const q = query.trim();
  const fast = useDebounced(q, 160);
  const slow = useDebounced(q, 550);
  const fullId = /#.{2,}$/.test(slow);

  const indexQ = useQuery({
    queryKey: ['search', platform.id, fast],
    queryFn: ({ signal }) => api.search(platform.id, fast, false, signal),
    enabled: fast.length >= 2,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
  // Once a full Riot ID has been typed, also check Riot directly so brand-new players show up.
  const resolveQ = useQuery({
    queryKey: ['search-resolve', platform.id, slow],
    queryFn: ({ signal }) => api.search(platform.id, slow, true, signal),
    enabled: fullId,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const options = useMemo<Option[]>(() => {
    const lower = q.toLowerCase();
    const seen = new Set<string>();
    const out: Option[] = [];
    const push = (player: PlayerHit, source: 'favorite' | 'recent' | 'match') => {
      const k = keyOf(player);
      if (seen.has(k)) return;
      seen.add(k);
      out.push({ kind: 'player', player, source });
    };
    const savedMatch = (p: SavedPlayer) => !lower || `${p.gameName}#${p.tagLine}`.toLowerCase().includes(lower.replace(/\s+/g, ' '));
    const toHit = (p: SavedPlayer): PlayerHit => ({ ...p });

    if (q.length >= 2) {
      const verified = (fullId && slow === q ? resolveQ.data : undefined)?.filter((h) => h.verified) ?? [];
      verified.forEach((h) => push(h, 'match'));
    }
    favorites.filter(savedMatch).forEach((p) => push(toHit(p), 'favorite'));
    recent.filter(savedMatch).forEach((p) => push(toHit(p), 'recent'));
    if (q.length >= 2) (indexQ.data ?? []).forEach((h) => push(h, 'match'));

    // Champions: nicknames ("mf", "j4"), then names that start with the query ("ka" → Kai'Sa, Karma…), then names containing it.
    const champs: Option[] = [];
    const cq = squash(q);
    if (cq.length >= 2 && !q.includes('#') && sd) {
      // Nicknames and exact names first ("tf", "j4"), then names starting with the query, then containing it.
      const buckets: Option[][] = [[], [], []];
      for (const [id, c] of sd.champions) {
        const hit = champHit(q, c);
        if (hit != null) buckets[hit].push({ kind: 'champion', championId: id, slug: champSlug(c.id), name: c.name, title: c.title, tags: c.tags });
      }
      const byName = (a: Option, b: Option) => (a as { name: string }).name.localeCompare((b as { name: string }).name);
      for (const b of buckets) champs.push(...b.sort(byName));
    }
    const list = [...champs.slice(0, 4), ...out.slice(0, champs.length ? 6 : 8)];
    const id = parseRiotId(q, platform.defaultTag);
    if (id && !seen.has(keyOf({ platform: platform.id, ...id }))) list.push({ kind: 'go', label: `${id.gameName}#${id.tagLine}` });
    return list;
  }, [q, slow, fullId, resolveQ.data, indexQ.data, favorites, recent, platform.id, platform.defaultTag, sd]);

  useEffect(() => setActive(0), [query]);

  // "/" focuses search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function choose(o: Option | undefined) {
    if (!o) {
      setHint(t('search.hintEmpty'));
      return;
    }
    if (o.kind === 'champion') navigate(`/champions/${o.slug}`);
    else if (o.kind === 'go') navigate(profilePath(platform.id, parseRiotId(q, platform.defaultTag)!));
    else navigate(profilePath(o.player.platform, o.player));
    setQuery('');
    setOpen(false);
    setHint(null);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(options[open ? active : 0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const searching = (indexQ.isFetching && fast.length >= 2) || resolveQ.isFetching;
  const showList = open && (options.length > 0 || searching);
  const missingTag = q && !q.includes('#') && !options.some((o) => o.kind === 'champion');

  return (
    <div ref={rootRef} className={clsx('relative w-full', hero ? 'max-w-2xl' : 'max-w-md')}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          choose(options[active]);
        }}
        className={clsx(
          'flex items-stretch overflow-hidden border bg-surface transition-colors focus-within:border-gold',
          hero ? 'h-14 rounded-md border-line-strong shadow-panel sm:h-16' : 'h-10 rounded border-line',
        )}
      >
        <label className="relative flex items-center border-r border-line">
          <span className="sr-only">{t('search.region')}</span>
          <select
            value={platform.id}
            onChange={(e) => setRegion(e.target.value)}
            className={clsx(
              'h-full cursor-pointer appearance-none bg-transparent font-display font-bold tracking-wide text-text outline-none focus-visible:bg-raised',
              hero ? 'pl-4 pr-9 text-lg sm:pl-5 sm:text-xl' : 'pl-3 pr-7 text-base',
            )}
          >
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {hero && wide ? `${p.label} — ${regionName(p.id)}` : p.label}
              </option>
            ))}
          </select>
          <ChevronDown className={clsx('pointer-events-none absolute text-muted', hero ? 'right-3 size-4' : 'right-2 size-3.5')} aria-hidden />
        </label>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && options[active] ? `${listId}-${active}` : undefined}
          aria-label={t('search.aria')}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHint(null);
          }}
          // Open on a click or once typing starts — not on the automatic focus when the page loads.
          onMouseDown={() => setOpen(true)}
          onFocus={() => {
            if (query) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={hero ? (wide ? t('search.phHeroWide') : t('search.phHero')) : t('search.phCompact')}
          className={clsx('min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-faint', hero ? 'px-4 text-base sm:px-5 sm:text-lg' : 'px-3 text-sm')}
        />
        {searching && <LoaderCircle className="mr-2 size-4 animate-spin self-center text-faint" aria-label={t('search.searching')} />}
        {!hero && !searching && (
          <kbd className="mr-2 hidden self-center rounded border border-line px-1.5 text-xs text-faint sm:block" aria-hidden>
            /
          </kbd>
        )}
        <button type="submit" aria-label={t('search.submit')} className={clsx('grid place-items-center bg-gold text-gold-ink transition hover:brightness-110', hero ? 'w-14 sm:w-16' : 'w-10')}>
          <Search className={hero ? 'size-6' : 'size-4'} strokeWidth={2.5} aria-hidden />
        </button>
      </form>

      {hero && (
        <p className={clsx('mt-2 h-5 px-1 text-left text-sm', hint ? 'text-loss' : 'text-muted')} aria-live="polite">
          {hint ?? (missingTag ? t('search.hintTag', { tag: platform.defaultTag }) : '')}
        </p>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('search.suggestions')}
          className="drop-in absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-[70vh] overflow-y-auto rounded-md border border-line-strong bg-surface py-1 text-left shadow-2xl"
        >
          {options.map((o, i) => {
            const selected = i === active;
            const common = {
              id: `${listId}-${i}`,
              role: 'option' as const,
              'aria-selected': selected,
              onMouseEnter: () => setActive(i),
              onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
              onClick: () => choose(o),
              className: clsx('flex cursor-pointer items-center gap-3 px-3 py-2', selected && 'bg-raised'),
            };
            if (o.kind === 'champion') {
              const prev = options[i - 1];
              return (
                <li key={`c${o.championId}`} {...common} className={clsx(common.className, i > 0 && prev?.kind !== 'champion' && 'border-t border-line')}>
                  <GameImg src={a.champion(o.championId).url} alt="" size={32} rounded="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-text/90">
                      <Highlight text={o.name} query={q} />
                    </span>
                    {/* Class under the name, so the name keeps the row's width ("Twisted Fate", not "Twist…"). */}
                    <span className="block truncate text-xs text-faint">
                      {o.tags.slice(0, 2).map(champClass).join(' · ')}
                      <span className="capitalize"> · {o.title}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 rounded bg-sunken px-1.5 py-0.5 font-display text-sm font-bold text-gold">
                    <Swords className="size-3.5" aria-hidden />
                    {/* Phones: icon only, so the name isn't squeezed; the word stays for screen readers. */}
                    <span className="sr-only sm:not-sr-only">{t('search.champion')}</span>
                  </span>
                </li>
              );
            }
            if (o.kind === 'go') {
              return (
                <li key="go" {...common} className={clsx(common.className, 'border-t border-line')}>
                  <span className="grid size-8 place-items-center rounded-full bg-sunken">
                    <Search className="size-4 text-gold" aria-hidden />
                  </span>
                  <span className="truncate text-muted">
                    {t.rich('search.lookUp', { id: <strong className="font-semibold text-text">{o.label}</strong> })}
                  </span>
                  <span className="ml-auto rounded bg-sunken px-1.5 py-0.5 font-display text-sm font-bold text-muted">{platform.label}</span>
                </li>
              );
            }
            const p = o.player;
            return (
              <li key={keyOf(p)} {...common} className={clsx(common.className, options[i - 1]?.kind === 'champion' && 'border-t border-line')}>
                <span className="relative">
                  <GameImg src={p.profileIconId != null ? a.profileIcon(p.profileIconId) : undefined} alt="" size={32} rounded="full" />
                  {p.level != null && (
                    <span className="num absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-bg px-1 text-[9px] font-semibold text-muted ring-1 ring-line">{p.level}</span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate text-muted">
                    <span className="truncate text-text/90">
                      <Highlight text={p.gameName} query={q} />
                    </span>
                    <span className="shrink-0">#{p.tagLine}</span>
                    {p.verified && <BadgeCheck className="size-3.5 shrink-0 text-win" aria-label={t('search.verified')} />}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    {p.tier ? (
                      <>
                        <img src={rankEmblem(p.tier)} alt="" {...fadeIn()} className="size-4" />
                        {tierName(p.tier)} {APEX.has(p.tier) ? '' : p.rank}
                        {p.lp != null && <span className="num text-faint"> · {p.lp} LP</span>}
                      </>
                    ) : (
                      <span className="text-faint">{p.level != null ? t('search.rankNotLoaded') : t('search.seenInMatch')}</span>
                    )}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                  <span className="font-display text-sm font-bold">{getPlatform(p.platform)?.label}</span>
                  {o.source === 'favorite' && <Star className="size-3.5 fill-gold text-gold" aria-label={t('search.favorite')} />}
                  {o.source === 'recent' && (
                    <>
                      <Clock className="size-3.5" aria-label={t('search.recent')} />
                      <button
                        type="button"
                        aria-label={t('search.removeRecent', { name: p.gameName })}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecent(p as SavedPlayer);
                        }}
                        className="rounded p-0.5 hover:bg-sunken hover:text-text"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </>
                  )}
                </span>
              </li>
            );
          })}
          {options.length === 0 && searching && <li className="px-3 py-3 text-sm text-muted">{t('search.searchingDots')}</li>}
        </ul>
      )}
    </div>
  );
}
