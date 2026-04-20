"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Search01Icon,
  DashboardCircleIcon,
  FolderLibraryIcon,
  TagsIcon,
  Delete02Icon,
  HelpCircleIcon,
  Logout02Icon,
  Settings02Icon,
  UserIcon,
  Menu11Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { UserAvatar } from "@/components/app/user-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
  user: {
    displayName: string
    email: string
    imageUrl: string | null
  }
}

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: DashboardCircleIcon },
  { href: "/app/collections", label: "Collections", icon: FolderLibraryIcon },
  { href: "/app/tags", label: "Tags", icon: TagsIcon },
  { href: "/app/trash", label: "Trash", icon: Delete02Icon },
]

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[auto_1fr]">
        <aside
          className={cn(
            "border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200",
            collapsed ? "lg:w-24" : "lg:w-72"
          )}
        >
          <div className="flex h-full flex-col px-4 py-5">
            <div className="flex items-center justify-between gap-3">
              <Link href="/app" className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground">
                  PA
                </div>
                {!collapsed ? (
                  <div>
                    <p className="text-sm font-semibold">PDF Annotator</p>
                    <p className="text-xs text-muted-foreground">Trust & account layer</p>
                  </div>
                ) : null}
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hover:bg-sidebar-accent"
                onClick={() => setCollapsed((current) => !current)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <HugeiconsIcon icon={Menu11Icon} strokeWidth={2} />
              </Button>
            </div>

            <nav className="mt-8 flex flex-1 flex-col gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                const content = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "border-sidebar-border bg-sidebar-accent text-sidebar-foreground shadow-sm"
                        : "border-transparent hover:border-sidebar-border hover:bg-sidebar-accent"
                    )}
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </Link>
                )

                if (!collapsed) {
                  return content
                }

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-border bg-background/85 px-4 py-4 backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-full max-w-xl">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    strokeWidth={2}
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    aria-label="Search documents"
                    placeholder="Search is coming in a later phase"
                    className="h-11 rounded-2xl pl-10 hover:border-input/80 focus-visible:ring-2"
                    readOnly
                  />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto rounded-2xl border border-border px-2 py-2 hover:bg-accent"
                  >
                    <span className="sr-only">Open account menu</span>
                    <UserAvatar name={user.displayName} imageUrl={user.imageUrl} />
                    <span className="hidden text-left sm:block">
                      <span className="block text-sm font-semibold">{user.displayName}</span>
                      <span className="block text-xs text-muted-foreground">{user.email}</span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/app/settings#profile">
                      <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/settings">
                      <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/help">
                      <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
                      Help
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => void handleSignOut()}
                    disabled={signingOut}
                  >
                    <HugeiconsIcon icon={Logout02Icon} strokeWidth={2} />
                    {signingOut ? "Signing out..." : "Sign Out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
