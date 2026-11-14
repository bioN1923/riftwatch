import { LANE_ROLES, type LaneRole } from './lanes';

export interface LobbyPlayer {
  name: string;
  /** Games per role in their recent games. */
  roles: Record<string, number>;
}

export interface LobbyRoles {
  /** Players whose recent games are mostly (half or more) in one role, by role. */
  mains: Partial<Record<LaneRole, string[]>>;
  /** Players with no role at half their games, or too few games to tell. */
  flex: string[];
  /** Roles nobody here mains. */
  open: LaneRole[];
  /** Roles two or more players main: someone will be off-role. */
  clash: LaneRole[];
}

/** Fewest recent games to call someone a main. */
export const MIN_GAMES = 3;

/** Who mains what in a lobby (from their recent games), and which roles clash or are left open. */
export function lobbyRoles(players: LobbyPlayer[]): LobbyRoles {
  const mains: Partial<Record<LaneRole, string[]>> = {};
  const flex: string[] = [];
  for (const p of players) {
    const counts = LANE_ROLES.map((r) => [r, p.roles[r] ?? 0] as const);
    const total = counts.reduce((n, [, c]) => n + c, 0);
    const [role, n] = [...counts].sort((a, b) => b[1] - a[1])[0];
    if (total >= MIN_GAMES && n / total >= 0.5) (mains[role] ??= []).push(p.name);
    else flex.push(p.name);
  }
  return {
    mains,
    flex,
    open: LANE_ROLES.filter((r) => !mains[r]?.length),
    clash: LANE_ROLES.filter((r) => (mains[r]?.length ?? 0) > 1),
  };
}
