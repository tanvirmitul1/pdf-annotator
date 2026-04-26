import type { DocumentMemberRole } from "@prisma/client"

import { prisma } from "@/lib/db/prisma"

export interface AccessibleDocument {
  id: string
  userId: string
  name: string
  pageCount: number
  status: string
  storageKey: string
  thumbnailKey: string | null
  owner: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  role: DocumentMemberRole | "OWNER"
}

export interface CollaboratorSummary {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: DocumentMemberRole | "OWNER"
}

export async function getAccessibleDocument(
  userId: string,
  documentId: string
): Promise<AccessibleDocument | null> {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      deletedAt: null,
      OR: [{ userId }, { members: { some: { userId } } }],
    },
    select: {
      id: true,
      userId: true,
      name: true,
      pageCount: true,
      status: true,
      storageKey: true,
      thumbnailKey: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      members: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  })

  if (!document) {
    return null
  }

  return {
    id: document.id,
    userId: document.userId,
    name: document.name,
    pageCount: document.pageCount,
    status: document.status,
    storageKey: document.storageKey,
    thumbnailKey: document.thumbnailKey,
    owner: document.user,
    role: document.userId === userId ? "OWNER" : document.members[0]?.role ?? "VIEWER",
  }
}

export async function listDocumentCollaborators(
  documentId: string
): Promise<CollaboratorSummary[]> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  })

  if (!document) {
    return []
  }

  return [
    {
      ...document.user,
      role: "OWNER",
    },
    ...document.members.map((member) => ({
      ...member.user,
      role: member.role,
    })),
  ]
}
