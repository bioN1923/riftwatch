import { describe, expect, it } from 'vitest';
import { untaggedNames, withDefaultTag } from '../src/lib/lobby';

describe('untaggedNames', () => {
  it('reads bare names and English lobby lines, skipping tagged ones and leavers', () => {
    const text = 'Caps joined the lobby\nRekkles joined the lobby.\nUpset left the lobby\nFaker #KR1 joined the lobby\nJankos, Bwipo\ncaps';
    expect(untaggedNames(text)).toEqual(['Caps', 'Rekkles', 'Jankos', 'Bwipo']);
  });
  it('ignores sentences and too-short bits', () => {
    expect(untaggedNames('this is a long sentence about nothing\nab')).toEqual([]);
  });
});

describe('withDefaultTag', () => {
  it('keeps tagged IDs and tags the rest', () => {
    expect(withDefaultTag('Faker#KR1\nCaps joined the lobby', 'EUW')).toBe('Faker#KR1\nCaps#EUW');
  });
});
