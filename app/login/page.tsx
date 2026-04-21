import { redirect } from "next/navigation"

import { AuthShell } from "@/components/common/auth-shell"
import { SignInForm } from "@/components/auth/sign-in-form"
import { getCurrentUser } from "@/lib/auth/require"

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/app")
  }

  return (
    <AuthShell
      badge="Login"
      title="Welcome back"
      description="Log in to continue your work."
      mode="login"
      form={<SignInForm />}
    />
  )
}
