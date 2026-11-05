import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { RefreshCw, Star, Flame, Link2, Check, Scale } from 'lucide-react';
import type { LeagueEntry, MatchSummary, Profile } from '../../../shared/types';
import { getPlatform } from '../../../shared/regions';
import { GameImg, Tooltip } from '../ui/GameImg';
import { assets, rankEmblem, useStaticData } from '../../lib/ddragon';
import { isFavorite, toggleFavorite, useFavorites } from '../../lib/storage';
import { profilePath, toSlug } from '../../lib/riotId';
import { pct, timeAgo, tierName, regionName } from '../../lib/format';
import { me, result } from '../../lib/stats';
import { playerTags } from '../../lib/tags';
import { TagList } from '../ui/TagList';
import { fadeIn } from '../../lib/motion';
import { SlidingIndicator } from '../ui/Motion';
import { t } from '../../i18n';

const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER']);

export function ProfileHeader({
  profile,
  matches,
  inGame,
  tab,
  updating,
  readyAt,
  onUpdate,
}: {
  profile: Profile;
  matches: MatchSummary[] | undefined;
  inGame: boolean;
  tab: 'overview' | 'stats' | 'live';
  updating: boolean;
  /** Client-clock time when the server allows the next update. */
  readyAt: number;
  onUpdate: () => void;
}) {
  const { data } = useStaticData();
  const a = assets(data);
  const favorites = useFavorites();
  const solo = profile.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
  const flex = profile.ranked.find((r) => r.queueType === 'RANKED_FLEX_SR');
  const saved = { platform: profile.platform, gameName: profile.account.gameName, tagLine: profile.account.tagLine, profileIconId: profile.summoner.profileIconId, tier: solo?.tier, rank: solo?.rank };
  const fav = isFavorite(favorites, saved);
  const platform = getPlatform(profile.platform);
  const backdrop = profile.mastery[0] ? a.splash(profile.mastery[0].championId) : undefined;

  const [now, setNow] = useState(Date.now());
  const cooling = now < readyAt;
  useEffect(() => {
    setNow(Date.now());
    // Tick every second while the countdown runs, otherwise just keep "Updated … ago" fresh.
    const t = setInterval(() => setNow(Date.now()), cooling ? 1000 : 15_000);
    return () => clearInterval(t);
  }, [cooling, readyAt]);
  const wait = Math.max(0, Math.ceil((readyAt - now) / 1000));
  const waitLabel = `${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, '0')}`;
  const id = { gameName: profile.account.gameName, tagLine: profile.account.tagLine };

  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      {backdrop && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-full max-w-4xl">
          <img key={backdrop} src={backdrop} alt="" {...fadeIn('splash')} className="h-full w-full object-cover object-[center_25%] opacity-35" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/70 to-surface/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        </div>
      )}

      <div className="relative mx-auto max-w-6xl px-4 pt-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <GameImg src={a.profileIcon(profile.summoner.profileIconId)} alt="Profile icon" size={92} rounded="md" className="ring-1 ring-line-strong" />
              <span className="num absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-sm border border-gold/60 bg-bg px-1.5 font-display text-sm font-bold text-gold">
                {profile.summoner.summonerLevel}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h1 title={`${profile.account.gameName}#${profile.account.tagLine}`} className="truncate font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
                  {profile.account.gameName}
                  <span className="ml-2 text-2xl font-semibold text-muted sm:text-3xl">#{profile.account.tagLine}</span>
                </h1>
                <button
                  onClick={() => toggleFavorite(saved)}
                  aria-pressed={fav}
                  aria-label={fav ? t('profile.favRemove') : t('profile.favAdd')}
                  title={fav ? t('profile.favRemove') : t('profile.favAdd')}
                  className="grid size-9 shrink-0 place-items-center rounded text-muted hover:bg-raised hover:text-gold"
                >
                  <Star className={clsx('size-5', fav && 'fill-gold text-gold')} aria-hidden />
                </button>
              </div>
              <p className="mt-1.5 text-sm text-muted">{platform ? regionName(platform.id) : ''}</p>
              <TagList
                className="mt-2"
                tags={playerTags({ matches, puuid: profile.account.puuid, solo, level: profile.summoner.summonerLevel, champName: (cid) => a.champion(cid).name })}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={onUpdate}
                  disabled={updating || cooling}
                  title={cooling ? t('profile.updateWait', { time: waitLabel }) : t('profile.updateHint')}
                  className="inline-flex h-8 items-center gap-2 rounded bg-gold px-3.5 text-sm font-semibold text-gold-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <RefreshCw className={clsx('size-3.5', updating && 'animate-spin')} aria-hidden />
                  {updating ? t('profile.updating') : t('profile.update')}
                </button>
                <CopyLink />
                <Link
                  to={`/compare?a=${profile.platform}/${toSlug(id)}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded border border-line-strong px-3 text-sm font-medium text-muted transition-colors hover:border-gold/60 hover:text-text"
                >
                  <Scale className="size-3.5" aria-hidden />
                  {t('profile.compare')}
                </Link>
                <span className="text-xs text-muted" aria-live="polite">
                  {t('profile.updated', { ago: timeAgo(readyAt - (profile.updateIn ?? 0) - (profile.age ?? 0), now) })}
                  {cooling && !updating && <span className="num text-faint"> · {t('profile.nextUpdate', { time: waitLabel })}</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:gap-6">
            <RankBlock label={t('profile.solo')} entry={solo} big />
            <RankBlock label={t('profile.flex')} entry={flex} />
          </div>
        </div>

        <FormRibbon matches={matches} puuid={profile.account.puuid} />

        <nav aria-label={t('profile.sections')} className="relative mt-2 flex gap-1">
          <SlidingIndicator className="h-[3px]" />
          <TabLink to={profilePath(profile.platform, id)} active={tab === 'overview'}>
            {t('profile.tab.overview')}
          </TabLink>
          <TabLink to={profilePath(profile.platform, id, 'stats')} active={tab === 'stats'}>
            {t('profile.tab.stats')}
          </TabLink>
          <TabLink to={profilePath(profile.platform, id, 'live')} active={tab === 'live'}>
            {t('profile.tab.live')}
            {inGame && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-sm bg-loss px-1.5 py-px font-sans text-[11px] font-semibold text-on-accent">
                <span className="live-dot size-1.5 rounded-full bg-on-accent" aria-hidden />
                {t('profile.inGame')}
              </span>
            )}
          </TabLink>
        </nav>
      </div>
    </section>
  );
}

function CopyLink() {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href.split('#')[0]);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded border border-line-strong px-3 text-sm font-medium text-muted transition-colors hover:border-gold/60 hover:text-text"
    >
      {done ? <Check className="pop-in size-3.5 text-win" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
      <span aria-live="polite">{done ? t('profile.copied') : t('profile.copyLink')}</span>
    </button>
  );
}

function RankBlock({ label, entry, big }: { label: string; entry?: LeagueEntry; big?: boolean }) {
  if (!entry) {
    return (
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full border border-dashed border-line-strong text-faint" aria-hidden>
          –
        </span>
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className="font-display text-xl font-bold text-faint">{t('common.unranked')}</p>
        </div>
      </div>
    );
  }
  const games = entry.wins + entry.losses;
  const wr = games ? entry.wins / games : 0;
  const size = big ? 76 : 56;
  return (
    <div className="flex items-center gap-3">
      <img src={rankEmblem(entry.tier)} alt="" {...fadeIn()} width={size} height={size} style={{ width: size, height: size }} className="shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]" />
      <div>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          {label}
          {entry.hotStreak && <Flame className="size-3.5 text-kda-great" aria-label={t('profile.hotStreak')} />}
        </p>
        <p className={clsx('font-display font-extrabold leading-tight', big ? 'text-3xl' : 'text-2xl')}>
          {tierName(entry.tier)} {APEX.has(entry.tier) ? '' : entry.rank}
          <span className="num ml-2 text-base font-semibold text-muted">{t('common.lp', { lp: entry.leaguePoints })}</span>
        </p>
        <p className="num text-xs text-muted">
          {t('common.wins', { count: entry.wins })} {t('common.losses', { count: entry.losses })} · <span className={clsx('font-semibold', wr >= 0.5 ? 'text-win' : 'text-loss')}>{pct(wr)}</span>
        </p>
      </div>
    </div>
  );
}

function TabLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'relative inline-flex items-center px-3 pb-3 pt-2 font-display text-lg font-bold tracking-wide transition-colors',
        active ? 'text-text' : 'text-muted hover:text-text',
      )}
    >
      {children}
    </Link>
  );
}

/** Recent form as a strip of champion portraits, oldest on the left, each underlined by its result. */
function FormRibbon({ matches, puuid }: { matches: MatchSummary[] | undefined; puuid: string }) {
  const { data } = useStaticData();
  const a = assets(data);
  if (!matches) return <div className="skeleton mt-6 h-12 w-full" aria-hidden />;

  const recent = matches.slice(0, 20).flatMap((m) => {
    const p = me(m, puuid);
    return p ? [{ m, p, r: result(m, p) }] : [];
  });
  if (!recent.length) return <div className="mt-6" />;
  const counted = recent.filter((x) => x.r !== 'remake');
  const wins = counted.filter((x) => x.r === 'win').length;
  const ordered = [...recent].reverse();

  let streak = 0;
  const latest = counted[0]?.r;
  for (const x of counted) {
    if (x.r !== latest) break;
    streak++;
  }

  return (
    <div className="mt-7 flex flex-wrap items-end gap-x-5 gap-y-2">
      <ol className="flex items-end gap-1 overflow-x-auto pb-1" aria-label={t('form.aria', { total: recent.length, wins, losses: counted.length - wins })}>
        {ordered.map(({ m, p, r }, i) => {
          const c = a.champion(p.championId);
          const label = t(r === 'win' ? 'form.win' : r === 'loss' ? 'form.loss' : 'form.remake', { champion: c.name, kda: `${p.kills}/${p.deaths}/${p.assists}` });
          return (
            <li key={m.id} className="form-tile shrink-0" style={{ animationDelay: `${i * 18}ms` }}>
              <Tooltip content={label}>
                <a href={`#m-${m.id}`} aria-label={label} className="group block">
                  <GameImg src={c.url} alt="" size={30} rounded="sm" className={clsx('transition-opacity', r === 'remake' && 'opacity-40', 'group-hover:opacity-80')} />
                  <span className={clsx('mt-1 block h-[3px] rounded-full', r === 'win' ? 'bg-win' : r === 'loss' ? 'bg-loss' : 'bg-faint')} />
                </a>
              </Tooltip>
            </li>
          );
        })}
      </ol>
      <p className="num pb-1.5 text-sm text-muted">
        <span className="font-display text-xl font-bold text-text">
          {wins}–{counted.length - wins}
        </span>{' '}
        {t('form.inLast', { count: recent.length })}
        {/* Win streaks only: Riot's policy doesn't allow shaming players for losing runs. */}
        {streak >= 3 && latest === 'win' && <span className="ml-2 font-semibold text-win">· {t('form.winStreak', { count: streak })}</span>}
      </p>
    </div>
  );
}
