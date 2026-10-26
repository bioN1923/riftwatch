import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import type { LiveGame as Live } from '../../../shared/types';
import { assets, useStaticData } from '../../lib/ddragon';
import { duration } from '../../lib/format';
import { queueName } from '../../lib/queues';
import { profilePath } from '../../lib/riotId';
import { GameImg } from '../ui/GameImg';
import { SpellsRunes } from '../match/Loadout';

export function LiveGame({ game, puuid, platform }: { game: Live; puuid: string; platform: string }) {
  const { data } = useStaticData();
  const a = assets(data);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.max(0, (now - game.startedAt) / 1000);
  const teams = [100, 200].map((t) => ({ teamId: t, players: game.participants.filter((p) => p.teamId === t), bans: game.bans.filter((b) => b.teamId === t) }));

  return (
    <section aria-labelledby="live-h" className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded bg-loss px-2 py-0.5 text-xs font-semibold text-white">
          <span className="live-dot size-1.5 rounded-full bg-white" aria-hidden /> Live
        </span>
        <h2 id="live-h" className="font-display text-lg font-semibold">
          {queueName(game.queueId)}
        </h2>
        <span className="num text-muted" aria-label={`Elapsed ${duration(elapsed)}`}>
          {duration(elapsed)}
        </span>
        <span className="text-xs text-faint md:ml-auto">Game time is approximate and refreshes every minute.</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((t) => (
          <div key={t.teamId} className="panel overflow-hidden">
            <div className={clsx('flex items-center justify-between px-4 py-2', t.teamId === 100 ? 'bg-win-tint' : 'bg-loss-tint')}>
              <h3 className={clsx('font-display font-semibold', t.teamId === 100 ? 'text-win' : 'text-loss')}>{t.teamId === 100 ? 'Blue side' : 'Red side'}</h3>
              {t.bans.length > 0 && (
                <div className="flex items-center gap-1" aria-label="Bans">
                  <span className="mr-1 text-xs text-muted">Bans</span>
                  {t.bans.map((b, i) => {
                    const c = a.champion(b.championId);
                    return <GameImg key={i} src={c.url} alt={`Banned ${c.name}`} size={20} rounded="sm" className="opacity-60 grayscale" />;
                  })}
                </div>
              )}
            </div>
            <ul>
              {t.players.map((p) => {
                const c = a.champion(p.championId);
                const self = p.puuid === puuid;
                return (
                  <li key={p.puuid + p.championId} className={clsx('flex items-center gap-3 border-t border-line px-4 py-2', self && 'bg-raised')}>
                    <GameImg src={c.url} alt={c.name} size={40} rounded="full" />
                    <SpellsRunes p={p} a={a} size={19} />
                    <div className="min-w-0">
                      {self || !p.gameName ? (
                        <p className="truncate font-semibold">{p.gameName || 'Hidden player'}</p>
                      ) : (
                        <Link to={profilePath(platform, p)} className="block truncate font-medium hover:underline">
                          {p.gameName}
                          <span className="text-faint">#{p.tagLine}</span>
                        </Link>
                      )}
                      <p className="text-xs text-muted">{c.name}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
