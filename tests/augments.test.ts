import { describe, expect, it } from 'vitest';
import { augmentText, slimAugments } from '../shared/augments';

describe('augmentText', () => {
  it('fills values from the first rank and strips markup', () => {
    expect(augmentText('Gain <b>@Bonus*100@%</b> damage.<br>Lasts @Dur@s.', { Bonus: [0.1, 0.15], Dur: [3, 3] })).toBe('Gain 15% damage. Lasts 3s.');
  });
  it('gives nothing when a value is unknown', () => {
    expect(augmentText('Deal @calc_dmg@ damage.', { Other: [1] })).toBe('');
    expect(augmentText('Press @spell1KeyBind@.', undefined)).toBe('');
  });
  it('keeps plain text without tokens', () => {
    expect(augmentText('Gain the <spellName>Flash</spellName> spell.', {})).toBe('Gain the Flash spell.');
  });
});

describe('slimAugments', () => {
  it('keeps id, name, rarity and a lower-case icon path', () => {
    const out = slimAugments({ augments: [{ id: 93, name: 'Warmup Routine', rarity: 2, iconSmall: 'assets/UX/Cherry/x_small.png', desc: 'Up to @Max@%.', dataValues: { Max: [20, 40] } }, { name: 'no id' }] });
    expect(out).toEqual([[93, { name: 'Warmup Routine', rarity: 2, icon: 'assets/ux/cherry/x_small.png', desc: 'Up to 40%.' }]]);
  });
});
