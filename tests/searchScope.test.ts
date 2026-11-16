import { describe, expect, it } from 'vitest';
import { searchScope } from '../shared/champSearch';

describe('searchScope', () => {
  it('reads a trailing role or mode', () => {
    expect(searchScope('ahri mid')).toEqual({ rest: 'ahri', role: 'MIDDLE' });
    expect(searchScope('lee sin jg')).toEqual({ rest: 'lee sin', role: 'JUNGLE' });
    expect(searchScope('Jinx ARAM')).toEqual({ rest: 'Jinx', queue: 'aram' });
    expect(searchScope('mf adc')).toEqual({ rest: 'mf', role: 'BOTTOM' });
  });
  it('ignores other words and lone scopes', () => {
    expect(searchScope('twisted fate')).toBeNull();
    expect(searchScope('mid')).toBeNull();
  });
});
