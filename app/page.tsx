import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { GOALS } from "@/lib/data/goals"
import { UNIVERSE } from "@/lib/data/universe"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12">
        <h1 className="text-4xl font-semibold tracking-tight">Compare ETFs on what actually differs</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Pick what you are comparing for. Funds are lined up side by side on cost, risk,
          liquidity and track record, with the numbers behind each one shown in full. The
          conclusion is yours to draw.
        </p>
      </header>

      <section aria-labelledby="goals-heading">
        <h2 id="goals-heading" className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          What are you comparing for?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {GOALS.map((goal) => {
            const count = UNIVERSE.filter((e) => goal.categories.includes(e.category)).length
            return (
              <Link
                key={goal.id}
                href={`/compare/${goal.id}`}
                className="group rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="h-full transition-colors group-hover:border-foreground/30">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      {goal.label}
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{count} funds compared</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <footer className="mt-16 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
        <p>
          This tool shows published fund data side by side. It does not recommend funds, does not
          know your circumstances, and is not investment advice. Past performance does not predict
          future results.{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
            How the numbers are calculated
          </Link>
        </p>
      </footer>
    </main>
  )
}
