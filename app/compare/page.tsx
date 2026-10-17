import Link from "next/link"
import { bySymbols, EXPENSE_RATIO_AS_OF, SNAPSHOT_DATE } from "@/lib/data/directory"
import { cumulativeFeeDrag } from "@/lib/scoring/metrics"
import { money, pct } from "@/lib/format"

export const dynamic = "force-dynamic"

const MAX = 4
const HORIZON_YEARS = 20
const BALANCE = 10_000

/** Rows where a spread across the compared funds is worth pointing out. */
function spread(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null)
  if (present.length < 2) return null
  return Math.max(...present) - Math.min(...present)
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const raw = Array.isArray(sp.symbols) ? sp.symbols[0] : sp.symbols
  const requested = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX)

  const funds = bySymbols(requested)

  if (funds.length === 0) {
    return (
      <main className="mr-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Compare funds</h1>
        <p className="mt-2 text-sm text-slate-600">
          Add up to {MAX} symbols to see them side by side.
        </p>
        <form method="get" className="mt-6 flex flex-wrap items-end gap-3 surface-card p-4">
          <div className="min-w-[280px] flex-1">
            <label htmlFor="symbols" className="mb-1 block text-xs font-medium text-slate-600">
              Symbols, comma separated
            </label>
            <input
              id="symbols"
              name="symbols"
              placeholder="VOO, SPY, IVV"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#FF3366] focus:ring-2 focus:ring-[#FF3366]/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Compare
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Or try{" "}
          <Link href="/compare?symbols=VOO,SPY,IVV,SPLG" className="underline underline-offset-2">
            VOO, SPY, IVV, SPLG
          </Link>{" "}
          , four funds tracking the same index.
        </p>
      </main>
    )
  }

  const fees = funds.map((f) => f.expenseRatio)
  const feeSpread = spread(fees)
  const sameIndex =
    funds.every((f) => f.tracks !== null) &&
    new Set(funds.map((f) => f.tracks)).size === 1 &&
    funds.length > 1

  const rows: { label: string; render: (i: number) => string; muted?: boolean }[] = [
    { label: "Category", render: (i) => funds[i]?.category ?? "n/a" },
    { label: "Issuer", render: (i) => funds[i]?.fundFamily ?? "n/a" },
    {
      label: "Expense ratio",
      render: (i) => {
        const v = funds[i]?.expenseRatio
        return v === null || v === undefined ? "n/a" : `${(v * 100).toFixed(3)}%`
      },
    },
    {
      label: `Fee cost on $${BALANCE.toLocaleString("en-US")} over ${HORIZON_YEARS}y`,
      render: (i) => {
        const v = funds[i]?.expenseRatio
        if (v === null || v === undefined) return "n/a"
        return `$${Math.round(BALANCE * cumulativeFeeDrag(v, HORIZON_YEARS)).toLocaleString("en-US")}`
      },
    },
    { label: "Assets", render: (i) => money(funds[i]?.aum ?? null), muted: true },
    { label: "Yield", render: (i) => pct(funds[i]?.yield ?? null), muted: true },
    { label: "3Y return", render: (i) => pct(funds[i]?.ret3y ?? null, 1), muted: true },
    { label: "5Y return", render: (i) => pct(funds[i]?.ret5y ?? null, 1), muted: true },
    { label: "Inception", render: (i) => funds[i]?.inceptionDate ?? "n/a" },
  ]

  return (
    <main className="mr-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Compare funds</h1>
        <p className="mt-1 text-sm text-slate-600">
          {funds.map((f) => f.symbol).join(", ")}
        </p>
      </header>

      {sameIndex && (
        <div className="mb-6 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm">
          <span className="font-medium">These funds track the same index</span>{" "}
          <span className="text-slate-600">
            ({funds[0]?.tracks}). They hold near-identical portfolios, so their returns will be
            close to indistinguishable over time. Cost and liquidity are what actually differ.
          </span>
        </div>
      )}

      {feeSpread !== null && feeSpread > 0 && (
        <div className="mb-6 surface-card p-4">
          <h2 className="text-sm font-medium text-slate-700">What the fee difference costs</h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            $
            {Math.round(
              BALANCE * cumulativeFeeDrag(feeSpread, HORIZON_YEARS)
            ).toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            The gap between the cheapest and most expensive fund here is{" "}
            {(feeSpread * 100).toFixed(3)} percentage points. On a $
            {BALANCE.toLocaleString("en-US")} balance held for {HORIZON_YEARS} years, that
            compounds to roughly this much, before any difference in returns.
          </p>
        </div>
      )}

      <div className="overflow-x-auto surface-card">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">
                Measure
              </th>
              {funds.map((f) => (
                <th key={f.symbol} scope="col" className="px-4 py-3 text-left">
                  <Link href={`/etf/${f.symbol}`} className="font-mono font-semibold hover:underline">
                    {f.symbol}
                  </Link>
                  <div className="max-w-[200px] truncate text-xs font-normal text-slate-500">
                    {f.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-100 last:border-0">
                <th scope="row" className="px-4 py-2.5 text-left font-normal text-slate-600">
                  {row.label}
                  {row.muted && (
                    <span className="ml-1 text-xs text-slate-400" title={`From the ${SNAPSHOT_DATE} snapshot`}>
                      *
                    </span>
                  )}
                </th>
                {funds.map((f, i) => (
                  <td key={f.symbol} className="px-4 py-2.5 tabular-nums">
                    {row.render(i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[260px] flex-1">
          <label htmlFor="symbols" className="mb-1 block text-xs font-medium text-slate-600">
            Change the comparison
          </label>
          <input
            id="symbols"
            name="symbols"
            defaultValue={funds.map((f) => f.symbol).join(", ")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#FF3366] focus:ring-2 focus:ring-[#FF3366]/20"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Update
        </button>
      </form>

      <p className="mt-8 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
        * from the {SNAPSHOT_DATE} snapshot and not current. Expense ratios are issuer-published
        and were verified on {EXPENSE_RATIO_AS_OF}; funds showing n/a have not been verified rather
        than being free. This page is for comparison and is not investment advice.
      </p>
    </main>
  )
}
