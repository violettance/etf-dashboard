import { assertValidSymbol, ProviderError } from "./errors"
import type { HistoryProvider, PriceBar } from "./types"

/**
 * Stooq daily OHLC history.
 *
 * Chosen as the primary history source because it needs no API key and does not
 * consume the Twelve Data quota, which is reserved for live quotes. Risk metrics
 * (volatility, drawdown, Sharpe) need multi-year history for the whole universe;
 * paying quota for that would exhaust the free tier immediately.
 *
 * Returns CSV, so responses are parsed defensively — a rate-limited or blocked
 * request yields an HTML error page rather than a non-200 status.
 */
const BASE = "https://stooq.com/q/d/l/"

function parseCsv(text: string, symbol: string): PriceBar[] {
  const lines = text.trim().split("\n")
  const header = lines[0]?.toLowerCase() ?? ""

  if (!header.startsWith("date,")) {
    throw new ProviderError(
      `Unexpected response for ${symbol} (not CSV; likely blocked or unknown symbol)`,
      "stooq",
      header.includes("<html") ? "rate_limited" : "not_found"
    )
  }

  const cols = header.split(",")
  const dateIdx = cols.indexOf("date")
  const closeIdx = cols.indexOf("close")
  const volIdx = cols.indexOf("volume")

  if (dateIdx === -1 || closeIdx === -1) {
    throw new ProviderError(`Missing date/close columns for ${symbol}`, "stooq", "bad_response")
  }

  const bars: PriceBar[] = []
  for (const line of lines.slice(1)) {
    const parts = line.split(",")
    const date = parts[dateIdx]
    const close = Number(parts[closeIdx])
    if (!date || !Number.isFinite(close)) continue
    const rawVol = volIdx === -1 ? undefined : parts[volIdx]
    const volume = rawVol === undefined ? null : Number(rawVol)
    bars.push({ date, close, volume: Number.isFinite(volume) ? volume : null })
  }

  if (bars.length === 0) {
    throw new ProviderError(`No price rows returned for ${symbol}`, "stooq", "not_found")
  }
  return bars
}

export const stooqHistory: HistoryProvider = {
  name: "stooq",
  available: true,

  async getDailyHistory(symbol, days) {
    const ticker = assertValidSymbol(symbol)
    // Stooq namespaces US listings with a .us suffix.
    const url = `${BASE}?s=${ticker.toLowerCase()}.us&i=d`

    let response: Response
    try {
      response = await fetch(url, {
        headers: { "User-Agent": "etf-analytics-dashboard/2.0 (+github.com/violettance)" },
        signal: AbortSignal.timeout(15_000),
      })
    } catch (cause) {
      throw new ProviderError(`Stooq request failed for ${ticker}`, "stooq", "unavailable", {
        cause,
      })
    }

    if (!response.ok) {
      throw new ProviderError(
        `Stooq returned ${response.status} for ${ticker}`,
        "stooq",
        response.status === 429 ? "rate_limited" : "unavailable"
      )
    }

    const bars = parseCsv(await response.text(), ticker)
    return bars.slice(-days)
  },
}
