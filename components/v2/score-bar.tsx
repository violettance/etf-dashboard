import { cn } from "@/lib/utils"

/** Renders a 0-100 dimension score. Null renders as an explicit "no data" state. */
export function ScoreBar({ score, className }: { score: number | null; className?: string }) {
  if (score === null) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="h-1.5 w-full rounded-full bg-muted" />
        <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">n/a</span>
      </div>
    )
  }

  const tone =
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-rose-500"

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${score}%` }}
          role="meter"
          aria-valuenow={Math.round(score)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {Math.round(score)}
      </span>
    </div>
  )
}
