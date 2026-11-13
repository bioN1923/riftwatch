/**
 * Data Dragon's champion, summoner-spell, item and rune files cut down to what Riftwatch shows.
 * The raw files are about 910 kB (item.json alone is 680 kB, mostly stats, map flags and image
 * sprites we never use); the slim version is a fraction of that. Shared by the server, which serves
 * it from /api/static/:locale, and the client, which falls back to Data Dragon if that fails.
 */
export interface SlimStatic {
  version: string;
  champions: [number, { id: string; name: string; title: string; tags: string[] }][];
  spells: [number, { id: string; name: string; description: string }][];
  items: [number, { name: string; plaintext: string; gold: number; sell: number; description: string; from: number[]; into: number[] }][];
  runes: [number, { icon: string; name: string; desc: string }][];
  trees: { id: number; name: string; icon: string; slots: number[][] }[];
}

export const STATIC_LOCALES = new Set(['en_US', 'ro_RO', 'de_DE', 'fr_FR', 'es_ES', 'pl_PL', 'pt_BR']);

const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export function slimStatic(version: string, champ: any, spell: any, item: any, runes: any[]): SlimStatic {
  return {
    version,
    champions: Object.values<any>(champ.data).map((c) => [Number(c.key), { id: c.id, name: c.name, title: c.title, tags: c.tags ?? [] }]),
    spells: Object.values<any>(spell.data).map((s) => [Number(s.key), { id: s.id, name: s.name, description: s.description }]),
    items: Object.entries<any>(item.data).map(([id, it]) => [
      Number(id),
      {
        name: it.name,
        plaintext: it.plaintext || stripTags(it.description ?? '').slice(0, 140),
        gold: it.gold?.total ?? 0,
        sell: it.gold?.sell ?? 0,
        description: it.description ?? '',
        from: (it.from ?? []).map(Number),
        into: (it.into ?? []).map(Number),
      },
    ]),
    runes: runes.flatMap((style) => [
      [style.id, { icon: style.icon, name: style.name, desc: '' }] as [number, { icon: string; name: string; desc: string }],
      ...style.slots.flatMap((slot: any) => slot.runes.map((r: any) => [r.id, { icon: r.icon, name: r.name, desc: stripTags(r.shortDesc ?? '') }] as [number, { icon: string; name: string; desc: string }])),
    ]),
    trees: runes.map((style) => ({ id: style.id, name: style.name, icon: style.icon, slots: style.slots.map((sl: any) => sl.runes.map((r: any) => r.id)) })),
  };
}
