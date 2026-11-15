/**
 * A player's build in one game against what high-elo players build on the same champion and role.
 * The server counts a build's "core" as the first three completed (legendary) items in purchase
 * order, keeping only items still owned at the end; this mirrors that so the two can be compared.
 */

export interface ItemInfo {
  gold: number;
  from: number[];
  into: number[];
}

const BOOTS = 1001;

/** A finished item that counts toward a core: costs 2000+, builds into nothing, and isn't a boots upgrade. */
export function isLegendary(id: number, items: Map<number, ItemInfo>): boolean {
  const it = items.get(id);
  if (!it || id >= 10000 || it.into.length > 0 || it.gold < 2000) return false;
  const seen = new Set<number>();
  const fromBoots = (x: number, depth: number): boolean => {
    if (x === BOOTS) return true;
    if (depth > 3 || seen.has(x)) return false;
    seen.add(x);
    return (items.get(x)?.from ?? []).some((y) => fromBoots(y, depth + 1));
  };
  return !it.from.some((x) => fromBoots(x, 0));
}

/** Completed items in the order they were bought, still owned at the end (first three = the core). */
export function purchasedCore(finalItems: number[], purchases: { itemId: number; sold?: boolean }[], legendary: (id: number) => boolean): number[] {
  const owned = new Map<number, number>();
  for (const id of finalItems.slice(0, 6)) if (legendary(id)) owned.set(id, (owned.get(id) ?? 0) + 1);
  const order: number[] = [];
  for (const e of purchases) {
    if (e.sold || !legendary(e.itemId)) continue;
    const left = owned.get(e.itemId) ?? 0;
    if (left > 0) {
      order.push(e.itemId);
      owned.set(e.itemId, left - 1);
    }
  }
  return order.slice(0, 3);
}

export interface CoreBuild {
  ids: number[];
  games: number;
  winRate: number;
}

export type CoreVerdict =
  | { kind: 'short'; have: number } // fewer than three completed items: too early to compare
  | { kind: 'same'; rank: number; build: CoreBuild } // the exact core (any order) is one of the common ones
  | { kind: 'differs'; shared: number[]; top: CoreBuild }; // otherwise: which of the player's items the most played core shares

export function compareCore(core: number[], builds: CoreBuild[]): CoreVerdict | null {
  if (!builds.length) return null;
  if (core.length < 3) return { kind: 'short', have: core.length };
  const key = [...core].sort((a, b) => a - b).join(',');
  const i = builds.findIndex((b) => [...b.ids].sort((a, c) => a - c).join(',') === key);
  if (i >= 0) return { kind: 'same', rank: i + 1, build: builds[i] };
  const top = builds[0];
  return { kind: 'differs', shared: core.filter((id) => top.ids.includes(id)), top };
}
