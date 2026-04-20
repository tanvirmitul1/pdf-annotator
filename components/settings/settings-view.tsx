"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { UserAvatar } from "@/components/app/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ChangePasswordSchema,
  DeleteAccountSchema,
  UpdateProfileSchema,
} from "@/features/settings/schema"
import { makeZodResolver } from "@/lib/forms/zod-resolver"
import { cn } from "@/lib/utils"

type ProfileFormInput = z.infer<typeof UpdateProfileSchema>
type PasswordFormInput = z.infer<typeof ChangePasswordSchema>
type DeleteFormInput = z.infer<typeof DeleteAccountSchema>

interface SettingsViewProps {
  snapshot: {
    user: {
      displayName: string
      email: string
      providers: ("credentials" | "google")[]
      imageUrl: string | null
      deletedAt: string | null
    }
    currentSessionId: string
    plan: {
      name: string
      limits: Record<"documents" | "storageMB" | "shareLinks", number>
    }
    usage: Array<{
      metric: "documents" | "storageMB" | "shareLinks"
      value: number
      limit: number
    }>
    sessions: Array<{
      id: string
      label: string
      userAgent: string
      lastActivityAt: string
    }>
    latestExportJob: {
      status: string
      progress: number
      resultUrl: string | null
      updatedAt: string
    } | null
  }
}

function metricLabel(metric: "documents" | "storageMB" | "shareLinks") {
  if (metric === "storageMB") {
    return "Storage"
  }

  if (metric === "shareLinks") {
    return "Share links"
  }

  return "Documents"
}

function percentForUsage(value: number, limit: number) {
  if (limit === 0) {
    return 0
  }

  return Math.min(100, Math.round((value / limit) * 100))
}

