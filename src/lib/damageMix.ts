/** How a champion's damage leans, from Riot's attack/magic ratings: 'ad', 'ap' or 'mixed'. */
export function damageType(dmg: [number, number] | undefined): 'ad' | 'ap' | 'mixed' | null {
  if (!dmg) return null;
  const [attack, magic] = dmg;
  if (attack + magic <= 0) return null;
  const share = attack / (attack + magic);
  return share >= 0.6 ? 'ad' : share <= 0.4 ? 'ap' : 'mixed';
}

export interface DamageMix {
  ad: number;
  ap: number;
  mixed: number;
  /** Set when one damage type dominates (4+ of 5, or 3 with nothing of the other): worth itemizing against. */
  lean: 'ad' | 'ap' | null;
}

/** A team's damage mix. Null when any champion's rating is unknown, so a partial count isn't shown. */
export function damageMix(ratings: ([number, number] | undefined)[]): DamageMix | null {
  const types = ratings.map(damageType);
  if (!types.length || types.some((x) => x === null)) return null;
  const n = (k: string) => types.filter((x) => x === k).length;
  const ad = n('ad');
  const ap = n('ap');
  const mixed = n('mixed');
  const lean = ad >= 4 || (ad >= 3 && ap === 0) ? 'ad' : ap >= 4 || (ap >= 3 && ad === 0) ? 'ap' : null;
  return { ad, ap, mixed, lean };
}
