/**
 * Risk and return metrics.
 *
 * Every function here is pure and takes plain numbers, which is what makes the
 * scoring engine testable against known values. Nothing in this file touches
 * the network, the database, or React.
 *
 * Conventions:
 *  - Returns are simple (not log) returns expressed as fractions: 0.05 = +5%.
 *  - "Annualised" uses 252 trading days.
 */

export const TRADING_DAYS_PER_YEAR = 252

/** Daily simple returns from a chronological close-price series. */
export function dailyReturns(closes: readonly number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1]
    const curr = closes[i]
    if (prev === undefined || curr === undefined || prev === 0) continue
    out.push(curr / prev - 1)
  }
  return out
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) return NaN
  let sum = 0
  for (const v of values) sum += v
  return sum / values.length
}

/** Sample standard deviation (n-1 denominator). */
export function stdDev(values: readonly number[]): number {
  if (values.length < 2) return NaN
  const m = mean(values)
  let acc = 0
  for (const v of values) acc += (v - m) ** 2
  return Math.sqrt(acc / (values.length - 1))
}

/** Annualised volatility from daily returns. */
export function annualisedVolatility(returns: readonly number[]): number {
  return stdDev(returns) * Math.sqrt(TRADING_DAYS_PER_YEAR)
}

/**
 * Compound annual growth rate implied by a close series.
 * `periodsPerYear` defaults to daily observations.
 */
export function cagr(closes: readonly number[], periodsPerYear = TRADING_DAYS_PER_YEAR): number {
  const first = closes[0]
  const last = closes[closes.length - 1]
  if (first === undefined || last === undefined || first <= 0 || closes.length < 2) return NaN
  const years = (closes.length - 1) / periodsPerYear
  if (years <= 0) return NaN
  return (last / first) ** (1 / years) - 1
}

/**
 * Maximum peak-to-trough decline, returned as a positive fraction.
 * A result of 0.34 means the series fell 34% below its running peak.
 */
export function maxDrawdown(closes: readonly number[]): number {
  let peak = -Infinity
  let worst = 0
  for (const close of closes) {
    if (close > peak) peak = close
    if (peak > 0) {
      const drawdown = 1 - close / peak
      if (drawdown > worst) worst = drawdown
    }
  }
  return worst
}

/**
 * Annualised Sharpe ratio.
 * `riskFreeRate` is an annual fraction, e.g. 0.04 for 4%.
 */
export function sharpeRatio(returns: readonly number[], riskFreeRate = 0): number {
  const vol = annualisedVolatility(returns)
  if (!Number.isFinite(vol) || vol === 0) return NaN
  const annualReturn = mean(returns) * TRADING_DAYS_PER_YEAR
  return (annualReturn - riskFreeRate) / vol
}

/**
 * Sortino ratio — like Sharpe, but only penalises downside deviation.
 * More appropriate than Sharpe when a fund's upside is asymmetric.
 */
export function sortinoRatio(returns: readonly number[], riskFreeRate = 0): number {
  const dailyTarget = riskFreeRate / TRADING_DAYS_PER_YEAR
  const downside = returns.filter((r) => r < dailyTarget).map((r) => (r - dailyTarget) ** 2)
  if (downside.length === 0) return NaN
  const downsideDeviation =
    Math.sqrt(mean(downside)) * Math.sqrt(TRADING_DAYS_PER_YEAR)
  if (!Number.isFinite(downsideDeviation) || downsideDeviation === 0) return NaN
  const annualReturn = mean(returns) * TRADING_DAYS_PER_YEAR
  return (annualReturn - riskFreeRate) / downsideDeviation
}

/** Pearson correlation between two equal-length return series. */
export function correlation(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 2) return NaN
  const aSlice = a.slice(a.length - n)
  const bSlice = b.slice(b.length - n)
  const ma = mean(aSlice)
  const mb = mean(bSlice)

  let cov = 0
  let va = 0
  let vb = 0
  for (let i = 0; i < n; i++) {
    const da = (aSlice[i] as number) - ma
    const db = (bSlice[i] as number) - mb
    cov += da * db
    va += da * da
    vb += db * db
  }
  if (va === 0 || vb === 0) return NaN
  return cov / Math.sqrt(va * vb)
}

/**
 * Beta of `asset` against `benchmark`, both as daily return series.
 * Beta of 1.0 means the fund moves in line with the benchmark.
 */
export function beta(asset: readonly number[], benchmark: readonly number[]): number {
  const n = Math.min(asset.length, benchmark.length)
  if (n < 2) return NaN
  const a = asset.slice(asset.length - n)
  const b = benchmark.slice(benchmark.length - n)
  const ma = mean(a)
  const mb = mean(b)

  let cov = 0
  let varB = 0
  for (let i = 0; i < n; i++) {
    const da = (a[i] as number) - ma
    const db = (b[i] as number) - mb
    cov += da * db
    varB += db * db
  }
  if (varB === 0) return NaN
  return cov / varB
}

/**
 * Cumulative cost of an expense ratio over time, as a fraction of the
 * portfolio. This is what turns an abstract "0.03% vs 0.65%" into the concrete
 * number a user actually cares about.
 */
export function cumulativeFeeDrag(expenseRatio: number, years: number): number {
  if (expenseRatio < 0 || years < 0) return NaN
  return 1 - (1 - expenseRatio) ** years
}
