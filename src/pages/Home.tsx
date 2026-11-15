import { useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { RoleIcon, ROLE_LABEL } from '../components/ui/RoleIcon';
import { TierBadge } from '../components/champions/common';
import { pct, thousands, timeAgo } from '../lib/format';
import { Link } from 'react-router';
import { Star, Clock, LayoutGrid, Swords, Scale, Users, Trophy, HeartHandshake, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';
import type { PatchMover } from '../../shared/types';
import { SearchBox } from '../components/SearchBox';
import { GameImg } from '../components/ui/GameImg';
import { assets, champSlug, rankEmblem, useStaticData } from '../lib/ddragon';
import { profilePath } from '../lib/riotId';
import { isFavorite, useFavorites, useRecent, useRecentChamps, useRegion, type SavedPlayer } from '../lib/storage';
import { RecentChampList } from '../components/champions/RecentChamps';
import { getPlatform } from '../../shared/regions';
import { tierName } from '../lib/format';
import { fadeIn } from '../lib/motion';
import { t } from '../i18n';

function PlayerChip({ p }: { p: SavedPlayer }) {
  const { data } = useStaticData();
  const a = assets(data);
  return (
    <Link
      to={profilePath(p.platform, p)}
      className="flex items-center gap-3 rounded border border-line bg-surface px-3 py-2 transition-colors hover:border-gold/60 hover:bg-raised"
    >
      <GameImg src={p.profileIconId != null ? a.profileIcon(p.profileIconId) : undefined} alt="" size={36} rounded="full" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {p.gameName}
          <span className="text-muted">#{p.tagLine}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          {getPlatform(p.platform)?.label}
          {p.tier && (
            <>
              <img src={rankEmblem(p.tier)} alt="" {...fadeIn()} className="size-4" />
              {tierName(p.tier)} {['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(p.tier) ? '' : p.rank}
            </>
          )}
        </span>
      </span>
    </Link>
  );
}

export function HomePage() {
  const favorites = useFavorites();
  // A starred player is already in Favorites; don't list them twice.
  const recent = useRecent().filter((p) => !isFavorite(favorites, p));
  useEffect(() => {
    document.title = t('home.title');
  }, []);

  const champs = useRecentChamps();
  const saved = favorites.length + recent.length > 0;
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid grid-cols-[minmax(0,1fr)] gap-10 pb-16 pt-14 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
        <div>
          <h1 className="font-display text-6xl font-extrabold leading-[0.9] tracking-tight sm:text-8xl">
            {t('home.heroLine1')}
            <br />
            {t('home.heroLine2')}
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted sm:text-lg">
            {t('home.lead')}
          </p>
          <div className="mt-9">
            <SearchBox variant="hero" autoFocus />
          </div>
        </div>

        <div className="space-y-6">
          {favorites.length > 0 && (
            <section aria-labelledby="fav-h">
              <h2 id="fav-h" className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-muted">
                <Star className="size-4" aria-hidden /> {t('home.favorites')}
              </h2>
              <div className="grid gap-1.5">
                {favorites.slice(0, 5).map((p) => (
                  <PlayerChip key={`${p.platform}${p.gameName}${p.tagLine}`} p={p} />
                ))}
              </div>
            </section>
          )}
          {recent.length > 0 && (
            <section aria-labelledby="recent-h">
              <h2 id="recent-h" className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-muted">
                <Clock className="size-4" aria-hidden /> {t('home.recent')}
              </h2>
              <div className="grid gap-1.5">
                {recent.slice(0, 5).map((p) => (
                  <PlayerChip key={`${p.platform}${p.gameName}${p.tagLine}`} p={p} />
                ))}
              </div>
            </section>
          )}
          {champs.length > 0 && (
            <section aria-labelledby="recent-champs-h">
              <h2 id="recent-champs-h" className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-muted">
                <LayoutGrid className="size-4" aria-hidden /> {t('home.recentChamps')}
              </h2>
              <RecentChampList list={champs} />
            </section>
          )}
          {!saved && (
            <div className="panel panel-tick p-5 text-sm text-muted">
              <p className="font-display text-lg font-bold text-text">{t('home.emptyTitle')}</p>
              <p className="mt-1">{t('home.emptyBody')}</p>
              <Link to={profilePath('kr', { gameName: 'Hide on bush', tagLine: 'KR1' })} className="mt-3 inline-block font-medium text-gold underline-offset-4 hover:underline">
                {t('home.emptyCta')}
              </Link>
            </div>
          )}
        </div>
      </section>
      <StrongestPicks />
      <Climbers />
      <Tools />
    </div>
  );
}

/** The fastest climbers in Challenger on the visitor's region (from the ladder's LP snapshots; no name lookups). */
function Climbers() {
  const [region] = useRegion();
  const q = useQuery({
    queryKey: ['climbers', region],
    queryFn: ({ signal }) => api.leaderboard(region, { queue: 'solo', tier: 'challenger', page: 1, climbersOnly: true }, signal),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const list = q.data?.climbers ?? [];
  if (!q.data?.since || list.length < 3) return null;
  return (
    <section className="pb-20" aria-labelledby="home-climb-h">
      <div className="flex items-end justify-between gap-3">
        <h2 id="home-climb-h" className="flex items-center gap-2 font-display text-2xl font-bold">
          <TrendingUp className="size-5 text-win" aria-hidden />
          {t('home.climbers', { region: getPlatform(region)?.label ?? region })}
        </h2>
        <Link to={`/leaderboard?region=${region}`} className="text-sm font-medium text-gold hover:underline">
          {t('home.climbersAll')}
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-muted">{t('home.climbersLead', { when: timeAgo(q.data.since) })}</p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {list.map((c) => (
          <li key={c.puuid}>
            <Link to={profilePath(region, { gameName: c.gameName!, tagLine: c.tagLine ?? '' })} className="panel flex h-full items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:border-gold/60">
              <span className="min-w-0">
                <span className="block truncate font-medium">{c.gameName}</span>
                <span className="num text-xs text-muted">
                  #{c.rank} · {t('common.lp', { lp: thousands(c.lp) })}
                </span>
              </span>
              <span className="num shrink-0 font-display text-lg font-bold text-win">+{c.lpChange}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The site's tools, so they're one tap away on phones too (the bottom bar has room for four). */
function Tools() {
  const items = [
    { to: '/draft', icon: Swords, title: t('nav.draft'), body: t('home.tool.draft') },
    { to: '/compare', icon: Scale, title: t('nav.compare'), body: t('home.tool.compare') },
    { to: '/multisearch', icon: Users, title: t('nav.multisearch'), body: t('home.tool.multi') },
    { to: '/duo', icon: HeartHandshake, title: t('nav.duo'), body: t('home.tool.duo') },
    { to: '/leaderboard', icon: Trophy, title: t('nav.ladder'), body: t('home.tool.ladder') },
  ];
  return (
    <section aria-labelledby="tools-h" className="pb-20">
      <h2 id="tools-h" className="mb-4 font-display text-2xl font-bold">
        {t('home.tools')}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map(({ to, icon: Icon, title, body }) => (
          <li key={to}>
            <Link to={to} className="panel group flex h-full gap-3 p-4 transition-colors hover:border-gold/50">
              <Icon className="mt-0.5 size-5 shrink-0 text-gold transition-transform group-hover:scale-110" aria-hidden />
              <span>
                <span className="block font-display text-lg font-bold leading-tight">{title}</span>
                <span className="mt-1 block text-sm text-muted">{body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The three clearest risers and fallers since last patch, from the same tier-list data (no extra request). */
function Movers({ m }: { m: { against: string; up: PatchMover[]; down: PatchMover[] } }) {
  const up = m.up.slice(0, 3);
  const down = m.down.slice(0, 3);
  if (!up.length && !down.length) return null;
  return (
    <div className={clsx('mt-4 grid gap-2', up.length && down.length && 'md:grid-cols-2')} role="group" aria-label={t('home.moversAria', { from: m.against })}>
      <MoverRow icon={<TrendingUp className="size-4 shrink-0 text-win" aria-hidden />} label={t('home.moversUp', { from: m.against })} list={up} />
      <MoverRow icon={<TrendingDown className="size-4 shrink-0 text-loss" aria-hidden />} label={t('home.moversDown', { from: m.against })} list={down} />
    </div>
  );
}

function MoverRow({ icon, label, list }: { icon: ReactNode; label: string; list: PatchMover[] }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  if (!list.length) return null;
  return (
    <div className="panel flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2">
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {label}
      </span>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {list.map((x) => {
          const c = sd?.champions.get(x.championId);
          return (
            <li key={`${x.championId}-${x.role}`}>
              <Link
                to={c ? `/champions/${champSlug(c.id)}${x.role !== 'ALL' ? `?role=${x.role}` : ''}` : '/champions'}
                className="flex items-center gap-1.5 rounded px-1 py-0.5 text-sm hover:bg-raised"
                title={t('mv.was', { from: pct(x.prevWinRate, 1), to: pct(x.winRate, 1) })}
              >
                <GameImg src={a.champion(x.championId).url} alt="" size={22} rounded="sm" />
                <span>{a.champion(x.championId).name}</span>
                {x.role !== 'ALL' && <RoleIcon role={x.role} size={12} />}
                <span className={clsx('num text-xs font-bold', x.delta > 0 ? 'text-win' : 'text-loss')}>
                  {x.delta > 0 ? '+' : '−'}
                  {pct(Math.abs(x.delta), 1)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const ROLES = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];

/** The best-placed champion in each role, straight from the tier list. */
function StrongestPicks() {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const q = useQuery({ queryKey: ['tierlist', 'ranked', undefined], queryFn: ({ signal }) => api.tierList('ranked', undefined, signal), staleTime: 60_000 });
  const rows = q.data?.rows ?? [];
  const picks = ROLES.map((role) => rows.filter((r) => r.role === role && !r.lowSample).sort((x, y) => x.rank - y.rank)[0]).filter(Boolean);
  if (!picks.length) return null;
  return (
    <section aria-labelledby="picks-h" className="pb-20">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="picks-h" className="font-display text-2xl font-bold">
          {q.data?.patch ? t('home.strongestOn', { patch: q.data.patch }) : t('home.strongest')}
        </h2>
        <Link to="/champions" className="text-sm font-medium text-gold hover:underline">
          {t('home.fullTierList')}
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {picks.map((r, i) => {
          const c = sd?.champions.get(r.championId);
          return (
            <li key={r.role} className="fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <Link
                to={c ? `/champions/${champSlug(c.id)}?role=${r.role}` : '/champions'}
                className="group relative block h-40 overflow-hidden rounded border border-line bg-surface transition-colors hover:border-gold/60"
              >
                <img src={a.splash(r.championId)} alt="" {...fadeIn('splash')} className="absolute inset-0 h-full w-full object-cover object-top opacity-70 group-hover:scale-105" onError={(e) => (e.currentTarget.style.display = 'none')} />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
                <div className="relative flex h-full flex-col justify-between p-3">
                  <span className="flex items-center justify-between">
                    <span className="flex items-center gap-1 rounded-sm bg-bg/70 px-1.5 py-0.5 text-xs text-muted backdrop-blur">
                      <RoleIcon role={r.role} size={13} /> {ROLE_LABEL[r.role]}
                    </span>
                    <TierBadge tier={r.tier} />
                  </span>
                  <span>
                    <span className="block font-display text-2xl font-bold leading-none group-hover:text-gold">{a.champion(r.championId).name}</span>
                    <span className="num text-xs text-muted">{t('home.winRate', { rate: pct(r.winRate, 1) })}</span>
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {q.data?.movers && q.data.patch && <Movers m={q.data.movers} />}
    </section>
  );
}
