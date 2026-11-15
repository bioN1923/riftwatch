import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import type { LiveGame as Live, LiveParticipant, ScoutInfo } from '../../../shared/types';
import { api } from '../../lib/api';
import { assets, matchupPath, rankEmblem, useStaticData } from '../../lib/ddragon';
import { guessRoles, roleGames, SR_QUEUES } from '../../lib/lanes';
import { ROLE_LABEL } from '../ui/RoleIcon';
import { compact, duration, pct, tierName } from '../../lib/format';
import { useLadderPosition } from '../../lib/useLadderPosition';
import { getPlatform } from '../../../shared/regions';
import { queueName } from '../../lib/queues';
import { profilePath } from '../../lib/riotId';
import { GameImg } from '../ui/GameImg';
import { Skeleton } from '../ui/States';
import { SpellsRunes } from '../match/Loadout';
import { averageRank } from '../../lib/ladder';
import { fadeIn } from '../../lib/motion';
import { t } from '../../i18n';
import { liveTags, type LiveTag } from '../../lib/liveTags';
import { damageMix } from '../../lib/damageMix';

const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER']);
function avgRank(scouts: (ScoutInfo | undefined)[]) {
  return averageRank(scouts.flatMap((s) => (s?.solo ? [{ tier: s.solo.tier, rank: s.solo.rank, lp: s.solo.leaguePoints }] : [])));
}

