import { prisma } from "@/lib/db/prisma"
import { EmailVerificationBannerClient } from "./email-verification-banner-client"

export async function EmailVerificationBanner({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, email: true },
  })

  // Don't show banner if already verified or no email (OAuth without email)
  if (!user?.email || user.emailVerified) return null

  return <EmailVerificationBannerClient email={user.email} />
}
