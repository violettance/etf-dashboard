/**
 * Investment goals.
 *
 * The product's entry point is a goal, not a filter. Each goal defines which
 * scoring dimensions matter and how much. Weights are surfaced in the UI and
 * can be overridden by the user, a recommendation engine that hides its
 * reasoning is just a ranked list with extra steps.
 */

export const SCORE_DIMENSIONS = [
  "cost",
  "liquidity",
  "trackRecord",
  "risk",
  "diversification",
] as const

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number]

export type Weights = Record<ScoreDimension, number>

export type Goal = {
  id: string
  label: string
  description: string
  /** Categories from the curated universe that qualify for this goal. */
  categories: string[]
  weights: Weights
  /** Explains to the user why these weights were chosen. */
  rationale: string
}

export const GOALS: readonly Goal[] = [
  {
    id: "broad-us-equity",
    label: "Broad US equity exposure",
    description: "Own the US stock market as a whole, as cheaply as possible.",
    categories: ["us-total-market", "us-large-cap"],
    weights: { cost: 0.4, liquidity: 0.2, diversification: 0.2, risk: 0.1, trackRecord: 0.1 },
    rationale:
      "Funds tracking broad US indices hold nearly identical portfolios, so their returns are " +
      "almost indistinguishable. What you actually choose between is cost and structure, which " +
      "is why cost carries the most weight here.",
  },
  {
    id: "dividend-income",
    label: "Dividend income",
    description: "Generate a durable income stream rather than maximising total return.",
    categories: ["dividend"],
    weights: { risk: 0.3, cost: 0.25, trackRecord: 0.25, diversification: 0.15, liquidity: 0.05 },
    rationale:
      "A high headline yield is easy to manufacture and easy to cut. Track record and risk are " +
      "weighted heavily because income investors care about the payment continuing, not about " +
      "this year's number.",
  },
  {
    id: "low-risk",
    label: "Low risk / capital preservation",
    description: "Protect capital, accept lower expected returns.",
    categories: ["bonds-aggregate", "bonds-treasury", "bonds-short"],
    weights: { risk: 0.4, cost: 0.3, liquidity: 0.2, trackRecord: 0.1, diversification: 0.0 },
    rationale:
      "For bond funds, cost consumes a much larger share of expected return than it does for " +
      "equities, so risk and cost dominate. Diversification is excluded because these funds " +
      "hold hundreds of issues by construction.",
  },
  {
    id: "global-diversified",
    label: "Global diversification",
    description: "Spread exposure across developed and emerging markets.",
    categories: ["global-equity", "international-developed", "emerging-markets"],
    weights: { diversification: 0.35, cost: 0.3, risk: 0.15, liquidity: 0.1, trackRecord: 0.1 },
    rationale:
      "The entire point of this goal is breadth, so concentration is penalised most. Many " +
      "'international' funds are far more concentrated in a handful of countries than their " +
      "name suggests.",
  },
  {
    id: "technology",
    label: "Technology sector",
    description: "Concentrated exposure to the technology sector.",
    categories: ["sector-technology"],
    weights: { cost: 0.3, diversification: 0.25, risk: 0.2, liquidity: 0.15, trackRecord: 0.1 },
    rationale:
      "Sector funds are concentrated by design, but they differ enormously in how concentrated. " +
      "Some hold a third of assets in three companies. Diversification is weighted to surface " +
      "that difference.",
  },
  {
    id: "gold-commodities",
    label: "Gold and commodities",
    description: "Non-correlated exposure outside stocks and bonds.",
    categories: ["commodities"],
    weights: { cost: 0.35, liquidity: 0.25, risk: 0.2, trackRecord: 0.2, diversification: 0.0 },
    rationale:
      "Commodity funds track the same underlying asset, so cost and liquidity are the real " +
      "differentiators. Diversification does not apply to a single-commodity holding.",
  },
]

export function getGoal(id: string): Goal | undefined {
  return GOALS.find((g) => g.id === id)
}

/** Weights must sum to 1 for the weighted score to stay on a 0-100 scale. */
export function normaliseWeights(weights: Weights): Weights {
  const total = SCORE_DIMENSIONS.reduce((sum, d) => sum + Math.max(0, weights[d]), 0)
  if (total === 0) {
    const equal = 1 / SCORE_DIMENSIONS.length
    return Object.fromEntries(SCORE_DIMENSIONS.map((d) => [d, equal])) as Weights
  }
  return Object.fromEntries(
    SCORE_DIMENSIONS.map((d) => [d, Math.max(0, weights[d]) / total])
  ) as Weights
}
