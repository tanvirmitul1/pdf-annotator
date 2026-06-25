"use client";

import Link from "next/link"

import { LogoMark } from "@/components/common/logo-mark"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { UserMenu } from "@/components/common/user-menu"

interface HubLayoutClientProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  planId?: string;
  role?: string;
  children: React.ReactNode;
}

export function HubLayoutClient({
  userName,
  userEmail,
  userImage,
  planId = "free",
  role = "USER",
  children,
}: HubLayoutClientProps) {
  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Ambient gradients */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,color-mix(in_oklab,var(--primary)_8%,transparent)_0,transparent_50%),radial-gradient(circle_at_80%_80%,color-mix(in_oklab,var(--accent)_6%,transparent)_0,transparent_35%)]" />

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col relative">
        {/* Top Navigation — full width, matching body padding */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border/30 bg-background/70 backdrop-blur-xl">
          <div className="flex w-full items-center justify-between px-6 sm:px-8 lg:px-12">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <LogoMark compact />
              <span className="hidden sm:inline-block font-semibold text-lg tracking-tight">
                WorkHub
              </span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-2">
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
  );
}
