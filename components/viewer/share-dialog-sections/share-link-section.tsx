"use client"

import { useState } from "react"
import { Check, Copy, Globe } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
interface ShareLinkSectionProps {
  publicUrl: string | null
  isLoading: boolean
  onTogglePublicLink: (enabled: boolean) => void
}

export function ShareLinkSection({
  publicUrl,
  isLoading,
  onTogglePublicLink,
}: ShareLinkSectionProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopyPublicLink() {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    toast.success("Public link copied")
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-border/60 bg-background p-2">
            <Globe className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Public link</p>
            <p className="text-xs text-muted-foreground">
              Anyone with the link can view
            </p>
          </div>
        </div>
        <Switch
          checked={!!publicUrl}
          onCheckedChange={onTogglePublicLink}
          disabled={isLoading}
        />
      </div>

      {publicUrl && (
        <>
          <div className="mt-3 rounded-lg border border-border/60 bg-background px-3 py-2">
            <p className="break-all text-xs text-muted-foreground">{publicUrl}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full gap-2"
            onClick={() => void handleCopyPublicLink()}
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy public link
              </>
            )}
          </Button>
        </>
      )}
    </div>
  )
}
