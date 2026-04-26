"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { formatDistanceToNow, format } from "date-fns"
import {
  MessageSquare,
  Reply,
  Trash2,
  Pencil,
  Check,
  X,
  SendHorizontal,
  ChevronDown,
  SmilePlus,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  useListCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useToggleReactionMutation,
} from "@/features/comments/api"
import type { CommentWithAuthor } from "@/lib/db/repositories/comments"
import { useAppSelector } from "@/store/hooks"

// ── Types ────────────────────────────────────────────────────────────────────

interface Collaborator {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

interface CommentThreadProps {
  annotationId: string
  collaborators: Collaborator[]
}

// ── Constants ────────────────────────────────────────────────────────────────

const REACTION_EMOJIS = ["👍", "❤️", "😄", "😮", "😢", "🔥"] as const

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined
) {
  const src = (name || email || "?").trim()
  return src.slice(0, 2).toUpperCase()
}

function extractMentions(text: string): string[] {
  return (text.match(/@\[([^\]]+)\]\(([^)]+)\)/g) || [])
    .map((m) => m.match(/@\[[^\]]+\]\(([^)]+)\)/)?.[1] ?? "")
    .filter(Boolean)
}

/** Replace @[Name](id) tokens with highlighted <span> elements with better styling */
function renderContent(text: string) {
  const parts = text.split(/(@\[[^\]]+\]\([^)]+\))/)
  return parts.map((part, i) => {
    const match = part.match(/@\[([^\]]+)\]\(([^)]+)\)/)
    if (match) {
      return (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary transition-colors hover:bg-primary/15"
        >
          <span className="text-xs">@</span>
          <span className="text-xs">{match[1]}</span>
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ── MentionTextarea ──────────────────────────────────────────────────────────

function MentionTextarea({
  value,
  onChange,
  onSubmit,
  collaborators,
  placeholder,
  autoFocus,
  minRows = 2,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: (mentions: string[]) => void
  collaborators: Collaborator[]
  placeholder: string
  autoFocus?: boolean
  minRows?: number
}) {
  const [mentionQuery, setMentionQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  const filtered = collaborators
    .filter((u) =>
      (u.name || u.email || "")
        .toLowerCase()
        .includes(mentionQuery.toLowerCase())
    )
    .slice(0, 6)

  const insertMention = useCallback(
    (user: Collaborator) => {
      const before = value.slice(0, cursor)
      const after = value.slice(cursor)
      const atIdx = before.lastIndexOf("@")
      const displayName = user.name || user.email || "User"
      const newValue =
        before.slice(0, atIdx) + `@[${displayName}](${user.id}) ` + after
      onChange(newValue)
      setShowSuggestions(false)
      setTimeout(() => textareaRef.current?.focus(), 0)
    },
    [value, cursor, onChange]
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    const pos = e.target.selectionStart
    onChange(v)
    setCursor(pos)
    const before = v.slice(0, pos)
    const atMatch = before.match(/@(\w*)$/)
    if (atMatch) {
      setMentionQuery(atMatch[1])
      setShowSuggestions(true)
      setSelectedIdx(0)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        insertMention(filtered[selectedIdx])
        return
      }
      if (e.key === "Escape") {
        setShowSuggestions(false)
        return
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!value.trim()) return
      onSubmit(extractMentions(value))
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder={placeholder}
        rows={minRows}
        className="resize-none pr-10 text-sm"
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-72 overflow-hidden rounded-lg border bg-popover shadow-lg">
          <div className="border-b px-3 py-2">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Mention someone
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.map((user, i) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertMention(user)
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                  i === selectedIdx ? "bg-accent" : "hover:bg-accent/60"
                )}
              >
                <Avatar className="size-7 shrink-0">
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium">
                    {user.name || user.email}
                  </p>
                  {user.name && user.email && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── ReactionBar ──────────────────────────────────────────────────────────────

function ReactionBar({
  commentId,
  annotationId,
  reactions,
}: {
  commentId: string
  annotationId: string
  reactions: CommentWithAuthor["reactions"]
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [toggleReaction] = useToggleReactionMutation()

  const handleToggle = (emoji: string) => {
    void toggleReaction({ commentId, annotationId, emoji })
    setShowPicker(false)
  }

  return (
    <div className="relative mt-1.5 flex flex-wrap items-center gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => handleToggle(r.emoji)}
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
            r.reactedByMe
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-muted/60 hover:bg-muted"
          )}
          title={r.reactedByMe ? "Remove reaction" : "Add reaction"}
        >
          <span>{r.emoji}</span>
          <span className="font-medium">{r.count}</span>
        </button>
      ))}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              className="inline-flex size-6 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground"
            >
              <SmilePlus className="size-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Add reaction</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showPicker && (
        <div className="absolute bottom-8 left-0 z-50 flex gap-1 rounded-lg border bg-popover p-1.5 shadow-md">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleToggle(emoji)}
              className="rounded px-1 py-0.5 text-lg transition-transform hover:scale-125"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── CommentItem ──────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  currentUserId,
  annotationId,
  collaborators,
  onReply,
  isReply = false,
}: {
  comment: CommentWithAuthor
  currentUserId: string | null
  annotationId: string
  collaborators: Collaborator[]
  onReply: (parentId: string) => void
  isReply?: boolean
}) {
  const isOwner = currentUserId === comment.userId
  const isDeleted = !!comment.deletedAt

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(comment.content)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [updateComment, { isLoading: isSaving }] = useUpdateCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()

  const handleSaveEdit = async (mentions: string[]) => {
    if (!editValue.trim()) return
    await updateComment({
      id: comment.id,
      annotationId,
      content: editValue,
      mentions,
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      deleteTimerRef.current = setTimeout(() => setDeleteConfirm(false), 3000)
      return
    }
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
    void deleteComment({ id: comment.id, annotationId })
  }

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
    }
  }, [])

  if (isDeleted) {
    return (
      <div className={cn("flex gap-2 opacity-50", isReply && "ml-8")}>
        <div
          className={cn(
            "size-6 shrink-0 rounded-full bg-muted",
            !isReply && "size-7"
          )}
        />
        <p className="mt-1 text-xs text-muted-foreground italic">
          [Comment deleted]
        </p>
      </div>
    )
  }

  return (
    <div className={cn("group flex gap-2", isReply && "ml-8")}>
      <Avatar className={cn("shrink-0", isReply ? "mt-0.5 size-6" : "size-7")}>
        <AvatarImage src={comment.author.image ?? undefined} />
        <AvatarFallback className="text-[10px]">
          {getInitials(comment.author.name, comment.author.email)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs font-semibold">
            {comment.author.name || comment.author.email}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {format(new Date(comment.createdAt), "PPpp")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {comment.editedAt && (
            <span className="text-[10px] text-muted-foreground/60 italic">
              edited
            </span>
          )}
        </div>

        {/* Content or edit mode */}
        {isEditing ? (
          <div className="mt-1 space-y-1.5">
            <MentionTextarea
              value={editValue}
              onChange={setEditValue}
              onSubmit={handleSaveEdit}
              collaborators={collaborators}
              placeholder="Edit comment…"
              autoFocus
              minRows={2}
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="h-6 gap-1 px-2 text-xs"
                onClick={() => void handleSaveEdit(extractMentions(editValue))}
                disabled={isSaving || !editValue.trim()}
              >
                <Check className="size-3" /> Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 gap-1 px-2 text-xs"
                onClick={() => {
                  setIsEditing(false)
                  setEditValue(comment.content)
                }}
              >
                <X className="size-3" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 text-sm leading-snug break-words whitespace-pre-wrap">
            {renderContent(comment.content)}
          </p>
        )}

        {/* Reactions */}
        {!isEditing && (
          <ReactionBar
            commentId={comment.id}
            annotationId={annotationId}
            reactions={comment.reactions}
          />
        )}

        {/* Action buttons — visible on hover */}
        {!isEditing && (
          <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Reply className="size-3" />
              Reply
            </button>
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="size-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className={cn(
                    "flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors hover:bg-destructive/10 hover:text-destructive",
                    deleteConfirm ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  <Trash2 className="size-3" />
                  {deleteConfirm ? "Confirm?" : "Delete"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── CommentThread ────────────────────────────────────────────────────────────

export function CommentThread({
  annotationId,
  collaborators,
}: CommentThreadProps) {
  const currentUser = useAppSelector((s) => s.auth.user)
  const { data: page, isLoading } = useListCommentsQuery({ annotationId })
  const [createComment] = useCreateCommentMutation()

  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({})

  const comments = page?.comments ?? []
  const total = page?.total ?? 0

  // Build thread structure
  const topLevel = comments.filter((c) => !c.parentId)
  const repliesMap = comments.reduce(
    (acc, c) => {
      if (c.parentId) {
        ;(acc[c.parentId] ??= []).push(c)
      }
      return acc
    },
    {} as Record<string, CommentWithAuthor[]>
  )

  const handleSubmitNew = async (mentions: string[]) => {
    if (!newComment.trim()) return
    await createComment({ annotationId, content: newComment, mentions })
    setNewComment("")
  }

  const handleSubmitReply = async (mentions: string[]) => {
    if (!replyText.trim() || !replyTo) return
    await createComment({
      annotationId,
      content: replyText,
      parentId: replyTo,
      mentions,
    })
    setReplyText("")
    setReplyTo(null)
  }

  const handleReply = (parentId: string) => {
    setReplyTo(parentId)
    setShowReplies((s) => ({ ...s, [parentId]: true }))
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Discussion</span>
            {total > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-medium"
              >
                {total} {total === 1 ? "comment" : "comments"}
              </Badge>
            )}
          </div>
        </div>

        {/* Comment list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="size-7 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : topLevel.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <ScrollArea className="max-h-[440px] pr-1">
            <div className="space-y-4 pr-2">
              {topLevel.map((comment) => {
                const replies = repliesMap[comment.id] ?? []
                const INITIAL_REPLIES = 3
                const showAllReplies = !!showReplies[comment.id]
                const visibleReplies = showAllReplies
                  ? replies
                  : replies.slice(0, INITIAL_REPLIES)
                const hiddenCount = replies.length - INITIAL_REPLIES

                return (
                  <div key={comment.id} className="space-y-2">
                    <CommentItem
                      comment={comment}
                      currentUserId={currentUser?.id ?? null}
                      annotationId={annotationId}
                      collaborators={collaborators}
                      onReply={handleReply}
                    />

                    {/* Replies */}
                    {visibleReplies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        currentUserId={currentUser?.id ?? null}
                        annotationId={annotationId}
                        collaborators={collaborators}
                        onReply={handleReply}
                        isReply
                      />
                    ))}

                    {/* Show more replies */}
                    {!showAllReplies && hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowReplies((s) => ({ ...s, [comment.id]: true }))
                        }
                        className="ml-8 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <ChevronDown className="size-3" />
                        View {hiddenCount} more{" "}
                        {hiddenCount === 1 ? "reply" : "replies"}
                      </button>
                    )}

                    {/* Reply input */}
                    {replyTo === comment.id && (
                      <div className="ml-8 space-y-1.5">
                        <MentionTextarea
                          value={replyText}
                          onChange={setReplyText}
                          onSubmit={handleSubmitReply}
                          collaborators={collaborators}
                          placeholder={`Reply to ${comment.author.name || comment.author.email}… (@ to mention, Enter to send)`}
                          autoFocus
                          minRows={2}
                        />
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 gap-1.5 px-3 text-xs"
                            onClick={() =>
                              void handleSubmitReply(extractMentions(replyText))
                            }
                            disabled={!replyText.trim()}
                          >
                            <SendHorizontal className="size-3" />
                            Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setReplyTo(null)
                              setReplyText("")
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {/* New comment input */}
        <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/30 p-2.5">
          <div className="flex items-start gap-2">
            <Avatar className="mt-0.5 size-6 shrink-0">
              <AvatarImage
                src={
                  (currentUser as { image?: string | null })?.image ?? undefined
                }
              />
              <AvatarFallback className="text-[9px]">
                {getInitials(currentUser?.name, currentUser?.email)}
              </AvatarFallback>
            </Avatar>
            <MentionTextarea
              value={newComment}
              onChange={setNewComment}
              onSubmit={handleSubmitNew}
              collaborators={collaborators}
              placeholder="Add a comment… (@ to mention)"
              minRows={2}
            />
          </div>
          <div className="flex items-center justify-between pl-8">
            <span className="text-[10px] text-muted-foreground">
              Shift+Enter for new line
            </span>
            <Button
              size="sm"
              className="h-7 gap-1.5 px-3 text-xs"
              onClick={() => void handleSubmitNew(extractMentions(newComment))}
              disabled={!newComment.trim()}
            >
              <SendHorizontal className="size-3" />
              Comment
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
