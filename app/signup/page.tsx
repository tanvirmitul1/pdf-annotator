import { redirect } from "next/navigation"

import { AuthShell } from "@/components/common/auth-shell"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { getCurrentUser } from "@/lib/auth/require"

export default async function SignupPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/app")
  }

  return (
    <AuthShell
      badge="Create account"
      title="Save your work"
      description="Create an account to keep your annotations, bookmarks, and reading progress."
      mode="signup"
      form={<SignUpForm />}
    />
  )
}
