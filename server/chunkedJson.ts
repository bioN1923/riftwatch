/**
 * JSON.stringify that hands the event loop back every few milliseconds. A big store (champion
 * stats run to tens of megabytes) serialised in one go blocks every request for a second or two;
 * this walks the top few levels of objects itself and stringifies each small subtree with the
 * native JSON.stringify, pausing (setImmediate) whenever the time budget is used up.
 * Output is identical to JSON.stringify for plain data (no toJSON, no replacer).
 */
const pause = () => new Promise<void>((r) => setImmediate(r));

export async function stringifyChunked(value: unknown, opts: { depth?: number; budgetMs?: number } = {}): Promise<string> {
  const depth = opts.depth ?? 5;
  const budget = opts.budgetMs ?? 8;
  const out: string[] = [];
  let started = performance.now();

  const tick = async () => {
    if (performance.now() - started > budget) {
      await pause();
      started = performance.now();
    }
  };

  const walk = async (v: unknown, level: number): Promise<void> => {
    if (level >= depth || v === null || typeof v !== 'object' || typeof (v as { toJSON?: unknown }).toJSON === 'function') {
      out.push(JSON.stringify(v) ?? 'null');
      await tick();
      return;
    }
    if (Array.isArray(v)) {
      // Long lists (the player index is one) go item by item; short ones in one piece.
      if (v.length < 64) {
        out.push(JSON.stringify(v));
        await tick();
        return;
      }
      out.push('[');
      for (let i = 0; i < v.length; i++) {
        if (i) out.push(',');
        const item = v[i];
        if (item === undefined || typeof item === 'function' || typeof item === 'symbol') out.push('null');
        else await walk(item, depth); // each item whole
      }
      out.push(']');
      return;
    }
    out.push('{');
    let first = true;
    for (const [k, child] of Object.entries(v as Record<string, unknown>)) {
      // Same as JSON.stringify: properties holding undefined, functions or symbols are left out.
      if (child === undefined || typeof child === 'function' || typeof child === 'symbol') continue;
      out.push(first ? '' : ',', JSON.stringify(k), ':');
      first = false;
      await walk(child, level + 1);
    }
    out.push('}');
  };

  await walk(value, 0);
  return out.join('');
}
