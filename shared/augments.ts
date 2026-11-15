/**
 * Arena augments from CommunityDragon, slimmed to what a match row shows: name, tier colour, icon
 * and a readable description. Riot's policy allows showing what a player picked; we never attach
 * win rates to augments.
 */
export interface SlimAugment {
  name: string;
  /** 0 silver, 1 gold, 2 prismatic; anything else has no tier label. */
  rarity: number;
  /** Path under https://raw.communitydragon.org/latest/game/ */
  icon: string;
  /** Plain text with numbers filled in, or '' when a value couldn't be worked out. */
  desc: string;
}

export const AUGMENT_ICON_BASE = 'https://raw.communitydragon.org/latest/game/';

const strip = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const round = (n: number) => (Math.abs(n) >= 10 ? Math.round(n) : Math.round(n * 100) / 100);

/** Fills @Name@ and @Name*100@ from dataValues (first rank); gives '' if any value is unknown. */
export function augmentText(desc: string, values: Record<string, number[]> | undefined): string {
  let unknown = false;
  const out = desc.replace(/@([^@]+)@/g, (_, tok: string) => {
    const m = /^([A-Za-z0-9_]+)(?:\*(-?[\d.]+))?$/.exec(tok);
    const v = m && values?.[m[1]];
    if (!m || !v || v.length === 0) {
      unknown = true;
      return '';
    }
    return String(round((v[1] ?? v[0]) * (m[2] ? Number(m[2]) : 1)));
  });
  return unknown ? '' : strip(out);
}

export function slimAugments(raw: { augments: any[] }): [number, SlimAugment][] {
  return raw.augments
    .filter((a) => typeof a.id === 'number' && a.name)
    .map((a) => [
      a.id,
      {
        name: strip(String(a.name)),
        rarity: Number(a.rarity) || 0,
        icon: String(a.iconSmall || a.iconLarge || '').toLowerCase(),
        desc: augmentText(String(a.desc || ''), a.dataValues),
      },
    ]);
}
