/** True when version a ("3.198") is newer than b; an empty b counts as older. */
export function newerThan(a: string, b: string) {
  if (!b) return true;
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d > 0;
  }
  return false;
}
