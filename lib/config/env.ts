import { z } from "zod"

/**
 * Server-side environment.
 *
 * Every value here is secret and must never be exposed to the browser. None of
 * these are prefixed with NEXT_PUBLIC_, which means Next.js will refuse to
 * inline them into client bundles. This module is import-guarded so that an
 * accidental client import fails loudly at build time rather than silently
 * shipping an empty string.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "lib/config/env.ts was imported from client code. Server secrets must only " +
      "be read inside route handlers, server components or server actions."
  )
}

const schema = z.object({
  /** Twelve Data, live quotes and daily series. Free tier: 800/day, 8/min. */
  TWELVE_DATA_API_KEY: z.string().min(1).optional(),
  /** Alpha Vantage, news & sentiment feed. */
  ALPHA_VANTAGE_API_KEY: z.string().min(1).optional(),
  /** Financial Modeling Prep, expense ratios. Optional: SEC EDGAR is the fallback. */
  FMP_API_KEY: z.string().min(1).optional(),
  /** SQLite file path (Phase 2). */
  DATABASE_URL: z.string().default("file:./data/etf.db"),
  /** Shared secret guarding /api/cron/refresh. */
  CRON_SECRET: z.string().min(16).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  throw new Error(
    `Invalid server environment:\n${parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")}`
  )
}

export const env = parsed.data

/** Which optional providers are usable in this deployment. */
export const providerAvailability = {
  twelveData: Boolean(env.TWELVE_DATA_API_KEY),
  alphaVantage: Boolean(env.ALPHA_VANTAGE_API_KEY),
  fmp: Boolean(env.FMP_API_KEY),
  /** Always available, SEC EDGAR and Stooq need no credentials. */
  secEdgar: true,
  stooq: true,
} as const
