import { AuthShell } from "@/components/common/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      badge="Reset password"
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link."
      switchHref="/auth/login"
      switchLabel="Back to login"
      switchPrompt="Remembered it?"
      form={<ForgotPasswordForm />}
    />
  )
}
