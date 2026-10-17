import Link from "next/link"
import { topPerformers, type PerformerSortKey } from "@/lib/data/analytics"
import { money, pct } from "@/lib/format"
import { SnapshotBanner } from "@/components/v2/snapshot-banner"
import { SortableHeader } from "@/components/v2/sortable-header"
import { TopPerformersChart } from "@/components/v2/analytics-charts"

export const dynamic = "force-static"

const TABS = [
  { key: "ret3y", label: "3-year return" },
  { key: "ret5y", label: "5-year return" },
  { key: "yield", label: "Dividend yield" },
] as const

export default async function PerformersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const raw = Array.isArray(sp.by) ? sp.by[0] : sp.by
  const by = (TABS.find((t) => t.key === raw)?.key ?? "ret3y") as "ret3y" | "ret5y" | "yield"

  const SORTABLE: PerformerSortKey[] = [
    "symbol",
    "name",
    "category",
    "expenseRatio",
    "aum",
    "ret3y",
    "ret5y",
    "yield",
  ]
  const one = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "")
  }
  const rawSort = one("sort")
  const sortBy = (SORTABLE as string[]).includes(rawSort) ? (rawSort as PerformerSortKey) : by
  const dir = one("dir") === "asc" ? "asc" : "desc"

  // The chart always shows the leaderboard measure; only the table re-sorts.
  const chartRows = topPerformers(by, 15)
  const rows = topPerformers(by, 15, { by: sortBy, dir })

  return (
    <main className="mr-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Top performers</h1>
        <p className="mt-1 text-sm text-slate-600">
          Leaders by each measure, restricted to funds above $50M in assets and excluding leveraged
          and inverse products.
        </p>
      </header>

      <SnapshotBanner />

      <nav className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/performers?by=${t.key}`}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              t.key === by
                ? "border-[#0A0A0A] bg-[#FF3366] text-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A]"
                : "border-slate-300 bg-white text-slate-700 hover:border-[#0A0A0A] hover:bg-[#00E5FF]/25"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mb-6 surface-card p-4">
        <TopPerformersChart
          data={chartRows.map((r) => ({
            symbol: r.symbol,
            name: r.name,
            value: (r[by] ?? 0) * 100,
          }))}
        />
      </div>

      <div className="overflow-x-auto surface-card">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left">
            <tr>
              {(
                [
                  ["symbol", "Symbol", false],
                  ["name", "Name", false],
                  ["category", "Category", false],
                  ["expenseRatio", "Fee", true],
                  ["aum", "Assets", true],
                  ["ret3y", "3Y", true],
                  ["ret5y", "5Y", true],
                  ["yield", "Yield", true],
                ] as const
              ).map(([key, label, numeric]) => (
                <SortableHeader
                  key={key}
                  label={label}
                  sortKey={key}
                  activeKey={sortBy}
                  direction={dir}
                  basePath="/performers"
                  params={{ by }}
                  numeric={numeric}
                  defaultDirection={key === "expenseRatio" ? "asc" : undefined}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono font-medium">
                  <Link href={`/etf/${r.symbol}`} className="hover:underline">{r.symbol}</Link>
                </td>
                <td className="max-w-[300px] truncate px-4 py-2.5 text-slate-700" title={r.name}>{r.name}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{r.category}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {r.expenseRatio === null ? (
                    <span className="text-slate-300">n/a</span>
                  ) : (
                    `${(r.expenseRatio * 100).toFixed(3)}%`
                  )}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(r.aum)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{pct(r.ret3y, 1)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{pct(r.ret5y, 1)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{pct(r.yield)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
        Sorting rearranges this leaderboard; it does not rebuild it. Sorting by fee shows the
        cheapest of the 3-year leaders, not the cheapest funds overall, which is what the{" "}
        <Link href="/screener" className="underline underline-offset-2">screener</Link> is for.
        A high trailing return is a description of the past, not a prediction. Compare the 3Y and
        5Y columns: a fund leading on one but not the other had a single strong period rather than
        a durable pattern, the <Link href="/risk-return" className="underline underline-offset-2">risk &amp; return</Link>{" "}
        view plots this directly.
      </p>
    </main>
  )
}
