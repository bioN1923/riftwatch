import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ChevronDown, HeartHandshake } from 'lucide-react';
import type { MatchPage, MatchSummary, ScoutInfo } from '../../shared/types';
import { PLATFORMS, getPlatform } from '../../shared/regions';
import { api } from '../lib/api';
import { rankEmblem, useStaticData } from '../lib/ddragon';
import { decimal, pct, tierName } from '../lib/format';
import { fromSlug, parseRiotId, profilePath, querySlug, type RiotId } from '../lib/riotId';
import { useFavorites, useRecent, useRegion } from '../lib/storage';
import { duoFit, MAX_RANK_GAP, playStyle, rankSteps, type Fit, type FitPart, type PlayStyle } from '../lib/duoFit';
import { ROLE_LABEL, RoleIcon } from '../components/ui/RoleIcon';
import { ErrorState, Skeleton } from '../components/ui/States';
import { t } from '../i18n';

/** How many of your recent co-players get a rank check, and how many of those get a full look. */
const CHECK = 12;
const SCORE = 5;

/**
 * Duo finder: people you've recently played with or against, in other roles, around your rank,
 * scored on how well they'd fit next to you. Only players already in your own recent games are
 * looked at; it never searches the wider player base.
 */
export function DuoPage() {
  const [params, setParams] = useSearchParams();
  const platform = getPlatform(params.get('region') ?? '')?.id ?? null;
  const id = fromSlug(params.get('player') ?? '');
  useEffect(() => {
    document.title = `${t('duo.pageTitle')} · Riftwatch`;
  }, []);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{t('duo.pageTitle')}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t('duo.lead')}</p>
      <PlayerForm key={`${platform}/${id ? querySlug(id) : ''}`} platform={platform} id={id} onSubmit={(p, i) => setParams({ region: p, player: querySlug(i) })} />
      {platform && id && <Results platform={platform} id={id} />}
    </div>
  );
}

