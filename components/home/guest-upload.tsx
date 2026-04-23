"use client"

import { useRouter } from "next/navigation"
import { DocumentUpload } from "@/components/documents/upload"

export function GuestUpload() {
  const router = useRouter()

  return (
    <DocumentUpload
      onUploadSuccess={({ document }) => {
        router.push(`/documents/${document.id}`)
      }}
    />
  )
}
