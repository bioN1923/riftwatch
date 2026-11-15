import { t, type MessageKey } from '../i18n';

/** Queue names: translated where the name is a description, kept where it's a proper name (ARAM, URF, Clash). */
const QUEUE_KEYS: Record<number, MessageKey | string> = {
  0: 'queue.custom',
  400: 'queue.normalDraft',
  420: 'queue.soloDuo',
  430: 'queue.normalBlind',
  440: 'queue.flex',
  450: 'ARAM',
  480: 'queue.swiftplay',
  490: 'queue.quickplay',
  700: 'Clash',
  720: 'queue.aramClash',
  830: 'queue.coop',
  840: 'queue.coop',
  850: 'queue.coop',
  870: 'queue.coop',
  880: 'queue.coop',
  890: 'queue.coop',
  900: 'ARURF',
  1020: 'queue.oneForAll',
  1300: 'queue.nexusBlitz',
  1400: 'Ultimate Spellbook',
  1700: 'queue.arena',
  1710: 'queue.arena',
  1810: 'Swarm',
  1820: 'Swarm',
  1830: 'Swarm',
  1840: 'Swarm',
  1900: 'URF',
  2300: 'queue.brawl',
  2400: 'queue.aramMayhem',
};

/** A queue's name. Arena events can come with queue ids of their own; the game mode still says Arena. */
export const queueName = (id: number, gameMode?: string) => {
  const k = gameMode === 'CHERRY' ? 'queue.arena' : QUEUE_KEYS[id];
  return k == null ? t('queue.special') : k.startsWith('queue.') ? t(k as MessageKey) : k;
};

const FILTER_IDS = ['all', 'solo', 'flex', 'normal', 'aram', 'arena'] as const;
export const QUEUE_FILTERS = FILTER_IDS.map((id) => ({
  id,
  get label() {
    return t(`queueFilter.${id}`);
  },
}));

export type QueueFilter = (typeof FILTER_IDS)[number];

export const RANKED_QUEUE_LABEL: Record<string, string> = new Proxy({} as Record<string, string>, {
  get: (_, k) => (k === 'RANKED_SOLO_5x5' ? t('queue.soloDuo') : k === 'RANKED_FLEX_SR' ? t('queue.flex') : undefined),
});
