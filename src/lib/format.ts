import { getLang, langInfo, num, t } from '../i18n';

const cache = new Map<string, Intl.RelativeTimeFormat | Intl.NumberFormat>();
function fmt<T extends Intl.RelativeTimeFormat | Intl.NumberFormat>(kind: string, make: (locale: string) => T): T {
  const key = `${getLang()}:${kind}`;
  let f = cache.get(key) as T | undefined;
  if (!f) cache.set(key, (f = make(langInfo().intl)));
  return f;
}

export function timeAgo(ts: number, now = Date.now()) {
  const rtf = fmt('rtf', (l) => new Intl.RelativeTimeFormat(l, { numeric: 'auto' }));
  const s = Math.round((ts - now) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return t('time.justNow');
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(s / 86400), 'day');
  if (abs < 86400 * 365) return rtf.format(Math.round(s / (86400 * 30)), 'month');
  return rtf.format(Math.round(s / (86400 * 365)), 'year');
}

export function duration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function kdaRatio(k: number, d: number, a: number) {
  return d === 0 ? Infinity : (k + a) / d;
}

export function formatKda(ratio: number) {
  return ratio === Infinity ? t('kda.perfect') : ratio.toFixed(2);
}

/** Colour scale used by op.gg/u.gg: orange for 5+, blue for 4+, teal for 3+, neutral below. */
export function kdaTone(ratio: number) {
  if (ratio >= 5) return 'text-kda-great';
  if (ratio >= 4) return 'text-kda-good';
  if (ratio >= 3) return 'text-kda-ok';
  return 'text-muted';
}

export function winRateTone(wr: number) {
  if (wr >= 0.6) return 'text-kda-great';
  if (wr >= 0.5) return 'text-win';
  return 'text-muted';
}

/** Percentages in the language's style (50.3% / 50,3 %). */
export const pct = (x: number, digits = 0) =>
  fmt(`pct${digits}`, (l) => new Intl.NumberFormat(l, { style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits })).format(x);

export const compact = (n: number) => fmt('compact', (l) => new Intl.NumberFormat(l, { notation: 'compact', maximumFractionDigits: 1 })).format(n);
export const thousands = (n: number) => num(Math.round(n));

/** Champion class (Data Dragon keeps these in English): "Mage" → "Mag". */
const CLASSES = ['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'];
export const champClass = (tag: string) => (CLASSES.includes(tag) ? t(`class.${tag}` as 'class.Mage') : tag);

/** Server name in the current language: "euw1" → "Europe West". */
export const regionName = (id: string) => t(`region.${id}` as 'region.euw1');

/** Ranked tier in the current language: "GOLD" → "Gold". */
export const tierName = (tier?: string) => (tier ? t(`tier.${tier.toUpperCase()}` as 'tier.GOLD') : t('tier.UNRANKED'));

export function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export const multikill = (n: number) => (n >= 5 ? t('multikill.5') : n === 4 ? t('multikill.4') : n === 3 ? t('multikill.3') : n === 2 ? t('multikill.2') : '');
