import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en';
import ro from '../src/i18n/ro';
import de from '../src/i18n/de';
import fr from '../src/i18n/fr';
import es from '../src/i18n/es';
import pl from '../src/i18n/pl';
import pt from '../src/i18n/pt';

const base = (k: string) => k.replace(/_(one|few|many|other)$/, '');
const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((x) => x !== 'count').sort().join();

describe('translations', () => {
  const langs = { ro, de, fr, es, pl, pt } as Record<string, Record<string, string>>;
  for (const [id, dict] of Object.entries(langs)) {
    it(`${id} covers every English string with the same placeholders`, () => {
      const bases = new Set(Object.keys(dict).map(base));
      for (const [k, v] of Object.entries(en)) {
        expect(bases.has(base(k)), `${id} missing ${k}`).toBe(true);
        for (const form of Object.keys(dict).filter((x) => base(x) === base(k))) expect(holes(dict[form]), `${id} ${form}`).toBe(holes(v));
      }
    });
  }

  it('picks plural forms by language rules', () => {
    const pick = (lang: string, dict: Record<string, string>, n: number) => {
      const form = new Intl.PluralRules(lang).select(n);
      return (dict[`common.games_${form}`] ?? dict['common.games_other']).replace('{count}', String(n));
    };
    expect(pick('pl', pl, 1)).toBe('1 gra');
    expect(pick('pl', pl, 3)).toBe('3 gry');
    expect(pick('pl', pl, 5)).toBe('5 gier');
    expect(pick('ro', ro, 2)).toBe('2 meciuri');
    expect(pick('ro', ro, 20)).toBe('20 de meciuri');
  });
});
