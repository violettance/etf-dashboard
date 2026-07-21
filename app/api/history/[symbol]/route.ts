import type { NextRequest } from "next/server"
import { z } from "zod"
import { cached } from "@/lib/cache"
import { ok, fail } from "@/lib/api-response"
import { stooqHistory } from "@/lib/providers/stooq"

/** Daily bars only change after the close, so this can be cached aggressively. */
const TTL_MS = 6 * 60 * 60 * 1000

const querySchema = z.object({
  days: z.coerce.number().int().min(5).max(5_000).default(365),
})

export async function GET(request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await context.params

  const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!query.success) {
    return fail(new Error("invalid query"))
  }
  const { days } = query.data

  try {
    const result = await cached(`history:${symbol.toUpperCase()}:${days}`, TTL_MS, () =>
      stooqHistory.getDailyHistory(symbol, days)
    )
    return ok(result.value, { ...result, source: stooqHistory.name }, 3600)
  } catch (error) {
    return fail(error)
  }
}
