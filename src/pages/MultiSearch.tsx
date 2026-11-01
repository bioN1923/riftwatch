import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ChevronDown, Users } from 'lucide-react';
import { PLATFORMS, getPlatform } from '../../shared/regions';
import { api, ApiClientError } from '../lib/api';
import { assets, champSlug, rankEmblem, useStaticData } from '../lib/ddragon';
import { formatKda, kdaRatio, kdaTone, pct, titleCase } from '../lib/format';
import { fromSlug, profilePath, toSlug, type RiotId } from '../lib/riotId';
import { parseLobby } from '../lib/lobby';
import { useRegion } from '../lib/storage';
import { me, overview, result } from '../lib/stats';
import { playerTags } from '../lib/tags';
import { GameImg } from '../components/ui/GameImg';
import { TagList } from '../components/ui/TagList';
import { Skeleton } from '../components/ui/States';
import { fadeIn } from '../lib/motion';

const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER']);

export function MultiSearchPage() {
  const [params, setParams] = useSearchParams();
  const [storedRegion, setRegion] = useRegion();
  const region = getPlatform(params.get('region') ?? storedRegion)?.id ?? 'euw1';
  const fromUrl = useMemo(
    () =>
      (params.get('players') ?? '')
        .split(',')
        .filter(Boolean)
        .map((s) => fromSlug(s))
        .filter((x): x is RiotId => !!x),
    [params],
  );
  const [text, setText] = useState(() => fromUrl.map((p) => `${p.gameName}#${p.tagLine}`).join('\n'));
  const parsed = parseLobby(text);

  useEffect(() => {
    document.title = 'Multi-search — Riftwatch';
  }, []);

  const run = () => {
    const next = new URLSearchParams();
    next.set('region', region);
    next.set('players', parsed.map((p) => toSlug(p)).join(','));
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">Multi-search</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        In champion select, copy the lobby chat (the “joined the lobby” lines) and paste it here. You’ll see every teammate’s rank, recent form and best champions at once.
      </p>

      <form
        className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (parsed.length) run();
        }}
      >
        <label className="block">
          <span className="sr-only">Lobby text or Riot IDs</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={'Hide on bush #KR1 joined the lobby\nCaps#EUW joined the lobby\n…or Riot IDs separated by commas'}
            className="w-full resize-y rounded border border-line bg-surface px-3 py-2.5 font-mono text-sm leading-relaxed outline-none placeholder:text-faint focus:border-gold"
          />
        </label>
        <div className="flex flex-col gap-2 md:w-48">
          <label className="relative block">
            <span className="mb-1 block text-xs text-muted">Region</span>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                const next = new URLSearchParams(params);
                next.set('region', e.target.value);
                setParams(next, { replace: true });
              }}
              className="h-10 w-full appearance-none rounded border border-line bg-surface px-3 font-display text-lg font-bold"
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute bottom-3 right-3 size-4 text-muted" aria-hidden />
          </label>
          <button type="submit" disabled={!parsed.length} className="flex h-10 items-center justify-center gap-2 rounded bg-gold font-semibold text-gold-ink transition hover:brightness-110 disabled:opacity-40">
            <Users className="size-4" aria-hidden />
            Scout {parsed.length || ''} player{parsed.length === 1 ? '' : 's'}
          </button>
          <p className="text-xs text-muted" aria-live="polite">
            {parsed.length ? `Found ${parsed.map((p) => p.gameName).join(', ')}` : 'No Riot IDs found yet.'}
          </p>
        </div>
      </form>

      {fromUrl.length > 0 && (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {fromUrl.map((id, i) => (
            <li key={`${id.gameName}#${id.tagLine}`} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <PlayerCard platform={region} id={id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlayerCard({ platform, id }: { platform: string; id: RiotId }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const profileQ = useQuery({
    queryKey: ['profile', platform, id.gameName.toLowerCase(), id.tagLine.toLowerCase()],
    queryFn: ({ signal }) => api.profile(platform, id.gameName, id.tagLine, { signal }),
  });
  const p = profileQ.data;
  const matchesQ = useQuery({
    queryKey: ['multi-matches', platform, p?.account.puuid],
    enabled: !!p,
    queryFn: ({ signal }) => api.matches(platform, p!.account.puuid, { start: 0, count: 10, queue: 'solo' }, signal),
    staleTime: 5 * 60_000,
  });

  if (profileQ.isPending) return <Skeleton className="h-80" />;
  if (profileQ.isError || !p) {
    const nf = profileQ.error instanceof ApiClientError && profileQ.error.code === 'NOT_FOUND';
    return (
      <div className="panel h-full p-4">
        <p className="truncate font-semibold">
          {id.gameName}
          <span className="text-faint">#{id.tagLine}</span>
        </p>
        <p className="mt-2 text-sm text-loss">{nf ? 'Not found on this server.' : 'Couldn’t load this player.'}</p>
      </div>
    );
  }

  const solo = p.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
  const games = solo ? solo.wins + solo.losses : 0;
  const wr = games ? solo!.wins / games : 0;
  const matches = matchesQ.data?.matches;
  const ov = matches ? overview(matches, p.account.puuid) : undefined;
  const tags = playerTags({ matches, puuid: p.account.puuid, solo, level: p.summoner.summonerLevel, champName: (cid) => a.champion(cid).name });

  return (
    <article className="panel flex h-full flex-col p-4">
      <Link to={profilePath(platform, p.account)} className="group flex items-center gap-3">
        <GameImg src={a.profileIcon(p.summoner.profileIconId)} alt="" size={40} rounded="md" />
        <span className="min-w-0">
          <span className="block truncate font-semibold group-hover:text-gold">{p.account.gameName}</span>
          <span className="block text-xs text-muted">
            #{p.account.tagLine} · level {p.summoner.summonerLevel}
          </span>
        </span>
      </Link>

      <div className="mt-3 flex items-center gap-2.5">
        {solo ? (
          <>
            <img src={rankEmblem(solo.tier)} alt="" {...fadeIn()} className="size-11" />
            <div>
              <p className="font-display text-xl font-bold leading-tight">
                {titleCase(solo.tier)} {APEX.has(solo.tier) ? '' : solo.rank}
              </p>
              <p className="num text-xs text-muted">
                {solo.leaguePoints} LP · <span className={clsx('font-semibold', wr >= 0.5 ? 'text-win' : 'text-loss')}>{pct(wr)}</span> of {games}
              </p>
            </div>
          </>
        ) : (
          <p className="font-display text-xl font-bold text-faint">Unranked</p>
        )}
      </div>

      <div className="mt-3">
        <p className="mb-1 text-xs text-muted">Last 10 ranked games</p>
        {matchesQ.isPending ? (
          <Skeleton className="h-4" />
        ) : matches && matches.length ? (
          <ol className="flex gap-[3px]" aria-label="Recent ranked results, newest first">
            {matches.map((m) => {
              const mp = me(m, p.account.puuid);
              const r = mp ? result(m, mp) : 'remake';
              return <li key={m.id} title={r === 'win' ? 'Win' : r === 'loss' ? 'Loss' : 'Remake'} className={clsx('h-4 flex-1 rounded-[2px]', r === 'win' ? 'bg-win' : r === 'loss' ? 'bg-loss' : 'bg-faint')} />;
            })}
          </ol>
        ) : (
          <p className="text-xs text-faint">No recent ranked games.</p>
        )}
      </div>

      {ov && ov.champions.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {ov.champions.slice(0, 3).map((c) => {
            const ch = a.champion(c.championId);
            const slug = sd?.champions.get(c.championId)?.id;
            const ratio = kdaRatio(c.kills, c.deaths, c.assists);
            return (
              <li key={c.championId} className="flex items-center gap-2 text-sm">
                <GameImg src={ch.url} alt="" size={22} rounded="sm" />
                <Link to={slug ? `/champions/${champSlug(slug)}` : '#'} className="min-w-0 flex-1 truncate hover:text-gold">
                  {ch.name}
                </Link>
                <span className="num text-xs text-muted">{c.games}</span>
                <span className={clsx('num w-9 text-right text-xs font-semibold', c.wins / c.games >= 0.5 ? 'text-win' : 'text-loss')}>{pct(c.wins / c.games)}</span>
                <span className={clsx('num w-9 text-right text-xs', kdaTone(ratio))}>{formatKda(ratio)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <TagList tags={tags} className="mt-auto pt-3" />
    </article>
  );
}
