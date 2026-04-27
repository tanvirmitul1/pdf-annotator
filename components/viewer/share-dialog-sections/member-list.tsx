"use client"

import { Loader2 } from "lucide-react"

import { MemberCard } from "./member-card"
import type { DocumentMemberRole } from "@prisma/client"

export interface TeamMember {
  id: string
  userId: string
  role: DocumentMemberRole | "OWNER"
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

interface MemberListProps {
  members: TeamMember[]
  isLoading: boolean
  currentUserId?: string
  canManage: boolean
  isUpdatingRole: boolean
  removingId: string | null
  onRoleChange: (memberId: string, role: DocumentMemberRole) => Promise<void>
  onRemove: (memberId: string) => Promise<void>
}

export function MemberList({
  members,
  isLoading,
  currentUserId,
  canManage,
  isUpdatingRole,
  removingId,
  onRoleChange,
  onRemove,
}: MemberListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No members yet
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          name={member.user.name}
          email={member.user.email}
          image={member.user.image}
          role={member.role}
          isCurrentUser={member.userId === currentUserId}
          isUpdatingRole={isUpdatingRole}
          isRemoving={removingId === member.id}
          canManage={canManage}
          onRoleChange={(role) => onRoleChange(member.id, role)}
          onRemove={() => onRemove(member.id)}
        />
      ))}
    </div>
  )
}
