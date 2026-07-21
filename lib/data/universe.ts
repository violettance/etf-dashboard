import type { Goal } from "./goals"

/**
 * Curated ETF universe.
 *
 * Deliberately small. A tool that answers "which ETF should I pick?" needs the
 * funds people actually choose between, not all ~4,000 US-listed ETFs. Nobody
 * decides among four thousand options, and a shortlist is the product.
 *
 * Expense ratios are reference data, not market data: they are set by the
 * issuer and change roughly once a year, if at all. They are therefore
 * versioned in source with the date they were verified and a link to the
 * issuer's own page, rather than fetched from a paid API. `providers/fmp.ts`
 * can refresh them automatically if an API key is ever configured.
 *
 * Everything that genuinely moves, price, volume, volatility, drawdown,
 * holdings, is fetched live and never hardcoded here.
 */

export type UniverseEntry = {
  symbol: string
  name: string
  issuer: string
  category: string
  /** Annual expense ratio as a fraction. 0.0003 = 0.03%. */
  expenseRatio: number
  inceptionDate: string
  /** Index or strategy the fund tracks, used to spot near-identical funds. */
  tracks: string
  /** When the expense ratio was last verified against the issuer's page. */
  expenseRatioAsOf: string
  sourceUrl: string
}

const V = "2026-07-21"

