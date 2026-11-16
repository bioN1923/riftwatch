import { monitorEventLoopDelay, PerformanceObserver } from 'node:perf_hooks';

/**
 * Where the server's time goes, as numbers for /api/health. Added to find what still pauses every
 * request now and then (v3.129 left ~0.5 s stalls about every 35 s):
 * - event-loop delay (histogram, last 5 minutes and since start);
 * - garbage-collection pauses;
 * - named spans (store saves, crawler ingest) with their longest single run;
 * - the last few stalls over 150 ms, each with what had run just before it.
 */
const loop = monitorEventLoopDelay({ resolution: 10 });
loop.enable();
let windowStart = Date.now();
let lastWindow: { maxMs: number; p99Ms: number; meanMs: number } | null = null;

interface Span {
  n: number;
  totalMs: number;
  maxMs: number;
  lastMs: number;
  lastAt: number;
}
const spans = new Map<string, Span>();
let lastSpan: { name: string; end: number; ms: number } | null = null;

const gc = { count: 0, totalMs: 0, maxMs: 0, lastMs: 0, lastAt: 0, lastKind: 0 };
try {
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      gc.count++;
      gc.totalMs += e.duration;
      gc.lastMs = e.duration;
      gc.lastAt = Date.now();
      gc.lastKind = (e as unknown as { detail?: { kind?: number } }).detail?.kind ?? 0;
      if (e.duration > gc.maxMs) gc.maxMs = e.duration;
    }
  }).observe({ entryTypes: ['gc'] });
} catch {
  /* gc entries unsupported */
}

const stalls: { at: number; ms: number; after: string; afterMs: number; gcMs: number }[] = [];
let tickAt = performance.now();
setInterval(() => {
  const now = performance.now();
  const late = now - tickAt - 100;
  tickAt = now;
  if (late > 150) {
    stalls.push({
      at: Date.now(),
      ms: Math.round(late),
      after: lastSpan && Date.now() - lastSpan.end < late + 1000 ? lastSpan.name : '',
      afterMs: lastSpan ? Math.round(lastSpan.ms) : 0,
      gcMs: Date.now() - gc.lastAt < late + 1000 ? Math.round(gc.lastMs) : 0,
    });
    if (stalls.length > 12) stalls.shift();
  }
}, 100).unref();

function record(name: string, ms: number) {
  const s = spans.get(name) ?? { n: 0, totalMs: 0, maxMs: 0, lastMs: 0, lastAt: 0 };
  s.n++;
  s.totalMs += ms;
  s.lastMs = ms;
  s.lastAt = Date.now();
  if (ms > s.maxMs) s.maxMs = ms;
  spans.set(name, s);
  lastSpan = { name, end: Date.now(), ms };
}

/** Wrap obj[method] so every call is timed under `name` (async methods: until they settle). */
export function instrument<T extends object>(obj: T, method: keyof T & string, name: string) {
  const orig = (obj as Record<string, unknown>)[method] as (...a: unknown[]) => unknown;
  if (typeof orig !== 'function') return;
  (obj as Record<string, unknown>)[method] = function (this: unknown, ...args: unknown[]) {
    const t0 = performance.now();
    const out = orig.apply(this, args);
    if (out instanceof Promise) return out.finally(() => record(name, performance.now() - t0));
    record(name, performance.now() - t0);
    return out;
  };
}

const ms = (ns: number) => Math.round(ns / 1e5) / 10;

export function perfSnapshot() {
  if (Date.now() - windowStart > 5 * 60_000) {
    lastWindow = { maxMs: ms(loop.max), p99Ms: ms(loop.percentile(99)), meanMs: ms(loop.mean) };
    loop.reset();
    windowStart = Date.now();
  }
  const r = (n: number) => Math.round(n);
  return {
    loop: { maxMs: ms(loop.max), p99Ms: ms(loop.percentile(99)), meanMs: ms(loop.mean), windowS: r((Date.now() - windowStart) / 1000), previous: lastWindow },
    gc: { count: gc.count, totalMs: r(gc.totalMs), maxMs: r(gc.maxMs), lastMs: r(gc.lastMs), lastKind: gc.lastKind },
    heapMb: r(process.memoryUsage().heapUsed / 1e6),
    spans: Object.fromEntries([...spans].map(([k, s]) => [k, { n: s.n, avgMs: r(s.totalMs / s.n), maxMs: r(s.maxMs), lastMs: r(s.lastMs), agoS: r((Date.now() - s.lastAt) / 1000) }])),
    stalls: stalls.map((s) => ({ agoS: r((Date.now() - s.at) / 1000), ms: s.ms, after: s.after, afterMs: s.afterMs, gcMs: s.gcMs })),
  };
}
