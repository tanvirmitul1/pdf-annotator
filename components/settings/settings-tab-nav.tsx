"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, ShieldCheck, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Profile", href: "/settings/profile", icon: User },
  { label: "Security", href: "/settings/security", icon: ShieldCheck },
  { label: "Billing", href: "/settings/billing", icon: CreditCard },
]

export function SettingsTabNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 -mb-px">
      {TABS.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
