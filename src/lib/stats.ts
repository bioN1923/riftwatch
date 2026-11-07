import type { MatchSummary, Participant } from '../../shared/types';

export const me = (m: MatchSummary, puuid: string) => m.participants.find((p) => p.puuid === puuid);

export interface ChampAgg {
  championId: number;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  minutes: number;
}

export interface Overview {
  games: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  kp: number;
  roles: Record<string, number>;
  champions: ChampAgg[];
  duos: { puuid: string; gameName: string; tagLine: string; games: number; wins: number }[];
}

/** Aggregate the player's loaded matches (remakes excluded), the way op.gg's summary panel does. */
export function overview(matches: MatchSummary[], puuid: string): Overview {
  const out: Overview = { games: 0, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0, kp: 0, roles: {}, champions: [], duos: [] };
  const champs = new Map<number, ChampAgg>();
  const duos = new Map<string, Overview['duos'][number]>();

  for (const m of matches) {
    if (m.remake) continue;
    const p = me(m, puuid);
    if (!p) continue;
    out.games++;
    p.win ? out.wins++ : out.losses++;
    out.kills += p.kills;
    out.deaths += p.deaths;
    out.assists += p.assists;
    out.kp += p.killParticipation;
    if (p.position) out.roles[p.position] = (out.roles[p.position] ?? 0) + 1;

    const c = champs.get(p.championId) ?? { championId: p.championId, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0, minutes: 0 };
    c.games++;
    c.wins += p.win ? 1 : 0;
    c.kills += p.kills;
    c.deaths += p.deaths;
    c.assists += p.assists;
    c.cs += p.cs;
    c.minutes += m.duration / 60;
    champs.set(p.championId, c);

    for (const mate of teammates(m, p)) {
      if (!mate.puuid || mate.puuid.startsWith('BOT') || mate.hidden) continue;
      const d = duos.get(mate.puuid) ?? { puuid: mate.puuid, gameName: mate.gameName, tagLine: mate.tagLine, games: 0, wins: 0 };
      d.games++;
      d.wins += p.win ? 1 : 0;
      duos.set(mate.puuid, d);
    }
  }
  out.kp = out.games ? out.kp / out.games : 0;
  out.champions = [...champs.values()].sort((a, b) => b.games - a.games || b.wins - a.wins);
  out.duos = [...duos.values()].filter((d) => d.games >= 2).sort((a, b) => b.games - a.games).slice(0, 6);
  return out;
}

export function teammates(m: MatchSummary, p: Participant) {
  return m.participants.filter((x) => x.puuid !== p.puuid && (p.subteam ? x.subteam === p.subteam : x.teamId === p.teamId));
}

export function result(m: MatchSummary, p: Participant): 'win' | 'loss' | 'remake' {
  if (m.remake) return 'remake';
  return p.win ? 'win' : 'loss';
}
