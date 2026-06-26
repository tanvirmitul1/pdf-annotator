import { AuthShell } from "@/components/common/auth-shell"
import { VerifyEmailPrompt } from "@/components/auth/verify-email-prompt"

export default function VerifyEmailPage() {
  return (
    <AuthShell
      badge="Verify email"
      title="Check your inbox"
      description="We sent a verification link to your email address. Click it to activate your account."
      switchHref="/dashboard"
      switchLabel="Go to dashboard"
      switchPrompt="Already verified?"
      form={<VerifyEmailPrompt />}
    />
  )
}
