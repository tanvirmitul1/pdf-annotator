import { configureStore } from "@reduxjs/toolkit"
import { describe, expect, it, vi, afterEach } from "vitest"

import { annotationsApi } from "@/features/annotations/api"
import { api } from "@/store/api"

const annotationPayload = {
  documentId: "doc-1",
  pageNumber: 1,
  type: "HIGHLIGHT" as const,
  color: "#fbbf24",
  positionData: {
    kind: "TEXT" as const,
    pageNumber: 1,
    anchor: {
      rects: [{ x: 10, y: 20, width: 30, height: 12 }],
      quotedText: "Hello world",
      prefix: "",
      suffix: "",
    },
  },
}

function createTestStore() {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  })
}

describe("annotationsApi optimistic updates", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("rolls back optimistic create when the server rejects the mutation", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.includes("/api/documents/doc-1/annotations")) {
        return new Response(JSON.stringify({ error: { message: "boom" } }), {
          status: 500,
          headers: { "content-type": "application/json" },
        })
      }

      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    const store = createTestStore()
    await store.dispatch(
      annotationsApi.util.upsertQueryData("listByDocument", "doc-1", [])
    )

    const mutationPromise = store.dispatch(
      annotationsApi.endpoints.createAnnotation.initiate(annotationPayload)
    )

    const optimisticState = annotationsApi.endpoints.listByDocument.select("doc-1")(
      store.getState()
    )
    expect(optimisticState.data).toHaveLength(1)
    expect(optimisticState.data?.[0]?.id).toMatch(/^temp-/)

    await mutationPromise

    const finalState = annotationsApi.endpoints.listByDocument.select("doc-1")(
      store.getState()
    )
    expect(finalState.data ?? []).toEqual([])
  })
})
