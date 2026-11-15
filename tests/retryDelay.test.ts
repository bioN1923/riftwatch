import { describe, expect, it } from 'vitest';
import { AUTO_RETRIES, retryDelay } from '../src/components/ui/States';

describe('retryDelay', () => {
  it('follows Retry-After within 3 s to a minute', () => {
    expect(retryDelay(7)).toBe(7);
    expect(retryDelay(0.2)).toBe(3);
    expect(retryDelay(600)).toBe(60);
    expect(retryDelay(undefined)).toBe(10);
  });
  it('retries only a couple of times on its own', () => {
    expect(AUTO_RETRIES).toBeLessThanOrEqual(2);
  });
});
