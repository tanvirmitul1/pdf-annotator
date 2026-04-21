import { notFound } from "next/navigation"

import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"
import { ViewerShellLoader } from "@/components/viewer/viewer-shell-loader"

export default async function DocumentViewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()

  const document = await prisma.document.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    select: { id: true, name: true, pageCount: true, status: true },
  })

  if (!document) notFound()

  return (
    <ViewerShellLoader
      documentId={document.id}
      documentName={document.name}
      initialPage={1}
    />
  )
}
