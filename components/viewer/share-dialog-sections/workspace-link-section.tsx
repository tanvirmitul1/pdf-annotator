"use client"

import { useState } from "react"
import { Check, Copy, Link2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

interface WorkspaceLinkSectionProps {
  workspaceUrl: string
}

export function WorkspaceLinkSection({
  workspaceUrl,
}: WorkspaceLinkSectionProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopyWorkspaceLink() {
    await navigator.clipboard.writeText(workspaceUrl)
    setCopied(true)
    toast.success("Workspace link copied")
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-border/60 bg-background p-2">
          <Link2 className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Workspace link</p>
          <p className="text-xs text-muted-foreground">
            For signed-in teammates
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-border/60 bg-background px-3 py-2">
        <p className="text-xs break-all text-muted-foreground">
          {workspaceUrl}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-2 w-full gap-2"
        onClick={() => void handleCopyWorkspaceLink()}
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-emerald-500" />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            Copy workspace link
          </>
        )}
      </Button>
    </div>
  )
}
