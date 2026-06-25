import { redirect } from "next/navigation"

import { AuthShell } from "@/components/common/auth-shell"
import { getCurrentUser } from "@/lib/auth/require"
import { SignUpFormWrapper } from "./sign-up-form-wrapper"

export default async function SignupPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <AuthShell
      badge="Create account"
      title="Get started"
      description="Create an account to access all your productivity services."
      form={<SignUpFormWrapper />}
    />
  )
}
