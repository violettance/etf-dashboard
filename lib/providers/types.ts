/** Shared shapes returned by market-data providers. */

export type Quote = {
  symbol: string
  price: number
  change: number
  changePercent: number
  previousClose: number
  volume: number | null
  /** Exchange timestamp of the quote, when the provider supplies one. */
  asOf: Date | null
}

export type PriceBar = {
  date: string // ISO yyyy-mm-dd
  close: number
  volume: number | null
}

export type EtfProfile = {
  symbol: string
  name: string | null
  /** Annual expense ratio as a fraction, e.g. 0.0003 for 0.03%. */
  expenseRatio: number | null
  /** Assets under management, USD. */
  aum: number | null
  inceptionDate: string | null
  source: string
}

export type Holding = {
  symbol: string | null
  name: string
  /** Portfolio weight as a fraction, e.g. 0.071 for 7.1%. */
  weight: number
}

export type HoldingsSnapshot = {
  symbol: string
  asOf: string
  holdings: Holding[]
  source: string
}

/**
 * Expense ratio and fund metadata.
 *
 * Deliberately an interface with multiple implementations: FMP has the cleanest
 * data but requires an API key, while SEC EDGAR requires none. Deployments
 * without a key fall back to EDGAR rather than losing the feature entirely.
 */
export interface ProfileProvider {
  readonly name: string
  readonly available: boolean
  getProfile(symbol: string): Promise<EtfProfile>
}

export interface HoldingsProvider {
  readonly name: string
  readonly available: boolean
  getHoldings(symbol: string): Promise<HoldingsSnapshot>
}

export interface QuoteProvider {
  readonly name: string
  readonly available: boolean
  getQuote(symbol: string): Promise<Quote>
}

export interface HistoryProvider {
  readonly name: string
  readonly available: boolean
  getDailyHistory(symbol: string, days: number): Promise<PriceBar[]>
}
