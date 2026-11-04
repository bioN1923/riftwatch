import { useQuery } from '@tanstack/react-query';

/** Static game data from Riot's Data Dragon CDN, always on the latest patch. */
const CDN = 'https://ddragon.leagueoflegends.com/cdn';

export interface StaticData {
  version: string;
  champions: Map<number, { id: string; name: string; title: string; tags: string[] }>;
  spells: Map<number, { id: string; name: string; description: string }>;
  items: Map<number, ItemData>;
  runes: Map<number, { icon: string; name: string; desc: string }>;
  trees: { id: number; name: string; icon: string; slots: number[][] }[];
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Data Dragon request failed (${res.status})`);
  return res.json();
}

export interface ItemData {
  name: string;
  plaintext: string;
  gold: number;
  sell: number;
  description: string; // Riot's tagged markup; see lib/itemText.ts
  from: number[];
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function loadStatic(): Promise<StaticData> {
  const [version] = await getJson<string[]>('https://ddragon.leagueoflegends.com/api/versions.json');
  const base = `${CDN}/${version}/data/en_US`;
  const [champ, spell, item, runes] = await Promise.all([
    getJson<any>(`${base}/champion.json`),
    getJson<any>(`${base}/summoner.json`),
    getJson<any>(`${base}/item.json`),
    getJson<any[]>(`${base}/runesReforged.json`),
  ]);

  const champions = new Map<number, { id: string; name: string; title: string; tags: string[] }>();
  for (const c of Object.values<any>(champ.data)) champions.set(Number(c.key), { id: c.id, name: c.name, title: c.title, tags: c.tags ?? [] });

  const spells = new Map<number, { id: string; name: string; description: string }>();
  for (const s of Object.values<any>(spell.data)) spells.set(Number(s.key), { id: s.id, name: s.name, description: s.description });

  const items = new Map<number, ItemData>();
  for (const [id, it] of Object.entries<any>(item.data)) {
    items.set(Number(id), {
      name: it.name,
      plaintext: it.plaintext || stripTags(it.description ?? '').slice(0, 140),
      gold: it.gold?.total ?? 0,
      sell: it.gold?.sell ?? 0,
      description: it.description ?? '',
      from: (it.from ?? []).map(Number),
    });
  }

  const runeMap = new Map<number, { icon: string; name: string; desc: string }>();
  const trees = runes.map((style) => ({ id: style.id, name: style.name, icon: style.icon, slots: style.slots.map((sl: any) => sl.runes.map((r: any) => r.id)) }));
  for (const style of runes) {
    runeMap.set(style.id, { icon: style.icon, name: style.name, desc: '' });
    for (const slot of style.slots) for (const r of slot.runes) runeMap.set(r.id, { icon: r.icon, name: r.name, desc: stripTags(r.shortDesc ?? '') });
  }

  return { version, champions, spells, items, runes: runeMap, trees };
}

export function useStaticData() {
  return useQuery({ queryKey: ['ddragon'], queryFn: loadStatic, staleTime: 6 * 60 * 60 * 1000, gcTime: Infinity, retry: 2 });
}

/** Asset URL helpers. They return undefined until static data has loaded, so images show a placeholder. */
export function assets(d: StaticData | undefined) {
  const v = d?.version;
  return {
    champion(id: number) {
      const c = d?.champions.get(id);
      return { url: c && v ? `${CDN}/${v}/img/champion/${c.id}.png` : undefined, name: c?.name ?? 'Unknown champion' };
    },
    spell(id: number) {
      const s = d?.spells.get(id);
      return { url: s && v ? `${CDN}/${v}/img/spell/${s.id}.png` : undefined, name: s?.name ?? '', description: s ? stripTags(s.description) : '' };
    },
    item(id: number) {
      const it = d?.items.get(id);
      return { url: id && v ? `${CDN}/${v}/img/item/${id}.png` : undefined, name: it?.name ?? '', plaintext: it?.plaintext ?? '', gold: it?.gold ?? 0 };
    },
    rune(id: number) {
      const r = d?.runes.get(id);
      return { url: r ? `${CDN}/img/${r.icon}` : undefined, name: r?.name ?? '', desc: r?.desc ?? '' };
    },
    /** Centered splash art, used as the backdrop of each match card. */
    splash(id: number) {
      const c = d?.champions.get(id);
      return c ? `${CDN}/img/champion/centered/${c.id}_0.jpg` : undefined;
    },
    /** Full-width splash, for the champion page hero. */
    fullSplash(id: number) {
      const c = d?.champions.get(id);
      return c ? `${CDN}/img/champion/splash/${c.id}_0.jpg` : undefined;
    },
    map: v ? `${CDN}/${v}/img/map/map11.png` : undefined,
    profileIcon(id: number) {
      return v ? `${CDN}/${v}/img/profileicon/${id}.png` : undefined;
    },
  };
}

export const rankEmblem = (tier: string) => `/ranks/${tier.toLowerCase()}.webp`;

/** Stat shards aren't in runesReforged.json; these are their names. */
export const SHARDS: Record<number, string> = {
  5008: 'Adaptive Force',
  5005: 'Attack Speed',
  5007: 'Ability Haste',
  5010: 'Move Speed',
  5001: 'Health Scaling',
  5011: 'Health',
  5013: 'Tenacity and Slow Resist',
  5002: 'Armor',
  5003: 'Magic Resist',
};

/** Stat shards ("the little runes"): the in-game grid, one pick per row. Not in Data Dragon's rune file. */
const SHARD_ICON = 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/StatMods/';
export const SHARD_INFO: Record<number, { name: string; desc: string; icon: string }> = {
  5008: { name: 'Adaptive Force', desc: '+9 Adaptive Force', icon: 'StatModsAdaptiveForceIcon.png' },
  5005: { name: 'Attack Speed', desc: '+10% Attack Speed', icon: 'StatModsAttackSpeedIcon.png' },
  5007: { name: 'Ability Haste', desc: '+8 Ability Haste', icon: 'StatModsCDRScalingIcon.png' },
  5010: { name: 'Move Speed', desc: '+2.5% Move Speed', icon: 'StatModsMovementSpeedIcon.png' },
  5001: { name: 'Health Scaling', desc: '+10–180 Health (based on level)', icon: 'StatModsHealthPlusIcon.png' },
  5011: { name: 'Health', desc: '+65 Health', icon: 'StatModsHealthScalingIcon.png' },
  5013: { name: 'Tenacity and Slow Resist', desc: '+15% Tenacity and Slow Resist', icon: 'StatModsTenacityIcon.png' },
  5002: { name: 'Armor', desc: '+6 Armor', icon: 'StatModsArmorIcon.png' },
  5003: { name: 'Magic Resist', desc: '+8 Magic Resist', icon: 'StatModsMagicResIcon.png' },
  5012: { name: 'Resist Scaling', desc: '+1–8 Armor and Magic Resist (based on level)', icon: 'StatModsAdaptiveForceScalingIcon.png' },
};
export const shardIcon = (id: number) => (SHARD_INFO[id] ? SHARD_ICON + SHARD_INFO[id].icon : undefined);
export const SHARD_ROWS: { label: string; ids: number[] }[] = [
  { label: 'Offense', ids: [5008, 5005, 5007] },
  { label: 'Flex', ids: [5008, 5010, 5001] },
  { label: 'Defense', ids: [5011, 5013, 5001] },
];

export interface ChampionDetail {
  id: string;
  name: string;
  title: string;
  blurb: string;
  tags: string[];
  info: { attack: number; defense: number; magic: number; difficulty: number };
  stats: Record<string, number>;
  partype: string;
  passive: { name: string; description: string; icon: string };
  spells: { key: string; name: string; description: string; cooldown: string; icon: string }[];
}

/** Per-champion Data Dragon file: abilities, base stats, lore. */
export function useChampionDetail(sd: StaticData | undefined, championId: number | undefined) {
  const c = championId != null ? sd?.champions.get(championId) : undefined;
  return useQuery({
    queryKey: ['ddragon-champion', sd?.version, c?.id],
    enabled: !!c && !!sd,
    staleTime: Infinity,
    queryFn: async (): Promise<ChampionDetail> => {
      const raw = await getJson<any>(`${CDN}/${sd!.version}/data/en_US/champion/${c!.id}.json`);
      const ch = raw.data[c!.id];
      return {
        id: ch.id,
        name: ch.name,
        title: ch.title,
        blurb: ch.blurb ?? '',
        tags: ch.tags ?? [],
        info: ch.info,
        stats: ch.stats,
        partype: ch.partype,
        passive: { name: ch.passive.name, description: stripTags(ch.passive.description), icon: `${CDN}/${sd!.version}/img/passive/${ch.passive.image.full}` },
        spells: ch.spells.map((sp: any, i: number) => ({
          key: 'QWER'[i],
          name: sp.name,
          description: stripTags(sp.description),
          cooldown: sp.cooldownBurn,
          icon: `${CDN}/${sd!.version}/img/spell/${sp.image.full}`,
        })),
      };
    },
  });
}

/** URL slug for a champion, e.g. "MissFortune" → "missfortune". */
export const champSlug = (id: string) => id.toLowerCase();
export function championBySlug(sd: StaticData | undefined, slug: string) {
  if (!sd) return undefined;
  for (const [key, c] of sd.champions) if (c.id.toLowerCase() === slug.toLowerCase()) return { key, ...c };
  return undefined;
}
