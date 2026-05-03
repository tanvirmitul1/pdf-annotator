"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"

import { DocumentUpload } from "@/components/documents/upload"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/responsive-dialog"

export function DashboardUpload() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button 
        size="sm" 
        className="shrink-0 gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Upload className="size-3.5" />
        Upload
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="max-w-lg border-border/60 bg-card/95 backdrop-blur-xl"
          size="lg"
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">Upload document</DialogTitle>
            <DialogDescription>
              Select a PDF or image file to start annotating and studying.
            </DialogDescription>
          </DialogHeader>
          
          <DocumentUpload
            onUploadSuccess={({ document }) => {
              setIsOpen(false)
              router.push(`/app/documents/${document.id}`)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
