import { cumulativeFeeDrag } from "./metrics"
import {
  normaliseWeights,
  SCORE_DIMENSIONS,
  type ScoreDimension,
  type Weights,
} from "@/lib/data/goals"

/**
 * Scoring engine.
 *
 * Turns raw fund facts into a 0-100 score per dimension, then combines them
 * using goal weights. Every score carries the sentence that explains it, so the
 * UI never has to invent justification for a ranking.
 */

export type FundFacts = {
  symbol: string
  name: string
  category: string
  /** Annual expense ratio as a fraction, e.g. 0.0003. */
  expenseRatio: number | null
  /** Assets under management in USD. */
  aum: number | null
  /** Average daily share volume. */
  avgVolume: number | null
  inceptionDate: string | null
  /** Annualised volatility as a fraction. */
  volatility: number | null
  /** Maximum drawdown as a positive fraction. */
  maxDrawdown: number | null
  /** Combined weight of the ten largest holdings, as a fraction. */
  top10Weight: number | null
}

export type DimensionScore = {
  dimension: ScoreDimension
  /** 0-100, or null when the input data is missing. */
  score: number | null
  explanation: string
}

export type ScoredFund = {
  facts: FundFacts
  dimensions: DimensionScore[]
  /** Weighted 0-100 total across dimensions with available data. */
  total: number
  /** Fraction of weight backed by real data. Low values mean low confidence. */
  coverage: number
}

/** Maps a value onto 0-100 where `best` scores 100 and `worst` scores 0. */
function scale(value: number, best: number, worst: number): number {
  if (best === worst) return 50
  const raw = ((value - worst) / (best - worst)) * 100
  return Math.max(0, Math.min(100, raw))
}

function pct(fraction: number, digits = 2): string {
  return `${(fraction * 100).toFixed(digits)}%`
}

function scoreCost(f: FundFacts): DimensionScore {
  if (f.expenseRatio === null) {
    return {
      dimension: "cost",
      score: null,
      explanation: "Expense ratio unavailable, so cost could not be scored.",
    }
  }
  // 0.02% is about as cheap as US index funds get; 0.75% is expensive for one.
  const score = scale(f.expenseRatio, 0.0002, 0.0075)
  const drag20y = cumulativeFeeDrag(f.expenseRatio, 20)
  return {
    dimension: "cost",
    score,
    explanation: `Expense ratio ${pct(f.expenseRatio, 3)}, compounds to roughly ${pct(drag20y, 1)} of your balance over 20 years.`,
  }
}

function scoreLiquidity(f: FundFacts): DimensionScore {
  if (f.aum === null && f.avgVolume === null) {
    return {
      dimension: "liquidity",
      score: null,
      explanation: "No AUM or volume data available.",
    }
  }
  // Log scale: the difference between $50M and $500M matters far more than
  // between $50B and $500B.
  const aumScore = f.aum === null ? null : scale(Math.log10(Math.max(f.aum, 1)), 11, 7.7)
  const volScore =
    f.avgVolume === null ? null : scale(Math.log10(Math.max(f.avgVolume, 1)), 7, 4)

  const parts = [aumScore, volScore].filter((s): s is number => s !== null)
  const score = parts.reduce((a, b) => a + b, 0) / parts.length

  const detail: string[] = []
  if (f.aum !== null) detail.push(`$${(f.aum / 1e9).toFixed(1)}B in assets`)
  if (f.avgVolume !== null) detail.push(`${(f.avgVolume / 1e6).toFixed(1)}M average daily volume`)

  return {
    dimension: "liquidity",
    score,
    explanation: `${detail.join(", ")}, ${score > 70 ? "trades with tight spreads" : score > 40 ? "adequately liquid for most investors" : "thin enough that spreads may cost more than the expense ratio"}.`,
  }
}

