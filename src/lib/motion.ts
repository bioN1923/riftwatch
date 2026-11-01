import type { SyntheticEvent } from 'react';

/**
 * Spread onto an <img> so it fades in once loaded instead of popping in.
 * 'splash' also settles big artwork from a slight zoom and blur (see index.css).
 */
export function fadeIn(kind: 'icon' | 'splash' = 'icon') {
  return {
    'data-fade': kind,
    onLoad: (e: SyntheticEvent<HTMLImageElement>) => e.currentTarget.setAttribute('data-loaded', ''),
  };
}
