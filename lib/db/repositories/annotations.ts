import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db/prisma"
import type {
  AnnotationWithTags,
  TagSummary,
} from "@/features/annotations/types"
import type {
  CreateAnnotationInput,
  UpdateAnnotationInput,
} from "@/features/annotations/schema"

const annotationInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          id: true,
          label: true,
          color: true,
        },
      },
    },
  },
} satisfies Prisma.AnnotationInclude

type AnnotationRow = Prisma.AnnotationGetPayload<{
  include: typeof annotationInclude
}>

function toClient(row: AnnotationRow): AnnotationWithTags {
  return {
    id: row.id,
    userId: row.userId,
    documentId: row.documentId,
    pageNumber: row.pageNumber,
    type: row.type as AnnotationWithTags["type"],
    status: row.status as AnnotationWithTags["status"],
    color: row.color,
    positionData: row.positionData as unknown as AnnotationWithTags["positionData"],
    content: row.content,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    tags: row.tags.map((item) => ({
      id: item.tag.id,
      label: item.tag.label,
      color: item.tag.color,
    })),
    author: row.user
      ? {
          id: row.user.id,
          name: row.user.name,
          email: row.user.email,
          image: row.user.image,
        }
      : null,
    assignee: row.assignee
      ? {
          id: row.assignee.id,
          name: row.assignee.name,
          email: row.assignee.email,
          image: row.assignee.image,
        }
      : null,
  }
}

export interface AddTagResult {
  created: boolean
  tag: TagSummary
}

export function annotationsFor(userId: string) {
  return {
    listByDocument: async (documentId: string): Promise<AnnotationWithTags[]> => {
      const rows = await prisma.annotation.findMany({
        where: {
          documentId,
          deletedAt: null,
        },
        include: annotationInclude,
        orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
      })

      return rows.map(toClient)
    },
    countByDocument: (documentId: string) =>
      prisma.annotation.count({
        where: {
          userId,
          documentId,
          deletedAt: null,
        },
      }),
    get: async (annotationId: string): Promise<AnnotationWithTags | null> => {
      const row = await prisma.annotation.findFirst({
        where: {
          id: annotationId,
          userId,
          deletedAt: null,
        },
        include: annotationInclude,
      })

      return row ? toClient(row) : null
    },
    create: async (
      documentId: string,
      input: CreateAnnotationInput
    ): Promise<AnnotationWithTags> => {
      const row = await prisma.annotation.create({
        data: {
          userId,
          documentId,
          pageNumber: input.pageNumber,
          type: input.type,
          status: input.status ?? "OPEN",
          assigneeId: input.assigneeId ?? null,
          color: input.color,
          positionData: input.positionData as Prisma.InputJsonValue,
          content: input.content ?? null,
        },
        include: annotationInclude,
      })

      return toClient(row)
    },
    update: async (
      annotationId: string,
      changes: UpdateAnnotationInput
    ): Promise<AnnotationWithTags> => {
      const row = await prisma.annotation.update({
        where: { id: annotationId },
        data: {
          ...(changes.content !== undefined ? { content: changes.content } : {}),
          ...(changes.color !== undefined ? { color: changes.color } : {}),
          ...(changes.status !== undefined ? { status: changes.status } : {}),
          ...(changes.assigneeId !== undefined
            ? { assigneeId: changes.assigneeId }
            : {}),
          ...(changes.positionData !== undefined
            ? { positionData: changes.positionData as Prisma.InputJsonValue }
            : {}),
        },
        include: annotationInclude,
      })

      return toClient(row)
    },
    softDelete: async (annotationId: string): Promise<AnnotationWithTags> => {
      const row = await prisma.annotation.update({
        where: { id: annotationId },
        data: { deletedAt: new Date() },
        include: annotationInclude,
      })

      return toClient(row)
    },
    addTag: async (
      annotationId: string,
      label: string
    ): Promise<AddTagResult | null> => {
      return prisma.$transaction(async (tx) => {
        const annotation = await tx.annotation.findFirst({
          where: {
            id: annotationId,
            userId,
            deletedAt: null,
          },
          select: { id: true },
        })

        if (!annotation) {
          return null
        }

        const existing = await tx.tag.findUnique({
          where: {
            userId_label: {
              userId,
              label,
            },
          },
          select: { id: true, label: true, color: true },
        })

        const tag =
          existing ??
          (await tx.tag.create({
            data: {
              userId,
              label,
            },
            select: { id: true, label: true, color: true },
          }))

        await tx.annotationTag.upsert({
          where: {
            annotationId_tagId: {
              annotationId,
              tagId: tag.id,
            },
          },
          create: {
            annotationId,
            tagId: tag.id,
          },
          update: {},
        })

        return {
          created: !existing,
          tag,
        }
      })
    },
    removeTag: async (annotationId: string, tagId: string): Promise<boolean> => {
      const annotation = await prisma.annotation.findFirst({
        where: {
          id: annotationId,
          userId,
          deletedAt: null,
        },
        select: { id: true },
      })

      if (!annotation) {
        return false
      }

      await prisma.annotationTag.deleteMany({
        where: {
          annotationId,
          tagId,
        },
      })

      return true
    },
    listTags: async (): Promise<TagSummary[]> =>
      prisma.tag.findMany({
        where: { userId },
        orderBy: { label: "asc" },
        select: { id: true, label: true, color: true },
      }),
  }
}
