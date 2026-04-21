import { randomUUID } from "crypto"

import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { Prisma, type PrismaClient, UsageMetric } from "@prisma/client"

import { prisma } from "@/lib/db/prisma"
import { getIpAddress } from "@/lib/request"

export const DEVICE_COOKIE_NAME = "pdf-annotator-device"

const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

type TxClient = Prisma.TransactionClient | PrismaClient

export type DeviceIdentity =
  | { userId: string; isAnonymous: false; deviceToken?: string | null; cookieWasCreated: false }
  | { userId: string; isAnonymous: true; deviceToken: string; cookieWasCreated: boolean }

function createGuestName(token: string) {
  return `Guest ${token.slice(0, 8)}`
}

async function ensureUsageRows(client: TxClient, userId: string) {
  await client.usage.createMany({
    data: [
      { userId, metric: UsageMetric.DOCUMENTS, value: 0 },
      { userId, metric: UsageMetric.STORAGE_MB, value: 0 },
      { userId, metric: UsageMetric.SHARE_LINKS, value: 0 },
      { userId, metric: UsageMetric.ANNOTATIONS, value: 0 },
    ],
    skipDuplicates: true,
  })
}

export function getDeviceCookieOptions() {
  return {
    name: DEVICE_COOKIE_NAME,
    value: randomUUID(),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  }
}

export function readDeviceTokenFromRequest(request: NextRequest | Request) {
  if ("cookies" in request && typeof request.cookies?.get === "function") {
    return request.cookies.get(DEVICE_COOKIE_NAME)?.value ?? null
  }

  const cookieHeader = request.headers.get("cookie") ?? ""
  const match = cookieHeader.match(new RegExp(`${DEVICE_COOKIE_NAME}=([^;]+)`))
  return match?.[1] ?? null
}

export async function readDeviceTokenFromServerCookies() {
  const cookieStore = await cookies()
  return cookieStore.get(DEVICE_COOKIE_NAME)?.value ?? null
}

export async function getOrCreateGuestUserByDeviceToken(
  deviceToken: string,
  ipAddress: string,
  client: TxClient = prisma
) {
  let user = await client.user.findUnique({
    where: { deviceToken },
    select: { id: true, isAnonymous: true, deletedAt: true },
  })

  if (!user) {
    const created = await client.user.create({
      data: {
        name: createGuestName(deviceToken),
        planId: "free",
        isAnonymous: true,
        deviceToken,
        lastKnownIp: ipAddress,
      },
      select: { id: true, isAnonymous: true, deletedAt: true },
    })
    await ensureUsageRows(client, created.id)
    user = created
  } else if (user.deletedAt) {
    user = await client.user.update({
      where: { id: user.id },
      data: {
        deletedAt: null,
        lastKnownIp: ipAddress,
      },
      select: { id: true, isAnonymous: true, deletedAt: true },
    })
  } else {
    await client.user.update({
      where: { id: user.id },
      data: { lastKnownIp: ipAddress },
    })
  }

  return user
}

export async function resolveIdentityFromRequest(
  request: NextRequest,
  authenticatedUserId?: string | null
): Promise<DeviceIdentity> {
  if (authenticatedUserId) {
    return {
      userId: authenticatedUserId,
      isAnonymous: false,
      cookieWasCreated: false,
      deviceToken: readDeviceTokenFromRequest(request),
    }
  }

  const existingToken = readDeviceTokenFromRequest(request)
  const deviceToken = existingToken ?? randomUUID()
  const ipAddress = getIpAddress(request)
  const guest = await getOrCreateGuestUserByDeviceToken(deviceToken, ipAddress)

  return {
    userId: guest.id,
    isAnonymous: true,
    deviceToken,
    cookieWasCreated: !existingToken,
  }
}

export async function resolveOptionalIdentityFromRequest(
  request: NextRequest,
  authenticatedUserId?: string | null
): Promise<DeviceIdentity | null> {
  if (authenticatedUserId) {
    return {
      userId: authenticatedUserId,
      isAnonymous: false,
      cookieWasCreated: false,
      deviceToken: readDeviceTokenFromRequest(request),
    }
  }

  const deviceToken = readDeviceTokenFromRequest(request)
  if (!deviceToken) {
    return null
  }

  const guest = await getOrCreateGuestUserByDeviceToken(deviceToken, getIpAddress(request))

  return {
    userId: guest.id,
    isAnonymous: true,
    deviceToken,
    cookieWasCreated: false,
  }
}

async function syncUsageForUser(tx: Prisma.TransactionClient, userId: string) {
  const [documentStats] = await Promise.all([
    tx.document.aggregate({
      where: { userId, deletedAt: null },
      _count: { id: true },
      _sum: { fileSize: true },
    }),
    ensureUsageRows(tx, userId),
  ])

  const storageMb = Math.ceil((documentStats._sum.fileSize ?? 0) / (1024 * 1024))

  await tx.usage.update({
    where: { userId_metric: { userId, metric: UsageMetric.DOCUMENTS } },
    data: { value: documentStats._count.id },
  })

  await tx.usage.update({
    where: { userId_metric: { userId, metric: UsageMetric.STORAGE_MB } },
    data: { value: storageMb },
  })
}

export async function mergeAnonymousDeviceIntoUser({
  targetUserId,
  deviceToken,
  ipAddress,
}: {
  targetUserId: string
  deviceToken: string | null
  ipAddress: string
}) {
  if (!deviceToken) {
    return null
  }

  const guest = await prisma.user.findUnique({
    where: { deviceToken },
    select: { id: true, isAnonymous: true },
  })

  if (!guest || !guest.isAnonymous || guest.id === targetUserId) {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { lastKnownIp: ipAddress },
    })
    return null
  }

  const guestDocuments = await prisma.document.count({
    where: { userId: guest.id, deletedAt: null },
  })

  await prisma.$transaction(async (tx) => {
    await ensureUsageRows(tx, targetUserId)

    await tx.document.updateMany({
      where: { userId: guest.id },
      data: { userId: targetUserId },
    })

    await tx.bookmark.updateMany({
      where: { userId: guest.id },
      data: { userId: targetUserId },
    })

    await tx.readingProgress.updateMany({
      where: { userId: guest.id },
      data: { userId: targetUserId },
    })

    await tx.auditLog.updateMany({
      where: { userId: guest.id },
      data: { userId: targetUserId },
    })

    await tx.user.update({
      where: { id: guest.id },
      data: {
        deviceToken: null,
        lastKnownIp: ipAddress,
      },
    })

    await tx.user.update({
      where: { id: targetUserId },
      data: { lastKnownIp: ipAddress },
    })

    await syncUsageForUser(tx, guest.id)
    await syncUsageForUser(tx, targetUserId)
  })

  return { mergedDocumentCount: guestDocuments }
}
