import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Which ETF? — data-driven fund selection",
  description:
    "Rank ETFs against a stated investment goal, with the reasoning behind every ranking.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="border-b">
            <nav className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4 text-sm">
              <Link href="/" className="font-medium">
                Which ETF?
              </Link>
              <Link href="/methodology" className="text-muted-foreground hover:text-foreground">
                Methodology
              </Link>
            </nav>
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
