/** Fewer games than this and a matchup isn't called either way (same as the champion page's low-sample mark). */
export const MATCHUP_MIN_GAMES = 10;

export type MatchupCall = { side: 'few' } | { side: 'even' } | { side: 'me' | 'them'; sure: boolean };

/**
 * Who a matchup favours. The side comes from the small-sample-adjusted win rate (more than 2 points
 * off 50%); "sure" only when the raw win rate is also more than two standard errors from 50%, so a
 * 48.7% over 113 games reads as even rather than as a loss.
 */
export function matchupCall(m: { games: number; winRate: number; adjusted: number }): MatchupCall {
  if (m.games < MATCHUP_MIN_GAMES) return { side: 'few' };
  const edge = m.adjusted - 0.5;
  if (Math.abs(edge) <= 0.02) return { side: 'even' };
  const se = Math.sqrt(Math.max(m.winRate * (1 - m.winRate), 0.01) / m.games);
  return { side: edge > 0 ? 'me' : 'them', sure: Math.abs(m.winRate - 0.5) > 2 * se };
}

/** Text colour for a call: green/red only when sure. */
export const callTone = (c: MatchupCall) => (c.side === 'me' && c.sure ? 'text-win' : c.side === 'them' && c.sure ? 'text-loss' : c.side === 'few' ? 'text-muted' : 'text-text');
