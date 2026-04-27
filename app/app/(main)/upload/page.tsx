"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { DocumentUpload } from "@/components/documents/upload"
import { Button } from "@/components/ui/button"

export default function UploadPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="size-8 rounded-md">
          <Link href="/app">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Upload document
        </h1>
      </div>

      <div className="mx-auto max-w-lg">
        <DocumentUpload
          onUploadSuccess={({ document }) => {
            router.push(`/app/documents/${document.id}`)
          }}
        />
      </div>
    </div>
  )
}
