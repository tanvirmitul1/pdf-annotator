"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TagSummary } from "@/features/annotations/types"
import { useListUserTagsQuery } from "@/features/tags/api"

interface TagInputProps {
  tags: TagSummary[]
  onAdd: (label: string) => void
  onRemove: (tagId: string) => void
  className?: string
  disabled?: boolean
}

export function TagInput({
  tags,
  onAdd,
  onRemove,
  className,
  disabled = false,
}: TagInputProps) {
  const [input, setInput] = useState("")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: allTags = [] } = useListUserTagsQuery()

  const suggestions = input.trim()
    ? allTags.filter(
        (t) =>
          t.label.toLowerCase().includes(input.toLowerCase()) &&
          !tags.some((existing) => existing.id === t.id)
      )
    : []

  function commit(label: string) {
    const trimmed = label.trim()
    if (!trimmed) return
    if (disabled) return
    if (tags.some((t) => t.label.toLowerCase() === trimmed.toLowerCase())) return
    onAdd(trimmed)
    setInput("")
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (disabled) return
      e.preventDefault()
      if (suggestions[0]) {
        commit(suggestions[0].label)
      } else if (input.trim()) {
        commit(input)
      }
    } else if (e.key === ",") {
      if (disabled) return
      e.preventDefault()
      if (input.trim()) {
        commit(input)
      }
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      const last = tags[tags.length - 1]
      onRemove(last.id)
    } else if (e.key === "Escape") {
      setInput("")
      inputRef.current?.blur()
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex min-h-8 flex-wrap items-center gap-1 rounded-md border bg-background px-2 py-1 text-sm transition-colors",
          focused ? "border-primary ring-2 ring-primary/20" : "border-input",
          disabled && "cursor-not-allowed opacity-70"
        )}
        onClick={() => {
          if (!disabled) inputRef.current?.focus()
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {tag.label}
            <button
              type="button"
              aria-label={`Remove tag ${tag.label}`}
              onClick={(e) => {
                e.stopPropagation()
                if (!disabled) onRemove(tag.id)
              }}
              disabled={disabled}
              className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            if (input.trim()) {
              commit(input)
              return
            }
            setInput("")
          }}
          placeholder={tags.length === 0 ? "Add tags…" : ""}
          disabled={disabled}
          className="min-w-[80px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          aria-label="Tag input"
          aria-autocomplete="list"
        />
      </div>

      {/* Autocomplete dropdown */}
      {focused && suggestions.length > 0 && (
        <ul
          className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md"
          role="listbox"
        >
          {suggestions.slice(0, 6).map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                onMouseDown={(e) => {
                  e.preventDefault()
                  commit(tag.label)
                }}
              >
                {tag.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
