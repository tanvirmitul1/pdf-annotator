import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CookieBanner } from "@/components/app/cookie-banner"
import { AnalyticsBridge } from "@/components/app/analytics-bridge"
import { cn } from "@/lib/utils"
import { getAnalyticsConsent } from "@/lib/analytics/server"

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const consent = await getAnalyticsConsent()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          <TooltipProvider delayDuration={150}>
            <AnalyticsBridge consent={consent} />
            {children}
            <CookieBanner initialConsent={consent} />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
