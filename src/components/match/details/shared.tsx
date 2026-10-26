import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import type { MatchSummary, Participant } from '../../../../shared/types';
import { api } from '../../../lib/api';
import { assets, useStaticData } from '../../../lib/ddragon';
import { GameImg } from '../../ui/GameImg';
import { Skeleton, ErrorState } from '../../ui/States';

/** The enemy in the same position, if the queue has positions. */
export function laneOpponent(m: MatchSummary, p: Participant) {
  if (!p.position) return undefined;
  return m.participants.find((x) => x.teamId !== p.teamId && x.position === p.position);
}

export function useTimeline(platform: string, matchId: string) {
  return useQuery({
    queryKey: ['timeline', platform, matchId],
    queryFn: ({ signal }) => api.timeline(platform, matchId, signal),
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
}

export function TimelineGate({ q, children }: { q: ReturnType<typeof useTimeline>; children: () => React.ReactNode }) {
  if (q.isPending) {
    return (
      <div className="space-y-3 p-4" aria-busy="true">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (q.isError) {
    return (
      <div className="p-4">
        <ErrorState error={q.error} />
      </div>
    );
  }
  return <>{children()}</>;
}

/** Row of champion portraits to choose whose data a tab shows. */
export function PlayerPicker({ match, value, onChange }: { match: MatchSummary; value: string; onChange: (puuid: string) => void }) {
  const { data } = useStaticData();
  const a = assets(data);
  const teams = [100, 200].map((t) => match.participants.filter((p) => p.teamId === t));
  return (
    <div role="radiogroup" aria-label="Show player" className="flex flex-wrap items-center gap-3">
      {teams.map((team, ti) => (
        <div key={ti} className="flex gap-1">
          {team.map((p) => {
            const c = a.champion(p.championId);
            const on = p.puuid === value;
            return (
              <button
                key={p.puuid + p.championId}
                role="radio"
                aria-checked={on}
                aria-label={`${c.name} (${p.gameName})`}
                title={`${c.name} · ${p.gameName}`}
                onClick={() => onChange(p.puuid)}
                className={clsx('rounded-[5px] p-0.5 transition', on ? 'bg-gold' : 'opacity-55 hover:opacity-100')}
              >
                <GameImg src={c.url} alt="" size={28} rounded="sm" className={ti === 0 ? 'ring-1 ring-side-blue/60' : 'ring-1 ring-side-red/60'} />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="font-display text-lg font-bold">{children}</h3>
      {aside && <div className="text-xs text-muted">{aside}</div>}
    </div>
  );
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
