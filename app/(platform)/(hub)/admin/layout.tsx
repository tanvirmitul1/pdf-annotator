import { redirect } from "next/navigation"
import Link from "next/link"
import { requireAppUser } from "@/lib/auth/require"
import { BarChart3, Activity, FileText, Key, Server, Users, AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

const adminNav = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/errors", label: "Errors", icon: AlertCircle },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/api-keys", label: "API Keys", icon: Key },
  { href: "/admin/system", label: "System", icon: Server },
]

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAppUser()

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage users, content, and system health</p>
      </div>

      <nav className="flex gap-1 border-b border-border/60">
        {adminNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 border-transparent hover:border-primary/50 hover:text-foreground transition-colors"
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div>{children}</div>
    </div>
  )
}
