import { ProtectedShell } from "@/components/common/protected-shell"
import { requireAppUser } from "@/lib/auth/require"

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAppUser()

  return (
    <ProtectedShell
      name={session.user.name ?? "Reader"}
      email={session.user.email ?? "signed-in user"}
    >
      {children}
    </ProtectedShell>
  )
}
