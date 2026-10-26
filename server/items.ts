/**
 * Item classification for build statistics. In live mode we load Data Dragon's item.json
 * once at startup; if that fails (offline, demo), a small built-in list is used instead.
 */
export type ItemKind = 'legendary' | 'boots' | 'starter' | 'other';

const FALLBACK_BOOTS = [3006, 3009, 3020, 3047, 3111, 3158];
const FALLBACK_STARTERS = [1054, 1055, 1056, 1082, 1083, 1101, 1102, 1103, 2003, 2031, 3850, 3865];
const FALLBACK_LEGENDARY = [
  3078, 3071, 6333, 3053, 3742, 3075, 3065, 6610, 3748, 3156, 6692, 3142, 3074, 6676, 3157, 3089, 3135, 4645, 3165, 3102, 6655, 3118, 3116, 3031, 3094,
  3036, 3153, 6672, 3046, 3085, 3072, 3033, 3190, 3107, 3504, 3222, 3050, 3109, 6617, 3853, 3860,
];

let kinds = new Map<number, ItemKind>();
for (const id of FALLBACK_LEGENDARY) kinds.set(id, 'legendary');
for (const id of FALLBACK_BOOTS) kinds.set(id, 'boots');
for (const id of FALLBACK_STARTERS) kinds.set(id, 'starter');

export function itemKind(id: number): ItemKind {
  return kinds.get(id) ?? 'other';
}

export async function loadItemKinds() {
  try {
    const versions = (await (await fetch('https://ddragon.leagueoflegends.com/api/versions.json', { signal: AbortSignal.timeout(8000) })).json()) as string[];
    const data = (await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${versions[0]}/data/en_US/item.json`, { signal: AbortSignal.timeout(8000) })).json()) as any;
    const next = new Map<number, ItemKind>();
    for (const [key, it] of Object.entries<any>(data.data)) {
      const id = Number(key);
      // 6-digit ids are mode-specific copies (Arena, Swarm…); Summoner's Rift uses the base ids.
      if (id >= 10000) continue;
      const tags: string[] = it.tags ?? [];
      const onRift = it.maps?.['11'] !== false;
      const buyable = it.gold?.purchasable !== false && it.inStore !== false;
      if (!onRift || !buyable) continue;
      if (tags.includes('Boots') && (it.from?.length ?? 0) > 0) next.set(id, 'boots');
      else if (!(it.into?.length > 0) && (it.gold?.total ?? 0) >= 2000 && !tags.includes('Consumable') && !tags.includes('Trinket')) next.set(id, 'legendary');
      else if ((it.gold?.total ?? 0) > 0 && (it.gold?.total ?? 0) <= 500 && !(it.from?.length > 0) && !tags.includes('Trinket')) next.set(id, 'starter');
    }
    if (next.size > 50) kinds = next;
    console.log(`Item data loaded from Data Dragon ${versions[0]}`);
  } catch {
    console.warn('Could not load item data from Data Dragon; using the built-in item list for build stats.');
  }
}
