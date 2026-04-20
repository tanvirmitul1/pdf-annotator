import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "@/app/globals.css"
import { Providers } from "@/app/providers"
import { cn } from "@/lib/utils"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
  // const user = await getCurrentUser()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Providers initialUser={null}>{children}</Providers>
      </body>
    </html>
  )
}
