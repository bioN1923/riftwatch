import { describe, expect, it } from 'vitest';
import { sureTone } from '../src/lib/format';

describe('sureTone', () => {
  it('stays plain within two standard errors of 50%', () => {
    expect(sureTone(0.496, 423)).toBe('text-text');
    expect(sureTone(0.612, 67)).toBe('text-text');
  });
  it('colours clear gaps', () => {
    expect(sureTone(0.539, 2718)).toBe('text-win');
    expect(sureTone(0.4, 400)).toBe('text-loss');
  });
  it('ignores tiny samples', () => expect(sureTone(1, 3)).toBe('text-text'));
});
