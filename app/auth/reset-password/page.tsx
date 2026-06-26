import { AuthShell } from "@/components/common/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <AuthShell
        badge="Reset password"
        title="Invalid link"
        description="This reset link is missing a token."
        switchHref="/auth/forgot-password"
        switchLabel="Request a new link"
        switchPrompt="Need help?"
        form={
          <p className="px-8 py-8 text-center text-sm text-muted-foreground">
            Please use the link from your email, or request a new one.
          </p>
        }
      />
    )
  }

  return (
    <AuthShell
      badge="Reset password"
      title="Choose a new password"
      description="Enter a new password for your WorkHub account."
      switchHref="/auth/login"
      switchLabel="Back to login"
      switchPrompt="Remember your password?"
      form={<ResetPasswordForm token={token} />}
    />
  )
}
