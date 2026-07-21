import { notFound } from "next/navigation"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { GOALS, getGoal, SCORE_DIMENSIONS, type ScoreDimension } from "@/lib/data/goals"
import { entriesForGoal, sameIndexPeers } from "@/lib/data/universe"
import { buildFactsForAll } from "@/lib/data/facts"
import { rankFunds } from "@/lib/scoring/score"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScoreBar } from "@/components/v2/score-bar"

/** Revalidate hourly: the underlying price history only changes after the close. */
export const revalidate = 3600

export function generateStaticParams() {
  return GOALS.map((g) => ({ goalId: g.id }))
}

const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  cost: "Cost",
  liquidity: "Liquidity",
  trackRecord: "Track record",
  risk: "Risk",
  diversification: "Diversification",
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ goalId: string }>
}) {
  const { goalId } = await params
  const goal = getGoal(goalId)
  if (!goal) notFound()

  const entries = entriesForGoal(goal)
  const results = await buildFactsForAll(entries)
  const ranked = rankFunds(
    results.map((r) => r.facts),
    goal.weights
  )
  const liveDataFailures = results.filter((r) => r.liveDataError !== null).length

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← All comparisons
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{goal.label}</h1>
        <p className="mt-2 text-muted-foreground">{goal.description}</p>
      </header>

      <Card className="mb-8 bg-muted/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">How this list is sorted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums">
            {SCORE_DIMENSIONS.filter((d) => goal.weights[d] > 0).map((d) => (
              <span key={d}>
                <span className="text-muted-foreground">{DIMENSION_LABELS[d]}</span>{" "}
                {Math.round(goal.weights[d] * 100)}%
              </span>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{goal.rationale}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This ordering reflects the weightings above. It is not a judgement about which fund is
            right for you — a fund lower down may suit you better if you weigh these factors
            differently.
          </p>
        </CardContent>
      </Card>

      {liveDataFailures > 0 && (
        <div className="mb-6 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-muted-foreground">
            Live price history was unavailable for {liveDataFailures} of {results.length} funds, so
            their risk and liquidity scores are marked <em>n/a</em>. Rankings use the dimensions
            that do have data.
          </p>
        </div>
      )}

      <ol className="space-y-4">
        {ranked.map((fund, index) => {
          const peers = sameIndexPeers(fund.facts.symbol)
          return (
            <li key={fund.facts.symbol}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <CardTitle className="text-base">
                      <span className="mr-2 text-muted-foreground tabular-nums">{index + 1}.</span>
                      <span className="font-mono">{fund.facts.symbol}</span>
                      <span className="ml-2 font-normal text-muted-foreground">
                        {fund.facts.name}
                      </span>
                    </CardTitle>
                    <div className="shrink-0 text-right">
                      <div className="text-2xl font-semibold tabular-nums text-muted-foreground">
                        {Math.round(fund.total)}
                      </div>
                      <div className="text-xs text-muted-foreground">weighted index</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fund.dimensions
                    .filter((d) => goal.weights[d.dimension] > 0)
                    .map((d) => (
                      <div key={d.dimension} className="grid gap-1 sm:grid-cols-[8rem_10rem_1fr] sm:items-center sm:gap-3">
                        <span className="text-sm text-muted-foreground">
                          {DIMENSION_LABELS[d.dimension]}
                        </span>
                        <ScoreBar score={d.score} />
                        <span className="text-sm leading-snug">{d.explanation}</span>
                      </div>
                    ))}

                  {peers.length > 0 && (
                    <p className="border-t pt-3 text-sm text-muted-foreground">
                      Tracks the same index as {peers.map((p) => p.symbol).join(", ")}. Funds
                      tracking one index hold near-identical portfolios, so their results tend to
                      differ mainly by cost and trading friction.
                    </p>
                  )}

                  {fund.coverage < 0.6 && (
                    <p className="text-xs text-muted-foreground">
                      Only {Math.round(fund.coverage * 100)}% of this goal&apos;s weighting is backed
                      by available data — treat this score as low-confidence.
                    </p>
                  )}
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ol>

      <p className="mt-10 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
        This page presents fund data for comparison. It does not recommend any fund and is not
        investment advice. Expense ratios are issuer-published reference data; risk metrics are
        calculated from daily closing prices over the past three years.
      </p>
    </main>
  )
}
