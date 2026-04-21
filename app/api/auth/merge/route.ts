import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { mergeAnonymousDeviceIntoUser, readDeviceTokenFromRequest } from "@/lib/device/identity"
import { getIpAddress } from "@/lib/request"
import { logAudit } from "@/lib/audit"
import { withErrorHandling } from "@/lib/api/handler"

async function handler(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const deviceToken = readDeviceTokenFromRequest(request)
  const ipAddress = getIpAddress(request)

  if (!deviceToken) {
    return NextResponse.json({ data: { merged: false, reason: "No device token found" } })
  }

  const result = await mergeAnonymousDeviceIntoUser({
    targetUserId: session.user.id,
    deviceToken,
    ipAddress,
  })

  if (result) {
    await logAudit({
      userId: session.user.id,
      action: "user.merged_guest_account",
      resourceType: "user",
      resourceId: session.user.id,
      metadata: { mergedDocumentCount: result.mergedDocumentCount },
      ipAddress,
    })
  }

  return NextResponse.json({
    data: {
      merged: Boolean(result),
      mergedDocumentCount: result?.mergedDocumentCount ?? 0,
    },
  })
}

export const POST = withErrorHandling(handler)
