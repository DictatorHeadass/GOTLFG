/**
 * In-memory sliding window. Good enough at this scale: the only thing it needs
 * to stop is one person spamming the board from one session. It resets when the
 * serverless instance recycles, which is an acceptable trade for zero infra.
 * Swap for Upstash/Redis if the board ever gets busy enough to matter.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 5_000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }

  return true;
}
