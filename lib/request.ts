import type { NextRequest } from "next/server"
import type { Headers } from "next/dist/compiled/@edge-runtime/primitives"

export function getIpAddress(req: NextRequest | Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
}

export function getIpAddressFromRequestHeaders(headerStore: Pick<Headers, "get"> | globalThis.Headers) {
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? "127.0.0.1"
}
