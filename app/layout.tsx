import type { Metadata } from "next"
import { JetBrains_Mono, Plus_Jakarta_Sans, Sora } from "next/font/google"

import "@/app/globals.css"
import { Providers } from "@/app/providers"
import { getCurrentUser } from "@/lib/auth/require"
import { cn } from "@/lib/utils"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const heading = Sora({
  subsets: ["latin"],
  variable: "--font-display",
})

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Clustar - Find Any App, All in One Place",
  description: "Multi-service productivity platform with document annotation, AI chat, and more.",
  icons: {
    icon: "/icon.svg",
  },
}

const themeScript = `
  (function() {
    try {
      var theme = null;
      var persisted = localStorage.getItem("persist:theme");
      if (persisted) {
        var parsed = JSON.parse(persisted);
        if (parsed.value) theme = JSON.parse(parsed.value);
      }
      var resolved;
      if (theme === "dark" || theme === "light") {
        resolved = theme;
      } else {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      document.documentElement.setAttribute("data-theme", resolved);
    } catch (e) {
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
        plusJakarta.variable
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers initialUser={user}>{children}</Providers>
      </body>
    </html>
  )
}
