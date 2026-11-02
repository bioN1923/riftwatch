import { describe, expect, it } from 'vitest';
import { parseItem } from '../src/lib/itemText';

const cleaver =
  "<mainText><stats><attention>45</attention> Attack Damage<br><attention>400</attention> Health</stats><br><br><passive>Carve</passive><br>Dealing <physicalDamage>physical damage</physicalDamage> reduces <scaleArmor>Armor by 6%</scaleArmor>.<br><br><passive>Fervor</passive><br>Grants <speed>Move Speed</speed>.</mainText>";

describe('item descriptions', () => {
  it('splits stats and effects and keeps damage colours', () => {
    const p = parseItem(cleaver);
    expect(p.stats).toEqual([
      { value: '45', name: 'Attack Damage' },
      { value: '400', name: 'Health' },
    ]);
    expect(p.effects.map((e) => [e.kind, e.name])).toEqual([
      ['passive', 'Carve'],
      ['passive', 'Fervor'],
    ]);
    expect(p.effects[0].segs.find((s) => s.tone === 'phys')?.text).toBe('physical damage');
    expect(p.effects.flatMap((e) => e.segs).every((s) => !/[<>]/.test(s.text))).toBe(true);
  });

  it('handles items with only an active', () => {
    const p = parseItem('<mainText><stats></stats><br><br><active>Consume</active><br>Restores <healing>120 Health</healing> over 15 seconds.</mainText>');
    expect(p.stats).toEqual([]);
    expect(p.effects[0]).toMatchObject({ kind: 'active', name: 'Consume' });
    expect(p.effects[0].segs.map((s) => s.text).join('')).toBe('Restores 120 Health over 15 seconds.');
  });
});
