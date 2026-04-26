import { notFound } from "next/navigation"

import { ImageViewer } from "@/components/viewer/image-viewer"
import { ViewerShellLoader } from "@/components/viewer/viewer-shell-loader"
import { getCurrentIdentity } from "@/lib/auth/require"
import { auth } from "@/auth"
import { getAccessibleDocument } from "@/lib/db/repositories/document-access"

export const dynamic = "force-dynamic"

export default async function PublicDocumentViewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const identity = await getCurrentIdentity()
  const session = await auth()

  if (!identity) {
    notFound()
  }

  const document = await getAccessibleDocument(identity.userId, id)

  if (!document) {
    notFound()
  }

  const fileName = document.name.toLowerCase()
  const isImage =
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".webp") ||
    fileName.endsWith(".gif")

  return (
    <main className="flex h-screen w-full overflow-hidden bg-background">
      {isImage ? (
        <ImageViewer
          documentId={document.id}
          documentName={document.name}
          initialStatus={document.status}
        />
      ) : (
        <ViewerShellLoader
          documentId={document.id}
          documentName={document.name}
          initialPage={1}
          isAuthenticated={Boolean(session?.user?.id)}
        />
      )}
    </main>
  )
}
