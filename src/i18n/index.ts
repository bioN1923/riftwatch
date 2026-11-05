import { Fragment, createElement, useSyncExternalStore, type ReactNode } from 'react';
import en from './en';

/**
 * Translations. English (en.ts) is the source and the fallback for anything missing.
 * `t('key', { name: 'Ahri', count: 3 })` fills {placeholders}; when `count` is given it
 * picks the plural form for the language (key_one, key_few, key_many, key_other).
 * Switching language reloads the app shell (see main.tsx), so plain t() calls stay current.
 */
export type Lang = 'en' | 'ro' | 'de' | 'fr' | 'es' | 'pl' | 'pt';

export const LANGS: { id: Lang; name: string; ddragon: string; intl: string }[] = [
  { id: 'en', name: 'English', ddragon: 'en_US', intl: 'en-GB' },
  { id: 'ro', name: 'Română', ddragon: 'ro_RO', intl: 'ro-RO' },
  { id: 'de', name: 'Deutsch', ddragon: 'de_DE', intl: 'de-DE' },
  { id: 'fr', name: 'Français', ddragon: 'fr_FR', intl: 'fr-FR' },
  { id: 'es', name: 'Español', ddragon: 'es_ES', intl: 'es-ES' },
  { id: 'pl', name: 'Polski', ddragon: 'pl_PL', intl: 'pl-PL' },
  { id: 'pt', name: 'Português (Brasil)', ddragon: 'pt_BR', intl: 'pt-BR' },
];

type Dict = Record<string, string>;
export type MessageKey = keyof typeof en;
type PluralBase = MessageKey extends infer K ? (K extends `${infer B}_other` ? B : never) : never;
type Vars = Record<string, string | number>;

const loaders: Record<Exclude<Lang, 'en'>, () => Promise<{ default: Dict }>> = {
  ro: () => import('./ro'),
  de: () => import('./de'),
  fr: () => import('./fr'),
  es: () => import('./es'),
  pl: () => import('./pl'),
  pt: () => import('./pt'),
};

const KEY = 'rw:lang';
let lang: Lang = 'en';
let dict: Dict = en;
const listeners = new Set<() => void>();

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY) as Lang | null;
    if (saved && LANGS.some((l) => l.id === saved)) return saved;
  } catch {
    /* storage blocked */
  }
  for (const pref of navigator.languages ?? [navigator.language]) {
    const code = pref.toLowerCase().split('-')[0] as Lang;
    if (LANGS.some((l) => l.id === code)) return code;
  }
  return 'en';
}

async function load(next: Lang) {
  dict = next === 'en' ? en : { ...en, ...(await loaders[next]()).default };
  lang = next;
  document.documentElement.lang = next === 'pt' ? 'pt-BR' : next;
  plurals = new Intl.PluralRules(langInfo().intl);
}

/** Called once before the first render. */
export async function initI18n() {
  try {
    await load(detect());
  } catch {
    await load('en');
  }
}

export async function setLang(next: Lang) {
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* storage blocked */
  }
  await load(next);
  listeners.forEach((l) => l());
}

export const getLang = () => lang;
export const langInfo = () => LANGS.find((l) => l.id === lang)!;
export const useLang = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => lang,
  );

let plurals = new Intl.PluralRules('en-GB');

function lookup(key: string, vars?: Vars) {
  if (vars && typeof vars.count === 'number') {
    const form = plurals.select(vars.count);
    const hit = dict[`${key}_${form}`] ?? dict[`${key}_other`];
    if (hit) return hit;
  }
  return dict[key] ?? key;
}

export function t(key: MessageKey | PluralBase, vars?: Vars): string {
  const msg = lookup(key, vars);
  if (!vars) return msg;
  return msg.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] == null ? m : typeof vars[k] === 'number' ? num(vars[k] as number) : String(vars[k])));
}

/** Like t(), but placeholders can be elements: t.rich('search.lookUp', { id: <strong>…</strong> }). */
t.rich = (key: MessageKey | PluralBase, vars: Record<string, ReactNode>): ReactNode => {
  const msg = lookup(key, typeof vars.count === 'number' ? (vars as Vars) : undefined);
  const parts = msg.split(/\{(\w+)\}/g);
  return createElement(
    Fragment,
    null,
    ...parts.map((p, i) => (i % 2 ? createElement(Fragment, { key: i }, typeof vars[p] === 'number' ? num(vars[p] as number) : (vars[p] ?? `{${p}}`)) : p)),
  );
};

const numFmt = new Map<string, Intl.NumberFormat>();
/** Whole numbers with the language's thousands separator. */
export function num(n: number) {
  const key = lang;
  let f = numFmt.get(key);
  if (!f) numFmt.set(key, (f = new Intl.NumberFormat(langInfo().intl, { maximumFractionDigits: 0 })));
  return Number.isInteger(n) ? f.format(n) : String(n);
}
