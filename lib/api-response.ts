import { NextResponse } from "next/server"
import { ProviderError } from "@/lib/providers/errors"

export type ApiEnvelope<T> = {
  data: T
  meta: {
    /** When the served payload was fetched from the upstream provider. */
    fetchedAt: string
    /** True when the upstream failed and cached data was served instead. */
    stale: boolean
    source: string
  }
}

export function ok<T>(
  data: T,
  meta: { fetchedAt: Date; stale: boolean; source: string },
  cacheSeconds: number
) {
  return NextResponse.json<ApiEnvelope<T>>(
    {
      data,
      meta: {
        fetchedAt: meta.fetchedAt.toISOString(),
        stale: meta.stale,
        source: meta.source,
      },
    },
    {
      headers: {
        // Allow shared caches (Vercel's CDN) to absorb repeat traffic so the
        // free-tier quota is spent on genuinely new requests.
        "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 4}`,
      },
    }
  )
}

export function fail(error: unknown) {
  if (error instanceof ProviderError) {
    return NextResponse.json(
      { error: { message: error.message, kind: error.kind, provider: error.provider } },
      { status: error.status }
    )
  }

  // Never leak internal error details to the client.
  console.error("Unhandled API error:", error)
  return NextResponse.json({ error: { message: "Internal error", kind: "unknown" } }, { status: 500 })
}
