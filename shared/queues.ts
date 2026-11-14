/**
 * Arena's queue: 1700 until 2025, then 1710 (Riot moved Arena to a new queue id). Old games keep
 * 1700, so anything that recognises Arena games checks both; anything that asks Riot for Arena
 * games asks for the current one.
 */
export const ARENA_QUEUES = new Set([1700, 1710]);
export const ARENA_QUEUE = 1710;
export const isArena = (queueId: number) => ARENA_QUEUES.has(queueId);
