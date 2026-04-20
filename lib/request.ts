import type { NextRequest } from "next/server"

export function getIpAddress(req: NextRequest | Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
}
