"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const PRIMARY_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/screener", label: "ETF screener" },
  { href: "/compare", label: "Compare" },
]

const ANALYSIS_LINKS = [
  { href: "/performers", label: "Top performers" },
  { href: "/risk-return", label: "Risk & return" },
  { href: "/categories", label: "Categories" },
  { href: "/news", label: "News sentiment" },
]

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  if (href === "/screener" && pathname.startsWith("/etf/")) return true
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Dashboard"
      className="-mx-1 flex gap-1 overflow-x-auto pb-3 pt-1 [scrollbar-width:thin]"
    >
      {PRIMARY_LINKS.map((item) => {
        const active = isCurrent(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`nav-link whitespace-nowrap ${active ? "nav-link-active" : ""}`}
          >
            {item.label}
          </Link>
        )
      })}
      <span aria-hidden="true" className="mx-1 h-5 self-center border-l border-slate-300" />
      {ANALYSIS_LINKS.map((item) => {
        const active = isCurrent(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`nav-link whitespace-nowrap ${active ? "nav-link-active" : ""}`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
