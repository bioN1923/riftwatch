import type { MatchSummary } from '../../shared/types';

export interface LobbyPlayer {
  puuid: string;
  name: string;
  matches?: MatchSummary[];
}

/**
 * Who in a multi-searched lobby recently played on the same team as whom (likely premades), like
 * Porofessor's premade markers. Each player's recent games are pooled, so a game counts once even
 * when it shows up in both players' lists. One shared game can be chance (the same matchmaking
 * pool), so a pair needs 2+ games together. Only public match data that's already loaded is used.
 */
export function lobbyDuos(players: LobbyPlayer[], minGames = 2): Map<string, { puuid: string; name: string; games: number; wins: number }[]> {
  const all = new Map<string, MatchSummary>();
  for (const p of players) for (const m of p.matches ?? []) all.set(m.id, m);
  const out = new Map<string, { puuid: string; name: string; games: number; wins: number }[]>();
  for (let i = 0; i < players.length; i++)
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      if (a.puuid === b.puuid) continue;
      let games = 0;
      let wins = 0;
      for (const m of all.values()) {
        const pa = m.participants.find((x) => x.puuid === a.puuid);
        const pb = m.participants.find((x) => x.puuid === b.puuid);
        if (pa && pb && pa.teamId === pb.teamId && !m.remake) {
          games++;
          if (pa.win) wins++;
        }
      }
      if (games < minGames) continue;
      out.set(a.puuid, [...(out.get(a.puuid) ?? []), { puuid: b.puuid, name: b.name, games, wins }]);
      out.set(b.puuid, [...(out.get(b.puuid) ?? []), { puuid: a.puuid, name: a.name, games, wins }]);
    }
  return out;
}
