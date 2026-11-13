import { useSyncExternalStore } from 'react';

/** Small localStorage-backed stores. Every access is guarded: storage can be unavailable (private mode). */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function createStore<T>(key: string, fallback: T) {
  let value = read(key, fallback);
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: T | ((prev: T) => T)) {
      value = typeof next === 'function' ? (next as (p: T) => T)(value) : next;
      write(key, value);
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

function useStore<T>(store: ReturnType<typeof createStore<T>>) {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export interface SavedPlayer {
  platform: string;
  gameName: string;
  tagLine: string;
  profileIconId?: number;
  tier?: string;
  rank?: string;
}

const samePlayer = (a: SavedPlayer, b: SavedPlayer) =>
  a.platform === b.platform && a.gameName.toLowerCase() === b.gameName.toLowerCase() && a.tagLine.toLowerCase() === b.tagLine.toLowerCase();

const recentStore = createStore<SavedPlayer[]>('rw:recent', []);
const favoriteStore = createStore<SavedPlayer[]>('rw:favorites', []);
const regionStore = createStore<string>('rw:region', 'euw1');

export const useRecent = () => useStore(recentStore);

/** Multi-search lobbies the visitor ran, newest first (player slugs "Name-TAG"), kept in this browser. */
export interface SavedLobby {
  region: string;
  players: string[];
}
const lobbyStore = createStore<SavedLobby[]>('rw:lobbies', []);
export const useLobbies = () => useStore(lobbyStore);
export const getLobbies = () => lobbyStore.get();
const lobbyKey = (l: SavedLobby) => `${l.region}:${l.players.map((p) => p.toLowerCase()).sort().join(',')}`;
export function addLobby(l: SavedLobby) {
  if (!l.players.length) return;
  lobbyStore.set((list) => [l, ...list.filter((x) => lobbyKey(x) !== lobbyKey(l))].slice(0, 3));
}
export function clearLobbies() {
  lobbyStore.set([]);
}
export const useFavorites = () => useStore(favoriteStore);
export const getFavorites = () => favoriteStore.get();
export const useRegion = () => [useStore(regionStore), regionStore.set] as const;

export function addRecent(p: SavedPlayer) {
  recentStore.set((list) => [p, ...list.filter((x) => !samePlayer(x, p))].slice(0, 8));
  // A favourite keeps the rank and icon it had when it was starred; refresh them on every visit
  // so Favorites and Recently viewed never disagree about the same player.
  favoriteStore.set((list) => (list.some((x) => samePlayer(x, p)) ? list.map((x) => (samePlayer(x, p) ? { ...x, ...p } : x)) : list));
}
export function removeRecent(p: SavedPlayer) {
  recentStore.set((list) => list.filter((x) => !samePlayer(x, p)));
}
export function isFavorite(list: SavedPlayer[], p: SavedPlayer) {
  return list.some((x) => samePlayer(x, p));
}
export function toggleFavorite(p: SavedPlayer) {
  favoriteStore.set((list) => (list.some((x) => samePlayer(x, p)) ? list.filter((x) => !samePlayer(x, p)) : [p, ...list].slice(0, 12)));
}

/** The newest "What's new" version this visitor has seen ("" until their first visit). */
const seenStore = createStore<string>('rw:seen-version', '');
export const useSeenVersion = () => useStore(seenStore);
export const getSeenVersion = () => seenStore.get();
export const setSeenVersion = (v: string) => seenStore.set(v);

/* Theme: "system" follows the OS; the explicit choices persist. */
export type Theme = 'system' | 'light' | 'dark';
const themeStore = createStore<Theme>('rw:theme-choice', 'system');
export const useTheme = () => [useStore(themeStore), setTheme] as const;
export function setTheme(t: Theme) {
  themeStore.set(t);
  try {
    if (t === 'system') localStorage.removeItem('rw:theme');
    else localStorage.setItem('rw:theme', t);
  } catch {
    /* ignore */
  }
  if (t === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

