import type { NextRequest } from "next/server"
import { cached } from "@/lib/cache"
import { ok, fail } from "@/lib/api-response"
import { twelveDataQuotes } from "@/lib/providers/twelve-data"

/** Quotes move constantly; a short TTL still removes almost all quota pressure. */
const TTL_MS = 60_000

export async function GET(_request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await context.params

  try {
    const result = await cached(`quote:${symbol.toUpperCase()}`, TTL_MS, () =>
      twelveDataQuotes.getQuote(symbol)
    )
    return ok(result.value, { ...result, source: twelveDataQuotes.name }, 60)
  } catch (error) {
    return fail(error)
  }
}
