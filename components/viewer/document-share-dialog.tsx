"use client"

import { useState } from "react"
import { Copy, X, Plus, Trash2, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  useListMembersQuery,
  useInviteMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} from "@/features/members/api"
import type { DocumentMemberRole } from "@prisma/client"

interface DocumentShareDialogProps {
  documentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ROLES: Array<DocumentMemberRole | "OWNER"> = [
  "OWNER",
  "VIEWER",
  "COMMENTER",
  "EDITOR",
]

const ROLE_LABELS: Record<DocumentMemberRole | "OWNER", string> = {
  OWNER: "Owner",
  VIEWER: "Can view",
  COMMENTER: "Can comment",
  EDITOR: "Can edit",
}

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined
) {
  const src = (name || email || "?").trim()
  return src.slice(0, 2).toUpperCase()
}

export function DocumentShareDialog({
  documentId,
  open,
  onOpenChange,
}: DocumentShareDialogProps) {
  const { data: members = [], isLoading } = useListMembersQuery({ documentId })
  const [inviteMember] = useInviteMemberMutation()
  const [updateMemberRole] = useUpdateMemberRoleMutation()
  const [removeMember] = useRemoveMemberMutation()

  const [email, setEmail] = useState("")
  const [selectedRole, setSelectedRole] = useState<DocumentMemberRole>("VIEWER")
  const [showRoleDropdown, setShowRoleDropdown] = useState<string | null>(null)

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/documents/${documentId}`
    await navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard!")
  }

  const handleInvite = async () => {
    if (!email.trim()) return

    try {
      await inviteMember({
        documentId,
        email: email.trim(),
        role: selectedRole,
      }).unwrap()
      toast.success(`${email} has been invited!`)
      setEmail("")
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to invite user")
    }
  }

  const handleRoleChange = async (
    memberId: string,
    role: DocumentMemberRole | "OWNER"
  ) => {
    // Can't change owner role
    if (role === "OWNER") return

    try {
      await updateMemberRole({
        documentId,
        memberId,
        role: role as DocumentMemberRole,
      }).unwrap()
      toast.success("Role updated!")
      setShowRoleDropdown(null)
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to update role")
    }
  }

  const handleRemove = async (memberId: string, memberEmail: string) => {
    try {
      await removeMember({ documentId, memberId }).unwrap()
      toast.success(`${memberEmail} has been removed`)
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to remove member")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Share this document</DialogTitle>
          <DialogDescription>
            Invite people to collaborate on this document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Link */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Share link
            </label>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/documents/${documentId}`}
                readOnly
                className="flex-1 text-xs"
              />
              <Button size="sm" onClick={handleCopyLink}>
                <Copy className="mr-1.5 size-3" />
                Copy
              </Button>
            </div>
          </div>

          {/* Invite People */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Invite people
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleInvite()
                  }
                }}
                className="flex-1"
              />
              <select
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(e.target.value as DocumentMemberRole)
                }
                className="h-10 rounded-md border border-input bg-background px-2 text-xs"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={() => void handleInvite()}>
                <Plus className="mr-1.5 size-3" />
                Invite
              </Button>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              People with access
            </label>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center gap-2"
                  >
                    <div className="size-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-24 rounded bg-muted" />
                      <div className="h-2 w-16 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {members.map((member) => {
                  const isOwner = member.role === "OWNER"
                  const isCurrentUser = member.userId === "current-user-id" // TODO: Get from auth

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-lg border border-border/40 p-2.5"
                    >
                      <Avatar className="size-8 shrink-0">
                        <AvatarImage src={member.user.image ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(member.user.name, member.user.email)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>

                      {/* Role Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setShowRoleDropdown(
                              showRoleDropdown === member.id ? null : member.id
                            )
                          }
                          className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-xs hover:bg-accent"
                          disabled={isOwner}
                        >
                          {
                            ROLE_LABELS[
                              member.role as DocumentMemberRole | "OWNER"
                            ]
                          }
                          {!isOwner && <ChevronDown className="size-3" />}
                        </button>

                        {showRoleDropdown === member.id && !isOwner && (
                          <div className="absolute top-full right-0 z-50 mt-1 w-40 overflow-hidden rounded-md border bg-popover shadow-lg">
                            {ROLES.map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  if (role !== "OWNER") {
                                    void handleRoleChange(member.id, role)
                                  }
                                }}
                                className="w-full px-3 py-2 text-left text-xs hover:bg-accent"
                                disabled={role === "OWNER"}
                              >
                                {ROLE_LABELS[role]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      {!isOwner && !isCurrentUser && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleRemove(
                              member.id,
                              member.user.email || ""
                            )
                          }
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}

                      {/* Owner Badge */}
                      {isOwner && (
                        <Badge variant="secondary" className="text-[10px]">
                          Owner
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      </DialogContent>
    </Dialog>
  )
}
