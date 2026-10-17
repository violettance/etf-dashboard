import Link from "next/link"
import {
  universeStats,
  categoryPerformance,
  issuerConcentration,
  weightedReturns,
  thinlyTraded,
} from "@/lib/data/analytics"
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
    maxExpenseRatio: null,
    feesOnly: false,
    sort: "aum",
    dir: "desc",
    page: 1,
    perPage: 1,
  })
  const categories = categoryPerformance(10)
  const concentration = issuerConcentration(10)
  const weighted3y = weightedReturns("ret3y")
  const thin = thinlyTraded()

  return (
    <main className="mx-auto max-w-7xl px-5 py-7 sm:px-6 sm:py-9">
      <SnapshotBanner />

      <section className="brand-hero relative mb-8 grid gap-8 overflow-hidden p-6 sm:p-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
        <div className="relative z-10 max-w-3xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#00E5FF]">
            <span className="h-2 w-2 bg-[#FF3366]" /> ETF decision workspace
          </p>
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Find funds worth comparing.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Narrow {num(stats.total)} US-listed ETFs into a shortlist, then compare fees, assets,
            yield and track record with the source and data date in view.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/screener" className="brand-button">
              Open the screener
            </Link>
            <Link href="/compare" className="brand-button-secondary">
              Compare funds
            </Link>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
          {[
            ["01", "Narrow", "Filter the universe"],
            ["02", "Compare", "Put similar funds side by side"],
            ["03", "Verify", "Check costs and evidence"],
          ].map(([step, title, detail]) => (
            <div key={step} className="border border-white/20 bg-white/[0.06] p-3 sm:p-3.5">
              <span className="font-mono text-xs font-bold text-[#00E5FF]">{step}</span>
              <p className="mt-1 font-display text-sm font-bold sm:text-base">{title}</p>
              <p className="mt-1 hidden text-xs leading-relaxed text-white/60 sm:block">{detail}</p>
            </div>
          ))}
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border-[36px] border-[#00E5FF]/10"
        />
      </section>

      <section className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="brand-kicker">Market snapshot</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
            The universe at a glance
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          Snapshot figures are historical; see the date above.
        </span>
      </section>

      <section
        className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
        aria-label="ETF market metrics"
      >
        <StatCard
          label="ETFs tracked"
          value={num(stats.total)}
          note={`${num(stats.investable)} meet the asset and structure screen`}
        />
        <StatCard
          label="Combined assets"
          value={money(stats.totalAum)}
          note="Across funds with reported assets"
        />
        <StatCard
          label="Issuers"
          value={num(stats.issuers)}
          note={`${stats.categories} categories`}
        />
        <StatCard
          label="Median 3Y return"
          value={pct(stats.medianRet3y, 1)}
          note={`5Y ${pct(stats.medianRet5y, 1)} · yield ${pct(stats.medianYield, 2)}`}
        />
      </section>

      <section className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="brand-kicker">Context before conclusions</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
            What a fund count can hide
          </h2>
        </div>
        <p className="max-w-xl text-xs leading-relaxed text-slate-500">
          Returns are medians, with leveraged and inverse products excluded where noted. These
          signals describe the market; they do not rank funds for your circumstances.
        </p>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            Assets cluster around a few issuers
          </h3>
          <p className="mt-2 font-display text-4xl font-bold tabular-nums text-[#FF3366]">
            {(concentration.topShare * 100).toFixed(0)}%
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            of reported assets sit with the 10 largest issuers, out of {num(concentration.issuers)}.
          </p>
          <ul className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-xs">
            {concentration.top.slice(0, 5).map((r) => (
              <li key={r.issuer} className="flex justify-between gap-3">
                <span className="truncate font-medium text-slate-700">{r.issuer}</span>
                <span className="shrink-0 tabular-nums text-slate-500">
                  {money(r.aum)} · {r.funds} funds
                </span>
              </li>
            ))}
          </ul>
        </div>

        {weighted3y && (
          <div className="surface-card p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-700">
              The median fund is not the median dollar
            </h3>
            <p className="mt-2 font-display text-4xl font-bold tabular-nums text-[#007D89]">
              {weighted3y.gap >= 0 ? "+" : ""}
              {(weighted3y.gap * 100).toFixed(2)}pp
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Asset-weighted 3Y return is{" "}
              <strong className="text-slate-900">{(weighted3y.weighted * 100).toFixed(2)}%</strong>{" "}
              against{" "}
              <strong className="text-slate-900">{(weighted3y.equal * 100).toFixed(2)}%</strong>{" "}
              equal-weighted. The former reflects where the assets sat; neither is a forecast.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-100 p-3">
                <span className="block text-slate-500">Asset-weighted</span>
                <strong className="mt-1 block text-base tabular-nums">
                  {(weighted3y.weighted * 100).toFixed(2)}%
                </strong>
              </div>
              <div className="bg-[#00E5FF]/30 p-3">
                <span className="block text-slate-600">Equal-weighted</span>
                <strong className="mt-1 block text-base tabular-nums">
                  {(weighted3y.equal * 100).toFixed(2)}%
                </strong>
              </div>
            </div>
          </div>
        )}

        <div className="surface-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-700">
            Some funds are hard to trade cheaply
          </h3>
          <p className="mt-2 font-display text-4xl font-bold tabular-nums text-[#0A0A0A]">
            {(thin.share * 100).toFixed(0)}%
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            fall below the $50M asset or 10,000-share volume cutoffs in this snapshot; missing
            values are counted below the cutoffs too. Low liquidity can make spreads matter
            alongside the stated fee.
          </p>
          <Link
            href="/screener"
            className="mt-5 inline-flex text-xs font-bold text-[#C61F4B] underline decoration-2 underline-offset-4 hover:text-[#0A0A0A]"
          >
            Screen by assets and fee →
          </Link>
        </div>
      </section>

      <section className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="brand-kicker">Explore the data</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
            How funds are distributed
          </h2>
        </div>
        <Link
          href="/categories"
          className="text-xs font-bold underline decoration-[#FF3366] decoration-2 underline-offset-4 hover:text-[#C61F4B]"
        >
          Browse category analysis →
        </Link>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Largest categories by fund count
          </h3>
          <CategoryMixChart data={view.categoryMix} />
        </div>
        <div className="surface-card p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Distribution of dividend yields
          </h3>
          <YieldHistogram data={view.yieldBuckets} />
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="brand-kicker">Compare like with like</p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
              Category performance
            </h2>
          </div>
          <span className="text-xs text-slate-500">Median 3Y vs 5Y returns</span>
        </div>
        <div className="surface-card p-4 sm:p-5">
          <CategoryPerformanceChart
            data={categories.map((c) => ({
              category: c.category,
              ret3y: (c.ret3y ?? 0) * 100,
              ret5y: (c.ret5y ?? 0) * 100,
            }))}
          />
        </div>
      </section>

      <section className="brand-hero flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#00E5FF]">
            Ready to narrow the list?
          </p>
          <h2 className="mt-1 font-display text-xl font-bold">
            Start with the fund you already know.
          </h2>
          <p className="mt-1 text-xs text-white/70">
            Search by ticker, name or issuer, then compare the trade-offs.
          </p>
        </div>
        <Link href="/screener" className="brand-button shrink-0">
          Go to ETF screener
        </Link>
      </section>
    </main>
  )
}
