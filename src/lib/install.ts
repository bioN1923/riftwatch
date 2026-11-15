import { useSyncExternalStore } from 'react';

/**
 * "Install app": browsers that support it (Chrome, Edge, Android) fire `beforeinstallprompt` once the
 * site qualifies (manifest + icons since v3.116). We keep the event and offer a quiet footer button
 * instead of the browser's own banner; Safari and Firefox never fire it, so the button never shows.
 */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** True while the browser has an install offer waiting. */
export const useCanInstall = () => useSyncExternalStore(subscribe, () => deferred != null, () => false);

/** Show the browser's install dialog; the offer is used up either way. */
export async function promptInstall() {
  const e = deferred;
  if (!e) return;
  deferred = null;
  emit();
  await e.prompt();
  await e.userChoice.catch(() => undefined);
}
