import type { ScoutInfo } from '../../shared/types';

export type LiveTag = { key: 'specialist' | 'hotStreak' | 'highWr' | 'firstTime' | 'newToChamp' | 'veteran' | 'freshBlood'; tone: 'good' | 'bad' | 'neutral'; points?: number; rate?: number; games?: number };

/**
 * Short facts about a player in a live game, the kind Porofessor shows, from data we already look
 * up (ranked entry and mastery on the champion they locked in). Facts, not judgements: "first time
 * on this champion" is worth knowing for both teams, so it's neutral, not red.
 */
/** Modes where champions are dealt at random (ARAM, ARAM Clash, ARURF, ARAM Mayhem): being new to one says little. */
export const RANDOM_CHAMP_QUEUES = new Set([100, 450, 720, 900, 2400]);

export function liveTags(s: ScoutInfo | undefined, queueId?: number): LiveTag[] {
  if (!s || s.hidden) return [];
  const out: LiveTag[] = [];
  const solo = s.solo;
  const games = solo ? solo.wins + solo.losses : 0;
  const wr = games ? solo!.wins / games : 0;
  const m = s.mastery;
  const picked = queueId == null || !RANDOM_CHAMP_QUEUES.has(queueId);
  if (m && m.points >= 300_000) out.push({ key: 'specialist', tone: 'good', points: m.points });
  // Under ~10k points is roughly a handful of games; 0 means Riot has no record of them playing it.
  // Only where the champion was picked: in ARAM it was rolled, so being new to it says little.
  else if (picked && m && m.points === 0) out.push({ key: 'firstTime', tone: 'neutral' });
  else if (picked && m && m.points < 10_000) out.push({ key: 'newToChamp', tone: 'neutral', points: m.points });
  if (solo?.hotStreak) out.push({ key: 'hotStreak', tone: 'good' });
  if (games >= 20 && wr >= 0.62) out.push({ key: 'highWr', tone: 'good', rate: wr, games });
  // Riot's own flags: 100+ games in this division, or just promoted into it.
  if (solo?.veteran) out.push({ key: 'veteran', tone: 'neutral' });
  else if (solo?.freshBlood) out.push({ key: 'freshBlood', tone: 'neutral' });
  return out;
}
