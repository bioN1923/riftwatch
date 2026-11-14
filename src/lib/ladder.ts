import type { LpPoint } from '../../shared/types';
import { t } from '../i18n';
import { tierName } from './format';

const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
const DIV = ['IV', 'III', 'II', 'I'];
const SHORT: Record<string, string> = { IRON: 'I', BRONZE: 'B', SILVER: 'S', GOLD: 'G', PLATINUM: 'P', EMERALD: 'E', DIAMOND: 'D', MASTER: 'M', GRANDMASTER: 'GM', CHALLENGER: 'C' };

/** One number for the whole ladder: Iron IV 0 LP = 0, each division 100, Master and above continue in LP. */
export const ladderValue = (p: Pick<LpPoint, 'tier' | 'rank' | 'lp'>) => {
  const ti = TIERS.indexOf(p.tier);
  return ti >= 7 ? 2800 + p.lp : ti * 400 + DIV.indexOf(p.rank) * 100 + p.lp;
};
export const ladderLabel = (v: number) => {
  if (v >= 2800) return `M ${Math.round(v - 2800)}`;
  const ti = Math.floor(v / 400);
  const di = Math.floor((v % 400) / 100);
  return `${SHORT[TIERS[ti]] ?? '?'}${4 - di}`;
};
export const ladderFull = (v: number) => {
  if (v >= 2800) return t('ladder.masterPlus', { lp: Math.round(v - 2800) });
  const ti = Math.floor(v / 400);
  const di = Math.floor((v % 400) / 100);
  return `${tierName(TIERS[ti])} ${DIV[di]} · ${Math.round(v % 100)} LP`;
};

/** The average of several ranks as a division ("Gold II"), or "Master+" at the apex. Null for none. */
export function averageRank(ranks: Pick<LpPoint, 'tier' | 'rank' | 'lp'>[]) {
  if (!ranks.length) return null;
  const v = ranks.reduce((n, r) => n + ladderValue(r), 0) / ranks.length;
  if (v >= 2800) return t('live.masterPlus');
  return `${tierName(TIERS[Math.floor(v / 400)] ?? 'IRON')} ${DIV[Math.floor((v % 400) / 100)]}`;
}
