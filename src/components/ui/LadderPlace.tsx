import { Link } from 'react-router';
import type { LeagueEntry } from '../../../shared/types';
import { getPlatform } from '../../../shared/regions';
import { tierName, timeAgo } from '../../lib/format';
import { useLadderPosition } from '../../lib/useLadderPosition';
import { t } from '../../i18n';

export type LadderRef = { platform: string; puuid: string; queue: 'solo' | 'flex' };

/** "#57 on the EUW ladder" for Master and above, linking to that page of the ladder. Nothing below Master. */
export function LadderPlace({ entry, ladder }: { entry: Pick<LeagueEntry, 'tier'>; ladder: LadderRef }) {
  const tier = entry.tier.toLowerCase();
  const pos = useLadderPosition(ladder.platform, ladder.puuid, entry.tier, ladder.queue).data;
  if (!pos) return null;
  const qs = new URLSearchParams({ region: ladder.platform, tier });
  if (ladder.queue === 'flex') qs.set('queue', 'flex');
  if (pos.page > 1) qs.set('page', String(pos.page));
  // Highlight their row on arrival (the ladder scrolls to it).
  qs.set('hl', String(pos.rank));
  return (
    <Link
      to={`/leaderboard?${qs}`}
      className="num block text-xs font-medium text-gold hover:underline"
      title={t('profile.ladderTip', { rank: pos.rank, tier: tierName(entry.tier), total: pos.tierTotal })}
    >
      {t('profile.ladderPlace', { n: pos.overall.toLocaleString(), region: getPlatform(ladder.platform)?.label ?? ladder.platform })}
      {pos.lpChange != null && pos.since != null && (
        <span className={pos.lpChange > 0 ? 'text-win' : pos.lpChange < 0 ? 'text-loss' : 'text-faint'}>
          {' · '}
          {t('profile.ladderChange', { lp: pos.lpChange > 0 ? `+${pos.lpChange}` : pos.lpChange < 0 ? `−${Math.abs(pos.lpChange)}` : '±0', when: timeAgo(pos.since) })}
        </span>
      )}
    </Link>
  );
}
