import { useQuery } from '@tanstack/react-query';
import { langInfo } from '../i18n';
import { AUGMENT_ICON_BASE, type SlimAugment } from '../../shared/augments';

export interface Augment extends SlimAugment {
  url: string;
}

/** Arena augment names and icons, only fetched once an Arena game is on screen. */
export function useAugments(enabled: boolean) {
  const locale = langInfo().ddragon;
  return useQuery({
    queryKey: ['augments', locale],
    enabled,
    staleTime: 6 * 60 * 60_000,
    gcTime: Infinity,
    retry: 1,
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/augments/${locale}`, { signal });
      if (!res.ok) throw new Error(`augments ${res.status}`);
      const rows = (await res.json()) as [number, SlimAugment][];
      return new Map<number, Augment>(rows.map(([id, a]) => [id, { ...a, url: AUGMENT_ICON_BASE + a.icon }]));
    },
  });
}
