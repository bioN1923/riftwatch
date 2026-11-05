import type { Augment } from '../shared/types';

/**
 * Arena augments from CommunityDragon (Data Dragon doesn't carry them), in each site language.
 * Trimmed to what the site shows and cached for half a day.
 */
const LOCALES: Record<string, string> = { en: 'en_us', ro: 'ro_ro', de: 'de_de', fr: 'fr_fr', es: 'es_es', pl: 'pl_pl', pt: 'pt_br' };
const RARITY: Record<number, Augment['rarity']> = { 0: 'silver', 1: 'gold', 2: 'prismatic' };
const CDN = 'https://raw.communitydragon.org/latest';
const cache = new Map<string, { at: number; data: Promise<Augment[]> }>();

/** Fill @Value@ / @Value*100@ placeholders from the augment's data values and drop markup. */
export function augmentText(desc: string, values: Record<string, number[]> = {}) {
  const fmt = (n: number) => String(Math.round(n * 100) / 100);
  return desc
    .replace(/@([A-Za-z0-9_]+)(\*(-?[\d.]+))?@/g, (_, name: string, _m, mult?: string) => {
      const v = values[name]?.[1] ?? values[name]?.[0];
      return v == null ? '' : fmt(v * (mult ? Number(mult) : 1));
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/%i:[^%]*%/g, '')
    .replace(/&nbsp;/g, '\u00a0')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function load(lang: string): Promise<Augment[]> {
  const res = await fetch(`${CDN}/cdragon/arena/${LOCALES[lang] ?? 'en_us'}.json`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`CommunityDragon ${res.status}`);
  const json = (await res.json()) as { augments: any[] };
  return json.augments.map((a) => ({
    id: a.id,
    name: a.name,
    rarity: RARITY[a.rarity] ?? 'other',
    icon: `${CDN}/game/${String(a.iconLarge || a.iconSmall).toLowerCase()}`,
    desc: augmentText(a.desc ?? a.tooltip ?? '', a.dataValues),
  }));
}

export function augments(lang: string): Promise<Augment[]> {
  const key = LOCALES[lang] ? lang : 'en';
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 12 * 3600_000) return hit.data;
  const data = load(key).catch((e) => {
    cache.delete(key);
    throw e;
  });
  cache.set(key, { at: Date.now(), data });
  return data;
}
