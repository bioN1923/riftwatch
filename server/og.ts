/**
 * Link-preview images (Open Graph). Discord, WhatsApp, X and others show these when a
 * Riftwatch link is pasted. Each card is an SVG drawn here and rendered to PNG by resvg,
 * using the site's own fonts; game art is fetched from Data Dragon and embedded.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import jpeg from 'jpeg-js';

const here = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(here, 'assets', 'fonts');
const RANK_DIR = path.join(here, 'assets', 'ranks');
const fontFiles = fs.existsSync(FONT_DIR) ? fs.readdirSync(FONT_DIR).filter((f) => f.endsWith('.ttf')).map((f) => path.join(FONT_DIR, f)) : [];

export const W = 1200;
export const H = 630;
const C = { bg: '#091315', surface: '#0f1c1f', line: '#2b464b', text: '#e6efec', muted: '#8aa19e', faint: '#769591', gold: '#e0b45c', win: '#3fc495', loss: '#ef6b6b' };

/* ---------- Data Dragon: latest version and champion names ---------- */

interface Champ {
  key: number;
  id: string; // "MissFortune"
  name: string;
  title: string;
}
let version: string | null = null;
let champs: Champ[] = [];

export async function loadOgData() {
  try {
    const versions = (await (await fetch('https://ddragon.leagueoflegends.com/api/versions.json', { signal: AbortSignal.timeout(8000) })).json()) as string[];
    const data = (await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${versions[0]}/data/en_US/champion.json`, { signal: AbortSignal.timeout(8000) })).json()) as any;
    champs = Object.values<any>(data.data).map((c) => ({ key: Number(c.key), id: c.id, name: c.name, title: c.title }));
    version = versions[0];
  } catch {
    setTimeout(() => void loadOgData(), 10 * 60_000).unref();
  }
}
export const championBySlug = (slug: string) => champs.find((c) => c.id.toLowerCase() === slug.toLowerCase());
export const championByKey = (key: number) => champs.find((c) => c.key === key);
export const allChampions = () => champs;

/* ---------- Images ---------- */

const imageCache = new Map<string, string | null>();
async function image(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  if (imageCache.has(url)) return imageCache.get(url)!;
  let out: string | null = null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const type = res.headers.get('content-type') ?? (url.endsWith('.png') ? 'image/png' : 'image/jpeg');
      out = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
    }
  } catch {
    /* offline: the card is drawn without this picture */
  }
  if (imageCache.size > 300) imageCache.delete(imageCache.keys().next().value!);
  imageCache.set(url, out);
  return out;
}
const splash = (c: Champ) => image(`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${c.id}_0.jpg`);
const champIcon = (c: Champ) => (version ? image(`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.id}.png`) : Promise.resolve(null));
const profileIcon = (id?: number) => (version && id != null ? image(`https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${id}.png`) : Promise.resolve(null));
function emblem(tier?: string) {
  const file = tier ? path.join(RANK_DIR, `${tier.toLowerCase()}.png`) : '';
  return file && fs.existsSync(file) ? `data:image/png;base64,${fs.readFileSync(file).toString('base64')}` : null;
}

/* ---------- Drawing helpers ---------- */

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
/** Shrink a headline until it fits (Big Shoulders is narrow: ~0.48em per character). */
const fit = (text: string, max: number, width: number, per = 0.5) => Math.max(36, Math.min(max, Math.floor(width / Math.max(1, text.length * per))));
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function frame(inner: string, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="fadeR" x1="0" x2="1"><stop offset="0" stop-color="${C.bg}" stop-opacity="1"/><stop offset="0.45" stop-color="${C.bg}" stop-opacity="0.85"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0.15"/></linearGradient>
  <linearGradient id="fadeB" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="${C.bg}" stop-opacity="0"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0.95"/></linearGradient>
  ${defs}
</defs>
<rect width="${W}" height="${H}" fill="${C.bg}"/>
${inner}
<rect x="0" y="${H - 6}" width="${W}" height="6" fill="${C.gold}"/>
<g transform="translate(64 ${H - 74})">
  <path d="M16 4l10 5.8v12.4L16 28 6 22.2V9.8z" transform="scale(1.35)" fill="none" stroke="${C.gold}" stroke-width="2.4"/>
  <path d="M16 11l4.3 2.5v5L16 21l-4.3-2.5v-5z" transform="scale(1.35)" fill="${C.gold}"/>
  <text x="52" y="31" font-family="Big Shoulders Display" font-weight="800" font-size="34" fill="${C.text}">Riftwatch</text>
</g>
</svg>`;
}

/** SVG → JPEG. JPEG keeps cards with splash art around 100–200 KB; WhatsApp skips images over ~300 KB. */
function render(svg: string): Buffer {
  const img = new Resvg(svg, { fitTo: { mode: 'width', value: W }, background: C.bg, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Instrument Sans' } }).render();
  return jpeg.encode({ data: img.pixels, width: img.width, height: img.height }, 84).data;
}

const roundedImage = (href: string, x: number, y: number, size: number, r: number, id: string) =>
  `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}"/></clipPath><image href="${href}" x="${x}" y="${y}" width="${size}" height="${size}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>`;

/* ---------- Cards ---------- */

export interface ProfileCard {
  gameName: string;
  tagLine: string;
  platform: string; // "EUW"
  level?: number;
  profileIconId?: number;
  tier?: string;
  rank?: string;
  lp?: number;
  wins?: number;
  losses?: number;
}

export async function profileCard(p: ProfileCard) {
  const icon = await profileIcon(p.profileIconId);
  const em = emblem(p.tier);
  const apex = p.tier && ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(p.tier);
  const tierText = p.tier ? `${p.tier.charAt(0)}${p.tier.slice(1).toLowerCase()}${apex ? '' : ` ${p.rank ?? ''}`}` : 'Unranked';
  const nameSize = fit(p.gameName, 104, 640, 0.5);
  const games = (p.wins ?? 0) + (p.losses ?? 0);
  const inner = `
${em ? `<image href="${em}" x="740" y="40" width="440" height="440" opacity="0.10"/>` : ''}
<rect x="64" y="64" width="6" height="56" fill="${C.gold}"/>
<text x="86" y="104" font-family="Instrument Sans" font-weight="600" font-size="28" fill="${C.muted}">${esc(p.platform)} · League of Legends</text>
${icon ? roundedImage(icon, 64, 168, 176, 18, 'pi') : `<rect x="64" y="168" width="176" height="176" rx="18" fill="${C.surface}" stroke="${C.line}"/>`}
${p.level != null ? `<rect x="112" y="324" width="80" height="38" rx="6" fill="${C.bg}" stroke="${C.gold}" stroke-width="2"/><text x="152" y="352" text-anchor="middle" font-family="Big Shoulders Display" font-weight="700" font-size="26" fill="${C.gold}">${p.level}</text>` : ''}
<text x="276" y="${236 + nameSize * 0.35}" font-family="Big Shoulders Display" font-weight="800" font-size="${nameSize}" fill="${C.text}">${esc(p.gameName)}</text>
<text x="280" y="${236 + nameSize * 0.35 + 52}" font-family="Instrument Sans" font-weight="600" font-size="36" fill="${C.muted}">#${esc(p.tagLine)}</text>
${em ? `<image href="${em}" x="780" y="150" width="300" height="300"/>` : ''}
<text x="930" y="${em ? 486 : 300}" text-anchor="middle" font-family="Big Shoulders Display" font-weight="800" font-size="58" fill="${C.text}">${esc(tierText)}</text>
${p.lp != null && p.tier ? `<text x="930" y="${em ? 530 : 344}" text-anchor="middle" font-family="Instrument Sans" font-weight="600" font-size="28" fill="${C.gold}">${p.lp} LP${games ? ` · ${Math.round(((p.wins ?? 0) / games) * 100)}% WR` : ''}</text>` : ''}`;
  return render(frame(inner));
}

export interface ChampionCard {
  champion: Champ;
  role?: string;
  tier?: string;
  winRate?: number;
  games?: number;
  patch?: string | null;
}

export async function championCard(c: ChampionCard) {
  const art = await splash(c.champion);
  const icon = await champIcon(c.champion);
  const nameSize = fit(c.champion.name, 150, 620, 0.5);
  const stat = (x: number, label: string, value: string, color: string) =>
    `<text x="${x}" y="470" font-family="Instrument Sans" font-weight="600" font-size="24" fill="${C.muted}">${label}</text><text x="${x}" y="526" font-family="Big Shoulders Display" font-weight="800" font-size="60" fill="${color}">${esc(value)}</text>`;
  const inner = `
${art ? `<image href="${art}" x="300" y="0" width="900" height="${H}" preserveAspectRatio="xMidYMid slice" opacity="0.9"/>` : ''}
<rect width="${W}" height="${H}" fill="url(#fadeR)"/>
<rect width="${W}" height="${H}" fill="url(#fadeB)"/>
${icon ? roundedImage(icon, 64, 64, 92, 12, 'ci') : ''}
<text x="${icon ? 176 : 64}" y="104" font-family="Instrument Sans" font-weight="600" font-size="28" fill="${C.muted}">${esc(c.champion.title.replace(/^./, (s) => s.toUpperCase()))}</text>
<text x="${icon ? 176 : 64}" y="140" font-family="Instrument Sans" font-weight="600" font-size="24" fill="${C.gold}">Build · Runes · Counters${c.patch ? ` · Patch ${esc(c.patch)}` : ''}</text>
<text x="60" y="${250 + nameSize * 0.42}" font-family="Big Shoulders Display" font-weight="800" font-size="${nameSize}" fill="${C.text}">${esc(c.champion.name)}</text>
${c.winRate != null ? stat(64, 'Win rate', pct(c.winRate), c.winRate >= 0.5 ? C.win : C.loss) : ''}
${c.tier && c.tier !== '–' ? stat(300, 'Tier', c.tier, C.gold) : ''}
${c.role ? stat(470, 'Role', c.role, C.text) : ''}`;
  return render(frame(inner));
}

export interface MatchupCard {
  a: Champ;
  b: Champ;
  role?: string;
  winRate?: number;
  games?: number;
  verdict?: string;
}

export async function matchupCard(m: MatchupCard) {
  const [artA, artB] = await Promise.all([splash(m.a), splash(m.b)]);
  const [iconA, iconB] = await Promise.all([champIcon(m.a), champIcon(m.b)]);
  const title = `${m.a.name} vs ${m.b.name}`;
  const size = fit(title, 120, 1060, 0.47);
  const inner = `
<clipPath id="lh"><rect x="0" y="0" width="${W / 2}" height="${H}"/></clipPath>
<clipPath id="rh"><rect x="${W / 2}" y="0" width="${W / 2}" height="${H}"/></clipPath>
${artA ? `<image href="${artA}" x="-150" y="0" width="900" height="${H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#lh)" opacity="0.55"/>` : ''}
${artB ? `<image href="${artB}" x="450" y="0" width="900" height="${H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#rh)" opacity="0.55"/>` : ''}
<rect width="${W}" height="${H}" fill="${C.bg}" opacity="0.45"/>
<rect width="${W}" height="${H}" fill="url(#fadeB)"/>
<rect x="${W / 2 - 2}" y="0" width="4" height="150" fill="${C.gold}" opacity="0.8"/>
<rect x="${W / 2 - 2}" y="530" width="4" height="${H - 530}" fill="${C.gold}" opacity="0.8"/>
${iconA ? roundedImage(iconA, 64, 64, 96, 12, 'ia') : ''}
${iconB ? roundedImage(iconB, W - 160, 64, 96, 12, 'ib') : ''}
<text x="${W / 2}" y="210" text-anchor="middle" font-family="Instrument Sans" font-weight="600" font-size="28" fill="${C.muted}">${m.role ? `${esc(m.role)} lane · ` : ''}Build, runes and win rate</text>
<text x="${W / 2}" y="${300 + size * 0.3}" text-anchor="middle" font-family="Big Shoulders Display" font-weight="800" font-size="${size}" fill="${C.text}">${esc(title)}</text>
${m.verdict ? `<text x="${W / 2}" y="440" text-anchor="middle" font-family="Big Shoulders Display" font-weight="700" font-size="46" fill="${C.gold}">${esc(m.verdict)}</text>` : ''}
${m.winRate != null && m.games ? `<text x="${W / 2}" y="494" text-anchor="middle" font-family="Instrument Sans" font-weight="600" font-size="28" fill="${m.winRate >= 0.5 ? C.win : C.loss}">${esc(m.a.name)} wins ${pct(m.winRate)} over ${m.games} games</text>` : ''}`;
  return render(frame(inner));
}

export interface DraftCard {
  enemy: Champ;
  role: string; // "Mid"
  answers: { champion: Champ; winRate: number }[];
}

/** The draft helper's answer to one enemy laner: their splash on the right, the best picks into them on the left. */
export async function draftCard(d: DraftCard) {
  const art = await splash(d.enemy);
  const icons = await Promise.all(d.answers.slice(0, 4).map((x) => champIcon(x.champion)));
  const head = `Answers to ${d.enemy.name}`;
  const size = fit(head, 104, 700, 0.47);
  const picks = d.answers
    .slice(0, 4)
    .map((x, k) => {
      const cx = 64 + k * 168;
      return `${icons[k] ? roundedImage(icons[k]!, cx, 316, 120, 14, `da${k}`) : `<rect x="${cx}" y="316" width="120" height="120" rx="14" fill="${C.surface}" stroke="${C.line}"/>`}
<text x="${cx + 60}" y="474" text-anchor="middle" font-family="Instrument Sans" font-weight="600" font-size="24" fill="${C.text}">${esc(x.champion.name.length > 11 ? `${x.champion.name.slice(0, 10)}…` : x.champion.name)}</text>
<text x="${cx + 60}" y="512" text-anchor="middle" font-family="Big Shoulders Display" font-weight="800" font-size="36" fill="${x.winRate >= 0.5 ? C.win : C.loss}">${pct(x.winRate)}</text>`;
    })
    .join('');
  const inner = `
${art ? `<image href="${art}" x="420" y="0" width="780" height="${H}" preserveAspectRatio="xMidYMid slice" opacity="0.85"/>` : ''}
<rect width="${W}" height="${H}" fill="url(#fadeR)"/>
<rect width="${W}" height="${H}" fill="url(#fadeB)"/>
<rect x="64" y="64" width="6" height="56" fill="${C.gold}"/>
<text x="86" y="104" font-family="Instrument Sans" font-weight="600" font-size="28" fill="${C.muted}">Draft helper · ${esc(d.role)} lane</text>
<text x="60" y="${200 + size * 0.35}" font-family="Big Shoulders Display" font-weight="800" font-size="${size}" fill="${C.text}">${esc(head)}</text>
${d.answers.length ? picks : `<text x="64" y="400" font-family="Instrument Sans" font-weight="600" font-size="30" fill="${C.muted}">Best picks from real ranked games</text>`}`;
  return render(frame(inner));
}

export interface CompareSide {
  gameName: string;
  tagLine: string;
  platform: string;
  profileIconId?: number;
  tier?: string;
  rank?: string;
  lp?: number;
}

/** Two players side by side, as shared from the Compare page. */
export async function compareCard(a: CompareSide, b: CompareSide) {
  const [ia, ib] = await Promise.all([profileIcon(a.profileIconId), profileIcon(b.profileIconId)]);
  const side = (p: CompareSide, icon: string | null, cx: number, id: string) => {
    const apex = p.tier && ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(p.tier);
    const rank = p.tier ? `${p.tier.charAt(0)}${p.tier.slice(1).toLowerCase()}${apex ? '' : ` ${p.rank ?? ''}`}${p.lp != null ? ` · ${p.lp} LP` : ''}` : 'Unranked';
    const em = emblem(p.tier);
    const nameSize = fit(p.gameName, 72, 470, 0.5);
    return `${em ? `<image href="${em}" x="${cx - 190}" y="60" width="380" height="380" opacity="0.08"/>` : ''}
${icon ? roundedImage(icon, cx - 80, 96, 160, 18, id) : `<rect x="${cx - 80}" y="96" width="160" height="160" rx="18" fill="${C.surface}" stroke="${C.line}"/>`}
<text x="${cx}" y="${300 + nameSize * 0.7}" text-anchor="middle" font-family="Big Shoulders Display" font-weight="800" font-size="${nameSize}" fill="${C.text}">${esc(p.gameName)}</text>
<text x="${cx}" y="${300 + nameSize * 0.7 + 44}" text-anchor="middle" font-family="Instrument Sans" font-weight="600" font-size="28" fill="${C.muted}">#${esc(p.tagLine)} · ${esc(p.platform)}</text>
<text x="${cx}" y="${300 + nameSize * 0.7 + 96}" text-anchor="middle" font-family="Big Shoulders Display" font-weight="700" font-size="40" fill="${p.tier ? C.gold : C.muted}">${esc(rank)}</text>`;
  };
  const inner = `
${side(a, ia, 300, 'ca')}
${side(b, ib, 900, 'cb')}
<rect x="${W / 2 - 2}" y="60" width="4" height="120" fill="${C.gold}" opacity="0.7"/>
<rect x="${W / 2 - 2}" y="300" width="4" height="200" fill="${C.gold}" opacity="0.7"/>
<text x="${W / 2}" y="258" text-anchor="middle" font-family="Big Shoulders Display" font-weight="800" font-size="64" fill="${C.gold}">VS</text>`;
  return render(frame(inner));
}

export function siteCard() {
  const inner = `
<text x="64" y="250" font-family="Big Shoulders Display" font-weight="800" font-size="120" fill="${C.text}">Scout any summoner.</text>
<text x="68" y="320" font-family="Instrument Sans" font-weight="400" font-size="34" fill="${C.muted}">Rank, match history, champion builds, counters and live games.</text>`;
  return render(frame(inner));
}
