const nf = new Intl.NumberFormat("en-US")

export const num = (v: number) => nf.format(v)

export const pct = (v: number | null, d = 2) => (v === null ? "—" : `${(v * 100).toFixed(d)}%`)

export const money = (v: number | null) => {
  if (v === null) return "—"
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
  return `$${nf.format(Math.round(v))}`
}

export const compact = (v: number | null) =>
  v === null ? "—" : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : nf.format(Math.round(v))
