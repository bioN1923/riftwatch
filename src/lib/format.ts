const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function timeAgo(ts: number, now = Date.now()) {
  const s = Math.round((ts - now) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return 'just now';
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
  return ratio === Infinity ? 'Perfect' : ratio.toFixed(2);
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

export const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;

const compactFmt = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
export const compact = (n: number) => compactFmt.format(n);
export const thousands = (n: number) => n.toLocaleString('en');

export function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export const MULTIKILL: Record<number, string> = { 2: 'Double kill', 3: 'Triple kill', 4: 'Quadra kill', 5: 'Penta kill' };
