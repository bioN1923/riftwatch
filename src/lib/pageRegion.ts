import { getPlatform } from '../../shared/regions';

/**
 * The server a page is about: a profile's own region (/lol/eun1/…), the ladder's or multi-search's
 * ?region=, otherwise the visitor's search region.
 */
export function pageRegion(pathname: string, search: string, fallback: string) {
  const fromPath = /^\/lol\/([a-z0-9]+)\//.exec(pathname)?.[1];
  const fromQuery = /^\/(leaderboard|multisearch)/.test(pathname) ? new URLSearchParams(search).get('region') : null;
  return getPlatform(fromPath ?? fromQuery ?? '')?.id ?? fallback;
}
