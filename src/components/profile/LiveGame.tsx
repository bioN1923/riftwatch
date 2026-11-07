import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useQueries } from '@tanstack/react-query';
import clsx from 'clsx';
import type { LiveGame as Live, LiveParticipant, ScoutInfo } from '../../../shared/types';
import { api } from '../../lib/api';
import { assets, rankEmblem, useStaticData } from '../../lib/ddragon';
import { compact, duration, pct, tierName } from '../../lib/format';
import { queueName } from '../../lib/queues';
import { profilePath } from '../../lib/riotId';
import { GameImg } from '../ui/GameImg';
import { Skeleton } from '../ui/States';
import { SpellsRunes } from '../match/Loadout';
import { ladderValue } from '../../lib/ladder';
import { fadeIn } from '../../lib/motion';
import { t } from '../../i18n';

const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER']);
const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
const DIV = ['IV', 'III', 'II', 'I'];
function avgRank(scouts: (ScoutInfo | undefined)[]) {
  const vals = scouts.flatMap((s) => (s?.solo ? [ladderValue({ tier: s.solo.tier, rank: s.solo.rank, lp: s.solo.leaguePoints })] : []));
  if (!vals.length) return null;
  const v = vals.reduce((x, y) => x + y, 0) / vals.length;
  if (v >= 2800) return t('live.masterPlus');
  const tier = TIERS[Math.floor(v / 400)] ?? 'IRON';
  return `${tierName(tier)} ${DIV[Math.floor((v % 400) / 100)]}`;
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

      <div className="grid gap-4">
        {teams.map((team) => {
          const avg = avgRank(team.idx.map((i) => scouts[i]));
          return (
            <div key={team.teamId} className="panel overflow-hidden">
              <div className={clsx('flex flex-wrap items-center justify-between gap-2 px-4 py-2', team.teamId === 100 ? 'bg-side-blue/10' : 'bg-side-red/10')}>
                <h3 className={clsx('font-display text-lg font-bold', team.teamId === 100 ? 'text-side-blue' : 'text-side-red')}>
                  {team.teamId === 100 ? t('live.blue') : t('live.red')}
                  {avg && <span className="ml-2 font-sans text-xs font-normal text-muted">{t('live.average', { rank: avg })}</span>}
                </h3>
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
                  <PlayerRow key={players[i].puuid + i} p={players[i]} s={scouts[i]} loading={scoutQs[i].isPending && scoutQs[i].fetchStatus !== 'idle'} self={players[i].puuid === puuid} platform={platform} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PlayerRow({ p, s, loading, self, platform }: { p: LiveParticipant; s?: ScoutInfo; loading: boolean; self: boolean; platform: string }) {
  const { data } = useStaticData();
  const a = assets(data);
  const c = a.champion(p.championId);
  const solo = s?.solo;
  const games = solo ? solo.wins + solo.losses : 0;
  const wr = games ? solo!.wins / games : 0;
  const tags: { label: string; tone: 'good' | 'bad' | 'neutral'; title: string }[] = [];
  if (s?.mastery && s.mastery.points >= 300_000) tags.push({ label: t('live.specialist'), tone: 'good', title: t('live.masteryPoints', { points: compact(s.mastery.points) }) });
  if (solo?.hotStreak) tags.push({ label: t('live.hotStreak'), tone: 'good', title: t('live.hotStreakTip') });
  if (games >= 20 && wr >= 0.62) tags.push({ label: t('live.highWr'), tone: 'good', title: t('live.highWrTip', { rate: pct(wr), count: games }) });

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
          {s?.mastery && <span className="num"> · {t('live.mastery', { points: compact(s.mastery.points) })}</span>}
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
              <p className="num text-xs text-muted">{t('common.lp', { lp: solo.leaguePoints })}</p>
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
