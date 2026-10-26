export const QUEUE_NAMES: Record<number, string> = {
  0: 'Custom',
  400: 'Normal Draft',
  420: 'Ranked Solo/Duo',
  430: 'Normal Blind',
  440: 'Ranked Flex',
  450: 'ARAM',
  480: 'Swiftplay',
  490: 'Quickplay',
  700: 'Clash',
  720: 'ARAM Clash',
  830: 'Co-op vs AI',
  840: 'Co-op vs AI',
  850: 'Co-op vs AI',
  870: 'Co-op vs AI',
  880: 'Co-op vs AI',
  890: 'Co-op vs AI',
  900: 'ARURF',
  1020: 'One for All',
  1300: 'Nexus Blitz',
  1700: 'Arena',
  1710: 'Arena',
  1900: 'URF',
  2300: 'Brawl',
  2400: 'ARAM Mayhem',
};

export const queueName = (id: number) => QUEUE_NAMES[id] ?? 'Special mode';

export const QUEUE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'solo', label: 'Ranked Solo' },
  { id: 'flex', label: 'Ranked Flex' },
  { id: 'normal', label: 'Normal' },
  { id: 'aram', label: 'ARAM' },
  { id: 'arena', label: 'Arena' },
] as const;

export type QueueFilter = (typeof QUEUE_FILTERS)[number]['id'];

export const RANKED_QUEUE_LABEL: Record<string, string> = {
  RANKED_SOLO_5x5: 'Ranked Solo/Duo',
  RANKED_FLEX_SR: 'Ranked Flex',
};
