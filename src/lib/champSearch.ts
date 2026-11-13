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
