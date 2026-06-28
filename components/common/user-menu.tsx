"use client"

import { CircleHelp, LogOut, Settings, Shield } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

export function UserMenu({
  name,
  email,
  image,
  planId = "free",
  role = "USER",
}: {
  name: string | null
  email: string | null
  image?: string | null
  planId?: string
  role?: string
}) {
  const displayName = name ?? "Unknown"
  const displayEmail = email ?? "No email"
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "PA"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full ring-2 ring-border/60 hover:ring-primary/40 transition-all"
          aria-label="User menu"
        >
          <Avatar className="size-8">
            <AvatarImage src={image ?? undefined} alt={displayName} />
            <AvatarFallback className="text-xs font-semibold">
              {initials}
            </AvatarFallback>
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
              <AvatarImage src={image ?? undefined} alt={displayName} />
              <AvatarFallback className="text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {displayEmail}
              </p>
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
          <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 text-sm cursor-pointer">
            <Link href="/settings">
              <Settings className="size-4 text-muted-foreground" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 text-sm cursor-pointer">
            <Link href="/help">
              <CircleHelp className="size-4 text-muted-foreground" />
              <span>Help & Support</span>
            </Link>
          </DropdownMenuItem>
          {role === "ADMIN" && (
            <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 text-sm cursor-pointer">
              <Link href="/admin">
                <Shield className="size-4 text-muted-foreground" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}
        </div>

        <Separator />

        <div className="p-1.5">
          <DropdownMenuItem
            className="rounded-lg px-3 py-2.5 text-sm text-destructive focus:text-destructive focus:bg-destructive/8 cursor-pointer"
            onSelect={() => void signOut({ callbackUrl: "/" })}
          >
            <LogOut className="size-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
