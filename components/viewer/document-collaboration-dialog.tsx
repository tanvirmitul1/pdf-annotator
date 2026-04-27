"use client"

import { useMemo, useState } from "react"
import type { DocumentMemberRole } from "@prisma/client"
import { Loader2, Mail, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"

import {
  useAddDocumentMemberMutation,
  useListDocumentMembersQuery,
  useRemoveDocumentMemberMutation,
} from "@/features/collaboration/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/responsive-dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function initials(name: string | null, email: string | null) {
  return (name || email || "?").slice(0, 2).toUpperCase()
}

interface DocumentCollaborationDialogProps {
  documentId: string
  canManageMembers: boolean
  trigger: React.ReactNode
}

export function DocumentCollaborationDialog({
  documentId,
  canManageMembers,
  trigger,
}: DocumentCollaborationDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<DocumentMemberRole>("COMMENTER")
  const { data: members = [], isFetching } = useListDocumentMembersQuery(
    documentId,
    {
      skip: !open,
    }
  )
  const [addMember, { isLoading: isAdding }] = useAddDocumentMemberMutation()
  const [removeMember, { isLoading: isRemoving }] =
    useRemoveDocumentMemberMutation()

  const editableMembers = useMemo(
    () => members.filter((member) => member.role !== "OWNER"),
    [members]
  )

  async function handleAddMember() {
    const nextEmail = email.trim()
    if (!nextEmail) {
      return
    }

    try {
      await addMember({ documentId, email: nextEmail, role }).unwrap()
      setEmail("")
      toast.success("Collaborator access updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add collaborator"
      )
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await removeMember({ documentId, memberId }).unwrap()
      toast.success("Collaborator removed")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove collaborator"
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Collaborate On This Document</DialogTitle>
          <DialogDescription>
            Add teammates by email so they can open this PDF and see shared
            annotations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Users className="size-4 text-primary" />
              People With Access
            </div>

            <div className="space-y-2">
              {isFetching ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading collaborators...
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No collaborators yet.
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/80 px-3 py-2"
                  >
                    <Avatar size="sm">
                      <AvatarImage
                        src={member.image ?? undefined}
                        alt={member.name ?? "Collaborator"}
                      />
                      <AvatarFallback>
                        {initials(member.name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.name || member.email || "Collaborator"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.email || "No email"}
                      </p>
                    </div>
                    <Badge
                      variant={member.role === "OWNER" ? "default" : "outline"}
                    >
                      {member.role}
                    </Badge>
                    {canManageMembers && member.role !== "OWNER" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isRemoving}
                        onClick={() => void handleRemoveMember(member.id)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <UserPlus className="size-4 text-primary" />
              Invite By Email
            </div>

            {canManageMembers ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <Input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="teammate@example.com"
                    aria-label="Collaborator email"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as DocumentMemberRole)
                    }
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    aria-label="Collaborator role"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="COMMENTER">Commenter</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                  <Button
                    type="button"
                    className="ml-auto"
                    disabled={isAdding || !email.trim()}
                    onClick={() => void handleAddMember()}
                  >
                    {isAdding ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Add collaborator
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Only the document owner can add or remove collaborators.
              </p>
            )}

            {!canManageMembers && editableMembers.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                You can mention these collaborators inside comments and see
                their annotations.
              </p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
