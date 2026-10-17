import type { Metadata } from "next"
import Link from "next/link"
import { DashboardNav } from "@/components/v2/dashboard-nav"
import "./globals.css"

export const metadata: Metadata = {
  title: "Which ETF? | Violettance",
  description:
    "Screen US-listed ETFs, compare cost and structure, and inspect the source behind each figure.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4F4F0] text-[#0A0A0A] antialiased">
        <header className="sticky top-0 z-30 border-b-2 border-[#0A0A0A] bg-[#F4F4F0]/95 backdrop-blur">
          <div className="mx-auto max-w-[1600px] px-5 sm:px-6 lg:pl-64">
            <div className="flex min-h-[68px] items-center justify-between gap-4">
              <Link href="/" className="group inline-flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-[#0A0A0A] bg-[#FF3366] font-display text-lg font-bold shadow-[3px_3px_0_#0A0A0A] transition-transform group-hover:-translate-y-0.5">
                  W
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-bold leading-none tracking-tight">
                    Which ETF?
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Violettance · data product
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1600px] lg:flex">
          <DashboardNav />
          <div className="min-w-0 flex-1">
            {children}
            <footer className="mt-14 border-t-2 border-[#0A0A0A] bg-white">
              <div className="flex flex-col gap-2 px-5 py-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <span>Which ETF? · an independent Violettance data product</span>
                <span>Data for comparison, not investment advice</span>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  )
}
