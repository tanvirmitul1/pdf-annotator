import { NextRequest, NextResponse } from "next/server"
import { extname } from "path"
import { Readable } from "stream"

import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"
import { createStorageAdapter } from "@/lib/storage"
import { withErrorHandling } from "@/lib/api/handler"

const MIME_TYPES: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
}

async function getHandler(
    _req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params

    if (!Array.isArray(path) || path.length < 3) {
        return NextResponse.json({ error: "Invalid storage key" }, { status: 400 })
    }

    const [_pathUserId, documentId, ...rest] = path
    const user = await requireUser()

    const document = await prisma.document.findFirst({
        where: { id: documentId, userId: user.id, deletedAt: null },
        select: { name: true, storageKey: true, thumbnailKey: true },
    })

    if (!document) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const storageKey = path.join("/")
    const expectedKeys = [document.storageKey, document.thumbnailKey].filter(Boolean)
    if (!expectedKeys.includes(storageKey)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    const storage = createStorageAdapter()

    let nodeStream: Readable
    try {
        nodeStream = await storage.get(storageKey)
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const flavor = rest.join("/")
    const extension = flavor.startsWith("thumb")
        ? ".webp"
        : extname(document.name).toLowerCase()

    const contentType = MIME_TYPES[extension] ?? "application/octet-stream"

    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>

    return new NextResponse(webStream, {
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=60",
            "Content-Disposition": `inline; filename="${flavor.startsWith("thumb") ? `${documentId}-thumbnail.webp` : document.name
                }"`,
        },
    })
}

export const GET = withErrorHandling(getHandler)
