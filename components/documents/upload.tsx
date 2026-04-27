"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { FileImage, FileText, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  type UploadDocumentResponse,
  useUploadDocumentMutation,
} from "@/features/documents/api"
import { cn } from "@/lib/utils"

interface DocumentUploadProps {
  onUploadSuccess?: (payload: UploadDocumentResponse) => void
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingFileName, setPendingFileName] = useState<string | null>(null)

  type ApiError = { data?: { error?: string } }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          setPendingFileName(file.name)
          setUploadProgress(24)

          const formData = new FormData()
          formData.append("file", file)

          const response = await uploadDocument(formData).unwrap()
          setUploadProgress(100)

          window.setTimeout(() => {
            onUploadSuccess?.(response)
            setUploadProgress(0)
            setPendingFileName(null)
          }, 220)
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
          setPendingFileName(null)
          toast.error("Upload failed", {
            description: message,
          })
        }
      }
    },
    [onUploadSuccess, uploadDocument]
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
        "group relative overflow-hidden rounded-lg border border-dashed px-6 py-10 transition-all duration-200",
        "focus-within:ring-2 focus-within:ring-primary/50 focus-within:outline-none",
        isDragActive
          ? "border-primary/60 bg-primary/5"
          : "border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-primary/3"
      )}
    >
      <input {...getInputProps()} />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {uploadProgress > 0 ? (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/10">
          <div
            className="h-full bg-gradient-to-r from-primary/80 to-accent/80 transition-all duration-500"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      ) : null}

      <div className="relative flex flex-col items-center gap-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-lg transition-all duration-200",
              "bg-primary/10 text-primary",
              isDragActive && "scale-105 bg-primary/20"
            )}
          >
            <FileText className="size-6" aria-hidden="true" />
          </div>
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-lg transition-all duration-200",
              "bg-muted/60 text-muted-foreground",
              isDragActive && "scale-105"
            )}
          >
            <FileImage className="size-6" aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-heading text-lg font-semibold text-foreground">
            {isLoading ? "Uploading…" : isDragActive ? "Drop to upload" : "Drop PDF or image"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? pendingFileName ?? "Preparing your workspace"
              : "Drag here or click to browse"}
          </p>
        </div>

        <Button
          size="sm"
          disabled={isLoading}
          className="px-5"
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          {isLoading ? "Uploading" : "Browse files"}
        </Button>

        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
          PDF, PNG, JPG, WebP • up to 50MB
        </p>
      </div>
    </div>
  )
}
