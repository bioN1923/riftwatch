import type { ApiErrorBody, PrivacyChallenge, PrivacyResult, ApiErrorCode, ChampionStats,
  MatchupStats, HealthResponse, Ladder, LiveResponse, LpHistory, ServerStatus, MatchPage, MatchTimeline, PlayerHit, Profile, ScoutInfo, StatsGroup, TierList } from '../../shared/types';

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

const send = <T,>(path: string, body: unknown) =>
  request<T>(path, undefined, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function request<T>(path: string, signal?: AbortSignal, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { signal, ...init });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiClientError(0, 'UPSTREAM', 'Can’t reach the Riftwatch server. Is it running? Start it with “npm run dev”.');
  }
  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = await res.json();
    } catch {
      /* not JSON */
    }
    throw new ApiClientError(
      res.status,
      body?.error.code ?? 'UPSTREAM',
      body?.error.message ?? `The server responded with ${res.status}.`,
      body?.error.retryAfter,
    );
  }
  return res.json() as Promise<T>;
}

const enc = encodeURIComponent;

export const api = {
  health: () => request<HealthResponse>('/health'),
  profile: (platform: string, gameName: string, tagLine: string, opts: { fresh?: boolean; signal?: AbortSignal } = {}) =>
    request<Profile>(`/profile/${platform}/${enc(gameName)}/${enc(tagLine)}${opts.fresh ? '?fresh=1' : ''}`, opts.signal),
  matches: (platform: string, puuid: string, p: { start: number; count: number; queue: string; fresh?: boolean }, signal?: AbortSignal) =>
    request<MatchPage>(
      `/matches/${platform}/${enc(puuid)}?start=${p.start}&count=${p.count}&queue=${p.queue}${p.fresh ? '&fresh=1' : ''}`,
      signal,
    ),
  timeline: (platform: string, matchId: string, signal?: AbortSignal) => request<MatchTimeline>(`/timeline/${platform}/${enc(matchId)}`, signal),
  search: (platform: string, q: string, resolve: boolean, signal?: AbortSignal) =>
    request<PlayerHit[]>(`/search?platform=${platform}&q=${enc(q)}${resolve ? '&resolve=1' : ''}`, signal),
  tierList: (group: StatsGroup, patch?: string, signal?: AbortSignal) => request<TierList>(`/champions?group=${group}${patch ? `&patch=${patch}` : ''}`, signal),
  champion: (id: number, p: { group: StatsGroup; role?: string; patch?: string }, signal?: AbortSignal) =>
    request<ChampionStats>(`/champions/${id}?group=${p.group}${p.role ? `&role=${p.role}` : ''}${p.patch ? `&patch=${p.patch}` : ''}`, signal),
  matchup: (id: number, opp: number, p: { role?: string; patch?: string }, signal?: AbortSignal) =>
    request<MatchupStats>(`/champions/${id}/vs/${opp}?group=ranked${p.role ? `&role=${p.role}` : ''}${p.patch ? `&patch=${p.patch}` : ''}`, signal),
  lp: (platform: string, puuid: string, signal?: AbortSignal) => request<LpHistory>(`/lp/${platform}/${enc(puuid)}`, signal),
  track: (p: { platform: string; puuid: string; gameName: string; tagLine: string }) =>
    request<{ tracked: boolean }>('/track', undefined, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }),
  untrack: (puuid: string) => request<{ tracked: boolean }>(`/track/${enc(puuid)}`, undefined, { method: 'DELETE' }),
  scout: (platform: string, puuid: string, championId?: number, signal?: AbortSignal) =>
    request<ScoutInfo>(`/scout/${platform}/${enc(puuid)}${championId ? `?champion=${championId}` : ''}`, signal),
  leaderboard: (platform: string, p: { queue: string; tier: string; page: number }, signal?: AbortSignal) =>
    request<Ladder>(`/leaderboard/${platform}?queue=${p.queue}&tier=${p.tier}&page=${p.page}`, signal),
  rotation: (platform: string, signal?: AbortSignal) => request<{ championIds: number[] }>(`/rotation/${platform}`, signal),
  status: (platform: string, signal?: AbortSignal) => request<ServerStatus>(`/status/${platform}`, signal),
  privacyChallenge: (body: { platform: string; gameName: string; tagLine: string; action: 'hide' | 'show' }) =>
    send<PrivacyChallenge>('/privacy/challenge', body),
  privacyVerify: (body: { platform: string; puuid: string }) => send<PrivacyResult>('/privacy/verify', body),
  demoSetIcon: (puuid: string, iconId: number) => send<{ ok: boolean }>('/privacy/demo-set-icon', { puuid, iconId }),
  live: (platform: string, puuid: string, signal?: AbortSignal) => request<LiveResponse>(`/live/${platform}/${enc(puuid)}`, signal),
};
