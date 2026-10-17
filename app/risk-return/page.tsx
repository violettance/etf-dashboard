import { consistencyScatter } from "@/lib/data/analytics"
import { SnapshotBanner } from "@/components/v2/snapshot-banner"
import { ConsistencyScatter } from "@/components/v2/analytics-charts"

export const dynamic = "force-static"

export default function RiskReturnPage() {
  const points = consistencyScatter(500)
  const aboveLine = points.filter((p) => p.y > p.x + 5).length
  const belowLine = points.filter((p) => p.y < p.x - 5).length

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Risk &amp; return patterns</h1>
        <p className="mt-1 text-sm text-slate-600">
          Three-year return plotted against five-year return for the 500 largest funds. Bubble size
          is assets under management.
        </p>
      </header>

      <SnapshotBanner note="Open any fund for live volatility and drawdown." />

      <div className="mb-4 surface-card p-4">
        <ConsistencyScatter data={points} />
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <div className="text-2xl font-semibold tabular-nums">{aboveLine}</div>
          <div className="mt-1 text-xs text-slate-600">
            funds well above the diagonal, recent strength that the longer record does not support
          </div>
        </div>
        <div className="surface-card p-4">
          <div className="text-2xl font-semibold tabular-nums">{belowLine}</div>
          <div className="mt-1 text-xs text-slate-600">
            funds well below, a weaker recent run than their five-year record
          </div>
        </div>
        <div className="surface-card p-4">
          <div className="text-2xl font-semibold tabular-nums">
            {points.length - aboveLine - belowLine}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            near the diagonal, consistent across both horizons
          </div>
        </div>
      </section>

      <div className="surface-card p-5 text-sm leading-relaxed text-slate-700">
        <h2 className="mb-2 font-medium">How to read this</h2>
        <p>
          The dashed diagonal marks funds whose three-year and five-year annualised returns are the
          same. A point sitting far above it earned most of its recent record in the last three
          years; the same fund looked considerably worse over five. That distinction is invisible
          in a ranked &ldquo;top performers&rdquo; list, which is exactly why sorting by a single
          trailing return is a poor way to choose a fund.
        </p>
        <p className="mt-3 text-slate-600">
          Leveraged and inverse products, and funds under $50M in assets, are excluded, their
          returns are extreme enough to compress everything else into an unreadable cluster.
        </p>
      </div>
    </main>
  )
}
