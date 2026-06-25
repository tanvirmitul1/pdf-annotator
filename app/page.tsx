import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth/require"
import { LandingHero } from "@/components/platform/landing-hero"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/dashboard")
  }

  return <LandingHero />
}
