import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"

export const metadata: Metadata = {
  title: "ETF Decision Dashboard",
  description:
    "Screen US-listed ETFs, compare category performance and risk-return patterns, and drill into live prices.",
}

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/performers", label: "Top performers" },
  { href: "/risk-return", label: "Risk & return" },
  { href: "/categories", label: "Categories" },
  { href: "/screener", label: "Screener" },
  { href: "/compare", label: "Compare" },
  { href: "/news", label: "News sentiment" },
]

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              ETF Decision Dashboard
            </Link>
            <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-slate-600 transition-colors hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
