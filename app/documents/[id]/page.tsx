import { notFound } from "next/navigation"

import { ImageViewer } from "@/components/viewer/image-viewer"
import { ViewerShellLoader } from "@/components/viewer/viewer-shell-loader"
import { getCurrentIdentity } from "@/lib/auth/require"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"

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

  const document = await prisma.document.findFirst({
    where: { id, userId: identity.userId, deletedAt: null },
    select: { id: true, name: true, pageCount: true, status: true },
  })

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
    <main className="min-h-screen overflow-hidden bg-background p-3">
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
