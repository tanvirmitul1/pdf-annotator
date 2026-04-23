import { NextRequest, NextResponse } from "next/server"
import { extname } from "path"
import { Readable } from "stream"

import { requireRequestIdentity } from "@/lib/auth/request-identity"
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

function buildContentDispositionFilename(documentId: string, filename: string, isThumbnail: boolean) {
    const rawName = isThumbnail ? `${documentId}-thumbnail.webp` : filename
    const asciiFallback = rawName
        .normalize("NFKD")
        .replace(/[^\x20-\x7E]+/g, "-")
        .replace(/["\\]/g, "")
        .replace(/\s+/g, " ")
        .trim() || `${documentId}${isThumbnail ? "-thumbnail.webp" : ""}`

    const encodedName = encodeURIComponent(rawName)
    return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`
}

async function getHandler(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params

    if (!Array.isArray(path) || path.length < 3) {
        return NextResponse.json({ error: "Invalid storage key" }, { status: 400 })
    }

    const [, documentId, ...rest] = path
    const identity = await requireRequestIdentity(req)

    const document = await prisma.document.findFirst({
        where: { id: documentId, userId: identity.userId, deletedAt: null },
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
    const isThumbnail = flavor.startsWith("thumb")
    const extension = isThumbnail
        ? ".webp"
        : extname(document.name).toLowerCase()

    const contentType = MIME_TYPES[extension] ?? "application/octet-stream"

    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>

    return new NextResponse(webStream, {
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=60",
            "Content-Disposition": buildContentDispositionFilename(
                documentId,
                document.name,
                isThumbnail
            ),
        },
    })
}

export const GET = withErrorHandling(getHandler)
