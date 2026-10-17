"use client"

import { useSyncExternalStore } from "react"
import { X } from "lucide-react"
import { SNAPSHOT_DATE, SNAPSHOT_SOURCE, snapshotAgeMonths } from "@/lib/data/directory"

const DISMISS_KEY = "snapshot-banner-dismissed"

/**
 * Dismissal is external state (sessionStorage), so it is read through
 * useSyncExternalStore rather than mirrored into useState from an effect.
 * That keeps the server and hydration snapshots explicit: the server always
 * renders the banner open, and the client swaps to the stored value on
 * hydration without a mismatch.
 *
 * sessionStorage, not localStorage, on purpose. The reminder should return on
 * the next visit, because the point of the notice is that these figures are
 * not current.
 */
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1"
  } catch {
    // Private browsing or storage disabled: keep the banner visible.
    return false
  }
}

/** The server has no session, so the banner always renders open there. */
function getServerSnapshot(): boolean {
  return false
}

function dismiss() {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, "1")
  } catch {
    // Non-fatal.
  }
  for (const listener of listeners) listener()
}

export function SnapshotBanner({ note }: { note?: string }) {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (dismissed) return null

  const months = snapshotAgeMonths()

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border-2 border-[#0A0A0A] border-l-[8px] border-l-[#FF3366] bg-white px-4 py-3 text-sm shadow-[3px_3px_0_rgba(10,10,10,0.12)]">
      <p className="flex-1">
        <span className="font-semibold text-slate-900">Historical snapshot</span>{" "}
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
          {note ?? "Open any fund for recent daily prices and derived risk metrics."}
        </span>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss snapshot notice"
        className="-mr-1 -mt-0.5 shrink-0 rounded p-1 text-slate-500 transition-colors hover:bg-[#00E5FF]/30 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3366]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
