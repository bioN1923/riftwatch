import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import type { Profile, MatchPage } from '../../shared/types';
import clsx from 'clsx';
import { ChevronDown, History, Users } from 'lucide-react';
import { PLATFORMS, getPlatform } from '../../shared/regions';
import { api, ApiClientError } from '../lib/api';
import { assets, champSlug, rankEmblem, useStaticData } from '../lib/ddragon';
import { formatKda, kdaRatio, kdaTone, pct, tierName } from '../lib/format';
import { fromSlug, profilePath, querySlug, type RiotId } from '../lib/riotId';
import { parseLobby } from '../lib/lobby';
import { addLobby, clearLobbies, useLobbies, useRegion } from '../lib/storage';
import { me, overview, result } from '../lib/stats';
import { playerTags, type PlayerTag } from '../lib/tags';
import { lobbyDuos } from '../lib/lobbyDuos';
import { lobbyRoles } from '../lib/lobbyRoles';
import { averageRank } from '../lib/ladder';
import { LANE_ROLES } from '../lib/lanes';
import { ROLE_LABEL } from '../components/ui/RoleIcon';
import { GameImg } from '../components/ui/GameImg';
import { TagList } from '../components/ui/TagList';
import { Skeleton } from '../components/ui/States';
import { fadeIn } from '../lib/motion';
import { t } from '../i18n';

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
    document.title = t('ms.title');
  }, []);

  const lobbies = useLobbies();
  const go = (reg: string, slugs: string[]) => {
    const next = new URLSearchParams();
    next.set('region', reg);
    next.set('players', slugs.join(','));
    setParams(next);
    addLobby({ region: reg, players: slugs });
  };
  const run = () => go(region, parsed.map((p) => querySlug(p)));

  // The same queries the cards run (shared through the cache), read here to spot premades.
  const profiles = useQueries({
    queries: fromUrl.map((id) => ({
      queryKey: ['profile', region, id.gameName.toLowerCase(), id.tagLine.toLowerCase()],
      queryFn: ({ signal }: { signal: AbortSignal }) => api.profile(region, id.gameName, id.tagLine, { signal }),
    })),
  }) as { data?: Profile }[];
  const lobbyMatches = useQueries({
    queries: profiles.map((q) => ({
      queryKey: ['multi-matches', region, q.data?.account.puuid],
      enabled: !!q.data,
      queryFn: ({ signal }: { signal: AbortSignal }) => api.matches(region, q.data!.account.puuid, { start: 0, count: 10, queue: 'solo' }, signal),
      staleTime: 5 * 60_000,
    })),
  }) as { data?: MatchPage }[];
  const duos = lobbyDuos(
    profiles.flatMap((q, i) => (q.data ? [{ puuid: q.data.account.puuid, name: q.data.account.gameName, matches: lobbyMatches[i]?.data?.matches }] : [])),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{t('ms.heading')}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {t('ms.lead')}
      </p>

      <form
        className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (parsed.length) run();
        }}
      >
        <label className="block">
          <span className="sr-only">{t('ms.input')}</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={t('ms.placeholder')}
            className="w-full resize-y rounded border border-line bg-surface px-3 py-2.5 font-mono text-sm leading-relaxed outline-none placeholder:text-faint focus:border-gold focus:ring-2 focus:ring-gold/50"
          />
        </label>
        <div className="flex flex-col gap-2 md:w-48">
          <label className="relative block">
            <span className="mb-1 block text-xs text-muted">{t('ms.region')}</span>
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
            {parsed.length ? t('ms.scout', { count: parsed.length }) : t('ms.scoutNone')}
          </button>
          <p className="text-xs text-muted" aria-live="polite">
            {parsed.length ? t('ms.found', { names: parsed.map((p) => p.gameName).join(', ') }) : t('ms.none')}
          </p>
        </div>
      </form>

      {fromUrl.length === 0 && lobbies.length > 0 && (
        <section className="mt-8" aria-labelledby="ms-recent-h">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="ms-recent-h" className="panel-title flex items-center gap-1.5">
              <History className="size-4 text-muted" aria-hidden /> {t('ms.recent')}
            </h2>
            <button type="button" onClick={clearLobbies} className="text-xs text-muted underline-offset-2 hover:text-text hover:underline">
              {t('ms.recentClear')}
            </button>
          </div>
          <ul className="mt-2 grid gap-2 md:grid-cols-3">
            {lobbies.map((l) => {
              const ids = l.players.map((s) => fromSlug(s)).filter((x): x is RiotId => !!x);
              return (
                <li key={`${l.region}:${l.players.join(',')}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setText(ids.map((p) => `${p.gameName}#${p.tagLine}`).join('\n'));
                      if (l.region !== region) setRegion(l.region);
                      go(l.region, l.players);
                    }}
                    className="panel w-full p-3 text-left transition-colors hover:border-line-strong"
                  >
                    <span className="flex items-center justify-between gap-2 text-xs text-muted">
                      <span>{t('ms.recentCount', { count: ids.length })}</span>
                      <span className="font-display font-bold">{getPlatform(l.region)?.label ?? l.region}</span>
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm">{ids.map((p) => p.gameName).join(', ')}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {fromUrl.length > 1 && <LobbySummary profiles={profiles} matches={lobbyMatches} />}
      {fromUrl.length > 0 && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {fromUrl.map((id, i) => (
            <li key={`${id.gameName}#${id.tagLine}`} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <PlayerCard platform={region} id={id} duos={duos} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlayerCard({ platform, id, duos }: { platform: string; id: RiotId; duos: ReturnType<typeof lobbyDuos> }) {
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
        <p className="mt-2 text-sm text-loss">{nf ? t('ms.notFound') : t('ms.failed')}</p>
      </div>
    );
  }

  const solo = p.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
  const games = solo ? solo.wins + solo.losses : 0;
  const wr = games ? solo!.wins / games : 0;
  const matches = matchesQ.data?.matches;
  const ov = matches ? overview(matches, p.account.puuid) : undefined;
  const duoTags: PlayerTag[] = (duos.get(p.account.puuid) ?? []).map((d) => ({
    id: `duo-${d.puuid}`,
    label: t('ms.duo', { name: d.name }),
    tone: 'neutral',
    detail: t('ms.duoTip', { name: d.name, games: d.games, wins: d.wins }),
  }));
  const tags = [...duoTags, ...playerTags({ matches, puuid: p.account.puuid, solo, level: p.summoner.summonerLevel, champName: (cid) => a.champion(cid).name })];

  return (
    <article className="panel flex h-full flex-col p-4">
      <Link to={profilePath(platform, p.account)} className="group flex items-center gap-3">
        <GameImg src={a.profileIcon(p.summoner.profileIconId)} alt="" size={40} rounded="md" />
        <span className="min-w-0">
          <span className="block truncate font-semibold group-hover:text-gold">{p.account.gameName}</span>
          <span className="block text-xs text-muted">
            #{p.account.tagLine} · {t('ms.level', { level: p.summoner.summonerLevel })}
          </span>
        </span>
      </Link>

      <div className="mt-3 flex items-center gap-2.5">
        {solo ? (
          <>
            <img src={rankEmblem(solo.tier)} alt="" {...fadeIn()} className="size-11" />
            <div>
              <p className="font-display text-xl font-bold leading-tight">
                {tierName(solo.tier)} {APEX.has(solo.tier) ? '' : solo.rank}
              </p>
              <p className="num text-xs text-muted">
                {t.rich('ms.lpOf', { lp: solo.leaguePoints, rate: <span className={clsx('font-semibold', wr >= 0.5 ? 'text-win' : 'text-loss')}>{pct(wr)}</span>, games })}
              </p>
            </div>
          </>
        ) : (
          <p className="font-display text-xl font-bold text-faint">{t('common.unranked')}</p>
        )}
      </div>

      <div className="mt-3">
        <p className="mb-1 text-xs text-muted">{t('ms.last10')}</p>
        {matchesQ.isPending ? (
          <Skeleton className="h-4" />
        ) : matches && matches.length ? (
          <ol className="flex gap-[3px]" aria-label={t('ms.recentAria')}>
            {matches.map((m) => {
              const mp = me(m, p.account.puuid);
              const r = mp ? result(m, mp) : 'remake';
              return <li key={m.id} title={t(`result.${r}`)} className={clsx('h-4 flex-1 rounded-[2px]', r === 'win' ? 'bg-win' : r === 'loss' ? 'bg-loss' : 'bg-faint')} />;
            })}
          </ol>
        ) : (
          <p className="text-xs text-faint">{t('ms.noRecent')}</p>
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

/**
 * One line over the cards: the lobby's average solo rank, who mains which role (from their last
 * 10 ranked games), and the roles two people want or nobody plays. Uses the cards' own data.
 */
function LobbySummary({ profiles, matches }: { profiles: { data?: Profile }[]; matches: { data?: MatchPage }[] }) {
  const loaded = profiles.flatMap((q, i) => (q.data && matches[i]?.data ? [{ p: q.data, ms: matches[i].data!.matches }] : []));
  if (loaded.length < 2 || loaded.length < profiles.length) return null; // wait for everyone, so the line doesn't jump
  const ranks = loaded.flatMap(({ p }) => {
    const s = p.ranked.find((x) => x.queueType === 'RANKED_SOLO_5x5');
    return s ? [{ tier: s.tier, rank: s.rank, lp: s.leaguePoints }] : [];
  });
  const avg = averageRank(ranks);
  const roles = lobbyRoles(loaded.map(({ p, ms }) => ({ name: p.account.gameName, roles: overview(ms, p.account.puuid).roles })));
  return (
    <section className="panel mt-8 px-4 py-3 text-sm" aria-label={t('ms.lobbyAria')}>
      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {avg && (
          <span>
            <span className="text-muted">{t('ms.lobbyAvg')}</span> <span className="font-semibold">{avg}</span>
            {ranks.length < loaded.length && <span className="text-xs text-faint"> ({t('ms.lobbyRanked', { n: ranks.length, total: loaded.length })})</span>}
          </span>
        )}
        <span className="text-muted">
          {LANE_ROLES.filter((r) => roles.mains[r]).map((r, i) => (
            <span key={r}>
              {i > 0 && ' · '}
              <span className={clsx(roles.clash.includes(r) ? 'font-semibold text-gold' : 'text-text')}>{ROLE_LABEL[r]}</span> {roles.mains[r]!.join(', ')}
            </span>
          ))}
          {roles.flex.length > 0 && <> · {t('ms.lobbyFlex', { names: roles.flex.join(', ') })}</>}
        </span>
      </p>
      {(roles.clash.length > 0 || (roles.open.length > 0 && roles.open.length < 5)) && (
        <p className="mt-1 text-xs text-muted">
          {roles.clash.length > 0 && t('ms.lobbyClash', { roles: roles.clash.map((r) => ROLE_LABEL[r]).join(', ') })}
          {roles.clash.length > 0 && roles.open.length > 0 && ' '}
          {roles.open.length > 0 && roles.open.length < 5 && t('ms.lobbyOpen', { roles: roles.open.map((r) => ROLE_LABEL[r]).join(', ') })}
        </p>
      )}
    </section>
  );
}
