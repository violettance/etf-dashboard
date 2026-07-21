import Link from "next/link"
import { GOALS, SCORE_DIMENSIONS } from "@/lib/data/goals"
import { UNIVERSE } from "@/lib/data/universe"

export const metadata = { title: "Methodology — Which ETF?" }

const DIMENSION_NOTES: Record<(typeof SCORE_DIMENSIONS)[number], string> = {
  cost: "Expense ratio, mapped so that 0.02% scores 100 and 0.75% scores 0. The explanation compounds the fee over 20 years, because a percentage on its own is hard to weigh.",
  liquidity:
    "Average daily volume and assets under management, on a log scale — the gap between $50M and $500M matters far more than between $50B and $500B.",
  trackRecord:
    "Years since inception. 20+ years spans several market cycles and scores 100; under one year scores 0.",
  risk: "Annualised volatility and maximum drawdown over the past three years of daily closes.",
  diversification:
    "Combined weight of the ten largest holdings. Requires the SEC EDGAR holdings integration, which is not yet wired up, so it currently reports as unavailable.",
}

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Methodology</h1>
      <p className="mt-3 text-muted-foreground">
        Any tool that puts numbers in front of you should show its working. Here is exactly what
        this one does.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-medium">The universe</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {UNIVERSE.length} funds, curated rather than exhaustive. There are roughly 4,000
          US-listed ETFs, but nobody chooses among 4,000 options — most are leveraged, thematic or
          too small to trade cheaply. Narrowing the field is the point of the tool, not a
          limitation of it. The list lives in <code>lib/data/universe.ts</code> and is versioned in
          git, so any change to it is visible in the history.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-medium">Where the data comes from</h2>
        <dl className="space-y-3 text-sm leading-relaxed">
          <div>
            <dt className="font-medium">Price history, volume, volatility, drawdown</dt>
            <dd className="text-muted-foreground">
              Stooq daily closes, fetched server-side and cached for six hours. No API key
              required.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Expense ratios and inception dates</dt>
            <dd className="text-muted-foreground">
              Issuer-published reference data, recorded in source with the date each figure was
              verified and a link to the issuer&apos;s own page. Expense ratios are set annually and
              rarely change, so they are treated as reference data rather than fetched from a
              metered API.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Holdings concentration</dt>
            <dd className="text-muted-foreground">
              Planned via SEC EDGAR N-PORT filings, which are public and need no key. Not yet
              implemented — the diversification dimension currently reports as unavailable rather
              than guessing.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-medium">The five dimensions</h2>
        <dl className="space-y-3 text-sm leading-relaxed">
          {SCORE_DIMENSIONS.map((d) => (
            <div key={d}>
              <dt className="font-medium capitalize">{d.replace(/([A-Z])/g, " $1")}</dt>
              <dd className="text-muted-foreground">{DIMENSION_NOTES[d]}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Each dimension is scored 0–100, then combined using the weights for the selected goal.
          When a dimension has no data it is excluded and the total is rescaled across the
          remaining weight, so a fund is never penalised for a missing figure — but the coverage
          percentage is shown so you can see how much of the score is actually evidenced.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-medium">Goal weightings</h2>
        <div className="space-y-4">
          {GOALS.map((g) => (
            <div key={g.id} className="rounded-md border p-4">
              <h3 className="font-medium">{g.label}</h3>
              <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                {SCORE_DIMENSIONS.filter((d) => g.weights[d] > 0)
                  .map((d) => `${d} ${Math.round(g.weights[d] * 100)}%`)
                  .join(" · ")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-medium">What this is not</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This tool does not recommend funds. It sorts published fund characteristics by
          weightings you control, so that differences between similar funds are easy to see. It
          does not know your circumstances, tax position or time horizon, and it is not investment
          advice. Past performance does not predict future results. A high weighted index means a
          fund scores well on the measured dimensions under the selected weightings — nothing
          more.
        </p>
      </section>

      <p className="mt-10 border-t pt-6 text-sm">
        <Link href="/" className="underline underline-offset-2">
          ← Back to goals
        </Link>
      </p>
    </main>
  )
}
