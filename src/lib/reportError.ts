/**
 * Send browser errors to the server's error log, so problems on visitors' devices show up at
 * /admin/errors. Each distinct message is sent once per page load, and at most five in total.
 */
const sent = new Set<string>();

export function reportError(error: unknown, kind?: string) {
  try {
    const e = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));
    // A stale tab after a deploy can't load new page code; the page already offers a reload.
    if (/dynamically imported module|Loading chunk|Importing a module script failed/i.test(e.message)) return;
    if (sent.size >= 5 || sent.has(e.message)) return;
    sent.add(e.message);
    const body = JSON.stringify({ kind: kind ?? e.name, message: e.message, stack: e.stack, where: location.pathname + location.search });
    if (!navigator.sendBeacon?.('/api/client-error', new Blob([body], { type: 'application/json' }))) {
      void fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* never let reporting break the page */
  }
}

export function installErrorReporting() {
  window.addEventListener('error', (ev) => {
    // Resource load failures (images etc.) have no error object; those are expected and ignored.
    if (ev.error) reportError(ev.error);
  });
  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason;
    // API errors are already shown on the page and logged by the server.
    if (r && typeof r === 'object' && 'status' in r && 'code' in r) return;
    if (r?.name === 'AbortError') return;
    reportError(r, 'UnhandledRejection');
  });
}
