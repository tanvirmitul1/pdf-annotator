"use client"

import { useEffect, useRef, useTransition } from "react"
import { Search, X, ChevronUp, ChevronDown } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { useViewer } from "@/features/viewer/provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { track } from "@/lib/analytics/client"

interface SearchBarProps {
  documentId: string
}

export function SearchBar({ documentId }: SearchBarProps) {
  const searchOpen = useViewer((s) => s.searchOpen)
  const searchQuery = useViewer((s) => s.searchQuery)
  const searchMatches = useViewer((s) => s.searchMatches)
  const currentMatchIndex = useViewer((s) => s.currentMatchIndex)
  const setSearchQuery = useViewer((s) => s.setSearchQuery)
  const setSearchMatches = useViewer((s) => s.setSearchMatches)
  const nextMatch = useViewer((s) => s.nextMatch)
  const prevMatch = useViewer((s) => s.prevMatch)
  const closeSearch = useViewer((s) => s.closeSearch)

  const inputRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  // Debounced search against DocumentText
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/documents/${documentId}/search?q=${encodeURIComponent(searchQuery)}`
        )
        if (!res.ok) return
        const { data } = await res.json()
        startTransition(() => {
          setSearchMatches(data ?? [])
        })
        track("search_performed", {
          scope: "document",
          resultCount: data?.length ?? 0,
        })
      } catch {
        // silently fail
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, documentId, setSearchMatches])

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute top-16 right-4 z-50 flex items-center gap-1 rounded-lg border border-border/70 bg-card/88 px-2 py-2 shadow-[0_28px_70px_-45px_rgba(15,23,42,0.6)] backdrop-blur-xl"
          role="search"
          aria-label="Search in document"
        >
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in document…"
            className="h-8 w-52 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) {
                  prevMatch()
                } else {
                  nextMatch()
                }
              }
              if (e.key === "Escape") closeSearch()
            }}
            aria-label="Search query"
          />
          {searchQuery && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {searchMatches.length === 0
                ? "No results"
                : `${currentMatchIndex + 1} of ${searchMatches.length}`}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={prevMatch}
            disabled={searchMatches.length === 0}
            aria-label="Previous match"
          >
            <ChevronUp className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={nextMatch}
            disabled={searchMatches.length === 0}
            aria-label="Next match"
          >
            <ChevronDown className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={closeSearch}
            aria-label="Close search (Esc)"
          >
            <X className="size-3" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
