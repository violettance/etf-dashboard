import Link from "next/link"
import {
  CATEGORIES,
  SNAPSHOT_DATE,
  SNAPSHOT_SOURCE,
  SORT_KEYS,
  screen,
  snapshotAgeMonths,
  type ScreenerQuery,
  type SortKey,
} from "@/lib/data/directory"
import { CategoryMixChart, YieldHistogram } from "@/components/v2/snapshot-charts"

export const dynamic = "force-dynamic"

const PER_PAGE = 25

const nf = new Intl.NumberFormat("en-US")
const pct = (v: number | null, d = 2) => (v === null ? "n/a" : `${(v * 100).toFixed(d)}%`)
const money = (v: number | null) => {
  if (v === null) return "n/a"
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  return `$${nf.format(Math.round(v))}`
}
const compact = (v: number | null) =>
  v === null ? "n/a" : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : nf.format(Math.round(v))

function parseQuery(sp: Record<string, string | string[] | undefined>): ScreenerQuery {
  const one = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "")
  }
  const numOrNull = (k: string) => {
    const raw = Number.parseFloat(one(k))
    return Number.isFinite(raw) ? raw : null
  }
  const sort = one("sort")
  return {
    q: one("q"),
    category: one("category"),
    minAum: numOrNull("minAum"),
    minYield: (() => {
      const v = numOrNull("minYield")
      return v === null ? null : v / 100
    })(),
    sort: (SORT_KEYS as readonly string[]).includes(sort) ? (sort as SortKey) : "aum",
    dir: one("dir") === "asc" ? "asc" : "desc",
    page: Number.parseInt(one("page"), 10) || 1,
    perPage: PER_PAGE,
  }
}

function href(query: ScreenerQuery, overrides: Partial<ScreenerQuery>) {
  const m = { ...query, ...overrides }
  const p = new URLSearchParams()
  if (m.q) p.set("q", m.q)
  if (m.category) p.set("category", m.category)
  if (m.minAum !== null) p.set("minAum", String(m.minAum))
  if (m.minYield !== null) p.set("minYield", String(m.minYield * 100))
  if (m.sort !== "aum") p.set("sort", m.sort)
  if (m.dir !== "desc") p.set("dir", m.dir)
  if (m.page > 1) p.set("page", String(m.page))
  const qs = p.toString()
  return qs ? `/screener?${qs}` : "/screener"
}

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "symbol", label: "Symbol", numeric: false },
  { key: "name", label: "Name", numeric: false },
  { key: "category", label: "Category", numeric: false },
  { key: "aum", label: "Assets", numeric: true },
  { key: "yield", label: "Yield", numeric: true },
  { key: "ret3y", label: "3Y return", numeric: true },
  { key: "ret5y", label: "5Y return", numeric: true },
  { key: "avgVolume", label: "Avg volume", numeric: true },
]

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = parseQuery(await searchParams)
  const result = screen(query)
  const ageMonths = snapshotAgeMonths()
  const filtered = Boolean(query.q || query.category || query.minAum || query.minYield)

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">ETF Decision Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Narrow {nf.format(4148)} US-listed ETFs down to a shortlist worth comparing.
        </p>
      </header>

      {/* Data provenance is stated before any number is shown, not buried in a footnote. */}
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
        <span className="font-medium text-slate-900">Snapshot data</span>
        <span className="text-slate-600">
          The figures in this table were captured on{" "}
          <time dateTime={SNAPSHOT_DATE} className="font-medium text-slate-900">
            {new Date(SNAPSHOT_DATE).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>{" "}
          from {SNAPSHOT_SOURCE}, about {ageMonths} months ago. Use them to shortlist, then open a
          fund for live prices and risk metrics.
        </span>
      </div>

      {/* Where the current filters have got you. */}
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Current selection">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-semibold tabular-nums">{nf.format(result.total)}</div>
          <div className="text-xs text-slate-500">funds match</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-semibold tabular-nums">{nf.format(result.families)}</div>
          <div className="text-xs text-slate-500">issuers</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-semibold tabular-nums">{money(result.totalAum)}</div>
          <div className="text-xs text-slate-500">combined assets</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-2xl font-semibold">
            {result.total <= 10 ? "Ready" : result.total <= 60 ? "Close" : "Broad"}
          </div>
          <div className="text-xs text-slate-500">
            {result.total <= 10
              ? "comparable shortlist"
              : result.total <= 60
                ? "keep narrowing"
                : "add a filter"}
          </div>
        </div>
      </section>

      {/* Shape of the current selection. */}
      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-700">
            Largest categories {filtered && <span className="text-slate-400">in selection</span>}
          </h2>
          <CategoryMixChart data={result.categoryMix} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-700">
            Yield distribution {filtered && <span className="text-slate-400">in selection</span>}
          </h2>
          <YieldHistogram data={result.yieldBuckets} />
        </div>
      </section>

      {/* Filters */}
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query.q}
            placeholder="Symbol, name or issuer"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </div>
        <div className="min-w-[190px]">
          <label htmlFor="category" className="mb-1 block text-xs font-medium text-slate-600">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={query.category}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="w-36">
          <label htmlFor="minAum" className="mb-1 block text-xs font-medium text-slate-600">
            Min assets ($)
          </label>
          <input
            id="minAum"
            name="minAum"
            type="number"
            min={0}
            step={1000000}
            defaultValue={query.minAum ?? ""}
            placeholder="e.g. 500000000"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </div>
        <div className="w-28">
          <label htmlFor="minYield" className="mb-1 block text-xs font-medium text-slate-600">
            Min yield (%)
          </label>
          <input
            id="minYield"
            name="minYield"
            type="number"
            min={0}
            step={0.1}
            defaultValue={query.minYield === null ? "" : query.minYield * 100}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Apply
        </button>
        {filtered && (
          <Link href="/screener" className="px-1 py-2 text-sm text-slate-600 underline underline-offset-2">
            Reset
          </Link>
        )}
      </form>

      {/* Results */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left">
            <tr>
              {COLUMNS.map((col) => {
                const active = query.sort === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`whitespace-nowrap px-4 py-3 font-medium text-slate-600 ${col.numeric ? "text-right" : ""}`}
                  >
                    <Link
                      href={href(query, {
                        sort: col.key,
                        dir: active && query.dir === "desc" ? "asc" : "desc",
                        page: 1,
                      })}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      {col.label}
                      <span aria-hidden className={active ? "" : "opacity-0"}>
                        {query.dir === "desc" ? "↓" : "↑"}
                      </span>
                    </Link>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.symbol} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono font-medium">
                  <Link href={`/etf/${row.symbol}`} className="hover:underline">
                    {row.symbol}
                  </Link>
                </td>
                <td className="max-w-[280px] truncate px-4 py-2.5 text-slate-700" title={row.name}>
                  {row.name}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{row.category}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(row.aum)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{pct(row.yield)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{pct(row.ret3y, 1)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{pct(row.ret5y, 1)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                  {compact(row.avgVolume)}
                </td>
              </tr>
            ))}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-slate-500">
                  No funds match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {result.pages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="text-slate-500">
            Page {result.page} of {nf.format(result.pages)} · {nf.format(result.total)} funds
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Link
                href={href(query, { page: result.page - 1 })}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {result.page < result.pages && (
              <Link
                href={href(query, { page: result.page + 1 })}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}

      <p className="mt-8 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
        Table figures are from the {SNAPSHOT_DATE} snapshot and are not current. Empty cells mean
        the source had no value; they are never filled with estimates, and funds with no value sort
        last regardless of direction. This dashboard presents data for comparison and is not
        investment advice.
      </p>
    </main>
  )
}
