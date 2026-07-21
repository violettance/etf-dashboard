import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'ETF Analytics Dashboard',
  description: 'Comprehensive ETF performance and market analysis',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get GTM Container ID from environment variables
  const GTM_CONTAINER_ID = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Initialize dataLayer before any GTM scripts */}
        <Script
          id="gtm-datalayer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            `,
          }}
        />
      </head>
      <body>
        {/* Google Tag Manager */}
        {GTM_CONTAINER_ID && (
          <>
            <Script
              id="gtm-script"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`}
            />
            {/* Google Tag Manager (noscript) */}
            <noscript>
              <iframe 
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
                height="0" 
                width="0" 
                style={{display: 'none', visibility: 'hidden'}}
              />
            </noscript>
          </>
        )}
        
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
