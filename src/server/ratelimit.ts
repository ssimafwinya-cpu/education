// ─── Rate limiting (sliding window, in-memory) ──────────────────────────────
// Per-process limiter suitable for a single node / dev. In a multi-instance
// deployment the same interface is backed by Redis (INCR + EXPIRE) — see
// docs/DEPLOYMENT.md. Auth endpoints use tight limits to slow brute force.

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

/**
 * Returns true if the call identified by `key` is allowed
 * (at most `limit` calls within the trailing `windowMs`).
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  // Cheap protection against unbounded key growth.
  if (buckets.size > MAX_KEYS) buckets.clear();

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return true;
}

export function clientIp(req: { headers: Headers }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

/** Test hook. */
export function __resetRateLimits() {
  buckets.clear();
}
