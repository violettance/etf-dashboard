import { describe, expect, it } from "vitest"
import { rankFunds, scoreFund, type FundFacts } from "../score"
import { getGoal, normaliseWeights, type Weights } from "@/lib/data/goals"

const base: FundFacts = {
  symbol: "TEST",
  name: "Test Fund",
  category: "us-large-cap",
  expenseRatio: 0.001,
  aum: 10e9,
  avgVolume: 3e6,
  inceptionDate: "2005-01-01",
  volatility: 0.16,
  maxDrawdown: 0.34,
  top10Weight: 0.28,
}

const equalWeights: Weights = normaliseWeights({
  cost: 1,
  liquidity: 1,
  trackRecord: 1,
  risk: 1,
  diversification: 1,
})

describe("scoreFund", () => {
  it("scores a cheaper fund above an otherwise identical expensive one", () => {
    const cheap = scoreFund({ ...base, expenseRatio: 0.0003 }, equalWeights)
    const pricey = scoreFund({ ...base, expenseRatio: 0.0065 }, equalWeights)
    expect(cheap.total).toBeGreaterThan(pricey.total)
  })

  it("keeps every dimension within 0-100", () => {
    const extreme = scoreFund(
      {
        ...base,
        expenseRatio: 0.05, // absurdly expensive
        aum: 1,
        avgVolume: 1,
        volatility: 3,
        maxDrawdown: 0.99,
        top10Weight: 1,
      },
      equalWeights
    )
    for (const d of extreme.dimensions) {
      if (d.score === null) continue
      expect(d.score).toBeGreaterThanOrEqual(0)
      expect(d.score).toBeLessThanOrEqual(100)
    }
    expect(extreme.total).toBeGreaterThanOrEqual(0)
    expect(extreme.total).toBeLessThanOrEqual(100)
  })

  it("reports reduced coverage when data is missing", () => {
    const complete = scoreFund(base, equalWeights)
    const partial = scoreFund({ ...base, expenseRatio: null, top10Weight: null }, equalWeights)
    expect(complete.coverage).toBeCloseTo(1, 10)
    expect(partial.coverage).toBeLessThan(complete.coverage)
  })

  it("does not penalise a fund for a missing field that carries no weight", () => {
    // Under the low-risk goal, diversification weight is 0.
    const weights = getGoal("low-risk")!.weights
    const withHoldings = scoreFund(base, weights)
    const withoutHoldings = scoreFund({ ...base, top10Weight: null }, weights)
    expect(withoutHoldings.total).toBeCloseTo(withHoldings.total, 10)
  })

  it("attaches an explanation to every dimension", () => {
    const scored = scoreFund(base, equalWeights)
    expect(scored.dimensions).toHaveLength(5)
    for (const d of scored.dimensions) {
      expect(d.explanation.length).toBeGreaterThan(0)
    }
  })

  it("quantifies the fee in the cost explanation rather than restating it", () => {
    const scored = scoreFund({ ...base, expenseRatio: 0.0065 }, equalWeights)
    const cost = scored.dimensions.find((d) => d.dimension === "cost")
    expect(cost?.explanation).toMatch(/20 years/)
  })

  it("returns a zero total when no dimension has data", () => {
    const empty = scoreFund(
      {
        ...base,
        expenseRatio: null,
        aum: null,
        avgVolume: null,
        inceptionDate: null,
        volatility: null,
        maxDrawdown: null,
        top10Weight: null,
      },
      equalWeights
    )
    expect(empty.total).toBe(0)
    expect(empty.coverage).toBe(0)
  })
})

describe("goal weighting", () => {
  it("ranks the cheap fund first for broad US equity, where cost dominates", () => {
    const goal = getGoal("broad-us-equity")!
    const cheapButNewer: FundFacts = {
      ...base,
      symbol: "CHEAP",
      expenseRatio: 0.0003,
      inceptionDate: "2018-01-01",
    }
    const expensiveButOlder: FundFacts = {
      ...base,
      symbol: "OLD",
      expenseRatio: 0.0095,
      inceptionDate: "1993-01-01",
    }
    const ranked = rankFunds([expensiveButOlder, cheapButNewer], goal.weights)
    expect(ranked[0]?.facts.symbol).toBe("CHEAP")
  })

  it("lets track record outrank cost under the dividend goal", () => {
    const goal = getGoal("dividend-income")!
    const cheapAndNew: FundFacts = {
      ...base,
      symbol: "NEW",
      expenseRatio: 0.0003,
      inceptionDate: "2024-01-01",
      maxDrawdown: 0.55,
      volatility: 0.3,
    }
    const dearerAndProven: FundFacts = {
      ...base,
      symbol: "PROVEN",
      expenseRatio: 0.0006,
      inceptionDate: "2003-01-01",
      maxDrawdown: 0.3,
      volatility: 0.14,
    }
    const ranked = rankFunds([cheapAndNew, dearerAndProven], goal.weights)
    expect(ranked[0]?.facts.symbol).toBe("PROVEN")
  })
})

describe("normaliseWeights", () => {
  it("rescales arbitrary weights to sum to 1", () => {
    const w = normaliseWeights({
      cost: 4,
      liquidity: 2,
      trackRecord: 2,
      risk: 1,
      diversification: 1,
    })
    const total = Object.values(w).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1, 10)
    expect(w.cost).toBeCloseTo(0.4, 10)
  })

  it("falls back to equal weights when everything is zero", () => {
    const w = normaliseWeights({
      cost: 0,
      liquidity: 0,
      trackRecord: 0,
      risk: 0,
      diversification: 0,
    })
    expect(w.cost).toBeCloseTo(0.2, 10)
  })

  it("ignores negative weights rather than inverting the scale", () => {
    const w = normaliseWeights({
      cost: -5,
      liquidity: 1,
      trackRecord: 1,
      risk: 1,
      diversification: 1,
    })
    expect(w.cost).toBe(0)
    expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10)
  })
})

describe("all goals", () => {
  it("defines weights summing to 1 for every goal", () => {
    for (const id of [
      "broad-us-equity",
      "dividend-income",
      "low-risk",
      "global-diversified",
      "technology",
      "gold-commodities",
    ]) {
      const goal = getGoal(id)
      expect(goal, `missing goal: ${id}`).toBeDefined()
      const sum = Object.values(goal!.weights).reduce((a, b) => a + b, 0)
      expect(sum, `weights for ${id} sum to ${sum}`).toBeCloseTo(1, 10)
    }
  })
})
