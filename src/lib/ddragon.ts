import { useQuery } from '@tanstack/react-query';
import { langInfo, t } from '../i18n';
import { slimStatic, type SlimStatic } from '../../shared/staticSlim';
import { CHANGELOG } from '../data/changelog';

/** Static game data from Riot's Data Dragon CDN, always on the latest patch. */
const CDN = 'https://ddragon.leagueoflegends.com/cdn';

export interface StaticData {
  version: string;
  champions: Map<number, { id: string; name: string; title: string; tags: string[]; dmg?: [number, number] }>;
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
  into: number[];
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function fromSlim(d: SlimStatic): StaticData {
  return { version: d.version, champions: new Map(d.champions), spells: new Map(d.spells), items: new Map(d.items), runes: new Map(d.runes), trees: d.trees };
}

/** The slim copy from our server (one small, cached, compressed file); Data Dragon directly if that fails. */
async function loadStatic(locale: string): Promise<StaticData> {
  try {
    // The release in the address, so a new deploy (which may add fields) isn't hidden behind the
    // browser's cached copy from the last one. The server ignores it.
    return fromSlim(await getJson<SlimStatic>(`/api/static/${locale}?v=${CHANGELOG[0].version}`));
  } catch {
    const [version] = await getJson<string[]>('https://ddragon.leagueoflegends.com/api/versions.json');
    const base = `${CDN}/${version}/data/${locale}`;
    const [champ, spell, item, runes] = await Promise.all([
      getJson<any>(`${base}/champion.json`),
      getJson<any>(`${base}/summoner.json`),
      getJson<any>(`${base}/item.json`),
      getJson<any[]>(`${base}/runesReforged.json`),
    ]);
    return fromSlim(slimStatic(version, champ, spell, item, runes));
  }
}

export function useStaticData() {
  // Names, item and rune texts come in the site's language (Riot translates Data Dragon).
  const locale = langInfo().ddragon;
  return useQuery({ queryKey: ['ddragon', locale], queryFn: () => loadStatic(locale), staleTime: 6 * 60 * 60 * 1000, gcTime: Infinity, retry: 2 });
}

/** Asset URL helpers. They return undefined until static data has loaded, so images show a placeholder. */
export function assets(d: StaticData | undefined) {
  const v = d?.version;
  return {
    champion(id: number) {
      const c = d?.champions.get(id);
      return { url: c && v ? `${CDN}/${v}/img/champion/${c.id}.png` : undefined, name: c?.name ?? t('champion.unknown') };
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


/** Stat shards ("the little runes"): the in-game grid, one pick per row. Not in Data Dragon's rune file. */
const SHARD_ICON = 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/StatMods/';
const SHARD_ICONS: Record<number, string> = {
  5008: 'StatModsAdaptiveForceIcon.png',
  5005: 'StatModsAttackSpeedIcon.png',
  5007: 'StatModsCDRScalingIcon.png',
  5010: 'StatModsMovementSpeedIcon.png',
  5001: 'StatModsHealthPlusIcon.png',
  5011: 'StatModsHealthScalingIcon.png',
  5013: 'StatModsTenacityIcon.png',
  5002: 'StatModsArmorIcon.png',
  5003: 'StatModsMagicResIcon.png',
  5012: 'StatModsAdaptiveForceScalingIcon.png',
};
/** Name and bonus of each shard in the current language, plus its icon file. */
export const SHARD_INFO: Record<number, { name: string; desc: string; icon: string }> = Object.fromEntries(
  Object.entries(SHARD_ICONS).map(([id, icon]) => [
    id,
    {
      icon,
      get name() {
        return t(`shard.${id}.name` as 'shard.5008.name');
      },
      get desc() {
        return t(`shard.${id}.desc` as 'shard.5008.desc');
      },
    },
  ]),
);
export const shardIcon = (id: number) => (SHARD_INFO[id] ? SHARD_ICON + SHARD_INFO[id].icon : undefined);
export const SHARD_ROWS: { label: string; ids: number[] }[] = [
  { get label() { return t('shard.row.offense'); }, ids: [5008, 5005, 5007] },
  { get label() { return t('shard.row.flex'); }, ids: [5008, 5010, 5001] },
  { get label() { return t('shard.row.defense'); }, ids: [5011, 5013, 5001] },
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
    queryKey: ['ddragon-champion', sd?.version, c?.id, langInfo().ddragon],
    enabled: !!c && !!sd,
    staleTime: Infinity,
    queryFn: async (): Promise<ChampionDetail> => {
      const raw = await getJson<any>(`${CDN}/${sd!.version}/data/${langInfo().ddragon}/champion/${c!.id}.json`);
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
/** Link to a lane matchup page, e.g. /champions/ahri/vs/zed?role=MIDDLE. */
export function matchupPath(sd: StaticData | undefined, championId: number, opponentId: number, role?: string) {
  const a = sd?.champions.get(championId)?.id;
  const b = sd?.champions.get(opponentId)?.id;
  if (!a || !b) return '#';
  return `/champions/${champSlug(a)}/vs/${champSlug(b)}${role && role !== 'ALL' ? `?role=${role}` : ''}`;
}
export function championBySlug(sd: StaticData | undefined, slug: string) {
  if (!sd) return undefined;
  for (const [key, c] of sd.champions) if (c.id.toLowerCase() === slug.toLowerCase()) return { key, ...c };
  return undefined;
}

/** A finished item: expensive and not a component of anything else (boots excluded by price). */
export const isCompletedItem = (sd: StaticData | undefined, id: number) => {
  const it = sd?.items.get(id);
  return !!it && it.gold >= 2000 && it.into.length === 0;
};
