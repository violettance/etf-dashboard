import Link from "next/link"
import { topPerformers } from "@/lib/data/analytics"
import { money, pct } from "@/lib/format"
import { SnapshotBanner } from "@/components/v2/snapshot-banner"
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
  const rows = topPerformers(by, 15)

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
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
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <TopPerformersChart
          data={rows.map((r) => ({
            symbol: r.symbol,
            name: r.name,
            value: (r[by] ?? 0) * 100,
          }))}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium text-slate-600">Symbol</th>
              <th scope="col" className="px-4 py-3 font-medium text-slate-600">Name</th>
              <th scope="col" className="px-4 py-3 font-medium text-slate-600">Category</th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-slate-600">Assets</th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-slate-600">3Y</th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-slate-600">5Y</th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-slate-600">Yield</th>
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
        A high trailing return is a description of the past, not a prediction. Compare the 3Y and
        5Y columns: a fund leading on one but not the other had a single strong period rather than
        a durable pattern, the <Link href="/risk-return" className="underline underline-offset-2">risk &amp; return</Link>{" "}
        view plots this directly.
      </p>
    </main>
  )
}
