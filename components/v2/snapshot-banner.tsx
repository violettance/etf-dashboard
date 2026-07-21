"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { SNAPSHOT_DATE, SNAPSHOT_SOURCE, snapshotAgeMonths } from "@/lib/data/directory"

const DISMISS_KEY = "snapshot-banner-dismissed"

/**
 * Data provenance, stated before any figure is read rather than in a footnote.
 * The previous version of this dashboard displayed the same snapshot with no
 * indication of when it was captured.
 *
 * Dismissal is kept in sessionStorage rather than localStorage: the reminder
 * should come back on the next visit, because the point of the banner is that
 * these figures are not current.
 */
export function SnapshotBanner({ note }: { note?: string }) {
  // Render open on the server and on first paint so the markup matches, then
  // hide after mount if this session already dismissed it.
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true)
    } catch {
      // Private browsing or storage disabled: leave the banner visible.
    }
  }, [])

  if (mounted && dismissed) return null

  const months = snapshotAgeMonths()

  const dismiss = () => {
    setDismissed(true)
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // Non-fatal: the banner still closes for this page view.
    }
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
      <p className="flex-1">
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
          from {SNAPSHOT_SOURCE}, roughly {months} months old.{" "}
          {note ?? "Open any fund for live prices."}
        </span>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss snapshot notice"
        className="-mr-1 -mt-0.5 shrink-0 rounded p-1 text-amber-800/70 transition-colors hover:bg-amber-100 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
