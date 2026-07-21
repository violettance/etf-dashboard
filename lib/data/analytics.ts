import { DIRECTORY, type DirectoryEntry } from "./directory"

/**
 * Aggregations over the snapshot.
 *
 * All of these deliberately use medians and trimmed sets rather than means:
 * the ETF universe contains leveraged and inverse funds whose returns are
 * extreme enough to drag a mean into meaninglessness.
 */

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? (s[mid] ?? null) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2
}

/** Funds large enough to be investable and not obviously leveraged. */
function investable(e: DirectoryEntry): boolean {
  return (
    (e.aum ?? 0) >= 50e6 &&
    !/\b(2x|3x|ultra|inverse|short|bear|leveraged)\b/i.test(e.name)
  )
}

export function topPerformers(key: "ret3y" | "ret5y" | "yield", limit = 15) {
  return DIRECTORY.filter((e) => investable(e) && e[key] !== null)
    .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
    .slice(0, limit)
}

export function categoryPerformance(limit = 14) {
  const groups = new Map<string, DirectoryEntry[]>()
  for (const e of DIRECTORY) {
    if (!investable(e) || e.category === "Uncategorised") continue
    const list = groups.get(e.category)
    if (list) list.push(e)
    else groups.set(e.category, [e])
  }

  return Array.from(groups.entries())
    .filter(([, list]) => list.length >= 5)
    .map(([category, list]) => ({
      category,
      count: list.length,
      ret3y: median(list.map((e) => e.ret3y).filter((v): v is number => v !== null)),
      ret5y: median(list.map((e) => e.ret5y).filter((v): v is number => v !== null)),
      aum: list.reduce((s, e) => s + (e.aum ?? 0), 0),
    }))
    .filter((r) => r.ret3y !== null)
    .sort((a, b) => (b.ret3y ?? 0) - (a.ret3y ?? 0))
    .slice(0, limit)
}

/**
 * 3-year against 5-year return. Funds near the diagonal delivered consistently;
 * funds far above it owe their 3-year figure to a recent run rather than a
 * durable pattern — which is exactly what a headline "top performer" list hides.
 */
export function consistencyScatter(maxPoints = 500) {
  return DIRECTORY.filter(
    (e) =>
      investable(e) &&
      e.ret3y !== null &&
      e.ret5y !== null &&
      Math.abs(e.ret3y) < 1 &&
      Math.abs(e.ret5y) < 1
  )
    .sort((a, b) => (b.aum ?? 0) - (a.aum ?? 0))
    .slice(0, maxPoints)
    .map((e) => ({
      symbol: e.symbol,
      name: e.name,
      category: e.category,
      x: (e.ret5y ?? 0) * 100,
      y: (e.ret3y ?? 0) * 100,
      aum: e.aum ?? 0,
    }))
}

export function universeStats() {
  const withAum = DIRECTORY.filter((e) => e.aum !== null)
  return {
    total: DIRECTORY.length,
    investable: DIRECTORY.filter(investable).length,
    issuers: new Set(DIRECTORY.map((e) => e.fundFamily)).size,
    categories: new Set(DIRECTORY.map((e) => e.category)).size,
    totalAum: withAum.reduce((s, e) => s + (e.aum ?? 0), 0),
    medianRet3y: median(
      DIRECTORY.filter(investable)
        .map((e) => e.ret3y)
        .filter((v): v is number => v !== null && Math.abs(v) < 1)
    ),
    medianRet5y: median(
      DIRECTORY.filter(investable)
        .map((e) => e.ret5y)
        .filter((v): v is number => v !== null && Math.abs(v) < 1)
    ),
    medianYield: median(
      DIRECTORY.map((e) => e.yield).filter((v): v is number => v !== null && v < 0.25)
    ),
  }
}
