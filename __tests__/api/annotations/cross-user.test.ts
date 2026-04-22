import { describe, it, expect, vi } from "vitest"
import { NextRequest } from "next/server"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth/require", () => ({
  requireUser: vi.fn(),
}))
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    document: { findFirst: vi.fn() },
    annotation: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
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

import { GET } from "@/app/api/documents/[id]/annotations/route"
import { PATCH, DELETE } from "@/app/api/annotations/[id]/route"
import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"

const userB = { id: "user-b", email: "b@test.com" }

// ─── Cross-user access: GET document annotations ──────────────────────────────

describe("cross-user access — GET /api/documents/[id]/annotations", () => {
  it("userB cannot read annotations on userA document (404, not 403)", async () => {
    vi.mocked(requireUser).mockResolvedValue(userB as never)
    // Document.findFirst with userId=userB returns null (not userA's doc)
    vi.mocked(prisma.document.findFirst).mockResolvedValue(null)

    const req = new NextRequest("http://localhost/api/documents/doc-1/annotations")
    const res = await GET(req, { params: Promise.resolve({ id: "doc-1" }) })

    expect(res.status).toBe(404)
    // Does not reveal existence
    const body = await res.json()
    expect(body.error.code).toBe("NOT_FOUND")
  })
})

// ─── Cross-user access: PATCH annotation ─────────────────────────────────────

describe("cross-user access — PATCH /api/annotations/[id]", () => {
  it("userB cannot PATCH userA annotation (404, not 403)", async () => {
    vi.mocked(requireUser).mockResolvedValue(userB as never)
    // findFirst with userId=userB, annotationId=ann-owned-by-a returns null
    vi.mocked(prisma.annotation.findFirst).mockResolvedValue(null)

    const req = new NextRequest("http://localhost/api/annotations/ann-owned-by-a", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "tampered" }),
    })
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "ann-owned-by-a" }),
    })

    expect(res.status).toBe(404)
    expect(prisma.annotation.update).not.toHaveBeenCalled()
    const body = await res.json()
    expect(body.error.code).toBe("NOT_FOUND")
  })

  it("original annotation is not modified after cross-user PATCH attempt", async () => {
    vi.mocked(requireUser).mockResolvedValue(userB as never)
    vi.mocked(prisma.annotation.findFirst).mockResolvedValue(null)

    const req = new NextRequest("http://localhost/api/annotations/ann-owned-by-a", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ color: "#ff0000" }),
    })
    await PATCH(req, { params: Promise.resolve({ id: "ann-owned-by-a" }) })

    expect(prisma.annotation.update).not.toHaveBeenCalled()
  })
})

// ─── Cross-user access: DELETE annotation ────────────────────────────────────

describe("cross-user access — DELETE /api/annotations/[id]", () => {
  it("userB cannot DELETE userA annotation (404, annotation preserved)", async () => {
    vi.mocked(requireUser).mockResolvedValue(userB as never)
    vi.mocked(prisma.annotation.findFirst).mockResolvedValue(null)

    const req = new NextRequest("http://localhost/api/annotations/ann-owned-by-a", {
      method: "DELETE",
    })
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "ann-owned-by-a" }),
    })

    expect(res.status).toBe(404)
    expect(prisma.annotation.update).not.toHaveBeenCalled()
  })
})
