"use client"

import { useState } from "react"
import { Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { useGetDocumentViewerDataQuery } from "@/features/viewer/api"
import { DocumentShareDialog } from "./document-share-dialog"

interface CollaboratorsBarProps {
  documentId: string
}

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined
) {
  const src = (name || email || "?").trim()
  return src.slice(0, 2).toUpperCase()
}

export function CollaboratorsBar({ documentId }: CollaboratorsBarProps) {
  const { data: viewerData } = useGetDocumentViewerDataQuery(documentId)
  const [showShareDialog, setShowShareDialog] = useState(false)

  const collaborators = viewerData?.collaborators ?? []
  const maxDisplay = 4
  const visibleCollaborators = collaborators.slice(0, maxDisplay)
  const remainingCount = collaborators.length - maxDisplay

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Collaborator Avatars */}
        <div className="flex -space-x-2">
          {visibleCollaborators.map((collaborator) => (
            <TooltipProvider key={collaborator.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="size-7 cursor-pointer border-2 border-background transition-transform hover:z-10 hover:scale-110">
                    <AvatarImage src={collaborator.image ?? undefined} />
                    <AvatarFallback className="text-[9px]">
                      {getInitials(collaborator.name, collaborator.email)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs font-medium">
                    {collaborator.name || collaborator.email}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {collaborator.role}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {remainingCount > 0 && (
            <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
              +{remainingCount}
            </div>
          )}
        </div>

        {/* Share Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => setShowShareDialog(true)}
        >
          <Users className="size-3.5" />
          Share
        </Button>
      </div>

      {/* Share Dialog */}
      <DocumentShareDialog
        documentId={documentId}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </>
  )
}
