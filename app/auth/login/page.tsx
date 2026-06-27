import { redirect } from "next/navigation"

import { AuthShell } from "@/components/common/auth-shell"
import { getCurrentUser } from "@/lib/auth/require"
import { SignInFormWrapper } from "./sign-in-form-wrapper"

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <AuthShell
      badge="Login"
      title="Welcome back"
      description="Sign in to your Clustar workspace."
      switchHref="/auth/signup"
      switchLabel="Sign up"
      switchPrompt="Don't have an account?"
      form={<SignInFormWrapper />}
    />
  )
}
