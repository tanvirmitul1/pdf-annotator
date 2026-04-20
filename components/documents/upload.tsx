"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Image } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useUploadDocumentMutation } from "@/features/documents/api"
import { toast } from "sonner"

interface DocumentUploadProps {
  onUploadSuccess?: () => void
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation()

  type ApiError = { data?: { error?: string } }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          const formData = new FormData()
          formData.append("file", file)

          await uploadDocument(formData).unwrap()

          toast("Upload successful", {
            description: `${file.name} has been uploaded.`,
          })

          onUploadSuccess?.()
        } catch (error: unknown) {
          const apiError = error as ApiError
          const message =
            typeof error === "object" && error !== null && "data" in error &&
            typeof apiError.data?.error === "string"
              ? apiError.data.error
              : "An error occurred while uploading."

          toast("Upload failed", {
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
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isLoading,
  })

  return (
    <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
      <CardContent className="p-8">
        <div
          {...getRootProps()}
          className={`cursor-pointer text-center ${
            isDragActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8" aria-hidden="true" />
              <Image className="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-medium">
                {isDragActive ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-sm">
                or click to select files (PDFs and images up to 50MB)
              </p>
            </div>
            <Button variant="outline" disabled={isLoading}>
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? "Uploading..." : "Select Files"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}