import type { MatchSummary, Participant } from '../../shared/types';
import { isArenaMatch } from '../../shared/queues';
import { me } from './stats';

export type RecordId = 'kills' | 'kda' | 'damage' | 'cspm' | 'vision' | 'multi' | 'length';

export interface PersonalRecord {
  id: RecordId;
  value: number;
  match: MatchSummary;
  p: Participant;
}

const ARAM = 450;
/** Per-minute records need a real game: short ones (early surrenders) inflate them. */
const MIN_MINUTES = 15;

/**
 * Best single games among the loaded ones: most kills, best KDA, most damage, best CS and vision
 * per minute (Summoner's Rift only), biggest multi-kill (a triple or better) and longest game.
 * Remakes and Arena are left out; ties go to the more recent game.
 */
export function personalRecords(matches: MatchSummary[], puuid: string): PersonalRecord[] {
  const best = new Map<RecordId, PersonalRecord>();
  const offer = (id: RecordId, value: number, match: MatchSummary, p: Participant) => {
    const cur = best.get(id);
    if (!cur || value > cur.value || (value === cur.value && match.startedAt > cur.match.startedAt)) best.set(id, { id, value, match, p });
  };
  for (const m of matches) {
    const p = me(m, puuid);
    if (!p || m.remake || isArenaMatch(m) || !m.duration) continue;
    const min = m.duration / 60;
    offer('kills', p.kills, m, p);
    offer('kda', (p.kills + p.assists) / Math.max(1, p.deaths), m, p);
    offer('damage', p.damage, m, p);
    if (m.queueId !== ARAM && min >= MIN_MINUTES) {
      offer('cspm', p.cs / min, m, p);
      offer('vision', p.visionScore / min, m, p);
    }
    if (p.largestMultiKill >= 3) offer('multi', p.largestMultiKill, m, p);
    offer('length', m.duration, m, p);
  }
  const order: RecordId[] = ['kills', 'kda', 'damage', 'multi', 'cspm', 'vision', 'length'];
  return order.flatMap((id) => {
    const r = best.get(id);
    return r && r.value > 0 ? [r] : [];
  });
}
