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
 * durable pattern, which is exactly what a headline "top performer" list hides.
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

/**
 * Concentration of the market by issuer.
 *
 * The ETF industry is far more concentrated than a count of 4,148 funds
 * suggests: a small number of issuers hold most of the money. Showing fund
 * counts without this makes the market look more competitive than it is.
 */
export function issuerConcentration(topN = 10) {
  const byIssuer = new Map<string, { aum: number; funds: number }>()
  for (const e of DIRECTORY) {
    const cur = byIssuer.get(e.fundFamily) ?? { aum: 0, funds: 0 }
    cur.aum += e.aum ?? 0
    cur.funds += 1
    byIssuer.set(e.fundFamily, cur)
  }

  const ranked = Array.from(byIssuer.entries())
    .map(([issuer, v]) => ({ issuer, ...v }))
    .sort((a, b) => b.aum - a.aum)

  const totalAum = ranked.reduce((s, r) => s + r.aum, 0)
  const top = ranked.slice(0, topN)
  const topShare = totalAum > 0 ? top.reduce((s, r) => s + r.aum, 0) / totalAum : 0

  return { top, topShare, totalAum, issuers: ranked.length }
}

/**
 * Equal-weighted against asset-weighted return.
 *
 * The median fund and the median dollar are not the same thing. Equal-weighted
 * treats a $2M fund and a $500B fund identically; asset-weighted reflects what
 * investors actually held. A large gap between the two means the money was
 * concentrated in funds that behaved differently from the typical fund, which
 * is a caveat every "median return" headline should carry.
 */
export function weightedReturns(key: "ret3y" | "ret5y") {
  const rows = DIRECTORY.filter(
    (e) => e[key] !== null && e.aum !== null && Math.abs(e[key] ?? 0) < 1 && !/\b(2x|3x|ultra|inverse|short|bear|leveraged)\b/i.test(e.name)
  )
  if (rows.length === 0) return null

  const equal = rows.reduce((s, e) => s + (e[key] ?? 0), 0) / rows.length
  const totalAum = rows.reduce((s, e) => s + (e.aum ?? 0), 0)
  const weighted =
    totalAum > 0 ? rows.reduce((s, e) => s + (e[key] ?? 0) * (e.aum ?? 0), 0) / totalAum : 0

  return { equal, weighted, gap: weighted - equal, funds: rows.length }
}

/**
 * Funds small or thinly traded enough that the bid-ask spread is likely to cost
 * more than the expense ratio. Relevant because screeners sorted by return
 * routinely surface funds nobody can trade cheaply.
 */
export function thinlyTraded() {
  const thin = DIRECTORY.filter((e) => (e.aum ?? 0) < 50e6 || (e.avgVolume ?? 0) < 10_000)
  return { count: thin.length, share: thin.length / DIRECTORY.length }
}
