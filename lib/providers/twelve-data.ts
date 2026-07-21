import "server-only"
import { z } from "zod"
import { env } from "@/lib/config/env"
import { assertValidSymbol, ProviderError } from "./errors"
import type { Quote, QuoteProvider } from "./types"

/**
 * Twelve Data live quotes.
 *
 * The API key is read from a non-public env var and never leaves the server;
 * callers reach this through /api/quote/[symbol]. Previously the key was
 * NEXT_PUBLIC_TWELVE_DATA_API_KEY and was inlined into the client bundle.
 *
 * Twelve Data signals errors with HTTP 200 and a body of {status:"error"}, so
 * the status code alone cannot be trusted.
 */
const quoteSchema = z.object({
  symbol: z.string().optional(),
  close: z.coerce.number(),
  previous_close: z.coerce.number(),
  change: z.coerce.number(),
  percent_change: z.coerce.number(),
  volume: z.coerce.number().optional(),
  timestamp: z.coerce.number().optional(),
})

const errorSchema = z.object({
  status: z.literal("error"),
  code: z.number().optional(),
  message: z.string().optional(),
})

export const twelveDataQuotes: QuoteProvider = {
  name: "twelve-data",
  get available() {
    return Boolean(env.TWELVE_DATA_API_KEY)
  },

  async getQuote(symbol): Promise<Quote> {
    const ticker = assertValidSymbol(symbol)
    const apiKey = env.TWELVE_DATA_API_KEY

    if (!apiKey) {
      throw new ProviderError(
        "TWELVE_DATA_API_KEY is not configured",
        "twelve-data",
        "unavailable"
      )
    }

    const url = new URL("https://api.twelvedata.com/quote")
    url.searchParams.set("symbol", ticker)
    url.searchParams.set("apikey", apiKey)

    let response: Response
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    } catch (cause) {
      throw new ProviderError(`Request failed for ${ticker}`, "twelve-data", "unavailable", {
        cause,
      })
    }

    const body: unknown = await response.json()

    const asError = errorSchema.safeParse(body)
    if (asError.success) {
      const rateLimited = asError.data.code === 429 || /limit/i.test(asError.data.message ?? "")
      throw new ProviderError(
        asError.data.message ?? `Twelve Data error for ${ticker}`,
        "twelve-data",
        rateLimited ? "rate_limited" : "not_found"
      )
    }

    const parsed = quoteSchema.safeParse(body)
    if (!parsed.success) {
      throw new ProviderError(
        `Unrecognised quote payload for ${ticker}`,
        "twelve-data",
        "bad_response",
        { cause: parsed.error }
      )
    }

    const q = parsed.data
    return {
      symbol: ticker,
      price: q.close,
      change: q.change,
      changePercent: q.percent_change,
      previousClose: q.previous_close,
      volume: q.volume ?? null,
      asOf: q.timestamp ? new Date(q.timestamp * 1000) : null,
    }
  },
}