function scoreTrackRecord(f: FundFacts): DimensionScore {
  if (f.inceptionDate === null) {
    return { dimension: "trackRecord", score: null, explanation: "Inception date unavailable." }
  }
  const years = (Date.now() - new Date(f.inceptionDate).getTime()) / (365.25 * 24 * 3600 * 1000)
  if (!Number.isFinite(years) || years < 0) {
    return { dimension: "trackRecord", score: null, explanation: "Inception date unreadable." }
  }
  // 20+ years spans multiple full market cycles; under 3 years spans none.
  const score = scale(years, 20, 1)
  return {
    dimension: "trackRecord",
    score,
    explanation:
      years >= 15
        ? `${years.toFixed(0)} years of history, has been tested through multiple market cycles including 2008 and 2020.`
        : years >= 5
          ? `${years.toFixed(0)} years of history, covers at least one significant drawdown.`
          : `Only ${years.toFixed(1)} years of history, has not been tested through a full market cycle.`,
  }
}

function scoreRisk(f: FundFacts): DimensionScore {
  if (f.volatility === null && f.maxDrawdown === null) {
    return { dimension: "risk", score: null, explanation: "Insufficient price history." }
  }
  // 5% annualised volatility is bond-like; 40% is a volatile sector fund.
  const volScore = f.volatility === null ? null : scale(f.volatility, 0.05, 0.4)
  const ddScore = f.maxDrawdown === null ? null : scale(f.maxDrawdown, 0.05, 0.6)

  const parts = [volScore, ddScore].filter((s): s is number => s !== null)
  const score = parts.reduce((a, b) => a + b, 0) / parts.length

  const detail: string[] = []
  if (f.volatility !== null) detail.push(`${pct(f.volatility, 1)} annualised volatility`)
  if (f.maxDrawdown !== null) detail.push(`worst drawdown ${pct(f.maxDrawdown, 1)}`)

  return {
    dimension: "risk",
    score,
    explanation: `${detail.join(", ")}, a ${pct(f.maxDrawdown ?? 0, 0)} fall means $10,000 became $${(10000 * (1 - (f.maxDrawdown ?? 0))).toFixed(0)} at the trough.`,
  }
}

function scoreDiversification(f: FundFacts): DimensionScore {
  if (f.top10Weight === null) {
    return {
      dimension: "diversification",
      score: null,
      explanation: "Holdings breakdown unavailable.",
    }
  }
  // 15% in the top ten is genuinely broad; 60% is highly concentrated.
  const score = scale(f.top10Weight, 0.15, 0.6)
  return {
    dimension: "diversification",
    score,
    explanation:
      f.top10Weight > 0.45
        ? `Top 10 holdings are ${pct(f.top10Weight, 0)} of the fund, concentrated enough that a handful of companies drive most of the return.`
        : `Top 10 holdings are ${pct(f.top10Weight, 0)} of the fund, broadly spread.`,
  }
}

const SCORERS: Record<ScoreDimension, (f: FundFacts) => DimensionScore> = {
  cost: scoreCost,
  liquidity: scoreLiquidity,
  trackRecord: scoreTrackRecord,
  risk: scoreRisk,
  diversification: scoreDiversification,
}

export function scoreFund(facts: FundFacts, weights: Weights): ScoredFund {
  const normalised = normaliseWeights(weights)
  const dimensions = SCORE_DIMENSIONS.map((d) => SCORERS[d](facts))

  let weighted = 0
  let coverage = 0
  for (const dim of dimensions) {
    const weight = normalised[dim.dimension]
    if (dim.score === null || weight === 0) continue
    weighted += dim.score * weight
    coverage += weight
  }

  // Rescale by covered weight so a fund is not penalised for a missing field
  // that carries little importance for this goal.
  const total = coverage > 0 ? weighted / coverage : 0

  return { facts, dimensions, total, coverage }
}

export function rankFunds(funds: readonly FundFacts[], weights: Weights): ScoredFund[] {
  return funds
    .map((f) => scoreFund(f, weights))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total
      // Prefer the better-documented fund when scores tie.
      return b.coverage - a.coverage
    })
}
