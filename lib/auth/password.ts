import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":")

  if (!salt || !key) {
    return false
  }

  const passwordBuffer = scryptSync(password, salt, 64)
  const storedBuffer = Buffer.from(key, "hex")

  if (passwordBuffer.length !== storedBuffer.length) {
    return false
  }

  return timingSafeEqual(passwordBuffer, storedBuffer)
}
