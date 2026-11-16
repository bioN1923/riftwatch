/**
 * `placeholderData` for queries whose key changes with a filter (role, patch, queue…): keep showing
 * the previous result while the new one loads, so the page doesn't collapse to skeletons and back,
 * as long as the key parts at `same` (the subject: champion, player…) are unchanged. Pages dim the
 * kept result meanwhile (`isPlaceholderData`). A new subject starts fresh.
 */
export function keepWhile(key: readonly unknown[], ...same: number[]) {
  return <T>(prev: T | undefined, prevQuery?: { queryKey: readonly unknown[] }): T | undefined =>
    prevQuery && same.every((i) => prevQuery.queryKey[i] === key[i]) ? prev : undefined;
}
