"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { FileImage, FileText, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useUploadDocumentMutation } from "@/features/documents/api"
import { cn } from "@/lib/utils"

interface DocumentUploadProps {
  onUploadSuccess?: () => void
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation()
  const [uploadProgress, setUploadProgress] = useState(0)

  type ApiError = { data?: { error?: string } }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          setUploadProgress(30)
          const formData = new FormData()
          formData.append("file", file)

          await uploadDocument(formData).unwrap()
          setUploadProgress(100)

          toast.success("Upload successful", {
            description: `${file.name} is being processed.`,
          })

          setTimeout(() => {
            setUploadProgress(0)
            onUploadSuccess?.()
          }, 600)
        } catch (error: unknown) {
          const apiError = error as ApiError
          const message =
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof apiError.data?.error === "string"
              ? apiError.data.error
              : "Upload failed. Please try again."

          setUploadProgress(0)
          toast.error("Upload failed", {
            description: message,
          })
        }
      }
    },
    [uploadDocument, onUploadSuccess]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize: 50 * 1024 * 1024,
    disabled: isLoading,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border-2 border-dashed px-8 py-12 transition-all duration-300",
        "focus-within:ring-2 focus-within:ring-primary/50 focus-within:outline-none",
        isDragActive
          ? "border-primary/60 bg-gradient-to-br from-primary/15 to-accent/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(120,50,200,0.2)]"
          : "border-primary/25 bg-gradient-to-br from-card/60 to-card/40 hover:border-primary/40 hover:from-primary/8 hover:to-accent/8 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_rgba(120,50,200,0.15)]"
      )}
    >
      <input {...getInputProps()} />

      {/* Glossy shine effect */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Upload progress bar */}
      {uploadProgress > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/10">
          <div
            className="h-full bg-gradient-to-r from-primary/80 to-accent/80 transition-all duration-500"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <div className="relative flex flex-col items-center gap-6 text-center">
        {/* Icon group with animation */}
        <div className="flex items-center justify-center gap-4">
          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-[1.2rem] transition-all duration-300",
              "bg-gradient-to-br from-primary/15 to-primary/8 text-primary",
              isDragActive && "scale-110 from-primary/25 to-primary/15"
            )}
          >
            <FileText className="size-8" aria-hidden="true" />
          </div>
          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-[1.2rem] transition-all duration-300",
              "bg-gradient-to-br from-accent/15 to-accent/8 text-accent-foreground",
              isDragActive && "scale-110 from-accent/25 to-accent/15"
            )}
          >
            <FileImage className="size-8" aria-hidden="true" />
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-3">
          <p className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isDragActive ? "Drop to upload" : "Drop PDF or image"}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {isLoading ? "Uploading..." : "Drag files here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground/70">
            PNG, JPG, GIF, WebP, or PDF • Up to 50MB
          </p>
        </div>

        {/* Browse button - subtle when not focused */}
        <Button
          size="lg"
          disabled={isLoading}
          className={cn(
            "rounded-full px-6 transition-all duration-300",
            isLoading
              ? "cursor-not-allowed bg-primary/60"
              : "bg-gradient-to-r from-primary to-primary/90 hover:shadow-[0_8px_24px_rgba(120,50,200,0.3)] dark:hover:shadow-[0_8px_24px_rgba(120,50,200,0.4)]"
          )}
        >
          <Upload className="size-4" />
          {isLoading ? "Processing..." : "Browse files"}
        </Button>
      </div>
    </div>
  )
}
