// ============================================
// In-memory read cache for Firestore queries — pure, no Firebase imports, so it
// is unit-testable on its own.
//
// Every page in this app refetches everything in a useEffect on mount, so
// navigating members -> dashboard -> members paid for the same queries three
// times. This caches query results per (collection path + query shape) for a
// short window, and de-duplicates identical requests that are in flight at the
// same moment.
//
// Staleness is bounded two ways: a short TTL, and invalidation of a collection's
// entries whenever this client writes to it. Writes made elsewhere — another
// admin's browser, or an API route using the Admin SDK — are only reflected
// after the TTL, which is why the TTL is seconds and not minutes.
// ============================================

export const DEFAULT_TTL_MS = 45_000;
const MAX_ENTRIES = 200;

const entries = new Map();   // key -> { at, value }
const inflight = new Map();  // key -> Promise

/**
 * Build a stable cache key. Firestore Timestamps serialise to their
 * {seconds, nanoseconds} shape, which is stable for the same instant; a filter
 * built from `new Date()` therefore produces a fresh key every call and simply
 * never hits the cache, rather than returning something wrong.
 */
export function buildKey(path, filters, sortBy, limitCount, kind = 'docs') {
  return JSON.stringify([kind, path, filters || [], sortBy || null, limitCount ?? null]);
}

function isFresh(entry, ttl) {
  return entry && (Date.now() - entry.at) < ttl;
}

/** Drop expired entries, then the oldest ones if we are still over the cap. */
function prune() {
  if (entries.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [k, v] of entries) {
    if (now - v.at >= DEFAULT_TTL_MS) entries.delete(k);
  }
  // Map iterates in insertion order, so the front is the oldest.
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.delete(oldest);
  }
}

/**
 * Run `loader` behind the cache.
 *
 * A result carrying an `error` is never cached — otherwise one failed read
 * (a missing index, a rules denial) would be replayed for the whole TTL.
 */
export function cached(key, loader, { ttl = DEFAULT_TTL_MS } = {}) {
  const hit = entries.get(key);
  if (isFresh(hit, ttl)) return Promise.resolve(hit.value);

  const pending = inflight.get(key);
  if (pending) return pending;

  const p = Promise.resolve()
    .then(loader)
    .then((value) => {
      if (!value || !value.error) {
        entries.set(key, { at: Date.now(), value });
        prune();
      }
      return value;
    })
    .finally(() => { inflight.delete(key); });

  inflight.set(key, p);
  return p;
}

/** Forget every cached read for one collection path. Called on every write. */
export function invalidatePath(path) {
  if (!path) return;
  // Keys are JSON arrays — ["docs","tenants/x/members",[],null,50] — so matching
  // the quoted path keeps `.../members` from also clearing `.../members_archive`.
  const needle = `"${path}"`;
  for (const k of entries.keys()) {
    if (k.includes(needle)) entries.delete(k);
  }
}

/** Forget everything. Use after a mutation this client did not perform itself. */
export function clearReadCache() {
  entries.clear();
}

/** Test/diagnostic helper. */
export function cacheStats() {
  return { entries: entries.size, inflight: inflight.size };
}
