import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"

// ── Public types ─────────────────────────────────────────────────────────────

export interface CommentAuthor {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export interface CommentMentionSummary {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export interface ReactionSummary {
  emoji: string
  count: number
  /** Whether the currently authenticated user reacted with this emoji */
  reactedByMe: boolean
}

export interface CommentWithAuthor {
  id: string
  annotationId: string
  userId: string
  parentId: string | null
  content: string
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  author: CommentAuthor
  mentions: CommentMentionSummary[]
  reactions: ReactionSummary[]
  replyCount: number
}

export interface CommentPage {
  comments: CommentWithAuthor[]
  nextCursor: string | null
  total: number
}

// ── Prisma include ───────────────────────────────────────────────────────────

const commentInclude = {
  user: {
    select: { id: true, name: true, email: true, image: true },
  },
  mentions: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  reactions: {
    select: { userId: true, emoji: true },
  },
  _count: {
    select: { replies: true },
  },
} satisfies Prisma.AnnotationCommentInclude

type CommentRow = Prisma.AnnotationCommentGetPayload<{
  include: typeof commentInclude
}>

function toClient(row: CommentRow, currentUserId: string): CommentWithAuthor {
  // Aggregate reactions: { emoji -> { count, reactedByMe } }
  const reactionMap = new Map<string, { count: number; reactedByMe: boolean }>()
  for (const r of row.reactions) {
    const prev = reactionMap.get(r.emoji) ?? { count: 0, reactedByMe: false }
    reactionMap.set(r.emoji, {
      count: prev.count + 1,
      reactedByMe: prev.reactedByMe || r.userId === currentUserId,
    })
  }
  const reactions: ReactionSummary[] = Array.from(reactionMap.entries()).map(
    ([emoji, { count, reactedByMe }]) => ({ emoji, count, reactedByMe })
  )

  return {
    id: row.id,
    annotationId: row.annotationId,
    userId: row.userId,
    parentId: row.parentId,
    content: row.content,
    editedAt: row.editedAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    author: row.user,
    mentions: row.mentions.map((m) => m.user),
    reactions,
    replyCount: row._count.replies,
  }
}

// ── Repository factory ───────────────────────────────────────────────────────

export function commentsFor(userId: string) {
  return {
    /**
     * Load a flat list of comments for an annotation, ordered by createdAt ASC.
     * Supports cursor-based pagination (pass last comment's createdAt ISO string).
     */
    listByAnnotation: async (
      annotationId: string,
      options?: { cursor?: string; limit?: number }
    ): Promise<CommentPage> => {
      const limit = options?.limit ?? 50
      const cursor = options?.cursor

      const [rows, total] = await Promise.all([
        prisma.annotationComment.findMany({
          where: {
            annotationId,
            deletedAt: null,
            ...(cursor
              ? { createdAt: { gt: new Date(cursor) } }
              : {}),
          },
          include: commentInclude,
          orderBy: { createdAt: "asc" },
          take: limit + 1,
        }),
        prisma.annotationComment.count({
          where: { annotationId, deletedAt: null },
        }),
      ])

      const hasMore = rows.length > limit
      const slice = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore
        ? slice[slice.length - 1].createdAt.toISOString()
        : null

      return {
        comments: slice.map((r) => toClient(r, userId)),
        nextCursor,
        total,
      }
    },

    /** Create a new comment (optionally a reply). Saves mentions and triggers notifications. */
    create: async (
      annotationId: string,
      content: string,
      parentId: string | null,
      mentionedUserIds: string[]
    ): Promise<CommentWithAuthor> => {
      // Resolve annotation owner + collaborators for notification targeting
      const annotation = await prisma.annotation.findUnique({
        where: { id: annotationId },
        select: {
          userId: true,
          document: {
            select: {
              members: { select: { userId: true } },
            },
          },
        },
      })

      const row = await prisma.annotationComment.create({
        data: {
          userId,
          annotationId,
          parentId,
          content,
          mentions: {
            create: mentionedUserIds.map((uid) => ({ userId: uid })),
          },
        },
        include: commentInclude,
      })

      // Fire mention notifications
      if (mentionedUserIds.length > 0) {
        const actor = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        })
        const actorName = actor?.name || actor?.email || "Someone"
        await prisma.notification.createMany({
          data: mentionedUserIds
            .filter((uid) => uid !== userId) // don't notify self
            .map((uid) => ({
              userId: uid,
              type: "MENTION",
              title: `${actorName} mentioned you`,
              body: content.slice(0, 120),
              annotationId,
              commentId: row.id,
              actorId: userId,
            })),
          skipDuplicates: true,
        })
      }

      // Notify annotation owner of a new comment (if not the commenter)
      if (annotation && annotation.userId !== userId) {
        const actor = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        })
        const actorName = actor?.name || actor?.email || "Someone"
        await prisma.notification.createMany({
          data: [
            {
              userId: annotation.userId,
              type: parentId ? "REPLY" : "COMMENT",
              title: parentId
                ? `${actorName} replied to a comment`
                : `${actorName} commented on your annotation`,
              body: content.slice(0, 120),
              annotationId,
              commentId: row.id,
              actorId: userId,
            },
          ],
          skipDuplicates: true,
        })
      }

