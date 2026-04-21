import type { Metadata } from "next"
import { IBM_Plex_Mono, Manrope, Space_Grotesk } from "next/font/google"

import "@/app/globals.css"
import { Providers } from "@/app/providers"
import { getCurrentUser } from "@/lib/auth/require"
import { cn } from "@/lib/utils"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
})

const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
})

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "PDF Annotator",
  description: "Scaffolded SaaS foundations for PDF and image annotation.",
}

const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem("pdf-annotator-theme");
      var resolved = stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      document.documentElement.setAttribute("data-theme", resolved);
    } catch (error) {
      document.documentElement.setAttribute("data-theme", "light");
    }
  })();
`

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        heading.variable,
        manrope.variable
      )}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Providers initialUser={user}>{children}</Providers>
      </body>
    </html>
  )
}
