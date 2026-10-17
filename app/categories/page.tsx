import { categoryPerformance, type CategorySortKey } from "@/lib/data/analytics"
import { money, num, pct } from "@/lib/format"
import { SnapshotBanner } from "@/components/v2/snapshot-banner"
import { SortableHeader } from "@/components/v2/sortable-header"
import { CategoryPerformanceChart } from "@/components/v2/analytics-charts"

export const dynamic = "force-dynamic"

const SORTABLE: CategorySortKey[] = ["category", "count", "aum", "ret3y", "ret5y"]

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const one = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "")
  }
  const rawSort = one("sort")
  const sortBy = (SORTABLE as string[]).includes(rawSort)
    ? (rawSort as CategorySortKey)
    : "ret3y"
  const dir = one("dir") === "asc" ? "asc" : "desc"

  // The chart keeps its own ordering so re-sorting the table does not reshuffle it.
  const chartRows = categoryPerformance(20)
  const rows = categoryPerformance(20, { by: sortBy, dir })

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Category performance</h1>
        <p className="mt-1 text-sm text-slate-600">
          Median 3-year and 5-year returns by category, for categories with at least five
          qualifying funds.
        </p>
      </header>

      <SnapshotBanner />

      <div className="mb-6 surface-card p-4">
        <div className="mb-3 flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-900" /> Median 3Y
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" /> Median 5Y
          </span>
        </div>
        <CategoryPerformanceChart
          data={chartRows.map((r) => ({
            category: r.category,
            ret3y: (r.ret3y ?? 0) * 100,
            ret5y: (r.ret5y ?? 0) * 100,
          }))}
        />
      </div>

      <div className="overflow-x-auto surface-card">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left">
            <tr>
              {(
                [
                  ["category", "Category", false],
                  ["count", "Funds", true],
                  ["aum", "Assets", true],
                  ["ret3y", "Median 3Y", true],
                  ["ret5y", "Median 5Y", true],
                ] as const
              ).map(([key, label, numeric]) => (
                <SortableHeader
                  key={key}
                  label={label}
                  sortKey={key}
                  activeKey={sortBy}
                  direction={dir}
                  basePath="/categories"
                  numeric={numeric}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.category} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2.5">{r.category}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{num(r.count)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(r.aum)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{pct(r.ret3y, 1)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{pct(r.ret5y, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
        Medians, not means: category averages are easily distorted by a handful of outliers.
        Leveraged and inverse funds and funds under $50M in assets are excluded throughout.
      </p>
    </main>
  )
}
