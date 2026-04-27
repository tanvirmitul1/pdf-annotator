"use client"

import {
  Loader2,
  Trash2,
  Crown,
  Eye,
  MessageSquare,
  PencilLine,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import type { DocumentMemberRole } from "@prisma/client"

const ASSIGNABLE_ROLES: DocumentMemberRole[] = ["VIEWER", "COMMENTER", "EDITOR"]

const ROLE_LABELS: Record<DocumentMemberRole | "OWNER", string> = {
  OWNER: "Owner",
  VIEWER: "Viewer",
  COMMENTER: "Commenter",
  EDITOR: "Editor",
}

const ROLE_HELP: Record<DocumentMemberRole, string> = {
  VIEWER: "Can open the document and see annotations.",
  COMMENTER: "Can comment and participate in review.",
  EDITOR: "Can annotate, comment, and invite teammates.",
}

function getRoleIcon(role: DocumentMemberRole | "OWNER") {
  switch (role) {
    case "OWNER":
      return Crown
    case "EDITOR":
      return PencilLine
    case "COMMENTER":
      return MessageSquare
    default:
      return Eye
  }
}

function getRoleTone(role: DocumentMemberRole | "OWNER") {
  switch (role) {
    case "OWNER":
      return "border-primary/20 bg-primary/10 text-primary"
    case "EDITOR":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "COMMENTER":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    default:
      return "border-border/70 bg-background text-muted-foreground"
  }
}

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined
) {
  const source = (name || email || "?").trim()
  return source.slice(0, 2).toUpperCase()
}

interface MemberCardProps {
  name: string | null
  email: string | null
  image: string | null
  role: DocumentMemberRole | "OWNER"
  isCurrentUser: boolean
  isUpdatingRole: boolean
  isRemoving: boolean
  canManage: boolean
  onRoleChange: (role: DocumentMemberRole) => Promise<void>
  onRemove: () => Promise<void>
}

export function MemberCard({
  name,
  email,
  image,
  role,
  isCurrentUser,
  isUpdatingRole,
  isRemoving,
  canManage,
  onRoleChange,
  onRemove,
}: MemberCardProps) {
  const displayName = name || email || "Unknown"
  const isOwner = role === "OWNER"
  const RoleIcon = getRoleIcon(isOwner ? "OWNER" : role)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card/30 p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={image || undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(name, email)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {displayName}
            {isCurrentUser && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                (you)
              </span>
            )}
          </p>
          {email && (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          )}
        </div>
      </div>

      {isOwner ? (
        <Badge
          variant="outline"
          className={cn(
            "w-fit shrink-0 gap-1.5 rounded-full border px-2.5 py-0.5",
            getRoleTone("OWNER")
          )}
        >
          <RoleIcon className="size-3" />
          <span className="text-xs font-medium">Owner</span>
        </Badge>
      ) : canManage ? (
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex-1 justify-start gap-1.5 px-2.5 sm:flex-none sm:justify-center"
                disabled={isUpdatingRole}
              >
                <RoleIcon className="size-3.5 shrink-0" />
                <span className="truncate text-xs">
                  {ROLE_LABELS[role as DocumentMemberRole]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Change access</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={role as DocumentMemberRole}
                onValueChange={(v) =>
                  void onRoleChange(v as DocumentMemberRole)
                }
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <DropdownMenuRadioItem key={r} value={r}>
                    <div>
                      <div className="font-medium">{ROLE_LABELS[r]}</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_HELP[r]}
                      </div>
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void onRemove()}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      ) : (
        <Badge
          variant="outline"
          className={cn(
            "w-fit shrink-0 gap-1.5 rounded-full border px-2.5 py-0.5",
            getRoleTone(role as DocumentMemberRole)
          )}
        >
          <RoleIcon className="size-3" />
          <span className="text-xs font-medium">
            {ROLE_LABELS[role as DocumentMemberRole]}
          </span>
        </Badge>
      )}
    </div>
  )
}
