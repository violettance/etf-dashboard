import { cached } from "@/lib/cache"
import { alphaVantageNews, NEWS_TOPICS, summarise, type NewsTopic, type NewsItem } from "@/lib/providers/alpha-vantage"

/** Free tier is 25 calls/day, so this is cached hard and revalidated slowly. */
export const revalidate = 10800

const LABEL_STYLE: Record<string, string> = {
  Bullish: "bg-emerald-100 text-emerald-800",
  "Somewhat-Bullish": "bg-emerald-50 text-emerald-700",
  Neutral: "bg-slate-100 text-slate-700",
  "Somewhat-Bearish": "bg-rose-50 text-rose-700",
  Bearish: "bg-rose-100 text-rose-800",
}

function SentimentMeter({ score }: { score: number }) {
  // Map -1..+1 onto 0..100 so the midpoint sits at neutral.
  const left = ((Math.max(-1, Math.min(1, score)) + 1) / 2) * 100
  return (
    <div className="relative h-1.5 w-full rounded-full bg-gradient-to-r from-rose-200 via-slate-200 to-emerald-200">
      <div
        className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-slate-900"
        style={{ left: `${left}%` }}
        role="meter"
        aria-valuenow={Number(score.toFixed(2))}
        aria-valuemin={-1}
        aria-valuemax={1}
      />
    </div>
  )
}

async function loadTopic(topic: NewsTopic) {
  try {
    const result = await cached(`news:${topic}`, 3 * 60 * 60 * 1000, () =>
      alphaVantageNews.getTopicNews(topic, 10)
    )
    return { items: result.value, stale: result.stale, error: null as string | null }
  } catch (e) {
    return { items: [] as NewsItem[], stale: false, error: e instanceof Error ? e.message : "Failed" }
  }
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const raw = Array.isArray(sp.topic) ? sp.topic[0] : sp.topic
  const topic = (NEWS_TOPICS.find((t) => t.key === raw)?.key ?? "technology") as NewsTopic

  if (!alphaVantageNews.available) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">News sentiment</h1>
        <div className="mt-6 rounded-lg border border-slate-300 bg-white p-6 text-sm">
          <p className="font-medium">Not configured</p>
          <p className="mt-2 text-slate-600">
            This section needs an Alpha Vantage API key. Add it to <code>.env.local</code> as{" "}
            <code>ALPHA_VANTAGE_API_KEY</code> and restart the dev server. The key is read only on
            the server and is never sent to the browser.
          </p>
        </div>
      </main>
    )
  }

  const { items, stale, error } = await loadTopic(topic)
  const summary = summarise(items)

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">News sentiment</h1>
        <p className="mt-1 text-sm text-slate-600">
          Topic-level sentiment scored from -1 (bearish) to +1 (bullish), with the articles behind
          each score.
        </p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {NEWS_TOPICS.map((t) => (
          <a
            key={t.key}
            href={`/news?topic=${t.key}`}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              t.key === topic
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
            }`}
          >
            {t.label}
          </a>
        ))}
      </nav>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-slate-700">
          Could not load this topic: {error}
          {/* The free tier allows 25 calls a day across all topics. */}
        </div>
      )}

      {stale && (
        <div className="mb-6 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
          Showing the last successful fetch — the upstream quota is currently exhausted.
        </div>
      )}

      {summary && (
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Average score</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {summary.mean > 0 ? "+" : ""}
              {summary.mean.toFixed(3)}
            </div>
            <div className="mt-2">
              <SentimentMeter score={summary.mean} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Bullish</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700">
              {summary.counts.bullish}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Neutral</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-700">
              {summary.counts.neutral}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Bearish</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-rose-700">
              {summary.counts.bearish}
            </div>
          </div>
        </section>
      )}

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.url} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="max-w-2xl font-medium hover:underline"
              >
                {item.title}
              </a>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${LABEL_STYLE[item.label] ?? LABEL_STYLE.Neutral}`}
              >
                {item.label} {item.score > 0 ? "+" : ""}
                {item.score.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {item.source} ·{" "}
              <time dateTime={item.publishedAt}>
                {new Date(item.publishedAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </p>
            {item.summary && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
            )}
            {item.tickers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tickers.map((t) => (
                  <span
                    key={t.ticker}
                    className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                      t.score > 0.15
                        ? "bg-emerald-50 text-emerald-700"
                        : t.score < -0.15
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {t.ticker} {t.score > 0 ? "+" : ""}
                    {t.score.toFixed(2)}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {items.length === 0 && !error && (
        <p className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No articles returned for this topic.
        </p>
      )}

      <p className="mt-8 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
        Sentiment scores are produced by Alpha Vantage, not by this application. The free tier
        allows 25 requests per day across all topics, so responses are cached for three hours and
        the last successful result is served if the quota runs out.
      </p>
    </main>
  )
}
