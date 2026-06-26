import Link from "next/link"
import { CheckCircle, XCircle } from "lucide-react"

import { AuthShell } from "@/components/common/auth-shell"

async function verifyToken(token: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(
      `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/verify-email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      }
    )
    const json = (await res.json()) as { data?: { verified?: boolean }; error?: { message?: string } }
    if (json.data?.verified) return { ok: true, message: "Your email has been verified!" }
    return { ok: false, message: json.error?.message ?? "Invalid or expired link." }
  } catch {
    return { ok: false, message: "Something went wrong. Please try again." }
  }
}

export default async function VerifyEmailConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <AuthShell
        badge="Verify email"
        title="Invalid link"
        description="No token found in this link."
        switchHref="/auth/verify-email"
        switchLabel="Request a new link"
        switchPrompt="Need help?"
        form={<Result ok={false} message="This verification link is missing a token." />}
      />
    )
  }

  const result = await verifyToken(token)

  return (
    <AuthShell
      badge="Verify email"
      title={result.ok ? "Email verified!" : "Verification failed"}
      description={result.ok ? "Your account is now fully active." : "This link may have expired."}
      switchHref={result.ok ? "/dashboard" : "/auth/verify-email"}
      switchLabel={result.ok ? "Go to dashboard" : "Request a new link"}
      switchPrompt={result.ok ? "You're all set." : "Need a new link?"}
      form={<Result ok={result.ok} message={result.message} />}
    />
  )
}

function Result({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 px-8 py-10">
      {ok ? (
        <CheckCircle className="size-12 text-green-500" />
      ) : (
        <XCircle className="size-12 text-destructive" />
      )}
      <p className="text-center text-sm text-muted-foreground">{message}</p>
      {ok && (
        <Link
          href="/dashboard"
          className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Go to dashboard
        </Link>
      )}
    </div>
  )
}
