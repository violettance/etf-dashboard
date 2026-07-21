import "server-only"
import { z } from "zod"
import { env } from "@/lib/config/env"
import { ProviderError } from "./errors"

/**
 * Alpha Vantage news & sentiment.
 *
 * The free tier allows 25 requests per day, which is why every call goes
 * through the server-side cache with a long TTL. The previous implementation
 * called this endpoint directly from the browser with a NEXT_PUBLIC_ key, so
 * each visitor consumed the daily allowance independently and the key itself
 * was readable in the bundle.
 */

export const NEWS_TOPICS = [
  { key: "technology", label: "Technology" },
  { key: "financial_markets", label: "Financial markets" },
  { key: "economy_macro", label: "Macroeconomy" },
  { key: "economy_monetary", label: "Monetary policy" },
  { key: "economy_fiscal", label: "Fiscal policy" },
] as const

export type NewsTopic = (typeof NEWS_TOPICS)[number]["key"]

export type SentimentLabel = "Bullish" | "Somewhat-Bullish" | "Neutral" | "Somewhat-Bearish" | "Bearish"

export type NewsItem = {
  title: string
  url: string
  source: string
  summary: string
  publishedAt: string
  score: number
  label: SentimentLabel
  tickers: { ticker: string; score: number }[]
}

const feedSchema = z.object({
  feed: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        source: z.string().optional(),
        summary: z.string().optional(),
        time_published: z.string(),
        overall_sentiment_score: z.coerce.number(),
        overall_sentiment_label: z.string(),
        ticker_sentiment: z
          .array(
            z.object({
              ticker: z.string(),
              ticker_sentiment_score: z.coerce.number(),
            })
          )
          .optional(),
      })
    )
    .optional(),
  Information: z.string().optional(),
  Note: z.string().optional(),
})

/** Alpha Vantage timestamps look like 20250524T225408. */
function parseTimestamp(raw: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/.exec(raw)
  if (!m) return raw
  const [, y, mo, d, h, mi] = m
  return `${y}-${mo}-${d}T${h}:${mi}:00Z`
}

function normaliseLabel(raw: string): SentimentLabel {
  const known: SentimentLabel[] = [
    "Bullish",
    "Somewhat-Bullish",
    "Neutral",
    "Somewhat-Bearish",
    "Bearish",
  ]
  return known.find((k) => k.toLowerCase() === raw.toLowerCase()) ?? "Neutral"
}

export const alphaVantageNews = {
  name: "alpha-vantage",
  get available() {
    return Boolean(env.ALPHA_VANTAGE_API_KEY)
  },

  async getTopicNews(topic: NewsTopic, limit = 12): Promise<NewsItem[]> {
    const apiKey = env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) {
      throw new ProviderError(
        "ALPHA_VANTAGE_API_KEY is not configured",
        "alpha-vantage",
        "unavailable"
      )
    }

    const url = new URL("https://www.alphavantage.co/query")
    url.searchParams.set("function", "NEWS_SENTIMENT")
    url.searchParams.set("topics", topic)
    url.searchParams.set("limit", String(limit))
    url.searchParams.set("apikey", apiKey)

    let response: Response
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    } catch (cause) {
      throw new ProviderError("Alpha Vantage request failed", "alpha-vantage", "unavailable", {
        cause,
      })
    }

    const parsed = feedSchema.safeParse(await response.json())
    if (!parsed.success) {
      throw new ProviderError("Unrecognised news payload", "alpha-vantage", "bad_response")
    }

    // Alpha Vantage signals quota exhaustion with a 200 and an Information or
    // Note field rather than an error status.
    const notice = parsed.data.Information ?? parsed.data.Note
    if (notice) {
      throw new ProviderError(notice, "alpha-vantage", "rate_limited")
    }

    const feed = parsed.data.feed ?? []
    return feed.slice(0, limit).map((item) => ({
      title: item.title,
      url: item.url,
      source: item.source ?? "Unknown",
      summary: item.summary ?? "",
      publishedAt: parseTimestamp(item.time_published),
      score: item.overall_sentiment_score,
      label: normaliseLabel(item.overall_sentiment_label),
      tickers: (item.ticker_sentiment ?? [])
        .slice(0, 6)
        .map((t) => ({ ticker: t.ticker, score: t.ticker_sentiment_score })),
    }))
  },
}

/** Aggregate sentiment for a topic, used for the summary strip. */
export function summarise(items: NewsItem[]) {
  if (items.length === 0) return null
  const mean = items.reduce((s, i) => s + i.score, 0) / items.length
  const counts = { bullish: 0, neutral: 0, bearish: 0 }
  for (const i of items) {
    if (i.score > 0.15) counts.bullish++
    else if (i.score < -0.15) counts.bearish++
    else counts.neutral++
  }
  return { mean, counts, total: items.length }
}
