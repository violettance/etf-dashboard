import { SNAPSHOT_DATE, SNAPSHOT_SOURCE, snapshotAgeMonths } from "@/lib/data/directory"

/**
 * Data provenance, stated before any figure is read rather than in a footnote.
 * The previous version of this dashboard displayed the same snapshot with no
 * indication of when it was captured.
 */
export function SnapshotBanner({ note }: { note?: string }) {
  const months = snapshotAgeMonths()
  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
      <span className="font-medium text-slate-900">Snapshot data</span>{" "}
      <span className="text-slate-600">
        captured{" "}
        <time dateTime={SNAPSHOT_DATE} className="font-medium text-slate-900">
          {new Date(SNAPSHOT_DATE).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>{" "}
        from {SNAPSHOT_SOURCE}, roughly {months} months old. {note ?? "Open any fund for live prices."}
      </span>
    </div>
  )
}