export function SettingsView({ snapshot }: SettingsViewProps) {
  const router = useRouter()
  const [localUser, setLocalUser] = React.useState(snapshot.user)
  const [sessions, setSessions] = React.useState(snapshot.sessions)
  const [exportJob, setExportJob] = React.useState(snapshot.latestExportJob)
  const [statusMessage, setStatusMessage] = React.useState("")
  const [dangerMessage, setDangerMessage] = React.useState("")
  const isGooglePrimary = localUser.providers.includes("google") && !localUser.providers.includes("credentials")

  const profileForm = useForm<ProfileFormInput>({
    resolver: makeZodResolver(UpdateProfileSchema),
    defaultValues: {
      displayName: snapshot.user.displayName,
    },
  })

  const passwordForm = useForm<PasswordFormInput>({
    resolver: makeZodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  })

  const deleteForm = useForm<DeleteFormInput>({
    resolver: makeZodResolver(DeleteAccountSchema),
    defaultValues: localUser.providers.includes("credentials")
      ? { method: "credentials", password: "" }
      : { method: "google", email: localUser.email },
  })

  async function saveProfile(values: ProfileFormInput) {
    setStatusMessage("")
    const previousName = localUser.displayName
    setLocalUser((current) => ({ ...current, displayName: values.displayName }))

    const response = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      setLocalUser((current) => ({ ...current, displayName: previousName }))
      const payload = (await response.json()) as { error?: { message?: string } }
      setStatusMessage(payload.error?.message ?? "Unable to save profile")
      return
    }

    setStatusMessage("Profile saved.")
    router.refresh()
  }

  async function updatePassword(values: PasswordFormInput) {
    setStatusMessage("")
    const response = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } }
      setStatusMessage(payload.error?.message ?? "Password change failed")
      return
    }

    passwordForm.reset()
    setStatusMessage("Password updated.")
  }

  async function revokeSession(sessionId: string) {
    const response = await fetch("/api/settings/sessions/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } }
      setStatusMessage(payload.error?.message ?? "Session revoke failed")
      return
    }

    setSessions((current) => current.filter((session) => session.id !== sessionId))
    setStatusMessage("Session revoked.")
  }

  async function revokeOtherSessions() {
    const response = await fetch("/api/settings/sessions/revoke-others", {
      method: "POST",
    })

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } }
      setStatusMessage(payload.error?.message ?? "Unable to revoke sessions")
      return
    }

    setSessions((current) => current.filter((session) => session.id === snapshot.currentSessionId))
    setStatusMessage("Other sessions revoked.")
  }

  async function queueExport() {
    setDangerMessage("")
    const response = await fetch("/api/settings/export", {
      method: "POST",
    })

    const payload = (await response.json()) as {
      data?: { status: string; progress: number; resultUrl: string | null; updatedAt: string }
      error?: { message?: string }
    }

    if (!response.ok || !payload.data) {
      setDangerMessage(payload.error?.message ?? "Could not queue export")
      return
    }

    setExportJob(payload.data)
    setDangerMessage("Export queued. We’ll email you when it is ready.")
  }

  async function deleteAccount(values: DeleteFormInput) {
    setDangerMessage("")
    const response = await fetch("/api/settings/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } }
      setDangerMessage(payload.error?.message ?? "Could not schedule account deletion")
      return
    }

    setDangerMessage("Account deletion scheduled. You can restore it from the grace-period banner.")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm/6 text-muted-foreground">
          Manage your account, privacy posture, and the trust details around your study space.
        </p>
      </div>

      <p role="status" aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {statusMessage}
      </p>

      <Tabs defaultValue="profile" className="gap-6">
        <TabsList variant="line" className="w-full overflow-x-auto rounded-none border-b border-border p-0">
          <TabsTrigger
            value="profile"
            id="settings-tab-profile"
            aria-controls="settings-panel-profile"
            className="rounded-none px-4 py-3"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="plan"
            id="settings-tab-plan"
            aria-controls="settings-panel-plan"
            className="rounded-none px-4 py-3"
          >
            Plan & Usage
          </TabsTrigger>
          <TabsTrigger
            value="security"
            id="settings-tab-security"
            aria-controls="settings-panel-security"
            className="rounded-none px-4 py-3"
          >
            Security
          </TabsTrigger>
          <TabsTrigger
            value="danger"
            id="settings-tab-danger"
            aria-controls="settings-panel-danger"
            className="rounded-none px-4 py-3"
          >
            Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="profile"
          className="space-y-6"
          id="settings-panel-profile"
          aria-labelledby="settings-tab-profile"
        >
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-muted/40 p-4 sm:flex-row sm:items-center">
                <UserAvatar name={localUser.displayName} imageUrl={localUser.imageUrl} />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{localUser.displayName}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{localUser.email}</span>
                    {isGooglePrimary ? <Badge variant="outline">Google OAuth</Badge> : <Badge variant="outline">Credentials</Badge>}
                  </div>
                </div>
              </div>

              <form className="space-y-4" onSubmit={profileForm.handleSubmit((values) => void saveProfile(values))}>
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input
                    id="display-name"
                    {...profileForm.register("displayName")}
                    aria-invalid={profileForm.formState.errors.displayName ? "true" : "false"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email address</Label>
                  <Input id="profile-email" value={localUser.email} readOnly aria-readonly="true" />
                </div>
                <Button type="submit" size="lg" className="hover:bg-primary/90" disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="plan"
          className="space-y-6"
          id="settings-panel-plan"
          aria-labelledby="settings-tab-plan"
        >
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Plan & Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-border bg-muted/40 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current plan</p>
                  <p className="text-xl font-semibold">{snapshot.plan.name}</p>
                </div>
                <Button asChild size="lg" className="hover:bg-primary/90">
                  <Link href="/app/settings/upgrade">Upgrade</Link>
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {snapshot.usage.map((metric) => {
                  const percent = percentForUsage(metric.value, metric.limit)
                  const tone = percent > 95 ? "bg-destructive" : percent > 80 ? "bg-amber-500" : "bg-primary"
                  return (
                    <Card key={metric.metric} className="rounded-[1.5rem] border-border/70 shadow-none">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{metricLabel(metric.metric)}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-xs text-muted-foreground">{percent}%</span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {metric.value} / {metric.limit} {metric.metric === "storageMB" ? "MB" : ""}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-muted">
                          <div className={cn("h-full rounded-full transition-[width]", tone)} style={{ width: `${percent}%` }} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {metric.value} of {metric.limit} used
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="security"
          className="space-y-6"
          id="settings-panel-security"
          aria-labelledby="settings-tab-security"
        >
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-[1.5rem] border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold">Connected accounts</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {localUser.providers.map((provider) => (
                    <Badge key={provider} variant="outline" className="capitalize">
                      {provider}
                    </Badge>
                  ))}
                </div>
              </div>

              {localUser.providers.includes("credentials") ? (
                <form className="space-y-4 rounded-[1.5rem] border border-border p-4" onSubmit={passwordForm.handleSubmit((values) => void updatePassword(values))}>
                  <div>
                    <p className="text-sm font-semibold">Change password</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Re-authenticate before saving a new password.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input id="current-password" type="password" {...passwordForm.register("currentPassword")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input id="new-password" type="password" {...passwordForm.register("newPassword")} />
                  </div>
                  <Button type="submit" className="hover:bg-primary/90" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? "Saving..." : "Save password"}
                  </Button>
                </form>
              ) : null}

              <div className="space-y-4 rounded-[1.5rem] border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Active sessions</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Revoke sessions you no longer recognize.
                    </p>
                  </div>
                  <Button type="button" variant="outline" className="hover:bg-accent" onClick={() => void revokeOtherSessions()}>
                    Revoke all other sessions
                  </Button>
                </div>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex flex-col gap-3 rounded-[1.25rem] border border-border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{session.label}</p>
                          {session.id === snapshot.currentSessionId ? <Badge>This device</Badge> : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{session.userAgent}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Last active: {new Date(session.lastActivityAt).toLocaleString()}
                        </p>
                      </div>
                      {session.id !== snapshot.currentSessionId ? (
                        <Button type="button" variant="outline" className="hover:bg-accent" onClick={() => void revokeSession(session.id)}>
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="danger"
          className="space-y-6"
          id="settings-panel-danger"
          aria-labelledby="settings-tab-danger"
        >
          <Card className="rounded-[2rem] border-destructive/30">
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-[1.5rem] border border-border p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Export my data</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Queue a complete account export and email the signed download link when ready.
                    </p>
                    {exportJob ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Latest export: {exportJob.status} · {exportJob.progress}% complete
                      </p>
                    ) : null}
                  </div>
                  <Button type="button" className="hover:bg-primary/90" onClick={() => void queueExport()}>
                    Queue export
                  </Button>
                </div>
              </div>

              <Separator />

              <form className="space-y-4 rounded-[1.5rem] border border-destructive/30 bg-destructive/5 p-4" onSubmit={deleteForm.handleSubmit((values) => void deleteAccount(values))}>
                <div>
                  <p className="text-sm font-semibold text-destructive">Delete account</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This starts a 7-day grace period. You can restore the account any time during that window.
                  </p>
                </div>
                {localUser.providers.includes("credentials") ? (
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">Confirm with password</Label>
                    <Input id="delete-password" type="password" {...deleteForm.register("password")} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="delete-email">Confirm Google email</Label>
                    <Input id="delete-email" type="email" defaultValue={localUser.email} {...deleteForm.register("email")} />
                  </div>
                )}
                <Button type="submit" variant="destructive" className="hover:bg-destructive/80">
                  Schedule account deletion
                </Button>
                <p role="status" aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
                  {dangerMessage}
                </p>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
