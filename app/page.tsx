import Link from "next/link"
import { universeStats, categoryPerformance } from "@/lib/data/analytics"
import { screen } from "@/lib/data/directory"
import { money, num, pct } from "@/lib/format"
import { StatCard } from "@/components/v2/stat-card"
import { SnapshotBanner } from "@/components/v2/snapshot-banner"
import { CategoryMixChart, YieldHistogram } from "@/components/v2/snapshot-charts"
import { CategoryPerformanceChart } from "@/components/v2/analytics-charts"

export const dynamic = "force-static"

export default function OverviewPage() {
  const stats = universeStats()
  const view = screen({
    q: "",
    category: "",
    minAum: null,
    minYield: null,
    sort: "aum",
    dir: "desc",
    page: 1,
    perPage: 1,
  })
  const categories = categoryPerformance(10)

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-slate-600">
          The shape of the US-listed ETF market, and where to start narrowing it down.
        </p>
      </header>

      <SnapshotBanner />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="ETFs tracked" value={num(stats.total)} note={`${num(stats.investable)} investable`} />
        <StatCard label="Combined assets" value={money(stats.totalAum)} />
        <StatCard label="Issuers" value={num(stats.issuers)} note={`${stats.categories} categories`} />
        <StatCard
          label="Median 3Y return"
          value={pct(stats.medianRet3y, 1)}
          note={`5Y ${pct(stats.medianRet5y, 1)} · median yield ${pct(stats.medianYield, 2)}`}
        />
      </section>

      <p className="mb-6 text-xs leading-relaxed text-slate-500">
        Medians rather than means, and leveraged and inverse funds excluded: a handful of 3x
        products have returns extreme enough to drag an average into meaninglessness.
      </p>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Largest categories by fund count</h2>
          <CategoryMixChart data={view.categoryMix} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Distribution of dividend yields</h2>
          <YieldHistogram data={view.yieldBuckets} />
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-slate-700">
            Category performance — median 3Y vs 5Y
          </h2>
          <Link href="/categories" className="text-xs text-slate-500 underline underline-offset-2">
            All categories
          </Link>
        </div>
        <CategoryPerformanceChart
          data={categories.map((c) => ({
            category: c.category,
            ret3y: (c.ret3y ?? 0) * 100,
            ret5y: (c.ret5y ?? 0) * 100,
          }))}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/screener", title: "Screener", body: "Filter 4,148 funds by category, assets and yield." },
          { href: "/risk-return", title: "Risk & return", body: "Which funds delivered consistently, and which had one good run." },
          { href: "/performers", title: "Top performers", body: "Leaders by 3Y, 5Y and yield — with the caveats." },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-400"
          >
            <div className="text-sm font-medium">{c.title}</div>
            <div className="mt-1 text-xs text-slate-600">{c.body}</div>
          </Link>
        ))}
      </section>
    </main>
  )
}