      return toClient(row, userId)
    },

    /** Update content and mark as edited (owner only). */
    update: async (
      commentId: string,
      content: string,
      mentionedUserIds?: string[]
    ): Promise<CommentWithAuthor | null> => {
      const existing = await prisma.annotationComment.findFirst({
        where: { id: commentId, userId, deletedAt: null },
        select: { id: true, annotationId: true },
      })
      if (!existing) return null

      // Re-sync mentions if provided
      if (mentionedUserIds !== undefined) {
        await prisma.commentMention.deleteMany({ where: { commentId } })
        if (mentionedUserIds.length > 0) {
          await prisma.commentMention.createMany({
            data: mentionedUserIds.map((uid) => ({ commentId, userId: uid })),
            skipDuplicates: true,
          })
        }
      }

      const row = await prisma.annotationComment.update({
        where: { id: commentId },
        data: { content, editedAt: new Date() },
        include: commentInclude,
      })
      return toClient(row, userId)
    },

    /** Soft-delete (owner only). */
    softDelete: async (commentId: string): Promise<boolean> => {
      const existing = await prisma.annotationComment.findFirst({
        where: { id: commentId, userId, deletedAt: null },
        select: { id: true },
      })
      if (!existing) return false

      await prisma.annotationComment.update({
        where: { id: commentId },
        data: { deletedAt: new Date() },
      })
      return true
    },

    /**
     * Toggle a reaction emoji. Returns the updated reaction list for the comment.
     * If the user already reacted with this emoji, it removes the reaction.
     */
    toggleReaction: async (
      commentId: string,
      emoji: string
    ): Promise<ReactionSummary[]> => {
      const existing = await prisma.commentReaction.findUnique({
        where: { commentId_userId_emoji: { commentId, userId, emoji } },
        select: { id: true },
      })

      if (existing) {
        await prisma.commentReaction.delete({
          where: { commentId_userId_emoji: { commentId, userId, emoji } },
        })
      } else {
        await prisma.commentReaction.create({
          data: { commentId, userId, emoji },
        })
      }

      // Return updated reaction summary
      const reactions = await prisma.commentReaction.findMany({
        where: { commentId },
        select: { userId: true, emoji: true },
      })

      const reactionMap = new Map<string, { count: number; reactedByMe: boolean }>()
      for (const r of reactions) {
        const prev = reactionMap.get(r.emoji) ?? { count: 0, reactedByMe: false }
        reactionMap.set(r.emoji, {
          count: prev.count + 1,
          reactedByMe: prev.reactedByMe || r.userId === userId,
        })
      }
      return Array.from(reactionMap.entries()).map(([em, { count, reactedByMe }]) => ({
        emoji: em,
        count,
        reactedByMe,
      }))
    },
  }
}