export const UNIVERSE: readonly UniverseEntry[] = [
  // ---- Broad US market ----------------------------------------------------
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", issuer: "Vanguard", category: "us-total-market", expenseRatio: 0.0003, inceptionDate: "2001-05-24", tracks: "CRSP US Total Market", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/vti" },
  { symbol: "ITOT", name: "iShares Core S&P Total US Stock Market ETF", issuer: "iShares", category: "us-total-market", expenseRatio: 0.0003, inceptionDate: "2004-01-20", tracks: "S&P Total Market", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/239724/" },
  { symbol: "SCHB", name: "Schwab US Broad Market ETF", issuer: "Schwab", category: "us-total-market", expenseRatio: 0.0003, inceptionDate: "2009-11-03", tracks: "Dow Jones US Broad Stock Market", expenseRatioAsOf: V, sourceUrl: "https://www.schwabassetmanagement.com/products/schb" },

  // ---- US large cap / S&P 500 --------------------------------------------
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", issuer: "Vanguard", category: "us-large-cap", expenseRatio: 0.0003, inceptionDate: "2010-09-07", tracks: "S&P 500", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/voo" },
  { symbol: "IVV", name: "iShares Core S&P 500 ETF", issuer: "iShares", category: "us-large-cap", expenseRatio: 0.0003, inceptionDate: "2000-05-15", tracks: "S&P 500", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/239726/" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", issuer: "State Street", category: "us-large-cap", expenseRatio: 0.000945, inceptionDate: "1993-01-22", tracks: "S&P 500", expenseRatioAsOf: V, sourceUrl: "https://www.ssga.com/us/en/intermediary/etfs/spdr-sp-500-etf-trust-spy" },
  { symbol: "SPLG", name: "SPDR Portfolio S&P 500 ETF", issuer: "State Street", category: "us-large-cap", expenseRatio: 0.0002, inceptionDate: "2005-11-08", tracks: "S&P 500", expenseRatioAsOf: V, sourceUrl: "https://www.ssga.com/us/en/intermediary/etfs/spdr-portfolio-sp-500-etf-splg" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", issuer: "Invesco", category: "us-large-cap", expenseRatio: 0.002, inceptionDate: "1999-03-10", tracks: "Nasdaq-100", expenseRatioAsOf: V, sourceUrl: "https://www.invesco.com/qqq-etf/en/home.html" },
  { symbol: "QQQM", name: "Invesco NASDAQ 100 ETF", issuer: "Invesco", category: "us-large-cap", expenseRatio: 0.0015, inceptionDate: "2020-10-13", tracks: "Nasdaq-100", expenseRatioAsOf: V, sourceUrl: "https://www.invesco.com/us/financial-products/etfs/product-detail?audienceType=Investor&ticker=QQQM" },

  // ---- Dividend -----------------------------------------------------------
  { symbol: "VYM", name: "Vanguard High Dividend Yield ETF", issuer: "Vanguard", category: "dividend", expenseRatio: 0.0006, inceptionDate: "2006-11-10", tracks: "FTSE High Dividend Yield", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/vym" },
  { symbol: "SCHD", name: "Schwab US Dividend Equity ETF", issuer: "Schwab", category: "dividend", expenseRatio: 0.0006, inceptionDate: "2011-10-20", tracks: "Dow Jones US Dividend 100", expenseRatioAsOf: V, sourceUrl: "https://www.schwabassetmanagement.com/products/schd" },
  { symbol: "VIG", name: "Vanguard Dividend Appreciation ETF", issuer: "Vanguard", category: "dividend", expenseRatio: 0.0005, inceptionDate: "2006-04-21", tracks: "S&P US Dividend Growers", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/vig" },
  { symbol: "DGRO", name: "iShares Core Dividend Growth ETF", issuer: "iShares", category: "dividend", expenseRatio: 0.0008, inceptionDate: "2014-06-10", tracks: "Morningstar US Dividend Growth", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/264623/" },
  { symbol: "HDV", name: "iShares Core High Dividend ETF", issuer: "iShares", category: "dividend", expenseRatio: 0.0008, inceptionDate: "2011-03-29", tracks: "Morningstar Dividend Yield Focus", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/239563/" },

  // ---- Bonds --------------------------------------------------------------
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", issuer: "Vanguard", category: "bonds-aggregate", expenseRatio: 0.0003, inceptionDate: "2007-04-03", tracks: "Bloomberg US Aggregate Float Adjusted", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/bnd" },
  { symbol: "AGG", name: "iShares Core US Aggregate Bond ETF", issuer: "iShares", category: "bonds-aggregate", expenseRatio: 0.0003, inceptionDate: "2003-09-22", tracks: "Bloomberg US Aggregate", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/239458/" },
  { symbol: "BNDX", name: "Vanguard Total International Bond ETF", issuer: "Vanguard", category: "bonds-aggregate", expenseRatio: 0.0007, inceptionDate: "2013-05-31", tracks: "Bloomberg Global Aggregate ex-USD", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/bndx" },
  { symbol: "GOVT", name: "iShares US Treasury Bond ETF", issuer: "iShares", category: "bonds-treasury", expenseRatio: 0.0005, inceptionDate: "2012-02-14", tracks: "ICE US Treasury Core", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/239468/" },
  { symbol: "IEF", name: "iShares 7-10 Year Treasury Bond ETF", issuer: "iShares", category: "bonds-treasury", expenseRatio: 0.0015, inceptionDate: "2002-07-22", tracks: "ICE US Treasury 7-10 Year", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/239456/" },
  { symbol: "SHY", name: "iShares 1-3 Year Treasury Bond ETF", issuer: "iShares", category: "bonds-short", expenseRatio: 0.0015, inceptionDate: "2002-07-22", tracks: "ICE US Treasury 1-3 Year", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/239452/" },
  { symbol: "BIL", name: "SPDR Bloomberg 1-3 Month T-Bill ETF", issuer: "State Street", category: "bonds-short", expenseRatio: 0.001356, inceptionDate: "2007-05-25", tracks: "Bloomberg 1-3 Month US Treasury Bill", expenseRatioAsOf: V, sourceUrl: "https://www.ssga.com/us/en/intermediary/etfs/spdr-bloomberg-1-3-month-t-bill-etf-bil" },
  { symbol: "VGSH", name: "Vanguard Short-Term Treasury ETF", issuer: "Vanguard", category: "bonds-short", expenseRatio: 0.0003, inceptionDate: "2009-11-19", tracks: "Bloomberg US Treasury 1-3 Year", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/vgsh" },

  // ---- Global / international --------------------------------------------
  { symbol: "VT", name: "Vanguard Total World Stock ETF", issuer: "Vanguard", category: "global-equity", expenseRatio: 0.0006, inceptionDate: "2008-06-24", tracks: "FTSE Global All Cap", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/vt" },
  { symbol: "ACWI", name: "iShares MSCI ACWI ETF", issuer: "iShares", category: "global-equity", expenseRatio: 0.0032, inceptionDate: "2008-03-26", tracks: "MSCI ACWI", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/239600/" },
  { symbol: "VXUS", name: "Vanguard Total International Stock ETF", issuer: "Vanguard", category: "international-developed", expenseRatio: 0.0005, inceptionDate: "2011-01-26", tracks: "FTSE Global All Cap ex US", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/vxus" },
  { symbol: "IEFA", name: "iShares Core MSCI EAFE ETF", issuer: "iShares", category: "international-developed", expenseRatio: 0.0007, inceptionDate: "2012-10-18", tracks: "MSCI EAFE IMI", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/244049/" },
  { symbol: "VEA", name: "Vanguard FTSE Developed Markets ETF", issuer: "Vanguard", category: "international-developed", expenseRatio: 0.0003, inceptionDate: "2007-07-20", tracks: "FTSE Developed All Cap ex US", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/vea" },
  { symbol: "VWO", name: "Vanguard FTSE Emerging Markets ETF", issuer: "Vanguard", category: "emerging-markets", expenseRatio: 0.0007, inceptionDate: "2005-03-04", tracks: "FTSE Emerging Markets All Cap", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/vwo" },
  { symbol: "IEMG", name: "iShares Core MSCI Emerging Markets ETF", issuer: "iShares", category: "emerging-markets", expenseRatio: 0.0009, inceptionDate: "2012-10-18", tracks: "MSCI Emerging Markets IMI", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/244050/" },

  // ---- Technology ---------------------------------------------------------
  { symbol: "VGT", name: "Vanguard Information Technology ETF", issuer: "Vanguard", category: "sector-technology", expenseRatio: 0.0009, inceptionDate: "2004-01-26", tracks: "MSCI US IMI Information Technology", expenseRatioAsOf: V, sourceUrl: "https://investor.vanguard.com/investment-products/etfs/profile/vgt" },
  { symbol: "XLK", name: "Technology Select Sector SPDR Fund", issuer: "State Street", category: "sector-technology", expenseRatio: 0.0008, inceptionDate: "1998-12-16", tracks: "Technology Select Sector Index", expenseRatioAsOf: V, sourceUrl: "https://www.ssga.com/us/en/intermediary/etfs/technology-select-sector-spdr-fund-xlk" },
  { symbol: "IYW", name: "iShares US Technology ETF", issuer: "iShares", category: "sector-technology", expenseRatio: 0.0039, inceptionDate: "2000-05-15", tracks: "Russell 1000 Technology RIC 22.5/45", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/239522/" },
  { symbol: "SMH", name: "VanEck Semiconductor ETF", issuer: "VanEck", category: "sector-technology", expenseRatio: 0.0035, inceptionDate: "2011-12-20", tracks: "MVIS US Listed Semiconductor 25", expenseRatioAsOf: V, sourceUrl: "https://www.vaneck.com/us/en/investments/semiconductor-etf-smh/" },

  // ---- Commodities --------------------------------------------------------
  { symbol: "GLD", name: "SPDR Gold Shares", issuer: "State Street", category: "commodities", expenseRatio: 0.004, inceptionDate: "2004-11-18", tracks: "LBMA Gold Price", expenseRatioAsOf: V, sourceUrl: "https://www.ssga.com/us/en/intermediary/etfs/spdr-gold-shares-gld" },
  { symbol: "IAU", name: "iShares Gold Trust", issuer: "iShares", category: "commodities", expenseRatio: 0.0025, inceptionDate: "2005-01-21", tracks: "LBMA Gold Price", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/239561/" },
  { symbol: "GLDM", name: "SPDR Gold MiniShares Trust", issuer: "State Street", category: "commodities", expenseRatio: 0.001, inceptionDate: "2018-06-25", tracks: "LBMA Gold Price", expenseRatioAsOf: V, sourceUrl: "https://www.ssga.com/us/en/intermediary/etfs/spdr-gold-minishares-trust-gldm" },
  { symbol: "SLV", name: "iShares Silver Trust", issuer: "iShares", category: "commodities", expenseRatio: 0.005, inceptionDate: "2006-04-21", tracks: "LBMA Silver Price", expenseRatioAsOf: V, sourceUrl: "https://www.ishares.com/us/products/239855/" },
]

export function getEntry(symbol: string): UniverseEntry | undefined {
  return UNIVERSE.find((e) => e.symbol === symbol.toUpperCase())
}

export function entriesForGoal(goal: Goal): UniverseEntry[] {
  return UNIVERSE.filter((e) => goal.categories.includes(e.category))
}

/**
 * Funds tracking the same index as `symbol`. These are the comparisons that
 * matter most: when two funds hold the same portfolio, cost and structure are
 * the only things left to choose between.
 */
export function sameIndexPeers(symbol: string): UniverseEntry[] {
  const entry = getEntry(symbol)
  if (!entry) return []
  return UNIVERSE.filter((e) => e.tracks === entry.tracks && e.symbol !== entry.symbol)
}