export function LiveGame({ game, puuid, platform }: { game: Live; puuid: string; platform: string }) {
  const { data } = useStaticData();
  const a = assets(data);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.max(0, (now - game.startedAt) / 1000);

  const players = game.participants;
  const scoutQs = useQueries({
    queries: players.map((p) => ({
      queryKey: ['scout', platform, p.puuid, p.championId],
      queryFn: ({ signal }: { signal: AbortSignal }) => api.scout(platform, p.puuid, p.championId, signal),
      // Players the game itself hides (e.g. streamer mode come through without a name) are not looked up.
      enabled: !!p.puuid && !!p.gameName && !p.hidden,
      staleTime: 5 * 60_000,
    })),
  });
  const scouts = scoutQs.map((q) => q.data);
  const teams = [100, 200].map((t) => ({
    teamId: t,
    idx: players.map((p, i) => (p.teamId === t ? i : -1)).filter((i) => i >= 0),
    bans: game.bans.filter((b) => b.teamId === t),
  }));

  return (
    <section aria-labelledby="live-h" className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-loss px-2 py-0.5 text-xs font-semibold text-on-accent">
          <span className="live-dot size-1.5 rounded-full bg-on-accent" aria-hidden /> {t('live.badge')}
        </span>
        <h2 id="live-h" className="font-display text-xl font-bold">
          {queueName(game.queueId)}
        </h2>
        <span className="num text-muted">
          {duration(elapsed)}
        </span>
        <span className="text-xs text-faint md:ml-auto">{t('live.note')}</span>
      </div>

      {SR_QUEUES.has(game.queueId) && <LaneMatchup game={game} puuid={puuid} />}

      <div className="grid gap-4">
        {teams.map((team) => {
          const avg = avgRank(team.idx.map((i) => scouts[i]));
          const mix = damageMix(team.idx.map((i) => data?.champions.get(players[i].championId)?.dmg));
          return (
            <div key={team.teamId} className="panel overflow-hidden">
              <div className={clsx('flex flex-wrap items-center justify-between gap-2 px-4 py-2', team.teamId === 100 ? 'bg-side-blue/10' : 'bg-side-red/10')}>
                <h3 className={clsx('font-display text-lg font-bold', team.teamId === 100 ? 'text-side-blue' : 'text-side-red')}>
                  {team.teamId === 100 ? t('live.blue') : t('live.red')}
                  {avg && <span className="ml-2 font-sans text-xs font-normal text-muted">{t('live.average', { rank: avg })}</span>}
                </h3>
                {mix && (
                  <p className="flex items-center gap-2 text-xs text-muted md:mr-auto" title={t('live.dmgNote')}>
                    <span className="text-faint">{t('live.dmgLabel')}:</span>
                    <span>
                      {[mix.ad && t('live.dmgAd', { n: mix.ad }), mix.ap && t('live.dmgAp', { n: mix.ap }), mix.mixed && t('live.dmgMixed', { n: mix.mixed })].filter(Boolean).join(' · ')}
                    </span>
                    {mix.lean && (
                      <span className="rounded border border-line-strong px-1.5 py-0.5 text-[11px] font-medium text-text">
                        {t(mix.lean === 'ad' ? 'live.dmgLeanAd' : 'live.dmgLeanAp')}
                      </span>
                    )}
                  </p>
                )}
                {team.bans.length > 0 && (
                  <div className="flex items-center gap-1" role="group" aria-label={t('live.bans')}>
                    <span className="mr-1 text-xs text-muted">{t('live.bans')}</span>
                    {team.bans.map((b, i) => {
                      const c = a.champion(b.championId);
                      return <GameImg key={i} src={c.url} alt={t('live.banned', { champion: c.name })} size={20} rounded="sm" className="opacity-60 grayscale" />;
                    })}
                  </div>
                )}
              </div>
              <ul>
                {team.idx.map((i) => (
                  <PlayerRow key={players[i].puuid + i} p={players[i]} s={scouts[i]} queueId={game.queueId} loading={scoutQs[i].isPending && scoutQs[i].fetchStatus !== 'idle'} self={players[i].puuid === puuid} platform={platform} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * The profiled player's lane opponent, guessed (spectator data has no roles), with how that
 * matchup goes in ranked: the pre-game read a player wants during the loading screen.
 */
function LaneMatchup({ game, puuid }: { game: Live; puuid: string }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const tier = useQuery({ queryKey: ['tierlist', 'ranked', undefined], queryFn: ({ signal }) => api.tierList('ranked', undefined, signal), staleTime: 10 * 60_000 });
  const self = game.participants.find((p) => p.puuid === puuid);
  const lane = (() => {
    if (!self || !tier.data) return null;
    const games = roleGames(tier.data.rows);
    const mine = game.participants.filter((p) => p.teamId === self.teamId);
    const theirs = game.participants.filter((p) => p.teamId !== self.teamId);
    const rm = guessRoles(mine, games);
    const rt = guessRoles(theirs, games);
    if (!rm || !rt) return null;
    const role = rm[mine.indexOf(self)];
    const opp = theirs[rt.indexOf(role)];
    return opp ? { role, opp } : null;
  })();
  const mu = useQuery({
    queryKey: ['matchup', self?.championId, lane?.opp.championId, lane?.role, undefined],
    queryFn: ({ signal }) => api.matchup(self!.championId, lane!.opp.championId, { role: lane!.role }, signal),
    enabled: !!lane && !!self,
    staleTime: 5 * 60_000,
  });
  if (!self || !lane) return null;
  const me = a.champion(self.championId);
  const them = a.champion(lane.opp.championId);
  const m = mu.data;
  const enough = m && m.games >= 10;
  return (
    <div className="panel flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3" role="group" aria-labelledby="live-lane-h">
      <div className="flex items-center gap-2">
        <GameImg src={me.url} alt="" size={40} rounded="md" />
        <span className="text-xs font-semibold text-faint">VS</span>
        <GameImg src={them.url} alt="" size={40} rounded="md" />
      </div>
      <div className="min-w-[14rem] flex-1">
        <h3 id="live-lane-h" className="font-display text-lg font-bold leading-tight">
          {t('live.laneTitle', { a: me.name, b: them.name, role: ROLE_LABEL[lane.role] })}
        </h3>
        <p className="text-xs text-muted">
          {mu.isPending ? (
            <Skeleton className="mt-1 h-3 w-48" />
          ) : enough ? (
            <>
              {t.rich('live.laneRate', { a: me.name, rate: <b className={m.winRate >= 0.5 ? 'text-win' : 'text-loss'}>{pct(m.winRate, 1)}</b>, count: m.games })}
              {m.goldDiff15 != null && ` · ${t('draft.gold15', { gold: `${m.goldDiff15 >= 0 ? '+' : '−'}${Math.abs(Math.round(m.goldDiff15))}` })}`}
            </>
          ) : (
            t('live.laneFew')
          )}
        </p>
        <p className="mt-0.5 text-[11px] text-faint">{t('live.laneGuess')}</p>
      </div>
      <Link to={matchupPath(sd, self.championId, lane.opp.championId, lane.role)} className="text-sm font-medium text-gold underline underline-offset-2 hover:text-text">
        {t('live.laneOpen')}
      </Link>
    </div>
  );
}

function tagText(tag: LiveTag, champion: string): { label: string; title: string } {
  switch (tag.key) {
    case 'specialist':
      return { label: t('live.specialist'), title: t('live.masteryPoints', { points: compact(tag.points!) }) };
    case 'firstTime':
      return { label: t('live.firstTime'), title: t('live.firstTimeTip', { champion }) };
    case 'newToChamp':
      return { label: t('live.newToChamp'), title: t('live.newToChampTip', { champion, points: compact(tag.points!) }) };
    case 'hotStreak':
      return { label: t('live.hotStreak'), title: t('live.hotStreakTip') };
    case 'highWr':
      return { label: t('live.highWr'), title: t('live.highWrTip', { rate: pct(tag.rate!), count: tag.games! }) };
    case 'veteran':
      return { label: t('live.veteran'), title: t('live.veteranTip') };
    case 'freshBlood':
      return { label: t('live.freshBlood'), title: t('live.freshBloodTip') };
  }
}

/** "· #357" after an apex player's LP: their place on the region's ladder. */
function LadderTag({ platform, puuid, tier }: { platform: string; puuid?: string; tier: string }) {
  const pos = useLadderPosition(platform, puuid, tier).data;
  if (!pos) return null;
  return (
    <span className="text-gold" title={t('profile.ladderPlace', { n: pos.overall.toLocaleString(), region: getPlatform(platform)?.label ?? platform })}>
      {' · #'}
      {pos.overall.toLocaleString()}
    </span>
  );
}

function PlayerRow({ p, s, loading, self, platform, queueId }: { p: LiveParticipant; s?: ScoutInfo; loading: boolean; self: boolean; platform: string; queueId?: number }) {
  const { data } = useStaticData();
  const a = assets(data);
  const c = a.champion(p.championId);
  const solo = s?.solo;
  const games = solo ? solo.wins + solo.losses : 0;
  const wr = games ? solo!.wins / games : 0;
  const tags = liveTags(s, queueId).map((tag) => ({ ...tag, ...tagText(tag, c.name) }));

  return (
    <li className={clsx('grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-line px-4 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_170px_100px]', self && 'bg-raised')}>
      <div className="flex items-center gap-2">
        <GameImg src={c.url} alt={c.name} size={42} rounded="md" />
        <SpellsRunes p={p} a={a} size={19} />
      </div>
      <div className="min-w-0">
        {self || !p.gameName ? (
          <p className={clsx('truncate font-semibold', p.hidden && 'italic text-faint')}>{p.hidden ? t('live.hidden') : p.gameName || t('live.hidden')}</p>
        ) : (
          <Link to={profilePath(platform, p)} className="block truncate font-medium hover:text-gold hover:underline">
            {p.gameName}
            <span className="text-faint">#{p.tagLine}</span>
          </Link>
        )}
        <p className="truncate text-xs text-muted">
          {c.name}
          {s?.mastery && s.mastery.points > 0 && <span className="num"> · {t('live.mastery', { points: compact(s.mastery.points) })}</span>}
        </p>
        {tags.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <li key={tag.label} title={tag.title} className={clsx('whitespace-nowrap rounded-sm border px-1 text-[10px] font-medium', tag.tone === 'good' ? 'border-win/40 text-win' : tag.tone === 'bad' ? 'border-loss/40 text-loss' : 'border-line-strong text-muted')}>
                {tag.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        {loading ? (
          <Skeleton className="h-8 w-full" />
        ) : solo ? (
          <>
            <img src={rankEmblem(solo.tier)} alt="" {...fadeIn()} className="size-8" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {tierName(solo.tier)} {APEX.has(solo.tier) ? '' : solo.rank}
              </p>
              <p className="num text-xs text-muted">
                {t('common.lp', { lp: solo.leaguePoints })}
                <LadderTag platform={platform} puuid={p.hidden ? undefined : p.puuid} tier={solo.tier} />
              </p>
            </div>
          </>
        ) : (
          <span className="text-sm text-faint">{t('common.unranked')}</span>
        )}
      </div>
      <div className="text-right">
        {loading ? (
          <Skeleton className="ml-auto h-8 w-16" />
        ) : solo ? (
          <>
            <p className={clsx('num text-sm font-semibold', wr >= 0.55 ? 'text-win' : wr < 0.47 ? 'text-loss' : 'text-text')}>{pct(wr)}</p>
            <p className="num text-xs text-muted">{t('common.games', { count: games })}</p>
          </>
        ) : (
          <span className="text-xs text-faint sm:hidden">{t('common.unranked')}</span>
        )}
      </div>
    </li>
  );
}
