import snapshot from "@/data/etf-directory.json"

/**
 * ETF directory built from a Yahoo Finance snapshot.
 *
 * The snapshot is a point-in-time capture, not a live feed, and it is labelled
 * as such everywhere it is displayed. Identity fields (symbol, name, category,
 * issuer) age slowly; the numeric fields age quickly, which is exactly why the
 * capture date travels with the data instead of being left implicit.
 *
 * Live figures on the fund detail page are fetched separately.
 */

export type DirectoryEntry = {
  symbol: string
  name: string
  category: string
  fundFamily: string
  /** Total assets, USD. */
  aum: number | null
  /** Distribution yield as a fraction, e.g. 0.0592 for 5.92%. */
  yield: number | null
  /** Trailing 3-year average annual return as a fraction. */
  ret3y: number | null
  ret5y: number | null
  avgVolume: number | null
  pe: number | null
}

type Snapshot = { capturedAt: string; source: string; rows: DirectoryEntry[] }

const data = snapshot as Snapshot

export const DIRECTORY = data.rows
export const SNAPSHOT_DATE = data.capturedAt
export const SNAPSHOT_SOURCE = data.source

/** How old the snapshot is, in whole months, for the staleness banner. */
export function snapshotAgeMonths(now = new Date()): number {
  const captured = new Date(SNAPSHOT_DATE)
  return Math.max(
    0,
    (now.getFullYear() - captured.getFullYear()) * 12 + (now.getMonth() - captured.getMonth())
  )
}

export const CATEGORIES = Array.from(new Set(DIRECTORY.map((e) => e.category))).sort()

export const SORT_KEYS = [
  "symbol",
  "name",
  "category",
  "fundFamily",
  "aum",
  "yield",
  "ret3y",
  "ret5y",
  "avgVolume",
] as const

export type SortKey = (typeof SORT_KEYS)[number]

export type ScreenerQuery = {
  q: string
  category: string
  minAum: number | null
  minYield: number | null
  sort: SortKey
  dir: "asc" | "desc"
  page: number
  perPage: number
}

const NUMERIC_KEYS = new Set<SortKey>(["aum", "yield", "ret3y", "ret5y", "avgVolume"])

export function screen(query: ScreenerQuery) {
  const needle = query.q.trim().toLowerCase()

  let rows = DIRECTORY
  if (needle) {
    rows = rows.filter(
      (e) =>
        e.symbol.toLowerCase().includes(needle) ||
        e.name.toLowerCase().includes(needle) ||
        e.fundFamily.toLowerCase().includes(needle)
    )
  }
  if (query.category) rows = rows.filter((e) => e.category === query.category)
  if (query.minAum !== null) rows = rows.filter((e) => (e.aum ?? 0) >= query.minAum!)
  if (query.minYield !== null) rows = rows.filter((e) => (e.yield ?? 0) >= query.minYield!)

  const key = query.sort
  const sorted = [...rows].sort((a, b) => {
    let cmp: number
    if (NUMERIC_KEYS.has(key)) {
      const av = a[key] as number | null
      const bv = b[key] as number | null
      // Funds with no value always sort last, whichever direction is active,
      // so an empty field never masquerades as the best or worst result.
      if (av === null && bv === null) return a.symbol.localeCompare(b.symbol)
      if (av === null) return 1
      if (bv === null) return -1
      cmp = av - bv
      return query.dir === "asc" ? cmp : -cmp
    }
    cmp = String(a[key]).localeCompare(String(b[key]))
    return query.dir === "asc" ? cmp : -cmp
  })

  const total = sorted.length
  const pages = Math.max(1, Math.ceil(total / query.perPage))
  const page = Math.min(Math.max(1, query.page), pages)
  const start = (page - 1) * query.perPage

  const withAum = rows.filter((r) => r.aum !== null)
  const totalAum = withAum.reduce((s, r) => s + (r.aum ?? 0), 0)

  return {
    rows: sorted.slice(start, start + query.perPage),
    total,
    page,
    pages,
    families: new Set(rows.map((r) => r.fundFamily)).size,
    totalAum,
    /** Category mix of the current result set, largest first. */
    categoryMix: Object.entries(
      rows.reduce<Record<string, number>>((acc, r) => {
        acc[r.category] = (acc[r.category] ?? 0) + 1
        return acc
      }, {})
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    /** Yield distribution of the current result set, for the histogram. */
    yieldBuckets: bucketise(
      rows.map((r) => r.yield).filter((v): v is number => v !== null && v >= 0 && v < 0.25),
      [0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.07, 0.1, 0.25]
    ),
  }
}

function bucketise(values: number[], edges: number[]) {
  const out = edges.slice(0, -1).map((lo, i) => ({
    label:
      i === edges.length - 2
        ? `${(lo * 100).toFixed(0)}%+`
        : `${(lo * 100).toFixed(0)}–${((edges[i + 1] ?? 0) * 100).toFixed(0)}%`,
    count: 0,
  }))
  for (const v of values) {
    for (let i = 0; i < edges.length - 1; i++) {
      const hi = edges[i + 1] ?? Infinity
      if (v >= (edges[i] ?? 0) && v < hi) {
        const bucket = out[i]
        if (bucket) bucket.count++
        break
      }
    }
  }
  return out
}
