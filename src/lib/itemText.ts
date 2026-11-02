/**
 * Turns Data Dragon's item description markup into structured parts:
 *   <mainText><stats><attention>75</attention> Attack Damage<br>…</stats><br><br>
 *   <passive>Carve</passive><br>Dealing <physicalDamage>physical damage</physicalDamage> …</mainText>
 */
export type Tone = 'phys' | 'magic' | 'true' | 'heal' | 'shield' | 'speed' | 'key' | 'muted';
export interface Seg {
  text: string;
  tone?: Tone;
}
export interface ItemEffect {
  kind: 'passive' | 'active' | 'text';
  name?: string;
  segs: Seg[];
}
export interface ParsedItem {
  stats: { value: string; name: string }[];
  effects: ItemEffect[];
}

const TONES: Record<string, Tone> = {
  physicaldamage: 'phys',
  magicdamage: 'magic',
  truedamage: 'true',
  healing: 'heal',
  lifesteal: 'heal',
  omnivamp: 'heal',
  shield: 'shield',
  speed: 'speed',
  keyword: 'key',
  keywordmajor: 'key',
  keywordstealth: 'key',
  status: 'key',
  onhit: 'key',
  attention: 'key',
  scalelevel: 'muted',
  scalemana: 'muted',
  scalehealth: 'muted',
  scalearmor: 'muted',
  scalemr: 'muted',
  scalead: 'muted',
  scaleap: 'muted',
  rules: 'muted',
  flavortext: 'muted',
};

const decode = (s: string) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const strip = (s: string) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const BR = /<br\s*\/?>/gi;

/** Text with inline tags → coloured segments; <br> becomes a line break. */
export function segments(html: string): Seg[] {
  const out: Seg[] = [];
  const stack: Tone[] = [];
  const push = (text: string) => {
    if (!text) return;
    const tone = stack[stack.length - 1];
    const last = out[out.length - 1];
    if (last && last.tone === tone) last.text += text;
    else out.push(tone ? { text, tone } : { text });
  };
  const re = /<(\/?)([a-zA-Z]+)[^>]*>/g;
  let at = 0;
  for (let m: RegExpExecArray | null; (m = re.exec(html)); ) {
    push(decode(html.slice(at, m.index)).replace(/\s+/g, ' '));
    at = re.lastIndex;
    const tag = m[2].toLowerCase();
    if (tag === 'br') push('\n');
    else if (TONES[tag]) {
      if (m[1]) stack.pop();
      else stack.push(TONES[tag]);
    }
  }
  push(decode(html.slice(at)).replace(/\s+/g, ' '));
  // Tidy: trim the ends and collapse spaces around line breaks.
  const text = out.map((s) => s.text).join('');
  if (!text.trim()) return [];
  if (out.length) {
    out[0].text = out[0].text.replace(/^[\s\n]+/, '');
    out[out.length - 1].text = out[out.length - 1].text.replace(/[\s\n]+$/, '');
  }
  for (const s of out) s.text = s.text.replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n');
  return out.filter((s) => s.text);
}

export function parseItem(description: string): ParsedItem {
  const html = description.replace(/<\/?mainText>/gi, '');
  const stats: ParsedItem['stats'] = [];
  const statBlock = /<stats>([\s\S]*?)<\/stats>/i.exec(html);
  if (statBlock) {
    for (const line of statBlock[1].split(BR)) {
      const value = /<attention>([\s\S]*?)<\/attention>/i.exec(line);
      const name = strip(line.replace(/<attention>[\s\S]*?<\/attention>/i, ''));
      if (value && name) stats.push({ value: strip(value[1]), name });
      else if (strip(line)) stats.push({ value: '', name: strip(line) });
    }
  }
  const rest = statBlock ? html.slice(statBlock.index + statBlock[0].length) : html;
  const effects: ItemEffect[] = [];
  // Effects are separated by blank lines (two or more <br>).
  for (const block of rest.split(/(?:<br\s*\/?>\s*){2,}/i)) {
    if (!strip(block)) continue;
    const head = /^\s*<(passive|active)>([\s\S]*?)<\/\1>\s*(?:<br\s*\/?>)?/i.exec(block);
    if (head) {
      effects.push({ kind: head[1].toLowerCase() as 'passive' | 'active', name: strip(head[2]), segs: segments(block.slice(head[0].length)) });
    } else {
      effects.push({ kind: 'text', segs: segments(block) });
    }
  }
  return { stats, effects };
}
