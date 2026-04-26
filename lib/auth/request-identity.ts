import type { NextRequest } from "next/server"

import { auth } from "@/auth"
import { UnauthenticatedError } from "@/lib/errors"
import { resolveOptionalIdentityFromRequest } from "@/lib/device/identity"

export async function requireRequestIdentity(request: NextRequest) {
  const session = await auth()
  const identity = await resolveOptionalIdentityFromRequest(
    request,
    session?.user?.id ?? null
  )

  if (!identity) {
    throw new UnauthenticatedError()
  }

  return identity
}
