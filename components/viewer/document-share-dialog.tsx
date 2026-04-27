"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { useGetMeQuery } from "@/features/auth/slice"
import {
  useInviteMemberMutation,
  useListMembersQuery,
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
} from "@/features/members/api"
import {
  useGetShareLinkQuery,
  useCreateShareLinkMutation,
  useRevokeShareLinkMutation,
} from "@/features/share-links/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/responsive-dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ShareLinkSection } from "./share-dialog-sections/share-link-section"
import { WorkspaceLinkSection } from "./share-dialog-sections/workspace-link-section"
import { InviteMemberSection } from "./share-dialog-sections/invite-member-section"
import { MemberList } from "./share-dialog-sections/member-list"
import type { DocumentMemberRole } from "@prisma/client"

interface DocumentShareDialogProps {
  documentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  canInviteMembers?: boolean
  canManageMembers?: boolean
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as { data?: { error?: unknown } }).data?.error === "string"
  ) {
    return (error as { data: { error: string } }).data.error
  }

  return fallback
}

export function DocumentShareDialog({
  documentId,
  open,
  onOpenChange,
  canInviteMembers = false,
  canManageMembers = false,
}: DocumentShareDialogProps) {
  const { data: members = [], isLoading } = useListMembersQuery(
    { documentId },
    { skip: !open }
  )
  const { data: me } = useGetMeQuery()
  const { data: shareLinkData } = useGetShareLinkQuery(
    { documentId },
    { skip: !open || !canManageMembers }
  )
  const [inviteMember, { isLoading: isInviting }] = useInviteMemberMutation()
  const [updateMemberRole, { isLoading: isUpdatingRole }] =
    useUpdateMemberRoleMutation()
  const [removeMember] = useRemoveMemberMutation()
  const [createShareLink, { isLoading: isCreatingLink }] =
    useCreateShareLinkMutation()
  const [revokeShareLink, { isLoading: isRevokingLink }] =
    useRevokeShareLinkMutation()

  const [removingId, setRemovingId] = useState<string | null>(null)

  const workspaceUrl =
    typeof window === "undefined"
      ? `/app/documents/${documentId}`
      : `${window.location.origin}/app/documents/${documentId}`

  const shareLink = shareLinkData?.shareLink
  const publicUrl =
    shareLink && typeof window !== "undefined"
      ? `${window.location.origin}/share/${shareLink.token}`
      : null

  const sortedMembers = useMemo(() => {
    const currentUserId = me?.user?.id
    return [...members].sort((left, right) => {
      if (left.role === "OWNER" && right.role !== "OWNER") return -1
      if (right.role === "OWNER" && left.role !== "OWNER") return 1
      if (left.userId === currentUserId && right.userId !== currentUserId)
        return -1
      if (right.userId === currentUserId && left.userId !== currentUserId)
        return 1
      return (left.user.name || left.user.email || "").localeCompare(
        right.user.name || right.user.email || ""
      )
    })
  }, [members, me?.user?.id])

  async function handleTogglePublicLink(enabled: boolean) {
    if (enabled) {
      try {
        await createShareLink({ documentId }).unwrap()
        toast.success("Public link created")
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to create public link"))
      }
    } else if (shareLink) {
      try {
        await revokeShareLink({
          documentId,
          linkId: shareLink.id,
        }).unwrap()
        toast.success("Public link disabled")
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to disable public link"))
      }
    }
  }

  async function handleInvite(email: string, role: DocumentMemberRole) {
    try {
      await inviteMember({
        documentId,
        email,
        role,
      }).unwrap()
      toast.success(`Added ${email} to the document`)
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add teammate"))
    }
  }

  async function handleRoleChange(memberId: string, role: DocumentMemberRole) {
    try {
      await updateMemberRole({
        documentId,
        memberId,
        role,
      }).unwrap()
      toast.success("Access updated")
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update access"))
    }
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId)
    try {
      await removeMember({ documentId, memberId }).unwrap()
      toast.success("Removed teammate")
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove teammate"))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="2xl"
        position="center"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl border border-border/70 bg-popover/95 p-0 shadow-2xl backdrop-blur-xl sm:max-h-[85vh]"
      >
        <DialogHeader className="shrink-0 gap-2 border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold sm:text-lg">
                Share document
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs sm:text-sm">
                Invite teammates or create a public link anyone can access.
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className="w-fit shrink-0 rounded-full border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary sm:px-3 sm:py-1"
            >
              {sortedMembers.length} member
              {sortedMembers.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1 overflow-hidden">
            <div className="space-y-3 overflow-x-hidden p-4 sm:space-y-4 sm:p-6">
              {canManageMembers && (
                <div className="space-y-3">
                  <ShareLinkSection
                    publicUrl={publicUrl}
                    isLoading={isCreatingLink || isRevokingLink}
                    onTogglePublicLink={handleTogglePublicLink}
                  />
                  <WorkspaceLinkSection workspaceUrl={workspaceUrl} />
                </div>
              )}

              {canInviteMembers && (
                <InviteMemberSection
                  onInvite={handleInvite}
                  isLoading={isInviting}
                />
              )}

              <Separator />

              <div>
                <h3 className="mb-2 text-xs font-medium sm:mb-3 sm:text-sm">
                  Team members
                </h3>
                <MemberList
                  members={sortedMembers}
                  isLoading={isLoading}
                  currentUserId={me?.user?.id}
                  canManage={canManageMembers}
                  isUpdatingRole={isUpdatingRole}
                  removingId={removingId}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemove}
                />
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
