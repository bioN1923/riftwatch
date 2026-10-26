import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import type { Profile } from '../../../shared/types';
import { api } from '../../lib/api';
import { isFavorite, toggleFavorite, useFavorites } from '../../lib/storage';
import { LineChart } from '../charts/LineChart';
import { Skeleton } from '../ui/States';
import { ladderFull, ladderLabel, ladderValue } from '../../lib/ladder';

export function LpPanel({ profile }: { profile: Profile }) {
  const qc = useQueryClient();
  const favorites = useFavorites();
  const puuid = profile.account.puuid;
  const q = useQuery({ queryKey: ['lp', puuid], queryFn: ({ signal }) => api.lp(profile.platform, puuid, signal), staleTime: 60_000 });
  const solo = profile.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
  const saved = { platform: profile.platform, gameName: profile.account.gameName, tagLine: profile.account.tagLine, profileIconId: profile.summoner.profileIconId, tier: solo?.tier, rank: solo?.rank };
  const fav = isFavorite(favorites, saved);

  // Starred players are tracked by the server; keep the two in sync.
  useEffect(() => {
    if (!q.data) return;
    if (fav && !q.data.tracked) void api.track({ platform: profile.platform, puuid, gameName: profile.account.gameName, tagLine: profile.account.tagLine }).then(() => qc.invalidateQueries({ queryKey: ['lp', puuid] }));
    if (!fav && q.data.tracked) void api.untrack(puuid).then(() => qc.invalidateQueries({ queryKey: ['lp', puuid] }));
  }, [fav, q.data, puuid, profile, qc]);

  const queues = [...new Set((q.data?.points ?? []).map((p) => p.queue))];
  const [queue, setQueue] = useState<string>('RANKED_SOLO_5x5');
  const active = queues.includes(queue) ? queue : queues[0];
  const pts = (q.data?.points ?? []).filter((p) => p.queue === active);

  if (q.isPending) return <Skeleton className="h-48" />;
  if (!profile.ranked.length) return null;

  const values = pts.map(ladderValue);
  const delta = values.length >= 2 ? values[values.length - 1] - values[0] : 0;
  const days = pts.length >= 2 ? Math.max(1, Math.round((pts[pts.length - 1].t - pts[0].t) / 86400_000)) : 0;
  const lo = Math.floor((Math.min(...values) - 30) / 100) * 100;
  const hi = Math.ceil((Math.max(...values) + 30) / 100) * 100;
  const step = Math.max(100, Math.ceil((hi - lo) / 4 / 100) * 100);
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += step) ticks.push(v);
  const dateFmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

  return (
    <section className="panel p-4" aria-labelledby="lp-h">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="lp-h" className="panel-title">
          Rank history
        </h2>
        {queues.length > 1 && (
          <div role="radiogroup" aria-label="Queue" className="flex gap-1 text-xs">
            {queues.map((qq) => (
              <button key={qq} role="radio" aria-checked={active === qq} onClick={() => setQueue(qq)} className={clsx('rounded-sm px-1.5 py-0.5', active === qq ? 'bg-raised text-text' : 'text-muted hover:text-text')}>
                {qq === 'RANKED_SOLO_5x5' ? 'Solo' : 'Flex'}
              </button>
            ))}
          </div>
        )}
      </div>
      {pts.length >= 2 ? (
        <>
          <p className="text-xs text-muted">
            <span className={clsx('num font-semibold', delta > 0 ? 'text-win' : delta < 0 ? 'text-loss' : 'text-muted')}>
              {delta > 0 ? '+' : delta < 0 ? '−' : '±'}
              {Math.abs(delta)} LP
            </span>{' '}
            over {days} day{days === 1 ? '' : 's'}
          </p>
          <div className="mt-2">
            <LineChart
              height={170}
              endLabels={false}
              padLeft={34}
              zeroBased={false}
              yTicks={ticks}
              label="Rank over time"
              format={ladderLabel}
              xLabel={(i) => dateFmt.format(pts[i].t)}
              hoverTitle={(i) => `${dateFmt.format(pts[i].t)} · ${pts[i].wins}W ${pts[i].losses}L`}
              tickEvery={Math.max(1, Math.ceil(pts.length / 3))}
              series={[{ id: 'lp', name: ladderFull(values[values.length - 1]), color: 'var(--series-1)', values }]}
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">Not enough history yet. Each visit records the current rank{fav ? ', and starred players are checked every 20 minutes.' : '.'}</p>
      )}
      {!fav && (
        <button onClick={() => toggleFavorite(saved)} className="mt-3 text-sm font-medium text-gold hover:underline">
          Star to track rank automatically
        </button>
      )}
      {fav && q.data?.tracked && <p className="mt-2 text-xs text-faint">Tracked: rank is checked every 20 minutes while the server runs.</p>}
    </section>
  );
}
