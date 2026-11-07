import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * Finished matches, stored on the data volume (gzipped JSON, ~8 KB each). A match never changes
 * once played, so after the first fetch it is served from here forever, across restarts and
 * deploys. Capped at `max` matches; the least recently used are removed first.
 */
export class MatchStore {
  private count = 0;
  private pruning = false;

  constructor(
    private dir: string,
    private max = Number(process.env.MATCH_STORE_MAX ?? 20_000),
  ) {
    fs.mkdirSync(dir, { recursive: true });
    this.count = fs.readdirSync(dir).filter((f) => f.endsWith('.json.gz')).length;
  }

  private file(id: string) {
    return path.join(this.dir, `${id.replace(/[^A-Za-z0-9_]/g, '')}.json.gz`);
  }

  get(id: string): unknown | undefined {
    const f = this.file(id);
    try {
      const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString('utf8'));
      const now = new Date();
      fs.utimes(f, now, now, () => {}); // mark as recently used
      return data;
    } catch {
      return undefined;
    }
  }

  set(id: string, data: unknown, replace = false) {
    const f = this.file(id);
    const existed = fs.existsSync(f);
    if (existed && !replace) return;
    fs.writeFile(f, zlib.gzipSync(JSON.stringify(data)), (err) => {
      if (err) return console.warn('Could not store match', id, err.message);
      if (!existed && ++this.count > this.max) this.prune();
    });
  }

  get size() {
    return this.count;
  }

  /** Drop the least recently used 10%. */
  private prune() {
    if (this.pruning) return;
    this.pruning = true;
    try {
      const files = fs
        .readdirSync(this.dir)
        .filter((f) => f.endsWith('.json.gz'))
        .map((f) => ({ f, t: fs.statSync(path.join(this.dir, f)).mtimeMs }))
        .sort((a, b) => a.t - b.t);
      const drop = files.slice(0, Math.max(1, files.length - Math.floor(this.max * 0.9)));
      for (const { f } of drop) fs.rmSync(path.join(this.dir, f), { force: true });
      this.count = files.length - drop.length;
    } finally {
      this.pruning = false;
    }
  }
}
