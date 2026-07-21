import { categoryPerformance } from "@/lib/data/analytics"
import { money, num, pct } from "@/lib/format"
import { SnapshotBanner } from "@/components/v2/snapshot-banner"
import { CategoryPerformanceChart } from "@/components/v2/analytics-charts"

export const dynamic = "force-static"

export default function CategoriesPage() {
  const rows = categoryPerformance(20)

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

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-900" /> Median 3Y
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" /> Median 5Y
          </span>
        </div>
        <CategoryPerformanceChart
          data={rows.map((r) => ({
            category: r.category,
            ret3y: (r.ret3y ?? 0) * 100,
            ret5y: (r.ret5y ?? 0) * 100,
          }))}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium text-slate-600">Category</th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-slate-600">Funds</th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-slate-600">Assets</th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-slate-600">Median 3Y</th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-slate-600">Median 5Y</th>
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
