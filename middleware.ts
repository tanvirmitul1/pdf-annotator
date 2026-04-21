import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { toErrorResponse } from "@/lib/api/handler"
import { getIpAddress } from "@/lib/request"
import { enforceRateLimit } from "@/lib/ratelimit"

export const runtime = "nodejs"

const isDev =
  process.env.APP_ENV === "development" ||
  process.env.NODE_ENV === "development"

const securityHeaders = {
  "Content-Security-Policy": isDev
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' ws: wss: http://localhost:*; frame-ancestors 'none'"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.posthog.com https://*.sentry.io; frame-ancestors 'none'",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}

export default auth(async (req) => {
  try {
    await enforceRateLimit(
      req as NextRequest,
      req.auth?.user?.id ?? getIpAddress(req),
      "default"
    )
  } catch (error) {
    return toErrorResponse(error)
  }

  if (
    req.auth?.user &&
    ["/", "/login", "/signup"].includes(req.nextUrl.pathname)
  ) {
    const response = NextResponse.redirect(new URL("/app", req.url))
    setSecurityHeaders(response)
    return response
  }

  if (req.nextUrl.pathname.startsWith("/app") && !req.auth?.user) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    const response = NextResponse.redirect(loginUrl)
    setSecurityHeaders(response)
    return response
  }

  const response = NextResponse.next()
  setSecurityHeaders(response)
  return response
})

function setSecurityHeaders(response: NextResponse) {
  for (const [header, value] of Object.entries(securityHeaders)) {
    response.headers.set(header, value)
  }
}

export const config = {
  matcher: [
    "/app/:path*",
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
}
