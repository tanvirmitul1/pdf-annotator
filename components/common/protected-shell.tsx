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
  UserCircle2,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navigation = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/collections", label: "Collections", icon: FolderKanban },
  { href: "/app/tags", label: "Tags", icon: Tag },
  { href: "/app/trash", label: "Trash", icon: Trash2 },
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

  function renderNavigation(onNavigate?: () => void) {
    return (
      <nav className="space-y-1.5" aria-label="Primary">
        {navigation.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition duration-150",
                "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                isActive
                  ? "border-primary/20 bg-primary/10 text-foreground shadow-[0_18px_40px_-32px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
                  : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent/45 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "size-4 transition",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-primary"
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,color-mix(in_oklab,var(--background)_92%,black)_0%,color-mix(in_oklab,var(--background)_98%,transparent)_100%)] px-3 py-3 sm:px-4 sm:py-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_10%,transparent)_0,transparent_24%),radial-gradient(circle_at_85%_20%,color-mix(in_oklab,white_5%,transparent)_0,transparent_22%),radial-gradient(circle_at_bottom_right,color-mix(in_oklab,var(--accent)_12%,transparent)_0,transparent_24%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1680px] gap-4">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[272px] flex-col rounded-[1.4rem] border border-border/60 bg-card/75 p-4 shadow-[0_28px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur-xl lg:flex">
          <div className="border-b border-border/60 pb-4">
            <LogoMark />
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
            <Avatar size="lg">
              <AvatarImage src={image ?? undefined} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 px-1 text-[11px] font-medium tracking-[0.24em] text-muted-foreground uppercase">
              Workspace
            </p>
            {renderNavigation()}
          </div>

          <div className="mt-auto space-y-3 rounded-xl border border-border/60 bg-background/45 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
                  Workspace
                </p>
                <p className="mt-1 font-heading text-lg font-semibold text-foreground capitalize">
                  {planId}
                </p>
              </div>
              <Badge
                variant="outline"
                className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary"
              >
                Active
              </Badge>
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              Keep documents, collections, annotations, and collaboration in one
              calm workspace.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="sticky top-3 z-30 rounded-[1.2rem] border border-border/60 bg-card/80 px-3 py-3 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:px-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 lg:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-lg"
                      aria-label="Open navigation"
                      className="rounded-xl border-border/70 bg-card/70 hover:border-primary/35 hover:bg-accent/70"
                    >
                      <Menu className="size-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="border-border/60 bg-card/95 p-0 backdrop-blur-xl"
                  >
                    <div className="flex h-full flex-col p-4">
                      <div className="border-b border-border/60 pb-4">
                        <LogoMark />
                      </div>
                      <div className="mt-5">
                        {renderNavigation(() => setMobileOpen(false))}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <LogoMark compact />
              </div>

              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <div className="flex h-11 items-center rounded-xl border border-border/70 bg-background/55 pr-4 pl-11 text-sm text-muted-foreground">
                  Search documents, collections, and annotations
                  <span className="ml-auto rounded-full border border-border/70 px-2 py-0.5 text-[0.68rem] tracking-[0.2em] uppercase">
                    Soon
                  </span>
                </div>
              </div>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto rounded-xl border-border/70 bg-background/55 px-2 py-2 hover:border-primary/35 hover:bg-accent/70"
                  >
                    <Avatar size="sm">
                      <AvatarImage src={image ?? undefined} alt={name} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-left sm:block">
                      <span className="block text-sm font-medium text-foreground">
                        {name}
                      </span>
                      <span className="block max-w-[160px] truncate text-xs text-muted-foreground">
                        {email}
                      </span>
                    </span>
                    <UserCircle2 className="size-4 text-muted-foreground sm:hidden" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 rounded-xl border border-border/70 bg-popover/95 p-2 backdrop-blur-xl"
                >
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link href="/app/settings">
                      <Settings className="size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link href="/app/settings">
                      <Settings className="size-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link href="/app/help">
                      <CircleHelp className="size-4" />
                      Help
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-xl"
                    onSelect={() => void signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main
            id="main-content"
            className="animate-in duration-500 fade-in-0 slide-in-from-bottom-3 pb-3"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
