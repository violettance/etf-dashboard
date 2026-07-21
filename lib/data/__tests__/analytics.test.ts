import { describe, expect, it } from "vitest"
import {
  issuerConcentration,
  median,
  thinlyTraded,
  weightedReturns,
  categoryPerformance,
  topPerformers,
} from "../analytics"
import { screen, DIRECTORY, type ScreenerQuery } from "../directory"

const baseQuery: ScreenerQuery = {
  q: "",
  category: "",
  minAum: null,
  minYield: null,
  maxExpenseRatio: null,
  feesOnly: false,
  sort: "aum",
  dir: "desc",
  page: 1,
  perPage: 25,
}

describe("median", () => {
  it("returns the middle value for an odd-length series", () => {
    expect(median([3, 1, 2])).toBe(2)
  })

  it("averages the two middle values for an even-length series", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })

  it("is null for an empty series", () => {
    expect(median([])).toBeNull()
  })

  it("is unaffected by an extreme outlier, unlike a mean", () => {
    expect(median([1, 2, 3, 4, 10_000])).toBe(3)
  })
})

describe("screen", () => {
  it("returns the whole universe when unfiltered", () => {
    expect(screen(baseQuery).total).toBe(DIRECTORY.length)
  })

  it("matches on symbol, name and issuer", () => {
    const bySymbol = screen({ ...baseQuery, q: "VOO", perPage: 500 })
    expect(bySymbol.rows.some((r) => r.symbol === "VOO")).toBe(true)

    const byIssuer = screen({ ...baseQuery, q: "vanguard", perPage: 500 })
    expect(byIssuer.total).toBeGreaterThan(10)
    expect(
      byIssuer.rows.every((r) => /vanguard/i.test(`${r.name} ${r.fundFamily} ${r.symbol}`))
    ).toBe(true)
  })

  it("sorts funds with no value last in both directions", () => {
    const asc = screen({ ...baseQuery, sort: "ret5y", dir: "asc", perPage: DIRECTORY.length })
    const desc = screen({ ...baseQuery, sort: "ret5y", dir: "desc", perPage: DIRECTORY.length })
    // A blank must never appear first, or an absent value reads as best or worst.
    expect(asc.rows[0]?.ret5y).not.toBeNull()
    expect(desc.rows[0]?.ret5y).not.toBeNull()
    expect(asc.rows[asc.rows.length - 1]?.ret5y).toBeNull()
    expect(desc.rows[desc.rows.length - 1]?.ret5y).toBeNull()
  })

  it("applies the minimum assets filter", () => {
    const out = screen({ ...baseQuery, minAum: 1e9, perPage: 1000 })
    expect(out.rows.every((r) => (r.aum ?? 0) >= 1e9)).toBe(true)
    expect(out.total).toBeLessThan(DIRECTORY.length)
  })

  it("excludes unverified fees when feesOnly is set", () => {
    const out = screen({ ...baseQuery, feesOnly: true, perPage: 500 })
    expect(out.total).toBeGreaterThan(0)
    expect(out.rows.every((r) => r.expenseRatio !== null)).toBe(true)
  })

  it("never treats an unverified fee as free", () => {
    const out = screen({ ...baseQuery, maxExpenseRatio: 0.0005, perPage: 500 })
    expect(out.rows.every((r) => r.expenseRatio !== null && r.expenseRatio <= 0.0005)).toBe(true)
  })

  it("clamps the page number to the available range", () => {
    expect(screen({ ...baseQuery, page: 99_999 }).page).toBe(screen(baseQuery).pages)
    expect(screen({ ...baseQuery, page: -5 }).page).toBe(1)
  })
})

describe("issuerConcentration", () => {
  it("reports a top-ten share between 0 and 1", () => {
    const c = issuerConcentration(10)
    expect(c.topShare).toBeGreaterThan(0)
    expect(c.topShare).toBeLessThanOrEqual(1)
    expect(c.top).toHaveLength(10)
  })

  it("orders issuers by assets, largest first", () => {
    const { top } = issuerConcentration(10)
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1]!.aum).toBeGreaterThanOrEqual(top[i]!.aum)
    }
  })
})

describe("weightedReturns", () => {
  it("produces both an equal-weighted and an asset-weighted figure", () => {
    const w = weightedReturns("ret3y")
    expect(w).not.toBeNull()
    expect(Number.isFinite(w!.equal)).toBe(true)
    expect(Number.isFinite(w!.weighted)).toBe(true)
    expect(w!.gap).toBeCloseTo(w!.weighted - w!.equal, 12)
  })
})

describe("thinlyTraded", () => {
  it("reports a share of the universe between 0 and 1", () => {
    const t = thinlyTraded()
    expect(t.share).toBeGreaterThan(0)
    expect(t.share).toBeLessThanOrEqual(1)
  })
})

describe("rankings exclude untradeable and leveraged funds", () => {
  it("keeps leveraged products out of top performers", () => {
    const rows = topPerformers("ret3y", 20)
    expect(
      rows.every((r) => !/\b(2x|3x|ultra|inverse|short|bear|leveraged)\b/i.test(r.name))
    ).toBe(true)
    expect(rows.every((r) => (r.aum ?? 0) >= 50e6)).toBe(true)
  })

  it("only reports categories with enough funds to be meaningful", () => {
    expect(categoryPerformance(20).every((c) => c.count >= 5)).toBe(true)
  })
})
