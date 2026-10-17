"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

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
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open])

  const link = (item: { href: string; label: string }) => {
    const active = isCurrent(pathname, item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={() => setOpen(false)}
        className={`nav-link ${active ? "nav-link-active" : ""}`}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="dashboard-navigation"
        onClick={() => setOpen((value) => !value)}
        className="fixed right-4 top-3 z-[60] grid h-10 w-10 place-items-center border-2 border-[#0A0A0A] bg-[#00E5FF] text-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] lg:hidden"
      >
        {open ? <X aria-hidden="true" size={19} /> : <Menu aria-hidden="true" size={19} />}
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-[#0A0A0A]/45 lg:hidden"
        />
      )}

      <aside
        id="dashboard-navigation"
        className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,86vw)] border-r-2 border-[#0A0A0A] bg-[#F4F4F0] pt-[68px] transition-transform duration-200 lg:sticky lg:top-[68px] lg:z-auto lg:h-[calc(100dvh-68px)] lg:w-60 lg:shrink-0 lg:translate-x-0 lg:pt-0 lg:transition-none ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <nav aria-label="Dashboard" className="flex h-full flex-col overflow-y-auto px-4 py-5">
          <div className="space-y-1">{PRIMARY_LINKS.map(link)}</div>
          <div className="mt-6 border-t border-slate-300 pt-5">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Analysis
            </p>
            <div className="space-y-1">{ANALYSIS_LINKS.map(link)}</div>
          </div>
          <div className="mt-auto border-t border-slate-300 pt-4 text-xs leading-relaxed text-slate-500">
            Data for comparison, not investment advice.
          </div>
        </nav>
      </aside>
    </>
  )
}
