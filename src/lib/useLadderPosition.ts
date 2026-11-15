import { useQuery } from '@tanstack/react-query';
import { api } from './api';

const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER']);

/** A Master+ player's place on their region's ladder (cached server-side; nothing for lower tiers). */
export function useLadderPosition(platform: string, puuid: string | undefined, tier: string | undefined, queue: 'solo' | 'flex' = 'solo') {
  const apex = !!tier && APEX.has(tier) && !!puuid;
  const t = tier?.toLowerCase() ?? '';
  return useQuery({
    queryKey: ['ladderPos', platform, puuid, queue, t],
    enabled: apex,
    queryFn: ({ signal }) => api.ladderPosition(platform, puuid!, { queue, tier: t }, signal),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
