import type { Metadata } from "next"
import Link from "next/link"
import { DashboardNav } from "@/components/v2/dashboard-nav"
import "./globals.css"

export const metadata: Metadata = {
  title: "Which ETF?",
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
              <Link href="/" className="font-display text-lg font-bold leading-none tracking-tight">
                Which ETF?
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
                <span>Data for comparison, not investment advice</span>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  )
}
