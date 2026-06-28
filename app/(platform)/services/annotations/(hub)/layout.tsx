import { ProtectedShell } from "@/components/common/protected-shell"
import { requireAppUser } from "@/lib/auth/require"
import { ErrorBoundary } from "@/components/error-boundary"

export const dynamic = "force-dynamic"

export default async function DocumentsHubLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAppUser()

  return (
    <ProtectedShell
      name={session.user.name ?? "Reader"}
      email={session.user.email ?? "signed-in user"}
      image={session.user.image ?? null}
      planId={session.user.planId}
      role={session.user.role}
    >
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ProtectedShell>
  )
}
