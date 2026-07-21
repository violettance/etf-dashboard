# Which ETF?

A tool for comparing US-listed ETFs on the things that actually differ between
them — cost, risk, liquidity and track record — with the numbers behind every
figure shown in full.

It does not recommend funds. It lines comparable funds up side by side and
shows its working, so the conclusion is yours to draw.

**Runs with zero API keys.** Price data comes from sources that require no
credentials.

---

## Why it works this way

Most ETF dashboards, including the first version of this one, chart the
distribution of the whole ETF universe: median three-year returns, dividend
yield histograms, category averages. Those charts are accurate and useless —
nobody makes a decision with the median five-year return of 4,000 funds.

The problem people actually have is narrower: *these six funds look identical,
which one do I buy?* That question has a real answer, and it is usually about
cost and structure rather than performance. This tool is built around that
question.

### Curation is the product

The universe is ~40 funds, not ~4,000. Most US-listed ETFs are leveraged,
thematic, or too small to trade cheaply, and nobody chooses among four thousand
options. Narrowing the field to genuinely comparable funds is the point.

The list lives in [`lib/data/universe.ts`](lib/data/universe.ts) and is
versioned in git, so every change to it is visible in the history.

### Reference data vs market data

Expense ratios and inception dates are *reference* data: set by the issuer,
changing roughly once a year. They are recorded in source with the date each
figure was verified and a link to the issuer's own page.

Everything that genuinely moves — price, volume, volatility, drawdown — is
fetched live and never hardcoded.

### Missing data is shown, not guessed

When a dimension has no data it is excluded from the total and the remaining
weight is rescaled, so a fund is never penalised for a missing figure. The
coverage percentage is displayed alongside, so you can see how much of a score
is actually evidenced. A fund with no data should not look like a fund with bad
data.

---

## Architecture

```
app/
  page.tsx                  Goal selection
  compare/[goalId]/         Side-by-side comparison, sorted by your weightings
  methodology/              How every number is derived
  api/
    quote/[symbol]/         Live quote proxy      (keeps API keys server-side)
    history/[symbol]/       Daily price history   (Stooq, no key required)
lib/
  config/env.ts             Zod-validated server env; throws if imported client-side
  cache.ts                  TTL cache with stale-on-error semantics
  providers/                One module per data source, behind a shared interface
  data/                     Curated universe, goals and weightings
  scoring/                  Pure metric and scoring functions (unit tested)
```

### Data sources

| Source | Used for | Key required |
|---|---|---|
| Stooq | Daily closes, volume, volatility, drawdown | No |
| Issuer reference data | Expense ratios, inception dates | No |
| SEC EDGAR N-PORT | Holdings concentration *(planned)* | No |
| Twelve Data | Live intraday quotes *(optional upgrade)* | Yes |
| Financial Modeling Prep | Automated expense-ratio refresh *(optional)* | Yes |

The two optional providers are exactly that — the app is fully functional
without them.

---

## Getting started

```bash
git clone https://github.com/violettance/etf-dashboard.git
cd etf-dashboard
npm install
npm run dev
```

Open <http://localhost:3000>. No `.env.local` is needed.

To enable the optional providers, copy `.env.example` to `.env.local` and fill
in the keys you have. Note that none of them are prefixed `NEXT_PUBLIC_`: they
are read only on the server, and `lib/config/env.ts` throws if it is imported
from client code.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (watch) |
| `npm test -- --run` | Vitest (once) |

---

## Testing

The scoring engine is written as pure functions specifically so it can be
tested against known values rather than snapshots:

- sample vs population standard deviation
- beta of a 2× levered series against its benchmark
- correlation of a perfectly inverse series
- maximum drawdown measured from the running peak, not the starting value
- funds not being penalised for a missing field that carries zero weight

```bash
npm test -- --run
```

---

## Not investment advice

This tool presents published fund data for comparison. It does not know your
circumstances, tax position or time horizon, and it does not recommend any
fund. Past performance does not predict future results.

## License

MIT — see [LICENSE](LICENSE).
