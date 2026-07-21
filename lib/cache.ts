/**
 * Small server-side TTL cache with stale-on-error semantics.
 *
 * Two problems this solves:
 *
 *  1. Free-tier quotas. Twelve Data allows 800 calls/day and 8/min; FMP allows
 *     250/day. Without a server cache every visitor burns quota directly, which
 *     is exactly what the previous localStorage-based approach did, each new
 *     browser started with an empty cache and hit the upstream again.
 *
 *  2. Availability. When an upstream fails or the quota is exhausted, serving
 *     slightly stale data is strictly better than showing an error. Entries are
 *     therefore retained past expiry and returned as a labelled fallback.
 */

type Entry<T> = { value: T; storedAt: number; expiresAt: number }

const store = new Map<string, Entry<unknown>>()

/** Hard ceiling so a long-running server process cannot grow without bound. */
const MAX_ENTRIES = 5_000

export type CacheResult<T> = {
  value: T
  /** True when the upstream failed and a previously cached value was served. */
  stale: boolean
  /** When the served value was originally fetched. */
  fetchedAt: Date
}

function evictOldestIfNeeded() {
  if (store.size < MAX_ENTRIES) return
  let oldestKey: string | undefined
  let oldest = Infinity
  for (const [k, v] of store) {
    if (v.storedAt < oldest) {
      oldest = v.storedAt
      oldestKey = k
    }
  }
  if (oldestKey !== undefined) store.delete(oldestKey)
}

/**
 * Returns a cached value, refreshing it via `fetcher` when expired.
 *
 * If `fetcher` throws and an expired entry exists, that entry is returned with
 * `stale: true` rather than propagating the error. The error only surfaces when
 * there is nothing cached at all.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<CacheResult<T>> {
  const now = Date.now()
  const hit = store.get(key) as Entry<T> | undefined

  if (hit && now < hit.expiresAt) {
    return { value: hit.value, stale: false, fetchedAt: new Date(hit.storedAt) }
  }

  try {
    const value = await fetcher()
    evictOldestIfNeeded()
    store.set(key, { value, storedAt: now, expiresAt: now + ttlMs })
    return { value, stale: false, fetchedAt: new Date(now) }
  } catch (error) {
    if (hit) {
      // Upstream is down or rate-limited. Extend the entry so we do not hammer
      // a failing provider on every request, and serve what we have.
      store.set(key, { ...hit, expiresAt: now + 60_000 })
      return { value: hit.value, stale: true, fetchedAt: new Date(hit.storedAt) }
    }
    throw error
  }
}

/** Test helper. */
export function __clearCache() {
  store.clear()
}
