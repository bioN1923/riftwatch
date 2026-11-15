import { t } from '../i18n';
import type { MatchupCall } from './matchupVerdict';

/** "Ahri is favoured", "Leaning Ahri (could still be chance)", "An even matchup" or "Too few games". */
export function callText(c: MatchupCall, me: string, them: string): string {
  if (c.side === 'few') return t('mp.tooFew');
  if (c.side === 'even') return t('mp.even');
  const champion = c.side === 'me' ? me : them;
  return c.sure ? t('mp.favoured', { champion }) : t('mp.leans', { champion });
}
