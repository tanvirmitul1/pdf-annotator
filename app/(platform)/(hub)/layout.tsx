import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/require"
import { HubLayoutClient } from "@/components/platform/hub-layout-client"

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <HubLayoutClient
      userName={user.name}
      userEmail={user.email}
      userImage={user.image}
      planId={user.planId}
      role={user.role}
    >
      {children}
    </HubLayoutClient>
  )
}
