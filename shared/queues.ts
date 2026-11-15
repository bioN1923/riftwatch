/**
 * Arena's queue: 1700 until 2025, then 1710 (Riot moved Arena to a new queue id), and Riot's
 * Arena events (3×6, Bravery, Swift…) may come with ids of their own. Old games keep their id, so
 * anything that recognises Arena games checks them all. Arena games always have the game mode
 * CHERRY, so a game in that mode with an id we don't know teaches us the id (see noteArenaQueue);
 * anything that asks Riot for Arena games asks for the newest id seen.
 */
export const ARENA_QUEUES = new Set([1700, 1710]);
let current = 1710;
export const ARENA_MODE = 'CHERRY';
export const isArena = (queueId: number) => ARENA_QUEUES.has(queueId);
/** The queue id to ask Riot for Arena games with: the newest one seen. */
export const arenaQueue = () => current;
/** Arena by queue id or, for an id we don't know yet, by game mode. */
export const isArenaMatch = (m: { queueId: number; gameMode?: string }) => isArena(m.queueId) || m.gameMode === ARENA_MODE;

/** Learn a new Arena queue id from a game in the Arena mode. Returns true when the id was new. */
export function noteArenaQueue(queueId: number, gameMode: string | undefined): boolean {
  if (gameMode !== ARENA_MODE || !queueId || ARENA_QUEUES.has(queueId)) return false;
  ARENA_QUEUES.add(queueId);
  if (queueId > current) current = queueId;
  return true;
}
