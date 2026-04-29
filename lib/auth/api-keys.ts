import { randomBytes, createHash } from "crypto"

import { prisma } from "@/lib/db/prisma"
import { UnauthenticatedError } from "@/lib/errors"

const KEY_BYTE_LENGTH = 32 // 256-bit entropy
const PREFIX_LENGTH = 8

/**
 * Generate a new API key.
 * Returns the raw key (show once to the user), its SHA-256 hash (store in DB),
 * and a prefix (first 8 chars, for UI identification).
 */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = randomBytes(KEY_BYTE_LENGTH).toString("hex")
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, PREFIX_LENGTH),
  }
}

/** Deterministic SHA-256 hash used to look up a key without storing the raw value. */
export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex")
}

/**
 * Verify a raw API key against the database.
 * Returns the userId if the key is valid; throws UnauthenticatedError otherwise.
 * Updates `lastUsedAt` as a side-effect.
 */
export async function verifyApiKey(raw: string): Promise<string> {
  const tokenHash = hashApiKey(raw)

  const key = await prisma.apiKey.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      expiresAt: true,
      user: { select: { deletedAt: true } },
    },
  })

  if (!key) {
    throw new UnauthenticatedError()
  }

  if (key.revokedAt) {
    throw new UnauthenticatedError()
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    throw new UnauthenticatedError()
  }

  if (key.user.deletedAt) {
    throw new UnauthenticatedError()
  }

  // Fire-and-forget: update lastUsedAt without blocking the response
  void prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  })

  return key.userId
}

/** Extract a Bearer token from the Authorization header, or return null. */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }
  return authHeader.slice(7)
}
