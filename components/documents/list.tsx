"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Download, Edit, Trash2, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useListDocumentsQuery, useDeleteDocumentMutation, useRestoreDocumentMutation } from "@/features/documents/api"
import { toast } from "sonner"

interface DocumentListProps {
  showDeleted?: boolean
}

export function DocumentList({ showDeleted = false }: DocumentListProps) {
  const [search, setSearch] = useState("")
  const { data, isLoading } = useListDocumentsQuery({ search, sort: "lastOpenedAt", limit: 20 })
  const [deleteDocument] = useDeleteDocumentMutation()
  const [restoreDocument] = useRestoreDocumentMutation()

  type ApiError = { data?: { error?: string } }

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteDocument(id).unwrap()
      toast("Document deleted", {
        description: `${name} has been moved to trash.`,
      })
    } catch (error: unknown) {
      const apiError = error as ApiError
      const message =
        typeof error === "object" && error !== null &&
        "data" in error &&
        typeof apiError.data?.error === "string"
          ? apiError.data.error
          : "An error occurred while deleting."

      toast("Delete failed", {
        description: message,
      })
    }
  }

  const handleRestore = async (id: string, name: string) => {
    try {
      await restoreDocument(id).unwrap()
      toast("Document restored", {
        description: `${name} has been restored.`,
      })
    } catch (error: unknown) {
      const apiError = error as ApiError
      const message =
        typeof error === "object" && error !== null &&
        "data" in error &&
        typeof apiError.data?.error === "string"
          ? apiError.data.error
          : "An error occurred while restoring."

      toast("Restore failed", {
        description: message,
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  const documents = (data?.items ?? []).filter(doc =>
    showDeleted ? doc.deletedAt : !doc.deletedAt
  )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="grid gap-4">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {doc.thumbnailKey && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.thumbnailKey}
                      alt={doc.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{doc.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {doc.lastOpenedAt
                        ? formatDistanceToNow(new Date(doc.lastOpenedAt), { addSuffix: true })
                        : formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {showDeleted ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(doc.id, doc.name)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id, doc.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {showDeleted ? "No deleted documents" : "No documents found"}
        </div>
      )}
    </div>
  )
}