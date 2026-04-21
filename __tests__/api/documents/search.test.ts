import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/auth/require", () => ({
  requireUser: vi.fn(),
}))
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    document: { findFirst: vi.fn() },
    documentText: { findMany: vi.fn() },
  },
}))

import { GET } from "@/app/api/documents/[id]/search/route"
import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"

const mockUser = { id: "user-1" }
const mockUserB = { id: "user-2" }
const mockDoc = { id: "doc-1" }

function makeReq(query: string) {
  return new NextRequest(
    `http://localhost/api/documents/doc-1/search?q=${encodeURIComponent(query)}`
  )
}

const params = Promise.resolve({ id: "doc-1" })

describe("GET /api/documents/[id]/search", () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDoc as never)
    vi.mocked(prisma.documentText.findMany).mockResolvedValue([
      { pageNumber: 1, text: "The quick brown fox jumps over the lazy dog" },
      { pageNumber: 2, text: "Quick brown fox is quick" },
      { pageNumber: 3, text: "Nothing here" },
    ] as never)
  })

  it("returns matches across all pages", async () => {
    const res = await GET(makeReq("quick"), { params })
    expect(res.status).toBe(200)
    const json = await res.json()
    // "quick" in page 1 (1 match), "Quick" and "quick" in page 2 (2 matches)
    expect(json.data.length).toBe(3)
  })

  it("returns correct page numbers", async () => {
    const res = await GET(makeReq("fox"), { params })
    const json = await res.json()
    const pages = json.data.map((m: { pageNumber: number }) => m.pageNumber)
    expect(pages).toContain(1)
    expect(pages).toContain(2)
  })

  it("returns empty array when no matches", async () => {
    const res = await GET(makeReq("zzznomatch"), { params })
    const json = await res.json()
    expect(json.data).toHaveLength(0)
  })

  it("returns 404 for cross-user document", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce(mockUserB as never)
    vi.mocked(prisma.document.findFirst).mockResolvedValueOnce(null)
    const res = await GET(makeReq("fox"), { params })
    expect(res.status).toBe(404)
  })

  it("returns 400 for missing query", async () => {
    const req = new NextRequest("http://localhost/api/documents/doc-1/search")
    const res = await GET(req, { params })
    expect(res.status).toBe(400)
  })
})
