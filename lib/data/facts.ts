import "server-only"
import { cached } from "@/lib/cache"
import { stooqHistory } from "@/lib/providers/stooq"
import {
  annualisedVolatility,
  dailyReturns,
  maxDrawdown,
  mean,
} from "@/lib/scoring/metrics"
import type { FundFacts } from "@/lib/scoring/score"
import type { UniverseEntry } from "./universe"

/**
 * Assembles the facts the scoring engine needs, combining versioned reference
 * data (expense ratio, inception) with live market data (price history).
 *
 * Live data is best-effort by design. If Stooq is unreachable, the fund is
 * still scored on the dimensions that do not need price history, and the
 * missing dimensions are reported as such rather than silently defaulting to
 * zero, a fund with no data should not look like a fund with bad data.
 */

const HISTORY_TTL_MS = 6 * 60 * 60 * 1000
/** Three years of trading days: enough to span a meaningful drawdown. */
const HISTORY_DAYS = 756

export type FundFactsResult = {
  facts: FundFacts
  /** Null when live history could not be retrieved. */
  liveDataError: string | null
}

export async function buildFacts(entry: UniverseEntry): Promise<FundFactsResult> {
  let volatility: number | null = null
  let drawdown: number | null = null
  let avgVolume: number | null = null
  let liveDataError: string | null = null

  try {
    const history = await cached(`facts-history:${entry.symbol}`, HISTORY_TTL_MS, () =>
      stooqHistory.getDailyHistory(entry.symbol, HISTORY_DAYS)
    )
    const closes = history.value.map((b) => b.close)
    if (closes.length > 30) {
      const returns = dailyReturns(closes)
      volatility = annualisedVolatility(returns)
      drawdown = maxDrawdown(closes)
    }
    const volumes = history.value
      .map((b) => b.volume)
      .filter((v): v is number => v !== null && v > 0)
    if (volumes.length > 0) avgVolume = mean(volumes)
  } catch (error) {
    liveDataError = error instanceof Error ? error.message : "Price history unavailable"
  }

  return {
    facts: {
      symbol: entry.symbol,
      name: entry.name,
      category: entry.category,
      expenseRatio: entry.expenseRatio,
      // AUM needs a provider with a key; omitted rather than guessed.
      aum: null,
      avgVolume,
      inceptionDate: entry.inceptionDate,
      volatility: Number.isFinite(volatility) ? volatility : null,
      maxDrawdown: Number.isFinite(drawdown) ? drawdown : null,
      // Holdings concentration requires the SEC EDGAR integration (Phase 3).
      top10Weight: null,
    },
    liveDataError,
  }
}

export async function buildFactsForAll(
  entries: readonly UniverseEntry[]
): Promise<FundFactsResult[]> {
  // Stooq is a courtesy service; fetch with limited concurrency rather than
  // firing 40 simultaneous requests at it.
  const results: FundFactsResult[] = []
  const CONCURRENCY = 6
  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const chunk = entries.slice(i, i + CONCURRENCY)
    results.push(...(await Promise.all(chunk.map(buildFacts))))
  }
  return results
}
