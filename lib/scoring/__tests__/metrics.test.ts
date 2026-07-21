import { describe, expect, it } from "vitest"
import {
  annualisedVolatility,
  beta,
  cagr,
  correlation,
  cumulativeFeeDrag,
  dailyReturns,
  maxDrawdown,
  mean,
  sharpeRatio,
  sortinoRatio,
  stdDev,
  TRADING_DAYS_PER_YEAR,
} from "../metrics"

describe("dailyReturns", () => {
  it("computes simple returns between consecutive closes", () => {
    const returns = dailyReturns([100, 110, 99])
    expect(returns).toHaveLength(2)
    expect(returns[0]).toBeCloseTo(0.1, 12)
    expect(returns[1]).toBeCloseTo(-0.1, 12)
  })

  it("returns an empty array for a series too short to have a return", () => {
    expect(dailyReturns([100])).toEqual([])
    expect(dailyReturns([])).toEqual([])
  })

  it("skips zero-priced bars rather than producing Infinity", () => {
    expect(dailyReturns([0, 100])).toEqual([])
  })
})

describe("stdDev", () => {
  it("uses the sample (n-1) denominator", () => {
    // Population sd of [2,4,4,4,5,5,7,9] is 2; sample sd is 2.13809...
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.13809, 4)
  })

  it("is NaN when there are fewer than two observations", () => {
    expect(stdDev([1])).toBeNaN()
  })
})

describe("maxDrawdown", () => {
  it("measures the largest peak-to-trough decline", () => {
    // Peak 100 -> trough 50 is a 50% drawdown; the later 60->54 dip is smaller.
    expect(maxDrawdown([100, 80, 50, 90, 60, 54])).toBeCloseTo(0.5, 10)
  })

  it("is zero for a monotonically rising series", () => {
    expect(maxDrawdown([10, 11, 12, 13])).toBe(0)
  })

  it("measures from the running peak, not the starting value", () => {
    // Rises to 200, then halves. Drawdown is 50%, not 0%.
    expect(maxDrawdown([100, 200, 100])).toBeCloseTo(0.5, 10)
  })
})

describe("cagr", () => {
  it("recovers a known annual growth rate", () => {
    // Doubling over exactly one trading year is a 100% CAGR.
    const closes = [100, ...Array.from({ length: TRADING_DAYS_PER_YEAR }, (_, i) => 100 * (2 ** ((i + 1) / TRADING_DAYS_PER_YEAR)))]
    expect(cagr(closes)).toBeCloseTo(1.0, 6)
  })

  it("is NaN when the series cannot imply a rate", () => {
    expect(cagr([100])).toBeNaN()
    expect(cagr([0, 100])).toBeNaN()
  })
})

describe("annualisedVolatility", () => {
  it("scales daily deviation by sqrt(252)", () => {
    const returns = [0.01, -0.01, 0.01, -0.01, 0.01, -0.01]
    const expected = stdDev(returns) * Math.sqrt(TRADING_DAYS_PER_YEAR)
    expect(annualisedVolatility(returns)).toBeCloseTo(expected, 12)
  })
})

describe("sharpeRatio", () => {
  it("is zero when the annualised return equals the risk-free rate", () => {
    const returns = Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? 0.01 : -0.01 + 0.0002))
    const rf = mean(returns) * TRADING_DAYS_PER_YEAR
    expect(sharpeRatio(returns, rf)).toBeCloseTo(0, 10)
  })

  it("is NaN for a constant series with no volatility", () => {
    expect(sharpeRatio([0.001, 0.001, 0.001])).toBeNaN()
  })
})

describe("sortinoRatio", () => {
  it("exceeds Sharpe when downside deviation is smaller than total deviation", () => {
    // Large upside moves, small downside moves.
    const returns = [0.05, -0.005, 0.04, -0.004, 0.06, -0.006, 0.05, -0.005]
    expect(sortinoRatio(returns)).toBeGreaterThan(sharpeRatio(returns))
  })

  it("is NaN when nothing falls below the target", () => {
    expect(sortinoRatio([0.01, 0.02, 0.03])).toBeNaN()
  })
})

describe("correlation", () => {
  it("is 1 for a perfectly positively related series", () => {
    expect(correlation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 10)
  })

  it("is -1 for a perfectly inversely related series", () => {
    expect(correlation([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 10)
  })

  it("is NaN when one series has no variance", () => {
    expect(correlation([1, 1, 1, 1], [1, 2, 3, 4])).toBeNaN()
  })
})

describe("beta", () => {
  it("is 1 when the asset tracks the benchmark exactly", () => {
    const benchmark = [0.01, -0.02, 0.015, 0.004, -0.01]
    expect(beta(benchmark, benchmark)).toBeCloseTo(1, 10)
  })

  it("is 2 when the asset amplifies the benchmark twofold", () => {
    const benchmark = [0.01, -0.02, 0.015, 0.004, -0.01]
    const levered = benchmark.map((r) => r * 2)
    expect(beta(levered, benchmark)).toBeCloseTo(2, 10)
  })
})

describe("cumulativeFeeDrag", () => {
  it("compounds a fee over multiple years", () => {
    // 0.65% for 20 years compounds to well over a simple 13%.
    expect(cumulativeFeeDrag(0.0065, 20)).toBeCloseTo(1 - 0.9935 ** 20, 12)
    expect(cumulativeFeeDrag(0.0065, 20)).toBeGreaterThan(0.12)
  })

  it("is zero for a zero fee or a zero horizon", () => {
    expect(cumulativeFeeDrag(0, 20)).toBe(0)
    expect(cumulativeFeeDrag(0.005, 0)).toBe(0)
  })

  it("shows the gap between a cheap and an expensive fund", () => {
    const cheap = cumulativeFeeDrag(0.0003, 20)
    const expensive = cumulativeFeeDrag(0.0065, 20)
    expect(expensive - cheap).toBeGreaterThan(0.11)
  })
})
