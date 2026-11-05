import fs from 'node:fs';
import path from 'node:path';

/**
 * Error alerts. Problems are grouped by kind and message so a repeat bumps a counter instead of
 * flooding the log. New problems (and an expired Riot key) are posted to ALERT_WEBHOOK_URL —
 * a Discord or Slack incoming webhook — at most once an hour each. The list is shown at
 * /admin/errors (needs ADMIN_TOKEN).
 */
export type ErrorSource = 'server' | 'client' | 'riot';

export interface ErrorEntry {
  id: string;
  source: ErrorSource;
  kind: string; // e.g. KEY_INVALID, RATE_LIMITED, 500, TypeError
  message: string;
  where?: string; // request path or page URL
  detail?: string; // stack or extra context, trimmed
  first: number;
  last: number;
  count: number;
  alerted?: number;
}

const MAX = 200;
const ALERT_EVERY = 60 * 60_000;

/** Messages often carry ids, numbers or names that would split one problem into many. */
function fingerprint(source: string, kind: string, message: string) {
  const norm = message
    .replace(/[0-9a-f]{8}-[0-9a-f-]{20,}/gi, '#')
    .replace(/\b[A-Z]{2,4}\d?_\d+\b/g, '#')
    .replace(/\d+/g, '#')
    .slice(0, 160);
  let h = 0;
  for (const ch of `${source}|${kind}|${norm}`) h = (Math.imul(31, h) + ch.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
}

export class ErrorLog {
  private list: ErrorEntry[] = [];
  private dirty = false;

  constructor(
    private file: string | null,
    private webhook = process.env.ALERT_WEBHOOK_URL,
  ) {
    if (file) {
      try {
        this.list = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {
        /* first run */
      }
      setInterval(() => this.flush(), 30_000).unref();
    }
  }

  record(e: { source: ErrorSource; kind: string; message: string; where?: string; detail?: string; urgent?: boolean }) {
    const message = e.message.slice(0, 500);
    const id = fingerprint(e.source, e.kind, message);
    const now = Date.now();
    let entry = this.list.find((x) => x.id === id);
    if (entry) {
      entry.count++;
      entry.last = now;
      entry.where = e.where ?? entry.where;
      if (e.detail) entry.detail = e.detail.slice(0, 2000);
    } else {
      entry = { id, source: e.source, kind: e.kind, message, where: e.where?.slice(0, 300), detail: e.detail?.slice(0, 2000), first: now, last: now, count: 1 };
      this.list.unshift(entry);
      if (this.list.length > MAX) this.list.length = MAX;
    }
    this.dirty = true;
    if (this.webhook && (!entry.alerted || now - entry.alerted > ALERT_EVERY) && (entry.count === 1 || e.urgent)) {
      entry.alerted = now;
      void this.send(entry);
    }
    return entry;
  }

  entries() {
    return [...this.list].sort((a, b) => b.last - a.last);
  }

  clear() {
    this.list = [];
    this.dirty = true;
  }

  private async send(entry: ErrorEntry) {
    const text = `⚠️ Riftwatch ${entry.source} error — ${entry.kind}: ${entry.message}${entry.where ? `\n${entry.where}` : ''}`;
    try {
      // "content" is Discord's field, "text" is Slack's; each ignores the other.
      await fetch(this.webhook!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.slice(0, 1900), text }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      console.warn('Could not send error alert:', (err as Error).message);
    }
  }

  flush() {
    if (!this.dirty || !this.file) return;
    this.dirty = false;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.list));
    } catch (e) {
      console.warn('Could not save the error log:', (e as Error).message);
    }
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** A plain page listing recent errors, for the site owner. */
export function errorsPage(entries: ErrorEntry[], token: string) {
  const ago = (t: number) => {
    const s = Math.round((Date.now() - t) / 1000);
    return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : s < 86400 ? `${Math.round(s / 3600)}h ago` : `${Math.round(s / 86400)}d ago`;
  };
  const rows = entries
    .map(
      (e) => `<tr>
  <td><span class="tag ${e.source}">${e.source}</span></td>
  <td><b>${esc(e.kind)}</b><div>${esc(e.message)}</div>${e.where ? `<div class="m">${esc(e.where)}</div>` : ''}${e.detail ? `<details><summary>Details</summary><pre>${esc(e.detail)}</pre></details>` : ''}</td>
  <td class="n">${e.count}</td>
  <td class="m">${ago(e.last)}<br>first ${ago(e.first)}</td>
</tr>`,
    )
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Errors · Riftwatch</title>
<style>
:root{color-scheme:dark light;--bg:#091315;--fg:#e8eceb;--mu:#8fa3a2;--ln:#1f3336;--gold:#d8a94a}
@media (prefers-color-scheme:light){:root{--bg:#f4f6f5;--fg:#0f1d1f;--mu:#5a6c6c;--ln:#d6dfde;--gold:#9a6a12}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px}
h1{font-size:24px;margin:0 0 4px}p{color:var(--mu);margin:0 0 16px}
table{width:100%;border-collapse:collapse}td,th{border-top:1px solid var(--ln);padding:10px 8px;text-align:left;vertical-align:top}
th{color:var(--mu);font-weight:500;font-size:12px}.n{text-align:right;font-variant-numeric:tabular-nums}.m{color:var(--mu);font-size:12px}
.tag{font-size:11px;border:1px solid var(--ln);border-radius:3px;padding:1px 6px}.tag.riot{color:var(--gold);border-color:var(--gold)}.tag.client{color:#5fb3e8}
pre{white-space:pre-wrap;font-size:12px;color:var(--mu)}button{background:none;color:var(--fg);border:1px solid var(--ln);border-radius:4px;padding:6px 12px;cursor:pointer}
.wrap{overflow-x:auto}
</style></head><body><main>
<h1>Errors</h1>
<p>${entries.length ? `${entries.length} distinct problems, newest first.` : 'Nothing has gone wrong. 🎉'} ${process.env.ALERT_WEBHOOK_URL ? 'Alerts go to your webhook.' : 'Set ALERT_WEBHOOK_URL to get alerts in Discord or Slack.'}</p>
${entries.length ? `<form method="post" action="/admin/errors/clear?token=${encodeURIComponent(token)}"><button>Clear all</button></form><div class="wrap"><table><thead><tr><th>Source</th><th>Problem</th><th class="n">Times</th><th>When</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
</main></body></html>`;
}
