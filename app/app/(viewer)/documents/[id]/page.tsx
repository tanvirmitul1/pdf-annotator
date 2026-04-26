import { notFound } from "next/navigation"

import { requireUser } from "@/lib/auth/require"
import { ViewerShellLoader } from "@/components/viewer/viewer-shell-loader"
import { ImageViewer } from "@/components/viewer/image-viewer"
import { getAccessibleDocument } from "@/lib/db/repositories/document-access"
import { auth } from "@/auth"

export default async function DocumentViewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const session = await auth()

  const document = await getAccessibleDocument(user.id, id)

  if (!document) notFound()

  // Check if it's an image based on file extension
  const fileName = document.name.toLowerCase()
  const isImage = fileName.endsWith(".png") || 
                  fileName.endsWith(".jpg") || 
                  fileName.endsWith(".jpeg") || 
                  fileName.endsWith(".webp") || 
                  fileName.endsWith(".gif")

  if (isImage) {
    return <ImageViewer documentId={document.id} documentName={document.name} />
  }

  return (
    <ViewerShellLoader
      documentId={document.id}
      documentName={document.name}
      initialPage={1}
      isAuthenticated={Boolean(session?.user?.id)}
    />
  )
}
