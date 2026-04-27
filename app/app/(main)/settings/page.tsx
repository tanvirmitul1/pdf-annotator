import { requireAppUser } from "@/lib/auth/require"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
  const session = await requireAppUser()
  const { name, email, image, planId } = session.user
  const initials = (name ?? "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your account, appearance, and preferences.
        </p>
      </div>

      {/* Profile */}
      <section className="glass-panel surface-border rounded-xl p-6 space-y-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Profile
        </p>
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarImage src={image ?? undefined} alt={name ?? "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{name ?? "—"}</p>
            <p className="text-sm text-muted-foreground truncate">{email ?? "—"}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-6">
          Your profile is managed through your Google account. To update your name or photo, edit your Google profile.
        </p>
      </section>

      {/* Appearance */}
      <section className="glass-panel surface-border rounded-xl p-6 space-y-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Appearance
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Theme</p>
            <p className="text-xs text-muted-foreground mt-0.5">Switch between light and dark mode.</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      {/* Plan */}
      <section className="glass-panel surface-border rounded-xl p-6 space-y-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Plan &amp; Usage
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground capitalize">{planId ?? "free"} plan</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your current subscription tier.
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary capitalize"
          >
            {planId ?? "free"}
          </Badge>
        </div>
        <Separator className="opacity-50" />
        <p className="text-xs text-muted-foreground leading-6">
          Upgrade options and detailed usage metrics will appear here in a future release.
        </p>
      </section>

      {/* Danger zone */}
      <section className="glass-panel surface-border rounded-xl p-6 space-y-4 border-destructive/20">
        <p className="text-xs font-semibold tracking-[0.2em] text-destructive uppercase">
          Danger Zone
        </p>
        <div>
          <p className="text-sm font-medium text-foreground">Delete account</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-6">
            Permanently delete your account and all associated data. This action cannot be undone. Contact support to proceed.
          </p>
        </div>
      </section>
    </div>
  )
}
