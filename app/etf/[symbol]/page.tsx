import Link from "next/link"
import { notFound } from "next/navigation"
import { DIRECTORY, EXPENSE_RATIO_AS_OF, SNAPSHOT_DATE, sameIndexPeers } from "@/lib/data/directory"
import { cached } from "@/lib/cache"
import { stooqHistory } from "@/lib/providers/stooq"
import {
  annualisedVolatility,
  cagr,
  cumulativeFeeDrag,
  dailyReturns,
  maxDrawdown,
  sharpeRatio,
} from "@/lib/scoring/metrics"
import { money, pct } from "@/lib/format"
import { StatCard } from "@/components/v2/stat-card"
import { PriceTrendChart } from "@/components/v2/price-chart"

export const revalidate = 3600

export default async function EtfPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const entry = DIRECTORY.find((e) => e.symbol === symbol.toUpperCase())
  if (!entry) notFound()

  let live: {
    last: number
    change: number
    changePct: number
    series: { date: string; close: number }[]
    vol: number
    dd: number
    growth: number
    sharpe: number
    from: string
    to: string
  } | null = null
  let error: string | null = null

  try {
    const history = await cached(`etf:${entry.symbol}`, 6 * 60 * 60 * 1000, () =>
      stooqHistory.getDailyHistory(entry.symbol, 756)
    )
    const bars = history.value
    const closes = bars.map((b) => b.close)
    const last = closes[closes.length - 1]
    const prev = closes[closes.length - 2]

    if (last !== undefined && prev !== undefined && closes.length > 30) {
      const returns = dailyReturns(closes)
      live = {
        last,
        change: last - prev,
        changePct: (last / prev - 1) * 100,
        series: bars.slice(-45).map((b) => ({ date: b.date, close: b.close })),
        vol: annualisedVolatility(returns),
        dd: maxDrawdown(closes),
        growth: cagr(closes),
        sharpe: sharpeRatio(returns),
        from: bars[0]?.date ?? "",
        to: bars[bars.length - 1]?.date ?? "",
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Price history unavailable"
  }

  const indexPeers = sameIndexPeers(entry.symbol)

  const peers = DIRECTORY.filter(
    (e) => e.category === entry.category && e.symbol !== entry.symbol
  )
    .sort((a, b) => (b.aum ?? 0) - (a.aum ?? 0))
    .slice(0, 8)

  const up = (live?.changePct ?? 0) >= 0

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <nav className="mb-6 text-sm">
        <Link href="/screener" className="text-slate-600 hover:text-slate-900">
          ← Back to screener
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="font-mono text-3xl font-semibold">{entry.symbol}</h1>
        <p className="mt-1 text-lg text-slate-700">{entry.name}</p>
        <p className="mt-1 text-sm text-slate-500">
          {entry.category} · {entry.fundFamily}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-slate-700">
          Live price history could not be loaded ({error}). The figures below are omitted rather
          than estimated.
        </div>
      )}

      {live && (
        <>
          <section className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Last close"
              value={`$${live.last.toFixed(2)}`}
              note={`${up ? "+" : ""}${live.change.toFixed(2)} (${up ? "+" : ""}${live.changePct.toFixed(2)}%)`}
            />
            <StatCard label="Annualised return" value={pct(live.growth / 1, 1)} note="3-year" />
            <StatCard label="Volatility" value={pct(live.vol, 1)} note="annualised" />
            <StatCard
              label="Worst drawdown"
              value={pct(live.dd, 1)}
              note={`$10,000 → $${(10000 * (1 - live.dd)).toFixed(0)} at the trough`}
            />
          </section>

          <div className="mb-2 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-medium text-slate-700">45-day price trend</h2>
            <PriceTrendChart data={live.series} positive={up} />
          </div>
          <p className="mb-6 text-xs text-slate-500">
            Live daily closes, {live.from} to {live.to}. Sharpe {live.sharpe.toFixed(2)}.
          </p>
        </>
      )}

      {entry.expenseRatio !== null && (
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-medium text-slate-700">Cost</h2>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <span className="text-3xl font-semibold tabular-nums">
              {(entry.expenseRatio * 100).toFixed(3)}%
            </span>
            <span className="text-sm text-slate-600">
              costs about{" "}
              <span className="font-medium text-slate-900 tabular-nums">
                ${Math.round(10000 * cumulativeFeeDrag(entry.expenseRatio, 20)).toLocaleString("en-US")}
              </span>{" "}
              on a $10,000 balance held for 20 years
            </span>
          </div>
          {indexPeers.length > 0 && (
            <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
              Tracks the same index as{" "}
              {indexPeers.map((p, i) => (
                <span key={p.symbol}>
                  {i > 0 && ", "}
                  <Link href={`/etf/${p.symbol}`} className="font-mono hover:underline">
                    {p.symbol}
                  </Link>
                  {p.expenseRatio !== null && (
                    <span className="text-slate-500"> ({(p.expenseRatio * 100).toFixed(3)}%)</span>
                  )}
                </span>
              ))}
              . Same portfolio, so cost is the difference.{" "}
              <Link
                href={`/compare?symbols=${[entry.symbol, ...indexPeers.map((p) => p.symbol)].join(",")}`}
                className="underline underline-offset-2"
              >
                Compare them
              </Link>
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Issuer-published, verified {EXPENSE_RATIO_AS_OF}.
          </p>
        </section>
      )}

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          Snapshot figures{" "}
          <span className="font-normal text-slate-400">({SNAPSHOT_DATE}, not current)</span>
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-500">Assets</dt>
            <dd className="mt-0.5 tabular-nums">{money(entry.aum)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Yield</dt>
            <dd className="mt-0.5 tabular-nums">{pct(entry.yield)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">3Y return</dt>
            <dd className="mt-0.5 tabular-nums">{pct(entry.ret3y, 1)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">5Y return</dt>
            <dd className="mt-0.5 tabular-nums">{pct(entry.ret5y, 1)}</dd>
          </div>
        </dl>
      </section>

      {peers.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-slate-700">
            Largest other funds in {entry.category}
          </h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <tbody>
                {peers.map((p) => (
                  <tr key={p.symbol} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono font-medium">
                      <Link href={`/etf/${p.symbol}`} className="hover:underline">{p.symbol}</Link>
                    </td>
                    <td className="max-w-[260px] truncate px-4 py-2.5 text-slate-700">{p.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{money(p.aum)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{pct(p.ret3y, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Funds in one category often hold similar portfolios, so cost and structure usually
            matter more than the difference in headline returns.
          </p>
        </section>
      )}

      <p className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500">
        Not investment advice. Past performance does not predict future results.
      </p>
    </main>
  )
}
