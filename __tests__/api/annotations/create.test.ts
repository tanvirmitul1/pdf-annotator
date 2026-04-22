import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth/require", () => ({
  requireUser: vi.fn(),
}))
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    document: { findFirst: vi.fn() },
    annotation: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
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
vi.mock("@/lib/analytics", () => ({
  track: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/authz/assert", () => ({
  assertCanPerform: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/request", () => ({
  getIpAddress: vi.fn().mockReturnValue("127.0.0.1"),
}))

import { GET, POST } from "@/app/api/documents/[id]/annotations/route"
import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"
import { assertCanPerform } from "@/lib/authz/assert"
import { UnauthenticatedError, QuotaExceededError } from "@/lib/errors"

const mockUser = { id: "user-1", email: "a@test.com" }
const mockDoc = { id: "doc-1" }

const validPositionData = {
  kind: "TEXT",
  pageNumber: 1,
  anchor: {
    rects: [{ x: 10, y: 20, width: 100, height: 15 }],
    quotedText: "Hello world",
    prefix: "before ",
    suffix: " after",
  },
}

const validBody = {
  pageNumber: 1,
  type: "HIGHLIGHT",
  color: "#fbbf24",
  positionData: validPositionData,
}

const mockAnnotation = {
  id: "ann-1",
  userId: "user-1",
  documentId: "doc-1",
  pageNumber: 1,
  type: "HIGHLIGHT",
  color: "#fbbf24",
  positionData: validPositionData,
  content: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],
}

function makeReq(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/documents/doc-1/annotations", {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

const params = Promise.resolve({ id: "doc-1" })

// ─── GET ─────────────────────────────────────────────────────────────────────

describe("GET /api/documents/[id]/annotations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireUser).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDoc as never)
    vi.mocked(prisma.annotation.findMany).mockResolvedValue([mockAnnotation] as never)
    vi.mocked(assertCanPerform).mockResolvedValue(undefined)
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireUser).mockRejectedValue(new UnauthenticatedError())
    const res = await GET(makeReq("GET"), { params })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe("UNAUTHENTICATED")
  })

  it("returns 404 when document not owned by user", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(null)
    const res = await GET(makeReq("GET"), { params })
    expect(res.status).toBe(404)
  })

  it("returns annotations list", async () => {
    const res = await GET(makeReq("GET"), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].type).toBe("HIGHLIGHT")
  })
})

// ─── POST ────────────────────────────────────────────────────────────────────

describe("POST /api/documents/[id]/annotations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireUser).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDoc as never)
    vi.mocked(prisma.annotation.count).mockResolvedValue(0)
    vi.mocked(prisma.annotation.create).mockResolvedValue({
      ...mockAnnotation,
      tags: [],
    } as never)
    vi.mocked(assertCanPerform).mockResolvedValue(undefined)
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireUser).mockRejectedValue(new UnauthenticatedError())
    const res = await POST(makeReq("POST", validBody), { params })
    expect(res.status).toBe(401)
  })

  it("returns 400 on invalid body", async () => {
    const res = await POST(makeReq("POST", { type: "HIGHLIGHT" }), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe("VALIDATION_FAILED")
  })

  it("returns 400 on invalid annotation type", async () => {
    const res = await POST(
      makeReq("POST", { ...validBody, type: "INVALID_TYPE" }),
      { params }
    )
    expect(res.status).toBe(400)
  })

  it("returns 400 on invalid color", async () => {
    const res = await POST(
      makeReq("POST", { ...validBody, color: "not-a-color" }),
      { params }
    )
    expect(res.status).toBe(400)
  })

  it("returns 404 when document not owned by user", async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(null)
    const res = await POST(makeReq("POST", validBody), { params })
    expect(res.status).toBe(404)
  })

  it("returns 402 when quota exceeded", async () => {
    vi.mocked(assertCanPerform).mockRejectedValue(
      new QuotaExceededError("annotations", 100, 100)
    )
    const res = await POST(makeReq("POST", validBody), { params })
    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body.error.code).toBe("QUOTA_EXCEEDED")
  })

  it("creates annotation and returns 201", async () => {
    const res = await POST(makeReq("POST", validBody), { params })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data.type).toBe("HIGHLIGHT")
    expect(body.data.color).toBe("#fbbf24")
    expect(prisma.annotation.create).toHaveBeenCalled()
  })

  it("passes currentAnnotationsPerDoc to assertCanPerform", async () => {
    vi.mocked(prisma.annotation.count).mockResolvedValue(42)
    await POST(makeReq("POST", validBody), { params })
    expect(assertCanPerform).toHaveBeenCalledWith(
      mockUser.id,
      "annotation.create",
      { currentAnnotationsPerDoc: 42 }
    )
  })
})
