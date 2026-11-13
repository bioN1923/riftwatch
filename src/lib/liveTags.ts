import type { ScoutInfo } from '../../shared/types';

export type LiveTag = { key: 'specialist' | 'hotStreak' | 'highWr' | 'firstTime' | 'newToChamp' | 'veteran' | 'freshBlood'; tone: 'good' | 'bad' | 'neutral'; points?: number; rate?: number; games?: number };

/**
 * Short facts about a player in a live game, the kind Porofessor shows, from data we already look
 * up (ranked entry and mastery on the champion they locked in). Facts, not judgements: "first time
 * on this champion" is worth knowing for both teams, so it's neutral, not red.
 */
export function liveTags(s: ScoutInfo | undefined): LiveTag[] {
  if (!s || s.hidden) return [];
  const out: LiveTag[] = [];
  const solo = s.solo;
  const games = solo ? solo.wins + solo.losses : 0;
  const wr = games ? solo!.wins / games : 0;
  const m = s.mastery;
  if (m && m.points >= 300_000) out.push({ key: 'specialist', tone: 'good', points: m.points });
  // Under ~10k points is roughly a handful of games; 0 means Riot has no record of them playing it.
  else if (m && m.points === 0) out.push({ key: 'firstTime', tone: 'neutral' });
  else if (m && m.points < 10_000) out.push({ key: 'newToChamp', tone: 'neutral', points: m.points });
  if (solo?.hotStreak) out.push({ key: 'hotStreak', tone: 'good' });
  if (games >= 20 && wr >= 0.62) out.push({ key: 'highWr', tone: 'good', rate: wr, games });
  // Riot's own flags: 100+ games in this division, or just promoted into it.
  if (solo?.veteran) out.push({ key: 'veteran', tone: 'neutral' });
  else if (solo?.freshBlood) out.push({ key: 'freshBlood', tone: 'neutral' });
  return out;
}
