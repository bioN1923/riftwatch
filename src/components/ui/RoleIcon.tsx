import { t } from '../../i18n';
/** Lane glyphs drawn to echo the in-client position icons. */
const PATHS: Record<string, string> = {
  TOP: 'M3 3h13l-4 4H7v5l-4 4V3zm18 5v13H8l4-4h5v-5l4-4zM10 10h4v4h-4z',
  JUNGLE: 'M7 2c3 3 4 6 4 10l1 9c-3-2-5-5-6-9-.6-3-.2-6 1-10zm10 0c1.2 4 1.6 7 1 10-1 4-3 7-6 9l1-9c0-4 1-7 4-10z',
  MIDDLE: 'M17 3h4v4L7 21H3v-4L17 3zM3 3h8l-3 3H6v2L3 11V3zm18 18h-8l3-3h2v-2l3-3v8z',
  BOTTOM: 'M21 21H8l4-4h5v-5l4-4v13zM3 16V3h13l-4 4H7v5l-4 4zm7-6h4v4h-4z',
  UTILITY: 'M12 4l3 3-3 3-3-3 3-3zM2 8h6l2 3-2 2H5L2 8zm20 0l-3 5h-3l-2-2 2-3h6zm-10 4l2 2v7l-2 1-2-1v-7l2-2z',
};

const ROLE_IDS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'ALL'];
/** Role names in the current language: ROLE_LABEL.MIDDLE → "Mid". */
export const ROLE_LABEL: Record<string, string> = new Proxy({} as Record<string, string>, {
  get: (_, k) => (typeof k === 'string' && ROLE_IDS.includes(k) ? t(`role.${k}` as 'role.TOP') : undefined),
});

export function RoleIcon({ role, size = 16, className }: { role: string; size?: number; className?: string }) {
  const d = PATHS[role];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-label={ROLE_LABEL[role]} role="img" fill="currentColor">
      <path d={d} fillRule="evenodd" />
    </svg>
  );
}
