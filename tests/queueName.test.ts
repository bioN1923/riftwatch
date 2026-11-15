import { describe, expect, it } from 'vitest';
import { queueName } from '../src/lib/queues';

describe('queueName', () => {
  it('names an Arena event queue we have no entry for by its game mode', () => {
    expect(queueName(1750, 'CHERRY')).toBe(queueName(1710));
    expect(queueName(1750)).not.toBe(queueName(1710));
    expect(queueName(420, 'CLASSIC')).toBe(queueName(420));
  });
});
