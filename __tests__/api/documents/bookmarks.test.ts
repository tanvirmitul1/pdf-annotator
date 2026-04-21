import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Mock auth and prisma
vi.mock("@/lib/auth/require", () => ({
  requireUser: vi.fn(),
}))
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    document: { findFirst: vi.fn() },
    bookmark: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  },
}))
vi.mock("@/lib/ratelimit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

import { GET, POST } from "@/app/api/documents/[id]/bookmarks/route"
import { PATCH, DELETE } from "@/app/api/documents/[id]/bookmarks/[bookmarkId]/route"
import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"
import { UnauthenticatedError } from "@/lib/errors"

const mockUser = { id: "user-1", email: "a@a.com" }
const mockUserB = { id: "user-2", email: "b@b.com" }
const mockDoc = { id: "doc-1" }
const mockBookmark = {
  id: "bm-1",
  userId: "user-1",
  documentId: "doc-1",
  pageNumber: 5,
  label: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeReq(method = "GET", body?: unknown) {
  const req = new NextRequest("http://localhost/api/documents/doc-1/bookmarks", {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  return req
}

const params = Promise.resolve({ id: "doc-1" })
const paramsWithBookmark = Promise.resolve({ id: "doc-1", bookmarkId: "bm-1" })

describe("GET /api/documents/[id]/bookmarks", () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDoc as never)
    vi.mocked(prisma.bookmark.findMany).mockResolvedValue([mockBookmark] as never)
  })

  it("returns bookmarks for authenticated user", async () => {
    const res = await GET(makeReq(), { params })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.data[0].pageNumber).toBe(5)
  })

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireUser).mockRejectedValueOnce(new UnauthenticatedError())
    const res = await GET(makeReq(), { params })
    expect(res.status).toBe(401)
  })

  it("returns 404 when cross-user tries to access another user's document", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUserB as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValueOnce(null)
    const res = await GET(makeReq(), { params })
    expect(res.status).toBe(404)
  })
})

describe("POST /api/documents/[id]/bookmarks", () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDoc as never)
    vi.mocked(prisma.bookmark.create).mockResolvedValue(mockBookmark as never)
  })

  it("creates a bookmark and returns 201", async () => {
    const res = await POST(
      makeReq("POST", { pageNumber: 5 }),
      { params }
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data.pageNumber).toBe(5)
  })

  it("returns 400 for invalid input (pageNumber 0)", async () => {
    const res = await POST(
      makeReq("POST", { pageNumber: 0 }),
      { params }
    )
    expect(res.status).toBe(400)
  })

  it("returns 404 when document belongs to another user", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUserB as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValueOnce(null)
    const res = await POST(
      makeReq("POST", { pageNumber: 5 }),
      { params }
    )
    expect(res.status).toBe(404)
  })
})

describe("DELETE /api/documents/[id]/bookmarks/[bookmarkId]", () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(mockBookmark as never)
    vi.mocked(prisma.bookmark.delete).mockResolvedValue(mockBookmark as never)
  })

  it("deletes bookmark and returns 204", async () => {
    const res = await DELETE(
      makeReq("DELETE"),
      { params: paramsWithBookmark }
    )
    expect(res.status).toBe(204)
  })

  it("returns 404 when bookmark belongs to another user", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUserB as never)
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValueOnce(null)
    const res = await DELETE(
      makeReq("DELETE"),
      { params: paramsWithBookmark }
    )
    expect(res.status).toBe(404)
  })
})

describe("PATCH /api/documents/[id]/bookmarks/[bookmarkId]", () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValue(mockBookmark as never)
    vi.mocked(prisma.bookmark.update).mockResolvedValue({
      ...mockBookmark,
      label: "Chapter 1",
    } as never)
  })

  it("updates bookmark label", async () => {
    const res = await PATCH(
      makeReq("PATCH", { label: "Chapter 1" }),
      { params: paramsWithBookmark }
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.label).toBe("Chapter 1")
  })

  it("returns 404 for cross-user access", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUserB as never)
    vi.mocked(prisma.bookmark.findFirst).mockResolvedValueOnce(null)
    const res = await PATCH(
      makeReq("PATCH", { label: "Stolen" }),
      { params: paramsWithBookmark }
    )
    expect(res.status).toBe(404)
  })
})
