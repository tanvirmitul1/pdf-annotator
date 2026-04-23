import type { NextRequest } from "next/server"

import { UnauthenticatedError } from "@/lib/errors"
import { resolveOptionalIdentityFromRequest } from "@/lib/device/identity"
import { requireUser } from "@/lib/auth/require"

export async function requireRequestIdentity(request: NextRequest) {
  try {
    const user = await requireUser()
    return {
      userId: user.id,
      isAnonymous: false,
      deviceToken: null,
      cookieWasCreated: false,
    }
  } catch (error) {
    if (!(error instanceof UnauthenticatedError)) {
      throw error
    }

    const identity = await resolveOptionalIdentityFromRequest(request, null)
    if (!identity) {
      throw error
    }

    return identity
  }
}
