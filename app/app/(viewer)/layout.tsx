import { requireAppUser } from "@/lib/auth/require"

export const dynamic = "force-dynamic"

export default async function ViewerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAppUser()
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {children}
    </div>
  )
}
