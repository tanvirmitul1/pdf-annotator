"use client"

import { useState } from "react"
import { Loader2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { DocumentMemberRole } from "@prisma/client"

const ASSIGNABLE_ROLES: DocumentMemberRole[] = ["VIEWER", "COMMENTER", "EDITOR"]

const ROLE_LABELS: Record<DocumentMemberRole, string> = {
  VIEWER: "Viewer",
  COMMENTER: "Commenter",
  EDITOR: "Editor",
}

const ROLE_HELP: Record<DocumentMemberRole, string> = {
  VIEWER: "Can open the document and see annotations.",
  COMMENTER: "Can comment and participate in review.",
  EDITOR: "Can annotate, comment, and invite teammates.",
}

interface InviteMemberSectionProps {
  onInvite: (email: string, role: DocumentMemberRole) => Promise<void>
  isLoading: boolean
}

export function InviteMemberSection({
  onInvite,
  isLoading,
}: InviteMemberSectionProps) {
  const [email, setEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<DocumentMemberRole>("VIEWER")

  async function handleInvite() {
    if (!email.trim() || isLoading) {
      return
    }
    await onInvite(email.trim(), inviteRole)
    setEmail("")
    setInviteRole("VIEWER")
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-border/60 bg-background p-2">
          <UserPlus className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Add teammate</p>
          <p className="text-xs text-muted-foreground">
            Enter email to invite
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          placeholder="teammate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleInvite()
          }}
          className="flex-1"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              {ROLE_LABELS[inviteRole]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Access level</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={inviteRole}
              onValueChange={(v) => setInviteRole(v as DocumentMemberRole)}
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <DropdownMenuRadioItem key={role} value={role}>
                  <div>
                    <div className="font-medium">{ROLE_LABELS[role]}</div>
                    <div className="text-xs text-muted-foreground">
                      {ROLE_HELP[role]}
                    </div>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        onClick={() => void handleInvite()}
        disabled={!email.trim() || isLoading}
        className="mt-2 w-full gap-2"
        size="sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <UserPlus className="size-3.5" />
            Add teammate
          </>
        )}
      </Button>
    </div>
  )
}
