import { describe, expect, it } from 'vitest';
import { lobbyRoles } from '../src/lib/lobbyRoles';

describe('lobbyRoles', () => {
  it('finds mains, clashes and open roles', () => {
    const r = lobbyRoles([
      { name: 'Caps', roles: { JUNGLE: 9, MIDDLE: 1 } },
      { name: 'Hans', roles: { TOP: 6, BOTTOM: 4 } },
      { name: 'Jankos', roles: { TOP: 6, JUNGLE: 2 } },
      { name: 'Mikyx', roles: { BOTTOM: 7, UTILITY: 3 } },
      { name: 'Flexy', roles: { TOP: 3, MIDDLE: 3, UTILITY: 4 } },
    ]);
    expect(r.mains).toEqual({ JUNGLE: ['Caps'], TOP: ['Hans', 'Jankos'], BOTTOM: ['Mikyx'] });
    expect(r.flex).toEqual(['Flexy']);
    expect(r.clash).toEqual(['TOP']);
    expect(r.open).toEqual(['MIDDLE', 'UTILITY']);
  });
  it('does not call a main from too few games', () => {
    expect(lobbyRoles([{ name: 'New', roles: { TOP: 2 } }]).flex).toEqual(['New']);
  });
});
