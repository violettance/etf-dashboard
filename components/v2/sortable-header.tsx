import Link from "next/link"

/**
 * Sortable table header.
 *
 * Sort state lives in the URL rather than component state, so a sorted view is
 * shareable, survives a reload and works without JavaScript. Every table in the
 * app uses this one implementation so the interaction is identical everywhere.
 */
export type SortDirection = "asc" | "desc"

export function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  basePath,
  params = {},
  numeric = false,
  /** Direction applied on first click. Numeric columns start high-to-low. */
  defaultDirection,
  title,
}: {
  label: string
  sortKey: string
  activeKey: string
  direction: SortDirection
  basePath: string
  params?: Record<string, string | undefined>
  numeric?: boolean
  defaultDirection?: SortDirection
  title?: string
}) {
  const active = activeKey === sortKey
  const firstClick: SortDirection = defaultDirection ?? (numeric ? "desc" : "asc")
  const next: SortDirection = active ? (direction === "asc" ? "desc" : "asc") : firstClick

  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, v)
  }
  search.set("sort", sortKey)
  search.set("dir", next)

  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-4 py-3 font-medium text-slate-600 ${numeric ? "text-right" : "text-left"}`}
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <Link
        href={`${basePath}?${search.toString()}`}
        title={title ?? `Sort by ${label.toLowerCase()}`}
        className={`inline-flex items-center gap-1 rounded hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3366] ${
          numeric ? "flex-row-reverse" : ""
        }`}
      >
        {label}
        <span
          aria-hidden
          className={`text-xs transition-opacity ${active ? "opacity-100" : "opacity-25"}`}
        >
          {active ? (direction === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </Link>
    </th>
  )
}
