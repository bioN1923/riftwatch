/** The player's champion pool per role, as saved by the draft helper (slugs, comma-separated). Browser-only. */
export const POOL_KEY = 'rw:draft-pool';

function readAll(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(POOL_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

export function readPool(role: string) {
  return readAll()[role] ?? '';
}

export function savePool(role: string, slugs: string) {
  try {
    const all = readAll();
    all[role] = slugs;
    localStorage.setItem(POOL_KEY, JSON.stringify(all));
  } catch {
    /* storage blocked */
  }
}

/** Every role's pool as sets of champion slugs; roles with nothing saved are left out. */
export function readPools(): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const [role, slugs] of Object.entries(readAll())) {
    const set = new Set(slugs.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
    if (set.size) out.set(role, set);
  }
  return out;
}