function PlayerForm({ platform, id, onSubmit }: { platform: string | null; id: RiotId | null; onSubmit: (platform: string, id: RiotId) => void }) {
  const [region] = useRegion();
  const [text, setText] = useState(id ? `${id.gameName}#${id.tagLine}` : '');
  const [reg, setReg] = useState(platform ?? region);
  const favorites = useFavorites();
  const recent = useRecent();
  const quick = useMemo(() => {
    const seen = new Set<string>();
    return [...favorites, ...recent].filter((p) => {
      const k = `${p.platform}${p.gameName}#${p.tagLine}`.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 6);
  }, [favorites, recent]);
  const parsed = parseRiotId(text, getPlatform(reg)?.defaultTag ?? 'EUW');
  return (
    <form
      className="mt-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (parsed) onSubmit(reg, parsed);
      }}
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 basis-60">
          <span className="mb-1 block text-xs text-muted">{t('duo.you')}</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('cmp.placeholder')}
            spellCheck={false}
            autoComplete="off"
            className="h-10 w-full rounded border border-line bg-surface px-3 text-sm outline-none placeholder:text-faint focus:border-gold focus:ring-2 focus:ring-gold/50"
          />
        </label>
        <label className="relative w-24 shrink-0">
          <span className="mb-1 block text-xs text-muted">{t('ms.region')}</span>
          <select value={reg} onChange={(e) => setReg(e.target.value)} className="h-10 w-full appearance-none rounded border border-line bg-surface px-3 font-display text-lg font-bold">
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute bottom-3 right-2.5 size-4 text-muted" aria-hidden />
        </label>
        <button type="submit" disabled={!parsed} className="inline-flex h-10 items-center gap-2 rounded bg-gold px-4 font-semibold text-gold-ink disabled:opacity-50">
          <HeartHandshake className="size-4" aria-hidden /> {t('duo.find')}
        </button>
      </div>
      {quick.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted">{t('cmp.quick')}</span>
          {quick.map((p) => (
            <button
              key={`${p.platform}${p.gameName}${p.tagLine}`}
              type="button"
              onClick={() => onSubmit(p.platform, { gameName: p.gameName, tagLine: p.tagLine })}
              className="min-h-[24px] rounded-full border border-line px-2.5 py-0.5 text-muted hover:border-gold/60 hover:text-text"
            >
              {p.gameName}
              <span className="text-faint">#{p.tagLine}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

interface Candidate {
  puuid: string;
  gameName: string;
  tagLine: string;
  seen: number; // games in your recent list
  together: number; // of those, on your team
  togetherWins: number;
}

/** Everyone in your recent games except you and hidden profiles, most often seen first. */
function candidatesFrom(matches: MatchSummary[], puuid: string): Candidate[] {
  const map = new Map<string, Candidate>();
  for (const m of matches) {
    if (m.remake) continue;
    const mine = m.participants.find((p) => p.puuid === puuid);
    if (!mine) continue;
    for (const p of m.participants) {
      if (p.puuid === puuid || p.hidden || !p.gameName) continue;
      const c = map.get(p.puuid) ?? { puuid: p.puuid, gameName: p.gameName, tagLine: p.tagLine, seen: 0, together: 0, togetherWins: 0 };
      c.seen++;
      if (p.teamId === mine.teamId) {
        c.together++;
        if (mine.win) c.togetherWins++;
      }
      map.set(p.puuid, c);
    }
  }
  return [...map.values()].sort((a, b) => b.seen - a.seen || b.together - a.together);
}

function Results({ platform, id }: { platform: string; id: RiotId }) {
  const { data: sd } = useStaticData();
  const tagsOf = (cid: number) => sd?.champions.get(cid)?.tags ?? [];
  const profileQ = useQuery({
    queryKey: ['profile', platform, id.gameName.toLowerCase(), id.tagLine.toLowerCase()],
    queryFn: ({ signal }) => api.profile(platform, id.gameName, id.tagLine, { signal }),
    retry: false,
  });
  const puuid = profileQ.data?.account.puuid;
  const mineQ = useQuery({
    queryKey: ['duo-me', platform, puuid],
    enabled: !!puuid,
    queryFn: ({ signal }) => api.matches(platform, puuid!, { start: 0, count: 20, queue: 'solo' }, signal),
    staleTime: 10 * 60_000,
  });
  const solo = profileQ.data?.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
  const myRank = rankSteps(solo?.tier, solo?.rank);
  const me = useMemo(() => (mineQ.data && puuid && sd ? playStyle(mineQ.data.matches, puuid, tagsOf) : null), [mineQ.data, puuid, sd]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stage 1: everyone from your recent games who doesn't play your role there.
  const pool = useMemo(() => {
    if (!mineQ.data || !puuid || !me?.mainRole) return [];
    const roleIn = (c: Candidate) => {
      const counts: Record<string, number> = {};
      for (const m of mineQ.data!.matches) for (const p of m.participants) if (p.puuid === c.puuid && p.position) counts[p.position] = (counts[p.position] ?? 0) + 1;
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    };
    return candidatesFrom(mineQ.data.matches, puuid).filter((c) => roleIn(c) !== me.mainRole).slice(0, CHECK);
  }, [mineQ.data, puuid, me]);

  // Stage 2: their rank (one small lookup each), kept only around yours.
  const scouts = useQueries({
    queries: pool.map((c) => ({
      queryKey: ['scout', platform, c.puuid, undefined],
      queryFn: ({ signal }: { signal: AbortSignal }) => api.scout(platform, c.puuid, undefined, signal),
      staleTime: 10 * 60_000,
    })),
  }) as { data?: ScoutInfo; isPending: boolean }[];
  const close = pool
    .map((c, i) => ({ c, s: scouts[i]?.data }))
    .filter(({ s }) => s && !s.hidden && myRank != null && (() => { const r = rankSteps(s.solo?.tier, s.solo?.rank); return r != null && Math.abs(r - myRank) <= MAX_RANK_GAP; })())
    .slice(0, SCORE);

  // Stage 3: their own recent ranked games, for playstyle and timing.
  const theirGames = useQueries({
    queries: close.map(({ c }) => ({
      queryKey: ['duo-them', platform, c.puuid],
      queryFn: ({ signal }: { signal: AbortSignal }) => api.matches(platform, c.puuid, { start: 0, count: 10, queue: 'solo' }, signal),
      staleTime: 10 * 60_000,
    })),
  }) as { data?: MatchPage; isPending: boolean }[];

  if (profileQ.isPending) return <Skeleton className="mt-8 h-48" />;
  if (profileQ.isError) return <ErrorState error={profileQ.error} />;
  if (mineQ.isPending || !sd) return <Skeleton className="mt-8 h-48" />;
  if (!solo || myRank == null) return <p className="mt-8 text-sm text-muted">{t('duo.unranked')}</p>;
  if (!me?.mainRole || me.games < 5) return <p className="mt-8 text-sm text-muted">{t('duo.tooFew')}</p>;

  const checking = scouts.some((q) => q.isPending) || theirGames.some((q) => q.isPending);
  const scored = close
    .map(({ c, s }, i) => {
      const games = theirGames[i]?.data?.matches;
      if (!games) return null;
      const them = playStyle(games, c.puuid, tagsOf);
      const fit = duoFit(me, myRank, them, rankSteps(s!.solo?.tier, s!.solo?.rank));
      return fit ? { c, s: s!, them, fit } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => b.fit.score - a.fit.score);

  return (
    <section className="mt-8" aria-labelledby="duo-res-h" aria-busy={checking}>
      <h2 id="duo-res-h" className="font-display text-2xl font-bold">
        {t('duo.results', { name: profileQ.data!.account.gameName })}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {t('duo.basis', { games: me.games, role: ROLE_LABEL[me.mainRole], rank: `${tierName(solo.tier)} ${solo.rank}`, checked: pool.length })}
      </p>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {scored.map((x) => (
          <DuoCard key={x.c.puuid} platform={platform} c={x.c} s={x.s} them={x.them} me={me} fit={x.fit} myRankLabel={`${tierName(solo.tier)} ${solo.rank}`} />
        ))}
        {checking &&
          Array.from({ length: Math.max(1, Math.min(2, SCORE - scored.length)) }, (_, i) => (
            <li key={`sk${i}`}>
              <Skeleton className="h-56" />
            </li>
          ))}
      </ul>
      {!checking && scored.length === 0 && <p className="mt-4 text-sm text-muted">{t('duo.none')}</p>}
      <p className="mt-6 max-w-3xl text-xs text-faint">{t('duo.note')}</p>
    </section>
  );
}

function DuoCard({ platform, c, s, them, me, fit, myRankLabel }: { platform: string; c: Candidate; s: ScoutInfo; them: PlayStyle; me: PlayStyle; fit: Fit; myRankLabel: string }) {
  const topClass = (st: PlayStyle) => Object.entries(st.classes).sort((x, y) => y[1] - x[1])[0]?.[0];
  const peak = (st: PlayStyle) => st.hours.indexOf(Math.max(...st.hours));
  const line = (p: FitPart) => {
    switch (p.key) {
      case 'rank':
        return t('duo.why.rank', { rank: `${tierName(s.solo!.tier)} ${s.solo!.rank}`, you: myRankLabel });
      case 'role':
        return t('duo.why.role', { them: ROLE_LABEL[them.mainRole!], you: ROLE_LABEL[me.mainRole!] });
      case 'time':
        return t('duo.why.time', { pct: pct(p.score), hour: `${peak(them)}:00` });
      case 'champions':
        return t('duo.why.champions', { them: classLabel(topClass(them)), you: classLabel(topClass(me)) });
      case 'fights':
        return t('duo.why.fights', { them: decimal(them.actionPerMin, 2), you: decimal(me.actionPerMin, 2) });
      case 'vision':
        return t('duo.why.vision', { them: decimal(them.visionPerMin, 2), you: decimal(me.visionPerMin, 2) });
      case 'objectives':
        return t('duo.why.objectives', { them: Math.round(them.objectivePerMin), you: Math.round(me.objectivePerMin) });
    }
  };
  return (
    <li className="panel p-4">
      <div className="flex items-center gap-3">
        {s.solo && <img src={rankEmblem(s.solo.tier)} alt="" width={44} height={44} className="size-11 shrink-0" />}
        <div className="min-w-0 flex-1">
          <Link to={profilePath(platform, c)} className="block truncate font-semibold hover:text-gold">
            {c.gameName}
            <span className="text-faint">#{c.tagLine}</span>
          </Link>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <RoleIcon role={them.mainRole!} size={12} /> {ROLE_LABEL[them.mainRole!]} · {tierName(s.solo?.tier)} {s.solo?.rank}
            {c.together > 0 && <> · {t('duo.together', { count: c.together, wins: c.togetherWins })}</>}
          </p>
        </div>
        <div className="text-right">
          <p className="display-num text-3xl font-extrabold leading-none text-gold">{fit.score}</p>
          <p className="text-[10px] uppercase tracking-wide text-faint">{t('duo.fit')}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-xs">
        {fit.parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2">
            <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-sunken" aria-hidden>
              <span className={clsx('block h-full rounded-full', p.score >= 0.7 ? 'bg-win' : p.score >= 0.4 ? 'bg-gold' : 'bg-loss')} style={{ width: `${Math.round(p.score * 100)}%` }} />
            </span>
            <span className="min-w-0 text-muted">{line(p)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-faint">{t('duo.sample', { count: them.games })}</p>
    </li>
  );
}

const classLabel = (c?: string) => (c ? t(`class.${c}` as 'class.Mage') : '–');
