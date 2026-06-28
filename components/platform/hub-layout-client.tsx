"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Bot,
  HelpCircle,
  Menu,
  Layers,
  ChevronRight,
  Bell,
  User,
  CreditCard,
  ShieldCheck,
  Shield,
} from "lucide-react"
import { LogoMark } from "@/components/common/logo-mark"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { UserMenu } from "@/components/common/user-menu"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const PRIMARY_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", exact: true },
  { label: "PDF Annotator", icon: FileText, href: "/services/annotations" },
  { label: "AI Chat", icon: Bot, href: "/services/ai-chat" },
]

const COMING_SOON_NAV = [
  { label: "Analytics", icon: Layers },
]

const ACCOUNT_NAV = [
  { label: "Profile", icon: User, href: "/settings/profile" },
  { label: "Security", icon: ShieldCheck, href: "/settings/security" },
  { label: "Billing", icon: CreditCard, href: "/settings/billing" },
]

const BOTTOM_NAV = [
  { label: "Help", icon: HelpCircle, href: "/help" },
]

interface NavItemProps {
  icon: React.ElementType
  label: string
  href?: string
  exact?: boolean
  pathname: string
  comingSoon?: boolean
  onClick?: () => void
}

function NavItem({ icon: Icon, label, href, exact, pathname, comingSoon, onClick }: NavItemProps) {
  const isActive = href
    ? exact
      ? pathname === href
      : pathname.startsWith(href)
    : false

  if (comingSoon || !href) {
    return (
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-not-allowed select-none">
        <Icon className="size-4 shrink-0 text-muted-foreground/30" />
        <span className="flex-1 text-muted-foreground/30">{label}</span>
        <Badge className="text-[9px] h-4 px-1.5 py-0 bg-muted/40 text-muted-foreground/40 border-0 rounded-full">
          Soon
        </Badge>
      </div>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="flex-1">{label}</span>
      {isActive && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
    </Link>
  )
}

interface SidebarProps {
  pathname: string
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
  planId?: string
  role?: string
  onNavClick?: () => void
}

function Sidebar({ pathname, userName, userImage, planId, role, onNavClick }: SidebarProps) {
  const initials = (userName ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex h-full flex-col bg-background/90 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 shrink-0 border-b border-border/30">
        <LogoMark compact />
        <span className="font-bold text-[17px] tracking-tight">Clustar</span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-5 pb-2 space-y-0.5">
        <p className="px-3 mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/35">
          Main
        </p>
        {PRIMARY_NAV.map((item) => (
          <NavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            exact={item.exact}
            pathname={pathname}
            onClick={onNavClick}
          />
        ))}

        <div className="pt-5 space-y-0.5">
          <p className="px-3 mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/35">
            Coming Soon
          </p>
          {COMING_SOON_NAV.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              pathname={pathname}
              comingSoon
            />
          ))}
        </div>

        <div className="pt-5 space-y-0.5">
          <p className="px-3 mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/35">
            Account
          </p>
          {ACCOUNT_NAV.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              pathname={pathname}
              onClick={onNavClick}
            />
          ))}
        </div>

        {role === "ADMIN" && (
          <div className="pt-5 space-y-0.5">
            <p className="px-3 mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/35">
              Admin
            </p>
            <NavItem
              icon={Shield}
              label="Admin"
              href="/admin"
              pathname={pathname}
              onClick={onNavClick}
            />
          </div>
        )}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-3 border-t border-border/30 space-y-0.5">
        {BOTTOM_NAV.map((item) => (
          <NavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            pathname={pathname}
            onClick={onNavClick}
          />
        ))}
      </div>

      {/* User card */}
      <div className="px-3 pb-4 pt-2 border-t border-border/30">
        <Link
          href="/settings"
          onClick={onNavClick}
          className="group flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors"
        >
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={userImage ?? undefined} alt={userName ?? "User"} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate leading-tight">
              {userName ?? "User"}
            </p>
            <p className="text-[11px] text-muted-foreground capitalize leading-tight mt-0.5">
              {planId ?? "free"} plan
            </p>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
        </Link>
      </div>
    </div>
  )
}

interface HubLayoutClientProps {
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
  planId?: string
  role?: string
  children: React.ReactNode
}

export function HubLayoutClient({
  userName,
  userEmail,
  userImage,
  planId = "free",
  role = "USER",
  children,
}: HubLayoutClientProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarProps: SidebarProps = {
    pathname,
    userName,
    userEmail,
    userImage,
    planId,
    role,
  }

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,color-mix(in_oklab,var(--primary)_8%,transparent)_0,transparent_50%),radial-gradient(circle_at_80%_80%,color-mix(in_oklab,var(--accent)_6%,transparent)_0,transparent_35%)]" />

      {/* ── Desktop Sidebar (fixed, 240px) ───────────────────── */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:z-20 border-r border-border/30">
        <Sidebar {...sidebarProps} />
      </aside>

      {/* ── Mobile Sidebar (Sheet drawer) ────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0 border-r border-border/30" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar {...sidebarProps} onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ── Main Content (offset by sidebar width on desktop) ─ */}
      <div className="flex min-w-0 flex-1 flex-col relative lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border/30 bg-background/70 backdrop-blur-xl">
          <div className="flex w-full items-center justify-between px-4 sm:px-6">
            {/* Mobile: hamburger + logo */}
            <div className="flex items-center gap-3 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
              <Link href="/dashboard" className="flex items-center gap-2">
                <LogoMark compact />
                <span className="font-semibold text-base tracking-tight">Clustar</span>
              </Link>
            </div>

            {/* Desktop: spacer so controls stay flush right */}
            <div className="hidden lg:block" />

            {/* Right controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
              </Button>
              <ThemeToggle />
              <UserMenu
                name={userName ?? null}
                email={userEmail ?? null}
                image={userImage}
                planId={planId}
                role={role}
              />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
