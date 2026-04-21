import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/auth/require", () => ({
  requireUser: vi.fn(),
}))
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    document: { findFirst: vi.fn() },
    readingProgress: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  },
}))
vi.mock("@/lib/ratelimit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(undefined),
}))

import { GET, PUT } from "@/app/api/documents/[id]/reading-progress/route"
import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"

const mockUser = { id: "user-1" }
const mockUserB = { id: "user-2" }
const mockDoc = { id: "doc-1" }
const mockProgress = {
  id: "rp-1",
  userId: "user-1",
  documentId: "doc-1",
  lastPage: 42,
  percentComplete: 21,
  lastReadAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeReq(method = "GET", body?: unknown) {
  return new NextRequest(
    "http://localhost/api/documents/doc-1/reading-progress",
    {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }
  )
}

const params = Promise.resolve({ id: "doc-1" })

describe("GET /api/documents/[id]/reading-progress", () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDoc as never)
    vi.mocked(prisma.readingProgress.findUnique).mockResolvedValue(
      mockProgress as never
    )
  })

  it("returns reading progress", async () => {
    const res = await GET(makeReq(), { params })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.lastPage).toBe(42)
  })

  it("returns 404 for cross-user document access", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUserB as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValueOnce(null)
    const res = await GET(makeReq(), { params })
    expect(res.status).toBe(404)
  })
})

describe("PUT /api/documents/[id]/reading-progress", () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDoc as never)
    vi.mocked(prisma.readingProgress.upsert).mockResolvedValue(
      mockProgress as never
    )
  })

  it("upserts reading progress", async () => {
    const res = await PUT(
      makeReq("PUT", { lastPage: 42, percentComplete: 21 }),
      { params }
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.lastPage).toBe(42)
  })

  it("returns 400 for invalid input", async () => {
    const res = await PUT(
      makeReq("PUT", { lastPage: -1, percentComplete: 21 }),
      { params }
    )
    expect(res.status).toBe(400)
  })

  it("returns 404 for cross-user document", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUserB as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValueOnce(null)
    const res = await PUT(
      makeReq("PUT", { lastPage: 42, percentComplete: 21 }),
      { params }
    )
    expect(res.status).toBe(404)
  })

  it("persists across reload (upsert called with correct user scope)", async () => {
    await PUT(
      makeReq("PUT", { lastPage: 10, percentComplete: 5 }),
      { params }
    )
    expect(prisma.readingProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_documentId: { userId: "user-1", documentId: "doc-1" },
        },
      })
    )
  })
})
