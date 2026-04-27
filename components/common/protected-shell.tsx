"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import {
  CircleHelp,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Tag,
  Trash2,
} from "lucide-react"
import { signOut } from "next-auth/react"

import { LogoMark } from "@/components/common/logo-mark"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navigation = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/collections", label: "Collections", icon: FolderKanban },
  { href: "/app/tags", label: "Tags", icon: Tag },
  { href: "/app/trash", label: "Trash", icon: Trash2 },
]

const bottomNav = [
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/help", label: "Help", icon: CircleHelp },
]

export interface ProtectedShellProps {
  name: string
  email: string
  image?: string | null
  planId?: string
  children: React.ReactNode
}

export function ProtectedShell({
  name,
  email,
  image,
  planId = "free",
  children,
}: ProtectedShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = useMemo(() => {
    const value = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
    return value.join("") || "PA"
  }, [name])

  function renderNavItems(onNavigate?: () => void) {
    return (
      <nav className="space-y-0.5" aria-label="Primary">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <item.icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    )
  }

  const userDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full ring-2 ring-border/60 hover:ring-primary/40 transition-all"
          aria-label="User menu"
        >
          <Avatar className="size-8">
            <AvatarImage src={image ?? undefined} alt={name} />
            <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl border border-border/70 bg-popover/95 p-0 shadow-lg backdrop-blur-xl"
      >
        {/* User info header */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={image ?? undefined} alt={name} />
              <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
              <Badge
                variant="outline"
                className="mt-1.5 h-5 rounded-full border-primary/25 bg-primary/8 px-2 text-[10px] font-medium text-primary capitalize"
              >
                {planId} plan
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        <div className="p-1.5">
          <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 text-sm">
            <Link href="/app/settings">
              <Settings className="size-4 text-muted-foreground" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 text-sm">
            <Link href="/app/help">
              <CircleHelp className="size-4 text-muted-foreground" />
              Help & Support
            </Link>
          </DropdownMenuItem>
        </div>

        <Separator />

        <div className="p-1.5">
          <DropdownMenuItem
            className="rounded-lg px-3 py-2.5 text-sm text-destructive focus:text-destructive focus:bg-destructive/8"
            onSelect={() => void signOut({ callbackUrl: "/" })}
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_8%,transparent)_0,transparent_30%),radial-gradient(circle_at_bottom_right,color-mix(in_oklab,var(--accent)_8%,transparent)_0,transparent_28%)]" />

      {/* Desktop sidebar */}
      <aside className="relative hidden h-screen w-[220px] shrink-0 flex-col border-r border-border/60 bg-card/50 backdrop-blur-sm lg:flex xl:w-[240px]">
        <div className="flex h-full flex-col px-3 py-4">
          {/* Logo */}
          <div className="mb-6 px-2">
            <LogoMark compact />
            <p className="mt-1 text-[11px] font-medium text-foreground/80 tracking-tight">PDF Annotator</p>
          </div>

          {/* Main navigation */}
          <div className="flex-1 space-y-5">
            <div>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Workspace
              </p>
              {renderNavItems()}
            </div>

            <Separator />

            <div>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Account
              </p>
              <nav className="space-y-0.5">
                {bottomNav.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Bottom user section */}
          <Separator className="mb-3" />
          <div className="flex items-center gap-2 px-2">
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={image ?? undefined} alt={name} />
              <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{name}</p>
              <p className="truncate text-[10px] text-muted-foreground capitalize">{planId} plan</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => void signOut({ callbackUrl: "/" })}
              aria-label="Sign out"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-card/80 px-4 backdrop-blur-xl sm:px-5">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-md"
                  aria-label="Open navigation"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[220px] border-border/60 bg-card/95 p-0 backdrop-blur-xl"
              >
                <div className="flex h-full flex-col px-3 py-4">
                  <div className="mb-6 px-2">
                    <LogoMark compact />
                    <p className="mt-1 text-[11px] font-medium text-foreground/80">PDF Annotator</p>
                  </div>
                  <div className="flex-1">
                    {renderNavItems(() => setMobileOpen(false))}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center gap-2 px-2">
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage src={image ?? undefined} alt={name} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">{name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{email}</p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <div className="flex h-9 items-center rounded-md border border-border/70 bg-muted/40 pl-9 pr-3 text-sm text-muted-foreground cursor-default select-none">
              <span>Search documents...</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            {userDropdown}
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          className="relative flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="animate-in duration-300 fade-in-0 slide-in-from-bottom-2">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
