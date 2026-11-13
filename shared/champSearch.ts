/**
 * Champion search that understands how players actually type: nicknames and initials ("mf",
 * "tf", "j4", "asol"), punctuation and accents ("kaisa", "chogath", "nunu"), and part of a name.
 */
export const squash = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');

/** Nicknames that neither start nor appear inside the champion's name. Keyed by Data Dragon id. */
const NICKNAMES: Record<string, string[]> = {
  MissFortune: ['mf'],
  TwistedFate: ['tf'],
  JarvanIV: ['j4'],
  Leblanc: ['lb'],
  Warwick: ['ww'],
  Gangplank: ['gp'],
  TahmKench: ['tk'],
  AurelionSol: ['asol'],
  Naafiri: ['naf'],
  Heimerdinger: ['donger'],
  MasterYi: ['yi'],
  Soraka: ['raka'],
  Amumu: ['mumu'],
  DrMundo: ['mundo'],
  KSante: ['ks'],
  Belveth: ['bv'],
  KogMaw: ['kog'],
  MonkeyKing: ['wu', 'wukong'],
  XinZhao: ['xin'],
  LeeSin: ['lee'],
  Cassiopeia: ['cass'],
  Kassadin: ['kass'],
  Mordekaiser: ['morde'],
  Fiddlesticks: ['fid', 'fiddle'],
  Tryndamere: ['trynd'],
  Seraphine: ['sera'],
  Nautilus: ['naut'],
  Blitzcrank: ['blitz'],
  Velkoz: ['vel'],
};

/** 0 = nickname or exact name, 1 = name starts with it, 2 = name contains it, null = no match. */
export function champHit(query: string, c: { id: string; name: string }): 0 | 1 | 2 | null {
  const q = squash(query);
  if (!q) return null;
  const name = squash(c.name);
  const id = squash(c.id);
  if (name === q || id === q || NICKNAMES[c.id]?.includes(q)) return 0;
  if (name.startsWith(q) || id.startsWith(q)) return 1;
  if (name.includes(q) || id.includes(q)) return 2;
  return null;
}

/** Edit distance with adjacent swaps ("yasou" → "yasuo" is 1). */
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

/**
 * The champion a mistyped address most likely meant. `sure` when there is no doubt (a nickname such
 * as "mf", the name written another way such as "miss-fortune", or the only name starting with it),
 * so the page can just go there; otherwise one clear near-miss ("yasou") to offer as "Did you mean".
 */
export function guessChampion<C extends { id: string; name: string }>(slug: string, champs: C[]): { champ: C; sure: boolean } | null {
  let q: string;
  try {
    q = squash(decodeURIComponent(slug));
  } catch {
    q = squash(slug);
  }
  if (!q) return null;
  const exact = champs.find((c) => champHit(q, c) === 0);
  if (exact) return { champ: exact, sure: true };
  const starts = champs.filter((c) => champHit(q, c) === 1);
  if (starts.length === 1 && q.length >= 3) return { champ: starts[0], sure: true };
  const limit = Math.max(1, Math.floor(q.length / 4));
  let best: C | null = null;
  let bestD = Infinity;
  let tie = false;
  for (const c of champs) {
    const dd = Math.min(distance(q, squash(c.name)), distance(q, squash(c.id)));
    if (dd < bestD) [best, bestD, tie] = [c, dd, false];
    else if (dd === bestD && c !== best) tie = true;
  }
  return best && bestD <= limit && !tie ? { champ: best, sure: false } : null;
}

/**
 * The real address for "/champions/<a>" or "/champions/<a>/vs/<b>" when every champion in it can be
 * guessed without doubt and the address isn't already right; null otherwise (including before the
 * champion list has loaded). `search` is kept as is ("?role=BOTTOM").
 */
export function champAddressFix(path: string, search: string, champs: { id: string; name: string }[]): string | null {
  const m = /^\/champions\/([^/]+)(?:\/vs\/([^/]+))?\/?$/i.exec(path);
  if (!m || champs.length === 0) return null;
  const sides = [m[1], m[2]].filter((x): x is string => !!x);
  const exact = (s: string) => champs.find((c) => c.id.toLowerCase() === s.toLowerCase());
  if (sides.every(exact)) return null;
  const ids: string[] = [];
  for (const s of sides) {
    const g = exact(s) ? { champ: exact(s)!, sure: true } : guessChampion(s, champs);
    if (!g?.sure) return null;
    ids.push(g.champ.id.toLowerCase());
  }
  if (ids.length === 2 && ids[0] === ids[1]) return null;
  return `/champions/${ids.join('/vs/')}${search}`;
}
