import Link from "next/link"

import { Button } from "@/components/ui/button"

export function DashboardEmptyState() {
  return (
    <section className="rounded-[2rem] border border-dashed border-border bg-card/80 p-8 text-center shadow-sm">
      <div className="mx-auto mb-6 flex size-28 items-center justify-center rounded-[2rem] bg-linear-to-br from-primary/15 via-transparent to-primary/5">
        <svg
          aria-hidden="true"
          viewBox="0 0 120 120"
          className="size-20 text-primary"
          fill="none"
        >
          <path
            d="M30 22h40l20 20v56a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6V28a6 6 0 0 1 6-6Z"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path d="M70 22v20h20" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
          <path d="M40 66h40M40 82h28" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your library is empty</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm/6 text-muted-foreground">
        Upload your first document to start building a study space with annotations, tags, and
        shareable insights.
      </p>
      <div className="mt-6 flex justify-center">
        <Button asChild size="lg" className="hover:bg-primary/90">
          <Link href="/app/help">Upload your first document</Link>
        </Button>
      </div>
    </section>
  )
}
