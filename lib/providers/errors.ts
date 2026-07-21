/** Upstream provider failed in a way the caller may want to distinguish. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly kind: "rate_limited" | "not_found" | "unavailable" | "bad_response",
    options?: { cause?: unknown }
  ) {
    super(message, options)
    this.name = "ProviderError"
  }

  /** Maps provider failures onto HTTP status codes for route handlers. */
  get status(): number {
    switch (this.kind) {
      case "rate_limited":
        return 429
      case "not_found":
        return 404
      case "bad_response":
        return 502
      case "unavailable":
        return 503
    }
  }
}

/** Providers are only ever given symbols matching this shape. */
export function assertValidSymbol(symbol: string): string {
  const normalized = symbol.trim().toUpperCase()
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(normalized)) {
    throw new ProviderError(`Invalid ticker symbol: ${symbol}`, "input", "not_found")
  }
  return normalized
}
