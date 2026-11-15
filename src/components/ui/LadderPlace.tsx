import { Link } from 'react-router';
import type { LeagueEntry } from '../../../shared/types';
import { getPlatform } from '../../../shared/regions';
import { tierName } from '../../lib/format';
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
  return (
    <Link
      to={`/leaderboard?${qs}`}
      className="num block text-xs font-medium text-gold hover:underline"
      title={t('profile.ladderTip', { rank: pos.rank, tier: tierName(entry.tier), total: pos.tierTotal })}
    >
      {t('profile.ladderPlace', { n: pos.overall.toLocaleString(), region: getPlatform(ladder.platform)?.label ?? ladder.platform })}
    </Link>
  );
}
